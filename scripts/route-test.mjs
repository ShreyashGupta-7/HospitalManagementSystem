import { findRoute, buildSteps, usesStairs } from '../src/lib/route.js';
import { stepText } from '../src/lib/directionsText.js';
import { PLACES, EDGES } from '../src/data/hospital.js';
import en from '../src/i18n/en.js';
// tiny translator for node
const lookup = (k) => k.split('.').reduce((o, p) => o?.[p], en);
const t = (k, p) => (lookup(k) ?? k).replace?.(/\{(\w+)\}/g, (m, x) => p?.[x] ?? m) ?? lookup(k);
t.raw = lookup; t.place = (id) => PLACES[id]?.name || id; t.landmark = (id) => PLACES[id]?.landmark; t.floor = (f) => en.floors[f];

const show = (a, b, o = {}) => {
  const r = findRoute(a, b, o);
  console.log(`\n${a} -> ${b} ${o.avoidStairs ? '(avoid stairs)' : ''}: ${r.metres} m, stairs=${usesStairs(r)}`);
  console.log('  path', r.path.join(' > '));
  buildSteps(r).forEach((s, i) => console.log(`  ${i + 1}. ${stepText(s, t)}`));
};
show('entrance', 'opd3');
show('entrance', 'opd3', { avoidStairs: true });
show('entrance', 'ward4', { avoidStairs: true });
show('opd6', 'pharmacy');
show('registration', 'opd4', { avoidStairs: true });
show('waiting_a', 'helpdesk', { avoidStairs: true });
show('entrance', 'emergency', { avoidStairs: true });

// Check every pair: a route exists, and avoid-stairs never uses stairs
const ids = Object.keys(PLACES);
let bad = 0, pairs = 0;
for (const a of ids) for (const b of ids) {
  pairs++;
  const r1 = findRoute(a, b); const r2 = findRoute(a, b, { avoidStairs: true });
  if (!r1 || !r2) { console.log('NO ROUTE', a, b, !!r1, !!r2); bad++; continue; }
  if (usesStairs(r2)) { console.log('STAIRS USED', a, b); bad++; }
  const st = buildSteps(r2);
  if (st[st.length - 1].type !== 'arrive' && st[st.length - 1].type !== 'already') { console.log('NO ARRIVE', a, b); bad++; }
  if (st.some(s => !stepText(s, t))) { console.log('EMPTY TEXT', a, b); bad++; }
}
console.log(`\nchecked ${pairs} pairs, problems: ${bad}`);
