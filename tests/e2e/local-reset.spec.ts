import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('local demo OTP resets a test account and rejects code reuse', async ({ page, request }) => {
  const api = process.env.TEST_API_URL || 'http://localhost:4000';
  const email = `reset-${randomUUID()}@example.test`;
  expect((await request.post(api + '/auth/register', { data: { email, password: 'BeforeReset123!', fullName: 'Reset Test' } })).status()).toBe(201);
  await page.goto('/');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).first().click();
  await page.getByRole('link', { name: 'Quên mật khẩu?' }).click();
  await page.getByPlaceholder('Email của bạn').fill(email);
  if (process.env.ALLOW_INSECURE_PASSWORD_RESET !== 'true') {
    await expect(page.getByRole('button', { name: 'Tạo mã OTP demo' })).toBeDisabled();
    expect((await request.post(api + '/auth/forgot-password', { data: { email } })).status()).toBe(403);
    return;
  }
  const otpResponse = page.waitForResponse(r => r.url().endsWith('/auth/forgot-password') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Tạo mã OTP demo' }).click();
  const response = await otpResponse;
  expect(response.status()).toBe(201);
  const { resetToken } = await response.json();
  expect(resetToken).toMatch(/^\d{6}$/);
  await expect(page.getByText(new RegExp(resetToken))).toBeVisible();
  await page.getByPlaceholder('Mã OTP (6 chữ số)').fill(resetToken);
  await page.getByPlaceholder('Mật khẩu mới', { exact: true }).fill('AfterReset123!');
  await page.getByRole('button', { name: 'Xác nhận đặt lại mật khẩu', exact: true }).click();
  await expect(page.getByText(/Đặt lại mật khẩu thành công/)).toBeVisible();
  expect((await request.post(api + '/auth/login', { data: { email, password: 'AfterReset123!' } })).status()).toBe(201);
  expect((await request.post(api + '/auth/login', { data: { email, password: 'BeforeReset123!' } })).status()).toBe(401);
  expect((await request.post(api + '/auth/reset-password', { data: { email, token: resetToken, newPassword: 'NotAllowed123!' } })).status()).toBe(400);
});
