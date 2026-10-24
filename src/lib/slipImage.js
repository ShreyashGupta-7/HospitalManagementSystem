// Draws the OPD slip on a canvas and saves it as a PNG picture (no library needed).
import { qrMatrix } from './qr.js';

export async function saveSlipImage({ token, lines, qrText, title, footer, filename }) {
  const W = 720;
  const H = 1080;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const font = (w, s) => `${w} ${s}px "Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", "Nirmala UI", system-ui, sans-serif`;

  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#0d6559';
  g.fillRect(0, 0, W, 110);
  g.fillStyle = '#ffffff';
  g.font = font('700', 40);
  g.fillText(title, 36, 70);

  g.fillStyle = '#111827';
  g.font = font('600', 30);
  g.fillText(lines[0]?.label || '', 36, 170);
  g.font = font('800', 120);
  g.fillText(token, 36, 290);

  let y = 360;
  for (const { label, value } of lines.slice(1)) {
    g.fillStyle = '#404c5c';
    g.font = font('600', 26);
    g.fillText(label, 36, y);
    g.fillStyle = '#111827';
    g.font = font('700', 36);
    wrapText(g, value, 36, y + 44, W - 72, 42);
    y += 110;
  }

  const m = qrMatrix(qrText);
  const n = m.length;
  const size = 260;
  const cell = Math.floor(size / (n + 8));
  const qx = W - 36 - cell * (n + 8);
  const qy = H - 70 - cell * (n + 8);
  g.fillStyle = '#ffffff';
  g.fillRect(qx, qy, cell * (n + 8), cell * (n + 8));
  g.fillStyle = '#000000';
  m.forEach((row, r) => row.forEach((dark, col) => {
    if (dark) g.fillRect(qx + (col + 4) * cell, qy + (r + 4) * cell, cell, cell);
  }));

  g.fillStyle = '#404c5c';
  g.font = font('500', 22);
  wrapText(g, footer, 36, H - 40, W - 72 - cell * (n + 8) - 10, 28);

  const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

function wrapText(g, text, x, y, maxW, lh) {
  const words = String(text).split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else line = test;
  }
  if (line) g.fillText(line, x, yy);
}
