import { useMemo } from 'react';
import { qrMatrix } from '../lib/qr.js';

export default function QRCode({ text, size = 180, label }) {
  const m = useMemo(() => qrMatrix(text), [text]);
  const n = m.length;
  const pad = 4;
  let d = '';
  m.forEach((row, r) =>
    row.forEach((dark, c) => {
      if (dark) d += `M${c + pad} ${r + pad}h1v1h-1z`;
    }),
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${n + pad * 2} ${n + pad * 2}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect width="100%" height="100%" fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}
