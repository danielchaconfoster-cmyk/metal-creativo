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

FORMATO OBLIGATORIO DE SALIDA (CADENCIA HUMANA EN RÁFAGA):
Debes responder SIEMPRE con un objeto JSON válido con la propiedad "messages", que es una lista de 2 o máximo 3 textos breves (burbujas consecutivas de WhatsApp), simulando cómo chatea una persona real desde su teléfono:
- Burbuja 1: Saludo inicial cálido, reacción rápida o acuse de recibo ("¡Hola qué tal!", "Hola compadre, todo bien por acá", "Buena").
- Burbuja 2: Respuesta directa, técnica y honesta de taller (1 o 2 oraciones, sin relleno ni tecnicismos artificiales).
- Burbuja 3: Pregunta de cierre abierta para avanzar el cierre ("¿Para qué vehículo la necesitas tú?", "¿De qué comuna me escribes para cotizarte el flete por Starken?").

REGLAS ESTRICTAS PARA NO PARECER UN BOT:
1. TRATO Y SALUDO HUMANO:
   - Si se indica un nombre de pila real chileno (ej: Carlos, Rodrigo, Juan, Andrea), salúdalo casualmente por su nombre una vez ("¡Hola Carlos! Qué tal").
   - PROHIBICIÓN TOTAL: NUNCA llames a nadie "Cliente", "Amigo", "Usuario" ni uses apodos extraños de WhatsApp. Si el nombre no es una persona real o es desconocido, saluda naturalmente: "¡Hola qué tal!", "Hola compadre, todo bien por acá", o "Buenas tardes".
2. CERO TONO O FORMATO ROBÓTICO: Jamás uses viñetas con guiones, listas numeradas (1, 2, 3), ni asteriscos de markdown (**palabra**). Escribe como un chileno real desde su celular.
3. CERO EMOJIS ROBÓTICOS: Prohibido saturar con emojis (nada de 🤖, 📌, 🚀, 💡, ✅). Máximo 1 emoji casual en toda la conversación (como 👍 o 💪).
4. TONO DE TALLER CHILENO: Amable, cercano, confiable y relajado ("al tiro", "te queda impecable", "ningún drama", "te cuento", "al toque").
5. CONOCIMIENTO TÉCNICO OFICIAL:
   - Barra de Remolque: Cuesta $65.000 CLP (IVA incluido). Acero estructural macizo de 3 mm de espesor. Soporta hasta 3.500 kg de arrastre directo certificado.
   - Se desarma en 3 tramos de 65 cm para guardarla en la maleta al lado de la rueda de repuesto.
   - Incluye 2 grilletes forjados de seguridad que enganchan en cualquier vehículo (camioneta, furgón, SUV o auto con perno de tiro).
   - Cumple al 100% el Decreto Supremo N° 55/2025 del Ministerio de Transportes (multa de 1 a 1.5 UTM por remolcar con cuerda o piola).
   - Envíos diarios a todo Chile por Starken por pagar al retirar o a domicilio.
   - Medios de pago: Transferencia a la cuenta de la empresa o tarjeta en cuotas por Webpay en https://metalcreativo.cl/checkout.html.`;

function cleanBubbleText(text) {
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^[-•]\s*/, '').trim();
}

function parseCustomerGreetingName(name) {
  if (!name) return '';
  const cleaned = name.trim();
  const lower = cleaned.toLowerCase();
  const blacklisted = ['cliente', 'usuario', 'amigo', 'amigo/a', 'user', 'test', 'prueba', 'none', 'null', 'contacto'];
  if (blacklisted.includes(lower)) return '';

  const words = cleaned.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/);
  if (words.length > 0 && words[0].length >= 2) {
    const first = words[0];
    if (blacklisted.includes(first.toLowerCase())) return '';
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return '';
}

async function generateHumanReply(incomingText, customerName = '') {
  const text = (incomingText || '').trim();
  const validName = parseCustomerGreetingName(customerName);

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

  // 2. LLAMADA A GEMINI 3.1 FLASH LITE CON SALIDA JSON ESTRUCTURADA EN BURBUJAS
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
      const nameContext = validName
        ? `[NOMBRE DEL CLIENTE: "${validName}" (salúdalo casualmente por su nombre de pila si es inicio de conversación)]`
        : `[NOMBRE DEL CLIENTE: Desconocido. Saluda de forma natural ("¡Hola qué tal!", "Hola compadre, todo bien"). NUNCA uses la palabra 'Cliente' ni 'Amigo']`;

      const promptContent = `${SYSTEM_PERSONA_PROMPT}\n${shippingContext}\n${nameContext}\n\nCliente dice: "${text}"\nGenera el JSON con el array "messages":`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptContent }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 350,
            responseMimeType: 'application/json'
          }
        }),
        signal: AbortSignal.timeout(4500)
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const rawJson = data.candidates[0].content.parts[0].text.trim();
        try {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            return parsed.messages.map(cleanBubbleText).filter(Boolean);
          }
        } catch (_) {
          // Si no vino como JSON estricto, separar por saltos de línea
          const splitLines = rawJson.split(/\n\n+/).map(cleanBubbleText).filter(Boolean);
          if (splitLines.length > 0) return splitLines;
        }
      }
    } catch (err) {
      console.warn('[GEMINI AI WARNING]: Usando respaldo conversacional:', err.message);
    }
  }

  // 3. RESPALDO CONVERSACIONAL FRAGMENTADO (CADENCIA NATURAL DE 2 A 3 BURBUJAS)
  const greeting = validName ? `¡Hola ${validName}! Qué tal` : `¡Hola qué tal!`;

  if (lower.includes('navara') || lower.includes('hilux') || lower.includes('l200') || lower.includes('camioneta') || lower.includes('auto') || lower.includes('compatible')) {
    return [
      greeting,
      `Sí, te cuento que le queda impecable. La barra aguanta hasta 3.500 kilos y viene con dos grilletes forjados de seguridad que enganchan directo al tiro sin problema`,
      `¿De qué comuna me escribes para ver el tema del despacho por Starken?`
    ];
  }

  if (lower.includes('temuco') || lower.includes('concepcion') || lower.includes('antofagasta') || lower.includes('envio') || lower.includes('despacho') || lower.includes('starken')) {
    return [
      `¡Hola! Mira, nosotros despachamos todos los días hábiles por Starken`,
      `Se envía por pagar ya sea a sucursal o directo a tu domicilio, y demora entre 1 a 2 días hábiles en llegar`,
      `¿Para qué vehículo la estarías necesitando tú?`
    ];
  }

  if (lower.includes('ley') || lower.includes('decreto') || lower.includes('multa') || lower.includes('ministerio') || lower.includes('carabineros')) {
    return [
      `Hola! Sí, exactamente`,
      `Cumple al 100% con el nuevo Decreto Supremo N° 55/2025 del Ministerio de Transportes. Ahora está estrictamente prohibido tirar con piola o lazo porque te sacan partes de hasta 1.5 UTM`,
      `La barra nuestra es rígida y certificada para 3.500 kg. ¿Para qué vehículo la necesitas?`
    ];
  }

  if (lower.includes('pagar') || lower.includes('cuenta') || lower.includes('transferir') || lower.includes('comprar') || lower.includes('precio')) {
    return [
      `Sale $65.000 IVA incluido con los 2 grilletes forjados listos para usar`,
      `Lo puedes pagar por transferencia a la cuenta de la empresa o en cuotas con tarjeta por Webpay en https://metalcreativo.cl/checkout.html`,
      `¿Cuál te acomoda más para pasarte los datos al tiro?`
    ];
  }

  return [
    greeting,
    `Te atiende Nacho de Metal Creativo por acá`,
    `Cuéntame, ¿para qué auto o camioneta andas buscando la barra de remolque? Así te confirmo compatibilidad al tiro`
  ];
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
        const name = body.name || 'Cliente';
        const phone = body.phone || '+56 9 8888 7777';

        const humanBubbles = await generateHumanReply(text, name);
        const bubbles = Array.isArray(humanBubbles) ? humanBubbles : [humanBubbles];

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
          messages: bubbles,
          botResponse: bubbles.join('\n\n')
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
      const customerName = (contact && contact.profile && contact.profile.name) || '';

      console.log(`[WHATSAPP HUMANO] De: ${fromNumber} (${customerName || 'Sin Nombre'}): "${messageBody}"`);

      const humanBubbles = await generateHumanReply(messageBody, customerName);
      const bubbles = Array.isArray(humanBubbles) ? humanBubbles : [humanBubbles];

      // Responder secuencialmente a través de Meta WhatsApp Cloud API con cadencia humana
      const metaToken = process.env.META_ACCESS_TOKEN;
      const testPhoneId = process.env.WHATSAPP_TEST_PHONE_NUMBER_ID;

      if (metaToken && testPhoneId && fromNumber) {
        for (let i = 0; i < bubbles.length; i++) {
          const bubble = bubbles[i];
          if (!bubble) continue;

          // Retardo dinámico de tipeo y lectura humana:
          // Burbuja 1: 3.0s a 4.8s (lectura inicial + tipeo de saludo)
          // Burbujas siguientes: 2.0s a 3.5s (tipeo continuo en taller)
          const delay = i === 0
            ? Math.min(Math.max(bubble.length * 24, 3000), 4800)
            : Math.min(Math.max(bubble.length * 18, 2000), 3500);

          await new Promise(resolve => setTimeout(resolve, delay));

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
                text: { body: bubble }
              })
            });
          } catch (sendErr) {
            console.warn('[WHATSAPP SEND ERROR]:', sendErr.message);
          }
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
