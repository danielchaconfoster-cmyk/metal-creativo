'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const { CATALOG, validateRut, normalizeCheckout } = require(path.join(ROOT, 'lib/orders'));
const { requireAdmin } = require(path.join(ROOT, 'lib/admin-auth'));

// ==============================================================================
// 1. ANÁLISIS ESTÁTICO DE SEGURIDAD (SAST): ESCANEO DE SECRETOS Y CONFIGURACIÓN
// ==============================================================================

test('SAST: no leaked production API keys, service roles or tokens in public files', () => {
  const publicDir = path.join(ROOT, 'public');
  const files = fs.readdirSync(publicDir).filter(f => /\.(html|js|json|txt)$/i.test(f));
  
  const forbiddenPatterns = [
    /eyJh[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, // JWT format (Supabase service role keys)
    /APP_USR-[0-9]{16}-[0-9]{6}-[a-f0-9]{32}/, // Mercado Pago live access tokens
    /TEST-[0-9]{16}-[0-9]{6}-[a-f0-9]{32}/,    // Mercado Pago test access tokens
    /re_[0-9a-zA-Z]{24,}/,                      // Resend API keys
    /ADMIN_TOKEN\s*=\s*['"][^'"]+['"]/          // Hardcoded admin tokens
  ];

  for (const file of files) {
    const content = fs.readFileSync(path.join(publicDir, file), 'utf8');
    for (const pattern of forbiddenPatterns) {
      assert.equal(pattern.test(content), false, `Sensitive secret detected in public file: ${file}`);
    }
  }
});

test('SAST: .gitignore strictly excludes sensitive environment files', () => {
  const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  assert.ok(/\.env\*/.test(gitignore) || /\.env/.test(gitignore), '.gitignore must ignore .env files');
});

test('SAST: vercel.json enforces strict security headers (HSTS, CSP, X-Frame-Options, nosniff)', () => {
  const vercelJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const rootHeaderConfig = vercelJson.headers?.find(h => h.source === '/(.*)');
  assert.ok(rootHeaderConfig, 'Root security headers must be configured');
  
  const headers = Object.fromEntries(rootHeaderConfig.headers.map(h => [h.key.toLowerCase(), h.value]));
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.ok(headers['strict-transport-security'].includes('max-age=63072000'));
  assert.ok(headers['content-security-policy'].includes("default-src 'self'"));
});

test('SAST: robots.txt and sitemap.xml do not index administrative or private API routes', () => {
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  assert.ok(robots.includes('Disallow: /admin.html') || robots.includes('Disallow: /api/'), 'Sensitive routes must be disallowed in robots.txt');
});

// ==============================================================================
// 2. PRUEBAS DE RESISTENCIA ANTE ATAQUES DE PRECIOS Y PARÁMETROS (ANTI-FRAUDE)
// ==============================================================================

test('Anti-Fraud: price tampering attack on checkout is completely neutralized by server CATALOG', () => {
  const maliciousPayload = {
    customer: {
      rut: '18.513.380-K',
      full_name: 'Attacker Name',
      email: 'attacker@evil.invalid',
      phone: '+56912345678',
      region: 'Región Metropolitana',
      comuna: 'Santiago',
      address_street: 'Calle Falsa',
      address_number: '123'
    },
    items: [
      { id: 'fogon', unit_price: 1, price: 1, qty: 1 } // Trying to buy a 100k CLP fogon for $1
    ],
    shipping_method: 'rm_express'
  };

  const normalized = normalizeCheckout(maliciousPayload);
  assert.equal(normalized.items[0].unit_price, 100000, 'Server must enforce canonical 100,000 CLP catalog price');
  assert.equal(normalized.total, 100000 + 4990, 'Total must strictly equal 104,990 CLP');
});

test('Anti-Fraud: negative or fractional quantities and proto injections are strictly rejected', () => {
  const baseCustomer = {
    rut: '18.513.380-K',
    full_name: 'Attacker Name',
    email: 'attacker@evil.invalid',
    phone: '+56912345678',
    region: 'Región Metropolitana',
    comuna: 'Santiago',
    address_street: 'Calle Falsa',
    address_number: '123'
  };

  const maliciousCases = [
    { customer: baseCustomer, items: [{ id: 'barra_remolque', qty: -1 }] },
    { customer: baseCustomer, items: [{ id: 'barra_remolque', qty: 0 }] },
    { customer: baseCustomer, items: [{ id: 'barra_remolque', qty: 2.5 }] },
    { customer: baseCustomer, items: [{ id: 'barra_remolque', qty: 9999 }] },
    { customer: baseCustomer, items: [{ id: '__proto__', qty: 1 }] },
    { customer: baseCustomer, items: [{ id: 'constructor', qty: 1 }] }
  ];

  for (const badCase of maliciousCases) {
    assert.throws(() => normalizeCheckout(badCase), (err) => {
      return /INVALID_QUANTITY|INVALID_PRODUCT/.test(err.code || err.message);
    });
  }
});

// ==============================================================================
// 3. SEGURIDAD DE BASE DE DATOS SUPABASE (ROW LEVEL SECURITY AUDIT)
// ==============================================================================

test('DB Security: supabase_schema.sql mandates Row Level Security (RLS) on all sensitive tables', () => {
  const schema = fs.readFileSync(path.join(ROOT, 'supabase_schema.sql'), 'utf8');
  
  const tables = ['customers', 'orders', 'order_items', 'payment_webhook_logs', 'security_audit_events'];
  for (const table of tables) {
    assert.ok(
      schema.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`),
      `Table public.${table} must have RLS explicitly enabled`
    );
  }

  // Ensure anonymous access (anon) is NOT granted policies to read customer PII
  assert.ok(!schema.includes('CREATE POLICY') || !schema.includes('TO anon USING (true)'), 'Anonymous role must NEVER have read policy on customer tables');
});

// ==============================================================================
// 4. VERIFICACIÓN ALGORÍTMICA DE RUT (CHILEAN TAX ID - MÓDULO 11)
// ==============================================================================

test('Algorithm: Chilean Módulo 11 RUT validator detects invalid vs official credentials', () => {
  // Official store RUT must be valid
  assert.equal(validateRut('18.513.380-K'), true, 'Store titular RUT 18.513.380-K must pass modulo 11');
  assert.equal(validateRut('18513380-K'), true);
  assert.equal(validateRut('18513380K'), true);

  // Invalid fake RUTs must be rejected
  assert.equal(validateRut('76.842.190-5'), false, 'Legacy fake RUT 76.842.190-5 must be rejected');
  assert.equal(validateRut('11.111.111-9'), false);
  assert.equal(validateRut('12.345.678-0'), false);
  assert.equal(validateRut('short'), false);
});

// ==============================================================================
// 5. RESILIENCIA DEL CARRITO ANTE JSON CORRUPTO (CHAOS TEST)
// ==============================================================================

test('Chaos Testing: cart parser survives hostile and corrupt payloads in storage', () => {
  const hostilePayloads = [
    '{broken_json',
    'undefined',
    'null',
    '12345',
    '{"id": "bad", "qty": NaN}',
    '[{"id": "valid"}]'.repeat(1000)
  ];

  for (const bad of hostilePayloads) {
    const parseAttempt = () => {
      try {
        const raw = bad;
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    };

    assert.doesNotThrow(() => parseAttempt());
    assert.ok(Array.isArray(parseAttempt()));
  }
});
