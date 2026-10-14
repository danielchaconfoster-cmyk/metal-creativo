const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const ADMIN = 'synthetic-admin-key-0123456789abcdef0123456789abcdef';
const LEGACY = ['metalcreativo', '2026'].join('');
const MESSAGE_ID = 'wamid.stored+/=123';
const RECORD = { id: MESSAGE_ID, phone: '56900000000', text: 'Texto guardado de prueba', customer_name: 'Persona sintética', status: 'failed',
  error_code: 'PROVIDER_REJECTED', sent_count: 1, retry_count: 1, retry_after: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' };
const SNAPSHOT = { bubbles: ['Ya enviada', 'Respuesta pendiente', 'Última respuesta pendiente'], history: [], lead: { name: 'Persona sintética', last_message: RECORD.text } };

// Real authorization, request parsing, private API and shared WhatsApp processing
// run with isolated configuration and synthetic Supabase/fetch transports.
function backend(options = {}) {
  const env = { ADMIN_TOKEN: ADMIN, META_ACCESS_TOKEN: 'synthetic-meta-token', WHATSAPP_PHONE_NUMBER_ID: '100000000001',
    GEMINI_API_KEY: 'synthetic-gemini-key', SUPABASE_URL: 'https://database.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-db-key', ...options.env };
  const calls = [], effects = [], cache = new Map();
  const record = { ...RECORD, ...options.record };
  function query(table) {
    const state = { table, filters: [] };
    const execute = async single => {
      calls.push({ ...structuredClone(state), single });
      if (options.query) return options.query(state, single);
      const selected = Object.fromEntries(state.fields.split(',').map(field => [field, record[field]]));
      return { data: single ? selected : [selected], error: null };
    };
    return { select(fields) { state.fields = fields; return this; },
      eq(field, value) { state.filters.push([field, value]); return this; },
      in(field, values) { state.in = { field, values }; return this; },
      order(field, value) { state.order = { field, ...value }; return this; },
      limit(value) { state.limit = value; return this; },
      maybeSingle() { return execute(true); }, then(resolve, reject) { return execute(false).then(resolve, reject); } };
  }
  const db = { from: query, async rpc(name, args) {
    calls.push({ rpc: name, args: structuredClone(args) });
    if (options.rpc) return options.rpc(name, args);
    if (name === 'backend_requeue_whatsapp') return { data: true, error: null };
    if (name === 'backend_claim_whatsapp') return { data: { claimed: true, response: SNAPSHOT, sent_count: 1 }, error: null };
    if (name === 'backend_start_whatsapp_send') return { data: true, error: null };
    if (name === 'backend_finish_whatsapp') return { data: null, error: null };
    throw new Error('Unexpected RPC: ' + name);
  } };
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
        if (url.includes('generativelanguage')) throw new Error('A stored retry must not regenerate AI replies');
        return options.fetch ? options.fetch(url, init) : { ok: true, json: async () => ({ messages: [{ id: 'wamid.synthetic-outbound' }] }) };
      },
      require(name) {
        if (name === '@supabase/supabase-js') return { createClient() { effects.push({ database: true }); return db; } };
        if (name.startsWith('node:') && !['node:fs', 'node:child_process'].includes(name)) return require(name);
        if (name.startsWith('.')) return load(path.relative(ROOT, path.resolve(path.dirname(file), name + '.js')));
        throw new Error('Unexpected dependency: ' + name);
      }
    }, { filename: file });
    return module.exports;
  }
  return { env, calls, effects, async call(request = {}) {
    const req = { method: 'POST', headers: { 'x-admin-token': ADMIN }, body: { message_id: MESSAGE_ID }, ...request };
    const res = { headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
      status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; }, send(data) { this.body = data; return this; } };
    await load('api/admin-whatsapp.js')(req, res);
    return res;
  }, outbound() { return effects.filter(effect => effect.fetch); } };
}

test('private WhatsApp inventory/retry rejects alternate credentials and legacy bypasses before I/O', async () => {
  for (const method of ['GET', 'POST']) {
    for (const request of [
      { headers: {} }, { headers: { 'x-admin-token': LEGACY } }, { headers: { 'x-admin-token': 'x'.repeat(48) } },
      { headers: {}, query: { token: ADMIN } }, { headers: {}, url: '/api/admin-whatsapp?token=' + ADMIN },
      { headers: {}, body: { message_id: MESSAGE_ID, admin_token: ADMIN } },
      { headers: { host: 'localhost' } }, { headers: { host: '127.0.0.1:3000' } },
      { headers: { 'x-admin-token': [ADMIN] } },
      { headers: { 'x-admin-token': ADMIN, authorization: 'Bearer ' + ADMIN } },
      { rawHeaders: ['X-Admin-Token', ADMIN, 'x-admin-token', ADMIN] }
    ]) {
      const app = backend();
      assert.equal((await app.call({ method, ...request })).code, 401);
      assert.equal(app.calls.length + app.effects.length, 0);
    }
  }
  const missing = backend({ env: { ADMIN_TOKEN: undefined } });
  assert.equal((await missing.call()).code, 503);
  assert.equal(missing.calls.length + missing.effects.length, 0);
  const badMethod = backend();
  assert.equal((await badMethod.call({ method: 'DELETE' })).code, 405);
  assert.equal(badMethod.calls.length + badMethod.effects.length, 0);
});

test('authorized error inventory returns a bounded status list without recipient/contact text', async () => {
  const app = backend();
  const res = await app.call({ method: 'GET', headers: { authorization: 'Bearer ' + ADMIN } });
  assert.equal(res.code, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.messages[0].id, MESSAGE_ID);
  assert.equal(res.body.messages[0].status, 'failed');
  for (const key of ['phone', 'text', 'customer_name', 'response', 'history']) assert.ok(!Object.hasOwn(res.body.messages[0], key));
  assert.equal(app.calls[0].limit, 20);
  assert.deepEqual(app.calls[0].in.values, ['failed', 'retryable', 'uncertain', 'awaiting_configuration']);
  assert.equal(app.outbound().length, 0);
  assert.match(res.headers['cache-control'], /no-store/);
});

test('manual retries read recipient and text exclusively from the persisted message and resume cached bubbles', async () => {
  const app = backend();
  const res = await app.call();
  assert.equal(res.code, 200);
  assert.equal(res.body.status, 'completed');
  assert.equal(res.body.message_id, MESSAGE_ID);
  const claim = app.calls.find(call => call.rpc === 'backend_claim_whatsapp');
  assert.equal(claim.args.p_phone, RECORD.phone);
  assert.equal(claim.args.p_text, RECORD.text);
  assert.equal(claim.args.p_name, RECORD.customer_name);
  const outbound = app.outbound().map(effect => JSON.parse(effect.init.body));
  assert.deepEqual(outbound.map(body => body.to), [RECORD.phone, RECORD.phone]);
  assert.deepEqual(outbound.map(body => body.text.body), ['Respuesta pendiente', 'Última respuesta pendiente']);
  assert.deepEqual(app.calls.filter(call => call.rpc === 'backend_start_whatsapp_send').map(call => call.args.p_index), [1, 2]);
  assert.ok(app.outbound().every(effect => effect.init.headers.Authorization === 'Bearer synthetic-meta-token'));
  assert.ok(!JSON.stringify(res.body).includes(RECORD.phone));
});

test('an uncertain delivery requires an explicit boolean risk acknowledgement', async () => {
  for (const confirm of [undefined, false]) {
    const app = backend({ record: { status: 'uncertain' } });
    const res = await app.call({ body: { message_id: MESSAGE_ID, ...(confirm === undefined ? {} : { confirm_delivery_uncertain: confirm }) } });
    assert.equal(res.code, 409);
    assert.equal(res.body.code, 'DELIVERY_CONFIRMATION_REQUIRED');
    assert.ok(!app.calls.some(call => call.rpc));
    assert.equal(app.outbound().length, 0);
  }
  const allowed = backend({ record: { status: 'uncertain' } });
  assert.equal((await allowed.call({ body: { message_id: MESSAGE_ID, confirm_delivery_uncertain: true } })).code, 200);
  assert.equal(allowed.calls.find(call => call.rpc === 'backend_requeue_whatsapp').args.p_confirm_delivery_uncertain, true);
});

test('recipient injection and malformed retry requests cannot drive outbound sends', async () => {
  for (const body of [
    { message_id: MESSAGE_ID, phone: '56999999999' }, { message_id: MESSAGE_ID, recipient: '56999999999' },
    { message_id: MESSAGE_ID, text: 'attacker text' }, { message_id: MESSAGE_ID, confirm_delivery_uncertain: 'true' },
    { message_id: 'wamid.invalid whitespace' }, { message_id: {} }, {}
  ]) {
    const app = backend();
    assert.equal((await app.call({ body })).code, 400);
    assert.equal(app.calls.length, 0);
    assert.equal(app.outbound().length, 0);
  }
});

test('configuration and service-only requeue decisions are checked before attempting a send', async () => {
  for (const env of [{ META_ACCESS_TOKEN: undefined }, { WHATSAPP_PHONE_NUMBER_ID: undefined }]) {
    const app = backend({ env });
    assert.equal((await app.call()).code, 503);
    assert.equal(app.calls.length, 0);
    assert.equal(app.outbound().length, 0);
  }
  const denied = backend({ rpc: async name => {
    assert.equal(name, 'backend_requeue_whatsapp');
    return { data: false, error: null };
  } });
  assert.equal((await denied.call()).code, 409);
  assert.equal(denied.calls.filter(call => call.rpc).length, 1);
  assert.equal(denied.outbound().length, 0);
});

test('missing records and storage failures remain private, explicit failures', async () => {
  const absent = backend({ query: async () => ({ data: null, error: null }) });
  assert.equal((await absent.call()).code, 404);
  assert.equal(absent.outbound().length, 0);
  for (const options of [
    { query: async () => ({ data: null, error: { message: 'private database detail' } }) },
    { rpc: async () => ({ data: null, error: { message: 'private database detail' } }) }
  ]) {
    const app = backend(options);
    const res = await app.call();
    assert.equal(res.code, 503);
    assert.ok(!JSON.stringify(res.body).includes('private database detail'));
    assert.equal(app.outbound().length, 0);
  }
});
