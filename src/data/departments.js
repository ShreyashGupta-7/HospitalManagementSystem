// OPD departments of City District Hospital (all made up).
// English names live here; Hindi and Tamil are in src/i18n under `depts.<id>` and `doctors.<room>`.
//
// avgConsult: a sample average consultation time in minutes. The live estimate starts
// from this and then uses the last 10 real consultations in that department.

export const OPD_HOURS = { open: '09:00', close: '14:00' };

export const DEPARTMENTS = [
  {
    id: 'MED', icon: 'stethoscope', name: 'General Medicine', hint: 'fever, cough, BP, sugar',
    rooms: [
      { id: 'opd1', doctor: 'Dr. Meena Sharma' },
      { id: 'opd2', doctor: 'Dr. Rajesh Verma' },
    ],
    avgConsult: 6, waitingArea: 'hallA', colour: '#0f6b5f',
  },
  {
    id: 'CHI', icon: 'child', name: 'Children', hint: 'babies and children up to 14 years',
    rooms: [{ id: 'opd3', doctor: 'Dr. Anjali Rao' }],
    avgConsult: 7, waitingArea: 'hallA', colour: '#1d4ed8',
  },
  {
    id: 'WOM', icon: 'mother', name: 'Women and pregnancy', hint: 'pregnancy, periods, women\'s health',
    rooms: [{ id: 'opd4', doctor: 'Dr. Sunita Patel' }],
    avgConsult: 8, waitingArea: 'hallA', colour: '#be185d',
  },
  {
    id: 'BON', icon: 'bone', name: 'Bones and joints', hint: 'knee, back and joint pain, fractures',
    rooms: [{ id: 'opd5', doctor: 'Dr. Imran Khan' }],
    avgConsult: 7, waitingArea: 'west', colour: '#92400e',
  },
  {
    id: 'ENT', icon: 'ear', name: 'Ear, nose and throat', hint: 'ear pain, hearing, sore throat',
    rooms: [{ id: 'opd6', doctor: 'Dr. Lakshmi Iyer' }],
    avgConsult: 6, waitingArea: 'west', colour: '#6d28d9',
  },
  {
    id: 'EYE', icon: 'eye', name: 'Eyes', hint: 'cannot see clearly, red or painful eyes',
    rooms: [{ id: 'opd7', doctor: 'Dr. Arvind Nair' }],
    avgConsult: 5, waitingArea: 'west', colour: '#0e7490',
  },
  {
    id: 'SKN', icon: 'skin', name: 'Skin', hint: 'rash, itching, skin problems',
    rooms: [{ id: 'opd8', doctor: 'Dr. Pooja Singh' }],
    avgConsult: 5, waitingArea: 'west', colour: '#a16207',
  },
];

// Waiting areas and how many seats each has (used for the overcrowding colour).
export const WAITING_AREAS = [
  { id: 'hallA', place: 'waiting_a', seats: 24, depts: ['MED', 'CHI', 'WOM'] },
  { id: 'west', place: 'f1_w1', seats: 14, depts: ['BON', 'ENT', 'EYE', 'SKN'] },
];

export const DEPT_BY_ID = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]));

export const ROOM_TO_DEPT = Object.fromEntries(
  DEPARTMENTS.flatMap((d) => d.rooms.map((r) => [r.id, d.id])),
);

export const ALL_ROOMS = DEPARTMENTS.flatMap((d) => d.rooms.map((r) => ({ ...r, dept: d.id })));
