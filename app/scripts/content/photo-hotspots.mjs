// Arma los polígonos de la torre y de cada piso sobre las fotos, a partir de photos.params.json.
// Uso: node scripts/content/photo-hotspots.mjs > src/data/seed/torre-algarrobo/fotos.json
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const { photos } = JSON.parse(fs.readFileSync(path.join(here, 'photos.params.json'), 'utf8'));

const r4 = (v) => +v.toFixed(4);
const out = {};
for (const [key, p] of Object.entries(photos)) {
  const { width: W, height: H, front, side, slabs } = p;
  const n = (x, y) => [r4(x / W), r4(y / H)];
  // Desvío vertical de la pared lateral según la altura (interpolación lineal entre las dos medidas).
  const [[ya, da], [yb, db]] = side.d;
  const d = (y) => da + ((y - ya) * (db - da)) / (yb - ya);
  const sideLeft = side.x < front.left;
  const band = (yTop, yBottom, withSide = true) => {
    const f = [[front.left, yTop], [front.right, yTop + front.slope], [front.right, yBottom + front.slope], [front.left, yBottom]];
    if (!withSide) return f.map(([x, y]) => n(x, y));
    const s = [[side.x, yTop + d(yTop)], [side.x, yBottom + d(yBottom)]];
    const pts = sideLeft
      ? [s[0], f[0], f[1], f[2], f[3], s[1]]
      : [f[0], f[1], s[0], s[1], f[2], f[3]];
    return pts.map(([x, y]) => n(x, y));
  };
  const floors = [];
  for (let level = 1; level < slabs.length; level++) {
    const yBottom = slabs[level - 1], yTop = slabs[level];
    // En los pisos bajos la pared lateral queda tapada por las casas vecinas: solo cuenta la fachada.
    floors.push({ level, polygon: band(yTop, yBottom, level >= (side.fromLevel ?? 1)), anchor: n((front.left + front.right) / 2, (yTop + yBottom) / 2) });
  }
  out[key] = {
    file: p.file,
    width: W,
    height: H,
    tower: band(p.top, p.ground),
    towerAnchor: n((front.left + front.right) / 2, Math.max(p.top - 30, 10)),
    floors,
  };
}
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
