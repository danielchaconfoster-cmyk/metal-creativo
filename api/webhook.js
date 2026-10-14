'use strict';
const crypto = require('node:crypto');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { getDatabase, rpc } = require('../lib/database');
const { installHttp, readJson, singleHeader, HttpError, sendError } = require('../lib/http');
const { UUID } = require('../lib/orders');

function verify(req) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) throw new HttpError(503, 'WEBHOOK_NOT_CONFIGURED');
  const signature = singleHeader(req, 'x-signature');
  const requestId = singleHeader(req, 'x-request-id');
  const id = req.query?.['data.id'];
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id) || !requestId || !/^[a-zA-Z0-9_-]{1,200}$/.test(requestId) || typeof signature !== 'string') throw new HttpError(401, 'INVALID_SIGNATURE');
  const fields = Object.create(null);
  for (const part of signature.split(',')) {
    const match = /^(ts|v1)=([^\s=]+)$/.exec(part.trim());
    if (!match || fields[match[1]]) throw new HttpError(401, 'INVALID_SIGNATURE');
    fields[match[1]] = match[2];
  }
  if (!/^\d{10,13}$/.test(fields.ts || '') || !/^[a-fA-F0-9]{64}$/.test(fields.v1 || '')) throw new HttpError(401, 'INVALID_SIGNATURE');
  const manifest = `id:${id.toLowerCase()};request-id:${requestId};ts:${fields.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(fields.v1, 'hex'))) throw new HttpError(401, 'INVALID_SIGNATURE');
  return id;
}

module.exports = async (req, res) => {
  installHttp(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).send('Metodo no permitido');
  try {
    const id = verify(req); // Authenticate before any provider or database operation.
    const body = await readJson(req);
    if (body.data?.id !== undefined && (!['string','number'].includes(typeof body.data.id) || String(body.data.id) !== id)) throw new HttpError(400, 'PAYMENT_ID_MISMATCH');
    if (body.type && body.type !== 'payment') return res.status(200).send('OK');
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!token) throw new HttpError(503, 'PAYMENT_NOT_CONFIGURED');
    const mode = process.env.MERCADOPAGO_MODE || (process.env.VERCEL_ENV === 'production' ? 'live' : undefined);
    if (mode && !['live','sandbox'].includes(mode)) throw new HttpError(503,'PAYMENT_MODE_INVALID');
    const payment = await new Payment(new MercadoPagoConfig({ accessToken: token, options: { timeout: 8000 } })).get({ id });
    if (!payment || String(payment.id) !== id) throw new HttpError(502, 'PAYMENT_ID_MISMATCH');
    if (payment.status !== 'approved') return res.status(200).send('OK');
    if ((mode === 'live' && payment.live_mode !== true) || (mode === 'sandbox' && payment.live_mode !== false)) return res.status(200).send('OK');
    if (typeof payment.external_reference !== 'string' || !UUID.test(payment.external_reference)) return res.status(200).send('OK');
    const amount = Number(payment.transaction_amount);
    if (!Number.isFinite(amount) || amount <= 0 || payment.currency_id !== 'CLP') return res.status(200).send('OK');
    const db = getDatabase();
    const result = await rpc(db, 'backend_apply_payment', { p_order_id: payment.external_reference, p_payment_id: id, p_amount: amount, p_currency: payment.currency_id });
    if (!result || typeof result.applied !== 'boolean') throw new HttpError(503, 'PAYMENT_NOT_SAVED');
    // Record only minimal metadata, never payer details or the notification's raw body.
    const { error } = await db.from('payment_webhook_logs').upsert({ gateway: 'mercadopago', event_type: 'payment.approved', payment_id: id,
      raw_payload: { order_id: payment.external_reference, applied: result.applied, reason: result.reason || null }, signature_verified: true }, { onConflict: 'gateway,payment_id,event_type' });
    if (error) throw new HttpError(503, 'PAYMENT_AUDIT_NOT_SAVED');
    return res.status(200).send('OK');
  } catch (error) { return sendError(res, error); }
};
