import { chromium, serve, routeThree } from './harness.mjs';
const srv = serve(8791);
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
await routeThree(p, process.env.THREE_DIR);
await p.goto('http://localhost:8791/'); await p.waitForTimeout(800);
console.log(await p.evaluate(() => ['tipologia-a','tipologia-b','tipologia-c','tipologia-d'].map((k) => {
  const m = window.__SR.PLAN_MODELS[k];
  const bb = (list) => { let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; list.forEach((r) => { x0=Math.min(x0,r[0]); y0=Math.min(y0,r[1]); x1=Math.max(x1,r[0]+r[2]); y1=Math.max(y1,r[1]+r[3]); }); return [x0,y0,x1,y1].map((v)=>+v.toFixed(2)); };
  return k + ' blocks=' + JSON.stringify(bb(m.blocks)) + ' outside=' + JSON.stringify((m.outside||[]).map((o)=>o.k+':'+o.r.join(','))) + ' north=' + JSON.stringify(m.north) + ' win=' + m.windows.length + ' blocks0=' + JSON.stringify(m.blocks[0]);
}).join('\n')));
await b.close(); srv.close();
