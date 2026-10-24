import * as E from '../shared/engine.js';
let t = Date.now();
let s = E.createInitialState(t);
const r1 = E.reduce(s, { type: 'register', dept: 'MED', firstName: 'Kamla', age: 62, gender: 'female' }, { realNow: t });
s = r1.state; console.log('token', r1.result.token);
s = E.reduce(s, { type: 'demo.addSamples' }, { realNow: t }).state;
console.log('MED queue', s.queues.MED, 'serving', s.serving);
console.log('Kamla info', E.patientInfo(s, 'MED-001', E.simNow(s, t)));
s = E.reduce(s, { type: 'setDoctor', room: 'opd1', status: 'late', lateMin: 10 }, { realNow: t }).state;
console.log('stats', E.deptStats(s, 'MED', E.simNow(s, t + 600000)));
s = E.reduce(s, { type: 'move', token: s.queues.MED[0], dept: 'EYE' }, { realNow: t }).state;
s = E.reduce(s, { type: 'demo.speed', speed: 10 }, { realNow: t }).state;
s = E.reduce(s, { type: 'demo.auto', on: true }, { realNow: t }).state;
for (let i = 0; i < 300; i++) { t += 1000; const n = E.tick(s, { realNow: t }); if (n) s = n; }
console.log('after 5 real min @10x clock', E.fmtClock(E.simNow(s, t)), 'MED queue', s.queues.MED, 'consults', s.consults.MED);
console.log('crowding', E.crowding(s).map(c => c.id + ':' + c.waiting + ':' + c.level));
console.log('public has names?', JSON.stringify(E.publicView(s)).includes('Kamla'));
