// Checks that every language has every English key, with the same {placeholders},
// and a name/landmark for every place, department and doctor.
// Usage: node scripts/i18n-check.mjs
import en from '../src/i18n/en.js';
import hi from '../src/i18n/hi.js';
import ta from '../src/i18n/ta.js';
import { PLACES } from '../src/data/hospital.js';
import { DEPARTMENTS, ALL_ROOMS } from '../src/data/departments.js';

const SKIP = new Set(['depts', 'doctors', 'places']);

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (!prefix && SKIP.has(k)) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const params = (s) => (typeof s === 'string' ? (s.match(/\{\w+\}/g) || []).sort().join(',') : Array.isArray(s) ? `array:${s.length}` : '');
const base = flatten(en);
let problems = 0;

for (const [code, dict] of Object.entries({ hi, ta })) {
  const flat = flatten(dict);
  for (const [k, v] of Object.entries(base)) {
    if (!(k in flat)) {
      console.log(`[${code}] missing: ${k}`);
      problems += 1;
    } else if (params(v) !== params(flat[k])) {
      console.log(`[${code}] placeholders differ: ${k}  en=${params(v)}  ${code}=${params(flat[k])}`);
      problems += 1;
    }
  }
  for (const k of Object.keys(flat)) if (!(k in base)) console.log(`[${code}] extra key (unused?): ${k}`);
  for (const id of Object.keys(PLACES)) {
    const p = dict.places?.[id];
    if (!p?.name || !p?.lm || !p?.short) {
      console.log(`[${code}] place incomplete: ${id}`);
      problems += 1;
    }
  }
  for (const d of DEPARTMENTS) {
    if (!dict.depts?.[d.id]?.name || !dict.depts?.[d.id]?.hint) {
      console.log(`[${code}] department incomplete: ${d.id}`);
      problems += 1;
    }
  }
  for (const r of ALL_ROOMS) {
    if (!dict.doctors?.[r.id]) {
      console.log(`[${code}] doctor missing: ${r.id}`);
      problems += 1;
    }
  }
}
console.log(problems ? `\n${problems} problem(s)` : 'All languages complete.');
process.exit(problems ? 1 : 0);
