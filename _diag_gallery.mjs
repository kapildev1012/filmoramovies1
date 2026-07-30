import { chromium } from '/Users/kapildev/.npm/_npx/6f4879659183bc49/node_modules/playwright/index.mjs';

const BASE = process.argv[2] || 'https://filmoramovie.kapil16072004.workers.dev';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
const failed = [];
const galleryReqs = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', (r) => failed.push(r.url() + ' :: ' + (r.failure()?.errorText || '')));
page.on('response', (r) => {
  const u = r.url();
  if (/gallery|three|drei|fiber/i.test(u)) galleryReqs.push(r.status() + '  ' + u.split('/').pop());
});

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
// Let client:idle islands hydrate first.
await page.waitForTimeout(4000);
// Now bring the gallery into view and give the IO + lazy chunk time.
await page.evaluate(() => {
  const s = document.querySelector('[aria-label="Featured gallery"]');
  if (s) s.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(6000);

const info = await page.evaluate(() => {
  const sec = document.querySelector('[aria-label="Featured gallery"]');
  if (!sec) return { present: false };
  const r = sec.getBoundingClientRect();
  const cs = getComputedStyle(sec);
  const canvas = sec.querySelector('canvas');
  const cr = canvas?.getBoundingClientRect();
  const h2 = sec.querySelector('h2');
  return {
    present: true,
    rect: { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + window.scrollY) },
    display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
    hasCanvas: !!canvas,
    canvasRect: cr ? { w: Math.round(cr.width), h: Math.round(cr.height) } : null,
    imgCount: sec.querySelectorAll('img').length,
    fallbackText: /WebGL not supported/i.test(sec.innerText) ? sec.innerText.slice(0, 80) : null,
    headline: h2?.textContent?.trim() || null,
  };
});

console.log('FeaturedGallery:', JSON.stringify(info, null, 2));
console.log('Gallery/three requests:', galleryReqs.length);
galleryReqs.slice(0, 15).forEach((r) => console.log('  ' + r));
console.log('Failed requests:', failed.length);
failed.slice(0, 15).forEach((f) => console.log('  ' + f));
console.log('Errors captured:', errors.length);
errors.slice(0, 25).forEach((e) => console.log('  ' + e));

await page.screenshot({ path: '/tmp/home_full.png', fullPage: true });
if (info.present) {
  await page.evaluate(() => document.querySelector('[aria-label="Featured gallery"]').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/gallery.png' });
}
console.log('Screenshots: /tmp/home_full.png, /tmp/gallery.png');

await browser.close();
