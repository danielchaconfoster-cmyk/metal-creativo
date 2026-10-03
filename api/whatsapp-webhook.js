// Vercel Serverless Function: api/whatsapp-webhook.js
// Motor de IA Conversacional Humana (Gemini 3.1 Flash Lite) para WhatsApp
// Persona: Nacho, Maestro Soldador y Dueño de Metal Creativo Chile (Quillota / Santiago)

try { require('dotenv').config(); } catch (_) {}
const fs = require('fs');
const path = require('path');
const { calculateShipping, COMMUNE_MAP } = require('./shipping-quote');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAb16muTUfrb80LknOr8IwDp-Pn_kqwA5Q';

const SYSTEM_PERSONA_PROMPT = `Eres Nacho, maestro soldador y dueño del taller Metal Creativo Chile (+56 9 5492 2608).
Atiendes personalmente por WhatsApp a clientes que vieron tus anuncios en Facebook e Instagram de la Barra Rígida de Remolque ($65.000 CLP) o los Fogones a Bioetanol ($149.900 CLP).

REGLAS OBLIGATORIAS PARA NO PARECER UN BOT:
1. CERO TONO ROBÓTICO: Jamás uses viñetas con guiones, listas numeradas (1, 2, 3), ni asteriscos de negrita de markdown (**palabra**). Escribe exactamente como escribe un chileno real desde su teléfono en WhatsApp.
2. MENSAJES CORTOS Y NATURALES: Máximo 2 a 3 oraciones por mensaje. Tono cálido, de taller, confiable y respetuoso ("¡Hola qué tal!", "te cuento", "te queda impecable", "ningún drama", "al tiro").
3. CONOCIMIENTO TÉCNICO OFICIAL:
   - Barra de Remolque: Cuesta $65.000 CLP (IVA incluido). Fabricada en acero macizo estructural de 3 mm de espesor. Soporta hasta 3.500 kg de arrastre directo certificado.
   - Viene en 3 tramos de 65 cm para guardarla en la maleta al lado de la rueda de repuesto sin que estorbe.
   - Incluye 2 grilletes forjados de seguridad que enganchan en cualquier vehículo (camioneta, furgón, SUV o auto con perno de tiro).
   - Cumple al 100% el Decreto Supremo N° 55/2025 del Ministerio de Transportes (que prohíbe terminantemente remolcar con cuerda o piola por multas de 1 a 1.5 UTM y riesgo de choque).
   - Envíos diarios a todo Chile por Starken por pagar al retirar o a domicilio.
   - Si piden datos de pago: Ofrece transferencia a cuenta de la empresa o link de Mercado Pago / Webpay para pagar en cuotas con tarjeta (https://metalcreativo.cl/checkout.html).
4. CIERRE CONVERSACIONAL: Termina siempre con una pregunta natural y relajada (ej: "¿Para qué auto la necesitas tú?" o "¿De qué ciudad me escribes para ver el envío?").`;

async function generateHumanReply(incomingText, customerName = 'Amigo/a') {
  const text = (incomingText || '').trim();

  // 1. Detectar si hay consulta de flete para darle contexto a la IA
  let shippingContext = '';
  const lower = text.toLowerCase();
  for (const commune of Object.keys(COMMUNE_MAP)) {
    if (lower.includes(commune)) {
      const quote = calculateShipping(commune, 'barra_remolque');
      shippingContext = `[DATO DE FLETE: Para ${quote.region} el envío aproximado por Starken es de $${quote.couriers.starken.cost.toLocaleString('es-CL')} CLP y demora ${quote.estimatedDays}].`;
      break;
    }
  }

  // 2. LLAMADA A GEMINI 3.1 FLASH LITE (RESPUESTA HUMANA EN < 800ms)
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
      const promptContent = `${SYSTEM_PERSONA_PROMPT}\n${shippingContext}\n\nCliente (${customerName}) dice: "${text}"\nResponde como Nacho:`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptContent }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250
          }
        }),
        signal: AbortSignal.timeout(4500)
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        let reply = data.candidates[0].content.parts[0].text.trim();
        // Limpiar asteriscos accidentales para que parezca WhatsApp 100% natural
        reply = reply.replace(/\*\*/g, '').replace(/\*/g, '');
        return reply;
      }
    } catch (err) {
      console.warn('[GEMINI AI WARNING]: Usando respaldo conversacional:', err.message);
    }
  }

  // 3. RESPALDO CONVERSACIONAL NATURAL (SI LA IA TARDA O ESTÁ OFFLINE)
  if (lower.includes('navara') || lower.includes('hilux') || lower.includes('l200') || lower.includes('camioneta') || lower.includes('auto')) {
    return `¡Hola ${customerName}! Qué tal. Sí, te cuento que le queda impecable. La barra aguanta hasta 3.500 kilos y viene con dos grilletes forjados de seguridad que enganchan directo al tiro sin problema. ¿De qué comuna me escribes para ver el tema del despacho?`;
  }

  if (lower.includes('temuco') || lower.includes('concepcion') || lower.includes('antofagasta') || lower.includes('envio') || lower.includes('despacho')) {
    return `¡Hola! Mira, nosotros despachamos todos los días hábiles por Starken por pagar a sucursal o domicilio, así que te llega súper rápido en 1 a 2 días hábiles. ¿Para qué vehículo la estarías necesitando tú?`;
  }

  if (lower.includes('pagar') || lower.includes('cuenta') || lower.includes('transferir') || lower.includes('comprar')) {
    return `¡Buenísima! El pago lo puedes hacer por transferencia a la cuenta de la empresa o si prefieres con tarjeta de crédito en cuotas por Webpay en nuestra web https://metalcreativo.cl/checkout.html. Avísame cuál te acomoda y te paso los datos al tiro.`;
  }

  return `¡Hola ${customerName}! Qué tal, te atiende Nacho de Metal Creativo. Cuéntame, ¿para qué auto o camioneta andas buscando la barra de remolque? Así te confirmo compatibilidad al tiro.`;
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
    }
    return res.status(403).send('Token no coincide');
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

        const humanReply = await generateHumanReply(text, name);

        // Guardar lead en el historial del Kanban
        const newLead = {
          id: 'LEAD-' + Math.floor(1000 + Math.random() * 9000),
          name: name,
          phone: phone,
          product: text.toLowerCase().includes('fogon') ? 'fogon' : 'barra_remolque',
          commune: 'Chile',
          region: 'Chile',
          status: 'new',
          source: 'whatsapp_sandbox',
          estimated_shipping: 7900,
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
          mode: 'simulated_human_ai',
          customerMessage: text,
          botResponse: humanReply
        });
      }

      // 3. PROCESAMIENTO OFICIAL DE MENSAJE DE META
      const entry = body.entry && body.entry[0];
      const change = entry && entry.changes && entry.changes[0];
      const value = change && change.value;
      const message = value && value.messages && value.messages[0];

      if (!message) {
        return res.status(200).send('EVENT_RECEIVED');
      }

      const fromNumber = message.from;
      const messageBody = message.text ? message.text.body : '';
      const contact = value.contacts && value.contacts[0];
      const customerName = (contact && contact.profile && contact.profile.name) || 'Amigo';

      console.log(`[WHATSAPP HUMANO] De: ${fromNumber} (${customerName}): "${messageBody}"`);

      const humanReply = await generateHumanReply(messageBody, customerName);

      // Pausa humana realista: simula tiempo de lectura y tipeo (2.2 a 3.8 segundos)
      const humanDelayMs = Math.min(Math.max((humanReply || '').length * 15, 2200), 3800);
      await new Promise(resolve => setTimeout(resolve, humanDelayMs));

      // Responder a través de Meta WhatsApp Cloud API
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
              text: { body: humanReply }
            })
          });
        } catch (sendErr) {
          console.warn('[WHATSAPP SEND ERROR]:', sendErr.message);
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error('[WHATSAPP WEBHOOK ERROR]:', err);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
};

module.exports.generateHumanReply = generateHumanReply;
