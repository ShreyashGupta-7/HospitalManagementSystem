// Route finding (Dijkstra's shortest path) and step-by-step directions.
// Directions are returned as data (step objects); src/lib/directionsText.js turns them
// into words in any language, so switching language re-words the same route.

import { POINTS, PLACES, EDGES, FLOORS } from '../data/hospital.js';

const ADJ = {};
for (const e of EDGES) {
  (ADJ[e.from] ||= []).push({ to: e.to, edge: e });
  (ADJ[e.to] ||= []).push({ to: e.from, edge: e });
}

const LEVEL = Object.fromEntries(FLOORS.map((f) => [f.id, f.level]));

/**
 * Shortest path by walking distance. With avoidStairs, paths that have steps are skipped
 * entirely (so the route uses the lift and the ramp).
 * Returns { path: [pointIds], edges: [edges], metres } or null if there is no way.
 */
export function findRoute(from, to, { avoidStairs = false } = {}) {
  if (!POINTS[from] || !POINTS[to]) return null;
  if (from === to) return { path: [from], edges: [], metres: 0 };
  const dist = { [from]: 0 };
  const prev = {};
  const done = new Set();
  // The graph is small (~60 points), so a simple array works as the priority queue.
  const open = [from];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i += 1) if (dist[open[i]] < dist[open[bi]]) bi = i;
    const u = open.splice(bi, 1)[0];
    if (u === to) break;
    if (done.has(u)) continue;
    done.add(u);
    for (const { to: v, edge } of ADJ[u] || []) {
      if (avoidStairs && edge.stairs) continue;
      // Only pass *through* corridors, lifts, stairs and ramps — never through a room.
      if (v !== to && PLACES[v] && !['lift', 'stairs', 'ramp', 'entrance'].includes(PLACES[v].type)) continue;
      const nd = dist[u] + edge.metres;
      if (dist[v] == null || nd < dist[v]) {
        dist[v] = nd;
        prev[v] = { from: u, edge };
        open.push(v);
      }
    }
  }
  if (dist[to] == null) return null;
  const path = [to];
  const edges = [];
  let cur = to;
  while (cur !== from) {
    const p = prev[cur];
    edges.unshift(p.edge);
    path.unshift(p.from);
    cur = p.from;
  }
  return { path, edges, metres: dist[to] };
}

function vec(a, b) {
  return { x: POINTS[b].x - POINTS[a].x, y: POINTS[b].y - POINTS[a].y };
}

// Screen coordinates have y pointing down, so a positive cross product means "to the right".
function turnOf(h, v) {
  const cross = h.x * v.y - h.y * v.x;
  const dot = h.x * v.x + h.y * v.y;
  const deg = (Math.atan2(cross, dot) * 180) / Math.PI;
  if (Math.abs(deg) < 30) return 'straight';
  if (Math.abs(deg) > 150) return 'around';
  return deg > 0 ? 'right' : 'left';
}

const DOOR_TYPES = new Set(['room', 'ward', 'dept', 'service', 'facility']);

/** Doors along the last straight stretch that are on the same side, counted in walking order. */
function doorOrdinal(path, runStart, junctionIdx, dest, heading, side) {
  let count = 0;
  for (let k = runStart + 1; k <= junctionIdx; k += 1) {
    const node = path[k];
    const doors = (ADJ[node] || [])
      .map((a) => a.to)
      .filter((id) => PLACES[id] && DOOR_TYPES.has(PLACES[id].type) && PLACES[id].floor === POINTS[node].floor);
    for (const d of doors) {
      if (turnOf(heading, vec(node, d)) === side) {
        count += 1;
        if (d === dest) return count;
      }
    }
  }
  return null;
}

/**
 * Turns a route into steps:
 *   { type: 'start', place }
 *   { type: 'walk', metres }
 *   { type: 'turn', dir: 'left'|'right'|'around', metres }
 *   { type: 'lift'|'stairs', dir: 'up'|'down', floor }
 *   { type: 'exit', via: 'lift'|'stairs', metres }
 *   { type: 'steps', place, down }   { type: 'ramp' }
 *   { type: 'arrive', place, side: 'left'|'right'|'ahead', ordinal }
 *   { type: 'already', place }
 * Each step also has `at` (point id) and `floor`, so the map can highlight it.
 */
export function buildSteps(route) {
  if (!route) return [];
  const { path, edges } = route;
  const dest = path[path.length - 1];
  if (path.length === 1) return [{ type: 'already', place: dest, at: dest, floor: POINTS[dest].floor }];

  const steps = [{ type: 'start', place: path[0], at: path[0], floor: POINTS[path[0]].floor }];
  let heading = null;
  let runStart = 0;
  const open = () => {
    const last = steps[steps.length - 1];
    return last && ['walk', 'turn', 'exit'].includes(last.type) ? last : null;
  };

  for (let i = 0; i < edges.length; i += 1) {
    const e = edges[i];
    const a = path[i];
    const b = path[i + 1];
    const floor = POINTS[a].floor;

    if (e.kind === 'lift' || e.kind === 'stairs') {
      // Several floors in one go count as one step.
      let j = i;
      while (j + 1 < edges.length && edges[j + 1].kind === e.kind) j += 1;
      const toFloor = POINTS[path[j + 1]].floor;
      steps.push({
        type: e.kind,
        dir: LEVEL[toFloor] > LEVEL[floor] ? 'up' : 'down',
        floor: toFloor,
        at: a,
      });
      i = j;
      heading = null;
      runStart = i + 1;
      steps.push({ type: 'exit', via: e.kind, metres: 0, at: path[i + 1], floor: toFloor });
      continue;
    }

    const v = vec(a, b);

    if (e.kind === 'ramp') {
      if (steps[steps.length - 1]?.type !== 'ramp') steps.push({ type: 'ramp', at: a, floor });
      heading = null; // the ramp bends; start counting turns again at the top
      runStart = i + 1;
      continue;
    }
    if (e.kind === 'steps') {
      const down = POINTS[b].y > POINTS[a].y; // walking out towards the gate
      steps.push({ type: 'steps', place: PLACES[a]?.type === 'entrance' ? a : b, down, at: a, floor });
      heading = null;
      runStart = i + 1;
      continue;
    }

    // Walking up to a lift or the stairs that we are about to take.
    const nextEdge = edges[i + 1];
    if (nextEdge && (nextEdge.kind === 'lift' || nextEdge.kind === 'stairs') && PLACES[b]) {
      const side = heading ? turnOf(heading, v) : 'straight';
      steps.push({ type: 'reach', place: b, side: side === 'left' || side === 'right' ? side : 'ahead', at: b, floor });
      heading = v;
      continue;
    }

    const isLast = i === edges.length - 1;
    if (isLast && PLACES[b]) {
      const side = heading ? turnOf(heading, v) : 'straight';
      let ordinal = null;
      if ((side === 'left' || side === 'right') && heading) ordinal = doorOrdinal(path, runStart, i, b, heading, side);
      // A door right next to where you came in from (no walking) needs no number.
      if (ordinal != null && ordinal > 5) ordinal = null;
      const last = open();
      if (last && last.type === 'exit' && last.metres === 0) last.metres = 0;
      steps.push({
        type: 'arrive',
        place: b,
        side: side === 'left' || side === 'right' ? side : 'ahead',
        ordinal,
        at: b,
        floor: POINTS[b].floor,
      });
      break;
    }

    if (!heading) {
      const last = open();
      if (last) last.metres += e.metres;
      else steps.push({ type: 'walk', metres: e.metres, at: a, floor });
      heading = v;
      continue;
    }

    const turn = turnOf(heading, v);
    if (turn === 'straight') {
      const last = open();
      if (last) last.metres += e.metres;
      else steps.push({ type: 'walk', metres: e.metres, at: a, floor });
    } else {
      steps.push({ type: 'turn', dir: turn, metres: e.metres, at: a, floor });
      runStart = i;
    }
    heading = v;
  }

  // If the destination is a lift/stairs/ramp (no final corridor step), say we arrived.
  if (steps[steps.length - 1].type !== 'arrive') {
    steps.push({ type: 'arrive', place: dest, side: 'ahead', ordinal: null, at: dest, floor: POINTS[dest].floor });
  }
  return steps;
}

/** Points of the route grouped by floor, for drawing on each floor plan. */
export function routeByFloor(route) {
  if (!route) return [];
  const out = [];
  route.path.forEach((id, idx) => {
    const p = POINTS[id];
    let seg = out[out.length - 1];
    if (!seg || seg.floor !== p.floor) {
      seg = { floor: p.floor, points: [] };
      out.push(seg);
    }
    seg.points.push({ id, x: p.x, y: p.y, idx });
  });
  return out;
}

export function usesStairs(route) {
  return Boolean(route && route.edges.some((e) => e.stairs));
}

export function walkMinutes(metres) {
  // A slow walk (about 40 metres a minute) plus waiting for the lift.
  return Math.max(1, Math.round(metres / 40));
}

/** The nearest help point from where the patient is now. */
export function nearestOf(from, candidates, opts) {
  let best = null;
  for (const c of candidates) {
    const r = findRoute(from, c, opts);
    if (r && (!best || r.metres < best.route.metres)) best = { id: c, route: r };
  }
  return best;
}
