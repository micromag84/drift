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
  // Mode tabs
  modeTabs: document.querySelectorAll('.mode-tab'),
  focusContent: document.getElementById('focus-content'),
  calmContent: document.getElementById('calm-content'),
  // Timer
  timerTime: document.getElementById('timer-time'),
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
  // Breathing
  breathingCircle: document.getElementById('breathing-circle'),
  breathingPhase: document.getElementById('breathing-phase'),
  breathingTimer: document.getElementById('breathing-timer'),
  breathingRounds: document.getElementById('breathing-rounds'),
  breathingStartBtn: document.getElementById('breathing-start'),
  breathingStopBtn: document.getElementById('breathing-stop'),
  breathingPresetBtns: document.querySelectorAll('.breathing-preset-btn'),
  breathingRoundsBtns: document.querySelectorAll('.breathing-rounds-btn'),
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

// Breathing patterns: arrays of { phase, duration } objects
const breathingPatterns = {
  box: [
    { phase: 'inhale', duration: 4 },
    { phase: 'hold', duration: 4 },
    { phase: 'exhale', duration: 4 },
    { phase: 'hold', duration: 4 },
  ],
  '478': [
    { phase: 'inhale', duration: 4 },
    { phase: 'hold', duration: 7 },
    { phase: 'exhale', duration: 8 },
  ],
  relaxing: [
    { phase: 'inhale', duration: 4 },
    { phase: 'exhale', duration: 6 },
  ],
};

const breathingState = {
  running: false,
  countdown: false,
  countdownInterval: null,
  pattern: 'box',
  phaseIndex: 0,
  secondsLeft: 0,
  interval: null,
  rounds: 0,
  targetRounds: 4,
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
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// iOS mute switch workaround: ensure audio plays even when the hardware
// mute switch is on by switching from "Ambient" to "Playback" audio session.
function unmuteIOS() {
  // Modern Audio Session API (Safari 17+ / iOS 17+)
  if (navigator.audioSession) {
    navigator.audioSession.type = 'playback';
  }

  // Fallback: play a silent <audio> element to force the Playback session.
  // Detect iOS including iPadOS (which reports as "Macintosh").
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  if (!isIOS) return;

  let unmuted = false;
  const events = ['click', 'touchend', 'keydown'];

  function handleInteraction() {
    if (unmuted) return;
    unmuted = true;

    const sampleRate = new AudioContext().sampleRate;
    const ab = new ArrayBuffer(10);
    const dv = new DataView(ab);
    dv.setUint32(0, sampleRate, true);
    dv.setUint32(4, sampleRate, true);
    dv.setUint16(8, 1, true);
    const chars = btoa(String.fromCharCode(...new Uint8Array(ab))).slice(0, 13);

    const audio = document.createElement('audio');
    audio.setAttribute('x-webkit-airplay', 'deny');
    audio.preload = 'auto';
    audio.loop = true;
    audio.src = `data:audio/wav;base64,UklGRisAAABXQVZFZm10IBAAAAABAAEA${chars}AgAZGF0YQcAAACAgICAgICAAAA=`;
    audio.load();
    audio.play().catch(() => { unmuted = false; });

    events.forEach(e => window.removeEventListener(e, handleInteraction, { capture: true }));
  }

  events.forEach(e => window.addEventListener(e, handleInteraction, { capture: true, passive: true }));
}

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
  if (typeof globalThis.getAudioContext !== 'function') return null;
  return globalThis.getAudioContext();
}

function setupMasterGain() {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  audioState.masterGain = audioCtx.createGain();
  audioState.masterGain.gain.value = state.volume;
  audioState.masterGain.connect(audioCtx.destination);
}

let originalAudioConnect = null;

function initVisualizer() {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  if (!audioState.masterGain) setupMasterGain();

  audioState.analyser = audioCtx.createAnalyser();
  audioState.analyser.fftSize = 256;
  audioState.analyser.smoothingTimeConstant = 0.85;
  audioState.dataArray = new Uint8Array(audioState.analyser.frequencyBinCount);
  audioState.analyser.connect(audioState.masterGain);

  // Patch AudioNode.connect to route audio through our analyser.
  // Only intercepts connections targeting this context's destination;
  // all other connect() calls pass through unchanged.
  if (!originalAudioConnect) {
    const dest = audioCtx.destination;
    originalAudioConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(target, ...args) {
      if (target === dest && this !== audioState.analyser && this !== audioState.masterGain) {
        return originalAudioConnect.call(this, audioState.analyser, ...args);
      }
      return originalAudioConnect.call(this, target, ...args);
    };
  }
}

// =============================================================================
// Beat Detection
// =============================================================================

function detectBeat(bass) {
  const { history, historyIndex } = beatState;

  history[historyIndex] = bass;
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
  try { localStorage.setItem(STORAGE_KEY_TRACK, elements.trackSelect.value); } catch {}
}

function loadLastTrack() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TRACK);
    if (saved && trackKeys.includes(saved)) {
      elements.trackSelect.value = saved;
    }
  } catch {}
}

// =============================================================================
// Player Controls
// =============================================================================

function getSelectedTrack() {
  const track = tracks[elements.trackSelect.value];
  if (track) return track;
  elements.trackSelect.value = trackKeys[0];
  return tracks[trackKeys[0]];
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

  clearInterval(timerState.interval);
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

  window.addEventListener('pagehide', cleanupNatureSounds);
}

function cleanupNatureSounds() {
  for (const sound of Object.values(natureSounds)) {
    try { sound.source?.stop(); } catch {}
    try { sound.lfo?.stop(); } catch {}
  }
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
let tasks = (() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS) || '[]'); } catch { return []; }
})();

function saveTasks() {
  try { localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks)); } catch {}
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
  const fragment = document.createDocumentFragment();
  tasks.forEach((task, i) => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.dataset.index = i;

    const check = document.createElement('span');
    check.className = 'task-check';

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const del = document.createElement('span');
    del.className = 'task-delete';
    del.textContent = '\u00d7';

    li.append(check, text, del);
    fragment.appendChild(li);
  });
  elements.taskList.innerHTML = '';
  elements.taskList.appendChild(fragment);
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
// Breathing Exercise
// =============================================================================

function getCurrentBreathingPhase() {
  const pattern = breathingPatterns[breathingState.pattern];
  return pattern[breathingState.phaseIndex];
}

function getPhaseLabel(phase) {
  const labels = {
    inhale: 'Breathe In',
    hold: 'Hold',
    exhale: 'Breathe Out',
  };
  return labels[phase] || phase;
}

function updateBreathingDisplay() {
  const phase = getCurrentBreathingPhase();
  elements.breathingPhase.textContent = getPhaseLabel(phase.phase);
  elements.breathingTimer.textContent = breathingState.secondsLeft;
}

function updateRoundsDisplay() {
  if (breathingState.rounds > 0) {
    if (breathingState.targetRounds > 0) {
      elements.breathingRounds.textContent = `${breathingState.rounds} of ${breathingState.targetRounds}`;
    } else {
      elements.breathingRounds.textContent = `Round ${breathingState.rounds}`;
    }
  } else {
    elements.breathingRounds.textContent = '';
  }
}

function applyBreathingAnimation(phase) {
  const circle = elements.breathingCircle;

  if (phase.phase === 'inhale') {
    circle.style.transition = `transform ${phase.duration}s ease-in-out`;
    circle.style.transform = 'scale(1.8)';
  } else if (phase.phase === 'exhale') {
    circle.style.transition = `transform ${phase.duration}s ease-in-out`;
    circle.style.transform = 'scale(1)';
  }
  // For 'hold', we don't change anything - circle stays at current size
}

function advanceBreathingPhase() {
  const pattern = breathingPatterns[breathingState.pattern];
  const nextIndex = (breathingState.phaseIndex + 1) % pattern.length;

  // Completed a full cycle
  if (nextIndex === 0) {
    // Check if we've reached the target
    if (breathingState.targetRounds > 0 && breathingState.rounds >= breathingState.targetRounds) {
      completeBreathing();
      return;
    }
    breathingState.rounds++;
    updateRoundsDisplay();
  }

  breathingState.phaseIndex = nextIndex;

  const phase = getCurrentBreathingPhase();
  breathingState.secondsLeft = phase.duration;

  applyBreathingAnimation(phase);
  updateBreathingDisplay();
}

function breathingTick() {
  breathingState.secondsLeft--;

  if (breathingState.secondsLeft <= 0) {
    advanceBreathingPhase();
  } else {
    updateBreathingDisplay();
  }
}

function startBreathingCountdown() {
  if (breathingState.running || breathingState.countdown) return;

  breathingState.countdown = true;
  elements.breathingStartBtn.textContent = 'Get Ready';
  elements.breathingStartBtn.disabled = true;
  elements.breathingCircle.classList.add('active');

  let count = 3;
  elements.breathingPhase.textContent = 'Get Ready';
  elements.breathingTimer.textContent = count;

  clearInterval(breathingState.countdownInterval);
  breathingState.countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      elements.breathingTimer.textContent = count;
    } else {
      clearInterval(breathingState.countdownInterval);
      breathingState.countdownInterval = null;
      breathingState.countdown = false;
      startBreathing();
    }
  }, 1000);
}

function startBreathing() {
  breathingState.running = true;
  breathingState.phaseIndex = 0;
  breathingState.rounds = 1;

  const phase = getCurrentBreathingPhase();
  breathingState.secondsLeft = phase.duration;

  // Ensure circle starts at scale 1
  elements.breathingCircle.style.transition = 'none';
  elements.breathingCircle.style.transform = 'scale(1)';

  // Force reflow then start animation on next frame
  void elements.breathingCircle.offsetWidth;
  requestAnimationFrame(() => {
    applyBreathingAnimation(phase);
  });

  updateBreathingDisplay();
  updateRoundsDisplay();

  elements.breathingStartBtn.textContent = 'Running';

  clearInterval(breathingState.interval);
  breathingState.interval = setInterval(breathingTick, 1000);
}

function stopBreathing() {
  if (!breathingState.running && !breathingState.countdown) return;

  // Clear countdown if active
  if (breathingState.countdownInterval) {
    clearInterval(breathingState.countdownInterval);
    breathingState.countdownInterval = null;
  }
  breathingState.countdown = false;

  // Clear breathing interval if active
  if (breathingState.interval) {
    clearInterval(breathingState.interval);
    breathingState.interval = null;
  }
  breathingState.running = false;
  breathingState.rounds = 0;

  elements.breathingCircle.classList.remove('active');
  elements.breathingCircle.style.transition = 'transform 0.5s ease-out';
  elements.breathingCircle.style.transform = 'scale(1)';
  elements.breathingPhase.textContent = '';
  elements.breathingTimer.textContent = '';
  updateRoundsDisplay();

  elements.breathingStartBtn.textContent = 'Start';
  elements.breathingStartBtn.disabled = false;
}

function completeBreathing() {
  breathingState.running = false;
  clearInterval(breathingState.interval);
  breathingState.interval = null;

  elements.breathingCircle.classList.remove('active');
  elements.breathingCircle.style.transition = 'transform 0.5s ease-out';
  elements.breathingCircle.style.transform = 'scale(1)';
  elements.breathingPhase.textContent = 'Complete';
  elements.breathingTimer.textContent = '';

  elements.breathingStartBtn.textContent = 'Start';
  elements.breathingStartBtn.disabled = false;
}

function setBreathingPattern(pattern) {
  if (breathingState.running) {
    stopBreathing();
  }
  breathingState.pattern = pattern;
}

// =============================================================================
// Event Listeners
// =============================================================================

function setupEventListeners() {
  // Canvas resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Pause animations when tab is hidden to save CPU/battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (audioState.animationId) {
        cancelAnimationFrame(audioState.animationId);
        audioState.animationId = null;
      }
      stopIdleVisualization();
    } else {
      if (state.isPlaying && !audioState.animationId) {
        draw();
      } else if (!state.isPlaying && !audioState.idleAnimationId) {
        startIdleVisualization();
      }
    }
  });

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
      const audioCtx = getAudioContext();
      if (audioCtx) {
        audioState.masterGain.gain.setTargetAtTime(state.volume, audioCtx.currentTime, 0.02);
      }
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
      const value = parseInt(e.target.value, 10);
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

  // Mode tabs
  elements.modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elements.modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const mode = tab.dataset.mode;
      if (mode === 'focus') {
        elements.focusContent.classList.remove('hidden');
        elements.calmContent.classList.add('hidden');
      } else {
        elements.focusContent.classList.add('hidden');
        elements.calmContent.classList.remove('hidden');
      }
    });
  });

  // Breathing
  elements.breathingStartBtn.addEventListener('click', startBreathingCountdown);
  elements.breathingStopBtn.addEventListener('click', stopBreathing);

  elements.breathingPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.breathingPresetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setBreathingPattern(btn.dataset.pattern);
    });
  });

  elements.breathingRoundsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.breathingRoundsBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      breathingState.targetRounds = parseInt(btn.dataset.rounds, 10);
      if (breathingState.running) {
        updateRoundsDisplay();
      }
    });
  });
}

// =============================================================================
// Initialization
// =============================================================================

async function init() {
  try {
    unmuteIOS();
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
