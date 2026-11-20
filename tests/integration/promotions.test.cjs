const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { request } = require('../helpers.cjs');

assert.match(process.env.DATABASE_URL || '', /brewlite_test(?:\?|$)/, 'Requires the dedicated test database');

test('public promotions expose new active codes, exclude expired/disabled codes and keep admin guarded', async () => {
  const db = new PrismaClient();
  const prefix = `QA-${randomUUID()}`;
  const codes = [`${prefix}-ACTIVE`, `${prefix}-EXPIRED`, `${prefix}-DISABLED`];
  try {
    await db.promotion.createMany({ data: [
      { code: codes[0], description: 'New public discount', percentOff: 5, active: true },
      { code: codes[1], description: 'Expired discount', percentOff: 5, active: true, expiresAt: new Date(Date.now() - 60000) },
      { code: codes[2], description: 'Disabled discount', percentOff: 5, active: false },
    ] });
    const promotions = await request('/promotions');
    assert.ok(promotions.some(p => p.code === codes[0] && p.percentOff === 5));
    assert.ok(!promotions.some(p => codes.slice(1).includes(p.code)));
    await request('/admin/promotions', { status: 401 });
    await db.promotion.update({ where: { code: codes[0] }, data: { active: false } });
    assert.ok(!(await request('/promotions')).some(p => p.code === codes[0]));
  } finally {
    await db.promotion.deleteMany({ where: { code: { in: codes } } });
    await db.$disconnect();
  }
});
