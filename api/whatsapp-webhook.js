// Vercel Serverless Function: api/whatsapp-webhook.js
// Motor de IA Conversacional Humana (Gemini 3.1 Flash Lite) para WhatsApp
// Persona: Nacho, Maestro Soldador y Dueño de Metal Creativo Chile (Quillota / Santiago)

try { require('dotenv').config(); } catch (_) {}
const fs = require('fs');
const path = require('path');
const { calculateShipping, COMMUNE_MAP } = require('./shipping-quote');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const SYSTEM_PERSONA_PROMPT = `Eres Nacho, maestro soldador y dueño del taller Metal Creativo Chile (+56 9 5492 2608).
Atiendes personalmente por WhatsApp a clientes que vieron tus anuncios en Facebook e Instagram de la Barra Rígida de Remolque ($65.000 CLP) o los Fogones a Bioetanol ($149.900 CLP).

FORMATO OBLIGATORIO DE SALIDA (CADENCIA HUMANA EN RÁFAGA):
Debes responder SIEMPRE con un objeto JSON válido con la propiedad "messages", que es una lista de 2 o máximo 3 textos breves (burbujas consecutivas de WhatsApp), simulando cómo chatea una persona real desde su teléfono:
- Burbuja 1: Saludo inicial cálido o reacción directa ("¡Hola qué tal!", "¡Buena compadre!", "Dele").
- Burbuja 2: Respuesta directa, técnica y honesta de taller (1 o 2 oraciones, sin relleno ni tecnicismos artificiales).
- Burbuja 3: Pregunta de cierre abierta para avanzar el cierre ("¿Para qué vehículo la necesitas tú?", "¿De qué comuna me escribes para cotizarte el flete por Starken?").

REGLAS ESTRICTAS PARA NO PARECER UN BOT:
1. CONTINUIDAD CONVERSACIONAL Y TRATO HUMANO:
   - Si la conversación YA INICIÓ (el cliente ya te escribió antes), JAMÁS te vuelvas a presentar ("Te atiende Nacho de Metal Creativo...") ni reinicies el chat. Responde directamente a lo que te dijo.
   - Si se indica un nombre de pila real (ej: Carlos, Rodrigo, Juan, Daniel), salúdalo casualmente por su nombre ("¡Hola Daniel! Qué tal").
   - PROHIBICIÓN TOTAL: NUNCA llames a nadie "Cliente", "Amigo", "Usuario". Si no conoces el nombre, saluda naturalmente: "¡Hola qué tal!" o "¡Buena compadre!".
2. CERO FORMATO ROBÓTICO: Jamás uses viñetas con guiones, listas numeradas (1, 2, 3), ni asteriscos de markdown (**palabra**). Escribe como un chileno real desde su celular.
3. CERO EMOJIS ROBÓTICOS: Prohibido saturar con emojis (nada de 🤖, 📌, 🚀, 💡, ✅). Máximo 1 emoji casual en toda la conversación (como 👍 o 💪).
4. TONO DE TALLER CHILENO: Amable, cercano, confiable y relajado ("al tiro", "te queda impecable", "ningún drama", "te cuento", "al toque").
5. CONOCIMIENTO TÉCNICO OFICIAL:
   - Barra de Remolque: Cuesta $65.000 CLP (IVA incluido). Acero estructural macizo de 3 mm de espesor. Soporta hasta 3.500 kg de arrastre directo certificado.
   - Se desarma en 3 tramos de 65 cm para guardarla en la maleta al lado de la rueda de repuesto.
   - Incluye 2 grilletes forjados de seguridad que enganchan en cualquier vehículo (camioneta, furgón, SUV o auto con perno de tiro en la maleta).
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

// Catálogo automotriz chileno para reconocimiento contextual
const VEHICLE_CATALOG = [
  { keywords: ['camioneta', 'hilux', 'navara', 'np300', 'l200', 'katana', 'ranger', 'amarok', 'dmax', 'd-max', 'silverado', 'f150', 'f-150', 'poer', 'wingle', 't60', 't90', 'bt50', 'bt-50', 'colorado', 'd21', 'd22', 'troca', 'pickup', 'ram 700', 'ram 1500', 'montana', 'saveiro', 'oroch', 'terrano'], type: 'truck', label: 'camioneta' },
  { keywords: ['mazda 3', 'mazda 2', 'mazda 6', 'mazda', 'yaris', 'corolla', 'swift', 'baleno', 'sail', 'onix', 'accent', 'elantra', 'rio', 'cerato', 'morning', 'i10', '208', '308', 'gol', 'polo', 'golf', 'tiida', 'versa', 'auto', 'sedan', 'hatchback', 'c3', 'spark', 'alto', 'spresso'], type: 'car', label: 'auto' },
  { keywords: ['rav4', 'tucson', 'sportage', 'cx5', 'cx-5', 'cx3', 'cx-3', 'cx30', 'cx-30', 'cx9', 'kicks', 'tracker', 'duster', 'ecosport', 'creta', 'seltos', 'santa fe', 'sorento', 'grand vitara', 'vitara', 'jimny', 'outlander', 'asx', 'xv', 'forester', 'suv', 'jeep'], type: 'suv', label: 'SUV' }
];

function extractConversationContext(history = [], currentText = '') {
  const historyTexts = Array.isArray(history) ? history.map(h => (h.text || '')) : [];
  const fullConversation = [...historyTexts, currentText].join(' ').toLowerCase();
  const currentLower = (currentText || '').toLowerCase();

  // 1. Detectar Comuna & Flete
  let detectedCommune = null;
  let quote = null;
  for (const commune of Object.keys(COMMUNE_MAP)) {
    if (fullConversation.includes(commune)) {
      detectedCommune = commune;
      quote = calculateShipping(commune, 'barra_remolque');
      break;
    }
  }

  // 2. Detectar Vehículo
  let detectedVehicle = null;
  for (const entry of VEHICLE_CATALOG) {
    for (const kw of entry.keywords) {
      if (fullConversation.includes(kw)) {
        detectedVehicle = entry;
        break;
      }
    }
    if (detectedVehicle) break;
  }
  if (!detectedVehicle && /\b(199\d|200\d|201\d|202\d)\b/.test(currentLower)) {
    detectedVehicle = { type: 'car', label: 'auto' };
  }

  // 3. Continuidad: si ya se han cruzado mensajes
  const isContinuation = Array.isArray(history) && history.length >= 2;

  // 4. Intenciones
  const asksShipping = currentLower.includes('envio') || currentLower.includes('despacho') || currentLower.includes('starken') || currentLower.includes('flete') || currentLower.includes('cuanto sale') || (detectedCommune && currentLower.includes(detectedCommune));
  const asksPayment = currentLower.includes('pagar') || currentLower.includes('cuenta') || currentLower.includes('transferir') || currentLower.includes('tarjeta') || currentLower.includes('webpay') || currentLower.includes('comprar') || currentLower.includes('precio') || currentLower.includes('datos');
  const asksLaw = currentLower.includes('ley') || currentLower.includes('decreto') || currentLower.includes('multa') || currentLower.includes('ministerio') || currentLower.includes('carabineros') || currentLower.includes('piola') || currentLower.includes('cuerda');
  const mentionsVehicle = detectedVehicle && (
    VEHICLE_CATALOG.some(v => v.keywords.some(k => currentLower.includes(k))) ||
    /\b(199\d|200\d|201\d|202\d)\b/.test(currentLower)
  );

  return {
    detectedCommune,
    quote,
    detectedVehicle,
    isContinuation,
    asksShipping,
    asksPayment,
    asksLaw,
    mentionsVehicle
  };
}

async function generateHumanReply(incomingText, customerName = '', history = []) {
  const text = (incomingText || '').trim();
  const validName = parseCustomerGreetingName(customerName);
  const context = extractConversationContext(history, text);

  const greeting = validName ? `¡Hola ${validName}!` : `¡Hola qué tal!`;
  const communeCap = context.detectedCommune ? (context.detectedCommune.charAt(0).toUpperCase() + context.detectedCommune.slice(1)) : '';

  // 1. LLAMADA A GEMINI SI HAY API KEY VÁLIDA
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
      const shippingContext = context.quote
        ? `[DATO DE FLETE: Para ${context.quote.region} (${context.detectedCommune}) el envío por Starken es de $${context.quote.couriers.starken.cost.toLocaleString('es-CL')} CLP y demora ${context.quote.estimatedDays}].`
        : '';
      const nameContext = validName
        ? `[CLIENTE: "${validName}" (${context.isContinuation ? 'Ya se saludaron, NO saludes de nuevo' : 'salúdalo cordialmente por su nombre'})]`
        : `[CLIENTE: Sin nombre. NO digas 'Cliente' ni 'Amigo']`;

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
          const splitLines = rawJson.split(/\n\n+/).map(cleanBubbleText).filter(Boolean);
          if (splitLines.length > 0) return splitLines;
        }
      }
    } catch (err) {
      console.warn('[GEMINI AI WARNING]: Usando motor conversacional de taller local:', err.message);
    }
  }

  // 2. MOTOR DE ESTADO Y MEMORIA DETERMINISTA DE TALLER (100% INMUNE A CAÍDAS)

  // CASO A: El cliente menciona su vehículo (ej: "mazda 3 2013", "es una hilux", "para un yaris")
  if (context.mentionsVehicle) {
    const isTruck = context.detectedVehicle && context.detectedVehicle.type === 'truck';

    if (isTruck) {
      return [
        context.isContinuation ? `¡Buena! Para la camioneta le hace perfecto compadre` : `${greeting} Para la camioneta le queda impeque`,
        `Engancha directo a los ganchos de tiro del chasis o al coco de arrastre sin ninguna adaptación. Aguanta hasta 3.500 kg certificados en acero macizo de 3 mm`,
        context.detectedCommune
          ? `Y el Starken a ${communeCap} te sale como $${context.quote.couriers.starken.cost.toLocaleString('es-CL')} CLP (${context.quote.estimatedDays}). ¿Te acomoda más pagar por transferencia o con tarjeta en cuotas por la web?`
          : `¿De qué comuna me escribes para cotizarte el flete por Starken al tiro?`
      ];
    } else {
      // Auto, Sedán, Hatchback o SUV
      return [
        context.isContinuation ? `¡Buena! Para el ${text} le queda impecable compadre` : `${greeting} Para el ${text} le queda impeque`,
        `Ese modelo viene con el perno de tiro (cáncamo roscado) en la maleta junto a la gata de repuesto. Nuestro grillete forjado engancha directo ahí y como la barra es de 3 tramos rectos de 65 cm, tira derecho sin doblarse ni topar el parachoque`,
        context.detectedCommune
          ? `Y como me decías que eres de ${communeCap}, el flete por Starken te sale aproximadamente $${context.quote.couriers.starken.cost.toLocaleString('es-CL')} CLP (${context.quote.estimatedDays}). ¿Te gustaría que te la despachemos hoy mismo o te paso los datos para transferir?`
          : `¿De qué comuna me escribes para cotizarte el despacho por Starken al tiro?`
      ];
    }
  }

  // CASO B: Consulta de flete o menciona ciudad (ej: "¿Cuánto sale el envío a Temuco?")
  if (context.asksShipping) {
    const shippingPrice = context.quote ? `$${context.quote.couriers.starken.cost.toLocaleString('es-CL')} CLP` : '$7.900 CLP aprox';
    const shippingTime = context.quote ? context.quote.estimatedDays : '1 a 3 días hábiles';

    return [
      context.isContinuation ? `Mira, para ${communeCap || 'tu zona'} despachamos todos los días por Starken` : `¡Hola! Despachamos todos los días a ${communeCap || 'todo Chile'} por Starken`,
      `El flete sale aproximadamente ${shippingPrice} y te llega en ${shippingTime}. Se envía por pagar al retirar en sucursal o directo a domicilio`,
      context.detectedVehicle
        ? `Como es para tu ${context.detectedVehicle.label}, te queda impeque y lista para usar. ¿Te paso los datos para transferir o prefieres pagar con tarjeta en la web?`
        : `¿Para qué vehículo la estarías necesitando tú? Así te confirmo compatibilidad al tiro`
    ];
  }

  // CASO C: Consulta de pago o compra (ej: "¿Cómo puedo pagar?", "cuenta de transferencia")
  if (context.asksPayment) {
    return [
      `¡Dele compadre! Te paso los datos al tiro`,
      `Cuesta $65.000 IVA incluido con los 2 grilletes forjados. Lo puedes pagar por transferencia a la cuenta de la empresa o en cuotas con tarjeta por Webpay en https://metalcreativo.cl/checkout.html`,
      context.detectedCommune
        ? `Apenas hagas el pago avísame por acá mismo y te la dejamos embalada para el despacho a ${communeCap}`
        : `Avísame cuál te acomoda más y me dejas tu comuna para coordinar el Starken`
    ];
  }

  // CASO D: Consulta de ley / legalidad MTT
  if (context.asksLaw) {
    return [
      `Hola! Sí, exactamente`,
      `Cumple al 100% con el nuevo Decreto Supremo N° 55/2025 del Ministerio de Transportes. Ahora está estrictamente prohibido tirar con piola o lazo porque te sacan partes de hasta 1.5 UTM`,
      context.detectedVehicle
        ? `Nuestra barra es maciza y certificada para 3.500 kg, así que con tu ${context.detectedVehicle.label} andas 100% legal. ¿Te gustaría coordinar el envío?`
        : `La barra nuestra es rígida y certificada para 3.500 kg. ¿Para qué vehículo la necesitas tú?`
    ];
  }

  // CASO E: Mensaje general o de reinicio
  if (context.isContinuation) {
    return [
      `¡Dele compadre!`,
      `La barra aguanta hasta 3.500 kilos certificados y se guarda fácil en 3 tramos de 65 cm al lado de la rueda de repuesto`,
      `¿Te gustaría que te coordinemos el despacho o tienes alguna otra duda técnica?`
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
        const name = body.name || '';
        const phone = body.phone || '+56 9 8888 7777';
        const history = body.history || [];

        const humanBubbles = await generateHumanReply(text, name, history);
        const bubbles = Array.isArray(humanBubbles) ? humanBubbles : [humanBubbles];

        // Guardar lead en el historial del Kanban
        const newLead = {
          id: 'LEAD-' + Math.floor(1000 + Math.random() * 9000),
          name: name || 'Cliente WhatsApp',
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

      // Memoria de conversación persistente por número
      if (!global.whatsappSessions) global.whatsappSessions = new Map();
      const prevHistory = global.whatsappSessions.get(fromNumber) || [];

      const humanBubbles = await generateHumanReply(messageBody, customerName, prevHistory);
      const bubbles = Array.isArray(humanBubbles) ? humanBubbles : [humanBubbles];

      // Actualizar sesión
      prevHistory.push({ sender: 'user', text: messageBody });
      prevHistory.push({ sender: 'bot', text: bubbles.join(' ') });
      if (prevHistory.length > 20) prevHistory.splice(0, prevHistory.length - 20);
      global.whatsappSessions.set(fromNumber, prevHistory);

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
