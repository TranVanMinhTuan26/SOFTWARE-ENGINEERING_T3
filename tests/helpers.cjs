const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const base = process.env.TEST_API_URL || 'http://localhost:4000';
async function request(path, { token, method = 'GET', body, status = 200 } = {}) {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const data = await res.json();
  assert.equal(res.status, status, JSON.stringify(data));
  return data;
}
async function customer() {
  return request('/auth/register', { method: 'POST', status: 201, body: { email: `test-${crypto.randomUUID()}@example.test`, password: 'TestPass123!', fullName: 'Integration Test' } });
}
function signedIpn(order, extra = {}) {
  assert.ok(process.env.VNPAY_HASH_SECRET, 'Set the dedicated test VNPay signing key');
  const params = { vnp_TxnRef: order.id, vnp_Amount: String(order.total * 100), vnp_ResponseCode: '00', vnp_TransactionStatus: '00', vnp_TransactionNo: crypto.randomUUID(), ...extra };
  const query = new URLSearchParams(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));
  const hash = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET).update(query.toString()).digest('hex');
  query.set('vnp_SecureHash', hash);
  return query.toString();
}
async function orderFor(token, product, extra = {}) {
  return request('/orders', { token, method: 'POST', status: 201, body: { paymentMethod: 'VNPay', items: [{ productId: product.id, size: 'M', toppings: [], qty: 1 }], ...extra } });
}
module.exports = { request, customer, signedIpn, orderFor, base };
