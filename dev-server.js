// Servidor Local de Desarrollo y Producción: dev-server.js
// Permite correr la web de Metal Creativo (public/) y todas las Serverless Functions (/api/*) en localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

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
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=UTF-8'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. MANEJO DE RUTAS API SERVERLESS (/api/*)
  if (pathname.startsWith('/api/')) {
    const apiName = pathname.replace('/api/', '').split('?')[0];
    const apiFilePath = path.join(__dirname, 'api', `${apiName}.js`);

    if (fs.existsSync(apiFilePath)) {
      try {
        delete require.cache[require.resolve(apiFilePath)]; // Hot reload
        const handler = require(apiFilePath);

        // Parse body para peticiones POST/PUT
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          let parsedBody = {};
          if (body) {
            try { parsedBody = JSON.parse(body); } catch (_) { parsedBody = body; }
          }
          req.body = parsedBody;
          req.query = parsedUrl.query;

          // Adaptador Express/Vercel básico
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };
          res.send = (text) => {
            res.end(text);
          };

          await handler(req, res);
        });
        return;
      } catch (err) {
        console.error(`[API ERROR] ${pathname}:`, err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
      }
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: `Ruta API /api/${apiName} no encontrada` }));
    }
  }

  // 2. MANEJO DE ARCHIVOS ESTÁTICOS (public/)
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  let filePath = path.join(__dirname, 'public', safePath);

  // Si no tiene extensión, intentar agregar .html
  if (!path.extname(filePath) && fs.existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      return res.end('<h1>404 - Página no encontrada</h1><p><a href="/index.html">Volver al Inicio</a> | <a href="/admin.html">Ir al Panel Admin</a></p>');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SERVIDOR METAL CREATIVO ACTIVO EN PUERTO ${PORT}`);
  console.log(`👉 Tienda Oficial:  http://localhost:${PORT}/index.html`);
  console.log(`👉 Panel Admin:     http://localhost:${PORT}/admin.html`);
  console.log(`👉 Checkout:        http://localhost:${PORT}/checkout.html`);
  console.log(`👉 API Métricas:    http://localhost:${PORT}/api/admin-metrics`);
  console.log(`👉 API Fletes:      http://localhost:${PORT}/api/shipping-quote?commune=Temuco`);
  console.log(`👉 WhatsApp Bot:    http://localhost:${PORT}/api/whatsapp-webhook`);
  console.log(`======================================================\n`);
});
