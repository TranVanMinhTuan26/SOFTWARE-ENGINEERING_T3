import { test, expect } from '@playwright/test';

test('admin shows all order states and cancels unpaid/paid orders with honest refund labels', async ({ page }) => {
  const order = (id: string, status: string, payment: any = null) => ({ id, code: 'BL' + id.toUpperCase(), status, total: 50000, createdAt: new Date().toISOString(), user: { email: 'states@example.test', fullName: 'State Test' }, items: [{ productName: 'Americano', size: 'M', qty: 1 }], payment });
  const orders = [order('pending', 'PENDING'), order('paid', 'PAID', { method: 'VNPay', status: 'SUCCESS' }), order('preparing', 'PREPARING'), order('ready', 'READY'), order('failed', 'PAYMENT_FAILED'), order('cancelled', 'CANCELLED'), order('completed', 'COMPLETED')];
  await page.route('**/admin/orders', route => route.fulfill({ json: orders }));
  await page.route('**/admin/orders/*/status', async route => {
    const id = route.request().url().split('/').at(-2)!;
    const target = orders.find(o => o.id === id)!;
    expect(route.request().postDataJSON().status).toBe('CANCELLED');
    target.status = 'CANCELLED';
    if (target.payment?.status === 'SUCCESS') target.payment.status = 'REFUND_PENDING';
    await route.fulfill({ json: target });
  });
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/admin');
  await page.locator('input[type=email]').fill('admin@brewlite.local');
  await page.locator('input[type=password]').fill('Admin123!');
  await page.getByRole('button', { name: 'Đăng nhập vào Hệ thống' }).click();
  const row = (id: string) => page.getByRole('row').filter({ hasText: '#BL' + id.toUpperCase() });
  await expect(row('pending')).toBeVisible();
  await expect(row('failed')).toContainText('Thanh toán lỗi');
  await expect(row('cancelled')).toContainText('Đã hủy');
  await expect(row('ready')).toContainText('Chờ khách nhận');
  await expect(row('pending').getByRole('button', { name: /Xác nhận đã trả/ })).toHaveCount(0);
  await expect(row('preparing').getByRole('button', { name: 'Hủy đơn', exact: true })).toHaveCount(0);
  await expect(row('ready').getByRole('button', { name: 'Hủy đơn', exact: true })).toHaveCount(0);
  await row('pending').getByRole('button', { name: 'Hủy đơn', exact: true }).click();
  await expect(row('pending')).toContainText('Đã hủy');
  await expect(row('pending')).not.toContainText('Chờ hoàn tiền');
  await row('paid').getByRole('button', { name: 'Hủy đơn', exact: true }).click();
  await expect(row('paid')).toContainText('Chờ hoàn tiền');
  await expect(row('paid')).not.toContainText('Đã hoàn tiền');
  await page.getByRole('button', { name: 'Chờ hoàn tiền', exact: true }).click();
  await expect(row('paid')).toBeVisible();
  await expect(row('pending')).toHaveCount(0);
});
