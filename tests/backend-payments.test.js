const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHmac } = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const SECRET = 'synthetic-mercadopago-webhook-secret';
const ORDER_ID = '00000000-0000-4000-8000-000000000001';
const PAYMENT_ID = '123456';
const PAYMENT = { id: PAYMENT_ID, status: 'approved', live_mode: true, external_reference: ORDER_ID, transaction_amount: 65000, currency_id: 'CLP', payer: { email: 'same@example.invalid' } };

function signed(id = PAYMENT_ID) {
  const timestamp = '1760000000', requestId = 'synthetic-request-123';
  const digest = createHmac('sha256', SECRET).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${timestamp};`).digest('hex');
  return { 'x-signature': `ts=${timestamp},v1=${digest}`, 'x-request-id': requestId };
}

// Actual handlers and local libraries are loaded with an isolated process.env.
// SDK calls and Supabase transport are synthetic; filesystem providers are forbidden.
function backend(options = {}) {
  const env = { MERCADOPAGO_WEBHOOK_SECRET: SECRET, MERCADOPAGO_ACCESS_TOKEN: 'synthetic-mp-token',
    SUPABASE_URL: 'https://database.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-db-key', ...options.env };
  const effects = [], calls = [], cache = new Map();
  const db = {
    async rpc(name, args) {
      calls.push({ rpc: name, args: structuredClone(args) });
      return options.rpc ? options.rpc(name, args) : { data: { applied: true }, error: null };
    },
    from(table) {
      calls.push({ table });
      assert.equal(table, 'payment_webhook_logs', 'Payment associations belong exclusively to the transactional RPC');
      return { async upsert(row, config) {
        calls.push({ audit: structuredClone(row), config: structuredClone(config) });
        return options.audit ? options.audit(row, config) : { error: null };
      } };
    }
  };
  function load(relative) {
    const file = path.resolve(ROOT, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
      module, exports: module.exports, process: { env }, Buffer, TextDecoder, URL, AbortSignal, setTimeout, clearTimeout,
      console: { log() {}, warn() {}, error() {} },
      fetch() { throw new Error('Unexpected direct network access'); },
      require(name) {
        if (name === 'mercadopago') return {
          MercadoPagoConfig: class { constructor(config) { effects.push({ sdk: 'config', config }); } },
          Payment: class { async get(args) { effects.push({ sdk: 'payment.get', args }); return options.payment ? options.payment(args) : structuredClone(PAYMENT); } }
        };
        if (name === '@supabase/supabase-js') return { createClient() { effects.push({ database: true }); return db; } };
        if (name.startsWith('node:') && !['node:fs', 'node:child_process'].includes(name)) return require(name);
        if (name.startsWith('.')) return load(path.relative(ROOT, path.resolve(path.dirname(file), name + '.js')));
        throw new Error('Unexpected dependency: ' + name);
      }
    }, { filename: file });
    return module.exports;
  }
  return { env, effects, calls, async call(request = {}) {
    const req = { method: 'POST', headers: signed(), query: { 'data.id': PAYMENT_ID }, body: { type: 'payment', data: { id: PAYMENT_ID } }, ...request };
    const res = { headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
      status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; }, send(data) { this.body = data; return this; } };
    await load('api/webhook.js')(req, res);
    return res;
  } };
}

test('missing, malformed, tampered and ambiguous Mercado Pago signatures cause zero provider/database effects', async () => {
  const valid = signed();
  for (const request of [
    { headers: {} }, { headers: { 'x-request-id': valid['x-request-id'] } },
    { headers: { ...valid, 'x-signature': 'ts=1760000000,v1=' + '0'.repeat(64) } },
    { headers: { ...valid, 'x-signature': valid['x-signature'] + ',v1=' + '0'.repeat(64) } },
    { headers: { ...valid, 'x-signature': valid['x-signature'] + ',unknown=value' } },
    { headers: { ...valid, 'x-signature': [valid['x-signature']] } },
    { headers: { ...valid, 'X-Signature': valid['x-signature'] } },
    { headers: valid, rawHeaders: ['X-Signature', valid['x-signature'], 'x-signature', valid['x-signature']] },
    { headers: valid, rawHeaders: ['X-Request-Id', valid['x-request-id'], 'x-request-id', valid['x-request-id']] },
    { headers: { ...valid, 'x-request-id': 'another-request' } },
    { query: {} }, { query: { 'data.id': [PAYMENT_ID, PAYMENT_ID] } },
    { query: undefined, url: `/api/webhook?data.id=${PAYMENT_ID}&data.id=${PAYMENT_ID}` },
    { query: { 'data.id': 'a;b' } }
  ]) {
    const app = backend();
    const res = await app.call(request);
    assert.ok([400, 401].includes(res.code));
    assert.equal(app.effects.length + app.calls.length, 0);
    assert.match(res.headers['cache-control'], /no-store/);
  }
});

test('valid signature fields can arrive in reverse order with separating whitespace', async () => {
  const headers = signed();
  const [ts, v1] = headers['x-signature'].split(',');
  headers['x-signature'] = `  ${v1},  ${ts}  `;
  const app = backend();
  assert.equal((await app.call({ headers })).code, 200);
  assert.equal(app.calls.find(call => call.rpc).rpc, 'backend_apply_payment');
});

test('live and production webhooks cannot apply approved sandbox or unspecified-mode payments', async () => {
  for (const env of [{ MERCADOPAGO_MODE: 'live' }, { VERCEL_ENV: 'production' }]) {
    for (const liveMode of [false, undefined, 'true', 1]) {
      const app = backend({ env, payment: async () => ({ ...PAYMENT, live_mode: liveMode }) });
      assert.equal((await app.call()).code, 200);
      assert.equal(app.calls.length, 0);
      assert.equal(app.effects.filter(effect => effect.database).length, 0);
    }
    const live = backend({ env, payment: async () => ({ ...PAYMENT, live_mode: true }) });
    assert.equal((await live.call()).code, 200);
    assert.equal(live.calls.find(call => call.rpc).rpc, 'backend_apply_payment');
  }
});

test('explicit sandbox webhooks apply only provider-confirmed sandbox payments', async () => {
  for (const liveMode of [true, undefined, 'false', 0]) {
    const app = backend({ env: { MERCADOPAGO_MODE: 'sandbox' }, payment: async () => ({ ...PAYMENT, live_mode: liveMode }) });
    assert.equal((await app.call()).code, 200);
    assert.equal(app.calls.length, 0);
  }
  const sandbox = backend({ env: { MERCADOPAGO_MODE: 'sandbox' }, payment: async () => ({ ...PAYMENT, live_mode: false }) });
  assert.equal((await sandbox.call()).code, 200);
  assert.equal(sandbox.calls.find(call => call.rpc).rpc, 'backend_apply_payment');
});

test('missing webhook configuration and unsupported methods fail before effects', async () => {
  for (const secret of [undefined, '', '   ']) {
    const app = backend({ env: { MERCADOPAGO_WEBHOOK_SECRET: secret } });
    const res = await app.call();
    assert.equal(res.code, 503);
    assert.equal(res.body.code, 'WEBHOOK_NOT_CONFIGURED');
    assert.equal(app.effects.length + app.calls.length, 0);
  }
  const app = backend();
  assert.equal((await app.call({ method: 'GET' })).code, 405);
  assert.equal(app.effects.length, 0);
});

test('signed query/body ID mismatches and malformed JSON never reach the payment provider', async () => {
  for (const request of [
    { body: { type: 'payment', data: { id: '999999' } } },
    { body: { type: 'payment', data: { id: [PAYMENT_ID, PAYMENT_ID] } } },
    { body: '{bad json' }, { body: '[]' },
    { body: { data: { id: PAYMENT_ID }, padding: 'x'.repeat(129 * 1024) } }
  ]) {
    const app = backend();
    const res = await app.call(request);
    assert.ok([400, 413].includes(res.code));
    assert.equal(app.effects.length + app.calls.length, 0);
  }
});

test('payment provider ID is matched exactly before any database association', async () => {
  const app = backend({ payment: async () => ({ ...PAYMENT, id: '999999' }) });
  const res = await app.call();
  assert.equal(res.code, 502);
  assert.equal(res.body.code, 'PAYMENT_ID_MISMATCH');
  assert.equal(app.calls.length, 0);
  assert.equal(app.effects.filter(effect => effect.database).length, 0);
});

test('approved payments forward exact provider amount, currency and UUID to a guarded RPC; payer email is never an association', async () => {
  const app = backend();
  const res = await app.call({ body: { type: 'payment', data: { id: PAYMENT_ID }, payer: { email: 'attacker@example.invalid' }, status: 'approved', transaction_amount: 1 } });
  assert.equal(res.code, 200);
  assert.equal(res.body, 'OK');
  const applied = app.calls.find(call => call.rpc);
  assert.equal(applied.rpc, 'backend_apply_payment');
  assert.deepEqual(applied.args, { p_order_id: ORDER_ID, p_payment_id: PAYMENT_ID, p_amount: 65000, p_currency: 'CLP' });
  assert.ok(!JSON.stringify(app.calls).includes('same@example.invalid'));
  assert.ok(!JSON.stringify(app.calls).includes('attacker@example.invalid'));
  const audit = app.calls.find(call => call.audit);
  assert.equal(audit.audit.signature_verified, true);
  assert.deepEqual(audit.audit.raw_payload, { order_id: ORDER_ID, applied: true, reason: null });
  assert.equal(audit.config.onConflict, 'gateway,payment_id,event_type');
});

test('transactional rejections and duplicate applications are acknowledged without direct order writes', async () => {
  for (const reason of ['amount_mismatch', 'currency_mismatch', 'wrong_payment_method', 'payment_already_assigned', 'already_paid', 'order_not_found']) {
    const app = backend({ rpc: async () => ({ data: { applied: false, reason }, error: null }) });
    const res = await app.call();
    assert.equal(res.code, 200);
    assert.equal(app.calls.find(call => call.audit).audit.raw_payload.applied, false);
    assert.equal(app.calls.find(call => call.audit).audit.raw_payload.reason, reason);
  }
});

test('non-approved, invalid-reference, invalid-amount and non-CLP payments never mutate storage', async () => {
  for (const payment of [
    { ...PAYMENT, status: 'pending' }, { ...PAYMENT, status: 'rejected' },
    { ...PAYMENT, external_reference: 'MC-1234' }, { ...PAYMENT, external_reference: null },
    { ...PAYMENT, transaction_amount: 0 }, { ...PAYMENT, transaction_amount: -1 },
    { ...PAYMENT, transaction_amount: 'invalid' }, { ...PAYMENT, currency_id: 'USD' }
  ]) {
    const app = backend({ payment: async () => payment });
    assert.equal((await app.call()).code, 200);
    assert.equal(app.calls.length, 0);
    assert.equal(app.effects.filter(effect => effect.database).length, 0);
  }
  const ignored = backend();
  assert.equal((await ignored.call({ body: { type: 'merchant_order' } })).code, 200);
  assert.equal(ignored.effects.length + ignored.calls.length, 0);
});

test('storage/provider failures return retryable generic errors without filesystem fallback', async () => {
  for (const options of [
    { env: { MERCADOPAGO_ACCESS_TOKEN: undefined } },
    { env: { SUPABASE_SERVICE_ROLE_KEY: undefined } },
    { payment: async () => { throw new Error('private provider credential'); } },
    { rpc: async () => ({ data: null, error: { message: 'private provider credential' } }) },
    { rpc: async () => ({ data: {}, error: null }) },
    { audit: async () => ({ error: { message: 'private provider credential' } }) }
  ]) {
    const res = await backend(options).call();
    assert.equal(res.code, 503);
    assert.equal(res.body.success, false);
    assert.ok(!JSON.stringify(res.body).includes('private provider credential'));
  }
});
