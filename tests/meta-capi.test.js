'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { hashParam, hashPhone, trackMetaPurchase } = require('../lib/meta-capi');

test('Meta CAPI: hashParam cleans, trims, and correctly hashes emails and strings with SHA-256', () => {
  assert.equal(hashParam('  Test@MetalCreativo.CL  '), '59357b991440db2976871e4eceb4f84aace72712bb10cb8a24f88b4f230ad63b');
  assert.equal(hashParam(''), null);
  assert.equal(hashParam(null), null);
});

test('Meta CAPI: hashPhone strips non-digits and hashes correctly', () => {
  assert.equal(hashPhone('+56 9 5492 2608'), '707925ff9b20ff702319e520d10c1456888e71d77bc4791e52a8ba6999b04da4');
  assert.equal(hashPhone(''), null);
  assert.equal(hashPhone(null), null);
});

test('Meta CAPI: trackMetaPurchase fails safely without throwing when token is missing', async () => {
  const originalToken = process.env.META_ACCESS_TOKEN;
  delete process.env.META_ACCESS_TOKEN;
  try {
    const res = await trackMetaPurchase({ order: { id: 'test-uuid', order_number: 101, total_amount: 65000 }, customer: { email: 'test@domain.com' }, amount: 65000, paymentId: '123' });
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'META_NOT_CONFIGURED');
  } finally {
    if (originalToken) process.env.META_ACCESS_TOKEN = originalToken;
  }
});
