// A floor plan drawn in SVG, with the route on top.
import { PLACES, JUNCTIONS, EDGES, POINTS } from '../data/hospital.js';
import { useT } from '../lib/i18n.jsx';

const TYPE_STYLE = {
  room: { fill: '#e0f2ef', stroke: '#0d6559' },
  dept: { fill: '#fde2e2', stroke: '#b41818' },
  ward: { fill: '#e6ecfd', stroke: '#1d3eaa' },
  service: { fill: '#fef3c7', stroke: '#8a3c0a' },
  facility: { fill: '#eef2f7', stroke: '#475569' },
  lift: { fill: '#dbe4ee', stroke: '#334155' },
  stairs: { fill: '#e5e1da', stroke: '#57534e' },
  ramp: { fill: '#dcf7e4', stroke: '#145f32' },
  entrance: { fill: '#dcf7e4', stroke: '#145f32' },
};

function wrap(text, max) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

export default function FloorPlan({ floor, points = [], from, to, active, big = false, label }) {
  const t = useT();
  const places = Object.entries(PLACES).filter(([, p]) => p.floor === floor);
  const corridors = EDGES.filter((e) => JUNCTIONS[e.from] && JUNCTIONS[e.to] && JUNCTIONS[e.from].floor === floor);
  const doors = EDGES.filter(
    (e) => (PLACES[e.from] || PLACES[e.to]) && POINTS[e.from].floor === floor && POINTS[e.to].floor === floor,
  );
  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const start = points[0];
  const end = points[points.length - 1];
  const startIsFrom = start && start.id === from;
  const endIsTo = end && end.id === to;
  const activePt = active && POINTS[active] && POINTS[active].floor === floor ? POINTS[active] : null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <svg
        viewBox="0 0 400 300"
        className="block"
        style={{ width: big ? '200%' : '100%', minWidth: big ? 720 : undefined }}
        role="img"
        aria-label={label}
      >
        <rect x="0" y="0" width="400" height="300" fill="#f4f7f6" />
        <rect x="4" y="30" width="392" height="232" rx="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
        {floor === 'G' ? <rect x="160" y="200" width="200" height="98" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" /> : null}
        {floor === 'G' ? <rect x="162" y="200" width="196" height="6" fill="#ffffff" /> : null}

        {corridors.map((e) => (
          <line
            key={`${e.from}-${e.to}`}
            x1={POINTS[e.from].x}
            y1={POINTS[e.from].y}
            x2={POINTS[e.to].x}
            y2={POINTS[e.to].y}
            stroke="#e3e9e7"
            strokeWidth="30"
            strokeLinecap="square"
          />
        ))}
        {doors.map((e) => (
          <line
            key={`d-${e.from}-${e.to}`}
            x1={POINTS[e.from].x}
            y1={POINTS[e.from].y}
            x2={POINTS[e.to].x}
            y2={POINTS[e.to].y}
            stroke="#e3e9e7"
            strokeWidth="12"
          />
        ))}

        {places.map(([id, p]) => {
          const st = TYPE_STYLE[p.type] || TYPE_STYLE.facility;
          const [bx, by, bw, bh] = p.box || [p.x - 15, p.y - 15, 30, 30];
          const isTarget = id === to;
          const name = t.placeShort(id);
          const fs = bw < 45 ? 8.5 : 10;
          const maxChars = Math.max(5, Math.floor(bw / (fs * 0.62)));
          const lines = wrap(name, maxChars);
          const cy = id === 'waiting_a' ? by + 16 : by + bh / 2;
          return (
            <g key={id}>
              <rect
                x={bx}
                y={by}
                width={bw}
                height={bh}
                rx="4"
                fill={st.fill}
                stroke={isTarget ? '#b41818' : st.stroke}
                strokeWidth={isTarget ? 3 : 1.4}
              />
              {id === 'waiting_a'
                ? Array.from({ length: 12 }).map((_, i) => (
                    <rect
                      key={i}
                      x={bx + 10 + (i % 6) * 17}
                      y={by + 34 + Math.floor(i / 6) * 14}
                      width="11"
                      height="8"
                      rx="2"
                      fill="#2563eb"
                      opacity="0.75"
                    />
                  ))
                : null}
              {lines.map((ln, i) => (
                <text
                  key={i}
                  x={bx + bw / 2}
                  y={cy + (i - (lines.length - 1) / 2) * (fs + 2) + 3}
                  textAnchor="middle"
                  fontSize={fs}
                  fontWeight="700"
                  fill="#111827"
                >
                  {ln}
                </text>
              ))}
            </g>
          );
        })}

        {points.length > 1 ? (
          <>
            <polyline points={line} fill="none" stroke="#ffffff" strokeWidth="11" strokeLinejoin="round" strokeLinecap="round" />
            <polyline
              points={line}
              fill="none"
              stroke="#1d4ed8"
              strokeWidth="6"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="route-line"
            />
          </>
        ) : null}
        {activePt ? <circle cx={activePt.x} cy={activePt.y} r="12" fill="none" stroke="#f59e0b" strokeWidth="4" /> : null}
        {start ? (
          <g>
            <circle cx={start.x} cy={start.y} r="9" fill={startIsFrom ? '#145f32' : '#1d4ed8'} stroke="#fff" strokeWidth="3" />
            <text
              x={start.x}
              y={start.y - 14}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill={startIsFrom ? '#145f32' : '#1d4ed8'}
              stroke="#fff"
              strokeWidth="3"
              paintOrder="stroke"
            >
              {startIsFrom ? t('find.youAreHere') : t.placeShort(start.id)}
            </text>
          </g>
        ) : null}
        {end && points.length > 1 ? (
          <g>
            <path d={`M${end.x} ${end.y} l-8 -14 a9 9 0 1 1 16 0 z`} fill={endIsTo ? '#b41818' : '#1d4ed8'} stroke="#fff" strokeWidth="2" />
            <circle cx={end.x} cy={end.y - 17} r="3.5" fill="#fff" />
            {!endIsTo ? (
              <text
                x={end.x}
                y={end.y + 18}
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fill="#1d4ed8"
                stroke="#fff"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {t.placeShort(end.id)}
              </text>
            ) : null}
          </g>
        ) : null}
        <text x="10" y="20" fontSize="13" fontWeight="800" fill="#111827">
          {t.floor(floor)}
        </text>
      </svg>
    </div>
  );
}
