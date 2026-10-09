// Vercel Serverless Function: api/create-preference.js
// Ciberseguridad FinTech: Anti-Carding Rate Limiting, Forense de IP/User-Agent y Precios Inmutables

try { require('dotenv').config(); } catch (_) {}
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

// 1. SISTEMA DE RATE LIMITING EN MEMORIA (Proteccion Anti-Carding Bot)
// Bloquea robots que prueben cientos de tarjetas robadas por minuto
const ipRequestHistory = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const MAX_REQUESTS_PER_WINDOW = 6; // Max 6 intentos por IP

function checkRateLimit(ip) {
  const now = Date.now();
  const history = ipRequestHistory.get(ip) || [];
  // Filtrar intentos fuera de la ventana
  const recentHistory = history.filter(time => (now - time) < RATE_LIMIT_WINDOW_MS);

  if (recentHistory.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Bloqueado
  }

  recentHistory.push(now);
  ipRequestHistory.set(ip, recentHistory);
  return true;
}

// 2. VALIDACION DE IDENTIFICACION (Modulo 11 para RUT chileno o Pasaporte)
function validateRut(rutCompleto) {
  if (!rutCompleto || typeof rutCompleto !== 'string' || rutCompleto.trim().length < 6) return false;
  const valor = rutCompleto.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();

  // Caso 1: RUT Chileno Estándar (Cuerpo numérico + dígito verificador 0-9 o K)
  if (/^[0-9]{7,9}[0-9K]$/.test(valor)) {
    const cuerpo = valor.slice(0, -1);
    const dv = valor.slice(-1);
    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += multiplo * parseInt(cuerpo.charAt(i), 10);
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    const dvEsperado = 11 - (suma % 11);
    const dvFinal = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    return dv === dvFinal;
  }

  // Caso 2: Pasaporte o documento de identidad extranjero válido (6 a 15 caracteres alfanuméricos)
  return /^[A-Z0-9]{6,15}$/.test(valor);
}

// 3. LISTA DE PRECIOS OFICIALES INMUTABLES
const OFFICIAL_PRICES = {
  'barra_remolque': {
    name: 'Barra de Remolque Desarmable 1.8m (Ley MTT 55/2025)',
    unit_price: 65000,
    currency_id: 'CLP'
  },
  'lanza_remolque': {
    name: 'Barra de Remolque Desarmable 1.8m (Ley MTT 55/2025)',
    unit_price: 65000,
    currency_id: 'CLP'
  },
  'fogon': {
    name: 'Fogon de Mesa a Bioetanol Ecologico',
    unit_price: 149900,
    currency_id: 'CLP'
  },
  'fogon_bioetanol': {
    name: 'Fogon de Mesa a Bioetanol Ecologico',
    unit_price: 149900,
    currency_id: 'CLP'
  }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // CHEQUEO ANTI-CARDING RATE LIMIT
  if (!checkRateLimit(clientIp)) {
    console.warn(`[CIBERSEGURIDAD] Bloqueo por exceso de intentos desde IP: ${clientIp}`);
    return res.status(429).json({
      error: 'Demasiadas solicitudes desde este dispositivo. Por favor espera unos minutos o contacta a soporte.'
    });
  }

  try {
    const { customer, items, shipping_cost, shipping_method = 'starken' } = req.body;

    if (!customer || !customer.rut || !customer.email || !customer.phone || !items || !items.length) {
      return res.status(400).json({ error: 'Datos incompletos para procesar la orden' });
    }

    if (!validateRut(customer.rut)) {
      return res.status(400).json({ error: 'RUT chileno invalido. Por favor verifica el digito verificador.' });
    }

    // Calculo inmutable en servidor (Zero Trust)
    let validatedItems = [];
    let serverTotal = 0;

    for (const item of items) {
      const product = OFFICIAL_PRICES[item.id];
      if (!product) {
        return res.status(400).json({ error: `Producto invalido: ${item.id}` });
      }
      const rawQty = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
      const qty = parseInt(rawQty, 10);
      if (isNaN(qty) || qty <= 0 || qty > 10) {
        return res.status(400).json({ error: 'Cantidad no permitida (debe ser entre 1 y 10)' });
      }

      const itemTotal = product.unit_price * qty;
      serverTotal += itemTotal;

      validatedItems.push({
        id: item.id,
        title: product.name,
        quantity: qty,
        unit_price: product.unit_price,
        currency_id: 'CLP'
      });
    }

    // Validacion y calculo de despacho estrictamente en el servidor (Anti-Tampering)
    let validatedShippingCost = 0;
    const cleanShippingMethod = String(shipping_method || 'starken').toLowerCase().trim();
    if (cleanShippingMethod === 'rm_express') {
      validatedShippingCost = 4990;
    } else if (cleanShippingMethod === 'starken' || cleanShippingMethod === 'starken_por_pagar') {
      validatedShippingCost = 0;
    } else {
      return res.status(400).json({ error: 'Metodo de despacho no valido' });
    }

    serverTotal += validatedShippingCost;

    // Registro seguro en Supabase con IP y User-Agent (Prueba de Entrega Anti-Contracargo)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let orderId = null;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: customerData } = await supabase
          .from('customers')
          .insert([{
            rut: customer.rut,
            full_name: customer.full_name,
            email: customer.email,
            phone: customer.phone,
            region: customer.region,
            comuna: customer.comuna,
            address_street: customer.address_street,
            address_number: customer.address_number,
            address_extra: customer.address_extra || ''
          }])
          .select()
          .single();

        const { data: orderData } = await supabase
          .from('orders')
          .insert([{
            customer_id: customerData ? customerData.id : null,
            status: 'pending',
            total_amount: serverTotal,
            shipping_method: cleanShippingMethod,
            shipping_cost: validatedShippingCost,
            payment_method: 'mercadopago',
            ip_address: clientIp,
            user_agent: userAgent
          }])
          .select()
          .single();

        if (orderData) {
          orderId = orderData.id;
          const orderItemsRows = validatedItems.map(i => ({
            order_id: orderId,
            product_id: i.id,
            product_name: i.title,
            unit_price: i.unit_price,
            quantity: i.quantity
          }));
          await supabase.from('order_items').insert(orderItemsRows);
        }
      } catch (dbErr) {
        console.warn('[SUPABASE WARNING] Falla al guardar en base de datos externa:', dbErr.message);
      }
    }

    // Respaldo de contingencia local si Supabase esta pausado o no disponible
    if (!orderId) {
      orderId = `MC-${Date.now()}`;
      try {
        const fs = require('fs');
        const path = require('path');
        const fallbackPath = path.join(process.cwd(), 'data', 'orders_fallback.json');
        let currentOrders = [];
        if (fs.existsSync(fallbackPath)) {
          currentOrders = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        }
        currentOrders.unshift({
          id: orderId,
          customer_name: customer.full_name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          customer_rut: customer.rut,
          address: `${customer.address_street} ${customer.address_number}, ${customer.comuna}, ${customer.region}`,
          status: 'pending',
          total_amount: serverTotal,
          shipping_method: cleanShippingMethod,
          shipping_cost: validatedShippingCost,
          payment_method: 'mercadopago',
          ip_address: clientIp,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        });
        fs.writeFileSync(fallbackPath, JSON.stringify(currentOrders.slice(0, 50), null, 2));
      } catch (_) {}
    }

    // Crear Preferencia en Mercado Pago
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpAccessToken) {
      return res.status(500).json({ error: 'Configuracion de Mercado Pago pendiente en Vercel' });
    }

    const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const preference = new Preference(client);

    if (validatedShippingCost > 0) {
      validatedItems.push({
        id: 'shipping_fee',
        title: `Despacho (${cleanShippingMethod === 'rm_express' ? 'EXPRESS SANTIAGO' : cleanShippingMethod.toUpperCase()})`,
        quantity: 1,
        unit_price: validatedShippingCost,
        currency_id: 'CLP'
      });
    }

    const host = req.headers.host || 'metalcreativo.cl';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const baseUrl = isLocal ? 'https://metalcreativo.cl' : `https://${host}`;

    const cleanPhone = String(customer.phone || '').replace(/\D/g, '');
    const cleanRut = String(customer.rut || '').replace(/[^0-9kK]/g, '').toUpperCase();

    const isSandbox = (mpAccessToken || '').startsWith('TEST-');
    const payerEmail = isSandbox ? 'comprador_test_chile@testuser.com' : customer.email;

    const preferenceBody = {
      items: validatedItems,
      payer: {
        name: customer.full_name,
        email: payerEmail,
        phone: { number: cleanPhone },
        identification: { type: 'RUT', number: cleanRut }
      },
      external_reference: orderId ? String(orderId) : `MC-${Date.now()}`,
      back_urls: {
        success: `${baseUrl}/checkout-success.html?status=approved`,
        failure: `${baseUrl}/checkout.html?status=rejected`,
        pending: `${baseUrl}/checkout-success.html?status=pending`
      },
      auto_return: 'approved',
      statement_descriptor: 'METAL CREATIVO'
    };

    // Mercado Pago exige HTTPS y dominio publico para webhooks
    if (!isLocal) {
      preferenceBody.notification_url = `${baseUrl}/api/webhook`;
    }

    const prefResult = await preference.create({ body: preferenceBody });

    if (orderId && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('orders').update({ preference_id: prefResult.id }).eq('id', orderId);
    }

    const redirectUrl = isSandbox ? prefResult.sandbox_init_point : prefResult.init_point;

    return res.status(200).json({
      success: true,
      preference_id: prefResult.id,
      init_point: redirectUrl,
      sandbox_init_point: prefResult.sandbox_init_point,
      is_sandbox: isSandbox
    });

  } catch (err) {
    console.error('Error interno en create-preference:', err);
    return res.status(500).json({ error: err.message || 'Error interno de pasarela' });
  }
};
