import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PORT = 5173
const REQUEST_TIMEOUT = 10000

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

class RequestError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

function requestError(statusCode, message) {
  return new RequestError(statusCode, message)
}

function parsePath(target) {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || /[\\#\x00-\x20\x7f]/.test(target)) {
    throw requestError(400, 'Invalid request path')
  }
  let segments
  try {
    segments = target.split('?')[0].slice(1).split('/').map(segment => decodeURIComponent(segment))
  } catch (_) {
    throw requestError(400, 'Invalid request path')
  }
  for (const segment of segments) {
    if (segment === '.' || segment === '..' || /[\\/:\x00-\x1f\x7f]/.test(segment) || /[. ]$/.test(segment)) {
      throw requestError(400, 'Invalid request path')
    }
  }
  return segments.join('/') || 'index.html'
}

function isInside(root, file) {
  const relative = path.relative(root, file)
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)
}

async function resolveFile(root, relativePath) {
  const candidate = path.resolve(root, relativePath)
  if (!isInside(root, candidate)) throw requestError(403, 'Forbidden path')
  try {
    const file = await fs.promises.realpath(candidate)
    if (!isInside(root, file)) throw requestError(403, 'Forbidden path')
    return (await fs.promises.stat(file)).isFile() ? file : null
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null
    throw error
  }
}

export function createServer(options = {}) {
  const distRoot = fs.realpathSync(options.distRoot || path.join(__dirname, 'dist'))
  return http.createServer({
    requestTimeout: REQUEST_TIMEOUT,
    headersTimeout: REQUEST_TIMEOUT,
    connectionsCheckingInterval: 1000,
  }, async (req, res) => {
    try {
      const reqPath = parsePath(req.url)
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD')
        throw requestError(405, 'Method not allowed')
      }
      let file = await resolveFile(distRoot, reqPath)
      // The SPA fallback is subject to the same canonical root check.
      if (!file) file = await resolveFile(distRoot, 'index.html')
      if (!file) throw requestError(404, 'Not found')
      res.setHeader('Content-Type', MIME_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 'no-cache')
      if (req.method === 'HEAD') return res.end()
      const stream = fs.createReadStream(file)
      stream.on('error', () => {
        if (res.headersSent) return res.destroy()
        res.writeHead(500)
        res.end('Server Error')
      })
      res.once('close', () => stream.destroy())
      stream.pipe(res)
    } catch (error) {
      const expected = error instanceof RequestError
      res.writeHead(expected ? error.statusCode : 500, { 'Content-Type': 'text/plain; charset=utf-8', 'Connection': 'close' })
      res.end(expected ? error.message : 'Server Error')
      req.resume()
      res.once('finish', () => req.socket.end())
    }
  })
}

export function startServer(options = {}) {
  const server = createServer(options)
  const port = options.port ?? PORT
  const host = options.host || process.env.HOST || '127.0.0.1'
  let tryingAlternative = false
  server.listen(port, host, () => {
    console.log(`SERVER RUNNING AT http://${host}:${server.address().port}/`)
  })
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && port !== 3000 && !tryingAlternative) {
      tryingAlternative = true
      console.log(`Port ${port} in use, trying 3000...`)
      server.listen(3000, host, () => console.log(`SERVER RUNNING AT http://${host}:3000/`))
    } else {
      console.error('Server error:', error.code || 'unknown')
    }
  })
  return server
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) startServer()
