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

Minimal single-page application with no build-time framework. All source is in two files:

- **index.html** - Complete UI with inline CSS (~600 lines of styles)
- **main.js** - All application logic in one ES module

### Audio System

**Strudel Integration:**
- `initStrudel()` initializes the audio engine
- `evaluate(patternString)` plays a pattern
- `evaluate('hush()')` stops playback

**Audio Routing Chain:**
All audio nodes → AnalyserNode (visualization) → GainNode (master volume) → destination

This is achieved by monkey-patching `AudioNode.prototype.connect` in `initVisualizer()` to intercept connections to `audioCtx.destination`.

**Nature Sounds:**
Synthesized using Web Audio API buffers (white/brown noise) with filters and LFOs. Not Strudel patterns. Initialized lazily on first interaction via `initNatureSounds()`.

### Track Format

```javascript
trackName: { bpm: 70, pattern: `stack(...).cpm(70)` }
```

Patterns use Strudel's mini-notation: `note()`, `s()`, `.lpf()`, `.gain()`, `.delay()`, `.room()`, `.slow()`, `stack()`, `.cpm()`.

### State Management

All state is module-level variables. Tasks persist to localStorage under key `drift-tasks`.

### Keyboard Shortcuts

Space = play/pause, arrows = navigate moods and adjust volume. Shortcuts are disabled when focus is on INPUT or SELECT elements.
