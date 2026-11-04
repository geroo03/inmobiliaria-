// Arma una copia local del showroom con sus funciones internas expuestas en window.__SR,
// para generar contenido (escenas, transiciones, plantas) a partir del mismo modelo 3D.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const { chromium } = require('playwright');

const here = path.dirname(new URL(import.meta.url).pathname);
export const SHOWROOM = path.resolve(here, '../../../showroom');

const EXPOSE = `
  window.__SR = { V3: V3, S: S, SUN: SUN, TW: TW, PLAN_MODELS: PLAN_MODELS, UNITS: UNITS,
    build3d: build3d, drawPlan: drawPlan, applySun: applySun, torreColors: torreColors, twEnvUpdate: twEnvUpdate,
    renderVitrina: renderVitrina, openVitrina: openVitrina, v3Tone: v3Tone, TW_W: TW_W, TW_D: TW_D, TW_PB: TW_PB, TW_FH: TW_FH, PISOS: PISOS };
})();`;

export function buildPage() {
  const src = fs.readFileSync(path.join(SHOWROOM, 'showroom.html'), 'utf8');
  const i = src.lastIndexOf('})();');
  if (i < 0) throw new Error('No se encontró el cierre del script del showroom');
  // La plataforma de Artifacts agrega este documento base alrededor del fragmento.
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + src.slice(0, i) + EXPOSE + src.slice(i + 5) + '</body></html>';
  return html;
}

export function serve(port, threeDir) {
  const html = buildPage();
  return http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    if (u === '/' || u === '/index.html') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end(html); }
    const f = path.join(SHOWROOM, u);
    if (f.startsWith(SHOWROOM) && fs.existsSync(f) && fs.statSync(f).isFile()) { r.writeHead(200); return r.end(fs.readFileSync(f)); }
    r.writeHead(404); r.end();
  }).listen(port);
}

// El CDN de jsDelivr no es accesible desde este entorno: se sirve three@0.128.0 desde una copia local.
export async function routeThree(page, threeDir) {
  await page.route('https://cdn.jsdelivr.net/**', (r) => r.fulfill({
    status: 200, contentType: 'application/javascript',
    body: fs.readFileSync(path.join(threeDir, r.request().url().split('three@0.128.0/')[1])),
  }));
}
