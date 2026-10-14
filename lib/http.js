'use strict';

const MAX_BODY_BYTES = 128 * 1024;
function installHttp(req, res) {
  if (!req.query) {
    req.query = Object.create(null);
    for (const [key, value] of new URL(req.url || '/', 'http://localhost').searchParams) {
      const previous = req.query[key];
      req.query[key] = previous === undefined ? value : Array.isArray(previous) ? [...previous, value] : [previous, value];
    }
  }
  if (!res.status) res.status = code => { res.statusCode = code; return res; };
  if (!res.json) res.json = value => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value)); return res; };
  if (!res.send) res.send = value => { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end(String(value)); return res; };
}
class HttpError extends Error {
  constructor(status, code, message = 'No se pudo procesar la solicitud') {
    super(message); this.status = status; this.code = code;
  }
}

function singleHeader(req, name) {
  const key = name.toLowerCase();
  const entries = Object.entries(req.headers || {}).filter(([k]) => k.toLowerCase() === key);
  const raw = req.rawHeaders || [];
  let count = 0;
  for (let i = 0; i < raw.length; i += 2) if (String(raw[i]).toLowerCase() === key) count++;
  if (entries.length > 1 || count > 1 || (entries[0] && typeof entries[0][1] !== 'string'))
    throw new HttpError(400, 'AMBIGUOUS_HEADER');
  return entries[0]?.[1];
}

async function readRaw(req) {
  if (Buffer.isBuffer(req.rawBody)) {
    if (req.rawBody.length > MAX_BODY_BYTES) throw new HttpError(413, 'BODY_TOO_LARGE');
    return req.rawBody;
  }
  const length = singleHeader(req, 'content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES))
    throw new HttpError(/^\d+$/.test(length) ? 413 : 400, 'INVALID_BODY_LENGTH');
  // Read the original stream before accessing Vercel's lazy body helper.
  if (!req[Symbol.asyncIterator]) throw new HttpError(400, 'RAW_BODY_REQUIRED');
  const chunks = []; let size = 0;
  const timeout = setTimeout(() => req.destroy?.(new HttpError(408, 'BODY_TIMEOUT')), 10000);
  timeout.unref?.();
  try {
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > MAX_BODY_BYTES) throw new HttpError(413, 'BODY_TOO_LARGE');
      chunks.push(bytes);
    }
    const raw = Buffer.concat(chunks);
    if (length && Number(length) !== raw.length) throw new HttpError(400, 'INVALID_BODY_LENGTH');
    req.rawBody = raw;
    return raw;
  } finally { clearTimeout(timeout); }
}

function parseJson(raw) {
  let value;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)); }
  catch (_) { throw new HttpError(400, 'INVALID_JSON'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'INVALID_JSON');
  return value;
}

async function readJson(req) {
  if (Buffer.isBuffer(req.rawBody)) return parseJson(await readRaw(req));
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && !Array.isArray(req.body)) {
    if (Buffer.byteLength(JSON.stringify(req.body)) > MAX_BODY_BYTES) throw new HttpError(413, 'BODY_TOO_LARGE');
    return req.body;
  }
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    const raw = Buffer.from(req.body);
    if (raw.length > MAX_BODY_BYTES) throw new HttpError(413, 'BODY_TOO_LARGE');
    return parseJson(raw);
  }
  return parseJson(await readRaw(req));
}

function sendError(res, error) {
  res.setHeader('Cache-Control', 'no-store');
  const known = error instanceof HttpError;
  return res.status(known ? error.status : 503).json({ success: false,
    code: known ? error.code : 'SERVICE_UNAVAILABLE',
    error: known ? error.message : 'Servicio temporalmente no disponible. Intenta nuevamente.' });
}

module.exports = { installHttp, HttpError, readJson, readRaw, parseJson, singleHeader, sendError, MAX_BODY_BYTES };
