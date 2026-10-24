import qrcode from 'qrcode-generator';

/** Returns a square grid of booleans (true = dark) for the text. */
export function qrMatrix(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const rows = [];
  for (let r = 0; r < n; r += 1) {
    const row = [];
    for (let c = 0; c < n; c += 1) row.push(qr.isDark(r, c));
    rows.push(row);
  }
  return rows;
}

export function turnUrl(token) {
  return `${window.location.origin}/turn/${encodeURIComponent(token)}`;
}

/** Reads a token out of a scanned QR (a /turn/ link) or typed text, e.g. "med 42" -> "MED-042". */
export function parseToken(text) {
  const s = String(text || '').trim();
  const fromUrl = s.match(/\/turn\/([A-Za-z]{3}-?\d{1,3})/);
  const raw = fromUrl ? fromUrl[1] : s;
  const m = raw.toUpperCase().replace(/\s+/g, '').match(/^([A-Z]{3})-?(\d{1,3})$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(3, '0')}`;
}

/** How a token should be read aloud: "MED-042" -> "MED 42". */
export function spokenToken(token) {
  const [code, num] = String(token).split('-');
  return num ? `${code.split('').join(' ')}, ${Number(num)}` : String(token);
}
