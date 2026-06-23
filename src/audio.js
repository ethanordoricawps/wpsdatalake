// Procedural ambient rainforest bed (WebAudio). CC0-clean — no sourced file.
// Layers: low "air" (filtered brown noise), a pulsing insect shimmer
// (amplitude-modulated band-passed noise), and sparse soft bird chirps.
// Started on the user's "enter" gesture (autoplay is blocked otherwise).

let ctx = null;
let master = null;
let started = false;
let chirpTimer = null;
let muted = false;

function noiseBuffer(seconds, kind) {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (kind === 'brown') {
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    } else {
      d[i] = white;
    }
  }
  return buf;
}

function loopNoise(kind) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(4, kind);
  src.loop = true;
  src.start();
  return src;
}

function chirp() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const g = ctx.createGain();
  const pan = ctx.createStereoPanner();
  pan.pan.value = Math.random() * 1.6 - 0.8;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  const base = 1800 + Math.random() * 1600;
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.exponentialRampToValueAtTime(base * (1.1 + Math.random() * 0.3), t + 0.08);
  // gentle two-note chirp
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  osc.connect(g).connect(pan).connect(master);
  osc.start(t);
  osc.stop(t + 0.22);
}

function scheduleChirps() {
  const next = 1400 + Math.random() * 4200;
  chirpTimer = setTimeout(() => {
    if (Math.random() < 0.7) chirp();
    scheduleChirps();
  }, next);
}

export function startAmbient() {
  if (started) {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.0001;
  master.connect(ctx.destination);
  // fade in
  master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.5, ctx.currentTime + 3.5);

  // low air bed
  const air = loopNoise('brown');
  const airF = ctx.createBiquadFilter();
  airF.type = 'lowpass';
  airF.frequency.value = 420;
  const airG = ctx.createGain();
  airG.gain.value = 0.5;
  air.connect(airF).connect(airG).connect(master);

  // insect shimmer: band-passed white noise, amplitude-modulated (chorus pulse)
  const ins = loopNoise('white');
  const insF = ctx.createBiquadFilter();
  insF.type = 'bandpass';
  insF.frequency.value = 6500;
  insF.Q.value = 1.4;
  const insG = ctx.createGain();
  insG.gain.value = 0.06;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.7;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 0.035;
  lfo.connect(lfoG).connect(insG.gain);
  lfo.start();
  ins.connect(insF).connect(insG).connect(master);

  scheduleChirps();
  started = true;
}

export function setMuted(m) {
  muted = m;
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(m ? 0.0001 : 0.5, ctx.currentTime + 0.4);
}

export function isMuted() {
  return muted;
}
