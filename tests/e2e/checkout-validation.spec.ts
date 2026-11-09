import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

async function setup(page: Page, request: APIRequestContext) {
  const api = process.env.TEST_API_URL || 'http://localhost:4000';
  const email = `validation-${randomUUID()}@example.test`;
  const response = await request.post(api + '/auth/register', { data: { email, password: 'Validation123!', fullName: 'Checkout Validation' } });
  expect(response.status()).toBe(201);
  const auth = await response.json();
  await page.addInitScript(({ token, email }) => {
    localStorage.setItem('brewlite-token', token);
    localStorage.setItem('brewlite-email', email);
    localStorage.setItem('brewlite-role', 'CUSTOMER');
  }, { token: auth.accessToken, email });
  await page.goto('/');
  await page.getByRole('button', { name: /Thêm nhanh/ }).first().click();
  await page.getByRole('button', { name: 'Giỏ hàng', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Giỏ hàng (1)' })).toBeVisible();
  return { api, token: auth.accessToken };
}

for (const path of ['/', '/orders']) {
  test(`unpaid order cannot be confirmed by a success URL at ${path}`, async ({ page, request }) => {
    const { api, token } = await setup(page, request);
    const products = await (await request.get(api + '/products')).json();
    const product = products.find((p: any) => p.available);
    const created = await request.post(api + '/orders', { headers: { Authorization: 'Bearer ' + token }, data: { items: [{ productId: product.id, qty: 1, size: 'M', toppings: [] }], paymentMethod: 'VNPay' } });
    expect(created.status()).toBe(201);
    const order = await created.json();
    const alerts: string[] = [];
    page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.accept(); });
    let cartDeletes = 0;
    page.on('request', req => { if (req.url().endsWith('/cart') && req.method() === 'DELETE') cartDeletes++; });
    await page.goto(`${path}?vnpay=success&code=00&orderId=${order.id}`);
    if (path === '/') await expect.poll(() => alerts.join(' ')).toContain('chưa được xác nhận thanh toán');
    else await expect(page.getByText(/chưa được xác nhận thanh toán/)).toBeVisible();
    expect(cartDeletes).toBe(0);
    const saved = await (await request.get(api + '/orders/' + order.id, { headers: { Authorization: 'Bearer ' + token } })).json();
    expect(saved.status).toBe('PENDING');
    await page.goto('/');
    await page.getByRole('button', { name: 'Giỏ hàng', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Giỏ hàng (1)' })).toBeVisible();
  });
}

test('rejected voucher selection does not show an accepted discount', async ({ page, request }) => {
  await setup(page, request);
  page.on('dialog', dialog => dialog.accept());
  await page.route('**/cart/apply-voucher', route => route.fulfill({ status: 400, json: { message: 'Voucher no longer valid' } }));
  await expect(page.locator('.modal-overlay select option[value=BREW20]')).toHaveCount(1);
  const rejected = page.waitForResponse(response => response.url().endsWith('/cart/apply-voucher'));
  await page.locator('.modal-overlay select').selectOption('BREW20');
  await rejected;
  await expect(page.getByRole('button', { name: 'Bỏ chọn', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Thanh toán.*50.000/ })).toBeVisible();
});


test('confirmed payment displays the real order code and consumes the return URL once', async ({ page, request }) => {
  await setup(page, request);
  await page.route('**/orders/confirmed-fixture', route => route.fulfill({ json: { id: 'confirmed-fixture', code: 'BLCONFIRMED', total: 50000, status: 'PAID', payment: { status: 'SUCCESS' } } }));
  let cartDeletes = 0;
  page.on('request', req => { if (req.url().endsWith('/cart') && req.method() === 'DELETE') cartDeletes++; });
  await page.goto('/orders?vnpay=success&orderId=confirmed-fixture');
  await expect(page.getByText(/Đơn hàng #BLCONFIRMED/)).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.has('vnpay')).toBe(false);
  expect(cartDeletes).toBe(1);
  const historyLoaded = page.waitForResponse(response => response.url().endsWith('/orders/me'));
  await page.reload();
  await historyLoaded;
  expect(cartDeletes).toBe(1);
});

test('voucher network failure does not fall back to an unverified local discount', async ({ page, request }) => {
  await setup(page, request);
  const alerts: string[] = [];
  page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.accept(); });
  await page.route('**/cart/apply-voucher', route => route.abort('failed'));
  await page.getByPlaceholder(/Hoặc nhập mã/).fill('BREW20');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect.poll(() => alerts.join(' ')).toContain('Không thể kiểm tra mã giảm giá');
  await expect(page.getByRole('button', { name: 'Bỏ chọn', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Thanh toán.*50.000/ })).toBeVisible();
});
