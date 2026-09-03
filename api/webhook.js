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

    // 2. CONECTAR CON SUPABASE PARA AUDITORIA
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let supabase = null;

    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('payment_webhook_logs').insert([{
        gateway: 'mercadopago',
        event_type: action || 'payment.update',
        payment_id: String(paymentId || ''),
        raw_payload: body || query,
        signature_verified: signatureVerified,
        ip_address: headers['x-forwarded-for'] || req.socket.remoteAddress
      }]);
    }

    // 3. CONSULTAR DIRECTAMENTE A MERCADO PAGO (Fuente de Verdad)
    // No confiar en el cuerpo del webhook; consultar el estado oficial a la API con token secreto
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (mpAccessToken && paymentId) {
      const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
      const payment = new Payment(client);

      const paymentData = await payment.get({ id: paymentId });

      if (paymentData && paymentData.status === 'approved' && supabase) {
        const orderId = paymentData.external_reference;

        // Actualizar estado de orden a 'paid' de forma idempotente
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_id: String(paymentId),
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (!updateError) {
          console.log(`Orden ${orderId} marcada como PAGADA con exito.`);
        }
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Error procesando webhook de Mercado Pago:', err);
    return res.status(200).send('OK'); // Responder siempre 200 a MP
  }
};
