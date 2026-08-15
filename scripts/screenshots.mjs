/**
 * Drives the built client in Chromium to capture the world, a couple of menus
 * and the mobile layout. Screenshots land in /tmp/aether-shots.
 */
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.env.SHOT_URL ?? 'http://localhost:3001';
const outDir = '/tmp/aether-shots';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
});

async function session(name, viewport, isMobile) {
  const context = await browser.newContext({ viewport, hasTouch: isMobile, isMobile });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => {
    errors.push(String(error));
    console.log(`   page error: ${error}`);
  });
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    errors.push(message.text());
    console.log(`   console error: ${message.text()}`);
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });

  const username = `${name}_${Math.random().toString(36).slice(2, 7)}`;
  await page.screenshot({ path: `${outDir}/00-${name}-landing.png` });
  await page.fill('input[name="username"], input[placeholder*="ame" i]', username);
  await page.fill('input[type="password"]', 'testpass');
  const register = page.getByRole('button', { name: /register|create/i });
  await (await register.count() ? register.first() : page.getByRole('button').first()).click();
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(1500);
  return { page, context, errors };
}

// ── Desktop: world, menus, chat ───────────────────────────────────────────
const desktop = await session('shot', { width: 1280, height: 800 }, false);
await desktop.page.screenshot({ path: `${outDir}/01-world.png` });

await desktop.page.keyboard.press('m');
await desktop.page.waitForTimeout(700);
await desktop.page.screenshot({ path: `${outDir}/02-skyblock-menu.png` });

// Walk the reorganised menus: collections, recipe book, bank, warps.
async function openFromMenu(label, file) {
  const slot = desktop.page.locator(`.chest-grid [aria-label="${label}"]`).first();
  if (!(await slot.count())) {
    console.log(`FAIL no slot named ${label}`);
    return false;
  }
  await slot.click();
  await desktop.page.waitForTimeout(600);
  await desktop.page.screenshot({ path: `${outDir}/${file}` });
  return true;
}
const menuShots = [];
menuShots.push(await openFromMenu('Collections', '06-collections.png'));
await desktop.page.keyboard.press('Backspace');
await desktop.page.waitForTimeout(500);
menuShots.push(await openFromMenu('Recipe Book', '07-recipes.png'));
await desktop.page.keyboard.press('Backspace');
await desktop.page.waitForTimeout(500);
menuShots.push(await openFromMenu('Bank', '08-bank.png'));
await desktop.page.keyboard.press('Backspace');
await desktop.page.waitForTimeout(500);
menuShots.push(await openFromMenu('Fast Travel', '09-warps.png'));
console.log(`${menuShots.every(Boolean) ? 'ok  ' : 'FAIL'} collections, recipes, bank and warps all open from the menu`);

await desktop.page.keyboard.press('Escape');
await desktop.page.waitForTimeout(400);

// Chat: open with T, then Escape must return control to the game.
await desktop.page.keyboard.press('t');
await desktop.page.waitForTimeout(400);
const chatFocused = await desktop.page.evaluate(() => document.activeElement?.tagName === 'INPUT');
await desktop.page.screenshot({ path: `${outDir}/03-chat-open.png` });
await desktop.page.keyboard.press('Escape');
await desktop.page.waitForTimeout(400);
const chatClosed = await desktop.page.evaluate(() => document.activeElement?.tagName !== 'INPUT');
console.log(`${chatFocused ? 'ok  ' : 'FAIL'} pressing T focuses chat`);
console.log(`${chatClosed ? 'ok  ' : 'FAIL'} pressing Escape leaves chat`);

// ── Mobile: touch controls ────────────────────────────────────────────────
const mobile = await session('mob', { width: 414, height: 896 }, true);
await mobile.page.screenshot({ path: `${outDir}/04-mobile.png` });
const dpad = await mobile.page.locator('.touch-dpad button').count();
console.log(`${dpad >= 4 ? 'ok  ' : 'FAIL'} mobile shows a d-pad (${dpad} buttons)`);
const menuButton = mobile.page.locator('.touch-actions button', { hasText: /menu/i });
if (await menuButton.count()) {
  await menuButton.first().tap();
  await mobile.page.waitForTimeout(700);
  await mobile.page.screenshot({ path: `${outDir}/05-mobile-menu.png` });
}

const errors = [...desktop.errors, ...mobile.errors];
console.log(errors.length ? `FAIL console errors:\n${errors.join('\n')}` : 'ok   no console errors');

await browser.close();
console.log(`screenshots in ${outDir}`);
process.exit(errors.length || !chatFocused || !chatClosed || dpad < 4 ? 1 : 0);
