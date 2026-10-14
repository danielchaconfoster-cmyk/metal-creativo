const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');
const { createServer, startServer, API_ROUTES } = require('../dev-server');

// Fixtures are synthetic. No repository API modules, environment files, customer
// data, or provider calls are used. Set LOCAL_SERVER_TEST_DIR to managed temporary
// storage when running these checks as security validation.
function fixture(t) {
  const root = fs.mkdtempSync(path.join(process.env.LOCAL_SERVER_TEST_DIR || os.tmpdir(), 'local-servers-'));
  const publicRoot = path.join(root, 'public');
  const apiRoot = path.join(root, 'api');
  const distRoot = path.join(root, 'dist');
  for (const directory of [publicRoot, apiRoot, distRoot]) fs.mkdirSync(directory);
  fs.writeFileSync(path.join(root, 'package.json'), '{"type":"commonjs"}');
  for (const directory of [publicRoot, distRoot]) {
    fs.writeFileSync(path.join(directory, 'index.html'), '<h1>Synthetic home</h1>');
    fs.writeFileSync(path.join(directory, 'page.html'), '<h1>Synthetic page</h1>');
    fs.writeFileSync(path.join(directory, 'style.css'), 'body { color: blue; }');
    fs.writeFileSync(path.join(directory, 'hello world.txt'), 'Synthetic text');
  }
  const handler = [
    "const fs = require('node:fs'); const path = require('node:path');",
    "fs.appendFileSync(path.join(__dirname, 'loaded.txt'), 'loaded\\n');",
    "module.exports = async (req, res) => res.status(200).json({",
    "body: req.body, query: req.query, raw: req.rawBody.toString('base64'), method: req.method });",
    "module.exports.config = { api: { bodyParser: false } };"
  ].join('\n');
  for (const filename of Object.values(API_ROUTES)) fs.writeFileSync(path.join(apiRoot, filename), handler);
  fs.writeFileSync(path.join(apiRoot, 'helper.js'), handler);
  fs.writeFileSync(path.join(root, 'outside.js'), handler);
  fs.writeFileSync(path.join(root, 'outside.txt'), 'OUTSIDE SYNTHETIC SENTINEL');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, publicRoot, apiRoot, distRoot, handler,
    loaded: () => fs.existsSync(path.join(apiRoot, 'loaded.txt')) || fs.existsSync(path.join(root, 'loaded.txt')) };
}

async function listen(t, server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return server.address().port;
}

function request(port, target, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: target,
      method: options.method || 'GET', headers: options.headers || {}, agent: false }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.once('end', () => resolve({ status: res.statusCode, headers: res.headers,
        text: Buffer.concat(chunks).toString('utf8') }));
      res.once('error', reject);
    });
    req.once('error', reject);
    req.setTimeout(2000, () => req.destroy(new Error('Test request timeout')));
    for (const chunk of options.chunks || []) req.write(chunk);
    req.end(options.body);
  });
}

async function lab() {
  return import(pathToFileURL(path.resolve(__dirname, '../lab-merch-revolution/serve.js')).href);
}

test('explicit API allowlist rejects existing helper modules and traversal without loading them', async t => {
  const f = fixture(t);
  const port = await listen(t, createServer({ rootDir: f.root }));
  for (const route of ['/api/helper', '/api/helper.js', '/api/__proto__', '/api/shipping-quote/extra', '/api', '/api/../outside']) {
    const res = await request(port, route);
    assert.ok([400, 404].includes(res.status), route);
    assert.equal(f.loaded(), false, route + ' must not load any module');
  }
  for (const route of Object.keys(API_ROUTES)) {
    const res = await request(port, route);
    assert.equal(res.status, 200, route);
  }
});

test('serverless adapter preserves exact raw bytes, JSON, duplicate query values and hot reload', async t => {
  const f = fixture(t);
  const port = await listen(t, createServer({ rootDir: f.root }));
  const raw = Buffer.from('{\n "message": "hola ñ", "simulate": true \n}\n');
  const res = await request(port, '/api/whatsapp-webhook?hub.challenge=123&item=one&item=two', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    chunks: [raw.subarray(0, 24), raw.subarray(24)]
  });
  assert.equal(res.status, 200);
  const data = JSON.parse(res.text);
  assert.equal(data.raw, raw.toString('base64'));
  assert.deepEqual(data.body, { message: 'hola ñ', simulate: true });
  assert.deepEqual(data.query, { 'hub.challenge': '123', item: ['one', 'two'] });
  assert.equal(data.method, 'POST');
  fs.writeFileSync(path.join(f.apiRoot, 'shipping-quote.js'),
    "module.exports = async (req, res) => res.status(201).send('hot reload');");
  assert.equal((await request(port, '/api/shipping-quote')).text, 'hot reload');
  assert.equal((await request(port, '/api/%73hipping-quote')).status, 201);
});

test('declared and streamed oversized bodies fail before module loading; the byte limit remains usable', async t => {
  const f = fixture(t);
  const port = await listen(t, createServer({ rootDir: f.root }));
  const declared = await request(port, '/api/shipping-quote', {
    method: 'POST', headers: { 'Content-Length': String(128 * 1024 + 1) }
  });
  assert.equal(declared.status, 413);
  assert.equal(f.loaded(), false);
  const streamed = await request(port, '/api/shipping-quote', {
    method: 'POST', chunks: [Buffer.alloc(65536, 65), Buffer.alloc(65537, 65)]
  });
  assert.equal(streamed.status, 413);
  assert.equal(f.loaded(), false);
  const exact = Buffer.from(JSON.stringify({ value: 'a'.repeat(128 * 1024 - 12) }));
  assert.equal(exact.length, 128 * 1024);
  assert.equal((await request(port, '/api/shipping-quote', { method: 'POST', body: exact })).status, 200);
});

test('limits count UTF-8 bytes and reject invalid JSON or malformed UTF-8 before handlers', async t => {
  const f = fixture(t);
  const port = await listen(t, createServer({ rootDir: f.root, bodyLimit: 64 }));
  for (const body of [Buffer.from('{ invalid'), Buffer.from([123, 34, 120, 34, 58, 34, 255, 34, 125])]) {
    assert.equal((await request(port, '/api/shipping-quote', { method: 'POST', body })).status, 400);
    assert.equal(f.loaded(), false);
  }
  const tooManyBytes = Buffer.from(JSON.stringify({ value: 'é'.repeat(30) }));
  assert.ok(tooManyBytes.toString().length < 64 && tooManyBytes.length > 64);
  assert.equal((await request(port, '/api/shipping-quote', { method: 'POST', body: tooManyBytes })).status, 413);
  assert.equal(f.loaded(), false);
  const valid = await request(port, '/api/shipping-quote', { method: 'POST', body: '{"value":"é"}' });
  assert.equal(valid.status, 200);
  assert.equal(JSON.parse(valid.text).body.value, 'é');
});

test('absolute body timeout closes unfinished and slowly trickled requests before module loading', async t => {
  const f = fixture(t);
  const server = createServer({ rootDir: f.root, bodyTimeout: 100 });
  assert.equal(server.headersTimeout, 10000);
  assert.equal(server.requestTimeout, 10000);
  const port = await listen(t, server);
  for (const drip of [false, true]) {
    const reply = await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      const chunks = [];
      let timer;
      socket.setTimeout(2000, () => socket.destroy(new Error('Slow request test timeout')));
      socket.once('connect', () => {
        socket.write('POST /api/shipping-quote HTTP/1.1\r\nHost: localhost\r\nContent-Length: 100\r\n\r\n{');
        if (drip) timer = setInterval(() => socket.write(' '), 25);
      });
      socket.on('data', data => chunks.push(data));
      socket.once('end', () => { clearInterval(timer); resolve(Buffer.concat(chunks).toString()); });
      socket.once('error', error => { clearInterval(timer); reject(error); });
    });
    assert.match(reply, /^HTTP\/1\.1 408/);
    assert.equal(f.loaded(), false);
  }
  assert.equal((await request(port, '/api/shipping-quote')).status, 200);
});

test('async handler errors return a generic response and leave the server available', async t => {
  const f = fixture(t);
  const port = await listen(t, createServer({ rootDir: f.root }));
  for (const error of ["new Error('SYNTHETIC_PRIVATE_ERROR')", "Object.assign(new Error('SYNTHETIC_PRIVATE_ERROR'), { statusCode: 403 })"]) {
    fs.writeFileSync(path.join(f.apiRoot, 'webhook.js'),
      "module.exports = async () => { throw " + error + "; };");
    const failure = await request(port, '/api/webhook');
    assert.equal(failure.status, 500);
    assert.equal(failure.text, '{"error":"Internal Server Error"}');
  }
  assert.equal((await request(port, '/api/shipping-quote')).status, 200);
});

test('an aborted body never loads a module and does not prevent subsequent requests', async t => {
  const f = fixture(t);
  const port = await listen(t, createServer({ rootDir: f.root, bodyTimeout: 100 }));
  const socket = net.createConnection({ host: '127.0.0.1', port });
  await once(socket, 'connect');
  socket.write('POST /api/shipping-quote HTTP/1.1\r\nHost: localhost\r\nContent-Length: 100\r\n\r\n{');
  await new Promise(resolve => setTimeout(resolve, 25));
  const closed = once(socket, 'close');
  socket.destroy();
  await closed;
  assert.equal(f.loaded(), false);
  assert.equal((await request(port, '/api/shipping-quote')).status, 200);
});

const unsafeTargets = [
  '/../outside.txt', '/api/../outside', '/%2e%2e/outside.txt', '/%2e./outside.txt',
  '/nested/../../outside.txt', '/..%5coutside.txt', '/%2f..%2foutside.txt',
  '/%5c..%5coutside.txt', '/..\\outside.txt', '/%00', '/%zz', '/index.html:stream',
  '/index.html.', '/index.html%20', '//attacker/index.html', 'http://attacker/index.html'
];

for (const kind of ['dev', 'lab']) {
  test(kind + ': alternate encodings and Windows path aliases are rejected, with normal static pages intact', async t => {
    const f = fixture(t);
    const module = kind === 'lab' ? await lab() : { createServer };
    const server = kind === 'lab' ? module.createServer({ distRoot: f.distRoot }) : module.createServer({ rootDir: f.root });
    const port = await listen(t, server);
    for (const target of unsafeTargets) {
      const res = await request(port, target);
      assert.equal(res.status, 400, target);
      assert.ok(!res.text.includes('OUTSIDE SYNTHETIC SENTINEL'));
      assert.equal(f.loaded(), false);
    }
    for (const [target, text] of [['/', '<h1>Synthetic home</h1>'], ['/page.html', '<h1>Synthetic page</h1>'],
      ['/style.css', 'body { color: blue; }'], ['/hello%20world.txt', 'Synthetic text']]) {
      const res = await request(port, target);
      assert.equal(res.status, 200, target);
      assert.equal(res.text, text, target);
    }
    assert.match((await request(port, '/style.css')).headers['content-type'], /text\/css/);
    assert.equal((await request(port, '/', { method: 'HEAD' })).text, '');
    assert.equal((await request(port, '/', { method: 'POST', body: 'synthetic' })).status, 405);
    if (kind === 'dev') {
      assert.equal((await request(port, '/page')).text, '<h1>Synthetic page</h1>');
      assert.equal((await request(port, '/missing')).status, 404);
    } else {
      assert.equal((await request(port, '/nested/client-route')).text, '<h1>Synthetic home</h1>');
    }
  });

  test(kind + ': junctions outside the canonical static/API roots cannot bypass containment or SPA fallback', async t => {
    const f = fixture(t);
    const outside = path.join(f.root, 'outside-dir');
    fs.mkdirSync(outside);
    fs.writeFileSync(path.join(outside, 'sentinel.txt'), 'OUTSIDE SYNTHETIC SENTINEL');
    fs.writeFileSync(path.join(outside, 'handler.js'), f.handler);
    const staticRoot = kind === 'lab' ? f.distRoot : f.publicRoot;
    // Windows junctions exercise the same realpath boundary without requiring
    // elevated file-symlink privileges.
    fs.symlinkSync(outside, path.join(staticRoot, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
    fs.symlinkSync(outside, path.join(f.apiRoot, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
    const internal = path.join(staticRoot, 'internal');
    fs.mkdirSync(internal);
    fs.writeFileSync(path.join(internal, 'allowed.txt'), 'Synthetic internal link');
    fs.symlinkSync(internal, path.join(staticRoot, 'inside-link'), process.platform === 'win32' ? 'junction' : 'dir');
    const module = kind === 'lab' ? await lab() : { createServer };
    const server = kind === 'lab' ? module.createServer({ distRoot: f.distRoot }) : module.createServer({
      rootDir: f.root, apiRoutes: { ...API_ROUTES, '/api/symlink': 'escape/handler.js' }
    });
    const port = await listen(t, server);
    assert.equal((await request(port, '/escape/sentinel.txt')).status, 403);
    if (kind === 'dev') assert.equal((await request(port, '/api/symlink')).status, 403);
    assert.equal(fs.existsSync(path.join(outside, 'loaded.txt')), false);
    assert.equal((await request(port, '/inside-link/allowed.txt')).text, 'Synthetic internal link');
    assert.equal((await request(port, '/')).status, 200);
  });
}

test('both command entry points bind loopback by default and remain import-safe', async t => {
  const f = fixture(t);
  const oldHost = process.env.HOST;
  delete process.env.HOST;
  t.after(() => { if (oldHost === undefined) delete process.env.HOST; else process.env.HOST = oldHost; });
  const module = await lab();
  for (const start of [() => startServer({ rootDir: f.root, port: 0 }), () => module.startServer({ distRoot: f.distRoot, port: 0 })]) {
    const server = start();
    await once(server, 'listening');
    t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
    assert.equal(server.address().address, '127.0.0.1');
    assert.equal((await request(server.address().port, '/')).status, 200);
  }
});
