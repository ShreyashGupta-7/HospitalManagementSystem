// Each screen says what "Listen" should read (a short, clear summary). If a screen
// doesn't, Listen reads the visible text of the main area.
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { speak, stopSpeaking, hasVoice, useVoices } from './speech.js';
import { useSettings } from './settings.jsx';
import { useT } from './i18n.jsx';

const Ctx = createContext(null);

export function ScreenSpeechProvider({ children }) {
  const [text, setText] = useState('');
  const t = useT();
  const { settings } = useSettings();
  const location = useLocation();
  const lastAuto = useRef('');
  useVoices();

  const readScreen = useCallback(() => {
    const main = document.getElementById('main');
    const fallback = main ? main.innerText : '';
    return speak(text || fallback, t.lang);
  }, [text, t.lang]);

  // Read each new screen aloud when "Read aloud" (or assisted mode) is on.
  useEffect(() => {
    if (!settings.readAloud || !text) return undefined;
    const key = `${location.pathname}|${text}`;
    if (lastAuto.current === key) return undefined;
    const id = setTimeout(() => {
      lastAuto.current = key;
      speak(text, t.lang);
    }, 450);
    return () => clearTimeout(id);
  }, [text, settings.readAloud, location.pathname, t.lang]);

  useEffect(() => () => stopSpeaking(), [location.pathname]);

  return (
    <Ctx.Provider value={{ setText, readScreen, canSpeak: hasVoice(t.lang) }}>{children}</Ctx.Provider>
  );
}

export function useScreenSpeech(text) {
  const ctx = useContext(Ctx);
  useEffect(() => {
    ctx?.setText(text || '');
    return () => ctx?.setText('');
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useReader() {
  return useContext(Ctx);
}
