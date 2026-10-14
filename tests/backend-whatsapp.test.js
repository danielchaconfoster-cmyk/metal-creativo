const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHmac } = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const SECRET = 'synthetic-meta-app-secret';
const ADMIN = 'synthetic-admin-key-0123456789abcdef0123456789abcdef';
const PHONE_ID = '100000000001';

function event(ids = ['wamid.test1'], phone = '56900000000', receiver = PHONE_ID) {
  return { object: 'whatsapp_business_account', entry: [{ changes: [{ value: {
    metadata: { phone_number_id: receiver }, contacts: [{ wa_id: phone, profile: { name: 'Persona sintética' } }],
    messages: ids.map(id => ({ id, from: phone, type: 'text', text: { body: 'Consulta de prueba: ñ y á 🔧' } }))
  } }] }] };
}
const sign = raw => 'sha256=' + createHmac('sha256', SECRET).update(raw).digest('hex');

function backend(options = {}) {
  const env = { META_APP_SECRET: SECRET, ADMIN_TOKEN: ADMIN, WHATSAPP_VERIFY_TOKEN: 'synthetic-verify-token',
    WHATSAPP_PHONE_NUMBER_ID: PHONE_ID, META_ACCESS_TOKEN: 'synthetic-meta-token',
    SUPABASE_URL: 'https://database.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-db-key', ...options.env };
  const calls = [], effects = [], states = new Map(), cache = new Map();
  const db = { from() { throw new Error('WhatsApp persistence must use transactional RPCs'); }, async rpc(name, args) {
    calls.push({ rpc: name, args: structuredClone(args) });
    if (options.rpc) return options.rpc(name, args, states);
    if (name === 'backend_claim_whatsapp') {
      const previous = states.get(args.p_id);
      if (previous) return { data: { claimed: false, reason: 'already_processed', status: previous.status }, error: null };
      states.set(args.p_id, { status: 'processing', sent_count: 0, history: [] });
      return { data: { claimed: true, history: [] }, error: null };
    }
    if (name === 'backend_start_whatsapp_send') return { data: true, error: null };
    if (name === 'backend_finish_whatsapp') {
      states.set(args.p_id, { status: args.p_status, sent_count: args.p_sent_count, response: structuredClone(args.p_response) });
      return { data: null, error: null };
    }
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
        if (options.fetch) return options.fetch(url, init);
        if (url.includes('generativelanguage')) return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ messages: ['Respuesta sintética'] }) }] } }] }) };
        return { ok: true, json: async () => ({ messages: [{ id: 'wamid.outbound-synthetic' }] }) };
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
  return { env, calls, effects, states, async call(request = {}) {
    const raw = Buffer.from(JSON.stringify(event()));
    const req = { method: 'POST', headers: { 'x-hub-signature-256': sign(raw) }, rawBody: raw, ...request };
    const res = { headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
      status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; }, send(data) { this.body = data; return this; } };
    await load('api/whatsapp-webhook.js')(req, res);
    return res;
  }, outbound() { return effects.filter(effect => effect.fetch?.includes('graph.facebook.com')); } };
}

test('invalid, missing and duplicate Meta HMAC signatures never create sessions or outbound calls', async () => {
  const raw = Buffer.from(JSON.stringify(event()));
  for (const request of [
    { headers: {} }, { headers: { 'x-hub-signature-256': 'sha256=' + '0'.repeat(64) } },
    { headers: { 'x-hub-signature-256': sign(raw) + ',' + sign(raw) } },
    { headers: { 'x-hub-signature-256': [sign(raw)] } },
    { headers: { 'x-hub-signature-256': sign(raw), 'X-Hub-Signature-256': sign(raw) } },
    { rawHeaders: ['X-Hub-Signature-256', sign(raw), 'x-hub-signature-256', sign(raw)] }
  ]) {
    const app = backend();
    const res = await app.call(request);
    assert.ok([400, 401].includes(res.code));
    assert.equal(app.calls.length + app.effects.length, 0);
  }
  const missing = backend({ env: { META_APP_SECRET: undefined } });
  assert.equal((await missing.call()).code, 503);
  assert.equal(missing.calls.length + missing.effects.length, 0);
});

test('Meta verification requires private configuration and rejects the former hardcoded value', async () => {
  const legacy = ['metal_creativo', 'webhook_secure_2026'].join('_');
  const missing = backend({ env: { WHATSAPP_VERIFY_TOKEN: undefined } });
  assert.equal((await missing.call({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': legacy, 'hub.challenge': '1234' } })).code, 503);
  const app = backend();
  assert.equal((await app.call({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': legacy, 'hub.challenge': '1234' } })).code, 403);
  assert.equal((await app.call({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': ['synthetic-verify-token'], 'hub.challenge': '1234' } })).code, 403);
  const good = await app.call({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'synthetic-verify-token', 'hub.challenge': '1234' } });
  assert.equal(good.code, 200);
  assert.equal(good.body, '1234');
  assert.equal(app.calls.length + app.effects.length, 0);
});

test('Meta authenticates original whitespace and Unicode bytes and rejects parse/reserialize or raw tampering', async () => {
  const raw = Buffer.from(JSON.stringify(event(), null, 2) + '\n\t', 'utf8');
  const app = backend();
  const good = await app.call({ rawBody: raw, headers: { 'x-hub-signature-256': sign(raw) }, body: { object: 'wrong' } });
  assert.equal(good.code, 200);
  assert.ok(app.calls.find(call => call.rpc === 'backend_claim_whatsapp').args.p_text.includes('ñ y á 🔧'));
  for (const altered of [Buffer.from(JSON.stringify(JSON.parse(raw))), Buffer.concat([raw, Buffer.from(' ')])]) {
    const rejected = backend();
    assert.equal((await rejected.call({ rawBody: altered, headers: { 'x-hub-signature-256': sign(raw) } })).code, 401);
    assert.equal(rejected.calls.length + rejected.effects.length, 0);
  }
});

test('raw streams preserve the signed bytes with native helpers disabled; malformed/oversized bodies have no effects', async () => {
  const raw = Buffer.from(JSON.stringify(event(), null, 2));
  const app = backend();
  const streamRequest = { rawBody: undefined, body: undefined, headers: { 'x-hub-signature-256': sign(raw), 'content-length': String(raw.length) },
    async *[Symbol.asyncIterator]() { yield raw.subarray(0, 17); yield raw.subarray(17); } };
  assert.equal((await app.call(streamRequest)).code, 200);
  for (const [bytes, expected] of [[Buffer.from('{broken'), 400], [Buffer.alloc(129 * 1024, 32), 413], [Buffer.from([0xff, 0xfe]), 400]]) {
    const rejected = backend();
    assert.equal((await rejected.call({ rawBody: bytes, headers: { 'x-hub-signature-256': sign(bytes) } })).code, expected);
    assert.equal(rejected.calls.length + rejected.effects.length, 0);
  }
});

test('simulations require admin authorization and never write leads, sessions or files', async () => {
  const raw = Buffer.from(JSON.stringify({ simulate: true, message: 'Mensaje sintético' }));
  const denied = backend();
  assert.equal((await denied.call({ rawBody: raw, body: { simulate: true }, headers: {} })).code, 401);
  assert.equal(denied.calls.length + denied.effects.length, 0);
  const app = backend({ env: { GEMINI_API_KEY: 'synthetic-gemini-key' } });
  const res = await app.call({ rawBody: raw, headers: { 'x-admin-token': ADMIN } });
  assert.equal(res.code, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.mode, 'simulated_human_ai');
  assert.equal(res.body.messages[0], 'Respuesta sintética');
  assert.equal(app.calls.length, 0);
  assert.equal(app.effects.filter(effect => effect.database).length, 0);
  assert.equal(app.outbound().length, 0);
});

test('all messages across nested entries/changes are processed and wrong receivers are rejected before storage', async () => {
  const batch = event(['wamid.first', 'wamid.second']);
  batch.entry[0].changes.push(event(['wamid.third'], '56900000001').entry[0].changes[0]);
  batch.entry.push(event(['wamid.fourth'], '56900000002').entry[0]);
  const raw = Buffer.from(JSON.stringify(batch));
  const app = backend({ env: { GEMINI_API_KEY: 'synthetic-gemini-key' } });
  assert.equal((await app.call({ rawBody: raw, headers: { 'x-hub-signature-256': sign(raw) } })).code, 200);
  assert.equal(app.calls.filter(call => call.rpc === 'backend_claim_whatsapp').length, 4);
  assert.equal(app.outbound().length, 4);
  assert.ok(app.outbound().every(effect => effect.init.headers.Authorization === 'Bearer synthetic-meta-token' && effect.init.redirect === 'error'));
  for (const effect of app.outbound()) assert.ok(!effect.fetch.includes('synthetic-meta-token'));
  const wrong = Buffer.from(JSON.stringify(event(['wamid.wrong'], '56900000000', '99999999')));
  const denied = backend();
  assert.equal((await denied.call({ rawBody: wrong, headers: { 'x-hub-signature-256': sign(wrong) } })).code, 403);
  assert.equal(denied.calls.length + denied.effects.length, 0);
  const mixedBatch = event(['wamid.valid-first']);
  mixedBatch.entry.push(event(['wamid.wrong-last'], '56900000001', '99999999').entry[0]);
  const mixedRaw = Buffer.from(JSON.stringify(mixedBatch));
  const mixed = backend();
  assert.equal((await mixed.call({ rawBody: mixedRaw, headers: { 'x-hub-signature-256': sign(mixedRaw) } })).code, 403);
  assert.equal(mixed.calls.length + mixed.effects.length, 0);
});

test('durable claim decisions suppress completed, processing and uncertain duplicate sends', async () => {
  const app = backend({ env: { GEMINI_API_KEY: 'synthetic-gemini-key' } });
  assert.equal((await app.call()).code, 200);
  const outbound = app.outbound().length;
  assert.equal(outbound, 1);
  assert.equal(app.states.get('wamid.test1').status, 'completed');
  assert.deepEqual(app.calls.filter(call => call.rpc === 'backend_finish_whatsapp').map(call => [call.args.p_status, call.args.p_sent_count]), [['processing', 1], ['completed', 1]]);
  assert.equal((await app.call()).code, 200);
  assert.equal(app.outbound().length, outbound);
  for (const [reason, expectedStatus] of [['processing', 503], ['retryable', 503], ['uncertain', 200], ['completed', 200]]) {
    const duplicate = backend({ rpc: async () => ({ data: { claimed: false, reason: 'already_processed', status: reason }, error: null }) });
    assert.equal((await duplicate.call()).code, expectedStatus);
    assert.equal(duplicate.outbound().length, 0);
    assert.equal(duplicate.calls.length, 1);
  }
});

test('base64-style WAMIDs are accepted exactly while whitespace remains invalid', async () => {
  const id = 'wamid.Synthetic+/=abc-123';
  const raw = Buffer.from(JSON.stringify(event([id])));
  const app = backend();
  assert.equal((await app.call({ rawBody: raw, headers: { 'x-hub-signature-256': sign(raw) } })).code, 200);
  assert.equal(app.calls.find(call => call.rpc === 'backend_claim_whatsapp').args.p_id, id);
  for (const invalidId of ['wamid.has space', 'wamid.has\nnewline']) {
    const invalid = Buffer.from(JSON.stringify(event([invalidId])));
    const denied = backend();
    assert.equal((await denied.call({ rawBody: invalid, headers: { 'x-hub-signature-256': sign(invalid) } })).code, 400);
    assert.equal(denied.calls.length + denied.effects.length, 0);
  }
});

test('structured transient provider rejections are retryable, ambiguous failures uncertain and permanent rejections failed', async () => {
  for (const [status, providerError, expectedStatus, expectedCode] of [
    [429, null, 'retryable', 'PROVIDER_TEMPORARILY_REJECTED'],
    [400, { code: 4, is_transient: true }, 'retryable', 'PROVIDER_TEMPORARILY_REJECTED'],
    [500, { code: 131000, is_transient: true }, 'retryable', 'PROVIDER_TEMPORARILY_REJECTED'],
    [503, null, 'uncertain', 'PROVIDER_DELIVERY_UNCERTAIN'],
    [503, { code: '4', is_transient: true }, 'uncertain', 'PROVIDER_DELIVERY_UNCERTAIN'],
    [400, { code: 190, is_transient: false }, 'failed', 'PROVIDER_REJECTED']
  ]) {
    const app = backend({ fetch: async () => ({ ok: false, status, json: async () => providerError ? { error: providerError } : {} }) });
    const res = await app.call();
    assert.equal(res.code, 503);
    assert.equal(res.body.code, expectedCode);
    assert.equal(app.states.get('wamid.test1').status, expectedStatus);
    assert.equal(app.states.get('wamid.test1').sent_count, 0);
  }
});

test('a retry after backoff resumes only unsent cached bubbles and never regenerates AI text', async () => {
  let resumeAllowed = false, outboundCount = 0, aiCount = 0;
  const app = backend({ env: { GEMINI_API_KEY: 'synthetic-gemini-key' },
    async rpc(name, args, states) {
      if (name === 'backend_claim_whatsapp') {
        const previous = states.get(args.p_id);
        if (!previous) {
          states.set(args.p_id, { status: 'processing', sent_count: 0 });
          return { data: { claimed: true, history: [], sent_count: 0 }, error: null };
        }
        if (previous.status === 'retryable' && resumeAllowed) return { data: { claimed: true, response: previous.response, sent_count: previous.sent_count }, error: null };
        return { data: { claimed: false, reason: 'already_processed', status: previous.status }, error: null };
      }
      if (name === 'backend_start_whatsapp_send') return { data: true, error: null };
      if (name === 'backend_finish_whatsapp') {
        states.set(args.p_id, { status: args.p_status, response: structuredClone(args.p_response), sent_count: args.p_sent_count });
        return { data: null, error: null };
      }
      throw new Error('Unexpected RPC');
    },
    async fetch(url, init) {
      if (url.includes('generativelanguage')) {
        aiCount++;
        return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ messages: ['B1', 'B2', 'B3'] }) }] } }] }) };
      }
      outboundCount++;
      if (outboundCount === 2) return { ok: false, status: 429, json: async () => ({ error: { code: 130429, is_transient: true } }) };
      return { ok: true, json: async () => ({ messages: [{ id: 'wamid.outbound-synthetic' }] }) };
    }
  });
  assert.equal((await app.call()).code, 503);
  assert.equal(app.states.get('wamid.test1').status, 'retryable');
  assert.equal(app.states.get('wamid.test1').sent_count, 1);
  assert.equal((await app.call()).code, 503);
  assert.equal(outboundCount, 2);
  assert.equal(aiCount, 1);
  resumeAllowed = true;
  assert.equal((await app.call()).code, 200);
  assert.equal(aiCount, 1);
  assert.equal(app.states.get('wamid.test1').status, 'completed');
  assert.equal(app.states.get('wamid.test1').sent_count, 3);
  assert.deepEqual(app.outbound().map(effect => JSON.parse(effect.init.body).text.body), ['B1', 'B2', 'B2', 'B3']);
  assert.deepEqual(app.calls.filter(call => call.rpc === 'backend_start_whatsapp_send').map(call => call.args.p_index), [0, 1, 1, 2]);
});

test('conversation contention and persistence failures are retryable and never manufacture a reply', async () => {
  for (const [rpc, code] of [
    [async () => ({ data: { claimed: false, reason: 'conversation_busy' }, error: null }), 'CONVERSATION_BUSY'],
    [async () => ({ data: null, error: { message: 'private database detail' } }), 'DATABASE_UNAVAILABLE'],
    [async () => ({ data: {}, error: null }), 'MESSAGE_NOT_SAVED']
  ]) {
    const app = backend({ rpc });
    const res = await app.call();
    assert.equal(res.code, 503);
    assert.equal(res.body.code, code);
    assert.ok(!JSON.stringify(res.body).includes('private database detail'));
    assert.equal(app.outbound().length, 0);
  }
});

test('provider HTTP rejection is durably recorded as failed before returning 503', async () => {
  const app = backend({ fetch: async () => ({ ok: false, status: 400, json: async () => ({ error: { message: 'private provider detail' } }) }) });
  const res = await app.call();
  assert.equal(res.code, 503);
  assert.equal(res.body.code, 'PROVIDER_REJECTED');
  assert.equal(app.states.get('wamid.test1').status, 'failed');
  const finish = app.calls.find(call => call.rpc === 'backend_finish_whatsapp');
  assert.equal(finish.args.p_status, 'failed');
  assert.equal(finish.args.p_sent_count, 0);
  assert.equal(finish.args.p_error_code, 'PROVIDER_REJECTED');
  assert.ok(!JSON.stringify(res.body).includes('private provider detail'));
});

test('network uncertainty is recorded and retries do not resend the same message', async () => {
  const app = backend({ fetch: async () => { throw new Error('network interrupted after send'); } });
  assert.equal((await app.call()).code, 503);
  assert.equal(app.states.get('wamid.test1').status, 'uncertain');
  assert.equal(app.outbound().length, 1);
  assert.equal((await app.call()).code, 200);
  assert.equal(app.outbound().length, 1);
});

test('missing provider message IDs or malformed provider JSON persist uncertainty instead of leaving an active send', async () => {
  for (const json of [async () => ({}), async () => { throw new Error('invalid provider JSON'); }]) {
    const app = backend({ fetch: async () => ({ ok: true, json }) });
    const res = await app.call();
    assert.equal(res.code, 503);
    assert.equal(app.states.get('wamid.test1').status, 'uncertain');
    assert.equal(app.calls.find(call => call.rpc === 'backend_finish_whatsapp').args.p_error_code, 'PROVIDER_DELIVERY_UNCERTAIN');
  }
});

test('signed delivery-only events have no reply effects; missing outbound configuration is durable', async () => {
  const raw = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account', entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.status' }] } }] }] }));
  const app = backend();
  assert.equal((await app.call({ rawBody: raw, headers: { 'x-hub-signature-256': sign(raw) } })).code, 200);
  assert.equal(app.calls.length + app.effects.length, 0);
  const unavailable = backend({ env: { META_ACCESS_TOKEN: undefined } });
  assert.equal((await unavailable.call()).code, 200);
  assert.equal(unavailable.states.get('wamid.test1').status, 'awaiting_configuration');
  assert.equal(unavailable.outbound().length, 0);
});
