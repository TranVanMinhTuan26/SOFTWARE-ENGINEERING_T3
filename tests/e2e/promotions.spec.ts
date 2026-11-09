import { test, expect } from '@playwright/test';

test('cart refreshes live promotions and clears empty/error responses without sample or cached codes', async ({ page }) => {
  const promo = { id: 'qa-live', code: 'QALIVE5', description: 'Live 5% discount', percentOff: 5, discountAmount: 0, active: true, expiresAt: null };
  let status = 200;
  let promotions = [promo];
  await page.addInitScript(() => {
    localStorage.setItem('brewlite_promotions', JSON.stringify([
      { id: 'stale', code: 'STALECODE', name: 'Stale cached promotion', discount: '10%', status: '\u0110ang ho\u1ea1t \u0111\u1ed9ng' },
    ]));
  });
  await page.route('**/promotions', route => route.fulfill({ status, json: promotions }));
  await page.goto('/');
  await page.getByRole('button', { name: /Th\u00eam nhanh/ }).first().click();
  await page.getByRole('button', { name: 'Gi\u1ecf h\u00e0ng', exact: true }).first().click();
  const options = page.locator('.modal-overlay select option');
  await expect(options.filter({ hasText: 'QALIVE5' })).toHaveCount(1);
  await expect(options.filter({ hasText: 'BREW20' })).toHaveCount(0);
  await expect(options.filter({ hasText: 'STALECODE' })).toHaveCount(0);

  promotions = [];
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(options).toHaveCount(1);
  await expect(options.first()).toContainText('0 m\u00e3 kh\u1ea3 d\u1ee5ng');

  promotions = [promo];
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(options.filter({ hasText: 'QALIVE5' })).toHaveCount(1);
  status = 503;
  promotions = [];
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(options).toHaveCount(1);
  await expect(options.first()).toContainText('0 m\u00e3 kh\u1ea3 d\u1ee5ng');
});
