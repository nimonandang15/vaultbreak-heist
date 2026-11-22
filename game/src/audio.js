// All sound is synthesized with WebAudio — no audio files, no network.
// Short blips for coins and pickups, a rising alarm sting when spotted, a
// zap for the EMP and a little fanfare for the clean getaway.
let ctx = null;
let muted = false;

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, seconds, type = 'sine', volume = 0.12, when = 0, slideTo = null) {
  const ac = audioCtx();
  if (!ac || muted) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

export function unlockAudio() {
  audioCtx();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function sfxCoin() {
  tone(1568, 0.09, 'triangle', 0.10);
  tone(2093, 0.12, 'triangle', 0.08, 0.06);
}

export function sfxPickup() {
  tone(523, 0.12, 'sine', 0.12);
  tone(659, 0.12, 'sine', 0.12, 0.09);
  tone(784, 0.2, 'sine', 0.12, 0.18);
}

export function sfxSpotted() {
  tone(220, 0.28, 'sawtooth', 0.09, 0, 440);
  tone(440, 0.28, 'sawtooth', 0.06, 0.05, 660);
}

export function sfxCaught() {
  tone(180, 0.5, 'sawtooth', 0.14, 0, 70);
}

export function sfxEmp() {
  tone(1200, 0.35, 'square', 0.06, 0, 120);
}

export function sfxSmoke() {
  tone(320, 0.3, 'sine', 0.08, 0, 140);
}

export function sfxWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => tone(n, 0.22, 'triangle', 0.12, i * 0.11));
}

export function sfxLose() {
  tone(196, 0.7, 'sawtooth', 0.12, 0, 98);
  tone(147, 0.9, 'sawtooth', 0.10, 0.15, 73);
}
