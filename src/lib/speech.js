// Read-aloud (speechSynthesis) and voice input (SpeechRecognition), both built into the browser.
import { useEffect, useState } from 'react';
import { LANG_BY_CODE } from './i18n.jsx';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];
const listeners = new Set();

function refreshVoices() {
  if (!synth) return;
  voices = synth.getVoices() || [];
  listeners.forEach((fn) => fn(voices));
}

if (synth) {
  refreshVoices();
  if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', refreshVoices);
  else synth.onvoiceschanged = refreshVoices;
}

export function voiceFor(lang) {
  const tag = LANG_BY_CODE[lang]?.speech || lang;
  const base = tag.split('-')[0].toLowerCase();
  const norm = (v) => v.lang.replace('_', '-').toLowerCase();
  return (
    voices.find((v) => norm(v) === tag.toLowerCase()) ||
    voices.find((v) => norm(v).startsWith(`${base}-`) || norm(v) === base) ||
    null
  );
}

export function hasVoice(lang) {
  return Boolean(synth && voiceFor(lang));
}

/** Re-renders when the browser's voice list arrives (it loads late in Chrome). */
export function useVoices() {
  const [, setN] = useState(0);
  useEffect(() => {
    const fn = () => setN((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return { supported: Boolean(synth), has: hasVoice };
}

// Chrome stops long utterances after ~15 s, so speak sentence by sentence.
function chunks(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

let speakingListeners = new Set();
let speaking = false;
function setSpeaking(v) {
  speaking = v;
  speakingListeners.forEach((fn) => fn(v));
}

export function useSpeaking() {
  const [v, setV] = useState(speaking);
  useEffect(() => {
    speakingListeners.add(setV);
    return () => speakingListeners.delete(setV);
  }, []);
  return v;
}

/**
 * Speak a list of { text, lang } parts in order. Returns false if no voice exists
 * for any part (the caller can then hide the Listen button).
 */
export function speakParts(parts, { rate = 0.9 } = {}) {
  if (!synth) return Promise.resolve(false);
  synth.cancel();
  const queue = [];
  for (const p of parts) {
    const voice = voiceFor(p.lang);
    if (!voice) continue;
    for (const c of chunks(p.text)) queue.push({ text: c, voice, lang: voice.lang });
  }
  if (!queue.length) return Promise.resolve(false);
  setSpeaking(true);
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= queue.length) {
        setSpeaking(false);
        resolve(true);
        return;
      }
      const q = queue[i++];
      const u = new SpeechSynthesisUtterance(q.text);
      u.voice = q.voice;
      u.lang = q.lang;
      u.rate = rate;
      u.onend = next;
      u.onerror = () => {
        setSpeaking(false);
        resolve(false);
      };
      synth.speak(u);
    };
    next();
  });
}

export function speak(text, lang, opts) {
  return speakParts([{ text, lang }], opts);
}

export function stopSpeaking() {
  if (synth) synth.cancel();
  setSpeaking(false);
}

// ---------- voice input ----------

export function recognitionSupported() {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/** Listens once and resolves with what was heard. */
export function listenOnce(lang) {
  return new Promise((resolve, reject) => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) {
      reject(new Error('unsupported'));
      return;
    }
    const rec = new R();
    rec.lang = LANG_BY_CODE[lang]?.speech || 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let done = false;
    rec.onresult = (e) => {
      done = true;
      resolve(e.results[0][0].transcript || '');
    };
    rec.onerror = (e) => {
      if (!done) reject(new Error(e.error || 'error'));
      done = true;
    };
    rec.onend = () => {
      if (!done) reject(new Error('no-speech'));
    };
    try {
      rec.start();
    } catch (err) {
      reject(err);
    }
  });
}
