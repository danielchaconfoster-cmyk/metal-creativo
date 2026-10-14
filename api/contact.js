const { createHash, randomUUID } = require('node:crypto');
const { isIP } = require('node:net');
const { getDatabase } = require('../lib/database');
const { readJson, HttpError, sendError, installHttp } = require('../lib/http');

const PRODUCT_INTERESTS = ['remolque', 'fogon', 'medida', 'garantia'];
const WINDOW_SECONDS = 600;
const RESULT_FIELDS = 'id,status,created_at,request_hash';

function text(value, maximum, minimum = 1, multiline = false) {
  if (typeof value !== 'string') throw new HttpError(400, 'INVALID_CONTACT');
  const normalized = value.normalize('NFC').trim();
  const forbidden = multiline ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/;
  if (normalized.length < minimum || normalized.length > maximum || forbidden.test(normalized)) {
    throw new HttpError(400, 'INVALID_CONTACT');
  }
  return normalized;
}

function contactPayload(body) {
  if (Object.keys(body).some(key => !['name', 'email', 'phone', 'product_interest', 'message', 'idempotency_key'].includes(key))) {
    throw new HttpError(400, 'INVALID_CONTACT');
  }
  const name = text(body.name, 100, 2);
  const email = text(body.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'INVALID_CONTACT');
  const rawPhone = text(body.phone, 30);
  if (!/^\+?[0-9 ()-]+$/.test(rawPhone)) throw new HttpError(400, 'INVALID_CONTACT');
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) throw new HttpError(400, 'INVALID_CONTACT');
  if (!PRODUCT_INTERESTS.includes(body.product_interest)) throw new HttpError(400, 'INVALID_CONTACT');
  return {
    name, email, phone: `${rawPhone.startsWith('+') ? '+' : ''}${digits}`,
    product_interest: body.product_interest,
    message: text(body.message === undefined ? '' : body.message, 4000, 0, true)
  };
}

function idempotencyKey(req, body) {
  const headers = Object.entries(req.headers || {}).filter(([name]) => name.toLowerCase() === 'idempotency-key');
  const rawCount = (req.rawHeaders || []).filter((_, index) => index % 2 === 0).filter(name => name.toLowerCase() === 'idempotency-key').length;
  if (headers.length > 1 || rawCount > 1) throw new HttpError(400, 'INVALID_IDEMPOTENCY_KEY');
  const header = headers[0]?.[1];
  if (header !== undefined && body.idempotency_key !== undefined && header !== body.idempotency_key) {
    throw new HttpError(400, 'INVALID_IDEMPOTENCY_KEY');
  }
  const key = header === undefined ? body.idempotency_key : header;
  if (key === undefined) return randomUUID();
  if (typeof key !== 'string' || !/^[\x21-\x7e]{16,128}$/.test(key) || key.includes(',')) {
    throw new HttpError(400, 'INVALID_IDEMPOTENCY_KEY');
  }
  return key;
}

function checkOrigin(req) {
  const origin = req.headers?.origin;
  if (req.headers?.['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'ORIGIN_NOT_ALLOWED');
  if (origin === undefined) return;
  if (typeof origin !== 'string') throw new HttpError(403, 'ORIGIN_NOT_ALLOWED');
  let requestOrigin;
  let canonical;
  try {
    requestOrigin = new URL(origin);
    canonical = new URL(process.env.PUBLIC_BASE_URL || process.env.SITE_URL || 'https://metalcreativo.cl');
  } catch (_) {
    throw new HttpError(403, 'ORIGIN_NOT_ALLOWED');
  }
  if (origin !== requestOrigin.origin) throw new HttpError(403, 'ORIGIN_NOT_ALLOWED');
  if (requestOrigin.origin === canonical.origin) return;
  // The local preview receives genuine browser Origin headers; Host never authorizes production origins.
  if (process.env.VERCEL !== '1' && ['localhost', '127.0.0.1', '[::1]'].includes(requestOrigin.hostname) && requestOrigin.protocol === 'http:') return;
  throw new HttpError(403, 'ORIGIN_NOT_ALLOWED');
}

function rateKey(req) {
  let ip = req.socket?.remoteAddress || 'unknown';
  const forwarded = req.headers?.['x-forwarded-for'];
  if (process.env.VERCEL === '1' && typeof forwarded === 'string') {
    const candidate = forwarded.split(',')[0].trim();
    if (isIP(candidate)) ip = candidate;
  }
  return createHash('sha256').update(String(ip)).digest('hex');
}

function sendResult(res, row, expectedHash, statusCode) {
  if (!row || row.request_hash !== expectedHash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT');
  return res.status(statusCode).json({ success: true, contact_id: row.id, status: row.status, created_at: row.created_at });
}

module.exports = async (req, res) => {
  installHttp(req, res);
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', error: 'Método no permitido.' });
  }
  try {
    checkOrigin(req);
    const body = await readJson(req);
    const payload = contactPayload(body);
    const key = idempotencyKey(req, body);
    const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const database = getDatabase();
    const existing = await database.from('contact_messages').select(RESULT_FIELDS).eq('idempotency_key', key).maybeSingle();
    if (existing.error) throw new HttpError(503, 'DATABASE_UNAVAILABLE');
    if (existing.data) return sendResult(res, existing.data, hash, 200);
    const limit = await database.rpc('backend_consume_rate_limit', {
      p_scope: 'contact', p_key: rateKey(req), p_limit: 5, p_window_seconds: WINDOW_SECONDS
    });
    if (limit.error || typeof limit.data !== 'boolean') throw new HttpError(503, 'DATABASE_UNAVAILABLE');
    if (!limit.data) {
      res.setHeader('Retry-After', String(WINDOW_SECONDS));
      throw new HttpError(429, 'RATE_LIMITED');
    }
    const inserted = await database.from('contact_messages').insert({
      ...payload, status: 'new', idempotency_key: key, request_hash: hash
    }).select(RESULT_FIELDS).single();
    if (inserted.error?.code === '23505') {
      // Concurrent requests sharing a key meet at the database unique constraint.
      const duplicate = await database.from('contact_messages').select(RESULT_FIELDS).eq('idempotency_key', key).maybeSingle();
      if (duplicate.error || !duplicate.data) throw new HttpError(503, 'DATABASE_UNAVAILABLE');
      return sendResult(res, duplicate.data, hash, 200);
    }
    if (inserted.error || !inserted.data) throw new HttpError(503, 'DATABASE_UNAVAILABLE');
    return sendResult(res, inserted.data, hash, 201);
  } catch (error) {
    return sendError(res, error);
  }
};
