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

// 2. LISTA DE PRECIOS OFICIALES INMUTABLES
const OFFICIAL_PRICES = {
  'barra_remolque': {
    name: 'Barra de Remolque Desarmable 1.8m (Ley MTT 55/2025)',
    unit_price: 65000,
    currency_id: 'CLP'
  },
  'fogon': {
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
    const { customer, items, shipping_cost = 0, shipping_method = 'starken' } = req.body;

    if (!customer || !customer.rut || !customer.email || !customer.phone || !items || !items.length) {
      return res.status(400).json({ error: 'Datos incompletos para procesar la orden' });
    }

    // Calculo inmutable en servidor
    let validatedItems = [];
    let serverTotal = 0;

    for (const item of items) {
      const product = OFFICIAL_PRICES[item.id];
      if (!product) {
        return res.status(400).json({ error: `Producto invalido: ${item.id}` });
      }
      const qty = parseInt(item.qty, 10);
      if (isNaN(qty) || qty <= 0 || qty > 10) {
        return res.status(400).json({ error: 'Cantidad no permitida' });
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

    serverTotal += Number(shipping_cost);

    // Registro seguro en Supabase con IP y User-Agent (Prueba de Entrega Anti-Contracargo)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let orderId = null;

    if (supabaseUrl && supabaseKey) {
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
          shipping_method: shipping_method,
          shipping_cost: shipping_cost,
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
    }

    // Crear Preferencia en Mercado Pago
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpAccessToken) {
      return res.status(500).json({ error: 'Configuracion de Mercado Pago pendiente en Vercel' });
    }

    const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const preference = new Preference(client);

    if (shipping_cost > 0) {
      validatedItems.push({
        id: 'shipping_fee',
        title: `Despacho (${shipping_method.toUpperCase()})`,
        quantity: 1,
        unit_price: Number(shipping_cost),
        currency_id: 'CLP'
      });
    }

    const host = req.headers.host || 'metalcreativo.cl';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const baseUrl = isLocal ? 'https://metalcreativo.cl' : `https://${host}`;

    const cleanPhone = String(customer.phone || '').replace(/\D/g, '');
    const cleanRut = String(customer.rut || '').replace(/[^0-9kK]/g, '').toUpperCase();

    const preferenceBody = {
      items: validatedItems,
      payer: {
        name: customer.full_name,
        email: customer.email,
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

    return res.status(200).json({
      success: true,
      preference_id: prefResult.id,
      init_point: prefResult.init_point,
      sandbox_init_point: prefResult.sandbox_init_point
    });

  } catch (err) {
    console.error('Error interno en create-preference:', err);
    return res.status(500).json({ error: err.message || 'Error interno de pasarela' });
  }
};
