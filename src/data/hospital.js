// City District Hospital — a made-up government hospital with three floors.
//
// Every floor plan uses the same grid: 400 x 300 units, 1 unit = 0.25 metres.
// Places have an x/y "door" point (where you stand to enter) and an optional box
// (x, y, width, height) used only for drawing the room on the floor plan.
//
// English names and landmarks live here. Hindi and Tamil versions are in
// src/i18n/hi.js and src/i18n/ta.js under `places.<id>`.

export const HOSPITAL_NAME = 'City District Hospital';
export const METRES_PER_UNIT = 0.25;

export const FLOORS = [
  { id: 'G', level: 0, name: 'Ground floor' },
  { id: '1', level: 1, name: 'First floor' },
  { id: '2', level: 2, name: 'Second floor' },
];

// type: room | dept | ward | service | facility | lift | stairs | ramp | entrance
export const PLACES = {
  // ---------- Ground floor ----------
  entrance: {
    floor: 'G', x: 200, y: 290, type: 'entrance', icon: 'door', box: [165, 278, 70, 22],
    name: 'Main entrance', landmark: "the big gate with the green board",
    tags: ['gate', 'exit', 'door', 'start'],
  },
  registration: {
    floor: 'G', x: 110, y: 170, type: 'service', icon: 'clipboard', box: [40, 170, 110, 48],
    name: 'Registration counters', landmark: "the long counter with numbered windows",
    tags: ['register', 'counter', 'slip', 'opd card'],
  },
  helpdesk: {
    floor: 'G', x: 228, y: 215, type: 'service', icon: 'help', box: [228, 196, 62, 38],
    name: 'Help desk', landmark: "the yellow desk just inside the main entrance",
    tags: ['help', 'enquiry', 'information', 'lost'],
  },
  emergency: {
    floor: 'G', x: 40, y: 130, type: 'dept', icon: 'emergency', box: [5, 35, 75, 95],
    name: 'Emergency (Casualty)', landmark: "the red doors at the end of the corridor",
    tags: ['casualty', 'urgent', 'accident', 'trauma', 'emergency'],
  },
  pharmacy: {
    floor: 'G', x: 355, y: 170, type: 'service', icon: 'pill', box: [318, 170, 77, 48],
    name: 'Pharmacy', landmark: "the window with the green cross",
    tags: ['medicine', 'dawai', 'chemist', 'tablets'],
  },
  lab: {
    floor: 'G', x: 300, y: 130, type: 'service', icon: 'flask', box: [275, 35, 52, 95],
    name: 'Laboratory (blood tests)', landmark: "the door with a token screen outside, next to X-ray",
    tags: ['blood', 'test', 'sample', 'urine', 'lab'],
  },
  xray: {
    floor: 'G', x: 355, y: 130, type: 'service', icon: 'xray', box: [332, 35, 63, 95],
    name: 'X-ray', landmark: "the door with a yellow warning sign, at the far end",
    tags: ['xray', 'scan', 'radiology'],
  },
  water_g: {
    floor: 'G', x: 200, y: 130, type: 'facility', icon: 'water', box: [186, 100, 28, 30],
    name: 'Drinking water', landmark: "the water cooler between the stairs and the lift",
    tags: ['water', 'paani', 'drink'],
  },
  toilets_g: {
    floor: 'G', x: 110, y: 130, type: 'facility', icon: 'toilet', box: [88, 85, 44, 45],
    name: 'Toilets', landmark: "the blue toilet sign next to the stairs",
    tags: ['toilet', 'washroom', 'bathroom', 'restroom'],
  },
  wheelchair: {
    floor: 'G', x: 170, y: 245, type: 'facility', icon: 'wheelchair', box: [105, 232, 65, 32],
    name: 'Wheelchair point', landmark: "the blue board with a wheelchair picture, on your left as you come in",
    tags: ['wheelchair', 'stretcher', 'trolley'],
  },
  lift_g: {
    floor: 'G', x: 250, y: 130, type: 'lift', icon: 'lift', box: [228, 85, 44, 45],
    name: 'Lift', landmark: "the steel doors in the middle of the corridor",
    tags: ['lift', 'elevator'],
  },
  stairs_g: {
    floor: 'G', x: 160, y: 130, type: 'stairs', icon: 'stairs', box: [138, 85, 44, 45],
    name: 'Stairs', landmark: "the stairs next to the toilets",
    tags: ['stairs', 'steps'],
  },
  ramp: {
    floor: 'G', x: 305, y: 262, type: 'ramp', icon: 'ramp', box: [272, 248, 80, 30],
    name: 'Ramp', landmark: "the slope with a hand rail, on the right of the main entrance",
    tags: ['ramp', 'slope', 'wheelchair'],
  },

  // ---------- First floor ----------
  opd1: {
    floor: '1', x: 300, y: 130, type: 'room', icon: 'stethoscope', box: [276, 50, 50, 80],
    name: 'Room 1 (General Medicine)', landmark: "a door with a green number 1, opposite Room 3",
    tags: ['room 1', 'medicine', 'general', 'fever'],
  },
  opd2: {
    floor: '1', x: 355, y: 130, type: 'room', icon: 'stethoscope', box: [332, 50, 63, 80],
    name: 'Room 2 (General Medicine)', landmark: "the last door at the end of the corridor, next to Room 1",
    tags: ['room 2', 'medicine', 'general'],
  },
  opd3: {
    floor: '1', x: 300, y: 170, type: 'room', icon: 'child', box: [276, 170, 50, 62],
    name: 'Room 3 (Children)', landmark: "a door with cartoon pictures, next to the blue chairs",
    tags: ['room 3', 'children', 'child', 'baby', 'paediatric'],
  },
  opd4: {
    floor: '1', x: 355, y: 170, type: 'room', icon: 'mother', box: [332, 170, 63, 62],
    name: 'Room 4 (Women and pregnancy)', landmark: "the door with a pink sign, at the end of the corridor",
    tags: ['room 4', 'women', 'pregnancy', 'gynae', 'mother'],
  },
  opd5: {
    floor: '1', x: 100, y: 130, type: 'room', icon: 'bone', box: [76, 50, 50, 80],
    name: 'Room 5 (Bones and joints)', landmark: "a door with a bone picture, near the stairs",
    tags: ['room 5', 'bones', 'joints', 'ortho', 'fracture'],
  },
  opd6: {
    floor: '1', x: 40, y: 130, type: 'room', icon: 'ear', box: [8, 50, 62, 80],
    name: 'Room 6 (Ear, nose and throat)', landmark: "the door by the window at the far end",
    tags: ['room 6', 'ent', 'ear', 'nose', 'throat'],
  },
  opd7: {
    floor: '1', x: 100, y: 170, type: 'room', icon: 'eye', box: [76, 170, 50, 62],
    name: 'Room 7 (Eyes)', landmark: "a door with an eye chart, opposite Room 5",
    tags: ['room 7', 'eyes', 'eye', 'vision', 'spectacles'],
  },
  opd8: {
    floor: '1', x: 40, y: 170, type: 'room', icon: 'skin', box: [8, 170, 62, 62],
    name: 'Room 8 (Skin)', landmark: "the last door at the far end, opposite Room 6",
    tags: ['room 8', 'skin', 'derma', 'rash'],
  },
  waiting_a: {
    floor: '1', x: 210, y: 170, type: 'facility', icon: 'chair', box: [150, 170, 120, 70],
    name: 'Waiting hall A', landmark: "the hall with rows of blue chairs",
    tags: ['waiting', 'hall', 'chairs', 'sit'],
  },
  lift_1: {
    floor: '1', x: 250, y: 130, type: 'lift', icon: 'lift', box: [228, 85, 44, 45],
    name: 'Lift', landmark: "the steel doors in the middle of the corridor",
    tags: ['lift', 'elevator'],
  },
  stairs_1: {
    floor: '1', x: 160, y: 130, type: 'stairs', icon: 'stairs', box: [138, 85, 44, 45],
    name: 'Stairs', landmark: "the stairs next to the toilets",
    tags: ['stairs', 'steps'],
  },
  toilets_1: {
    floor: '1', x: 205, y: 130, type: 'facility', icon: 'toilet', box: [186, 95, 38, 35],
    name: 'Toilets', landmark: "the toilet sign between the stairs and the lift",
    tags: ['toilet', 'washroom', 'bathroom'],
  },

  // ---------- Second floor ----------
  ward4: {
    floor: '2', x: 60, y: 130, type: 'ward', icon: 'bed', box: [8, 35, 120, 95],
    name: 'Ward 4 (Medicine)', landmark: "the big door with a green board",
    tags: ['ward 4', 'medicine ward', 'admitted'],
  },
  ward5: {
    floor: '2', x: 330, y: 130, type: 'ward', icon: 'bed', box: [282, 35, 113, 95],
    name: 'Ward 5 (Surgery)', landmark: "the big door with an orange board, at the end",
    tags: ['ward 5', 'surgery', 'operation'],
  },
  ward6: {
    floor: '2', x: 60, y: 170, type: 'ward', icon: 'child', box: [8, 170, 135, 80],
    name: 'Ward 6 (Children)', landmark: "the door with painted animals on the wall",
    tags: ['ward 6', 'children ward', 'kids'],
  },
  nurses: {
    floor: '2', x: 210, y: 170, type: 'service', icon: 'nurse', box: [170, 170, 85, 50],
    name: 'Nurses\' station', landmark: "the open counter near the lift",
    tags: ['nurse', 'sister', 'station'],
  },
  lift_2: {
    floor: '2', x: 250, y: 130, type: 'lift', icon: 'lift', box: [228, 85, 44, 45],
    name: 'Lift', landmark: "the steel doors in the middle of the corridor",
    tags: ['lift', 'elevator'],
  },
  stairs_2: {
    floor: '2', x: 160, y: 130, type: 'stairs', icon: 'stairs', box: [138, 85, 44, 45],
    name: 'Stairs', landmark: "the stairs next to the window",
    tags: ['stairs', 'steps'],
  },
};

// Corridor junctions: points where you can turn. They have no name.
export const JUNCTIONS = {
  // Ground floor corridor (y = 150) and lobby
  g_w: { floor: 'G', x: 40, y: 150 },
  g_r: { floor: 'G', x: 110, y: 150 },
  g_s: { floor: 'G', x: 160, y: 150 },
  g_c: { floor: 'G', x: 200, y: 150 },
  g_l: { floor: 'G', x: 250, y: 150 },
  g_e1: { floor: 'G', x: 300, y: 150 },
  g_e2: { floor: 'G', x: 355, y: 150 },
  g_lobby: { floor: 'G', x: 200, y: 215 },
  // First floor corridor
  f1_w2: { floor: '1', x: 40, y: 150 },
  f1_w1: { floor: '1', x: 100, y: 150 },
  f1_s: { floor: '1', x: 160, y: 150 },
  f1_c: { floor: '1', x: 207, y: 150 },
  f1_l: { floor: '1', x: 250, y: 150 },
  f1_e1: { floor: '1', x: 300, y: 150 },
  f1_e2: { floor: '1', x: 355, y: 150 },
  // Second floor corridor
  f2_w: { floor: '2', x: 60, y: 150 },
  f2_s: { floor: '2', x: 160, y: 150 },
  f2_c: { floor: '2', x: 210, y: 150 },
  f2_l: { floor: '2', x: 250, y: 150 },
  f2_e: { floor: '2', x: 330, y: 150 },
};

// Paths between points. kind: walk (default) | stairs | lift | steps | ramp.
// Walking distance in metres is worked out from the floor plan (see EDGES below);
// paths between floors have a fixed distance that includes the time to wait or climb.
// `stairs: true` means the path has steps — "Avoid stairs" never uses these.
const RAW_EDGES = [
  // Ground floor corridor
  ['g_w', 'g_r'], ['g_r', 'g_s'], ['g_s', 'g_c'], ['g_c', 'g_l'], ['g_l', 'g_e1'], ['g_e1', 'g_e2'],
  ['g_c', 'g_lobby'],
  // Ground floor doors
  ['emergency', 'g_w'], ['toilets_g', 'g_r'], ['registration', 'g_r'], ['stairs_g', 'g_s'],
  ['water_g', 'g_c'], ['lift_g', 'g_l'], ['lab', 'g_e1'], ['xray', 'g_e2'], ['pharmacy', 'g_e2'],
  ['helpdesk', 'g_lobby'], ['wheelchair', 'g_lobby'],
  // Entrance: a few steps straight in, or the ramp on the right
  ['entrance', 'g_lobby', { kind: 'steps', stairs: true }],
  ['entrance', 'ramp', { kind: 'ramp' }],
  ['ramp', 'g_lobby', { kind: 'ramp' }],

  // First floor corridor
  ['f1_w2', 'f1_w1'], ['f1_w1', 'f1_s'], ['f1_s', 'f1_c'], ['f1_c', 'f1_l'], ['f1_l', 'f1_e1'], ['f1_e1', 'f1_e2'],
  // First floor doors
  ['opd6', 'f1_w2'], ['opd8', 'f1_w2'], ['opd5', 'f1_w1'], ['opd7', 'f1_w1'], ['stairs_1', 'f1_s'],
  ['toilets_1', 'f1_c'], ['waiting_a', 'f1_c'], ['lift_1', 'f1_l'], ['opd1', 'f1_e1'], ['opd3', 'f1_e1'],
  ['opd2', 'f1_e2'], ['opd4', 'f1_e2'],

  // Second floor corridor
  ['f2_w', 'f2_s'], ['f2_s', 'f2_c'], ['f2_c', 'f2_l'], ['f2_l', 'f2_e'],
  // Second floor doors
  ['ward4', 'f2_w'], ['ward6', 'f2_w'], ['stairs_2', 'f2_s'], ['nurses', 'f2_c'], ['lift_2', 'f2_l'], ['ward5', 'f2_e'],

  // Between floors
  ['stairs_g', 'stairs_1', { kind: 'stairs', stairs: true, metres: 15 }],
  ['stairs_1', 'stairs_2', { kind: 'stairs', stairs: true, metres: 15 }],
  ['lift_g', 'lift_1', { kind: 'lift', metres: 25 }],
  ['lift_1', 'lift_2', { kind: 'lift', metres: 25 }],
  ['lift_g', 'lift_2', { kind: 'lift', metres: 35 }],
];

export const POINTS = { ...JUNCTIONS, ...PLACES };

function walkMetres(a, b) {
  const p = POINTS[a];
  const q = POINTS[b];
  return Math.round(Math.hypot(p.x - q.x, p.y - q.y) * METRES_PER_UNIT);
}

// Final list of paths: { from, to, metres, stairs, kind }. Paths work both ways.
export const EDGES = RAW_EDGES.map(([from, to, opts = {}]) => ({
  from,
  to,
  kind: opts.kind || 'walk',
  stairs: Boolean(opts.stairs),
  metres: opts.metres ?? Math.max(1, walkMetres(from, to)),
}));

// Places shown in "Find a place", in this order.
export const PLACE_GROUPS = [
  { id: 'rooms', places: ['opd1', 'opd2', 'opd3', 'opd4', 'opd5', 'opd6', 'opd7', 'opd8'] },
  { id: 'services', places: ['registration', 'helpdesk', 'pharmacy', 'lab', 'xray', 'emergency'] },
  { id: 'wards', places: ['ward4', 'ward5', 'ward6', 'nurses'] },
  { id: 'facilities', places: ['toilets_g', 'toilets_1', 'water_g', 'waiting_a', 'wheelchair', 'lift_g', 'ramp', 'entrance'] },
];

// Where a patient might be standing when they ask for directions.
export const START_POINTS = ['entrance', 'registration', 'helpdesk', 'waiting_a', 'pharmacy', 'lab', 'lift_1', 'nurses'];

export const HELP_DESKS = ['helpdesk', 'nurses', 'registration'];
