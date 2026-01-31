// Calm, relaxing track definitions
export const tracks = {
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
