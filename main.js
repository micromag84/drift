import { initStrudel, evaluate } from '@strudel/web';
import { tracks, trackKeys, visualThemes, trackCategories } from './tracks.js';

// Current theme with smooth transitions
let currentTheme = { ...visualThemes.focus };
let targetTheme = { ...visualThemes.focus };

function getThemeForTrack(trackName) {
  const category = trackCategories[trackName] || 'focus';
  return visualThemes[category];
}

function lerpValue(current, target, speed) {
  return current + (target - current) * speed;
}

function updateThemeTransition() {
  const transitionSpeed = 0.03;
  currentTheme.baseHue = lerpValue(currentTheme.baseHue, targetTheme.baseHue, transitionSpeed);
  currentTheme.saturation = lerpValue(currentTheme.saturation, targetTheme.saturation, transitionSpeed);
  currentTheme.waveCount = Math.round(lerpValue(currentTheme.waveCount, targetTheme.waveCount, transitionSpeed));
  currentTheme.particleCount = Math.round(lerpValue(currentTheme.particleCount, targetTheme.particleCount, transitionSpeed));
  currentTheme.glowIntensity = lerpValue(currentTheme.glowIntensity, targetTheme.glowIntensity, transitionSpeed);
  currentTheme.speed = lerpValue(currentTheme.speed, targetTheme.speed, transitionSpeed);
  for (let i = 0; i < 3; i++) {
    currentTheme.bgColor[i] = lerpValue(currentTheme.bgColor[i], targetTheme.bgColor[i], transitionSpeed);
  }
}

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
let idleAnimationId = null;

// Beat detection state
let prevBass = 0;
let beatEnergy = 0;
let beatDecay = 0;
let beatHistory = new Array(30).fill(0);
let historyIndex = 0;
let beatRings = []; // Expanding ring effects on beats
let beatParticles = []; // Burst particles on beats

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

  // Monkey-patch AudioNode.connect to route all audio through our analyser for visualization.
  // This intercepts connections to the destination and redirects them through analyser → masterGain → destination.
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

// Beat detection - returns true when a beat is detected
function detectBeat(bass) {
  // Update history for adaptive threshold
  beatHistory[historyIndex] = bass;
  historyIndex = (historyIndex + 1) % beatHistory.length;

  // Calculate average energy over history
  const avgEnergy = beatHistory.reduce((a, b) => a + b, 0) / beatHistory.length;

  // Beat detection: current bass significantly higher than average and previous
  const threshold = Math.max(avgEnergy * 1.4, 60);
  const isBeat = bass > threshold && bass > prevBass * 1.2 && beatDecay <= 0;

  prevBass = bass;

  if (isBeat) {
    beatDecay = 8; // Cooldown frames to prevent double triggers
    beatEnergy = 1.0;
    return true;
  }

  beatDecay = Math.max(0, beatDecay - 1);
  beatEnergy *= 0.92; // Smooth decay
  return false;
}

// Calm, flowing visualizer with beat response and theme support
function draw() {
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  // Smoothly transition theme colors
  updateThemeTransition();

  analyser.getByteFrequencyData(dataArray);

  // Soft fade - faster fade on beats for more contrast, using theme background
  const fadeAlpha = 0.08 + beatEnergy * 0.04;
  const bg = currentTheme.bgColor;
  ctx.fillStyle = `rgba(${Math.round(bg[0])}, ${Math.round(bg[1])}, ${Math.round(bg[2])}, ${fadeAlpha})`;
  ctx.fillRect(0, 0, width, height);

  time += 0.008 * currentTheme.speed;

  // Get average levels for different frequency bands
  const bass = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
  const mid = dataArray.slice(8, 40).reduce((a, b) => a + b, 0) / 32;
  const high = dataArray.slice(40, 80).reduce((a, b) => a + b, 0) / 40;

  // Detect beats
  const isBeat = detectBeat(bass);

  // Theme-based hue
  const themeHue = currentTheme.baseHue;
  const themeSat = currentTheme.saturation;

  // Spawn beat ring on beat
  if (isBeat) {
    beatRings.push({
      x: width / 2,
      y: height / 2,
      radius: 20,
      maxRadius: 120 + bass,
      alpha: 0.6,
      hue: themeHue + Math.random() * 40 - 20
    });

    // Spawn burst particles on beat
    const particleCount = 6 + Math.floor(bass / 30);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      beatParticles.push({
        x: width / 2,
        y: height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        alpha: 0.7,
        hue: themeHue + Math.random() * 60 - 30
      });
    }
  }

  // Draw and update beat rings
  for (let i = beatRings.length - 1; i >= 0; i--) {
    const ring = beatRings[i];
    const progress = ring.radius / ring.maxRadius;

    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${ring.hue}, ${themeSat + 20}%, 65%, ${ring.alpha * (1 - progress)})`;
    ctx.lineWidth = 3 - progress * 2;
    ctx.stroke();

    ring.radius += 4 + beatEnergy * 2;
    ring.alpha *= 0.96;

    if (ring.radius > ring.maxRadius || ring.alpha < 0.01) {
      beatRings.splice(i, 1);
    }
  }

  // Draw and update beat particles
  for (let i = beatParticles.length - 1; i >= 0; i--) {
    const p = beatParticles[i];

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
      beatParticles.splice(i, 1);
    }
  }

  // Soft flowing waves - amplitude responds to beats and bass
  const waves = currentTheme.waveCount;
  for (let w = 0; w < waves; w++) {
    ctx.beginPath();
    const baseY = height * (0.25 + w * (0.5 / waves));
    const beatBoost = beatEnergy * 20;
    const amplitude = 15 + (bass / 20) + w * 5 + beatBoost;
    const frequency = 0.008 + w * 0.002;
    const speed = time * (0.5 + w * 0.2) + beatEnergy * 0.5;
    const alpha = 0.15 - w * 0.03 + beatEnergy * 0.1;

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

    const hue = themeHue + w * 20 + beatEnergy * 30;
    const saturation = themeSat + beatEnergy * 20;
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, 60%, ${Math.min(alpha, 0.4)})`;
    ctx.lineWidth = 2 + beatEnergy;
    ctx.stroke();
  }

  // Floating particles - respond to mid frequencies
  const particles = currentTheme.particleCount;
  for (let i = 0; i < particles; i++) {
    const freqIndex = Math.floor((i / particles) * dataArray.length);
    const value = dataArray[freqIndex];

    if (value > 30) {
      const x = (Math.sin(time * 0.3 + i * 0.8) * 0.4 + 0.5) * width;
      const y = (Math.cos(time * 0.2 + i * 0.6) * 0.3 + 0.5) * height;
      const beatPulse = beatEnergy * 3;
      const size = 2 + (value / 100) + beatPulse;
      const alpha = 0.2 + (value / 500) + beatEnergy * 0.2;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${themeHue + i * 10 + mid / 3}, ${themeSat + 10}%, 70%, ${Math.min(alpha, 0.6)})`;
      ctx.fill();
    }
  }

  // Central glow - pulses strongly on beats
  const beatPulse = beatEnergy * 40 * currentTheme.glowIntensity;
  const glowSize = (40 + (bass / 4) + beatPulse) * currentTheme.glowIntensity;
  const glowAlpha = (0.1 + bass / 1000 + beatEnergy * 0.15) * currentTheme.glowIntensity;

  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, glowSize
  );
  gradient.addColorStop(0, `hsla(${themeHue + beatEnergy * 20}, ${themeSat + beatEnergy * 20}%, 60%, ${glowAlpha})`);
  gradient.addColorStop(0.5, `hsla(${themeHue}, ${themeSat}%, 60%, ${glowAlpha * 0.4})`);
  gradient.addColorStop(1, `hsla(${themeHue}, ${themeSat}%, 60%, 0)`);

  ctx.beginPath();
  ctx.arc(width / 2, height / 2, glowSize, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // High frequency sparkles scattered around
  if (high > 50) {
    const sparkleCount = Math.floor(high / 40);
    for (let i = 0; i < sparkleCount; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      const sparkleSize = 1 + Math.random() * 2;
      const sparkleAlpha = 0.1 + (high / 500);

      ctx.beginPath();
      ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${themeHue - 20 + Math.random() * 40}, ${themeSat}%, 80%, ${sparkleAlpha})`;
      ctx.fill();
    }
  }

  animationId = requestAnimationFrame(draw);
}

function stopVisualizer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // Reset beat detection state
  prevBass = 0;
  beatEnergy = 0;
  beatDecay = 0;
  beatHistory.fill(0);
  historyIndex = 0;
  beatRings = [];
  beatParticles = [];

  // Start idle visualization instead of fading out
  startIdleVisualization();
}

// Idle visualization - calm ambient animation when not playing
function drawIdle() {
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  // Smoothly transition theme colors
  updateThemeTransition();

  time += 0.004 * currentTheme.speed;

  // Gentle fade using theme background
  const bg = currentTheme.bgColor;
  ctx.fillStyle = `rgba(${Math.round(bg[0])}, ${Math.round(bg[1])}, ${Math.round(bg[2])}, 0.06)`;
  ctx.fillRect(0, 0, width, height);

  const themeHue = currentTheme.baseHue;
  const themeSat = currentTheme.saturation;

  // Soft flowing waves - gentle idle animation
  const waves = currentTheme.waveCount;
  for (let w = 0; w < waves; w++) {
    ctx.beginPath();
    const baseY = height * (0.25 + w * (0.5 / waves));
    const amplitude = 10 + w * 3;
    const frequency = 0.006 + w * 0.0015;
    const speed = time * (0.4 + w * 0.15);
    const alpha = 0.08 - w * 0.015;

    for (let x = 0; x <= width; x += 4) {
      const y = baseY +
        Math.sin(x * frequency + speed) * amplitude +
        Math.sin(x * frequency * 2.3 + speed * 1.3) * (amplitude * 0.4);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const hue = themeHue + w * 15;
    ctx.strokeStyle = `hsla(${hue}, ${themeSat - 10}%, 55%, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Gentle floating particles
  const particles = Math.floor(currentTheme.particleCount * 0.6);
  for (let i = 0; i < particles; i++) {
    const x = (Math.sin(time * 0.2 + i * 0.9) * 0.35 + 0.5) * width;
    const y = (Math.cos(time * 0.15 + i * 0.7) * 0.25 + 0.5) * height;
    const size = 1.5 + Math.sin(time + i) * 0.5;
    const alpha = 0.12 + Math.sin(time * 0.5 + i * 0.3) * 0.05;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${themeHue + i * 8}, ${themeSat}%, 65%, ${alpha})`;
    ctx.fill();
  }

  // Subtle central glow
  const glowSize = 30 + Math.sin(time * 0.3) * 5;
  const glowAlpha = 0.06 + Math.sin(time * 0.4) * 0.02;

  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, glowSize * currentTheme.glowIntensity
  );
  gradient.addColorStop(0, `hsla(${themeHue}, ${themeSat}%, 55%, ${glowAlpha * currentTheme.glowIntensity})`);
  gradient.addColorStop(0.6, `hsla(${themeHue}, ${themeSat}%, 55%, ${glowAlpha * 0.3 * currentTheme.glowIntensity})`);
  gradient.addColorStop(1, `hsla(${themeHue}, ${themeSat}%, 55%, 0)`);

  ctx.beginPath();
  ctx.arc(width / 2, height / 2, glowSize * currentTheme.glowIntensity, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  idleAnimationId = requestAnimationFrame(drawIdle);
}

function startIdleVisualization() {
  if (idleAnimationId) return; // Already running
  drawIdle();
}

function stopIdleVisualization() {
  if (idleAnimationId) {
    cancelAnimationFrame(idleAnimationId);
    idleAnimationId = null;
  }
}

// Track persistence
const STORAGE_KEY_TRACK = 'drift-last-track';

function saveLastTrack() {
  localStorage.setItem(STORAGE_KEY_TRACK, trackSelect.value);
}

function loadLastTrack() {
  const saved = localStorage.getItem(STORAGE_KEY_TRACK);
  if (saved && trackKeys.includes(saved)) {
    trackSelect.value = saved;
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

  // Stop idle visualization before starting audio-reactive one
  stopIdleVisualization();

  // Update visual theme for this track
  const newTheme = getThemeForTrack(trackSelect.value);
  targetTheme = { ...newTheme, bgColor: [...newTheme.bgColor] };

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
  saveLastTrack();
  updateUI();
  if (isPlaying) play();
}

// Event Listeners
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

loadLastTrack();
updateUI();

// Start idle visualization on page load
startIdleVisualization();

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => switchTrack(-1));
nextBtn.addEventListener('click', () => switchTrack(1));

trackSelect.addEventListener('change', () => {
  saveLastTrack();
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
      volumeSlider.value = Math.min(100, parseInt(volumeSlider.value, 10) + 10);
      volumeSlider.dispatchEvent(new Event('input'));
      break;
    case 'ArrowDown':
      e.preventDefault();
      volumeSlider.value = Math.max(0, parseInt(volumeSlider.value, 10) - 10);
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

    focusDuration = parseInt(btn.dataset.focus, 10);
    breakDuration = parseInt(btn.dataset.break, 10);

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
  if (remaining > 0) {
    tasksCount.textContent = `${remaining} left`;
  } else if (tasks.length > 0) {
    tasksCount.textContent = 'All done!';
  } else {
    tasksCount.textContent = '';
  }
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
  const index = parseInt(item.dataset.index, 10);

  if (e.target.classList.contains('task-delete')) {
    deleteTask(index);
  } else {
    toggleTask(index);
  }
});

renderTasks();

