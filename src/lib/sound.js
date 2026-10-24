// Beeps made with the Web Audio API: no sound files to download.
let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

/** Browsers only allow sound after the user has tapped something. Call this on a tap. */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  return c ? c.state === 'running' : false;
}

export function audioReady() {
  return Boolean(ctx && ctx.state === 'running');
}

function tone(freq, start, dur, type = 'sine', gain = 0.25) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

/** Gentle two-note chime: "your turn is close". */
export function chime() {
  tone(660, 0, 0.35);
  tone(880, 0.3, 0.5);
}

/** Three rising notes: "it is your turn" / board announcement. */
export function callChime() {
  tone(523, 0, 0.3);
  tone(659, 0.25, 0.3);
  tone(784, 0.5, 0.6);
}

/** Urgent alarm for the staff dashboard. */
export function alarm() {
  tone(880, 0, 0.18, 'square', 0.18);
  tone(660, 0.22, 0.18, 'square', 0.18);
  tone(880, 0.44, 0.18, 'square', 0.18);
}

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined') {
  const once = () => unlockAudio();
  window.addEventListener('pointerdown', once, { passive: true });
  window.addEventListener('keydown', once);
}
