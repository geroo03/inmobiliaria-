// Genera las escenas exteriores (día y noche), los cuadros de las transiciones y los hotspots
// a partir de la torre 3D del showroom. Uso: THREE_DIR=... node scenes.mjs <salida> [--frames N] [--only-stills]
import fs from 'node:fs';
import path from 'node:path';
import { chromium, serve, routeThree } from './harness.mjs';

const OUT = path.resolve(process.argv[2] || 'out');
const FRAMES = Number((process.argv.find((a) => a.startsWith('--frames=')) || '--frames=75').split('=')[1]);
const ONLY_STILLS = process.argv.includes('--only-stills');
const W = 1920, H = 1080;
// Ángulo de la cámara alrededor de la torre, en grados desde el norte (frente) hacia el este.
const SCENES = [
  { id: 'frente', name: 'Frente', theta: -28 },
  { id: 'este', name: 'Lateral este', theta: 62 },
  { id: 'contrafrente', name: 'Contrafrente', theta: 152 },
  { id: 'oeste', name: 'Lateral oeste', theta: 242 },
];
const MOMENTS = { dia: { hour: 16.25 }, noche: { hour: 20.75 } };

fs.mkdirSync(OUT, { recursive: true });
const srv = serve(8792);
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await routeThree(page, process.env.THREE_DIR);
page.on('pageerror', (e) => { console.error('Error en la página:', e.message); process.exitCode = 1; });
await page.goto('http://localhost:8792/#edificio');
await page.waitForTimeout(1000);
await page.click('[data-action="torre-open"]');
await page.waitForTimeout(2500);

await page.evaluate(([w, h]) => {
  const { V3 } = window.__SR;
  cancelAnimationFrame(V3.raf); V3.raf = 0;
  if (V3.ro) { V3.ro.disconnect(); V3.ro = null; }
  V3.renderer.setPixelRatio(1);
  V3.renderer.setSize(w, h, false);
  V3.camera.aspect = w / h; V3.camera.fov = 34; V3.camera.updateProjectionMatrix();
  window.__cap = {
    light(hour) {
      const { SUN, S, applySun, torreColors, twEnvUpdate } = window.__SR;
      SUN.live = false; SUN.season = 'otono'; SUN.weather = 'despejado'; SUN.hour = hour; S.disp = false; S.torrePiso = 0;
      applySun(); torreColors();
      V3.envDirty = true; V3.envT = 0; twEnvUpdate();
    },
    cam(theta) {
      const t = theta * Math.PI / 180, R = 80, Y = 33;
      V3.camera.position.set(R * Math.sin(t), Y, -R * Math.cos(t));
      V3.camera.lookAt(0, 14.5, 0);
      V3.camera.updateMatrixWorld();
    },
    shot(q) { V3.renderer.render(V3.scene, V3.camera); return V3.renderer.domElement.toDataURL('image/jpeg', q); },
    // Contorno de una caja proyectado a la imagen (cápsula convexa), en coordenadas 0–1.
    hull(x0, x1, y0, y1, z0, z1) {
      const pts = [];
      for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) {
        const v = new THREE.Vector3(x, y, z).project(V3.camera);
        pts.push([(v.x + 1) / 2, (1 - v.y) / 2]);
      }
      pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lower = [], upper = [];
      for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
      for (const p of pts.slice().reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
      return lower.slice(0, -1).concat(upper.slice(0, -1)).map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]);
    },
    point(x, y, z) { const v = new THREE.Vector3(x, y, z).project(V3.camera); return [+((v.x + 1) / 2).toFixed(4), +((1 - v.y) / 2).toFixed(4)]; },
  };
}, [W, H]);

const save = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
const geo = await page.evaluate(() => { const s = window.__SR; return { w: s.TW_W, d: s.TW_D, pb: s.TW_PB, fh: s.TW_FH, pisos: s.PISOS }; });
const hw = geo.w / 2 + .15, hd = geo.d / 2 + 1.6; // la torre con sus balcones
const top = geo.pb + geo.pisos * geo.fh;

const meta = { width: W, height: H, scenes: [] };
for (const sc of SCENES) {
  await page.evaluate((t) => window.__cap.cam(t), sc.theta);
  const hotspots = await page.evaluate(([hw, hd, top, g]) => {
    const c = window.__cap, floors = [];
    for (let p = 1; p <= g.pisos; p++) {
      const y0 = g.pb + (p - 1) * g.fh;
      floors.push({ level: p, polygon: c.hull(-hw, hw, y0, y0 + g.fh, -hd, hd), anchor: c.point(0, y0 + g.fh / 2, 0) });
    }
    return { tower: c.hull(-hw, hw, 0, top + 2.6, -hd, hd), towerAnchor: c.point(0, top + 4.5, 0), floors };
  }, [hw, hd, top, geo]);
  meta.scenes.push({ ...sc, ...hotspots });
  for (const [m, cfg] of Object.entries(MOMENTS)) {
    await page.evaluate((h) => window.__cap.light(h), cfg.hour);
    await page.evaluate((t) => window.__cap.cam(t), sc.theta);
    save(path.join(OUT, `${sc.id}-${m}.jpg`), await page.evaluate(() => window.__cap.shot(0.93)));
    console.log('escena', sc.id, m);
  }
}
fs.writeFileSync(path.join(OUT, 'scenes.json'), JSON.stringify(meta, null, 1));

if (!ONLY_STILLS) {
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  for (const [m, cfg] of Object.entries(MOMENTS)) {
    await page.evaluate((h) => window.__cap.light(h), cfg.hour);
    for (let i = 0; i < SCENES.length; i++) {
      const a = SCENES[i], b = SCENES[(i + 1) % SCENES.length];
      const dir = path.join(OUT, 'frames', `${a.id}__${b.id}-${m}`);
      fs.mkdirSync(dir, { recursive: true });
      const t0 = Date.now();
      for (let f = 0; f < FRAMES; f++) {
        const k = ease(f / (FRAMES - 1));
        const thB = b.theta < a.theta ? b.theta + 360 : b.theta;
        await page.evaluate((t) => window.__cap.cam(t), a.theta + (thB - a.theta) * k);
        save(path.join(dir, String(f).padStart(4, '0') + '.jpg'), await page.evaluate(() => window.__cap.shot(0.9)));
      }
      console.log('transición', a.id, '→', b.id, m, ((Date.now() - t0) / 1000).toFixed(1) + ' s');
    }
  }
}
await browser.close(); srv.close();
