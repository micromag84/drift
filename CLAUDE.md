# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Drift is a focus & relaxation web app that generates ambient music using Strudel, a live coding music library. It features a music player with multiple mood presets, audio visualizer, and Pomodoro timer.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
```

## Architecture

This is a minimal single-page application with no build-time framework:

- **index.html** - Complete UI with inline CSS styles and HTML structure
- **main.js** - All application logic in one ES module:
  - Track definitions (Strudel patterns for different moods)
  - Audio playback via `@strudel/web` (`initStrudel`, `evaluate`)
  - Canvas-based visualizer using Web Audio API `AnalyserNode`
  - Master volume control via `GainNode`
  - Pomodoro timer with notification support

## Key Patterns

**Strudel Integration:**
- `initStrudel()` initializes the audio engine
- `evaluate(patternString)` plays a pattern
- `evaluate('hush()')` stops playback
- Patterns use Strudel's mini-notation: `note()`, `s()`, `.lpf()`, `.gain()`, `.delay()`, `.room()`, `.slow()`

**Audio Routing:**
- All audio nodes are routed through an AnalyserNode (for visualization) then to a master GainNode (for volume control)
- This is achieved by monkey-patching `AudioNode.prototype.connect`

**Track Format:**
```javascript
trackName: { bpm: 70, pattern: `stack(...).cpm(70)` }
```
