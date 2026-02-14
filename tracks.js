// Track definitions — each designed with distinct sonic character
export const tracks = {

  // ==========================================================================
  // FOCUS — Clean, steady, non-distracting. Background for deep work.
  // ==========================================================================

  deepfocus: { bpm: 70, pattern: `stack(
  note("<e2 b2>").s("sine").lpf(180).gain(0.45).slow(8),
  note("<e3 b3 g3 d3>").s("triangle").lpf(sine.range(400,700).slow(12)).gain(0.22).delay(0.5).room(0.3).slow(2),
  note("[~ e5] [~ ~ ~ b4]").s("sine").lpf(1000).gain(0.1).delay(0.7).pan(sine.range(0.3,0.7).slow(7)).slow(4)
).cpm(70)` },

  flow: { bpm: 82, pattern: `stack(
  note("<a2 e2 d2 a2>").s("sine").lpf(200).gain(0.4).slow(4),
  note("[a3 ~ db4 e4] [~ d4 ~ a4]").s("triangle").lpf(650).gain(0.2).delay(0.4).slow(2),
  note("<a4 e5 d5 a5>").s("sine").lpf(sine.range(500,1000).slow(8)).gain(0.12).delay(0.55).room(0.3).slow(4),
  s("hh:2*4").gain(0.05).lpf(2500).delay(0.15)
).cpm(82)` },

  minimal: { bpm: 76, pattern: `stack(
  note("c3").s("sine").lpf(200).gain(0.4).slow(8),
  note("[~ c4 ~ ~ ~ ~ e4 ~]").s("triangle").lpf(600).gain(0.18).delay(0.6).slow(2)
).cpm(76)` },

  study: { bpm: 74, pattern: `stack(
  note("<d3 a2 g2 c3>").s("sine").lpf(260).gain(0.38).slow(2),
  note("[d4 f4 a4]/3").s("triangle").lpf(700).gain(0.2).delay(0.4),
  note("[~ a3] [~ d4]").s("sine").lpf(500).gain(0.16).delay(0.5).room(0.2).slow(2)
).cpm(74)` },

  // ==========================================================================
  // CHILL — Warm, groovy, relaxed. Actual beats and musical chords.
  // ==========================================================================

  lofi: { bpm: 86, pattern: `stack(
  s("[bd ~ ~ ~] [~ ~ bd:1 ~]").gain(0.5),
  s("[~ ~ hh ~] [~ hh:1 ~ hh]").gain(0.15).lpf(3500).delay(0.15),
  s("[~ sd:3 ~ ~] [~ ~ ~ ~]").gain(0.3).lpf(2000),
  note("[c4,eb4,g4,bb4] ~ [f4,ab4,c5] ~").s("triangle").lpf(550).gain(0.22).delay(0.35).slow(2),
  note("<c3 f2 ab2 bb2>").s("sine").lpf(280).gain(0.35).slow(2)
).cpm(86)` },

  coffee: { bpm: 92, pattern: `stack(
  s("bd ~ bd:1 ~ bd ~ ~ bd:1").gain(0.45),
  s("~ hh ~ hh:1 ~ hh ~ hh:1").gain(0.15).lpf(4500),
  s("~ ~ ~ ~ sd:2 ~ ~ ~").gain(0.28),
  note("[g3,b3,d4,gb4] ~ [c4,e4,g4] ~").s("triangle").lpf(800).gain(0.2).delay(0.25).slow(2),
  note("<g2 c3 d3 e3>").s("sine").lpf(320).gain(0.35)
).cpm(92)` },

  jazz: { bpm: 68, pattern: `stack(
  s("bd ~ ~ ~ ~ ~ bd:1 ~").gain(0.3).slow(2),
  s("~ hh:1 ~ hh hh:1 ~ hh ~").gain(0.1).lpf(3000),
  s("[~ ~ ~ ~ ~ sd:3 ~ ~]").gain(0.18).slow(2),
  note("<[c4,e4,bb4] [f4,a4,eb5] [bb3,d4,ab4] [eb4,g4,db5]>").s("triangle").lpf(900).gain(0.18).delay(0.35).room(0.3),
  note("<c3 f2 bb2 eb3>").s("sine").lpf(250).gain(0.35).slow(2)
).cpm(68)` },

  vinyl: { bpm: 78, pattern: `stack(
  s("hh*8").gain(0.03).lpf(1200).pan(sine.range(0.3,0.7).slow(4)),
  note("<[e3,g3,b3] [a3,db4,e4]>").s("sawtooth").lpf(420).gain(0.12).delay(0.45).room(0.3),
  note("<e2 a2 d3 b2>").s("sine").lpf(200).gain(0.38).slow(4),
  note("[b4 ~ e5 ~]/4").s("triangle").lpf(600).gain(0.1).delay(0.6)
).cpm(78)` },

  // ==========================================================================
  // NATURE — Organic, spacious, evocative of natural environments.
  // ==========================================================================

  rain: { bpm: 72, pattern: `stack(
  s("[hh:2 hh hh:1 hh] [hh hh:2 hh hh:1] [hh:1 hh hh hh:2] [hh hh:1 hh hh]").gain(sine.range(0.04,0.09).slow(8)).lpf(sine.range(2500,5000).slow(6)).delay(0.25).pan(sine.range(0.2,0.8).slow(3)),
  note("<d4 f4 a4 c5>").s("sine").lpf(sine.range(350,550).slow(10)).gain(0.2).delay(0.6).room(0.5).slow(4),
  note("<d3 a2 f2 c3>").s("sine").lpf(200).gain(0.32).slow(4),
  note("[~ a4]/8").s("triangle").lpf(500).gain(0.08).delay(0.7).pan(0.7)
).cpm(72)` },

  ocean: { bpm: 48, pattern: `stack(
  note("<c3 g2 e3 b2>").s("sine").lpf(sine.range(100,350).slow(24)).gain(sine.range(0.2,0.42).slow(14)).slow(4),
  note("<e4 b4 g4>").s("triangle").lpf(sine.range(350,700).slow(18)).gain(0.12).delay(0.7).room(0.7).slow(8),
  s("hh:2*2").gain(sine.range(0.02,0.05).slow(12)).lpf(sine.range(1200,2500).slow(16)).delay(0.5).pan(sine.range(0.2,0.8).slow(9)).slow(2),
  note("c2").s("sine").lpf(80).gain(sine.range(0.15,0.35).slow(18)).slow(8)
).cpm(48)` },

  forest: { bpm: 62, pattern: `stack(
  note("<a3 e3 c4 f3>").s("sine").lpf(300).gain(0.28).slow(4).delay(0.4),
  note("[e5 ~ ~ ~ a5 ~ ~ ~] [~ ~ ~ f5 ~ ~ ~ ~]").s("triangle").lpf(1200).gain(0.1).delay(0.5).pan(sine.range(0.2,0.8).slow(5)).slow(2),
  note("[~ c4 ~ ~ ~ ~ ~ e4]").s("sine").lpf(650).gain(0.12).delay(0.55).pan(sine.range(0.6,0.4).slow(7)).slow(4),
  note("<a2 e2>").s("sine").lpf(150).gain(0.35).slow(8)
).cpm(62)` },

  thunder: { bpm: 42, pattern: `stack(
  note("<d2 a1 e2 b1>").s("sine").lpf(sine.range(50,160).slow(16)).gain(sine.range(0.25,0.5).slow(10)).slow(4),
  note("[d3 ~ f3 ~]/8").s("sawtooth").lpf(sine.range(130,300).slow(12)).gain(0.1).delay(0.6).room(0.7),
  s("hh:2*4").gain(sine.range(0.02,0.06).slow(8)).lpf(900).delay(0.5).pan(sine.range(0.3,0.7).slow(5)),
  note("[~ ~ ~ d4]/16").s("triangle").lpf(380).gain(0.06).delay(0.8).room(0.7)
).cpm(42)` },

  // ==========================================================================
  // AMBIENT — Atmospheric, textured, slowly evolving soundscapes.
  // ==========================================================================

  ambient: { bpm: 58, pattern: `stack(
  note("<c4 e4 g4 b4>").s("sine").lpf(sine.range(300,900).slow(14)).gain(0.22).delay(0.65).room(0.6).slow(4),
  note("<g3 c4>").s("triangle").lpf(sine.range(400,700).slow(10)).gain(0.15).delay(0.5).pan(sine.range(0.3,0.7).slow(7)).slow(4),
  note("c3").s("sine").lpf(180).gain(0.32).slow(8),
  note("[~ e5 ~ b5]/8").s("sine").lpf(1100).gain(0.08).delay(0.75).pan(0.65)
).cpm(58)` },

  drone: { bpm: 35, pattern: `stack(
  note("c2").s("sine").lpf(sine.range(70,220).slow(28)).gain(0.45).slow(8),
  note("g2").s("sine").lpf(sine.range(90,180).slow(24)).gain(0.25).slow(8),
  note("<c3 g3 e3>").s("triangle").lpf(sine.range(180,400).slow(18)).gain(0.1).delay(0.8).room(0.7).pan(sine.range(0.3,0.7).slow(12)).slow(8),
  note("[e4 g4]/16").s("sine").lpf(350).gain(0.05).delay(0.85).pan(0.4)
).cpm(35)` },

  ethereal: { bpm: 52, pattern: `stack(
  note("<e4 b4 ab4 eb5>").s("triangle").lpf(sine.range(600,1500).slow(10)).gain(0.18).delay(0.7).room(0.6).pan(sine.range(0.3,0.7).slow(8)).slow(4),
  note("<b3 e4 ab4>").s("sine").lpf(sine.range(500,900).slow(12)).gain(0.13).delay(0.6).pan(sine.range(0.7,0.3).slow(6)).slow(4),
  note("<e3 b2>").s("sine").lpf(220).gain(0.28).slow(8),
  note("[b5 e6]/12").s("sine").lpf(800).gain(0.05).delay(0.8).room(0.5)
).cpm(52)` },

  cosmos: { bpm: 44, pattern: `stack(
  note("<f3 c4 ab3 eb4>").s("sine").lpf(sine.range(180,600).slow(20)).gain(0.22).delay(0.65).room(0.7).slow(4),
  note("f2").s("sine").lpf(sine.range(80,160).slow(22)).gain(0.38).slow(8),
  note("<ab3 eb4 c4>").s("sawtooth").lpf(sine.range(220,450).slow(16)).gain(0.08).delay(0.7).pan(sine.range(0.2,0.8).slow(11)).slow(4),
  note("[c5 f5 ab5]/16").s("triangle").lpf(sine.range(400,700).slow(14)).gain(0.06).delay(0.8).room(0.6)
).cpm(44)` },

  // ==========================================================================
  // WELLNESS — Gentle, soothing, therapeutic. Designed for relaxation.
  // ==========================================================================

  meditation: { bpm: 48, pattern: `stack(
  note("<f3 c4 a3 d4>").s("sine").lpf(sine.range(200,450).slow(16)).gain(0.28).slow(4).room(0.5).delay(0.5),
  note("[f4 a4 c5]/12").s("triangle").lpf(420).gain(0.1).delay(0.7).pan(sine.range(0.35,0.65).slow(10)),
  note("f2").s("sine").lpf(120).gain(0.38).slow(8),
  note("[~ c5 ~ ~]/16").s("sine").lpf(550).gain(0.06).delay(0.8).room(0.6).pan(0.6)
).cpm(48)` },

  breathing: { bpm: 46, pattern: `stack(
  note("<c4 g4>").s("sine").lpf(sine.range(250,500).slow(8)).gain(sine.range(0.12,0.3).slow(4)).slow(4).room(0.4),
  note("<e4 b4>").s("triangle").lpf(sine.range(380,650).slow(6)).gain(sine.range(0.06,0.15).slow(4)).slow(4).pan(sine.range(0.35,0.65).slow(6)),
  note("c3").s("sine").lpf(150).gain(sine.range(0.18,0.35).slow(4)).slow(8),
  note("[~ g5]/16").s("sine").lpf(450).gain(0.05).delay(0.8)
).cpm(46)` },

  sleep: { bpm: 38, pattern: `stack(
  note("<ab3 eb4 bb3 f4>").s("sine").lpf(sine.range(120,280).slow(28)).gain(0.18).slow(8).room(0.6),
  note("ab2").s("sine").lpf(90).gain(0.28).slow(8),
  note("<eb4 bb4>").s("triangle").lpf(sine.range(180,350).slow(24)).gain(0.06).delay(0.8).pan(sine.range(0.4,0.6).slow(14)).slow(8),
  note("[~ eb5]/16").s("sine").lpf(300).gain(0.04).delay(0.85).room(0.7)
).cpm(38)` },

  healing: { bpm: 50, pattern: `stack(
  note("<a3 e4 c4 g4>").s("sine").lpf(432).gain(0.25).slow(4).delay(0.5).room(0.4),
  note("a2").s("sine").lpf(130).gain(0.35).slow(8),
  note("[e4 a4 c5]/8").s("triangle").lpf(480).gain(0.11).delay(0.65).room(0.5).pan(sine.range(0.4,0.6).slow(8)),
  note("<c4 e4>").s("sine").lpf(sine.range(280,450).slow(14)).gain(0.1).delay(0.55).slow(4)
).cpm(50)` },

  // ==========================================================================
  // MOODY — Dark, atmospheric, emotional. Cinematic and evocative.
  // ==========================================================================

  night: { bpm: 62, pattern: `stack(
  note("<eb3 bb2 f3 c3>").s("sine").lpf(sine.range(160,450).slow(10)).gain(0.32).slow(2).delay(0.5),
  note("[eb4,gb4,bb4]/4").s("sawtooth").lpf(380).gain(0.1).delay(0.6).room(0.5).pan(sine.range(0.3,0.7).slow(8)),
  note("eb2").s("sine").lpf(130).gain(0.4).slow(8),
  note("[~ bb4 ~ ~] [~ ~ f5 ~]").s("triangle").lpf(600).gain(0.08).delay(0.7).slow(4)
).cpm(62)` },

  melancholy: { bpm: 56, pattern: `stack(
  note("<d4 a3 f4 c4>").s("sine").lpf(sine.range(250,600).slow(10)).gain(0.25).delay(0.6).slow(2),
  note("<d3 a2 f2 c3>").s("sine").lpf(200).gain(0.35).slow(4),
  note("[a4 d5 f5]/6").s("triangle").lpf(sine.range(380,650).slow(8)).gain(0.1).delay(0.7).room(0.5).pan(sine.range(0.3,0.7).slow(5)),
  note("[~ ~ d4 ~]/8").s("sawtooth").lpf(320).gain(0.07).delay(0.65).slow(4)
).cpm(56)` },

  noir: { bpm: 54, pattern: `stack(
  note("<c3 eb3 gb3 bb2>").s("sine").lpf(sine.range(140,380).slow(10)).gain(0.32).slow(2).delay(0.45),
  note("[eb4,gb4]/4").s("sawtooth").lpf(350).gain(0.1).delay(0.55).pan(sine.range(0.3,0.7).slow(8)),
  note("c2").s("sine").lpf(110).gain(0.4).slow(8),
  note("[~ ~ gb4 ~] [~ bb4 ~ ~]").s("triangle").lpf(500).gain(0.08).delay(0.7).room(0.4).slow(4)
).cpm(54)` },

  mystery: { bpm: 58, pattern: `stack(
  note("<b3 f3 d4 ab3>").s("sine").lpf(sine.range(200,520).slow(12)).gain(0.25).delay(0.6).slow(2),
  note("<b2 f2 d3 ab2>").s("sine").lpf(170).gain(0.35).slow(4),
  note("[f4 b4 d5]/8").s("triangle").lpf(sine.range(320,550).slow(8)).gain(0.1).delay(0.7).room(0.5).pan(sine.range(0.3,0.7).slow(7)),
  note("[~ ~ ab4 ~]/12").s("sawtooth").lpf(280).gain(0.06).delay(0.65).pan(0.3)
).cpm(58)` }
};

export const trackKeys = Object.keys(tracks);

// Visual themes for each track category
export const visualThemes = {
  focus: {
    baseHue: 210,        // Blue
    saturation: 30,
    waveCount: 3,
    particleCount: 8,
    glowIntensity: 0.8,
    speed: 1.0,
    bgColor: [26, 28, 46]
  },
  chill: {
    baseHue: 30,         // Warm orange/amber
    saturation: 40,
    waveCount: 5,
    particleCount: 16,
    glowIntensity: 1.2,
    speed: 0.8,
    bgColor: [35, 28, 30]
  },
  nature: {
    baseHue: 140,        // Green
    saturation: 35,
    waveCount: 6,
    particleCount: 20,
    glowIntensity: 0.9,
    speed: 0.6,
    bgColor: [24, 32, 30]
  },
  ambient: {
    baseHue: 260,        // Purple
    saturation: 25,
    waveCount: 4,
    particleCount: 10,
    glowIntensity: 1.5,
    speed: 0.4,
    bgColor: [30, 26, 40]
  },
  wellness: {
    baseHue: 300,        // Pink/magenta
    saturation: 20,
    waveCount: 3,
    particleCount: 6,
    glowIntensity: 1.0,
    speed: 0.5,
    bgColor: [32, 26, 35]
  },
  moody: {
    baseHue: 240,        // Deep blue/indigo
    saturation: 35,
    waveCount: 4,
    particleCount: 8,
    glowIntensity: 0.7,
    speed: 0.7,
    bgColor: [20, 22, 35]
  }
};

// Map tracks to their categories
export const trackCategories = {
  deepfocus: 'focus', flow: 'focus', minimal: 'focus', study: 'focus',
  lofi: 'chill', coffee: 'chill', jazz: 'chill', vinyl: 'chill',
  rain: 'nature', ocean: 'nature', forest: 'nature', thunder: 'nature',
  ambient: 'ambient', drone: 'ambient', ethereal: 'ambient', cosmos: 'ambient',
  meditation: 'wellness', breathing: 'wellness', sleep: 'wellness', healing: 'wellness',
  night: 'moody', melancholy: 'moody', noir: 'moody', mystery: 'moody'
};
