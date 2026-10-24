import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { load, save } from './storage.js';

const KEY = 'opd.settings';
const DEFAULTS = {
  lang: null, // null until the patient picks one on the first visit
  textSize: 1, // 1 normal, 2 big, 3 biggest
  highContrast: false,
  readAloud: false,
  avoidStairs: false,
  assisted: false,
  seenTerms: [],
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => ({ ...DEFAULTS, ...load(KEY, {}) }));

  useEffect(() => {
    save(KEY, settings);
    const html = document.documentElement;
    // Assisted mode always uses the biggest text.
    const size = settings.assisted ? 3 : settings.textSize;
    html.dataset.size = String(size);
    html.classList.toggle('hc', settings.highContrast);
    html.lang = settings.lang || 'en';
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })), []);

  const setAssisted = useCallback(
    (on) => update(on ? { assisted: true, readAloud: true, avoidStairs: true } : { assisted: false }),
    [update],
  );

  const markTerm = useCallback(
    (id) => setSettings((s) => (s.seenTerms.includes(id) ? s : { ...s, seenTerms: [...s.seenTerms, id] })),
    [],
  );

  const value = useMemo(() => ({ settings, update, setAssisted, markTerm }), [settings, update, setAssisted, markTerm]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
