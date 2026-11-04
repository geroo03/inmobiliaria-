// Genera la planta tipo del piso: render cenital 3D (JPG) y plano técnico 2D (SVG) con el mismo encuadre,
// y las máscaras de cada unidad en coordenadas 0–1. Uso: THREE_DIR=... node floors.mjs <salida> [--px-per-m=122]
import fs from 'node:fs';
import path from 'node:path';
import { chromium, serve, routeThree } from './harness.mjs';

const OUT = path.resolve(process.argv[2] || 'out');
fs.mkdirSync(OUT, { recursive: true });

// Planta tipo en metros (x hacia el este, y hacia el sur). Norte arriba.
const UNITS = [
  { letter: 'A', model: 'tipologia-a', at: [0, 0] },
  { letter: 'B', model: 'tipologia-b', at: [8.2, 0] },
  { letter: 'D', model: 'tipologia-d', at: [0, 11.2] },
  { letter: 'C', model: 'tipologia-c', at: [5, 10.7] },
];
// Encuadre 2:3 (el formato vertical de los generadores de imágenes), centrado en el piso con sus balcones.
const BOUNDS = { x0: -1.2, y0: -3.85, w: 16.8, h: 25.2 };
const PX_PER_M = Number((process.argv.find((a) => a.startsWith('--px-per-m=')) || '--px-per-m=100').split('=')[1]);

const srv = serve(8793);
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await routeThree(page, process.env.THREE_DIR);
page.on('pageerror', (e) => { console.error('Error en la página:', e.message); process.exitCode = 1; });
await page.goto('http://localhost:8793/');
await page.waitForTimeout(800);

const result = await page.evaluate(([UNITS, B, PPM]) => {
  const SR = window.__SR, M = SR.PLAN_MODELS;
  const blockOf = (k) => M[k].blocks[0];
  const C = (h) => new THREE.Color(h).convertSRGBToLinear();
  const std = (h, o) => new THREE.MeshStandardMaterial(Object.assign({ color: C(h), roughness: .85 }, o || {}));
  const boxAt = (g, x, y0, z, w, h, d, material) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x + w / 2, y0 + h / 2, z + d / 2); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  };

  // ---------- 3D cenital ----------
  const W = Math.round(B.w * PPM), H = Math.round(B.h * PPM);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x6F8B5E);
  scene.add(new THREE.HemisphereLight(0xF4F7FA, 0x7A8270, .75));
  const sun = new THREE.DirectionalLight(0xFFF3E2, .95);
  const cx = B.x0 + B.w / 2, cz = B.y0 + B.h / 2;
  sun.position.set(cx - 9, 40, cz - 14); sun.target.position.set(cx, 0, cz);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 90 });
  scene.add(sun); scene.add(sun.target);
  const root = new THREE.Group(); scene.add(root);
  const slab = std(0xE7E2DA), core = std(0xD9D4CB), wall = std(0xEDE7DC), dark = std(0x39434A, { roughness: .5 }), stair = std(0xC9C3B8);
  boxAt(root, B.x0 - 30, -4, B.y0 - 30, B.w + 60, .1, B.h + 60, std(0x7C9868)); // terreno, abajo
  boxAt(root, -.25, -.35, -.25, 14.9, .3, 18.3, slab);                            // losa del piso
  // Núcleo: pasillo, ascensores y escalera.
  boxAt(root, 0, -.05, 7.4, 14.4, .06, 3.8, core);
  boxAt(root, 11.2, -.05, 10.7, 3.2, .06, 7.1, core);
  boxAt(root, 11.2, 0, 13.0, .2, 2.6, 4.8, wall); boxAt(root, 14.2, 0, 10.7, .2, 2.6, 7.1, wall); boxAt(root, 11.2, 0, 17.6, 3.2, 2.6, .2, wall);
  boxAt(root, 11.4, 0, 10.9, 1.3, 2.4, 1.3, dark); boxAt(root, 12.9, 0, 10.9, 1.3, 2.4, 1.3, dark);
  for (let i = 0; i < 9; i++) boxAt(root, 11.5, 0, 13.3 + i * .27, 1.2, .1 + i * .16, .27, stair);
  for (let i = 0; i < 9; i++) boxAt(root, 12.8, 0, 17.3 - i * .27, 1.2, 1.5 + i * .12, .27, stair);
  boxAt(root, 12.7, 0, 13.3, .1, 2.6, 4.2, wall);
  UNITS.forEach((u) => {
    const built = SR.build3d(M[u.model], false);
    built.group.remove(built.group.children[0]); // el terreno propio de cada tipología
    built.group.position.set(u.at[0], 0, u.at[1]);
    root.add(built.group);
  });
  const cam = new THREE.OrthographicCamera(-B.w / 2, B.w / 2, B.h / 2, -B.h / 2, .1, 200);
  cam.position.set(cx, 60, cz); cam.up.set(0, 0, -1); cam.lookAt(cx, 0, cz);
  renderer.render(scene, cam);
  const jpg = renderer.domElement.toDataURL('image/jpeg', .92);

  // ---------- 2D técnico ----------
  const css = getComputedStyle(document.documentElement);
  const v = (n) => css.getPropertyValue(n).trim();
  const P = (m) => +(m * 50).toFixed(1);
  const parser = new DOMParser();
  let body = '';
  UNITS.forEach((u) => {
    const doc = parser.parseFromString(SR.drawPlan(M[u.model], { label: '', caption: '' }), 'image/svg+xml');
    const svg = doc.documentElement, kids = Array.from(svg.childNodes);
    const cut = kids.findIndex((n) => n.getAttribute && /\bpl-dim\b/.test(n.getAttribute('class') || ''));
    kids.slice(cut < 0 ? kids.length : cut).forEach((n) => svg.removeChild(n)); // cotas, norte y rótulo de cada tipología
    // El pasillo de cada tipología pasa a ser el palier común: se quitan sus rótulos repetidos.
    Array.from(svg.querySelectorAll('text')).filter((t) => /^Pasillo/.test(t.textContent)).forEach((t) => t.remove());
    body += '<g transform="translate(' + P(u.at[0]) + ' ' + P(u.at[1]) + ')">' + svg.innerHTML + '</g>';
  });
  const R = (x, y, w, h, cls) => '<rect class="' + cls + '" x="' + P(x) + '" y="' + P(y) + '" width="' + P(w) + '" height="' + P(h) + '"/>';
  let coreSvg = R(0, 7.4, 14.4, 3.8, 'pl-floor') + R(11.2, 10.7, 3.2, 7.1, 'pl-floor');
  coreSvg += R(11.2, 13.0, .2, 4.8, 'pl-wall') + R(14.2, 10.7, .2, 7.1, 'pl-wall') + R(11.2, 17.6, 3.2, .2, 'pl-wall') + R(12.7, 13.3, .1, 4.2, 'pl-wall');
  [[11.4, 10.9], [12.9, 10.9]].forEach(([x, y]) => {
    coreSvg += R(x, y, 1.3, 1.3, 'pl-fur') + '<path class="pl-furl" d="M' + P(x) + ' ' + P(y) + 'L' + P(x + 1.3) + ' ' + P(y + 1.3) + 'M' + P(x + 1.3) + ' ' + P(y) + 'L' + P(x) + ' ' + P(y + 1.3) + '"/>';
  });
  for (let i = 0; i <= 15; i++) coreSvg += '<line class="pl-furl" x1="' + P(11.5) + '" x2="' + P(14) + '" y1="' + P(13.3 + i * .27) + '" y2="' + P(13.3 + i * .27) + '"/>';
  coreSvg += '<text class="pl-rn" x="' + P(5.6) + '" y="' + P(9.45) + '" text-anchor="middle">Palier</text>';
  const defs = Array.from(document.querySelectorAll('pattern#deck, pattern#grass')).map((p) => p.outerHTML).join('')
    .replace(/var\((--[a-z0-9-]+)\)/g, (_, n) => v(n)); // el SVG suelto no tiene las variables de la página
  const style = '.pl-wall{fill:' + v('--wall') + '}.pl-floor,.pl-cut{fill:' + v('--floor') + '}.pl-winl{stroke:' + v('--wall') + ';stroke-width:1}' +
    '.pl-wing{stroke:' + v('--glass-line') + ';stroke-width:2.5}.pl-leaf{stroke:' + v('--ink') + ';stroke-width:1.6}.pl-arc{fill:none;stroke:' + v('--ink') + ';stroke-width:.8;stroke-dasharray:3 2}' +
    '.pl-fur{fill:' + v('--floor') + ';stroke:' + v('--furn') + ';stroke-width:1}.pl-furl{fill:none;stroke:' + v('--furn') + ';stroke-width:.8}.pl-furt{font-size:9px;fill:' + v('--furn') + '}' +
    '.pl-rn{font-size:13px;font-weight:700;fill:' + v('--ink') + '}.pl-rd{font-size:11px;fill:' + v('--muted') + '}.pl-deck{fill:url(#deck)}.pl-grass{fill:url(#grass)}' +
    '.pl-path{fill:' + v('--floor') + '}.pl-rail{stroke:' + v('--furn') + ';stroke-width:1.2;stroke-dasharray:2 2}text{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + [P(B.x0), P(B.y0), P(B.w), P(B.h)].join(' ') + '" width="' + W + '" height="' + H + '">' +
    '<defs>' + defs + '<style>' + style + '</style></defs>' +
    R(B.x0, B.y0, B.w, B.h, 'bg').replace('class="bg"', 'fill="#F5F3EE"') + R(-.25, -.25, 14.9, 18.3, 'pl-wall') + coreSvg + body + '</svg>';

  const units = UNITS.map((u) => {
    const b = blockOf(u.model), x = u.at[0] + b[0], y = u.at[1] + b[1];
    const nx = (px) => +((px - B.x0) / B.w).toFixed(4), ny = (py) => +((py - B.y0) / B.h).toFixed(4);
    return { letter: u.letter, model: u.model,
      polygon: [[nx(x), ny(y)], [nx(x + b[2]), ny(y)], [nx(x + b[2]), ny(y + b[3])], [nx(x), ny(y + b[3])]],
      anchor: [nx(x + b[2] / 2), ny(y + b[3] / 2)] };
  });
  return { jpg, svg, width: W, height: H, units };
}, [UNITS, BOUNDS, PX_PER_M]);

fs.writeFileSync(path.join(OUT, 'planta-3d.jpg'), Buffer.from(result.jpg.split(',')[1], 'base64'));
fs.writeFileSync(path.join(OUT, 'planta-2d.svg'), result.svg);
fs.writeFileSync(path.join(OUT, 'floor.json'), JSON.stringify({ width: result.width, height: result.height, units: result.units }, null, 1));
console.log('planta lista', result.width + 'x' + result.height);
await browser.close(); srv.close();
