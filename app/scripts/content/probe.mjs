import { chromium, serve, routeThree } from './harness.mjs';
const THREE_DIR = process.env.THREE_DIR;
const srv = serve(8790);
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await routeThree(p, THREE_DIR);
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://localhost:8790/');
await p.waitForTimeout(1000);
console.log(await p.evaluate(() => {
  const M = window.__SR.PLAN_MODELS;
  return Object.keys(M).map((k) => k + ' view=' + JSON.stringify(M[k].view) + ' rooms=' + (M[k].rooms || []).map((r) => r.n).join('|') + ' keys=' + Object.keys(M[k]).join(','));
}).then((x) => x.join('\n')));
console.log(await p.evaluate(() => { const s = window.__SR.drawPlan(window.__SR.PLAN_MODELS['tipologia-a'], {}); return s.slice(0, 300) + ' ... len ' + s.length; }));
await b.close(); srv.close();
