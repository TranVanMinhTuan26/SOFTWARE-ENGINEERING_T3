import { test, expect } from '@playwright/test';

test('loyalty points stay stable when store cache refreshes and fit on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.route('**/products', route => route.fulfill({ json: [{ id: 'loyalty-test', name: 'Loyalty Coffee', price: 45000, imageUrl: '', category: 'Cà phê', available: true, stock: 99, toppings: [] }] }));
  let pointRate = '100';
  await page.route('**/settings/loyalty-policy', async route => {
    await new Promise(resolve => setTimeout(resolve, 200));
    await route.fulfill({ json: { pointRate, pointRedeem: '100', pointToMoneyRate: '1000' } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Thêm nhanh/ }).first().click();
  await page.getByRole('button', { name: 'Giỏ hàng', exact: true }).first().click();
  const row = page.getByText(/^Điểm tích lũy dự kiến nhận/).locator('../..');
  const points = row.locator(':scope > span');
  await expect(points).toHaveText('+500 điểm');
  await points.evaluate(element => {
    const values: string[] = [];
    (window as any).__loyaltyValues = values;
    const observer = new MutationObserver(() => values.push(element.textContent!.trim()));
    observer.observe(element, { childList: true, subtree: true, characterData: true });
    (window as any).__loyaltyObserver = observer;
  });
  const refreshed = page.waitForResponse(response => response.url().endsWith('/settings/loyalty-policy'));
  await page.evaluate(() => {
    localStorage.setItem('brewlite_store_settings', JSON.stringify({ storeName: 'Contact information only' }));
    window.dispatchEvent(new Event('focus'));
  });
  await refreshed;
  await expect(points).toHaveText('+500 điểm');
  expect(await page.evaluate(() => (window as any).__loyaltyValues)).toEqual([]);
  const box = await points.boundingBox();
  expect(box!.height).toBeLessThan(22);
  expect(await points.evaluate(element => getComputedStyle(element).whiteSpace)).toBe('nowrap');
  pointRate = '200';
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(points).toHaveText('+250 điểm');
  await page.evaluate(() => (window as any).__loyaltyObserver.disconnect());
});
