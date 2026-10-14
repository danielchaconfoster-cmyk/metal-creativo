const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash, createHmac } = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const ORDER_ID = '00000000-0000-4000-8000-000000000001';
const KEY = 'synthetic-order-key-0123456789';
const ACCESS_SECRET = 'synthetic-order-access-secret-0123456789abcdef';
const ACCESS_TOKEN = createHmac('sha256', ACCESS_SECRET).update('order:' + KEY).digest('hex');
const PAYLOAD = {
  customer: { rut: 'TESTID123', full_name: 'Persona sintética', email: 'test@example.invalid', phone: '+56 9 0000 0000',
    region: 'Región Metropolitana', comuna: 'Comuna de prueba', address_street: 'Calle de prueba', address_number: 'S/N', address_extra: '' },
  items: [{ id: 'barra_remolque', qty: 1, quantity: 1 }], shipping_method: 'rm_express', shipping_cost: 1,
  payment_method: 'transferencia'
};
const PREF = { id: 'synthetic-preference-123', init_point: 'https://payment.example.invalid/live', sandbox_init_point: 'https://payment.example.invalid/test' };

function backend(options = {}) {
  const env = { MERCADOPAGO_ACCESS_TOKEN: 'TEST-synthetic-token', ORDER_ACCESS_SECRET: ACCESS_SECRET,
    SUPABASE_URL: 'https://database.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-db-key', ...options.env };
  const calls = [], effects = [], records = new Map(), cache = new Map();
  let statusRow = options.statusRow || { id: ORDER_ID, order_number: 1, status: 'pending', total_amount: 69990, currency: 'CLP',
    payment_method: 'transferencia', tracking_number: null, paid_at: null, public_token_hash: createHash('sha256').update(ACCESS_TOKEN).digest('hex'),
    customer_email: 'NEVER_EXPOSE', customer_rut: 'NEVER_EXPOSE', ip_address: 'NEVER_EXPOSE' };
  const db = {
    async rpc(name, args) {
      calls.push({ rpc: name, args: structuredClone(args) });
      if (options.rpc) return options.rpc(name, args, records);
      if (name === 'backend_consume_rate_limit') return { data: true, error: null };
      if (name === 'backend_create_order') {
        const existing = records.get(args.p_idempotency_key);
        if (existing && existing.hash !== args.p_request_hash) return { data: null, error: { message: 'IDEMPOTENCY_CONFLICT' } };
        if (!existing) records.set(args.p_idempotency_key, { hash: args.p_request_hash, order: {
          id: ORDER_ID, order_number: 1, status: 'pending', total_amount: args.p_total, payment_method: args.p_payment_method,
          channel: args.p_channel, currency: 'CLP', preference_id: null
        } });
        return { data: structuredClone(records.get(args.p_idempotency_key).order), error: null };
      }
      if (name === 'backend_claim_preference') {
        const order = [...records.values()][0]?.order;
        return { data: { claimed: !order?.preference_id, preference_id: order?.preference_id || null }, error: null };
      }
      if (name === 'backend_finish_preference') {
        const order = [...records.values()][0]?.order;
        if (order) order.preference_id = args.p_preference_id;
        return { data: true, error: null };
      }
      throw new Error('Unexpected RPC: ' + name);
    },
    from(table) {
      const state = { table, filters: [], operation: 'select' };
      const execute = async () => {
        calls.push(structuredClone(state));
        if (options.query) return options.query(state);
        if (!state.filters.every(([field, value]) => statusRow[field] === value)) return { data: null, error: null };
        return { data: Object.fromEntries(state.fields.split(',').map(field => [field, statusRow[field]])), error: null };
      };
      return { select(fields) { state.fields = fields; return this; }, eq(field, value) { state.filters.push([field, value]); return this; },
        maybeSingle: execute, then(resolve, reject) { return execute().then(resolve, reject); } };
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
      async fetch(url, init) {
        effects.push({ fetch: url, init });
        if (options.fetch) return options.fetch(url, init);
        assert.equal(url, 'https://api.mercadopago.com/users/me');
        return { ok: true, json: async () => ({ id: 'synthetic-account', tags: [] }) };
      },
      require(name) {
        if (name === 'mercadopago') return {
          MercadoPagoConfig: class { constructor(config) { effects.push({ sdk: 'config', config: structuredClone(config) }); } },
          Preference: class {
            async create(args) { effects.push({ sdk: 'preference.create', args: structuredClone(args) }); return options.preference ? options.preference(args) : structuredClone(PREF); }
            async get(args) { effects.push({ sdk: 'preference.get', args: structuredClone(args) }); return options.preference ? options.preference(args) : structuredClone(PREF); }
          }
        };
        if (name === '@supabase/supabase-js') return { createClient() { effects.push({ database: true }); return db; } };
        if (name.startsWith('node:') && !['node:fs', 'node:child_process'].includes(name)) return require(name);
        if (name.startsWith('.')) return load(path.relative(ROOT, path.resolve(path.dirname(file), name + '.js')));
        throw new Error('Unexpected dependency: ' + name);
      }
    }, { filename: file });
    return module.exports;
  }
  return { env, calls, effects, records, load, async call(endpoint = 'api/orders.js', body = PAYLOAD, request = {}) {
    const req = { method: endpoint.includes('order-status') ? 'GET' : 'POST', headers: { origin: 'https://metalcreativo.cl', 'idempotency-key': KEY }, body, ...request };
    const res = { headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
      status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; }, send(data) { this.body = data; return this; } };
    await load(endpoint)(req, res);
    return res;
  } };
}

test('orders use server catalogue prices and shipping, atomically persist and grant a secure access cookie', async () => {
  const app = backend();
  const res = await app.call();
  assert.equal(res.code, 201);
  assert.equal(res.body.total_amount, 69990);
  assert.equal(res.body.status, 'pending');
  const create = app.calls.find(call => call.rpc === 'backend_create_order');
  assert.equal(create.args.p_total, 69990);
  assert.equal(create.args.p_shipping_cost, 4990);
  assert.equal(create.args.p_items[0].unit_price, 65000);
  assert.equal(create.args.p_payment_method, 'transferencia');
  assert.equal(create.args.p_channel, 'web_transferencia');
  assert.ok(!app.calls.some(call => call.table === 'customers' || call.table === 'order_items'));
  assert.match(res.headers['set-cookie'], /HttpOnly; Secure; SameSite=Lax/);
  assert.match(res.headers['set-cookie'], /Path=\/api\/order-status/);
  assert.ok(res.headers['set-cookie'].includes(ACCESS_TOKEN));
  assert.ok(!JSON.stringify(res.body).includes(ACCESS_TOKEN));
});

test('WhatsApp checkout is persisted as pending with its own channel', async () => {
  const app = backend();
  assert.equal((await app.call('api/orders.js', { ...PAYLOAD, payment_method: 'whatsapp' })).code, 201);
  const create = app.calls.find(call => call.rpc === 'backend_create_order');
  assert.equal(create.args.p_payment_method, 'transferencia');
  assert.equal(create.args.p_channel, 'whatsapp_bot');
});

test('idempotent orders reuse a persisted order and reject a different normalized payload', async () => {
  const app = backend();
  const first = await app.call();
  const retry = await app.call();
  assert.equal(retry.body.order_id, first.body.order_id);
  assert.equal(app.records.size, 1);
  assert.equal(retry.headers['set-cookie'], first.headers['set-cookie']);
  const conflict = await app.call('api/orders.js', { ...PAYLOAD, items: [{ id: 'fogon', qty: 1 }] });
  assert.equal(conflict.code, 409);
  assert.equal(conflict.body.code, 'IDEMPOTENCY_CONFLICT');
  assert.equal(app.records.size, 1);
});

test('strict quantities and prototype product IDs fail before creating a partial order or payment preference', async () => {
  for (const item of [
    { id: '__proto__', qty: 1 }, { id: 'constructor', qty: 1 }, { id: 'toString', qty: 1 },
    ...['1', 1.5, 0, -1, 11, null, false, {}, []].map(qty => ({ id: 'barra_remolque', qty })),
    { id: 'barra_remolque', qty: 1, quantity: 2 }
  ]) {
    const app = backend();
    const res = await app.call('api/create-preference.js', { ...PAYLOAD, items: [item] });
    assert.equal(res.code, 400);
    assert.ok(!app.calls.some(call => call.rpc === 'backend_create_order'));
    assert.ok(!app.effects.some(effect => effect.sdk || effect.fetch));
    assert.equal(app.records.size, 0);
  }
  for (const changes of [
    { items: [] }, { items: new Array(11).fill({ id: 'barra_remolque', qty: 1 }) },
    { customer: { ...PAYLOAD.customer, email: 'not an email' } },
    { customer: { ...PAYLOAD.customer, full_name: 'x'.repeat(256) } },
    { shipping_method: 'unknown' },
    { customer: { ...PAYLOAD.customer, region: 'Región de prueba' }, shipping_method: 'rm_express' }
  ]) {
    const app = backend();
    assert.equal((await app.call('api/create-preference.js', { ...PAYLOAD, ...changes })).code, 400);
    assert.ok(!app.calls.some(call => call.rpc === 'backend_create_order'));
    assert.ok(!app.effects.some(effect => effect.sdk || effect.fetch));
  }
});

test('checkout legacy quantity aliases remain compatible and client prices are ignored', async () => {
  for (const item of [{ id: 'barra_remolque', qty: 2 }, { id: 'barra_remolque', quantity: 2 }, { id: 'barra_remolque', qty: 2, quantity: 2, unit_price: 1, price: 1 }]) {
    const app = backend();
    assert.equal((await app.call('api/create-preference.js', { ...PAYLOAD, items: [item] })).code, 200);
    const preference = app.effects.find(effect => effect.sdk === 'preference.create');
    assert.equal(preference.args.body.items[0].quantity, 2);
    assert.equal(preference.args.body.items[0].unit_price, 65000);
  }
});

test('payment URLs use the configured canonical origin regardless of supplied Host', async () => {
  const app = backend();
  const res = await app.call('api/create-preference.js', PAYLOAD, { headers: { host: 'attacker.invalid', 'idempotency-key': KEY } });
  assert.equal(res.code, 200);
  const preference = app.effects.find(effect => effect.sdk === 'preference.create');
  assert.equal(preference.args.body.external_reference, ORDER_ID);
  assert.equal(preference.args.body.notification_url, 'https://metalcreativo.cl/api/webhook');
  for (const url of Object.values(preference.args.body.back_urls)) assert.ok(url.startsWith('https://metalcreativo.cl/'));
  assert.equal(preference.args.requestOptions.idempotencyKey, ORDER_ID);
  assert.equal(res.body.init_point, PREF.sandbox_init_point);
  assert.equal(res.body.is_sandbox, true);
});

test('persisted preferences are retrieved on retries rather than created twice', async () => {
  const app = backend();
  assert.equal((await app.call('api/create-preference.js')).code, 200);
  assert.equal((await app.call('api/create-preference.js')).code, 200);
  assert.equal(app.effects.filter(effect => effect.sdk === 'preference.create').length, 1);
  assert.equal(app.effects.filter(effect => effect.sdk === 'preference.get').length, 1);
  assert.equal(app.calls.filter(call => call.rpc === 'backend_finish_preference').length, 1);
});

test('preference contention, failure to persist and missing redirect URLs fail closed', async () => {
  const busy = backend({ rpc: async (name, args) => ({ error: null, data: name === 'backend_consume_rate_limit' ? true : name === 'backend_create_order' ? { id: ORDER_ID, status: 'pending' } : { claimed: false, preference_id: null } }) });
  assert.equal((await busy.call('api/create-preference.js')).code, 409);
  assert.ok(!busy.effects.some(effect => effect.sdk));
  const notSaved = backend({ rpc: async name => ({ error: null, data: name === 'backend_consume_rate_limit' ? true : name === 'backend_create_order' ? { id: ORDER_ID, status: 'pending' } : name === 'backend_claim_preference' ? { claimed: true, preference_id: null } : false }) });
  assert.equal((await notSaved.call('api/create-preference.js')).code, 503);
  for (const preference of [async () => ({}), async () => ({ id: 'test', init_point: PREF.init_point }), async () => { throw new Error('private SDK detail'); }]) {
    const res = await backend({ preference }).call('api/create-preference.js');
    assert.equal(res.code, 503);
    assert.ok(!JSON.stringify(res.body).includes('private SDK detail'));
  }
});

test('APP_USR test accounts are detected by server API; explicit live mode rejects test users before any order', async () => {
  const fetch = async (url, init) => {
    assert.equal(url, 'https://api.mercadopago.com/users/me');
    assert.equal(init.headers.Authorization, 'Bearer APP_USR-synthetic-token');
    assert.ok(!url.includes('APP_USR-synthetic-token'));
    return { ok: true, json: async () => ({ id: 'synthetic-account', tags: ['test_user'] }) };
  };
  const testAccount = backend({ env: { MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-synthetic-token' }, fetch });
  const res = await testAccount.call('api/create-preference.js');
  assert.equal(res.code, 200);
  assert.equal(res.body.is_sandbox, true);
  assert.equal(res.body.init_point, PREF.sandbox_init_point);
  const live = backend({ env: { MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-synthetic-token', MERCADOPAGO_MODE: 'live' }, fetch });
  const denied = await live.call('api/create-preference.js');
  assert.equal(denied.code, 503);
  assert.equal(denied.body.code, 'PAYMENT_LIVE_ACCOUNT_REQUIRED');
  assert.ok(!live.calls.some(call => call.rpc === 'backend_create_order'));
  assert.ok(!live.effects.some(effect => effect.sdk));
});

test('explicit live mode and production defaults reject TEST credentials before an order or preference exists', async () => {
  for (const env of [{ MERCADOPAGO_MODE: 'live' }, { VERCEL_ENV: 'production' }]) {
    const app = backend({ env });
    const res = await app.call('api/create-preference.js');
    assert.equal(res.code, 503);
    assert.equal(res.body.code, 'PAYMENT_LIVE_ACCOUNT_REQUIRED');
    assert.equal(app.records.size, 0);
    assert.ok(!app.calls.some(call => call.rpc === 'backend_create_order'));
    assert.ok(!app.effects.some(effect => effect.sdk || effect.fetch));
  }
  const sandbox = backend({ env: { MERCADOPAGO_MODE: 'sandbox', VERCEL_ENV: 'production' } });
  const sandboxRes = await sandbox.call('api/create-preference.js');
  assert.equal(sandboxRes.code, 200);
  assert.equal(sandboxRes.body.is_sandbox, true);
  const real = backend({ env: { MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-synthetic-token', MERCADOPAGO_MODE: 'live', VERCEL_ENV: 'production' } });
  const liveRes = await real.call('api/create-preference.js');
  assert.equal(liveRes.code, 200);
  assert.equal(liveRes.body.is_sandbox, false);
  assert.equal(liveRes.body.init_point, PREF.init_point);
});

test('missing configuration, origin failures, malformed input and database failures never fall back to local customer files', async () => {
  for (const [options, request, code] of [
    [{ env: { MERCADOPAGO_ACCESS_TOKEN: undefined } }, {}, 503],
    [{ env: { SUPABASE_SERVICE_ROLE_KEY: undefined } }, {}, 503],
    [{ env: { ORDER_ACCESS_SECRET: undefined } }, {}, 503],
    [{ env: { SITE_URL: 'http://attacker.invalid' } }, { headers: {} }, 503],
    [{}, { headers: { origin: 'https://attacker.invalid' } }, 403],
    [{ rpc: async () => ({ data: false, error: null }) }, {}, 429],
    [{ rpc: async () => ({ data: null, error: { message: 'private database detail' } }) }, {}, 503]
  ]) {
    const app = backend(options);
    const res = await app.call('api/create-preference.js', PAYLOAD, request);
    assert.equal(res.code, code);
    assert.equal(res.body.success, false);
    assert.ok(!JSON.stringify(res.body).includes('private database detail'));
    assert.ok(!app.effects.some(effect => effect.sdk));
  }
  for (const body of ['{bad', '[]', { ...PAYLOAD, padding: 'x'.repeat(129 * 1024) }]) {
    const app = backend();
    assert.ok([400, 413].includes((await app.call('api/create-preference.js', body)).code));
    assert.equal(app.calls.length, 0);
  }
});

test('order status requires the secret cookie or private header and never accepts tokens through URLs', async () => {
  for (const headers of [{ cookie: `mc_order_access=${ORDER_ID}.${ACCESS_TOKEN}` }, { 'x-order-token': ACCESS_TOKEN }]) {
    const app = backend();
    const res = await app.call('api/order-status.js', undefined, { query: { order_id: ORDER_ID }, headers });
    assert.equal(res.code, 200);
    assert.equal(res.body.order.id, ORDER_ID);
    assert.ok(!JSON.stringify(res.body).includes('NEVER_EXPOSE'));
    assert.ok(!JSON.stringify(res.body).includes(ACCESS_TOKEN));
    const select = app.calls.find(call => call.table);
    assert.ok(!/email|rut|customer|ip_address|public_token_hash/.test(select.fields));
    assert.deepEqual(select.filters, [['id', ORDER_ID], ['public_token_hash', createHash('sha256').update(ACCESS_TOKEN).digest('hex')]]);
    assert.match(res.headers['cache-control'], /no-store/);
  }
  const queryToken = backend();
  assert.equal((await queryToken.call('api/order-status.js', undefined, { query: { order_id: ORDER_ID, token: ACCESS_TOKEN }, headers: {} })).code, 404);
  assert.equal(queryToken.calls.length + queryToken.effects.length, 0);
});

test('wrong/missing order secrets and duplicate cookies cannot enumerate a customer order', async () => {
  for (const headers of [
    {}, { 'x-order-token': 'wrong' }, { 'x-order-token': 'a'.repeat(64) },
    { cookie: `mc_order_access=00000000-0000-4000-8000-000000000002.${ACCESS_TOKEN}` },
    { cookie: `mc_order_access=${ORDER_ID}.${ACCESS_TOKEN}; mc_order_access=${ORDER_ID}.${ACCESS_TOKEN}` }
  ]) {
    const res = await backend().call('api/order-status.js', undefined, { query: { order_id: ORDER_ID }, headers });
    assert.equal(res.code, 404);
    assert.equal(res.body.code, 'ORDER_NOT_FOUND');
    assert.ok(!JSON.stringify(res.body).includes('NEVER_EXPOSE'));
  }
  const failed = await backend({ query: async () => ({ data: null, error: { message: 'private detail' } }) }).call('api/order-status.js', undefined, { query: { order_id: ORDER_ID }, headers: { 'x-order-token': ACCESS_TOKEN } });
  assert.equal(failed.code, 503);
  assert.ok(!JSON.stringify(failed.body).includes('private detail'));
});
