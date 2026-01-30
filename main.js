import { initStrudel, evaluate } from '@strudel/web';

await initStrudel();
await globalThis.samples('github:tidalcycles/dirt-samples');

// Visualizer setup
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let analyser, dataArray, animationId;

function initVisualizer() {
  const audioCtx = globalThis.getAudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.8;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  // Connect analyser to destination once
  analyser.connect(audioCtx.destination);

  // Tap into Strudel's audio output
  const dest = audioCtx.destination;
  const originalConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(target, ...args) {
    if (target === dest && this !== analyser) {
      // Route through analyser instead of direct to destination
      return originalConnect.call(this, analyser, ...args);
    }
    return originalConnect.call(this, target, ...args);
  };
}

function resizeCanvas() {
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

let time = 0;

function draw() {
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  const centerX = width / 2;
  const centerY = height / 2;

  analyser.getByteFrequencyData(dataArray);

  // Get bass and treble energy
  const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  const mid = dataArray.slice(10, 100).reduce((a, b) => a + b, 0) / 90;
  const treble = dataArray.slice(100).reduce((a, b) => a + b, 0) / (dataArray.length - 100);

  // Fade effect instead of clear
  ctx.fillStyle = 'rgba(13, 13, 26, 0.15)';
  ctx.fillRect(0, 0, width, height);

  time += 0.02;

  // Psychedelic circles
  const rings = 12;
  for (let i = rings; i > 0; i--) {
    const energy = (bass + mid) / 2;
    const radius = (i / rings) * Math.min(width, height) * 0.45 + (energy * 0.3);
    const hue = (time * 50 + i * 30 + bass) % 360;
    const wobble = Math.sin(time * 2 + i) * 10 * (treble / 255);

    ctx.beginPath();
    ctx.arc(centerX + wobble, centerY + wobble, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.5 + (energy / 510)})`;
    ctx.lineWidth = 3 + (bass / 50);
    ctx.stroke();
  }

  // Radiating lines
  const lines = 24;
  for (let i = 0; i < lines; i++) {
    const angle = (i / lines) * Math.PI * 2 + time;
    const freqIndex = Math.floor((i / lines) * dataArray.length);
    const value = dataArray[freqIndex];
    const length = (value / 255) * Math.min(width, height) * 0.4;
    const hue = (time * 30 + i * 15 + mid) % 360;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * length,
      centerY + Math.sin(angle) * length
    );
    ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
    ctx.lineWidth = 2 + (value / 100);
    ctx.stroke();

    // Particles at the end
    if (value > 100) {
      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(angle) * length,
        centerY + Math.sin(angle) * length,
        value / 30,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `hsla(${(hue + 180) % 360}, 100%, 70%, 0.9)`;
      ctx.fill();
    }
  }

  // Center pulse
  const pulseSize = 20 + (bass / 5);
  const pulseHue = (time * 100) % 360;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${pulseHue}, 100%, 60%, 0.9)`;
  ctx.fill();

  animationId = requestAnimationFrame(draw);
}

function stopVisualizer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
}

// Init
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const pattern = `stack(
  s("bd*4").gain(1.2),
  s("~ cp").delay(0.3),
  s("hh*8").gain(0.5),
  note("g2 g2 g2 [g2 bb2]").s("sawtooth").lpf(sine.range(400,2000).slow(4)).gain(0.8),
  note("[~ g4]*4").s("square").lpf(800).gain(0.4)
).cpm(120)`;

document.getElementById('pattern-display').textContent = pattern;

document.getElementById('play').addEventListener('click', () => {
  if (!analyser) initVisualizer();
  evaluate(pattern);
  if (!animationId) draw();
});

document.getElementById('stop').addEventListener('click', () => {
  evaluate('hush()');
  stopVisualizer();
});
