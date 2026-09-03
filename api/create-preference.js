// Vercel Serverless Function: api/create-preference.js
// Ciberseguridad: Calculo inmutable de precios en servidor y registro en Supabase

const { MercadoPagoConfig, Preference } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

// Catalogo de precios oficial en el servidor (Fuente de Verdad)
// NUNCA confiar en los precios que envia el navegador del usuario
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
  // Solo permitir metodo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const { customer, items, shipping_cost = 0, shipping_method = 'starken' } = req.body;

    // Validacion de datos minimos del cliente
    if (!customer || !customer.rut || !customer.email || !customer.phone || !items || !items.length) {
      return res.status(400).json({ error: 'Datos incompletos para procesar la orden' });
    }

    // 1. RECALCULAR TOTAL EN EL SERVIDOR (Previene manipulacion de precios por atacantes)
    let validatedItems = [];
    let serverTotal = 0;

    for (const item of items) {
      const product = OFFICIAL_PRICES[item.id];
      if (!product) {
        return res.status(400).json({ error: `Producto invalido: ${item.id}` });
      }
      const qty = parseInt(item.qty, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Cantidad invalida' });
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

    // 2. CONECTAR CON SUPABASE (Con Service Role Key segura en variables de entorno)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let orderId = null;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Crear o actualizar cliente
      const { data: customerData, error: custError } = await supabase
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

      if (custError) {
        console.error('Error al guardar cliente en Supabase:', custError);
      }

      // Crear Orden Inicial con estado 'pending'
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: customerData ? customerData.id : null,
          status: 'pending',
          total_amount: serverTotal,
          shipping_method: shipping_method,
          shipping_cost: shipping_cost,
          payment_method: 'mercadopago'
        }])
        .select()
        .single();

      if (!orderError && orderData) {
        orderId = orderData.id;

        // Guardar items de la orden
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

    // 3. GENERAR PREFERENCIA EN MERCADO PAGO
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpAccessToken) {
      return res.status(500).json({ error: 'Configuracion de Mercado Pago pendiente en Vercel' });
    }

    const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
    const preference = new Preference(client);

    // Agregar costo de envio a Mercado Pago si aplica
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
    const protocol = host.includes('localhost') ? 'http' : 'https';

    const prefResult = await preference.create({
      body: {
        items: validatedItems,
        payer: {
          name: customer.full_name,
          email: customer.email,
          phone: { number: customer.phone },
          identification: { type: 'RUT', number: customer.rut }
        },
        external_reference: orderId || `MC-${Date.now()}`,
        back_urls: {
          success: `${protocol}://${host}/checkout-success.html?status=approved`,
          failure: `${protocol}://${host}/checkout.html?status=rejected`,
          pending: `${protocol}://${host}/checkout-success.html?status=pending`
        },
        auto_return: 'approved',
        notification_url: `${protocol}://${host}/api/webhook`,
        statement_descriptor: 'METAL CREATIVO'
      }
    });

    // Guardar preference_id en Supabase
    if (orderId && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('orders')
        .update({ preference_id: prefResult.id })
        .eq('id', orderId);
    }

    return res.status(200).json({
      success: true,
      preference_id: prefResult.id,
      init_point: prefResult.init_point, // Redireccion para produccion
      sandbox_init_point: prefResult.sandbox_init_point // Redireccion para pruebas
    });

  } catch (err) {
    console.error('Error al crear preferencia de Mercado Pago:', err);
    return res.status(500).json({ error: 'Error interno de pasarela de pago' });
  }
};
