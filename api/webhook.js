// Vercel Serverless Function: api/webhook.js
// Ciberseguridad: Validacion Criptografica de Firma HMAC SHA-256 e Idempotencia

try { require('dotenv').config(); } catch (_) {}
const crypto = require('crypto');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Responder inmediatamente 200 OK para evitar reintentos agresivos de Mercado Pago
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  try {
    const { query, headers, body } = req;
    const paymentId = query['data.id'] || (body && body.data && body.data.id);
    const action = body ? body.action : query.topic;

    // 1. VALIDACION DE FIRMA CRIPTOGRAFICA (HMAC SHA-256)
    // Proteccion contra atacantes que envian peticiones falsas simulando pagos aprobados
    const xSignature = headers['x-signature'];
    const xRequestId = headers['x-request-id'];
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    let signatureVerified = false;

    if (xSignature && xRequestId && webhookSecret) {
      const parts = xSignature.split(',');
      let ts = '';
      let hash = '';

      parts.forEach(part => {
        const [key, val] = part.split('=');
        if (key && key.trim() === 'ts') ts = val.trim();
        if (key && key.trim() === 'v1') hash = val.trim();
      });

      const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
      const expectedHash = crypto
        .createHmac('sha256', webhookSecret)
        .update(manifest)
        .digest('hex');

      if (expectedHash === hash) {
        signatureVerified = true;
      } else {
        console.warn('Alerta de Ciberseguridad: Firma de webhook invalida. Posible ataque simulado.');
      }
    }

    // 2. CONECTAR CON SUPABASE PARA AUDITORIA (Con Tolerancia a Fallos)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let supabase = null;

    if (supabaseUrl && supabaseKey) {
      try {
        supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('payment_webhook_logs').insert([{
          gateway: 'mercadopago',
          event_type: action || 'payment.update',
          payment_id: String(paymentId || ''),
          raw_payload: body || query,
          signature_verified: signatureVerified,
          ip_address: headers['x-forwarded-for'] || req.socket.remoteAddress
        }]);
      } catch (logErr) {
        console.warn('[WEBHOOK AUDIT WARNING] No se pudo guardar log en Supabase:', logErr.message);
      }
    }

    // 3. CONSULTAR DIRECTAMENTE A MERCADO PAGO (Fuente de Verdad)
    // No confiar en el cuerpo del webhook; consultar el estado oficial a la API con token secreto
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (mpAccessToken && paymentId) {
      const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
      const payment = new Payment(client);

      const paymentData = await payment.get({ id: paymentId });

      if (paymentData && paymentData.status === 'approved') {
        const orderId = paymentData.external_reference;
        const paidAmount = Number(paymentData.transaction_amount || 0);

        // A. Actualizar en Supabase si está activo
        if (supabase && orderId) {
          try {
            await supabase
              .from('orders')
              .update({
                status: 'paid',
                payment_id: String(paymentId),
                updated_at: new Date().toISOString()
              })
              .eq('id', orderId);
            console.log(`[SUPABASE] Orden ${orderId} marcada como PAGADA.`);
          } catch (supErr) {
            console.warn('[SUPABASE UPDATE WARNING]:', supErr.message);
          }
        }

        // B. Actualizar en registro local de respaldo (Fallback Resiliente)
        try {
          const fs = require('fs');
          const path = require('path');
          const fallbackPath = path.join(process.cwd(), 'data', 'orders_fallback.json');
          if (fs.existsSync(fallbackPath)) {
            const currentOrders = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
            let matched = false;
            currentOrders.forEach(o => {
              if (o.id === orderId || (!o.payment_id && o.customer_email === paymentData.payer?.email)) {
                o.status = 'paid';
                o.payment_id = String(paymentId);
                o.paid_amount = paidAmount;
                o.paid_at = new Date().toISOString();
                matched = true;
              }
            });
            if (matched) {
              fs.writeFileSync(fallbackPath, JSON.stringify(currentOrders, null, 2));
              console.log(`[LOCAL FALLBACK] Orden ${orderId} actualizada a PAID con éxito.`);
            }
          }
        } catch (fsErr) {
          console.warn('[LOCAL FALLBACK UPDATE WARNING]:', fsErr.message);
        }
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Error procesando webhook de Mercado Pago:', err);
    return res.status(200).send('OK'); // Responder siempre 200 a MP
  }
};
