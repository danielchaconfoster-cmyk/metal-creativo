const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const TOKEN = 'synthetic-admin-key-0123456789abcdef0123456789abcdef';
const ORDER_ID = '00000000-0000-4000-8000-000000000001';
const LEAD_ID = '00000000-0000-4000-8000-000000000002';
const ZERO_TOTALS = { total_orders: 0, total_revenue: 0, average_ticket: 0, lead_count: 0, won_leads: 0,
  channels: { web: 0, mercadolibre: 0, whatsapp: 0 } };

// The actual handlers, parser, database configuration and authorization run in an
// isolated environment. Only Supabase transport and provider fetch are substituted.
function backend(options = {}) {
  const env = { ADMIN_TOKEN: TOKEN, SUPABASE_URL: 'https://database.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-db-key', ...options.env };
  const calls = [], effects = [], cache = new Map();
  function query(table) {
    const state = { table, operation: 'select', filters: [] };
    const execute = async () => {
      const copy = structuredClone(state);
      calls.push(copy);
      return options.query ? options.query(copy) : { data: [], error: null };
    };
    const fluent = {
      select(fields) { state.fields = fields; return this; },
      order(field, value) { state.order = { field, ...value }; return this; },
      limit(value) { state.limit = value; return this; },
      eq(field, value) { state.filters.push([field, value]); return this; },
      update(values) { state.operation = 'update'; state.values = values; return this; },
      async single() { state.single = true; return execute(); },
      async maybeSingle() { state.single = true; return execute(); },
      then(resolve, reject) { return execute().then(resolve, reject); }
    };
    return fluent;
  }
  const db = { from: query, async rpc(name, args) {
    calls.push({ rpc: name, args });
    return options.rpc ? options.rpc(name, args) : { data: ZERO_TOTALS, error: null };
  } };
  function load(relative) {
    const file = path.resolve(ROOT, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
      module, exports: module.exports, process: { env }, Buffer, TextDecoder, URL, AbortSignal, setTimeout, clearTimeout,
      async fetch(url, init) {
        effects.push({ fetch: url, init });
        if (!options.fetch) throw new Error('No provider calls expected');
        return options.fetch(url, init);
      },
      require(name) {
        if (name === '@supabase/supabase-js') return { createClient(url, key, config) { effects.push({ database: true, url, key, config }); return db; } };
        if (name.startsWith('node:')) return require(name);
        if (name.startsWith('.')) return load(path.relative(ROOT, path.resolve(path.dirname(file), name + '.js')));
        throw new Error('Unexpected dependency: ' + name);
      }
    }, { filename: file });
    return module.exports;
  }
  return { env, calls, effects, async call(endpoint, body = {}, request = {}) {
    const req = { method: endpoint.includes('metrics') ? 'GET' : 'PATCH',
      headers: { 'x-admin-token': TOKEN, 'content-type': 'application/json' }, body, ...request };
    const res = { headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
      status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } };
    await load(endpoint)(req, res);
    return res;
  } };
}

for (const endpoint of ['api/admin-metrics.js', 'api/admin-orders.js', 'api/admin-leads.js']) {
  test(endpoint + ' requires private authorization before reading data or contacting providers', async () => {
    const app = backend({ env: { META_ACCESS_TOKEN: 'synthetic-meta-token', META_CAMPAIGN_ID: '123456' } });
    const res = await app.call(endpoint, {}, { headers: {} });
    assert.equal(res.code, 401);
    assert.equal(res.body.code, 'UNAUTHORIZED');
    assert.equal(app.calls.length + app.effects.length, 0);
    assert.match(res.headers['cache-control'], /no-store/);
    const missing = backend({ env: { ADMIN_TOKEN: undefined } });
    assert.equal((await missing.call(endpoint)).code, 503);
    assert.equal(missing.calls.length + missing.effects.length, 0);
  });
  test(endpoint + ' rejects unsupported methods after authorization', async () => {
    const app = backend();
    const res = await app.call(endpoint, {}, { method: 'DELETE' });
    assert.equal(res.code, 405);
    assert.equal(res.headers.allow, endpoint.includes('metrics') ? 'GET' : 'PATCH');
    assert.equal(app.calls.length + app.effects.length, 0);
  });
}

test('metrics flatten relational orders for the existing panel and use complete database aggregates', async () => {
  const totals = { total_orders: 257, total_revenue: 10000, average_ticket: 5000, lead_count: 130, won_leads: 13,
    channels: { web: 250, mercadolibre: 5, whatsapp: 2 } };
  const app = backend({
    rpc: async name => { assert.equal(name, 'backend_admin_totals'); return { data: totals, error: null }; },
    query: async state => ({ error: null, data: state.table === 'leads' ? [{ id: LEAD_ID, name: 'Prueba', status: 'quoted' }] : [{
      id: ORDER_ID, status: 'paid', total_amount: '5000.00', payment_method: 'mercadopago', shipping_method: 'starken_por_pagar',
      created_at: '2026-01-01T00:00:00.000Z', channel: null,
      customers: { full_name: 'Persona sintética', phone: '+56900000000', comuna: 'Comuna de prueba', rut: 'SHOULD_NOT_LEAK' },
      order_items: [{ product_name: 'Producto de prueba', quantity: 2 }]
    }] })
  });
  const res = await app.call('api/admin-metrics.js');
  assert.equal(res.code, 200);
  assert.equal(res.body.kpis.totalOrders, 257);
  assert.equal(res.body.kpis.totalRevenue, 10000);
  assert.equal(res.body.kpis.averageTicket, 5000);
  assert.equal(res.body.kpis.conversionRate, '10.0%');
  assert.equal(res.body.kpis.channels.web, 250);
  assert.equal(res.body.orders[0].customer_name, 'Persona sintética');
  assert.equal(res.body.orders[0].phone, '+56900000000');
  assert.equal(res.body.orders[0].product_name, '2 × Producto de prueba');
  assert.equal(res.body.orders[0].shipping_commune, 'Comuna de prueba');
  assert.equal(res.body.orders[0].channel, 'web_mercadopago');
  assert.equal(res.body.orders[0].total_amount, 5000);
  assert.ok(!JSON.stringify(res.body).includes('SHOULD_NOT_LEAK'));
  assert.ok(app.calls.filter(call => call.table).every(call => call.limit === 100));
  assert.equal(res.body.listLimits.orders, 100);
  assert.equal(res.body.metaAds.source, 'not_configured');
  assert.equal(res.body.system.mercadoPagoStatus, 'not_configured');
  assert.equal(app.effects.filter(effect => effect.fetch).length, 0);
});

test('empty connected tables are a valid zero-data dashboard without invented numbers', async () => {
  const app = backend();
  const res = await app.call('api/admin-metrics.js');
  assert.equal(res.code, 200);
  assert.equal(res.body.system.supabaseStatus, 'connected');
  assert.equal(res.body.kpis.totalRevenue, 0);
  assert.equal(res.body.kpis.totalOrders, 0);
  assert.equal(res.body.kpis.averageTicket, 0);
  assert.equal(res.body.kpis.conversionRate, '0.0%');
  assert.equal(res.body.kpis.roas, '0.0x');
  assert.equal(res.body.metaAds.conversationsStarted, 0);
  assert.equal(res.body.orders.length + res.body.leads.length, 0);
});

test('Meta zeros remain zero, metadata is real and tokens never appear in URLs', async () => {
  const app = backend({ env: { META_ACCESS_TOKEN: 'synthetic-meta-token', META_CAMPAIGN_ID: '123456', MERCADOPAGO_ACCESS_TOKEN: 'synthetic-mp' },
    async fetch(url, init) {
      if (url === 'https://api.mercadopago.com/users/me') {
        assert.equal(init.headers.Authorization, 'Bearer synthetic-mp');
        assert.ok(!url.includes('synthetic-mp'));
        return { ok: true, json: async () => ({ id: 'synthetic-seller', tags: [] }) };
      }
      assert.equal(init.headers.Authorization, 'Bearer synthetic-meta-token');
      assert.ok(!url.includes('synthetic-meta-token'));
      assert.equal(init.redirect, 'error');
      return { ok: true, json: async () => url.includes('/insights?') ? { data: [{
        spend: '0', clicks: '0', impressions: '0', cpc: '0', ctr: '0', actions: [], cost_per_action_type: []
      }] } : { name: 'Campaña sintética', status: 'PAUSED', daily_budget: '500000' } };
    } });
  const res = await app.call('api/admin-metrics.js');
  assert.equal(res.code, 200);
  assert.equal(res.body.metaAds.source, 'live_meta_graph_api');
  assert.equal(res.body.metaAds.status, 'PAUSED');
  assert.equal(res.body.metaAds.campaignName, 'Campaña sintética');
  assert.equal(res.body.metaAds.dailyBudget, null);
  assert.equal(res.body.metaAds.currencyMetadata.budgetConfirmed, false);
  assert.equal(res.body.metaAds.currencyMetadata.budgetMinorUnitScale, null);
  assert.equal(res.body.metaAds.currencyMetadata.dailyBudgetRaw, '500000');
  for (const field of ['spend', 'impressions', 'clicks', 'conversationsStarted', 'costPerConversation']) assert.equal(res.body.metaAds[field], 0);
  assert.equal(res.body.system.mercadoPagoStatus, 'connected_live');
});

test('Mercado Pago status distinguishes test accounts, live verification and provider/configuration failures without account PII', async () => {
  for (const [token, account, ok, expected] of [
    [undefined, null, true, 'not_configured'],
    ['TEST-synthetic-token', null, true, 'sandbox_account'],
    ['APP_USR-synthetic-token', { id: 'synthetic-seller', tags: ['test_user'], email: 'never-expose@example.invalid' }, true, 'sandbox_account'],
    ['APP_USR-synthetic-token', { id: 'synthetic-seller', tags: [], email: 'never-expose@example.invalid' }, true, 'connected_live'],
    ['APP_USR-synthetic-token', { id: 'synthetic-seller', tags: [] }, false, 'unavailable'],
    ['APP_USR-synthetic-token', { tags: [] }, true, 'unavailable']
  ]) {
    const app = backend({ env: { MERCADOPAGO_ACCESS_TOKEN: token }, async fetch(url, init) {
      assert.equal(url, 'https://api.mercadopago.com/users/me');
      assert.equal(init.headers.Authorization, 'Bearer ' + token);
      assert.ok(!url.includes(token));
      return { ok, json: async () => account };
    } });
    const res = await app.call('api/admin-metrics.js');
    assert.equal(res.code, 200);
    assert.equal(res.body.system.mercadoPagoStatus, expected);
    assert.ok(!JSON.stringify(res.body).includes('never-expose@example.invalid'));
    assert.equal(app.effects.filter(effect => effect.fetch).length, !token || token.startsWith('TEST-') ? 0 : 1);
  }
});

test('unavailable Meta is identified while database errors never fall back to customer files', async () => {
  const app = backend({ env: { META_ACCESS_TOKEN: 'synthetic-meta-token', META_CAMPAIGN_ID: '123456' },
    fetch: async () => ({ ok: false, json: async () => ({ error: { message: 'provider secret' } }) }) });
  const res = await app.call('api/admin-metrics.js');
  assert.equal(res.code, 200);
  assert.equal(res.body.metaAds.source, 'unavailable');
  assert.equal(res.body.system.metaApiStatus, 'unavailable');
  assert.equal(res.body.metaAds.spend, 0);
  for (const failure of [
    { query: async () => ({ data: null, error: { message: 'private database error' } }) },
    { rpc: async () => ({ data: null, error: { message: 'private database error' } }) },
    { rpc: async () => ({ data: {}, error: null }) },
    { env: { SUPABASE_URL: undefined } }
  ]) {
    const unavailable = await backend(failure).call('api/admin-metrics.js');
    assert.equal(unavailable.code, 503);
    assert.ok(!JSON.stringify(unavailable.body).includes('private database error'));
    assert.equal(unavailable.body.success, false);
  }
});

function orderBackend(status, options = {}) {
  return backend({ ...options, query: async state => {
    if (options.query) return options.query(state);
    return { error: null, data: state.operation === 'update' ? { id: ORDER_ID, ...state.values } : {
      id: ORDER_ID, status, tracking_number: status === 'shipped' ? 'TEST-TRACK-1' : null
    } };
  } });
}

test('orders persist allowed fulfilment transitions and only pending cancellation', async () => {
  for (const [before, after, tracking] of [
    ['paid', 'preparing'], ['preparing', 'shipped', 'TEST-TRACK-1'], ['shipped', 'delivered'], ['pending', 'cancelled']
  ]) {
    const app = orderBackend(before);
    const res = await app.call('api/admin-orders.js', { order_id: ORDER_ID, status: after, ...(tracking ? { tracking_number: tracking } : {}) });
    assert.equal(res.code, 200);
    assert.equal(res.body.order.status, after);
    const update = app.calls.find(call => call.operation === 'update');
    assert.deepEqual(update.filters, [['id', ORDER_ID], ['status', before]]);
    assert.ok(!Object.hasOwn(update.values, 'payment_id'));
  }
  const trackingOnly = await orderBackend('shipped').call('api/admin-orders.js', { order_id: ORDER_ID, tracking_number: 'TEST-TRACK-2' });
  assert.equal(trackingOnly.code, 200);
  assert.equal(trackingOnly.body.order.tracking_number, 'TEST-TRACK-2');
});

test('orders cannot approve payments, skip fulfilment or mutate arbitrary financial fields', async () => {
  for (const body of [
    { order_id: ORDER_ID, status: 'paid' }, { order_id: ORDER_ID, total_amount: 1 },
    { order_id: ORDER_ID, status: 'preparing', payment_id: 'FAKE-PAYMENT' },
    { order_id: { toString: 'invalid' }, status: 'preparing' },
    { order_id: ORDER_ID, tracking_number: '<script>bad</script>' },
    { order_id: ORDER_ID, tracking_number: 'x'.repeat(101) }, { order_id: ORDER_ID }
  ]) {
    const app = orderBackend('paid');
    assert.equal((await app.call('api/admin-orders.js', body)).code, 400);
    assert.equal(app.calls.length, 0);
  }
  for (const [before, after] of [['pending', 'shipped'], ['paid', 'shipped'], ['paid', 'cancelled'], ['delivered', 'preparing']]) {
    const app = orderBackend(before);
    const res = await app.call('api/admin-orders.js', { order_id: ORDER_ID, status: after, tracking_number: 'TEST-TRACK-1' });
    assert.equal(res.code, 409);
    assert.ok(!app.calls.some(call => call.operation === 'update'));
  }
  assert.equal((await orderBackend('preparing').call('api/admin-orders.js', { order_id: ORDER_ID, status: 'shipped' })).code, 400);
  assert.equal((await orderBackend('pending').call('api/admin-orders.js', { order_id: ORDER_ID, tracking_number: 'TEST-TRACK-1' })).code, 409);
});

test('order not found, persistence failure and concurrent status changes are explicit', async () => {
  for (const [result, expected] of [
    [{ data: null, error: null }, 404], [{ data: null, error: { message: 'private detail' } }, 503]
  ]) {
    const res = await orderBackend('paid', { query: async () => result }).call('api/admin-orders.js', { order_id: ORDER_ID, status: 'preparing' });
    assert.equal(res.code, expected);
    assert.ok(!JSON.stringify(res.body).includes('private detail'));
  }
  const app = orderBackend('paid', { query: async state => ({ data: state.operation === 'update' ? null : { id: ORDER_ID, status: 'paid' }, error: null }) });
  const res = await app.call('api/admin-orders.js', { order_id: ORDER_ID, status: 'preparing' });
  assert.equal(res.code, 409);
  assert.equal(res.body.code, 'ORDER_CHANGED');
});

test('concurrent tracking edits compare updated_at even when fulfilment status stays shipped', async () => {
  let record = { id: ORDER_ID, status: 'shipped', tracking_number: 'TEST-ORIGINAL', updated_at: '2026-01-01T00:00:00.000Z' };
  const app = orderBackend('shipped', { query: async state => {
    if (state.operation !== 'update') return { data: structuredClone(record), error: null };
    if (!state.filters.every(([field, value]) => record[field] === value)) return { data: null, error: null };
    record = { ...record, ...state.values };
    return { data: structuredClone(record), error: null };
  } });
  const results = await Promise.all([
    app.call('api/admin-orders.js', { order_id: ORDER_ID, tracking_number: 'TEST-A' }),
    app.call('api/admin-orders.js', { order_id: ORDER_ID, tracking_number: 'TEST-B' })
  ]);
  assert.deepEqual(results.map(result => result.code).sort(), [200, 409]);
  assert.equal(results.find(result => result.code === 409).body.code, 'ORDER_CHANGED');
  for (const update of app.calls.filter(call => call.operation === 'update')) {
    assert.ok(update.filters.some(([field, value]) => field === 'updated_at' && value === '2026-01-01T00:00:00.000Z'));
  }
  assert.equal(record.tracking_number, results.find(result => result.code === 200).body.order.tracking_number);
});

test('lead status updates persist and reject unrecognized fields and values', async () => {
  for (const status of ['new', 'negotiating', 'quoted', 'won', 'lost']) {
    const app = backend({ query: async state => ({ data: { id: LEAD_ID, ...state.values }, error: null }) });
    const res = await app.call('api/admin-leads.js', { lead_id: LEAD_ID, status });
    assert.equal(res.code, 200);
    assert.equal(res.body.lead.status, status);
    assert.equal(app.calls[0].table, 'leads');
    assert.deepEqual(app.calls[0].filters, [['id', LEAD_ID]]);
  }
  for (const body of [
    { lead_id: LEAD_ID, status: 'paid' }, { lead_id: LEAD_ID, status: 'won', phone: 'changed' },
    { lead_id: { toString: 'invalid' }, status: 'won' }
  ]) {
    const app = backend();
    assert.equal((await app.call('api/admin-leads.js', body)).code, 400);
    assert.equal(app.calls.length, 0);
  }
  assert.equal((await backend({ query: async () => ({ data: null, error: null }) }).call('api/admin-leads.js', { lead_id: LEAD_ID, status: 'won' })).code, 404);
  assert.equal((await backend({ query: async () => ({ data: null, error: { message: 'private' } }) }).call('api/admin-leads.js', { lead_id: LEAD_ID, status: 'won' })).code, 503);
});
