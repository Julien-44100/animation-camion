// Frame-accurate export of the animation to MP4 (Playwright + ffmpeg).
//   node scripts/render.mjs landscape          -> exports/nowirly-motion-16x9.mp4
//   node scripts/render.mjs portrait           -> exports/nowirly-motion-9x16.mp4
//   node scripts/render.mjs stills landscape 3,9.5,31 [outDir]   -> PNG stills at those times
// Env: FPS (default 60), WORKERS (parallel browser pages, default 3), CRF (default 17)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Playwright may be installed globally (NODE_PATH) or locally; CommonJS resolution covers both.
const { chromium } = createRequire(import.meta.url)('playwright');
const gsapFile = path.join(root, 'node_modules/gsap/dist/gsap.min.js');
const pageFile = path.join(root, 'nowirly-motion.html');

const args = process.argv.slice(2);
const stills = args[0] === 'stills';
const fmtArg = stills ? args[1] : args[0] || 'landscape';
const isP = /^(p|portrait|vertical|9x16)$/i.test(fmtArg || '');
const W = isP ? 1080 : 1920, H = isP ? 1920 : 1080;
const tag = isP ? '9x16' : '16x9';
const FPS = Number(process.env.FPS || 60);
const WORKERS = Math.max(1, Number(process.env.WORKERS || Math.min(3, os.cpus().length)));
const CRF = String(process.env.CRF || 17);

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page error]', e.message));
  // The page loads GSAP from cdnjs; serve the identical npm build locally so rendering works offline.
  await page.route('https://cdnjs.cloudflare.com/**', route => route.fulfill({ path: gsapFile, contentType: 'text/javascript' }));
  const url = pathToFileURL(pageFile).href + `?render=${isP ? 'P' : 'L'}`;
  await page.goto(url);
  await page.waitForFunction(() => window.__nowirly && window.__nowirly.ready, null, { timeout: 30000 });
  return page;
}

const browser = await chromium.launch();
try {
  if (stills) {
    const times = (args[2] || '1,5,10,16,22,27,31').split(',').map(Number);
    const outDir = path.resolve(args[3] || path.join(root, 'exports/stills'));
    fs.mkdirSync(outDir, { recursive: true });
    const page = await openPage(browser);
    for (const t of times) {
      await page.evaluate(v => window.__nowirly.seek(v), t);
      const file = path.join(outDir, `${tag}-${String(t).replace('.', '_')}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    }
  } else {
    const duration = await (async () => { const p = await openPage(browser); const d = await p.evaluate(() => window.__nowirly.duration); await p.close(); return d; })();
    const total = Math.round(duration * FPS);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nowirly-'));
    const chunk = Math.ceil(total / WORKERS);
    let doneFrames = 0;
    const t0 = Date.now();
    const parts = await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
      const from = w * chunk, to = Math.min(total, from + chunk);
      if (from >= to) return null;
      const out = path.join(tmp, `part-${w}.mp4`);
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
        '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', CRF,
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
      const closed = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))));
      const page = await openPage(browser);
      for (let i = from; i < to; i++) {
        await page.evaluate(v => window.__nowirly.seek(v), i / FPS);
        const buf = await page.screenshot({ type: 'png' });
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
        doneFrames++;
        if (doneFrames % 60 === 0) process.stdout.write(`\r${tag}: ${doneFrames}/${total} frames (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
      }
      ff.stdin.end();
      await closed;
      await page.close();
      return out;
    }));
    process.stdout.write('\n');
    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
    fs.mkdirSync(path.join(root, 'exports'), { recursive: true });
    const final = path.join(root, `exports/nowirly-motion-${tag}.mp4`);
    await new Promise((res, rej) => {
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', final], { stdio: 'inherit' });
      ff.on('close', c => (c === 0 ? res() : rej(new Error('concat failed'))));
    });
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`${final} · ${total} frames @ ${FPS} fps · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
} finally {
  await browser.close();
}
