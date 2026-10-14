const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const KEY = '00000000-0000-4000-8000-000000000010';
const PAYLOAD = { name: 'Persona sintética', email: 'test@example.invalid', phone: '+56 9 0000 0000', product_interest: 'remolque', message: 'Consulta de prueba.' };

// Evaluate the actual endpoint and shared helpers without loading .env or using
// network/customer files. The Supabase client has a synthetic in-memory transport.
function backend(options = {}) {
  const env = { SUPABASE_URL: 'https://database.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-db-key', ...options.env };
  const calls = [], effects = [], records = new Map(), cache = new Map();
  function query(table) {
    const state = { table, operation: 'select', filters: [] };
    async function execute() {
      const call = structuredClone(state);
      calls.push(call);
      if (options.query) return options.query(call, records);
      if (state.operation === 'insert') {
        if (records.has(state.values.idempotency_key)) return { data: null, error: { code: '23505' } };
        const row = { ...state.values, id: '00000000-0000-4000-8000-000000000099', created_at: '2026-01-01T00:00:00.000Z' };
        records.set(row.idempotency_key, row);
        return { data: row, error: null };
      }
      const key = state.filters.find(([field]) => field === 'idempotency_key')?.[1];
      return { data: records.get(key) || null, error: null };
    }
    return {
      select(fields) { state.fields = fields; return this; },
      eq(field, value) { state.filters.push([field, value]); return this; },
      insert(values) { state.operation = 'insert'; state.values = values; return this; },
      single: execute, maybeSingle: execute,
      then(resolve, reject) { return execute().then(resolve, reject); }
    };
  }
  const db = { from: query, async rpc(name, args) {
    calls.push({ rpc: name, args });
    return options.rpc ? options.rpc(name, args) : { data: true, error: null };
  } };
  function load(relative) {
    const file = path.resolve(ROOT, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
      module, exports: module.exports, process: { env }, Buffer, TextDecoder, URL, setTimeout, clearTimeout,
      fetch() { throw new Error('Contact must not contact an external provider'); },
      require(name) {
        if (name === '@supabase/supabase-js') return { createClient(url, key, config) { effects.push({ database: true, url, key, config }); return db; } };
        if (name.startsWith('node:')) return require(name);
        if (name.startsWith('.')) return load(path.relative(ROOT, path.resolve(path.dirname(file), name + '.js')));
        throw new Error('Unexpected dependency: ' + name);
      }
    }, { filename: file });
    return module.exports;
  }
  return { env, calls, effects, records, async call(body = PAYLOAD, request = {}) {
    const req = { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://metalcreativo.cl', 'idempotency-key': KEY },
      socket: { remoteAddress: '192.0.2.1' }, body, ...request };
    const res = { headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
      status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } };
    await load('api/contact.js')(req, res);
    return res;
  } };
}

test('contact persists normalized validated data before returning success without exposing PII', async () => {
  const app = backend();
  const res = await app.call({ ...PAYLOAD, name: '  Persona sintética  ', email: ' Test@Example.Invalid ', phone: '+56 (9) 0000-0000' });
  assert.equal(res.code, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.status, 'new');
  assert.equal(app.records.size, 1);
  const row = [...app.records.values()][0];
  assert.equal(row.name, 'Persona sintética');
  assert.equal(row.email, 'test@example.invalid');
  assert.equal(row.phone, '+56900000000');
  assert.equal(row.product_interest, 'remolque');
  assert.equal(row.message, PAYLOAD.message);
  assert.match(row.request_hash, /^[a-f0-9]{64}$/);
  assert.equal(row.idempotency_key, KEY);
  for (const key of ['name', 'email', 'phone', 'message', 'request_hash', 'idempotency_key']) assert.ok(!Object.hasOwn(res.body, key));
  assert.match(res.headers['cache-control'], /no-store/);
  const rate = app.calls.find(call => call.rpc);
  assert.equal(rate.rpc, 'backend_consume_rate_limit');
  assert.equal(rate.args.p_scope, 'contact');
  assert.equal(rate.args.p_limit, 5);
  assert.equal(rate.args.p_window_seconds, 600);
  assert.equal(rate.args.p_key, createHash('sha256').update('192.0.2.1').digest('hex'));
});

test('same key and normalized payload return the existing contact while mismatches cannot overwrite it', async () => {
  const app = backend();
  const first = await app.call();
  const retry = await app.call({ ...PAYLOAD, email: 'TEST@EXAMPLE.INVALID', phone: '+56 (9) 0000-0000' });
  assert.equal(retry.code, 200);
  assert.equal(retry.body.contact_id, first.body.contact_id);
  assert.equal(app.records.size, 1);
  assert.equal(app.calls.filter(call => call.rpc).length, 1);
  const conflict = await app.call({ ...PAYLOAD, message: 'A different request' });
  assert.equal(conflict.code, 409);
  assert.equal(conflict.body.code, 'IDEMPOTENCY_CONFLICT');
  assert.equal([...app.records.values()][0].message, PAYLOAD.message);
  assert.equal(app.calls.filter(call => call.operation === 'insert').length, 1);
});

test('concurrent submissions meet at the unique database key and store one contact', async () => {
  const app = backend();
  const results = await Promise.all([app.call(), app.call()]);
  assert.deepEqual(results.map(result => result.code).sort(), [200, 201]);
  assert.equal(results[0].body.contact_id, results[1].body.contact_id);
  assert.equal(app.records.size, 1);
});

test('body idempotency keys are accepted but ambiguous, too short and conflicting keys are rejected', async () => {
  const app = backend();
  const bodyKey = await app.call({ ...PAYLOAD, idempotency_key: KEY }, { headers: { origin: 'https://metalcreativo.cl' } });
  assert.equal(bodyKey.code, 201);
  for (const request of [
    { headers: { origin: 'https://metalcreativo.cl', 'idempotency-key': 'short' } },
    { headers: { origin: 'https://metalcreativo.cl', 'idempotency-key': KEY + ',' + KEY } },
    { headers: { origin: 'https://metalcreativo.cl', 'idempotency-key': [KEY] } },
    { headers: { origin: 'https://metalcreativo.cl', 'idempotency-key': KEY, 'Idempotency-Key': KEY } },
    { rawHeaders: ['Idempotency-Key', KEY, 'idempotency-key', KEY] }
  ]) {
    const invalid = backend();
    assert.equal((await invalid.call(PAYLOAD, request)).code, 400);
    assert.equal(invalid.calls.length, 0);
  }
  assert.equal((await backend().call({ ...PAYLOAD, idempotency_key: 'different-valid-key-0123456789' })).code, 400);
  const generated = backend();
  assert.equal((await generated.call(PAYLOAD, { headers: { origin: 'https://metalcreativo.cl' } })).code, 201);
  assert.match([...generated.records.keys()][0], /^[0-9a-f-]{36}$/);
});

test('shared rate limits fail closed and do not write a contact when denied or unavailable', async () => {
  const limited = backend({ rpc: async () => ({ data: false, error: null }) });
  const res = await limited.call();
  assert.equal(res.code, 429);
  assert.equal(res.headers['retry-after'], '600');
  assert.equal(limited.records.size, 0);
  assert.ok(!limited.calls.some(call => call.operation === 'insert'));
  for (const rpc of [
    async () => ({ data: null, error: { message: 'private detail' } }),
    async () => ({ data: 'true', error: null })
  ]) {
    const app = backend({ rpc });
    const error = await app.call();
    assert.equal(error.code, 503);
    assert.ok(!JSON.stringify(error.body).includes('private detail'));
    assert.equal(app.records.size, 0);
  }
});

test('local clients cannot rotate rate buckets by spoofing proxy headers; Vercel accepts valid forwarded addresses', async () => {
  const local = backend();
  await local.call(PAYLOAD, { headers: { 'x-forwarded-for': '192.0.2.200' } });
  assert.equal(local.calls.find(call => call.rpc).args.p_key, createHash('sha256').update('192.0.2.1').digest('hex'));
  const vercel = backend({ env: { VERCEL: '1' } });
  await vercel.call(PAYLOAD, { headers: { 'x-forwarded-for': '192.0.2.200, 192.0.2.201' } });
  assert.equal(vercel.calls.find(call => call.rpc).args.p_key, createHash('sha256').update('192.0.2.200').digest('hex'));
  const malformed = backend({ env: { VERCEL: '1' } });
  await malformed.call(PAYLOAD, { headers: { 'x-forwarded-for': 'not an ip' } });
  assert.equal(malformed.calls.find(call => call.rpc).args.p_key, createHash('sha256').update('192.0.2.1').digest('hex'));
});

test('cross-site origins are rejected before database effects and the configured origin remains usable', async () => {
  for (const headers of [
    { origin: 'https://metalcreativo.cl.attacker.invalid' }, { origin: 'null' }, { origin: ['https://metalcreativo.cl'] },
    { origin: 'https://metalcreativo.cl/' }, { origin: 'https://attacker.invalid', host: 'attacker.invalid' },
    { 'sec-fetch-site': 'cross-site' }
  ]) {
    const app = backend();
    const res = await app.call(PAYLOAD, { headers });
    assert.equal(res.code, 403);
    assert.equal(app.calls.length + app.effects.length, 0);
  }
  const configured = backend({ env: { SITE_URL: 'https://preview.example.invalid' } });
  assert.equal((await configured.call(PAYLOAD, { headers: { origin: 'https://preview.example.invalid' } })).code, 201);
  assert.equal((await backend().call(PAYLOAD, { headers: { origin: 'http://localhost:3000' } })).code, 201);
  assert.equal((await backend({ env: { VERCEL: '1' } }).call(PAYLOAD, { headers: { origin: 'http://localhost:3000' } })).code, 403);
});

test('bounded validation rejects invalid inputs without database writes', async () => {
  for (const changes of [
    { name: '' }, { name: 'x'.repeat(101) }, { name: 'line\nbreak' }, { name: { value: 'invalid' } },
    { email: 'not an email' }, { email: 'x'.repeat(255) }, { phone: 'phone' }, { phone: '123' }, { phone: '9'.repeat(16) },
    { product_interest: 'unknown' }, { message: 'x'.repeat(4001) }, { message: '\u0000' }, { message: [] },
    { status: 'paid' }
  ]) {
    const app = backend();
    const res = await app.call({ ...PAYLOAD, ...changes });
    assert.equal(res.code, 400);
    assert.equal(app.calls.length + app.effects.length, 0);
  }
  for (const interest of ['remolque', 'fogon', 'medida', 'garantia']) {
    assert.equal((await backend().call({ ...PAYLOAD, product_interest: interest, message: '' })).code, 201);
  }
});

test('malformed and oversized bodies, method errors and persistence failures never return success', async () => {
  for (const [body, expected] of [['{bad json', 400], ['[]', 400], [null, 400], [{ ...PAYLOAD, message: 'x'.repeat(130 * 1024) }, 413]]) {
    const app = backend();
    const res = await app.call(body);
    assert.equal(res.code, expected);
    assert.equal(res.body.success, false);
    assert.equal(app.calls.length, 0);
  }
  const method = backend();
  const rejected = await method.call(PAYLOAD, { method: 'GET' });
  assert.equal(rejected.code, 405);
  assert.equal(rejected.headers.allow, 'POST');
  assert.equal(method.calls.length, 0);
  for (const options of [
    { env: { SUPABASE_SERVICE_ROLE_KEY: undefined } },
    { query: async () => ({ data: null, error: { message: 'private detail' } }) },
    { query: async state => state.operation === 'insert' ? { data: null, error: { message: 'private detail' } } : { data: null, error: null } }
  ]) {
    const res = await backend(options).call();
    assert.equal(res.code, 503);
    assert.equal(res.body.success, false);
    assert.ok(!JSON.stringify(res.body).includes('private detail'));
  }
});
