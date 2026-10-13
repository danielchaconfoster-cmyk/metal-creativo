const { createHash, timingSafeEqual } = require('node:crypto');

// A random server-only key is required. Short PINs and implicit defaults are invalid.
function validToken(value) {
  return typeof value === 'string' && value.length >= 32 && value.length <= 512 && !/[^\x21-\x7e]/.test(value);
}

function requireAdmin(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const expected = process.env.ADMIN_TOKEN;
  if (!validToken(expected)) {
    res.status(503).json({ code: 'ADMIN_NOT_CONFIGURED', error: 'Acceso administrativo no configurado.' });
    return false;
  }

  // Reject duplicate/ambiguous credentials, including headers collapsed by Node.
  const names = new Set(['x-admin-token', 'authorization']);
  const headers = Object.entries(req.headers || {}).filter(([name]) => names.has(name.toLowerCase()));
  const rawNames = (req.rawHeaders || []).filter((_, index) => index % 2 === 0);
  const rawCount = rawNames.filter(name => names.has(name.toLowerCase())).length;
  let supplied;
  if (headers.length === 1 && rawCount <= 1 && typeof headers[0][1] === 'string') {
    const [name, value] = headers[0];
    supplied = name.toLowerCase() === 'authorization' ? (/^Bearer /i.test(value) ? value.slice(7) : undefined) : value;
  }

  // Query parameters, request bodies, and Host are never authentication sources.
  if (!validToken(supplied) ||
      !timingSafeEqual(createHash('sha256').update(supplied).digest(), createHash('sha256').update(expected).digest())) {
    res.status(401).json({ code: 'UNAUTHORIZED', error: 'Acceso no autorizado.' });
    return false;
  }
  return true;
}

module.exports = { requireAdmin };
