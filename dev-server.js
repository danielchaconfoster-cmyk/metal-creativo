// Servidor local para public/ y las rutas serverless publicadas explícitamente.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const BODY_LIMIT = 128 * 1024;
const REQUEST_TIMEOUT = 10000;
const API_ROUTES = Object.freeze({
  '/api/admin-metrics': 'admin-metrics.js',
  '/api/create-preference': 'create-preference.js',
  '/api/shipping-quote': 'shipping-quote.js',
  '/api/webhook': 'webhook.js',
  '/api/whatsapp-webhook': 'whatsapp-webhook.js',
  '/api/contact': 'contact.js',
  '/api/orders': 'orders.js',
  '/api/order-status': 'order-status.js',
  '/api/admin-orders': 'admin-orders.js',
  '/api/admin-leads': 'admin-leads.js',
  '/api/admin-whatsapp': 'admin-whatsapp.js'
});

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=UTF-8'
};

class RequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function requestError(statusCode, message) {
  return new RequestError(statusCode, message);
}

// Validate before any URL normalization can erase traversal or Windows aliases.
function parseTarget(target) {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || /[\\#\x00-\x20\x7f]/.test(target)) {
    throw requestError(400, 'Invalid request path');
  }
  const split = target.indexOf('?');
  const rawPath = split === -1 ? target : target.slice(0, split);
  let segments;
  try {
    segments = rawPath.slice(1).split('/').map(segment => decodeURIComponent(segment));
  } catch (_) {
    throw requestError(400, 'Invalid request path');
  }
  for (const segment of segments) {
    if (segment === '.' || segment === '..' || /[\\/:\x00-\x1f\x7f]/.test(segment) || /[. ]$/.test(segment)) {
      throw requestError(400, 'Invalid request path');
    }
  }
  const query = Object.create(null);
  for (const [key, value] of new URLSearchParams(split === -1 ? '' : target.slice(split + 1))) {
    if (!Object.hasOwn(query, key)) query[key] = value;
    else if (Array.isArray(query[key])) query[key].push(value);
    else query[key] = [query[key], value];
  }
  return { pathname: '/' + segments.join('/'), query };
}

function isInside(root, file) {
  const relative = path.relative(root, file);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

async function resolveFile(root, relativePath) {
  const candidate = path.resolve(root, relativePath);
  if (!isInside(root, candidate)) throw requestError(403, 'Forbidden path');
  try {
    const file = await fs.promises.realpath(candidate);
    if (!isInside(root, file)) throw requestError(403, 'Forbidden path');
    return (await fs.promises.stat(file)).isFile() ? file : null;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }
}

function sendError(req, res, statusCode, message) {
  if (res.headersSent || res.destroyed) return res.destroy();
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  res.setHeader('Connection', 'close');
  res.end(JSON.stringify({ error: message }));
  // Stop buffering and close after the error response, including unfinished bodies.
  req.resume();
  res.once('finish', () => req.socket.end());
}

function readBody(req, limit, timeout) {
  return new Promise((resolve, reject) => {
    const declaredLength = req.headers['content-length'];
    if (declaredLength !== undefined && (!/^\d+$/.test(declaredLength) || !Number.isSafeInteger(Number(declaredLength)))) {
      reject(requestError(400, 'Invalid Content-Length'));
      return;
    }
    if (declaredLength !== undefined && Number(declaredLength) > limit) {
      reject(requestError(413, 'Request body too large'));
      return;
    }
    const chunks = [];
    let size = 0;
    const timer = setTimeout(() => finish(requestError(408, 'Request body timeout')), timeout);
    const cleanup = () => {
      clearTimeout(timer);
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('aborted', onAborted);
      req.removeListener('error', onError);
    };
    const finish = (error, body) => {
      cleanup();
      if (error) reject(error);
      else resolve(body);
    };
    const onData = chunk => {
      size += chunk.length;
      if (size > limit) return finish(requestError(413, 'Request body too large'));
      chunks.push(chunk);
    };
    const onEnd = () => finish(null, Buffer.concat(chunks, size));
    const onAborted = () => finish(requestError(400, 'Request aborted'));
    const onError = () => finish(requestError(400, 'Invalid request body'));
    req.on('data', onData);
    req.once('end', onEnd);
    req.once('aborted', onAborted);
    req.once('error', onError);
  });
}

function createServer(options = {}) {
  const rootDir = options.rootDir || __dirname;
  const publicRoot = fs.realpathSync(path.join(rootDir, 'public'));
  const apiRoot = fs.realpathSync(path.join(rootDir, 'api'));
  // Options are a programmatic test seam; HTTP input never changes this allowlist.
  const routes = options.apiRoutes || API_ROUTES;
  const bodyLimit = options.bodyLimit || BODY_LIMIT;
  const bodyTimeout = options.bodyTimeout || REQUEST_TIMEOUT;
  return http.createServer({
    requestTimeout: REQUEST_TIMEOUT,
    headersTimeout: REQUEST_TIMEOUT,
    connectionsCheckingInterval: 1000
  }, async (req, res) => {
    try {
      const { pathname, query } = parseTarget(req.url);
      if (pathname === '/api' || pathname.startsWith('/api/')) {
        if (!Object.hasOwn(routes, pathname)) {
          return sendError(req, res, 404, 'API route not found');
        }
        const apiFile = await resolveFile(apiRoot, routes[pathname]);
        if (!apiFile) return sendError(req, res, 404, 'API route not found');
        req.rawBody = await readBody(req, bodyLimit, bodyTimeout);
        req.body = {};
        if (req.rawBody.length) {
          try {
            req.body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(req.rawBody));
          } catch (_) {
            throw requestError(400, 'Invalid JSON body');
          }
        }
        req.query = query;
        res.status = code => { res.statusCode = code; return res; };
        res.json = data => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };
        res.send = text => res.end(text);
        delete require.cache[require.resolve(apiFile)];
        const handler = require(apiFile);
        await handler(req, res);
        return;
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        return sendError(req, res, 405, 'Method not allowed');
      }
      const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
      // Preserve the existing extensionless page aliases.
      let file = !path.extname(relativePath) ? await resolveFile(publicRoot, relativePath + '.html') : null;
      if (!file) file = await resolveFile(publicRoot, relativePath);
      if (!file) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        return res.end('<h1>404 - Página no encontrada</h1><p><a href="/index.html">Volver al Inicio</a> | <a href="/admin.html">Ir al Panel Admin</a></p>');
      }
      res.setHeader('Content-Type', MIME_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
      if (req.method === 'HEAD') return res.end();
      const stream = fs.createReadStream(file);
      stream.on('error', () => sendError(req, res, 500, 'Internal Server Error'));
      res.once('close', () => stream.destroy());
      stream.pipe(res);
    } catch (error) {
      const expected = error instanceof RequestError;
      sendError(req, res, expected ? error.statusCode : 500, expected ? error.message : 'Internal Server Error');
    }
  });
}

function startServer(options = {}) {
  const server = createServer(options);
  const port = options.port ?? process.env.PORT ?? 3000;
  const host = options.host || process.env.HOST || '127.0.0.1';
  server.listen(port, host, () => {
    console.log(`Servidor Metal Creativo: http://${host}:${server.address().port}/index.html`);
  });
  return server;
}

module.exports = { createServer, startServer, API_ROUTES };
if (require.main === module) startServer();
