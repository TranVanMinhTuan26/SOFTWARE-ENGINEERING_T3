const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { request, customer, signedIpn, orderFor } = require('../helpers.cjs');
assert.match(process.env.DATABASE_URL || '', /brewlite_test(?:\?|$)/, 'Integration tests require a dedicated brewlite_test database');
const db = new PrismaClient();
after(() => db.$disconnect());

test('INT-T01..07 real HTTP / PostgreSQL checkout and VNPay callback contract', async t => {
  const auth = await customer();
  const token = auth.accessToken;
  const products = await request('/products');
  const product = products.find(p => p.available);
  assert.ok(product, 'Run database seed before integration tests');

  await t.test('INT-T02 rejects missing/forged JWT, validates registration and hides password hash', async () => {
    await request('/orders/me', { status: 401 });
    await request('/orders/me', { token: 'forged', status: 401 });
    await request('/auth/register', { method: 'POST', status: 400, body: { email: 'bad', password: '1' } });
    assert.equal(auth.user.passwordHash, undefined);
    const saved = await db.user.findUniqueOrThrow({ where: { id: auth.user.id } });
    assert.match(saved.passwordHash, /^\$2[ab]\$/);
  });
  await t.test('INT-T01 cart add/update/remove uses authenticated owner', async () => {
    await request('/cart/items', { token, method: 'POST', status: 201, body: { productId: product.id, size: 'M', toppings: [], qty: 1 } });
    const cart = await request('/cart', { token });
    assert.equal(cart.items.length, 1);
    await request(`/cart/items/${cart.items[0].id}`, { token, method: 'PATCH', body: { qty: 2 } });
    assert.equal((await request('/cart', { token })).items[0].qty, 2);
    await request(`/cart/items/${cart.items[0].id}`, { token, method: 'DELETE' });
    assert.equal((await request('/cart', { token })).items.length, 0);
  });
  await t.test('INT-T03 empty/invalid order rolls back and VNPay-only rejects mock', async () => {
    const before = await db.order.count({ where: { userId: auth.user.id } });
    await request('/orders', { token, method: 'POST', status: 400, body: { items: [], paymentMethod: 'VNPay' } });
    await orderFor(token, product, { paymentMethod: 'Ví điện tử' }).then(() => assert.fail('must reject'), e => assert.match(e.message, /400/));
    assert.equal(await db.order.count({ where: { userId: auth.user.id } }), before);
  });
  const order = await orderFor(token, product);
  assert.equal(order.status, 'PENDING');
  await t.test('INT-T04 invalid signature/amount do not settle; duplicate IPN changes stock/loyalty once', async () => {
    const url = await request('/payments/vnpay/create', { token, method: 'POST', status: 201, body: { orderId: order.id } });
    assert.match(url.paymentUrl, /^https:\/\/sandbox\.vnpayment\.vn/);
    assert.equal((await request('/payments/vnpay/ipn?vnp_SecureHash=bad')).RspCode, '97');
    assert.equal((await request('/payments/vnpay/ipn?' + signedIpn(order, { vnp_Amount: '100' }))).RspCode, '04');
    assert.equal((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status, 'PENDING');
    const before = await db.ingredient.findMany({ orderBy: { id: 'asc' } });
    const query = signedIpn(order);
    assert.equal((await request('/payments/vnpay/ipn?' + query)).RspCode, '00');
    const paid = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(paid.status, 'PAID');
    const stock = await db.ingredient.findMany({ orderBy: { id: 'asc' } });
    assert.ok(stock.some((x, i) => x.quantity < before[i].quantity));
    assert.equal((await request('/payments/vnpay/ipn?' + query)).RspCode, '02');
    assert.deepEqual(await db.ingredient.findMany({ orderBy: { id: 'asc' } }), stock);
    assert.equal(await db.payment.count({ where: { orderId: order.id } }), 1);
    assert.equal(await db.loyaltyRewardEvent.count({ where: { orderId: order.id } }), 1);
  });
  await t.test('INT-T04 failed VNPay callback does not deduct stock', async () => {
    const failed = await orderFor(token, product);
    const before = await db.ingredient.findMany({ orderBy: { id: 'asc' } });
    await request('/payments/vnpay/ipn?' + signedIpn(failed, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' }));
    assert.equal((await db.order.findUniqueOrThrow({ where: { id: failed.id } })).status, 'PAYMENT_FAILED');
    assert.deepEqual(await db.ingredient.findMany({ orderBy: { id: 'asc' } }), before);
  });
  await t.test('INT-T04 response 00 with failed transaction status cannot settle or deduct stock', async () => {
    const failed = await orderFor(token, product);
    const before = await db.ingredient.findMany({ orderBy: { id: 'asc' } });
    await request('/payments/vnpay/ipn?' + signedIpn(failed, { vnp_ResponseCode: '00', vnp_TransactionStatus: '02' }));
    assert.equal((await db.order.findUniqueOrThrow({ where: { id: failed.id } })).status, 'PAYMENT_FAILED');
    assert.deepEqual(await db.ingredient.findMany({ orderBy: { id: 'asc' } }), before);
    assert.equal(await db.loyaltyRewardEvent.count({ where: { orderId: failed.id } }), 0);
  });
  await t.test('INT-T05 owner history and cross-user isolation', async () => {
    assert.ok((await request('/orders/me', { token })).some(o => o.id === order.id));
    const other = await customer();
    await request(`/orders/${order.id}`, { token: other.accessToken, status: 404 });
  });
  await t.test('INT-T06 customer cannot edit menu', async () => {
    await request('/admin/products', { token, method: 'POST', status: 403, body: {} });
  });
  await t.test('INT-T07 liveness and DB readiness', async () => {
    assert.equal((await request('/health')).status, 'ok');
    assert.equal((await request('/health/ready')).database, 'connected');
  });
  await t.test('PERF-T01 warm p95 menu below 500ms (30 sequential calls)', async () => {
    await request('/products');
    const durations=[];
    for (let i=0;i<30;i++) { const start=performance.now();await request('/products');durations.push(performance.now()-start); }
    durations.sort((a,b)=>a-b);
    const p95=durations[Math.ceil(durations.length*.95)-1];
    console.log(`Menu p95: ${p95.toFixed(1)} ms`);
    assert.ok(p95<500, `p95 was ${p95} ms`);
  });
});
