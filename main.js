import { initStrudel, evaluate } from '@strudel/web';
import { inject } from '@vercel/analytics';
import { tracks, trackKeys, visualThemes, trackCategories } from './tracks.js';

inject();

// =============================================================================
// DOM Elements
// =============================================================================

const elements = {
  loading: document.getElementById('loading'),
  trackSelect: document.getElementById('track-select'),
  playBtn: document.getElementById('play'),
  playIcon: document.getElementById('play-icon'),
  pauseIcon: document.getElementById('pause-icon'),
  prevBtn: document.getElementById('prev'),
  nextBtn: document.getElementById('next'),
  volumeSlider: document.getElementById('volume'),
  bpmDisplay: document.getElementById('bpm'),
  canvas: document.getElementById('visualizer'),
  // Timer
  timerTime: document.getElementById('timer-time'),
  timerMode: document.getElementById('timer-mode'),
  timerStartBtn: document.getElementById('timer-start'),
  timerResetBtn: document.getElementById('timer-reset'),
  timerSkipBtn: document.getElementById('timer-skip'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  // Nature sounds
  soundRows: document.querySelectorAll('.sound-row'),
  // Tasks
  taskInput: document.getElementById('task-input'),
  taskList: document.getElementById('task-list'),
  tasksCount: document.getElementById('tasks-count'),
};

const ctx = elements.canvas.getContext('2d');

// =============================================================================
// State
// =============================================================================

const state = {
  isPlaying: false,
  volume: 0.7,
  strudelReady: false,
  time: 0,
};

const audioState = {
  analyser: null,
  masterGain: null,
  dataArray: null,
  animationId: null,
  idleAnimationId: null,
};

const beatState = {
  prevBass: 0,
  energy: 0,
  decay: 0,
  history: new Array(30).fill(0),
  historyIndex: 0,
  rings: [],
  particles: [],
};

const timerState = {
  interval: null,
  seconds: 25 * 60,
  running: false,
  mode: 'focus',
  focusDuration: 25,
  breakDuration: 5,
};

// Theme state with smooth transitions
const theme = {
  current: { ...visualThemes.focus },
  target: { ...visualThemes.focus },
};

// =============================================================================
// Utilities
// =============================================================================

const lerp = (current, target, speed) => current + (target - current) * speed;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// =============================================================================
// Theme Management
// =============================================================================

function getThemeForTrack(trackName) {
  const category = trackCategories[trackName] || 'focus';
  return visualThemes[category];
}

function updateThemeTransition() {
  const speed = 0.03;
  const { current, target } = theme;

  current.baseHue = lerp(current.baseHue, target.baseHue, speed);
  current.saturation = lerp(current.saturation, target.saturation, speed);
  current.waveCount = Math.round(lerp(current.waveCount, target.waveCount, speed));
  current.particleCount = Math.round(lerp(current.particleCount, target.particleCount, speed));
  current.glowIntensity = lerp(current.glowIntensity, target.glowIntensity, speed);
  current.speed = lerp(current.speed, target.speed, speed);

  for (let i = 0; i < 3; i++) {
    current.bgColor[i] = lerp(current.bgColor[i], target.bgColor[i], speed);
  }
}

// =============================================================================
// Audio Setup
// =============================================================================

function getAudioContext() {
  return globalThis.getAudioContext();
}

function setupMasterGain() {
  const audioCtx = getAudioContext();
  audioState.masterGain = audioCtx.createGain();
  audioState.masterGain.gain.value = state.volume;
  audioState.masterGain.connect(audioCtx.destination);
}

function initVisualizer() {
  const audioCtx = getAudioContext();

  if (!audioState.masterGain) setupMasterGain();

  audioState.analyser = audioCtx.createAnalyser();
  audioState.analyser.fftSize = 256;
  audioState.analyser.smoothingTimeConstant = 0.85;
  audioState.dataArray = new Uint8Array(audioState.analyser.frequencyBinCount);
  audioState.analyser.connect(audioState.masterGain);

  // Monkey-patch AudioNode.connect to route all audio through analyser
  const dest = audioCtx.destination;
  const originalConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(target, ...args) {
    if (target === dest && this !== audioState.analyser && this !== audioState.masterGain) {
      return originalConnect.call(this, audioState.analyser, ...args);
    }
    return originalConnect.call(this, target, ...args);
  };
}

// =============================================================================
// Beat Detection
// =============================================================================

function detectBeat(bass) {
  const { history, historyIndex } = beatState;

  history[beatState.historyIndex] = bass;
  beatState.historyIndex = (historyIndex + 1) % history.length;

  const avgEnergy = history.reduce((a, b) => a + b, 0) / history.length;
  const threshold = Math.max(avgEnergy * 1.4, 60);
  const isBeat = bass > threshold && bass > beatState.prevBass * 1.2 && beatState.decay <= 0;

  beatState.prevBass = bass;

  if (isBeat) {
    beatState.decay = 8;
    beatState.energy = 1.0;
    return true;
  }

  beatState.decay = Math.max(0, beatState.decay - 1);
  beatState.energy *= 0.92;
  return false;
}

function resetBeatState() {
  beatState.prevBass = 0;
  beatState.energy = 0;
  beatState.decay = 0;
  beatState.history.fill(0);
  beatState.historyIndex = 0;
  beatState.rings = [];
  beatState.particles = [];
}

function spawnBeatEffects(width, height, bass, themeHue) {
  // Ring effect
  beatState.rings.push({
    x: width / 2,
    y: height / 2,
    radius: 20,
    maxRadius: 120 + bass,
    alpha: 0.6,
    hue: themeHue + Math.random() * 40 - 20,
  });

  // Burst particles
  const count = 6 + Math.floor(bass / 30);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const speed = 2 + Math.random() * 3;
    beatState.particles.push({
      x: width / 2,
      y: height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      alpha: 0.7,
      hue: themeHue + Math.random() * 60 - 30,
    });
  }
}

// =============================================================================
// Visualizer Drawing
// =============================================================================

function drawBackground(width, height, fadeAlpha = 0.08) {
  const bg = theme.current.bgColor;
  ctx.fillStyle = `rgba(${Math.round(bg[0])}, ${Math.round(bg[1])}, ${Math.round(bg[2])}, ${fadeAlpha})`;
  ctx.fillRect(0, 0, width, height);
}

function drawBeatRings(themeSat) {
  for (let i = beatState.rings.length - 1; i >= 0; i--) {
    const ring = beatState.rings[i];
    const progress = ring.radius / ring.maxRadius;

    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${ring.hue}, ${themeSat + 20}%, 65%, ${ring.alpha * (1 - progress)})`;
    ctx.lineWidth = 3 - progress * 2;
    ctx.stroke();

    ring.radius += 4 + beatState.energy * 2;
    ring.alpha *= 0.96;

    if (ring.radius > ring.maxRadius || ring.alpha < 0.01) {
      beatState.rings.splice(i, 1);
    }
  }
}

function drawBeatParticles(themeSat) {
  for (let i = beatState.particles.length - 1; i >= 0; i--) {
    const p = beatState.particles[i];

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, ${themeSat + 20}%, 70%, ${p.alpha})`;
    ctx.fill();

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.alpha *= 0.94;
    p.size *= 0.97;

    if (p.alpha < 0.01 || p.size < 0.5) {
      beatState.particles.splice(i, 1);
    }
  }
}

function drawWaves(width, height, options = {}) {
  const {
    amplitude: baseAmp = 10,
    beatBoost = 0,
    themeHue,
    themeSat,
    alphaBase = 0.08,
    alphaDecay = 0.015,
    lineWidth = 1.5,
  } = options;

  const waves = theme.current.waveCount;

  for (let w = 0; w < waves; w++) {
    ctx.beginPath();
    const baseY = height * (0.25 + w * (0.5 / waves));
    const amplitude = baseAmp + w * 3 + beatBoost;
    const frequency = 0.006 + w * 0.0015;
    const speed = state.time * (0.4 + w * 0.15);
    const alpha = alphaBase - w * alphaDecay;

    for (let x = 0; x <= width; x += 4) {
      const y = baseY +
        Math.sin(x * frequency + speed) * amplitude +
        Math.sin(x * frequency * 2.3 + speed * 1.3) * (amplitude * 0.4);

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const hue = themeHue + w * 15;
    ctx.strokeStyle = `hsla(${hue}, ${themeSat - 10}%, 55%, ${alpha})`;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawFloatingParticles(width, height, options = {}) {
  const {
    themeHue,
    themeSat,
    dataArray = null,
    threshold = 0,
    beatPulse = 0,
    alphaBase = 0.12,
  } = options;

  const particles = dataArray
    ? theme.current.particleCount
    : Math.floor(theme.current.particleCount * 0.6);

  for (let i = 0; i < particles; i++) {
    let value = 255;
    if (dataArray) {
      const freqIndex = Math.floor((i / particles) * dataArray.length);
      value = dataArray[freqIndex];
      if (value <= threshold) continue;
    }

    const x = (Math.sin(state.time * 0.2 + i * 0.9) * 0.35 + 0.5) * width;
    const y = (Math.cos(state.time * 0.15 + i * 0.7) * 0.25 + 0.5) * height;
    const size = dataArray
      ? 2 + (value / 100) + beatPulse
      : 1.5 + Math.sin(state.time + i) * 0.5;
    const alpha = dataArray
      ? Math.min(0.2 + (value / 500) + beatState.energy * 0.2, 0.6)
      : alphaBase + Math.sin(state.time * 0.5 + i * 0.3) * 0.05;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${themeHue + i * 8}, ${themeSat}%, 65%, ${alpha})`;
    ctx.fill();
  }
}

function drawCentralGlow(width, height, options = {}) {
  const {
    themeHue,
    themeSat,
    bass = 0,
    beatPulse = 0,
  } = options;

  const intensity = theme.current.glowIntensity;
  const glowSize = (bass ? 40 + bass / 4 + beatPulse * 40 : 30 + Math.sin(state.time * 0.3) * 5) * intensity;
  const glowAlpha = bass
    ? (0.1 + bass / 1000 + beatState.energy * 0.15) * intensity
    : (0.06 + Math.sin(state.time * 0.4) * 0.02) * intensity;

  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, glowSize
  );

  const hueShift = beatState.energy * 20;
  gradient.addColorStop(0, `hsla(${themeHue + hueShift}, ${themeSat + beatState.energy * 20}%, 60%, ${glowAlpha})`);
  gradient.addColorStop(bass ? 0.5 : 0.6, `hsla(${themeHue}, ${themeSat}%, ${bass ? 60 : 55}%, ${glowAlpha * (bass ? 0.4 : 0.3)})`);
  gradient.addColorStop(1, `hsla(${themeHue}, ${themeSat}%, ${bass ? 60 : 55}%, 0)`);

  ctx.beginPath();
  ctx.arc(width / 2, height / 2, glowSize, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawSparkles(width, height, high, themeHue, themeSat) {
  if (high <= 50) return;

  const count = Math.floor(high / 40);
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 1 + Math.random() * 2;
    const alpha = 0.1 + high / 500;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${themeHue - 20 + Math.random() * 40}, ${themeSat}%, 80%, ${alpha})`;
    ctx.fill();
  }
}

// Main draw loop (audio-reactive)
function draw() {
  const width = elements.canvas.offsetWidth;
  const height = elements.canvas.offsetHeight;

  updateThemeTransition();
  audioState.analyser.getByteFrequencyData(audioState.dataArray);

  const fadeAlpha = 0.08 + beatState.energy * 0.04;
  drawBackground(width, height, fadeAlpha);

  state.time += 0.008 * theme.current.speed;

  // Frequency analysis
  const data = audioState.dataArray;
  const bass = data.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
  const high = data.slice(40, 80).reduce((a, b) => a + b, 0) / 40;

  const themeHue = theme.current.baseHue;
  const themeSat = theme.current.saturation;

  if (detectBeat(bass)) {
    spawnBeatEffects(width, height, bass, themeHue);
  }

  drawBeatRings(themeSat);
  drawBeatParticles(themeSat);

  drawWaves(width, height, {
    amplitude: 15 + bass / 20,
    beatBoost: beatState.energy * 20,
    themeHue,
    themeSat,
    alphaBase: 0.15,
    alphaDecay: 0.03,
    lineWidth: 2 + beatState.energy,
  });

  drawFloatingParticles(width, height, {
    themeHue,
    themeSat,
    dataArray: data,
    threshold: 30,
    beatPulse: beatState.energy * 3,
  });

  drawCentralGlow(width, height, { themeHue, themeSat, bass, beatPulse: beatState.energy });
  drawSparkles(width, height, high, themeHue, themeSat);

  audioState.animationId = requestAnimationFrame(draw);
}

// Idle draw loop (no audio)
function drawIdle() {
  const width = elements.canvas.offsetWidth;
  const height = elements.canvas.offsetHeight;

  updateThemeTransition();
  state.time += 0.004 * theme.current.speed;

  drawBackground(width, height, 0.06);

  const themeHue = theme.current.baseHue;
  const themeSat = theme.current.saturation;

  drawWaves(width, height, { themeHue, themeSat });
  drawFloatingParticles(width, height, { themeHue, themeSat });
  drawCentralGlow(width, height, { themeHue, themeSat });

  audioState.idleAnimationId = requestAnimationFrame(drawIdle);
}

function startIdleVisualization() {
  if (audioState.idleAnimationId) return;
  drawIdle();
}

function stopIdleVisualization() {
  if (audioState.idleAnimationId) {
    cancelAnimationFrame(audioState.idleAnimationId);
    audioState.idleAnimationId = null;
  }
}

function stopVisualizer() {
  if (audioState.animationId) {
    cancelAnimationFrame(audioState.animationId);
    audioState.animationId = null;
  }
  resetBeatState();
  startIdleVisualization();
}

// =============================================================================
// Canvas Setup
// =============================================================================

function resizeCanvas() {
  const { canvas } = elements;
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

// =============================================================================
// Track Persistence
// =============================================================================

const STORAGE_KEY_TRACK = 'drift-last-track';

function saveLastTrack() {
  localStorage.setItem(STORAGE_KEY_TRACK, elements.trackSelect.value);
}

function loadLastTrack() {
  const saved = localStorage.getItem(STORAGE_KEY_TRACK);
  if (saved && trackKeys.includes(saved)) {
    elements.trackSelect.value = saved;
  }
}

// =============================================================================
// Player Controls
// =============================================================================

function getSelectedTrack() {
  return tracks[elements.trackSelect.value];
}

function updateUI() {
  const track = getSelectedTrack();
  elements.bpmDisplay.textContent = `${track.bpm} BPM`;
}

function setPlaying(playing) {
  state.isPlaying = playing;
  elements.playIcon.style.display = playing ? 'none' : 'block';
  elements.pauseIcon.style.display = playing ? 'block' : 'none';
  elements.playBtn.classList.toggle('playing', playing);
}

function play() {
  if (!state.strudelReady) return;
  if (!audioState.analyser) initVisualizer();

  stopIdleVisualization();

  const newTheme = getThemeForTrack(elements.trackSelect.value);
  theme.target = { ...newTheme, bgColor: [...newTheme.bgColor] };

  const track = getSelectedTrack();
  evaluate(track.pattern);
  setPlaying(true);

  if (!audioState.animationId) draw();
}

function stop() {
  evaluate('hush()');
  setPlaying(false);
  stopVisualizer();
}

function togglePlay() {
  state.isPlaying ? stop() : play();
}

function switchTrack(direction) {
  const currentIndex = trackKeys.indexOf(elements.trackSelect.value);
  const newIndex = (currentIndex + direction + trackKeys.length) % trackKeys.length;
  elements.trackSelect.value = trackKeys[newIndex];
  saveLastTrack();
  updateUI();
  if (state.isPlaying) play();
}

// =============================================================================
// Pomodoro Timer
// =============================================================================

function updateTimerDisplay() {
  elements.timerTime.textContent = formatTime(timerState.seconds);
}

function setTimerMode(mode) {
  timerState.mode = mode;
  elements.timerMode.textContent = mode === 'focus' ? 'Focus' : 'Break';
  elements.timerMode.className = `timer-mode ${mode}`;
  timerState.seconds = (mode === 'focus' ? timerState.focusDuration : timerState.breakDuration) * 60;
  updateTimerDisplay();
}

function playTimerSound() {
  const audioCtx = getAudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 800;
  gain.gain.value = 0.3;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
  osc.stop(audioCtx.currentTime + 0.5);
}

function showTimerNotification() {
  if (Notification.permission !== 'granted') return;

  const message = timerState.mode === 'focus'
    ? 'Focus time! Get back to work.'
    : 'Break time! Take a rest.';

  new Notification('Drift Timer', {
    body: message,
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎵</text></svg>',
  });
}

function onTimerComplete() {
  clearInterval(timerState.interval);
  timerState.running = false;
  playTimerSound();

  setTimerMode(timerState.mode === 'focus' ? 'break' : 'focus');
  elements.timerStartBtn.textContent = 'Start';
  showTimerNotification();
}

function startTimer() {
  if (timerState.running) {
    // Pause
    clearInterval(timerState.interval);
    timerState.running = false;
    elements.timerStartBtn.textContent = 'Resume';
    return;
  }

  // Start
  timerState.running = true;
  elements.timerStartBtn.textContent = 'Pause';

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  if (timerState.mode === 'focus' && !state.isPlaying) {
    play();
  }

  timerState.interval = setInterval(() => {
    timerState.seconds--;
    updateTimerDisplay();
    if (timerState.seconds <= 0) onTimerComplete();
  }, 1000);
}

function resetTimer() {
  clearInterval(timerState.interval);
  timerState.running = false;
  elements.timerStartBtn.textContent = 'Start';
  timerState.seconds = (timerState.mode === 'focus' ? timerState.focusDuration : timerState.breakDuration) * 60;
  updateTimerDisplay();
}

function skipTimer() {
  clearInterval(timerState.interval);
  timerState.running = false;
  elements.timerStartBtn.textContent = 'Start';
  setTimerMode(timerState.mode === 'focus' ? 'break' : 'focus');
}

// =============================================================================
// Nature Sounds
// =============================================================================

const natureSounds = {};
let natureSoundsInitialized = false;

function createNoiseBuffer(audioCtx, duration = 2) {
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createBrownNoiseBuffer(audioCtx, duration = 2) {
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  return buffer;
}

function createFilteredNoise(audioCtx, buffer, filterConfig) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = filterConfig.type;
  filter.frequency.value = filterConfig.frequency;
  if (filterConfig.Q) filter.Q.value = filterConfig.Q;

  const gain = audioCtx.createGain();
  gain.gain.value = 0;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioState.masterGain);
  source.start();

  return { source, filter, gain };
}

function initNatureSounds() {
  if (natureSoundsInitialized) return;

  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  if (!audioState.masterGain) setupMasterGain();

  const noiseBuffer = createNoiseBuffer(audioCtx);
  const brownBuffer = createBrownNoiseBuffer(audioCtx);

  // Rain - filtered white noise
  natureSounds.rain = createFilteredNoise(audioCtx, noiseBuffer, {
    type: 'bandpass',
    frequency: 3000,
    Q: 0.5,
  });

  // Wind - brown noise with LFO modulation
  const wind = createFilteredNoise(audioCtx, brownBuffer, {
    type: 'lowpass',
    frequency: 400,
  });
  const windLFO = audioCtx.createOscillator();
  const windLFOGain = audioCtx.createGain();
  windLFO.frequency.value = 0.2;
  windLFOGain.gain.value = 100;
  windLFO.connect(windLFOGain);
  windLFOGain.connect(wind.filter.frequency);
  windLFO.start();
  natureSounds.wind = { ...wind, lfo: windLFO };

  // Thunder - low rumble
  natureSounds.thunder = createFilteredNoise(audioCtx, brownBuffer, {
    type: 'lowpass',
    frequency: 100,
  });

  // Fire - crackling noise with modulation
  const fireSource = audioCtx.createBufferSource();
  fireSource.buffer = noiseBuffer;
  fireSource.loop = true;

  const fireHP = audioCtx.createBiquadFilter();
  fireHP.type = 'highpass';
  fireHP.frequency.value = 1000;

  const fireLP = audioCtx.createBiquadFilter();
  fireLP.type = 'lowpass';
  fireLP.frequency.value = 4000;

  const fireLFO = audioCtx.createOscillator();
  fireLFO.type = 'square';
  fireLFO.frequency.value = 8;
  const fireLFOGain = audioCtx.createGain();
  fireLFOGain.gain.value = 0.5;
  fireLFO.connect(fireLFOGain);

  const fireModGain = audioCtx.createGain();
  fireModGain.gain.value = 0;
  fireLFOGain.connect(fireModGain.gain);

  const fireGain = audioCtx.createGain();
  fireGain.gain.value = 0;

  fireSource.connect(fireHP);
  fireHP.connect(fireLP);
  fireLP.connect(fireModGain);
  fireModGain.connect(fireGain);
  fireGain.connect(audioState.masterGain);
  fireSource.start();
  fireLFO.start();

  natureSounds.fire = { source: fireSource, gain: fireGain, modGain: fireModGain, lfo: fireLFO };

  natureSoundsInitialized = true;
}

function setNatureSoundVolume(sound, value) {
  initNatureSounds();

  const normalizedValue = value / 100;
  const soundObj = natureSounds[sound];
  if (!soundObj) return;

  const targetGain = normalizedValue * 0.4;
  const audioCtx = getAudioContext();
  soundObj.gain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.1);

  if (sound === 'fire' && soundObj.modGain) {
    soundObj.modGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.1);
  }
}

// =============================================================================
// Tasks
// =============================================================================

const STORAGE_KEY_TASKS = 'drift-tasks';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS) || '[]');

function saveTasks() {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
}

function updateTasksCount() {
  const remaining = tasks.filter(t => !t.done).length;
  if (remaining > 0) {
    elements.tasksCount.textContent = `${remaining} left`;
  } else if (tasks.length > 0) {
    elements.tasksCount.textContent = 'All done!';
  } else {
    elements.tasksCount.textContent = '';
  }
}

function renderTasks() {
  elements.taskList.innerHTML = tasks.map((task, i) => `
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

// =============================================================================
// Event Listeners
// =============================================================================

function setupEventListeners() {
  // Canvas resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Player controls
  elements.playBtn.addEventListener('click', togglePlay);
  elements.prevBtn.addEventListener('click', () => switchTrack(-1));
  elements.nextBtn.addEventListener('click', () => switchTrack(1));

  elements.trackSelect.addEventListener('change', () => {
    saveLastTrack();
    updateUI();
    if (state.isPlaying) play();
  });

  elements.volumeSlider.addEventListener('input', (e) => {
    state.volume = e.target.value / 100;
    if (audioState.masterGain) {
      audioState.masterGain.gain.value = state.volume;
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    const handlers = {
      Space: () => { e.preventDefault(); togglePlay(); },
      ArrowLeft: () => { e.preventDefault(); switchTrack(-1); },
      ArrowRight: () => { e.preventDefault(); switchTrack(1); },
      ArrowUp: () => {
        e.preventDefault();
        elements.volumeSlider.value = Math.min(100, parseInt(elements.volumeSlider.value, 10) + 10);
        elements.volumeSlider.dispatchEvent(new Event('input'));
      },
      ArrowDown: () => {
        e.preventDefault();
        elements.volumeSlider.value = Math.max(0, parseInt(elements.volumeSlider.value, 10) - 10);
        elements.volumeSlider.dispatchEvent(new Event('input'));
      },
    };

    if (handlers[e.code]) handlers[e.code]();
  });

  // Timer
  elements.timerStartBtn.addEventListener('click', startTimer);
  elements.timerResetBtn.addEventListener('click', resetTimer);
  elements.timerSkipBtn.addEventListener('click', skipTimer);

  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      timerState.focusDuration = parseInt(btn.dataset.focus, 10);
      timerState.breakDuration = parseInt(btn.dataset.break, 10);
      resetTimer();
      setTimerMode('focus');
    });
  });

  // Nature sounds
  elements.soundRows.forEach(row => {
    const slider = row.querySelector('.sound-slider');
    const soundType = row.dataset.sound;

    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      setNatureSoundVolume(soundType, value);
      row.classList.toggle('active', value > 0);
    });
  });

  // Tasks
  elements.taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addTask(elements.taskInput.value);
      elements.taskInput.value = '';
    }
  });

  elements.taskList.addEventListener('click', (e) => {
    const item = e.target.closest('.task-item');
    if (!item) return;

    const index = parseInt(item.dataset.index, 10);
    if (e.target.classList.contains('task-delete')) {
      deleteTask(index);
    } else {
      toggleTask(index);
    }
  });
}

// =============================================================================
// Initialization
// =============================================================================

async function init() {
  try {
    await initStrudel();
    state.strudelReady = true;
    elements.loading.classList.add('hidden');
  } catch (err) {
    console.error('Failed to initialize Strudel:', err);
    elements.loading.querySelector('.loading-text').textContent = 'Failed to load audio engine. Please refresh.';
    elements.loading.querySelector('.spinner').style.display = 'none';
    elements.playBtn.disabled = true;
    elements.playBtn.style.opacity = '0.5';
    elements.playBtn.style.cursor = 'not-allowed';
    return;
  }

  loadLastTrack();
  updateUI();
  setupEventListeners();
  renderTasks();
  startIdleVisualization();
}

init();
