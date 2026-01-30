import { initStrudel, evaluate } from '@strudel/web';

// Track definitions with BPM
const tracks = {
  daftpunk: { bpm: 120, pattern: `stack(
  s("bd*4").gain(1.2),
  s("~ cp").delay(0.3),
  s("hh*8").gain(0.5),
  note("g2 g2 g2 [g2 bb2]").s("sawtooth").lpf(sine.range(400,2000).slow(4)).gain(0.8),
  note("[~ g4]*4").s("square").lpf(800).gain(0.4)
).cpm(120)` },

  bluemonday: { bpm: 130, pattern: `stack(
  s("bd ~ ~ bd ~ ~ bd ~").gain(1.1),
  s("~ ~ ~ ~ cp ~ ~ ~"),
  s("hh*8").gain(0.4),
  note("d3 d3 f3 d3 a2 a2 c3 d3").s("sawtooth").lpf(1200).gain(0.7),
  note("d4 ~ a4 ~").s("square").lpf(600).gain(0.3)
).cpm(130)` },

  sandstorm: { bpm: 140, pattern: `stack(
  s("bd*4").gain(1.3),
  s("~ cp ~ cp"),
  s("hh*16").gain(0.3),
  note("[b4 b4 b4 b4 e5 e5 d5 d5]*2").s("sawtooth").lpf(3000).gain(0.6),
  note("b2*4").s("square").lpf(400).gain(0.5)
).cpm(140)` },

  technologic: { bpm: 125, pattern: `stack(
  s("bd ~ bd ~, ~ cp ~ cp").gain(1.2),
  s("hh*8").gain(0.4),
  note("[g3 g3 g3 g3 bb3 bb3 g3 g3]").s("square").lpf(1500).gain(0.6),
  note("g2*4").s("sawtooth").lpf(800).gain(0.5)
).cpm(125)` },

  insomnia: { bpm: 135, pattern: `stack(
  s("bd ~ ~ bd ~ ~ bd ~").gain(1.1),
  s("~ ~ cp ~ ~ ~ cp ~"),
  s("hh*8").gain(0.35),
  note("[a3 c4 e4 a4] [g3 b3 d4 g4]").s("triangle").lpf(2000).gain(0.5).delay(0.3),
  note("a2 a2 g2 g2").s("sawtooth").lpf(600).gain(0.6)
).cpm(135)` },

  children: { bpm: 110, pattern: `stack(
  s("bd ~ ~ ~ bd ~ ~ ~").gain(1.0),
  s("hh*4").gain(0.3),
  note("[f4 a4 c5 f5] [e4 g4 b4 e5] [d4 f4 a4 d5] [c4 e4 g4 c5]").s("triangle").release(0.5).gain(0.5).delay(0.4),
  note("f2 ~ e2 ~ d2 ~ c2 ~").s("sine").gain(0.6)
).cpm(110)` },

  kernkraft: { bpm: 140, pattern: `stack(
  s("bd*4").gain(1.3),
  s("~ cp").delay(0.1),
  s("hh*8").gain(0.4),
  note("[e5 e5 ~ e5 ~ e5 e5 ~]*2").s("square").lpf(2500).gain(0.6),
  note("e3*4").s("sawtooth").lpf(1000).gain(0.5)
).cpm(140)` },

  professional: { bpm: 128, pattern: `stack(
  s("bd ~ bd bd ~ bd bd ~").gain(1.2),
  s("~ ~ cp ~ ~ ~ cp ~"),
  s("hh*16").gain(0.3),
  note("e3 e3 g3 e3").s("sawtooth").lpf(sine.range(500,3000).slow(2)).gain(0.7),
  note("[e4 ~ g4 ~]*2").s("square").lpf(1200).gain(0.4)
).cpm(128)` },

  levels: { bpm: 126, pattern: `stack(
  s("bd*4").gain(1.2),
  s("~ cp"),
  s("hh*8").gain(0.4),
  note("[a4 a4 e5 e5 f5 f5 e5 ~]").s("sawtooth").lpf(2500).gain(0.6),
  note("a2 a2 f2 f2").s("sawtooth").lpf(800).gain(0.5)
).cpm(126)` },

  scary: { bpm: 140, pattern: `stack(
  s("bd ~ [bd bd] ~, ~ cp ~ [cp cp]").gain(1.3),
  s("hh*16").gain(0.35),
  note("[g3 ~ g3 ~]*4").s("sawtooth").lpf(sine.range(200,4000).slow(1)).gain(0.7),
  note("g2*8").s("square").lpf(600).distort(0.3).gain(0.5)
).cpm(140)` }
};

const trackKeys = Object.keys(tracks);

// DOM Elements
const loadingEl = document.getElementById('loading');
const trackSelect = document.getElementById('track-select');
const playBtn = document.getElementById('play');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const volumeSlider = document.getElementById('volume');
const trackInfo = document.getElementById('track-info');
const bpmDisplay = document.getElementById('bpm');
const patternDisplay = document.getElementById('pattern-display');
const codeToggle = document.getElementById('code-toggle');
const codeContent = document.getElementById('code-content');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

// State
let isPlaying = false;
let analyser, dataArray, animationId;
let time = 0;
let volume = 0.8;

// Initialize Strudel
await initStrudel();
await globalThis.samples('github:tidalcycles/dirt-samples');
loadingEl.classList.add('hidden');

// Visualizer setup
function initVisualizer() {
  const audioCtx = globalThis.getAudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.8;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.connect(audioCtx.destination);

  const dest = audioCtx.destination;
  const originalConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(target, ...args) {
    if (target === dest && this !== analyser) {
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

function draw() {
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  const centerX = width / 2;
  const centerY = height / 2;

  analyser.getByteFrequencyData(dataArray);

  const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  const mid = dataArray.slice(10, 100).reduce((a, b) => a + b, 0) / 90;
  const treble = dataArray.slice(100).reduce((a, b) => a + b, 0) / (dataArray.length - 100);

  ctx.fillStyle = 'rgba(13, 13, 26, 0.15)';
  ctx.fillRect(0, 0, width, height);

  time += 0.02;

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

  const lines = 24;
  for (let i = 0; i < lines; i++) {
    const angle = (i / lines) * Math.PI * 2 + time;
    const freqIndex = Math.floor((i / lines) * dataArray.length);
    const value = dataArray[freqIndex];
    const length = (value / 255) * Math.min(width, height) * 0.4;
    const hue = (time * 30 + i * 15 + mid) % 360;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * length, centerY + Math.sin(angle) * length);
    ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
    ctx.lineWidth = 2 + (value / 100);
    ctx.stroke();

    if (value > 100) {
      ctx.beginPath();
      ctx.arc(centerX + Math.cos(angle) * length, centerY + Math.sin(angle) * length, value / 30, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${(hue + 180) % 360}, 100%, 70%, 0.9)`;
      ctx.fill();
    }
  }

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
  ctx.fillStyle = 'rgba(13, 13, 26, 1)';
  ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
}

// Helpers
function getSelectedTrack() {
  return tracks[trackSelect.value];
}

function updateUI() {
  const track = getSelectedTrack();
  const selectedOption = trackSelect.options[trackSelect.selectedIndex];
  trackInfo.textContent = selectedOption.text;
  bpmDisplay.textContent = `${track.bpm} BPM`;
  patternDisplay.textContent = track.pattern;
}

function setPlaying(playing) {
  isPlaying = playing;
  playIcon.style.display = playing ? 'none' : 'block';
  pauseIcon.style.display = playing ? 'block' : 'none';
  playBtn.classList.toggle('playing', playing);
}

function play() {
  if (!analyser) initVisualizer();
  const track = getSelectedTrack();
  evaluate(`${track.pattern}.gain(${volume})`);
  setPlaying(true);
  if (!animationId) draw();
}

function stop() {
  evaluate('hush()');
  setPlaying(false);
  stopVisualizer();
}

function togglePlay() {
  if (isPlaying) {
    stop();
  } else {
    play();
  }
}

function switchTrack(direction) {
  const currentIndex = trackKeys.indexOf(trackSelect.value);
  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = trackKeys.length - 1;
  if (newIndex >= trackKeys.length) newIndex = 0;
  trackSelect.value = trackKeys[newIndex];
  updateUI();
  if (isPlaying) play();
}

// Event Listeners
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

updateUI();

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => switchTrack(-1));
nextBtn.addEventListener('click', () => switchTrack(1));

trackSelect.addEventListener('change', () => {
  updateUI();
  if (isPlaying) play();
});

volumeSlider.addEventListener('input', (e) => {
  volume = e.target.value / 100;
  if (isPlaying) play();
});

codeToggle.addEventListener('click', () => {
  codeToggle.classList.toggle('open');
  codeContent.classList.toggle('open');
  codeToggle.querySelector('svg').nextSibling.textContent =
    codeContent.classList.contains('open') ? ' Hide pattern code' : ' Show pattern code';
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      switchTrack(-1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      switchTrack(1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 10);
      volumeSlider.dispatchEvent(new Event('input'));
      break;
    case 'ArrowDown':
      e.preventDefault();
      volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 10);
      volumeSlider.dispatchEvent(new Event('input'));
      break;
  }
});
