'use strict';
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { randomUUID } = require('node:crypto');
const { getDatabase, rpc } = require('../lib/database');
const { installHttp, readJson, HttpError, sendError } = require('../lib/http');
const { canonicalBase, checkOrigin, rateLimit, normalizeCheckout, createOrder, setAccessCookie } = require('../lib/orders');

async function sandboxMode(token) {
  const mode = process.env.MERCADOPAGO_MODE || (process.env.VERCEL_ENV === 'production' ? 'live' : undefined);
  if (mode && !['live','sandbox'].includes(mode)) throw new HttpError(503,'PAYMENT_MODE_INVALID');
  if (token.startsWith('TEST-')) {
    if (mode === 'live') throw new HttpError(503,'PAYMENT_LIVE_ACCOUNT_REQUIRED');
    return true;
  }
  // APP_USR credentials can belong to a test account as well as to a real seller.
  const account = await fetch('https://api.mercadopago.com/users/me', {
    headers:{Authorization:`Bearer ${token}`}, signal:AbortSignal.timeout(8000), redirect:'error'
  });
  if (!account.ok) throw new HttpError(503,'PAYMENT_ACCOUNT_UNAVAILABLE');
  const data = await account.json();
  if (!data.id || !Array.isArray(data.tags)) throw new HttpError(503,'PAYMENT_ACCOUNT_UNAVAILABLE');
  const test = data.tags.includes('test_user');
  if (mode === 'live' && test) throw new HttpError(503,'PAYMENT_LIVE_ACCOUNT_REQUIRED');
  return mode === 'sandbox' || test;
}

module.exports = async (req, res) => {
  installHttp(req, res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' });
  try {
    checkOrigin(req);
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!token) throw new HttpError(503, 'PAYMENT_NOT_CONFIGURED');
    const base = canonicalBase();
    const db = getDatabase(), body = await readJson(req);
    normalizeCheckout(body);
    await rateLimit(req, db, 'checkout');
    const sandbox = await sandboxMode(token);
    const { order, normalized, token: orderToken } = await createOrder(req, db, body, 'mercadopago', 'web_mercadopago');
    if (order.status !== 'pending') throw new HttpError(409, 'ORDER_NOT_PENDING');
    const requestId = randomUUID();
    const claim = await rpc(db,'backend_claim_preference',{p_order_id:order.id,p_request_id:requestId});
    if (!claim || (!claim.claimed && !claim.preference_id)) throw new HttpError(409,'CHECKOUT_IN_PROGRESS','El pago se está preparando. Intenta nuevamente en un momento.');
    const preference = new Preference(new MercadoPagoConfig({ accessToken: token, options: { timeout: 8000 } }));
    const items = [...normalized.items];
    if (normalized.shippingCost) items.push({ id: 'shipping_fee', title: 'Despacho (EXPRESS SANTIAGO)', quantity: 1, unit_price: normalized.shippingCost, currency_id: 'CLP' });
    const result = claim.preference_id ? await preference.get({ preferenceId: claim.preference_id }) : await preference.create({
      requestOptions: { idempotencyKey: order.id },
      body: {
        items, payer: { name: normalized.customer.full_name, email: normalized.customer.email,
          phone: { number: normalized.customer.phone.replace(/\D/g, '') },
          identification: { type: /[A-JL-Z]/i.test(normalized.customer.rut) ? 'PASSPORT' : 'RUT', number: normalized.customer.rut.replace(/[.\-]/g, '') } },
        external_reference: order.id,
        back_urls: { success: `${base}/checkout-success?order_id=${order.id}&status=approved`, failure: `${base}/checkout?order_id=${order.id}&status=rejected`, pending: `${base}/checkout-success?order_id=${order.id}&status=pending` },
        notification_url: `${base}/api/webhook`, auto_return: 'approved', statement_descriptor: 'METAL CREATIVO'
      }
    });
    if (!result.id || !result.init_point) throw new HttpError(503, 'PAYMENT_UNAVAILABLE');
    if (!claim.preference_id) {
      const saved = await rpc(db,'backend_finish_preference',{p_order_id:order.id,p_request_id:requestId,p_preference_id:result.id});
      if (saved !== true) throw new HttpError(503, 'ORDER_NOT_SAVED');
    }
    setAccessCookie(res, order, orderToken);
    if (sandbox && !result.sandbox_init_point) throw new HttpError(503,'PAYMENT_UNAVAILABLE');
    return res.status(200).json({ success: true, order_id: order.id, order_number:order.order_number, total_amount:order.total_amount, status: 'pending', preference_id: result.id,
      init_point: sandbox ? result.sandbox_init_point : result.init_point, sandbox_init_point: result.sandbox_init_point, is_sandbox: sandbox });
  } catch (error) { return sendError(res, error); }
};
