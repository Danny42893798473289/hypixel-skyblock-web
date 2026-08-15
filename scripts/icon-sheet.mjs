/** Zoomed capture of one menu's slots, for eyeballing icon clarity. */
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.env.SHOT_URL ?? 'http://localhost:3001';
const target = process.argv[2] ?? 'Bank';
const outFile = process.argv[3] ?? '/tmp/aether-shots/zoom.png';
fs.mkdirSync('/tmp/aether-shots', { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const context = await browser.newContext({ viewport: { width: 1000, height: 760 }, deviceScaleFactor: 4 });
const page = await context.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.fill('input[name="username"], input[placeholder*="ame" i]', `zoom_${Math.random().toString(36).slice(2, 7)}`);
await page.fill('input[type="password"]', 'testpass');
await page.getByRole('button', { name: /register|create/i }).first().click();
await page.waitForSelector('canvas');
await page.waitForTimeout(1200);
await page.keyboard.press('m');
await page.waitForTimeout(600);
if (target !== 'skyblock') {
  await page.locator(`.chest-grid [aria-label="${target}"]`).first().click();
  await page.waitForTimeout(600);
}
await page.locator('.chest-grid').first().screenshot({ path: outFile });
await browser.close();
console.log(`wrote ${outFile}`);
