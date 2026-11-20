const assert = require('node:assert/strict');
async function main() {
  const api = process.env.API_URL || 'http://localhost:4000';
  const web = process.env.WEB_URL || 'http://localhost:3000';
  for (const path of ['/health', '/health/ready', '/products']) {
    const res = await fetch(api + path, { signal: AbortSignal.timeout(15000) });
    assert.equal(res.status, 200, path);
    const data = await res.json();
    if (path === '/products') assert.ok(Array.isArray(data));
  }
  assert.equal((await fetch(web, { signal: AbortSignal.timeout(15000) })).status, 200);
  console.log('Smoke passed: web, liveness, readiness, products');
}
main().catch(e => { console.error(e.message); process.exitCode=1; });
