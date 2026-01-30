import { initStrudel, evaluate } from '@strudel/web';

// Calm, relaxing track definitions
const tracks = {
  // Focus
  deepfocus: { bpm: 70, pattern: `stack(
  note("[e3 ~]*2").s("sine").lpf(400).gain(0.4).delay(0.4),
  note("[~ b3] [~ e4]").s("triangle").lpf(800).gain(0.3).delay(0.5),
  note("<e2 b2 g2 d2>").s("sine").lpf(200).gain(0.5).slow(2)
).cpm(70)` },

  flow: { bpm: 80, pattern: `stack(
  note("<a3 e4 b3 f4>").s("sine").lpf(600).gain(0.35).delay(0.4),
  note("[a4 c5 e5]/4").s("triangle").lpf(900).gain(0.2).delay(0.5),
  note("<a2 e2 b2 f2>").s("sine").lpf(180).gain(0.45).slow(2)
).cpm(80)` },

  minimal: { bpm: 75, pattern: `stack(
  note("[c4 ~ e4 ~]/2").s("sine").lpf(500).gain(0.3).delay(0.4),
  note("<c3 g2>").s("sine").lpf(200).gain(0.4).slow(4),
  s("hh:2*2").gain(0.1).lpf(3000).delay(0.3)
).cpm(75)` },

  study: { bpm: 72, pattern: `stack(
  note("[d4 f4] [a4 c5]").s("triangle").lpf(700).gain(0.25).delay(0.4).slow(2),
  note("<d3 a2 g2 c3>").s("sine").lpf(250).gain(0.4).slow(2),
  note("[~ f3]*4").s("sine").lpf(400).gain(0.2).delay(0.6)
).cpm(72)` },

  // Chill
  lofi: { bpm: 85, pattern: `stack(
  s("bd ~ ~ bd:1 ~ ~ bd ~").gain(0.6),
  s("~ hh ~ hh:1").gain(0.25).delay(0.2),
  note("[c4 e4 g4 b4]/2").s("triangle").lpf(600).gain(0.3).delay(0.4),
  note("<c3 g2 a2 f2>").s("sine").lpf(300).gain(0.4).slow(2)
).cpm(85)` },

  coffee: { bpm: 90, pattern: `stack(
  s("bd ~ bd:1 ~").gain(0.5),
  s("~ hh:1*2").gain(0.2),
  note("[g3 b3 d4 g4]/2").s("triangle").lpf(700).gain(0.3).delay(0.3),
  note("<g2 d3 e3 c3>").s("sine").lpf(350).gain(0.4)
).cpm(90)` },

  jazz: { bpm: 68, pattern: `stack(
  s("bd ~ ~ bd:1").gain(0.4).slow(2),
  s("~ hh:1 ~ hh").gain(0.15),
  note("<c4 e4 g4 bb4> <f4 a4 c5 eb5>").s("triangle").lpf(800).gain(0.25).delay(0.4).slow(2),
  note("<c3 f2 bb2 eb3>").s("sine").lpf(300).gain(0.4).slow(2)
).cpm(68)` },

  vinyl: { bpm: 75, pattern: `stack(
  s("hh*8").gain(0.04).lpf(1500),
  note("[e4 g4 b4]/4").s("triangle").lpf(500).gain(0.25).delay(0.5),
  note("<e3 b2 c3 g2>").s("sine").lpf(280).gain(0.4).slow(4)
).cpm(75)` },

  // Nature
  rain: { bpm: 72, pattern: `stack(
  s("hh*16").gain(0.08).delay(0.3),
  note("[d4 f4 a4 c5]/4").s("triangle").lpf(500).gain(0.25).delay(0.5).room(0.4),
  note("<d3 a2 f2 c3>").s("sine").lpf(250).gain(0.4).slow(4)
).cpm(72)` },

  ocean: { bpm: 55, pattern: `stack(
  note("<c3 g3 e3 b2>").s("sine").lpf(sine.range(150,400).slow(16)).gain(0.4).slow(2),
  note("[e4 g4 b4]/8").s("triangle").lpf(600).gain(0.2).delay(0.6).room(0.6),
  s("hh:2*4").gain(0.05).lpf(2000).delay(0.4).slow(2)
).cpm(55)` },

  forest: { bpm: 65, pattern: `stack(
  note("<a3 e3 f3 c3>").s("sine").lpf(350).gain(0.35).slow(2),
  note("[e4 ~ a4 ~] [~ f4 ~ c5]").s("triangle").lpf(800).gain(0.2).delay(0.5),
  note("[a2 e3]/4").s("sine").lpf(200).gain(0.4).slow(4)
).cpm(65)` },

  thunder: { bpm: 50, pattern: `stack(
  s("hh*8").gain(0.06).lpf(1200).delay(0.4),
  note("<d2 a1 e2 b1>").s("sine").lpf(sine.range(80,200).slow(8)).gain(0.5).slow(4),
  note("[d4 f4]/8").s("triangle").lpf(400).gain(0.15).delay(0.7).room(0.6)
).cpm(50)` },

  // Ambient
  ambient: { bpm: 60, pattern: `stack(
  note("<c4 e4 g4 b4>").s("sine").lpf(sine.range(300,800).slow(8)).gain(0.3).delay(0.6).room(0.5),
  note("<c3 g3>").s("sine").lpf(200).gain(0.35).slow(4),
  note("[~ e5]*2").s("triangle").lpf(1200).gain(0.15).delay(0.7).slow(2)
).cpm(60)` },

  drone: { bpm: 40, pattern: `stack(
  note("c2").s("sine").lpf(sine.range(100,300).slow(16)).gain(0.5).slow(8),
  note("<c3 g3>").s("sine").lpf(200).gain(0.3).slow(8),
  note("[e4 g4]/16").s("triangle").lpf(500).gain(0.1).delay(0.8).room(0.7)
).cpm(40)` },

  ethereal: { bpm: 55, pattern: `stack(
  note("<e4 b4 g4 d5>").s("sine").lpf(sine.range(400,1200).slow(12)).gain(0.25).delay(0.7).room(0.6),
  note("<e3 b2 g3 d3>").s("triangle").lpf(350).gain(0.3).slow(4),
  note("[b5 e5]/8").s("sine").lpf(800).gain(0.1).delay(0.8)
).cpm(55)` },

  cosmos: { bpm: 45, pattern: `stack(
  note("<f3 c4 ab3 eb4>").s("sine").lpf(sine.range(200,600).slow(16)).gain(0.3).delay(0.6).room(0.7).slow(2),
  note("f2").s("sine").lpf(150).gain(0.4).slow(8),
  note("[c5 f5 ab5]/12").s("triangle").lpf(700).gain(0.12).delay(0.75)
).cpm(45)` },

  // Wellness
  meditation: { bpm: 50, pattern: `stack(
  note("<f3 c4 g3 d4>").s("sine").lpf(sine.range(200,500).slow(12)).gain(0.35).slow(4).room(0.5),
  note("[f4 a4 c5]/8").s("triangle").lpf(400).gain(0.15).delay(0.7),
  note("f2").s("sine").lpf(150).gain(0.4).slow(8)
).cpm(50)` },

  breathing: { bpm: 48, pattern: `stack(
  note("<c4 g4>").s("sine").lpf(sine.range(300,600).slow(8)).gain(sine.range(0.2,0.4).slow(4)).slow(4),
  note("c3").s("sine").lpf(180).gain(0.35).slow(8),
  note("[e5]/16").s("triangle").lpf(500).gain(0.1).delay(0.8)
).cpm(48)` },

  sleep: { bpm: 40, pattern: `stack(
  note("<ab3 eb4 bb3 f4>").s("sine").lpf(sine.range(150,350).slow(20)).gain(0.25).slow(4).room(0.6),
  note("ab2").s("sine").lpf(120).gain(0.35).slow(8),
  note("[eb5 ab5]/16").s("sine").lpf(400).gain(0.08).delay(0.8)
).cpm(40)` },

  healing: { bpm: 52, pattern: `stack(
  note("<a3 e4 c4 g4>").s("sine").lpf(432).gain(0.3).slow(4).delay(0.5),
  note("a2").s("sine").lpf(150).gain(0.4).slow(8),
  note("[e4 a4 c5]/8").s("triangle").lpf(500).gain(0.15).delay(0.7).room(0.5)
).cpm(52)` },

  // Moody
  night: { bpm: 65, pattern: `stack(
  note("<eb3 bb3 f3 c4>").s("sine").lpf(sine.range(200,600).slow(8)).gain(0.35).slow(2).delay(0.5),
  note("[eb4 g4 bb4]/4").s("triangle").lpf(500).gain(0.2).delay(0.6).room(0.4),
  note("eb2").s("sine").lpf(180).gain(0.4).slow(4)
).cpm(65)` },

  melancholy: { bpm: 58, pattern: `stack(
  note("<d4 a4 f4 c5>").s("sine").lpf(sine.range(300,700).slow(8)).gain(0.3).delay(0.6),
  note("<d3 a2 f2 c3>").s("sine").lpf(220).gain(0.4).slow(2),
  note("[a4 d5]/6").s("triangle").lpf(600).gain(0.15).delay(0.7).room(0.5)
).cpm(58)` },

  noir: { bpm: 55, pattern: `stack(
  note("<c3 g3 eb3 bb2>").s("sine").lpf(sine.range(180,450).slow(8)).gain(0.4).slow(2),
  note("[eb4 g4]/4").s("triangle").lpf(500).gain(0.2).delay(0.5),
  note("c2").s("sine").lpf(140).gain(0.45).slow(8)
).cpm(55)` },

  mystery: { bpm: 60, pattern: `stack(
  note("<b3 f4 d4 ab4>").s("sine").lpf(sine.range(250,650).slow(10)).gain(0.3).delay(0.6).slow(2),
  note("<b2 f2 d3 ab2>").s("sine").lpf(200).gain(0.4).slow(4),
  note("[f4 b4 d5]/8").s("triangle").lpf(550).gain(0.15).delay(0.7).room(0.4)
).cpm(60)` }
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
const bpmDisplay = document.getElementById('bpm');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

// State
let isPlaying = false;
let analyser, dataArray, animationId;
let time = 0;
let volume = 0.7;
let masterGain = null;
let strudelReady = false;

// Initialize Strudel
try {
  await initStrudel();
  strudelReady = true;
  loadingEl.classList.add('hidden');
} catch (err) {
  console.error('Failed to initialize Strudel:', err);
  loadingEl.querySelector('.loading-text').textContent = 'Failed to load audio engine. Please refresh.';
  loadingEl.querySelector('.spinner').style.display = 'none';
  playBtn.disabled = true;
  playBtn.style.opacity = '0.5';
  playBtn.style.cursor = 'not-allowed';
}

// Setup master volume control
function setupMasterGain() {
  const audioCtx = globalThis.getAudioContext();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(audioCtx.destination);
}

// Visualizer setup
function initVisualizer() {
  const audioCtx = globalThis.getAudioContext();

  if (!masterGain) setupMasterGain();

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.85;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.connect(masterGain);

  const dest = audioCtx.destination;
  const originalConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(target, ...args) {
    if (target === dest && this !== analyser && this !== masterGain) {
      return originalConnect.call(this, analyser, ...args);
    }
    return originalConnect.call(this, target, ...args);
  };
}

function resizeCanvas() {
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

// Calm, flowing visualizer
function draw() {
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  analyser.getByteFrequencyData(dataArray);

  // Soft fade
  ctx.fillStyle = 'rgba(26, 28, 46, 0.08)';
  ctx.fillRect(0, 0, width, height);

  time += 0.008;

  // Get average levels
  const bass = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
  const mid = dataArray.slice(8, 40).reduce((a, b) => a + b, 0) / 32;

  // Soft flowing waves
  const waves = 4;
  for (let w = 0; w < waves; w++) {
    ctx.beginPath();
    const baseY = height * (0.3 + w * 0.15);
    const amplitude = 15 + (bass / 20) + w * 5;
    const frequency = 0.008 + w * 0.002;
    const speed = time * (0.5 + w * 0.2);
    const alpha = 0.15 - w * 0.03;

    for (let x = 0; x <= width; x += 3) {
      const y = baseY +
        Math.sin(x * frequency + speed) * amplitude +
        Math.sin(x * frequency * 2 + speed * 1.5) * (amplitude * 0.5);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const hue = 210 + w * 20;
    ctx.strokeStyle = `hsla(${hue}, 30%, 60%, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Floating particles
  const particles = 12;
  for (let i = 0; i < particles; i++) {
    const freqIndex = Math.floor((i / particles) * dataArray.length);
    const value = dataArray[freqIndex];

    if (value > 30) {
      const x = (Math.sin(time * 0.3 + i * 0.8) * 0.4 + 0.5) * width;
      const y = (Math.cos(time * 0.2 + i * 0.6) * 0.3 + 0.5) * height;
      const size = 2 + (value / 100);
      const alpha = 0.2 + (value / 500);

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${220 + i * 10}, 40%, 70%, ${alpha})`;
      ctx.fill();
    }
  }

  // Central glow based on bass
  const glowSize = 40 + (bass / 4);
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, glowSize
  );
  gradient.addColorStop(0, `hsla(220, 40%, 60%, ${0.1 + bass / 1000})`);
  gradient.addColorStop(1, 'hsla(220, 40%, 60%, 0)');

  ctx.beginPath();
  ctx.arc(width / 2, height / 2, glowSize, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  animationId = requestAnimationFrame(draw);
}

function stopVisualizer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  // Fade out
  const fadeOut = () => {
    ctx.fillStyle = 'rgba(26, 28, 46, 0.1)';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  };
  for (let i = 0; i < 20; i++) {
    setTimeout(fadeOut, i * 50);
  }
}

// Helpers
function getSelectedTrack() {
  return tracks[trackSelect.value];
}

function updateUI() {
  const track = getSelectedTrack();
  bpmDisplay.textContent = `${track.bpm} BPM`;
}

function setPlaying(playing) {
  isPlaying = playing;
  playIcon.style.display = playing ? 'none' : 'block';
  pauseIcon.style.display = playing ? 'block' : 'none';
  playBtn.classList.toggle('playing', playing);
}

function play() {
  if (!strudelReady) return;
  if (!analyser) initVisualizer();
  const track = getSelectedTrack();
  evaluate(track.pattern);
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
  if (masterGain) {
    masterGain.gain.value = volume;
  }
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

// Pomodoro Timer
const timerTimeEl = document.getElementById('timer-time');
const timerModeEl = document.getElementById('timer-mode');
const timerStartBtn = document.getElementById('timer-start');
const timerResetBtn = document.getElementById('timer-reset');
const timerSkipBtn = document.getElementById('timer-skip');
const presetBtns = document.querySelectorAll('.preset-btn');

let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;
let timerMode = 'focus'; // 'focus' or 'break'
let focusDuration = 25;
let breakDuration = 5;
let sessionsCompleted = 0;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  timerTimeEl.textContent = formatTime(timerSeconds);
}

function setTimerMode(mode) {
  timerMode = mode;
  timerModeEl.textContent = mode === 'focus' ? 'Focus' : 'Break';
  timerModeEl.className = `timer-mode ${mode}`;
  timerSeconds = (mode === 'focus' ? focusDuration : breakDuration) * 60;
  updateTimerDisplay();
}

function startTimer() {
  if (timerRunning) {
    // Pause
    clearInterval(timerInterval);
    timerRunning = false;
    timerStartBtn.textContent = 'Resume';
  } else {
    // Start
    timerRunning = true;
    timerStartBtn.textContent = 'Pause';

    // Request notification permission on first timer start
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Auto-play music when starting focus timer
    if (timerMode === 'focus' && !isPlaying) {
      play();
    }

    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerDisplay();

      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;

        // Play notification sound
        const audioCtx = globalThis.getAudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.stop(audioCtx.currentTime + 0.5);

        // Switch mode
        if (timerMode === 'focus') {
          sessionsCompleted++;
          setTimerMode('break');
        } else {
          setTimerMode('focus');
        }

        timerStartBtn.textContent = 'Start';

        // Show notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('Drift Timer', {
            body: timerMode === 'focus' ? 'Focus time! Get back to work.' : 'Break time! Take a rest.',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎵</text></svg>'
          });
        }
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerStartBtn.textContent = 'Start';
  timerSeconds = (timerMode === 'focus' ? focusDuration : breakDuration) * 60;
  updateTimerDisplay();
}

function skipTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerStartBtn.textContent = 'Start';

  if (timerMode === 'focus') {
    setTimerMode('break');
  } else {
    setTimerMode('focus');
  }
}

// Timer event listeners
timerStartBtn.addEventListener('click', startTimer);
timerResetBtn.addEventListener('click', resetTimer);
timerSkipBtn.addEventListener('click', skipTimer);

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    focusDuration = parseInt(btn.dataset.focus);
    breakDuration = parseInt(btn.dataset.break);

    resetTimer();
    setTimerMode('focus');
  });
});

// Nature Sounds Mixer
const soundRows = document.querySelectorAll('.sound-row');

let audioCtxInitialized = false;
const natureSounds = {};

// White noise buffer generator
function createNoiseBuffer(audioCtx, duration = 2) {
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Brown noise buffer (low frequency noise)
function createBrownNoiseBuffer(audioCtx, duration = 2) {
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // Normalize
  }
  return buffer;
}

function initNatureSounds() {
  if (audioCtxInitialized) return;

  const audioCtx = globalThis.getAudioContext();
  if (!audioCtx) return;

  if (!masterGain) setupMasterGain();

  const noiseBuffer = createNoiseBuffer(audioCtx);
  const brownBuffer = createBrownNoiseBuffer(audioCtx);

  // Rain - filtered white noise with gentle modulation
  const rainSource = audioCtx.createBufferSource();
  rainSource.buffer = noiseBuffer;
  rainSource.loop = true;
  const rainFilter = audioCtx.createBiquadFilter();
  rainFilter.type = 'bandpass';
  rainFilter.frequency.value = 3000;
  rainFilter.Q.value = 0.5;
  const rainGain = audioCtx.createGain();
  rainGain.gain.value = 0;
  rainSource.connect(rainFilter);
  rainFilter.connect(rainGain);
  rainGain.connect(masterGain);
  rainSource.start();
  natureSounds.rain = { gain: rainGain, source: rainSource };

  // Wind - brown noise with slow modulation
  const windSource = audioCtx.createBufferSource();
  windSource.buffer = brownBuffer;
  windSource.loop = true;
  const windFilter = audioCtx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 400;
  const windGain = audioCtx.createGain();
  windGain.gain.value = 0;
  // Add subtle modulation
  const windLFO = audioCtx.createOscillator();
  const windLFOGain = audioCtx.createGain();
  windLFO.frequency.value = 0.2;
  windLFOGain.gain.value = 100;
  windLFO.connect(windLFOGain);
  windLFOGain.connect(windFilter.frequency);
  windLFO.start();
  windSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(masterGain);
  windSource.start();
  natureSounds.wind = { gain: windGain, source: windSource, lfo: windLFO };

  // Thunder - low rumble
  const thunderSource = audioCtx.createBufferSource();
  thunderSource.buffer = brownBuffer;
  thunderSource.loop = true;
  const thunderFilter = audioCtx.createBiquadFilter();
  thunderFilter.type = 'lowpass';
  thunderFilter.frequency.value = 100;
  const thunderGain = audioCtx.createGain();
  thunderGain.gain.value = 0;
  thunderSource.connect(thunderFilter);
  thunderFilter.connect(thunderGain);
  thunderGain.connect(masterGain);
  thunderSource.start();
  natureSounds.thunder = { gain: thunderGain, source: thunderSource };

  // Fire - crackling noise
  const fireSource = audioCtx.createBufferSource();
  fireSource.buffer = noiseBuffer;
  fireSource.loop = true;
  const fireFilter = audioCtx.createBiquadFilter();
  fireFilter.type = 'highpass';
  fireFilter.frequency.value = 1000;
  const fireFilter2 = audioCtx.createBiquadFilter();
  fireFilter2.type = 'lowpass';
  fireFilter2.frequency.value = 4000;
  const fireGain = audioCtx.createGain();
  fireGain.gain.value = 0;
  // Crackling modulation
  const fireLFO = audioCtx.createOscillator();
  fireLFO.type = 'square';
  fireLFO.frequency.value = 8;
  const fireLFOGain = audioCtx.createGain();
  fireLFOGain.gain.value = 0.5;
  fireLFO.connect(fireLFOGain);
  const fireModGain = audioCtx.createGain();
  fireModGain.gain.value = 0;
  fireLFOGain.connect(fireModGain.gain);
  fireSource.connect(fireFilter);
  fireFilter.connect(fireFilter2);
  fireFilter2.connect(fireModGain);
  fireModGain.connect(fireGain);
  fireGain.connect(masterGain);
  fireSource.start();
  fireLFO.start();
  natureSounds.fire = { gain: fireGain, modGain: fireModGain, source: fireSource, lfo: fireLFO };

  audioCtxInitialized = true;
}

function setNatureSoundVolume(sound, value) {
  initNatureSounds();

  const normalizedValue = value / 100;
  const soundObj = natureSounds[sound];

  if (soundObj) {
    const targetGain = normalizedValue * 0.4; // Max volume cap
    soundObj.gain.gain.setTargetAtTime(targetGain, globalThis.getAudioContext().currentTime, 0.1);

    // Special handling for fire crackling intensity
    if (sound === 'fire' && soundObj.modGain) {
      soundObj.modGain.gain.setTargetAtTime(targetGain, globalThis.getAudioContext().currentTime, 0.1);
    }
  }
}

// Sound slider handlers
soundRows.forEach(row => {
  const slider = row.querySelector('.sound-slider');
  const soundType = row.dataset.sound;

  slider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    setNatureSoundVolume(soundType, value);

    if (value > 0) {
      row.classList.add('active');
    } else {
      row.classList.remove('active');
    }
  });
});

// Quick Tasks
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const tasksCount = document.getElementById('tasks-count');

let tasks = JSON.parse(localStorage.getItem('drift-tasks') || '[]');

function saveTasks() {
  localStorage.setItem('drift-tasks', JSON.stringify(tasks));
}

function updateTasksCount() {
  const remaining = tasks.filter(t => !t.done).length;
  tasksCount.textContent = remaining > 0 ? `${remaining} left` : '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderTasks() {
  taskList.innerHTML = tasks.map((task, i) => `
    <li class="task-item ${task.done ? 'done' : ''}" data-index="${i}">
      <span class="task-check"></span>
      <span class="task-text">${escapeHtml(task.text)}</span>
      <span class="task-delete">×</span>
    </li>
  `).join('');
  updateTasksCount();
}

function addTask(text) {
  if (!text.trim()) return;
  tasks.unshift({ text: text.trim(), done: false });
  saveTasks();
  renderTasks();
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addTask(taskInput.value);
    taskInput.value = '';
  }
});

taskList.addEventListener('click', (e) => {
  const item = e.target.closest('.task-item');
  if (!item) return;
  const index = parseInt(item.dataset.index);

  if (e.target.classList.contains('task-delete')) {
    deleteTask(index);
  } else {
    toggleTask(index);
  }
});

renderTasks();

