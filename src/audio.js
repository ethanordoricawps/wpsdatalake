// Designed ambient audio (WebAudio, CC0-clean — no sourced files), spanning the
// three scenes with one continuous bed:
//   Enter  -> LOUD forest-floor rainforest + a rising "swoop" whoosh
//   swoop  -> bed eases from loud toward quiet as we rise above the canopy
//   still  -> QUIET high, serene idle (sparse distant birds)
// Started on the Enter gesture (autoplay is blocked before any interaction).

let ctx = null;
let master = null; // mute control
let ambBus = null; // ambience intensity (loud start -> quiet idle)
let started = false;
let muted = false;
let quiet = false; // chirp density follows this
let chirpTimer = null;

const LOUD = 1.0;
const QUIET = 0.32;

function noiseBuffer(seconds, kind) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    else d[i] = w;
  }
  return buf;
}

function loopNoise(kind, dest, gainVal, filter) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(4, kind);
  src.loop = true;
  const g = ctx.createGain();
  g.gain.value = gainVal;
  let node = src;
  if (filter) { node.connect(filter); node = filter; }
  node.connect(g).connect(dest);
  src.start();
  return g;
}

function chirp() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const g = ctx.createGain();
  const pan = ctx.createStereoPanner();
  pan.pan.value = Math.random() * 1.6 - 0.8;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  const base = 1700 + Math.random() * 1700;
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.exponentialRampToValueAtTime(base * (1.08 + Math.random() * 0.3), t + 0.09);
  const peak = (quiet ? 0.04 : 0.06) * (0.7 + Math.random() * 0.6);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  osc.connect(g).connect(pan).connect(master);
  osc.start(t);
  osc.stop(t + 0.22);
}

function scheduleChirps() {
  const lo = quiet ? 2600 : 900;
  const hi = quiet ? 7000 : 3600;
  chirpTimer = setTimeout(() => {
    if (Math.random() < (quiet ? 0.6 : 0.85)) chirp();
    scheduleChirps();
  }, lo + Math.random() * (hi - lo));
}

// rising rush of air through the canopy
function whoosh() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(3.4, 'white');
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(260, t);
  bp.frequency.exponentialRampToValueAtTime(1700, t + 1.3);
  bp.frequency.exponentialRampToValueAtTime(380, t + 3.2);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 1.0);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
  // low body
  const rum = ctx.createBufferSource();
  rum.buffer = noiseBuffer(3.4, 'brown');
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 260;
  const rg = ctx.createGain();
  rg.gain.setValueAtTime(0.0001, t);
  rg.gain.exponentialRampToValueAtTime(0.35, t + 1.1);
  rg.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
  src.connect(bp).connect(g).connect(master);
  rum.connect(lp).connect(rg).connect(master);
  src.start(t); src.stop(t + 3.4);
  rum.start(t); rum.stop(t + 3.4);
}

// Begin the bed at LOUD and fire the swoop whoosh (called on Enter).
export function enter() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (started) { if (ctx.state === 'suspended') ctx.resume(); }
  else {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0.0001 : 1.0;
    master.connect(ctx.destination);
    ambBus = ctx.createGain();
    ambBus.gain.value = LOUD;
    ambBus.connect(master);

    // constant low air bed (independent of ambience intensity)
    loopNoise('brown', master, 0.16, (() => { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; return f; })());

    // dense forest body + insect shimmer ride the ambBus (loud -> quiet)
    loopNoise('white', ambBus, 0.05, (() => { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.8; return f; })());
    const insF = ctx.createBiquadFilter();
    insF.type = 'bandpass'; insF.frequency.value = 6500; insF.Q.value = 1.4;
    const insG = loopNoise('white', ambBus, 0.06, insF);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.7;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.03;
    lfo.connect(lfoG).connect(insG.gain);
    lfo.start();

    started = true;
    scheduleChirps();
  }
  // (re)assert loud + whoosh
  quiet = false;
  if (ambBus) {
    ambBus.gain.cancelScheduledValues(ctx.currentTime);
    ambBus.gain.setTargetAtTime(LOUD, ctx.currentTime, 0.3);
  }
  whoosh();
}

// Ease the bed down to the quiet high-altitude idle (called late in the swoop).
export function idle(dur = 2.4) {
  if (!ctx || !ambBus) return;
  quiet = true;
  ambBus.gain.cancelScheduledValues(ctx.currentTime);
  ambBus.gain.setTargetAtTime(QUIET, ctx.currentTime, dur / 3);
}

export function setMuted(m) {
  muted = m;
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(m ? 0.0001 : 1.0, ctx.currentTime, 0.2);
}
