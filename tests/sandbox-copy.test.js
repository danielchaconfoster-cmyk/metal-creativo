'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const copy = path.resolve(__dirname, '../.vercel/sandbox-site');
const ready = fs.existsSync(path.join(copy, 'lib/sandbox-guard.js'));
test('sandbox blocks production database even when configured as the expected host', {skip: !ready}, () => {
  const guard = require(path.join(copy, 'lib/sandbox-guard.js'));
  const old = {...process.env};
  try {
    process.env.SUPABASE_URL='https://hixuaqdkiyirntgvzxff.supabase.co';
    process.env.SANDBOX_DATABASE_HOST='hixuaqdkiyirntgvzxff.supabase.co';
    assert.throws(() => guard.guardDatabase(), e => e.code === 'SANDBOX_DATABASE_REQUIRED');
    process.env.SUPABASE_URL='https://isolated-test.supabase.co';
    assert.throws(() => guard.guardDatabase());
    process.env.SANDBOX_DATABASE_HOST='isolated-test.supabase.co';
    assert.doesNotThrow(() => guard.guardDatabase());
  } finally { process.env=old; }
});
test('sandbox refuses real domain and live mode before payment calls', {skip: !ready}, () => {
  const guard = require(path.join(copy, 'lib/sandbox-guard.js'));
  const old = {...process.env};
  try {
    process.env.MERCADOPAGO_MODE='sandbox';
    for (const host of ['metalcreativo.cl','www.metalcreativo.cl']) {
      process.env.SITE_URL='https://'+host;
      process.env.SANDBOX_SITE_HOST=host;
      assert.throws(() => guard.guardSite(), e => e.code === 'SANDBOX_SITE_REQUIRED');
    }
    process.env.SITE_URL='https://metal-sandbox.example';
    process.env.SANDBOX_SITE_HOST='metal-sandbox.example';
    process.env.MERCADOPAGO_MODE='live';
    assert.throws(() => guard.guardSite(), e => e.code === 'SANDBOX_MODE_REQUIRED');
    process.env.MERCADOPAGO_MODE='sandbox';
    assert.doesNotThrow(() => guard.guardSite());
  } finally { process.env=old; }
});
test('sandbox starts without production secrets, customer data or deployment link', {skip: !ready}, () => {
  for(const file of ['.env','.env.mercadopago.production.local','.env.admin.production.local','data','.vercel/project.json']) assert.equal(fs.existsSync(path.join(copy,file)),false,file);
  const html=fs.readFileSync(path.join(copy,'public/index.html'),'utf8');
  assert.match(html,/ENTORNO DE PRUEBAS/);
  assert.match(html,/noindex,nofollow,noarchive/);
  assert.match(fs.readFileSync(path.join(copy,'api/create-preference.js'),'utf8'),/if \(!test\) throw new HttpError\(503, 'SANDBOX_TEST_ACCOUNT_REQUIRED'\)/);
});
