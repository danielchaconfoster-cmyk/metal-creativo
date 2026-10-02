// Vercel Serverless Function: api/whatsapp-webhook.js
// Webhook Oficial para WhatsApp Cloud API (Modo Sandbox & Producción)
// Incluye Motor Conversacional con Ficha Técnica MTT 55/2025, Cotizador Starken y Pasarela Mercado Pago

try { require('dotenv').config(); } catch (_) {}
const fs = require('fs');
const path = require('path');
const { calculateShipping, COMMUNE_MAP } = require('./shipping-quote');

// 1. MOTOR DE RESPUESTAS INTELIGENTES BASADO EN EL PLAYBOOK OFICIAL
function generateBotReply(incomingText, customerName = 'Amigo/a') {
  const text = (incomingText || '').toLowerCase().trim();

  // A. DETECCIÓN DE COMUNA PARA COTIZAR FLETE STARKEN
  let detectedCommune = null;
  for (const commune of Object.keys(COMMUNE_MAP)) {
    if (text.includes(commune)) {
      detectedCommune = commune;
      break;
    }
  }

  // B. FLUJO: COMPRA DIRECTA / LINK DE PAGO
  if (text.includes('pagar') || text.includes('cuenta') || text.includes('transferir') || text.includes('comprar') || text.includes('link') || text.includes('datos')) {
    return {
      type: 'payment',
      intent: 'checkout',
      replyText: `¡Excelente decisión! 🛠️ Puedes pagar tu **Barra Rígida de Remolque ($65.000 CLP)** de forma 100% segura por:

💳 **1. Tarjetas de Crédito / Débito / Webpay (Mercado Pago)**:
https://metalcreativo.cl/checkout.html

🏦 **2. Transferencia Bancaria Directa**:
• Banco: Banco Estado / Cuenta Vista
• Titular: Metal Creativo SpA
• RUT: 77.892.410-K
• Correo: pagos@metalcreativo.cl
• Monto: $65.000 CLP

Apenas realices el pago, envíanos el comprobante por aquí con tu nombre y dirección para dejar tu barra embalada hoy mismo. 📦`
    };
  }

  // C. FLUJO: PREGUNTA POR ENVÍO O COMUNA
  if (detectedCommune || text.includes('envio') || text.includes('despacho') || text.includes('starken') || text.includes('chilexpress') || text.includes('cuanto sale el envio')) {
    const target = detectedCommune || 'tu comuna';
    const quote = calculateShipping(target, 'barra_remolque');
    
    return {
      type: 'shipping_quote',
      intent: 'shipping',
      commune: quote.region,
      replyText: `🚗 Para **${quote.region}**, el envío de la Barra Rígida (paquete de 65 cm, 6 kg) sale aproximadamente **$${quote.couriers.starken.cost.toLocaleString('es-CL')} CLP vía Starken** (${quote.estimatedDays}).

📦 Modalidad habitual: **Por Pagar** al retirar en tu sucursal Starken más cercana o en tu domicilio.

¿Para qué vehículo o camioneta la necesitas? Te confirmamos compatibilidad de inmediato.`
    };
  }

  // D. FLUJO: CONSULTA DE LEY MTT / DECRETO 55/2025
  if (text.includes('ley') || text.includes('mtt') || text.includes('decreto') || text.includes('multa') || text.includes('legal') || text.includes('carabinero')) {
    return {
      type: 'legal_mtt',
      intent: 'legal_compliance',
      replyText: `⚖️ **¡Cumple 100% con la Nueva Ley!** 

Desde agosto de 2026, el **Decreto Supremo N° 55/2025 del Ministerio de Transportes** prohíbe terminantemente remolcar con cuerdas, cadenas o piolas elásticas por riesgo grave de corte y choques por alcance al frenar.

Nuestra **Barra Rígida Metal Creativo**:
✅ Mantiene 1.80 metros fijos (Cero impactos entre autos al frenar).
✅ Acero estructural macizo de 3 mm con ojales forjados al rojo.
✅ Arrastre directo certificado hasta 3.500 kg.
✅ Se desarma en 3 tramos de 65 cm para entrar en la maleta o tolva.

💰 **Valor de Taller**: $65.000 CLP.
¿Te gustaría coordinar el despacho a tu comuna?`
    };
  }

  // E. FLUJO: ESTUFA / FOGÓN A BIOETANOL
  if (text.includes('fogon') || text.includes('fogón') || text.includes('estufa') || text.includes('bioetanol') || text.includes('terraza')) {
    return {
      type: 'fogon',
      intent: 'fogon_product',
      replyText: `🔥 **Fogón de Mesa a Bioetanol Ecológico ($149.900 CLP)**

• Funciona con bioetanol (combustión 100% limpia sin humo, cenizas ni olor).
• NO requiere cañón ni ductos de ventilación (Apto para terrazas y departamentos).
• Acero al carbono con pintura ignífuga (resiste 600°C) + cristales templados de 6 mm.
• Autonomía de 3.5 a 5.5 horas de llama viva por carga.

¿Te gustaría coordinar despacho a domicilio o ver fotos en detalle?`
    };
  }

  // F. SALUDO GENERAL / POR DEFECTO
  return {
    type: 'welcome',
    intent: 'general_inquiry',
    replyText: `¡Hola ${customerName}! 👋 Bienvenido a **Metal Creativo Chile** 🇨🇱.

Somos taller de fabricación especializada en:
1️⃣ **Barra Rígida de Remolque 1.8m ($65.000 CLP)**: Homologada bajo el Decreto Supremo 55/2025 MTT, resiste 3.500 kg y se desarma en 3 tramos.
2️⃣ **Fogón Ecológico a Bioetanol ($149.900 CLP)**: Fuego real para terrazas sin cañón ni humo.

¿Por cuál de los productos te gustaría cotizar o tienes alguna duda técnica?`
  };
}

module.exports = async (req, res) => {
  // 1. VERIFICACIÓN DEL WEBHOOK POR PARTE DE META (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'metal_creativo_webhook_secure_2026';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[WHATSAPP WEBHOOK] Verificación exitosa de Meta.');
      return res.status(200).send(challenge);
    } else {
      console.warn('[WHATSAPP WEBHOOK] Fallo de verificación de token.');
      return res.status(403).send('Token no coincide');
    }
  }

  // 2. RECEPCIÓN DE MENSAJES (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body || {};

      // MODO SIMULACIÓN PARA TESTEO DIRECTO EN EL PANEL ADMIN
      if (body.simulate === true) {
        const text = body.message || 'Hola, ¿tienen stock?';
        const name = body.name || 'Cliente Prueba';
        const phone = body.phone || '+56 9 8888 7777';

        const botReply = generateBotReply(text, name);

        // Guardar lead de simulación en historial
        const newLead = {
          id: 'LEAD-' + Math.floor(1000 + Math.random() * 9000),
          name: name,
          phone: phone,
          product: text.includes('fogon') ? 'fogon' : 'barra_remolque',
          commune: botReply.commune || 'Santiago',
          region: botReply.commune || 'Región Metropolitana',
          status: 'new',
          source: 'whatsapp_sandbox',
          estimated_shipping: 4990,
          last_message: text,
          created_at: new Date().toISOString()
        };

        try {
          const leadsFile = path.join(process.cwd(), 'data', 'leads_fallback.json');
          if (fs.existsSync(leadsFile)) {
            const currentLeads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
            currentLeads.unshift(newLead);
            fs.writeFileSync(leadsFile, JSON.stringify(currentLeads.slice(0, 30), null, 2));
          }
        } catch (_) {}

        return res.status(200).json({
          success: true,
          mode: 'simulated_sandbox',
          customerMessage: text,
          botResponse: botReply.replyText,
          detectedIntent: botReply.intent
        });
      }

      // 3. ESTRUCTURA OFICIAL META WHATSAPP CLOUD API
      const entry = body.entry && body.entry[0];
      const change = entry && entry.changes && entry.changes[0];
      const value = change && change.value;
      const message = value && value.messages && value.messages[0];

      if (!message) {
        // Puede ser un status update (read, sent, delivered)
        return res.status(200).send('EVENT_RECEIVED');
      }

      const fromNumber = message.from;
      const messageBody = message.text ? message.text.body : '';
      const contact = value.contacts && value.contacts[0];
      const customerName = (contact && contact.profile && contact.profile.name) || 'Cliente';

      console.log(`[WHATSAPP ENTRANTE] De: ${fromNumber} (${customerName}) - Texto: "${messageBody}"`);

      // Generar respuesta
      const botReply = generateBotReply(messageBody, customerName);

      // Si tenemos credenciales de Meta y es un mensaje de prueba Sandbox
      const metaToken = process.env.META_ACCESS_TOKEN;
      const testPhoneId = process.env.WHATSAPP_TEST_PHONE_NUMBER_ID;

      if (metaToken && testPhoneId && fromNumber) {
        try {
          await fetch(`https://graph.facebook.com/v21.0/${testPhoneId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${metaToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: fromNumber,
              type: 'text',
              text: { body: botReply.replyText }
            })
          });
        } catch (sendErr) {
          console.warn('[WHATSAPP API] No se pudo enviar mensaje saliente (Sandbox):', sendErr.message);
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error('[WHATSAPP WEBHOOK ERROR]:', err);
      return res.status(200).send('EVENT_RECEIVED'); // Responder siempre 200 a Meta
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
};

module.exports.generateBotReply = generateBotReply;
