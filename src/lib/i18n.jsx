import { createContext, useContext, useMemo } from 'react';
import en from '../i18n/en.js';
import hi from '../i18n/hi.js';
import ta from '../i18n/ta.js';
import { PLACES } from '../data/hospital.js';
import { DEPT_BY_ID, ALL_ROOMS } from '../data/departments.js';
import { useSettings } from './settings.jsx';

export const LANGS = [
  { code: 'en', name: 'English', speech: 'en-IN' },
  { code: 'hi', name: 'हिंदी', speech: 'hi-IN' },
  { code: 'ta', name: 'தமிழ்', speech: 'ta-IN' },
];
export const LANG_BY_CODE = Object.fromEntries(LANGS.map((l) => [l.code, l]));
const DICTS = { en, hi, ta };

function lookup(dict, key) {
  let cur = dict;
  for (const part of key.split('.')) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

function fill(str, params) {
  if (!params || typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? String(params[k]) : m));
}

/** Builds a translator for one language. Missing text falls back to English. */
export function makeT(lang) {
  const dict = DICTS[lang] || en;
  const t = (key, params) => {
    let v = lookup(dict, key);
    if (v == null) v = lookup(en, key);
    if (v == null) return key;
    return fill(v, params);
  };
  t.lang = lang;
  t.raw = (key) => lookup(dict, key) ?? lookup(en, key);
  t.place = (id) => dict.places?.[id]?.name || PLACES[id]?.name || id;
  t.landmark = (id) => dict.places?.[id]?.lm || PLACES[id]?.landmark || '';
  t.placeShort = (id) => dict.places?.[id]?.short || en.places?.[id]?.short || shortName(id);
  t.dept = (id) => dict.depts?.[id]?.name || DEPT_BY_ID[id]?.name || id;
  t.deptHint = (id) => dict.depts?.[id]?.hint || DEPT_BY_ID[id]?.hint || '';
  t.doctor = (room) => dict.doctors?.[room] || ALL_ROOMS.find((r) => r.id === room)?.doctor || '';
  t.floor = (f) => t(`floors.${f}`);
  t.floorIn = (f) => lookup(dict, `floorsIn.${f}`) ?? (lang === 'en' ? lookup(en, `floorsIn.${f}`) : t(`floors.${f}`));
  t.room = (roomId) => t('common.room', { n: roomId.replace('opd', '') });
  return t;
}

// English short labels for the floor plan, derived from the full names.
function shortName(id) {
  if (/^opd\d$/.test(id)) return `Room ${id.slice(3)}`;
  const n = PLACES[id]?.name || id;
  return n.replace(/\s*\(.*\)$/, '');
}

const I18nContext = createContext(makeT('en'));

export function I18nProvider({ children }) {
  const { settings } = useSettings();
  const lang = settings.lang || 'en';
  const t = useMemo(() => makeT(lang), [lang]);
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

export function useT() {
  return useContext(I18nContext);
}
