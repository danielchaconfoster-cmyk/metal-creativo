'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto, createHash } = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const ORDER_ID = '00000000-0000-4000-8000-000000000001';
const LEAD_ID = '00000000-0000-4000-8000-000000000002';
const TOKEN = 'test-private-admin-key-that-is-long-enough';
const CART = [{ id: 'barra-remolque', name: 'Barra', price: 1, quantity: 1 }];

function storage(initial = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
}

function reply(status, body) {
    return { status, ok: status >= 200 && status < 300, async json() { return body; } };
}

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function load(page, transport, initial = {}) {
    const html = fs.readFileSync(path.join(ROOT, 'public', page + '.html'), 'utf8');
    const localStorage = storage(initial.localStorage || {});
    const sessionStorage = storage(initial.sessionStorage || {});
    const alerts = [];
    const calls = [];
    const window = {
        location: { search: initial.search || '', href: '', replaced: '', replace(value) { this.replaced = value; } },
        open() {}
    };
    const context = vm.createContext({
        localStorage, sessionStorage, window, crypto: webcrypto, TextEncoder,
        URL, URLSearchParams, Uint8Array, Intl, Date, console,
        navigator: { clipboard: { async writeText() {} } },
        alert(message) { alerts.push(message); },
        prompt() { return initial.tracking || 'SYNTHETIC-123'; },
        setTimeout,
        async fetch(url, options = {}) {
            calls.push({ url, options, body: options.body ? JSON.parse(options.body) : null });
            return transport(url, options, calls);
        }
    });
    let app;
    if (page === 'admin') {
        const script = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].find(match => match[1].includes('function adminApp()'));
        vm.runInContext(script[1], context);
        app = vm.runInContext('adminApp()', context);
    } else {
        const match = [...html.matchAll(/x-data="([^"]*)"/g)].find(value => value[1].trim().startsWith('{'));
        app = vm.runInContext('(' + match[1] + ')', context);
    }
    return { app, localStorage, sessionStorage, window, alerts, calls, html };
}

function checkout(transport, method = 'transferencia') {
    const state = load('checkout', transport, { localStorage: { mc_cart: JSON.stringify(CART) } });
    Object.assign(state.app, {
        nombre: 'Cliente Sintético', rut: '12.345.678-5', email: 'synthetic@example.invalid',
        telefono: '+56900000000', comuna: 'Santiago', direccion: 'Dirección sintética', paymentMethod: method
    });
    return state;
}

test('a transfer is recorded before redirect and uses the server total and UUID', async () => {
    const waiting = deferred();
    const state = checkout(() => waiting.promise);
    const operation = state.app.submitOrder();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(state.localStorage.getItem('mc_cart'), JSON.stringify(CART));
    assert.equal(state.window.location.href, '');
    waiting.resolve(reply(201, { success: true, order_id: ORDER_ID, order_number: 42, status: 'pending', total_amount: 69990 }));
    await operation;
    assert.equal(state.calls[0].url, '/api/orders');
    assert.equal(state.calls[0].body.payment_method, 'transferencia');
    assert.equal(state.localStorage.getItem('mc_cart'), null);
    assert.equal(state.localStorage.getItem('last_order'), null);
    const summary = JSON.parse(state.sessionStorage.getItem('last_order'));
    assert.equal(summary.total, 69990);
    assert.equal(summary.orderId, ORDER_ID);
    assert.equal(summary.orderNumber, 42);
    assert.equal(summary.customer.email, undefined);
    assert.equal(state.window.location.href, 'checkout-success.html?order_id=' + ORDER_ID);
});

test('checkout failures preserve the cart and retry the same request without storing personal details in the retry key', async () => {
    const state = checkout(() => reply(503, { success: false, error: 'Servicio temporalmente no disponible.' }));
    await state.app.submitOrder();
    await state.app.submitOrder();
    assert.equal(state.calls.length, 2);
    assert.equal(state.calls[0].body.idempotency_key, state.calls[1].body.idempotency_key);
    assert.equal(state.localStorage.getItem('mc_cart'), JSON.stringify(CART));
    assert.equal(state.sessionStorage.getItem('last_order'), null);
    assert.equal(state.window.location.href, '');
    const saved = JSON.parse(state.localStorage.getItem('mc_checkout_attempt'));
    assert.deepEqual(Object.keys(saved).sort(), ['hash', 'key']);
    assert.equal(saved.hash.length, 64);
    assert.ok(!JSON.stringify(saved).includes('synthetic@example.invalid'));
    state.app.nombre = 'Otro Cliente Sintético';
    await state.app.submitOrder();
    assert.notEqual(state.calls[2].body.idempotency_key, state.calls[0].body.idempotency_key);
    assert.equal(state.app.processing, false);
});

test('a Mercado Pago preference preserves the cart until payment confirmation', async () => {
    const state = checkout(() => reply(200, { success: true, order_id: ORDER_ID, status: 'pending', total_amount: 69990,
        init_point: 'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=synthetic' }), 'mercadopago');
    await state.app.submitOrder();
    assert.equal(state.calls[0].url, '/api/create-preference');
    assert.equal(state.localStorage.getItem('mc_cart'), JSON.stringify(CART));
    assert.ok(state.localStorage.getItem('mc_checkout_attempt'));
    assert.ok(state.window.location.href.startsWith('https://www.mercadopago.cl/'));
});

test('changing payment options during a request cannot change the recorded flow or clear an unpaid cart', async () => {
    const waiting = deferred();
    const state = checkout(() => waiting.promise, 'mercadopago');
    const operation = state.app.submitOrder();
    while (state.calls.length === 0) await new Promise(resolve => setImmediate(resolve));
    state.app.paymentMethod = 'whatsapp';
    state.app.nombre = 'Otro Cliente Sintético';
    waiting.resolve(reply(200, { success: true, order_id: ORDER_ID, status: 'pending', total_amount: 69990,
        init_point: 'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=synthetic' }));
    await operation;
    assert.equal(state.calls[0].body.payment_method, 'mercadopago');
    assert.equal(state.localStorage.getItem('mc_cart'), JSON.stringify(CART));
    assert.ok(state.window.location.href.startsWith('https://www.mercadopago.cl/'));
    const summary = JSON.parse(state.sessionStorage.getItem('last_order'));
    assert.equal(summary.paymentMethod, 'mercadopago');
    assert.equal(summary.customer.full_name, 'Cliente Sintético');
});

test('unexpected payment URLs and malformed order responses never redirect or clear the cart', async () => {
    for (const result of [
        { success: true, order_id: ORDER_ID, total_amount: 69990, init_point: 'https://example.invalid/checkout' },
        { success: true, order_id: 'MC-fabricated', total_amount: 69990, init_point: 'https://www.mercadopago.cl/checkout' }
    ]) {
        const state = checkout(() => reply(200, result), 'mercadopago');
        await state.app.submitOrder();
        assert.equal(state.window.location.href, '');
        assert.equal(state.localStorage.getItem('mc_cart'), JSON.stringify(CART));
        assert.equal(state.sessionStorage.getItem('last_order'), null);
    }
});

test('WhatsApp coordination opens only after a durable order is accepted', async () => {
    const state = checkout(() => reply(201, { success: true, order_id: ORDER_ID, status: 'pending', total_amount: 69990 }), 'whatsapp');
    await state.app.submitOrder();
    assert.equal(state.calls[0].url, '/api/orders');
    assert.equal(state.calls[0].body.payment_method, 'whatsapp');
    const message = new URL(state.window.location.href).searchParams.get('text');
    assert.ok(message.includes(ORDER_ID));
    assert.ok(message.includes('69.990'));
    assert.equal(state.localStorage.getItem('mc_cart'), null);
});

test('contact success waits for server persistence and failed retries keep the same key', async () => {
    const waiting = deferred();
    let attempt = 0;
    const state = load('contacto', () => ++attempt === 1 ? waiting.promise : reply(201, { success: true, contact_id: LEAD_ID }));
    Object.assign(state.app, { nombre: 'Cliente Sintético', email: 'synthetic@example.invalid', telefono: '+56900000000', mensaje: 'Consulta sintética' });
    const operation = state.app.enviarFormulario();
    assert.equal(state.app.enviado, false);
    await state.app.enviarFormulario();
    assert.equal(state.calls.length, 1);
    waiting.resolve(reply(503, { success: false }));
    await operation;
    assert.equal(state.app.enviado, false);
    await state.app.enviarFormulario();
    assert.equal(state.app.enviado, true);
    assert.equal(state.calls[0].body.idempotency_key, state.calls[1].body.idempotency_key);
    assert.equal(state.calls[1].url, '/api/contact');
});

function receipt(transport, options = {}) {
    const summary = { orderId: ORDER_ID, paymentMethod: 'mercadopago', total: 1, cartSnapshot: JSON.stringify(CART), attemptKey: 'synthetic-attempt-key' };
    return load('checkout-success', transport, { search: '?order_id=' + ORDER_ID + '&status=approved&method=transferencia',
        localStorage: { mc_cart: JSON.stringify(CART), mc_checkout_attempt: JSON.stringify({ key: summary.attemptKey, hash: 'synthetic' }) },
        sessionStorage: { last_order: JSON.stringify(summary) }, ...options });
}

test('approved and transfer URL parameters cannot turn an unpaid Mercado Pago order into a receipt', async () => {
    const state = receipt(() => reply(200, { success: true, order: { id: ORDER_ID, status: 'pending', payment_method: 'mercadopago', currency: 'CLP', total_amount: 69990 } }));
    assert.equal(state.app.verified, false);
    assert.equal(state.app.isTransfer, false);
    assert.ok(state.html.includes('x-cloak x-show="verified"'));
    await state.app.init();
    assert.equal(state.app.verified, false);
    assert.equal(state.window.location.replaced, 'checkout.html');
    assert.equal(state.localStorage.getItem('mc_cart'), JSON.stringify(CART));
    assert.ok(state.localStorage.getItem('mc_checkout_attempt'));
    assert.equal(state.calls[0].options.credentials, 'same-origin');
    assert.equal(state.calls[0].url, '/api/order-status?order_id=' + ORDER_ID);
    assert.ok(!state.calls[0].url.includes('token'));
});

test('only the verified server record confirms payment or permits saved transfer instructions', async () => {
    for (const record of [
        { status: 'paid', payment_method: 'mercadopago' },
        { status: 'preparing', payment_method: 'mercadopago' },
        { status: 'shipped', payment_method: 'mercadopago' },
        { status: 'delivered', payment_method: 'mercadopago' },
        { status: 'pending', payment_method: 'transferencia' }
    ]) {
        const state = receipt(() => reply(200, { success: true, order: { id: ORDER_ID, currency: 'CLP', total_amount: 69990, ...record } }));
        await state.app.init();
        assert.equal(state.app.verified, true);
        assert.equal(state.app.order.total, 69990);
        assert.equal(state.app.isTransfer, record.status === 'pending');
        assert.equal(state.localStorage.getItem('mc_cart'), record.status === 'pending' ? JSON.stringify(CART) : null);
    }
});

test('receipt failures and changed carts preserve the current cart', async () => {
    const state = receipt(() => reply(404, { success: false }));
    await state.app.init();
    assert.equal(state.app.verified, false);
    assert.equal(state.localStorage.getItem('mc_cart'), JSON.stringify(CART));
    const changed = JSON.stringify([{ ...CART[0], quantity: 2 }]);
    const paid = receipt(() => reply(200, { success: true, order: { id: ORDER_ID, currency: 'CLP', status: 'paid', payment_method: 'mercadopago', total_amount: 69990 } }), { localStorage: { mc_cart: changed } });
    await paid.app.init();
    assert.equal(paid.app.verified, true);
    assert.equal(paid.localStorage.getItem('mc_cart'), changed);
});

function administrator(transport) {
    const state = load('admin', transport);
    Object.assign(state.app, { authenticated: true, authToken: TOKEN });
    return state;
}

test('closing a lead persists before showing success and failed writes do not alter the lead', async () => {
    const waiting = deferred();
    const state = administrator(() => waiting.promise);
    const lead = { id: LEAD_ID, name: 'Cliente Sintético', status: 'new' };
    const operation = state.app.markAsWon(lead);
    assert.equal(lead.status, 'new');
    assert.equal(state.alerts.length, 0);
    assert.equal(state.calls[0].options.headers['x-admin-token'], TOKEN);
    assert.equal(state.calls[0].options.method, 'PATCH');
    assert.equal(state.calls[0].body.lead_id, LEAD_ID);
    waiting.resolve(reply(200, { success: true, lead: { id: LEAD_ID, status: 'won' } }));
    await operation;
    assert.equal(lead.status, 'won');
    assert.equal(state.alerts.length, 1);
    const failed = administrator(() => reply(503, { success: false }));
    const unchanged = { id: LEAD_ID, name: 'Cliente Sintético', status: 'new' };
    await failed.app.markAsWon(unchanged);
    assert.equal(unchanged.status, 'new');
});

test('late administrative responses after logout cannot update records or display success', async () => {
    const waiting = deferred();
    const state = administrator(() => waiting.promise);
    const lead = { id: LEAD_ID, name: 'Cliente Sintético', status: 'new' };
    const operation = state.app.markAsWon(lead);
    state.app.logout();
    waiting.resolve(reply(200, { success: true, lead: { id: LEAD_ID, status: 'won' } }));
    await operation;
    assert.equal(lead.status, 'new');
    assert.equal(state.alerts.length, 0);
    assert.equal(state.app.authToken, '');
});

test('logout while an administrative JSON response is being read also blocks stale updates', async () => {
    const reading = deferred();
    const started = deferred();
    const state = administrator(() => ({ status: 200, ok: true, json() { started.resolve(); return reading.promise; } }));
    const lead = { id: LEAD_ID, name: 'Cliente Sintético', status: 'new' };
    const operation = state.app.markAsWon(lead);
    await started.promise;
    state.app.logout();
    reading.resolve({ success: true, lead: { id: LEAD_ID, status: 'won' } });
    await operation;
    assert.equal(lead.status, 'new');
    assert.equal(state.alerts.length, 0);
});

test('tracking performs legitimate persisted transitions and preserves preparation if shipment fails', async () => {
    const state = administrator((url, options, calls) => calls.length === 1
        ? reply(200, { success: true, order: { id: ORDER_ID, status: 'preparing' } })
        : reply(503, { success: false }));
    const order = { id: ORDER_ID, status: 'paid', tracking_number: null };
    await state.app.promptTracking(order);
    assert.equal(state.calls.length, 2);
    assert.equal(state.calls[0].body.status, 'preparing');
    assert.equal(state.calls[1].body.status, 'shipped');
    assert.equal(order.status, 'preparing');
    assert.equal(order.tracking_number, null);
    assert.ok(!state.alerts.some(message => message.includes('¡Flete registrado!')));
    const complete = administrator((url, options, calls) => reply(200, { success: true, order: {
        id: ORDER_ID, status: calls.length === 1 ? 'preparing' : 'shipped', tracking_number: calls.length === 1 ? null : 'SYNTHETIC-123'
    } }));
    const shipped = { id: ORDER_ID, status: 'paid' };
    await complete.app.promptTracking(shipped);
    assert.equal(shipped.status, 'shipped');
    assert.equal(shipped.tracking_number, 'SYNTHETIC-123');
});

test('pending orders cannot be dispatched and are never labelled delivered', async () => {
    const state = administrator(() => { throw new Error('Should not send'); });
    await state.app.promptTracking({ id: ORDER_ID, status: 'pending' });
    assert.equal(state.calls.length, 0);
    assert.equal(state.app.orderStatusLabel('pending'), 'Pendiente');
    assert.equal(state.app.orderStatusLabel('cancelled'), 'Cancelado');
    assert.equal(state.app.orderStatusLabel('paid'), 'Pagado');
    assert.equal(state.app.orderStatusLabel('delivered'), 'Entregado');
    assert.equal(state.app.orderStatusLabel('unknown_state'), 'unknown_state');
    assert.equal(state.app.kpis.totalRevenue, 0);
});

function appearanceSource(html) {
    return html.replace(/\r\n/g, '\n')
        .replace(/(<script[^>]*>)[\s\S]*?(<\/script>)/g, '$1$2')
        .replace(/x-data="[^"]*"/g, 'x-data="FUNCTIONAL_DATA"')
        .replace(' x-cloak x-show="verified" x-data="FUNCTIONAL_DATA"', ' x-data="FUNCTIONAL_DATA"')
        .replace(/x-text="(?:orderStatusLabel\(order\.status\)|order\.status === 'paid' \? 'Pagado' : order\.status === 'preparing' \? 'En Taller' : order\.status === 'shipped' \? 'En Ruta' : 'Entregado')"/g, 'x-text="FUNCTIONAL_ORDER_STATUS"');
}

// Baseline hashes cover every byte outside the explicitly allowed JavaScript/state bindings.
const APPEARANCE_HASHES = {
    "checkout": "8c19bacb1c6efe60f59d60aa092cd4b38247e23efe8a8b78836b781e66b02e1b",
    "checkout-success": "db0d49d11635d99a787ab8f84903a32f5e90c5468881f78ff61a7d32a357bb31",
    "contacto": "294c02e7a30bb524f73a2fb3f2b9c2afe70c7f1a5cf3985baf59074f15be154c",
    "admin": "c40f70789eb9b8122cff2eb167d0813f4f1701c987342e90a614d72427614582"
};

test('existing HTML, styles, classes, and written content remain unchanged outside the functional bindings', () => {
    for (const [page, expected] of Object.entries(APPEARANCE_HASHES)) {
        const html = fs.readFileSync(path.join(ROOT, 'public', page + '.html'), 'utf8');
        assert.equal(createHash('sha256').update(appearanceSource(html)).digest('hex'), expected, page);
    }
    assert.equal(Object.keys(APPEARANCE_HASHES).length, 4);
});
