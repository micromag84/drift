# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Drift is a focus & relaxation web app that generates ambient music using Strudel, a live coding music library. Features include 24 mood presets across 6 categories, canvas-based audio visualizer, Pomodoro timer, synthesized nature sounds mixer (rain, wind, thunder, fire), and a quick tasks list with localStorage persistence.

## Commands

```bash
npm run dev      # Start development server (Vite) at localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

## Architecture

Minimal single-page application with no build-time framework.

### File Structure

- **index.html** - Complete UI with inline CSS (~600 lines of styles)
- **main.js** - Application logic organized into sections
- **tracks.js** - Track definitions, visual themes, and category mappings

### main.js Organization

The file is organized into clearly labeled sections:

| Section | Purpose |
|---------|---------|
| DOM Elements | `elements` object containing all UI references |
| State | `state`, `audioState`, `beatState`, `timerState`, `theme` objects |
| Utilities | `lerp()`, `formatTime()`, `escapeHtml()` |
| Theme Management | Theme transitions between track categories |
| Audio Setup | Master gain, analyser, audio routing |
| Beat Detection | Adaptive beat detection with cooldown |
| Visualizer Drawing | Reusable drawing functions for waves, particles, glow |
| Player Controls | Play/pause, track switching |
| Pomodoro Timer | Timer logic with notifications |
| Nature Sounds | Synthesized ambient sounds |
| Tasks | Task list with localStorage persistence |
| Event Listeners | `setupEventListeners()` centralizes all handlers |
| Initialization | `init()` async entry point |

### State Objects

```javascript
state         // isPlaying, volume, strudelReady, time
audioState    // analyser, masterGain, dataArray, animationId, idleAnimationId
beatState     // prevBass, energy, decay, history, rings, particles
timerState    // interval, seconds, running, mode, focusDuration, breakDuration
theme         // current, target (for smooth transitions)
```

### Audio System

**Strudel Integration:**
- `initStrudel()` initializes the audio engine
- `evaluate(patternString)` plays a pattern
- `evaluate('hush()')` stops playback

**Audio Routing Chain:**
All audio nodes → AnalyserNode (visualization) → GainNode (master volume) → destination

This is achieved by monkey-patching `AudioNode.prototype.connect` in `initVisualizer()` to intercept connections to `audioCtx.destination`.

**Nature Sounds:**
Synthesized using Web Audio API buffers (white/brown noise) with filters and LFOs. Not Strudel patterns. Initialized lazily via `initNatureSounds()`. Uses `createFilteredNoise()` helper for consistent audio node setup.

### Visualizer

The visualizer has two modes sharing common drawing functions:

- `draw()` - Audio-reactive mode with beat detection
- `drawIdle()` - Ambient animation when not playing

Shared drawing functions accept options for customization:
- `drawBackground(width, height, fadeAlpha)`
- `drawWaves(width, height, { amplitude, beatBoost, themeHue, themeSat, ... })`
- `drawFloatingParticles(width, height, { themeHue, themeSat, dataArray, ... })`
- `drawCentralGlow(width, height, { themeHue, themeSat, bass, beatPulse })`
- `drawSparkles(width, height, high, themeHue, themeSat)`

### Track Format

```javascript
trackName: { bpm: 70, pattern: `stack(...).cpm(70)` }
```

Patterns use Strudel's mini-notation: `note()`, `s()`, `.lpf()`, `.gain()`, `.delay()`, `.room()`, `.slow()`, `stack()`, `.cpm()`.

### Keyboard Shortcuts

Space = play/pause, arrows = navigate moods and adjust volume. Shortcuts are disabled when focus is on INPUT or SELECT elements.
