'use strict';
// Build an isolated, disposable copy. Never import .env or production deployment metadata.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const destination = path.join(root, '.vercel', 'sandbox-site');
if (fs.existsSync(destination)) throw new Error('Sandbox already exists; preserve its private configuration.');
fs.mkdirSync(destination, { recursive: true });
for (const folder of ['public', 'api', 'lib']) fs.cpSync(path.join(root, folder), path.join(destination, folder), { recursive: true, dereference: false });
for (const file of ['package.json', 'package-lock.json', 'dev-server.js']) fs.copyFileSync(path.join(root, file), path.join(destination, file));
const guard = `'use strict';
const { HttpError } = require('./http');
function guardDatabase() {
  let url;
  try { url = new URL(process.env.SUPABASE_URL); } catch (_) { throw new HttpError(503, 'SANDBOX_DATABASE_REQUIRED'); }
  const expected = process.env.SANDBOX_DATABASE_HOST;
  if (!expected || url.hostname !== expected || url.hostname === 'hixuaqdkiyirntgvzxff.supabase.co') throw new HttpError(503, 'SANDBOX_DATABASE_REQUIRED');
}
function guardSite() {
  let url;
  try { url = new URL(process.env.SITE_URL); } catch (_) { throw new HttpError(503, 'SANDBOX_SITE_REQUIRED'); }
  if (url.protocol !== 'https:' || /(^|\\.)metalcreativo\\.cl$/i.test(url.hostname) || !process.env.SANDBOX_SITE_HOST || url.hostname !== process.env.SANDBOX_SITE_HOST) throw new HttpError(503, 'SANDBOX_SITE_REQUIRED');
  if (process.env.MERCADOPAGO_MODE !== 'sandbox') throw new HttpError(503, 'SANDBOX_MODE_REQUIRED');
}
module.exports = { guardDatabase, guardSite };
`;
fs.writeFileSync(path.join(destination, 'lib/sandbox-guard.js'), guard);
function replaceOnce(file, oldText, newText) {
  const name = path.join(destination, file), text = fs.readFileSync(name, 'utf8');
  if (text.split(oldText).length !== 2) throw new Error('Unexpected source: ' + file);
  fs.writeFileSync(name, text.replace(oldText, newText));
}
replaceOnce('lib/database.js', 'function getDatabase() {', "function getDatabase() {\n  require('./sandbox-guard').guardDatabase();");
replaceOnce('api/create-preference.js', '    checkOrigin(req);', "    require('../lib/sandbox-guard').guardSite();\n    checkOrigin(req);");
replaceOnce('api/create-preference.js', "  const test = data.tags.includes('test_user');", "  const test = data.tags.includes('test_user');\n  if (!test) throw new HttpError(503, 'SANDBOX_TEST_ACCOUNT_REQUIRED');");
replaceOnce('api/webhook.js', '    const id = verify(req);', "    require('../lib/sandbox-guard').guardSite();\n    const id = verify(req);");
// Test traffic must not contact the real WhatsApp/Meta integrations.
for (const file of ['whatsapp-webhook.js', 'admin-whatsapp.js']) fs.writeFileSync(path.join(destination, 'api', file), "module.exports = (req,res) => { res.statusCode=503; res.end('Disabled in sandbox'); };\n");
const banner = '<aside style="position:sticky;top:0;z-index:2147483647;background:#fbbf24;color:#111827;padding:12px;text-align:center;font:700 16px system-ui">ENTORNO DE PRUEBAS · No realiza ventas reales</aside>';
for (const file of fs.readdirSync(path.join(destination, 'public')).filter(f => f.endsWith('.html'))) {
  const name = path.join(destination, 'public', file);
  let html = fs.readFileSync(name, 'utf8');
  html = html.replace(/<head([^>]*)>/i, '<head$1><meta name="robots" content="noindex,nofollow,noarchive">')
    .replace(/<body([^>]*)>/i, '<body$1>' + banner)
    .replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, '')
    .replace(/https:\/\/(?:www\.)?metalcreativo\.cl(?=\/)/g, '')
    .replace(/https:\/\/wa\.me\/\d+/g, '/pruebas-info');
  fs.writeFileSync(name, html);
}
fs.writeFileSync(path.join(destination, 'public/pruebas-info.html'), '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Pruebas</title><body>' + banner + '<p>El contacto por WhatsApp está desactivado en esta copia.</p><a href="/">Volver a la copia</a></body></html>');
fs.writeFileSync(path.join(destination, 'public/robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.rmSync(path.join(destination, 'public/sitemap.xml'), { force: true });
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
config.headers[0].headers.push({ key:'X-Robots-Tag', value:'noindex, nofollow, noarchive' });
fs.writeFileSync(path.join(destination, 'vercel.json'), JSON.stringify(config, null, 2));
fs.writeFileSync(path.join(destination, '.vercelignore'), '.env*\nnode_modules\nSANDBOX.md\nsandbox-manifest.json\n');
fs.writeFileSync(path.join(destination, '.env.sandbox.local'), [
  '# Private sandbox only. Never paste production credentials here.',
  'MERCADOPAGO_MODE=sandbox', 'MERCADOPAGO_ACCESS_TOKEN=', 'MERCADOPAGO_PUBLIC_KEY=', 'MERCADOPAGO_WEBHOOK_SECRET=',
  'SUPABASE_URL=', 'SUPABASE_SERVICE_ROLE_KEY=', 'SANDBOX_DATABASE_HOST=', 'SITE_URL=', 'SANDBOX_SITE_HOST=',
  'NODEJS_HELPERS=0', 'ADMIN_TOKEN=' + crypto.randomBytes(32).toString('hex'), 'ORDER_ACCESS_SECRET=' + crypto.randomBytes(32).toString('hex'), ''
].join('\n'));
fs.writeFileSync(path.join(destination, 'start-local.cjs'), `const fs = require('node:fs');
for (const key of Object.keys(process.env)) if (/^(MERCADOPAGO_|SUPABASE_|META_|WHATSAPP_|ADMIN_TOKEN$|ORDER_ACCESS_SECRET$|SITE_URL$|PUBLIC_BASE_URL$|SANDBOX_|VERCEL)/.test(key)) delete process.env[key];
for (const line of fs.readFileSync(__dirname+'/.env.sandbox.local','utf8').split(/\\r?\\n/)) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line); if(m) process.env[m[1]]=m[2];
}
require('./dev-server').startServer({host:'127.0.0.1',port:3101});
`);
fs.writeFileSync(path.join(destination, 'SANDBOX.md'), '# Metal Creativo: copia de pruebas\n\nIniciar: `node start-local.cjs`. URL local: http://127.0.0.1:3101\n\nEsta copia no incluye claves de producción, pedidos ni datos de clientes. Pagos y persistencia quedan bloqueados hasta configurar una base separada y credenciales de prueba. Mercado Pago necesita una URL HTTPS pública para enviar webhooks. No publicar en el proyecto de producción.\n');
fs.writeFileSync(path.join(destination, 'sandbox-manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), source: root, copied: ['public','api','lib','package.json','package-lock.json','dev-server.js'], includesProductionSecrets:false, includesCustomerData:false, paymentReady:false }, null, 2));
console.log(JSON.stringify({ destination, localUrl:'http://127.0.0.1:3101', paymentReady:false }));
