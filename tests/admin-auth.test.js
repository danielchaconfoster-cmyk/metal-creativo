const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const TOKEN = 'synthetic-test-key-0123456789abcdef0123456789abcdef';
const OTHER = 'different-test-key-0123456789abcdef0123456789abcdef';
// Public credential from the vulnerable version, retained only as a regression input.
const LEGACY = ['metalcreativo', '2026'].join('');

// Evaluate the real handlers and shared helper with isolated env and synthetic I/O.
// Never load .env, read customer files, or contact providers from these tests.
function backend(extraEnv = {}) {
  const env = { META_ACCESS_TOKEN: 'fake-meta', GEMINI_API_KEY: 'fake-gemini',
    SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake-db', ...extraEnv };
  const effects = [];
  const cache = new Map();
  function load(relative) {
    const file = path.resolve(ROOT, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
      module, exports: module.exports, process: { env, cwd: () => ROOT },
      console: { log() {}, warn() {}, error() {} }, AbortSignal, setTimeout,
      async fetch(url) {
        effects.push('network');
        if (url.includes('generativelanguage')) return { json: async () => ({ candidates: [{
          content: { parts: [{ text: JSON.stringify({ messages: ['Respuesta de prueba'] }) }] }
        }] }) };
        return { json: async () => ({ data: [] }) };
      },
      require(name) {
        if (name === 'dotenv') return { config() {} };
        if (name === 'fs') return {
          existsSync() { effects.push('file-check'); return true; },
          readFileSync() { effects.push('file-read'); return '[]'; },
          writeFileSync() { effects.push('file-write'); }
        };
        if (name === '@supabase/supabase-js') return { createClient() {
          effects.push('database');
          const query = { from() { return this; }, select() { return this; }, order() { return this; },
            async limit() { return { data: [{ id: 'synthetic-order', total_amount: 123 }], error: null }; } };
          return query;
        } };
        if (name.startsWith('.')) return load(path.relative(ROOT, path.resolve(path.dirname(file), name + '.js')));
        if (name === 'path' || name === 'node:crypto') return require(name);
        throw new Error('Unexpected dependency: ' + name);
      }
    }, { filename: file });
    return module.exports;
  }
  return { env, effects, async call(endpoint, input = {}) {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; },
      status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; },
      send(body) { this.body = body; return this; } };
    await load(endpoint)({ method: 'POST', headers: {}, query: {},
      body: endpoint.includes('whatsapp') ? { simulate: true, message: 'hola' } : {}, ...input }, res);
    return res;
  } };
}

for (const endpoint of ['api/admin-metrics.js', 'api/whatsapp-webhook.js']) {
  test(endpoint + ': fail closed without a valid private configuration', async () => {
    for (const configured of [undefined, '', LEGACY, 'x'.repeat(31), 'x'.repeat(513), ' '.repeat(32), TOKEN + '\n']) {
      const app = backend({ ADMIN_TOKEN: configured });
      const res = await app.call(endpoint, { headers: { 'x-admin-token': configured || LEGACY, host: 'localhost' } });
      assert.equal(res.code, 503);
      assert.equal(res.body.code, 'ADMIN_NOT_CONFIGURED');
      assert.equal(app.effects.length, 0);
      assert.match(res.headers['Cache-Control'], /no-store/);
    }
  });

  test(endpoint + ': rejects alternate credentials before any protected effects', async () => {
    const requests = [
      {}, { headers: { 'x-admin-token': LEGACY } }, { headers: { 'x-admin-token': OTHER } },
      { query: { token: TOKEN } }, { query: { token: [TOKEN, TOKEN] } },
      { body: { simulate: true, admin_token: TOKEN } },
      { headers: { 'x-admin-token': [TOKEN] } },
      { headers: { 'x-admin-token': TOKEN + ',' + TOKEN } },
      { headers: { 'x-admin-token': TOKEN, authorization: 'Bearer ' + TOKEN } },
      { headers: { 'x-admin-token': TOKEN, 'X-Admin-Token': TOKEN } },
      { headers: { 'x-admin-token': TOKEN }, rawHeaders: ['X-Admin-Token', TOKEN, 'x-admin-token', TOKEN] },
      { headers: { authorization: 'Bearer ' + TOKEN }, rawHeaders: ['Authorization', 'Bearer ' + TOKEN, 'authorization', 'Bearer ' + TOKEN] },
      ...['localhost', '127.0.0.1:3000', 'localhost.attacker.invalid', 'attacker-127.0.0.1.invalid'].map(host => ({ headers: { host } })),
      ...[TOKEN, 'Basic ' + TOKEN, 'Bearer  ' + TOKEN, 'Bearer ' + TOKEN + ',other', 'Bearer ' + TOKEN + '\n'].map(authorization => ({ headers: { authorization } }))
    ];
    for (const [index, request] of requests.entries()) {
      const app = backend({ ADMIN_TOKEN: TOKEN });
      const res = await app.call(endpoint, request);
      assert.equal(res.code, 401, 'malicious request index ' + index);
      assert.equal(res.body.code, 'UNAUTHORIZED');
      assert.equal(app.effects.length, 0);
    }
  });

  test(endpoint + ': preserves legitimate header access and observes rotation', async () => {
    for (const headers of [{ 'x-admin-token': TOKEN }, { authorization: 'Bearer ' + TOKEN }, { authorization: 'bearer ' + TOKEN }]) {
      const app = backend({ ADMIN_TOKEN: TOKEN });
      const res = await app.call(endpoint, { headers });
      assert.equal(res.code, 200);
      assert.equal(res.body.success, true);
      assert.ok(app.effects.includes('network'));
      if (endpoint.includes('metrics')) {
        assert.equal(res.body.orders[0].id, 'synthetic-order');
        assert.ok(app.effects.includes('database'));
      } else {
        assert.equal(res.body.messages[0], 'Respuesta de prueba');
        assert.ok(app.effects.includes('file-write'));
      }
      app.env.ADMIN_TOKEN = OTHER;
      app.effects.length = 0;
      assert.equal((await app.call(endpoint, { headers })).code, 401);
      assert.equal(app.effects.length, 0);
    }
  });
}

test('Meta verification and non-simulation acknowledgements retain their contracts', async () => {
  const app = backend({ WHATSAPP_VERIFY_TOKEN: 'synthetic-verification-token' });
  const endpoint = 'api/whatsapp-webhook.js';
  const response = await app.call(endpoint, { method: 'GET', query: {
    'hub.mode': 'subscribe', 'hub.verify_token': 'synthetic-verification-token', 'hub.challenge': '1234'
  } });
  assert.equal(response.code, 200);
  assert.equal(response.body, '1234');
  assert.equal((await app.call(endpoint, { method: 'GET' })).code, 403);
  assert.equal((await app.call(endpoint, { body: {} })).body, 'EVENT_RECEIVED');
  assert.equal((await app.call(endpoint, { method: 'DELETE' })).code, 405);
  assert.equal(app.effects.length, 0);
});

const html = fs.readFileSync(path.join(ROOT, 'public/admin.html'), 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(code => code.includes('function adminApp()'));
const metrics = { success: true, kpis: { totalOrders: 1 }, metaAds: { status: 'test' }, orders: [{ id: 'test-order' }], leads: [{ name: 'Synthetic' }] };
const response = (status, data = {}) => ({ status, ok: status >= 200 && status < 300, json: async () => data });

function frontend(fetch, options = {}) {
  const removed = [];
  const context = { fetch, console, setTimeout: options.setTimeout || (fn => fn()),
    sessionStorage: { removeItem(key) { removed.push(key); if (options.storageBlocked) throw Error('Storage blocked'); } } };
  vm.createContext(context);
  vm.runInContext(script, context);
  const app = context.adminApp();
  app.$nextTick = fn => fn();
  app.$refs = {};
  return { app, removed };
}

test('panel starts locked, removes legacy storage, and ships no fallback', () => {
  const { app, removed } = frontend(() => assert.fail('No fetch before login'), { storageBlocked: true });
  app.init();
  assert.equal(app.authenticated, false);
  assert.deepEqual(removed, ['mc_admin_token']);
  assert.ok(!html.includes(LEGACY));
  assert.match(html, /<template x-if="authenticated">/);
  assert.ok(!html.includes('x-init="init()"'));
});

test('panel login, refresh, simulator and logout keep key out of URLs, bodies and storage', async () => {
  const calls = [];
  const { app } = frontend(async (url, init) => {
    calls.push({ url, init });
    return response(200, url.includes('admin-metrics') ? metrics : url.includes('whatsapp') ? { success: true, messages: ['Test reply'] } : {});
  });
  app.loginToken = TOKEN;
  await app.login();
  assert.equal(app.authenticated, true);
  assert.equal(app.loginToken, '');
  assert.equal(app.orders[0].id, 'test-order');
  await app.fetchMetrics();
  await app.sendSimulator('Test message');
  assert.equal(app.simulatorMessages.at(-1).text, 'Test reply');
  for (const { url, init } of calls.filter(call => !call.url.includes('shipping'))) {
    assert.equal(init.headers['x-admin-token'], TOKEN);
    assert.ok(!url.includes(TOKEN));
    assert.ok(!(init.body || '').includes(TOKEN));
    assert.equal(init.redirect, 'error');
  }
  app.logout();
  assert.equal(app.authToken, '');
  assert.equal(app.authenticated, false);
  assert.equal(app.orders.length + app.leads.length + app.simulatorMessages.length, 0);
  const count = calls.length;
  await app.fetchMetrics();
  await app.sendSimulator('Cannot send');
  assert.equal(calls.length, count);
});

test('panel rejects invalid credentials, missing configuration and unavailable responses', async () => {
  for (const status of [401, 503, 500, 200]) {
    const { app } = frontend(async () => response(status, { success: false }));
    app.loginToken = TOKEN;
    await app.login();
    assert.equal(app.authenticated, false);
    assert.equal(app.authToken, '');
    assert.ok(app.authError);
  }
});

test('simulator authorization errors log out instead of manufacturing a reply', async () => {
  for (const status of [401, 503]) {
    const { app } = frontend(async () => response(status));
    app.authToken = TOKEN;
    app.authenticated = true;
    await app.sendSimulator('test');
    assert.equal(app.authenticated, false);
    assert.equal(app.simulatorMessages.length, 0);
    assert.equal(app.isTyping, false);
  }
});

test('late metrics response cannot restore data after logout and a new session', async () => {
  let finish;
  const { app } = frontend(() => new Promise(resolve => { finish = resolve; }));
  app.authToken = TOKEN;
  const pending = app.fetchMetrics();
  app.logout();
  app.authToken = OTHER;
  finish(response(200, metrics));
  await pending;
  assert.equal(app.orders.length, 0);
  assert.equal(app.authenticated, false);
  assert.equal(app.authToken, OTHER);
});

test('late simulator response and delayed bubbles cannot repopulate a logged-out panel', async () => {
  let finish;
  const { app } = frontend(() => new Promise(resolve => { finish = resolve; }));
  app.authToken = TOKEN;
  app.authenticated = true;
  const pending = app.sendSimulator('test');
  app.logout();
  finish(response(200, { success: true, messages: ['Late'] }));
  await pending;
  assert.equal(app.simulatorMessages.length, 0);

  let releaseTimer;
  let timerStarted;
  const started = new Promise(resolve => { timerStarted = resolve; });
  const delayed = frontend(async () => response(200, { success: true, messages: ['Delayed'] }), {
    setTimeout(fn) { releaseTimer = fn; timerStarted(); }
  }).app;
  delayed.authToken = TOKEN;
  delayed.authenticated = true;
  const typing = delayed.sendSimulator('test');
  await started;
  delayed.logout();
  releaseTimer();
  await typing;
  assert.equal(delayed.simulatorMessages.length, 0);
  assert.equal(delayed.isTyping, false);
});
