import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

async function customerWithCart(page: Page, request: APIRequestContext) {
  const api = process.env.TEST_API_URL || 'http://localhost:4000';
  const email = `payment-error-${randomUUID()}@example.test`;
  expect((await request.post(api + '/auth/register', { data: { email, password: 'TestPass123!', fullName: 'Payment Error Test' } })).status()).toBe(201);
  await page.goto('/');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).first().click();
  await page.getByPlaceholder('Email của bạn').fill(email);
  await page.getByPlaceholder('Mật khẩu', { exact: true }).fill('TestPass123!');
  await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('.modal-overlay')).toHaveCount(0);
  await page.getByRole('button', { name: /Thêm nhanh/ }).first().click();
  await page.getByRole('button', { name: 'Giỏ hàng', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Giỏ hàng (1)' })).toBeVisible();
}

test('VNPay API errors preserve checkout and cart', async ({ page, request }) => {
  await customerWithCart(page, request);
  const alerts: string[] = [];
  page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.accept(); });
  await page.route('**/orders/*/retry-payment', route => route.fulfill({ status: 400, json: { message: 'VNPay unavailable test' } }));
  await page.getByRole('button', { name: /Thanh toán/ }).last().click();
  await page.getByRole('button', { name: /Xác nhận trả/ }).click();
  await expect.poll(() => alerts.join(' ')).toContain('VNPay unavailable test');
  expect(new URL(page.url()).pathname).toBe('/');
  await page.getByRole('button', { name: /Mua thêm.*Sửa giỏ hàng/ }).click();
  await expect(page.getByRole('heading', { name: 'Giỏ hàng (1)' })).toBeVisible();
});

test('explicit failed VNPay return overrides code 00 and preserves cart', async ({ page, request }) => {
  await customerWithCart(page, request);
  let cartDeletes = 0;
  page.on('request', req => { if (req.url().endsWith('/cart') && req.method() === 'DELETE') cartDeletes++; });
  await page.goto('/orders?vnpay=failed&code=00');
  await expect(page.getByText(/Giao dịch VNPay chưa hoàn tất/)).toBeVisible();
  expect(cartDeletes).toBe(0);
  await page.goto('/');
  await page.getByRole('button', { name: 'Giỏ hàng', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Giỏ hàng (1)' })).toBeVisible();
});
