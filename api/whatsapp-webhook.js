// Vercel Serverless Function: api/whatsapp-webhook.js
// Motor de IA Conversacional Humana (Gemini 3.1 Flash Lite) para WhatsApp
// Persona: Nacho, Maestro Soldador y Dueño de Metal Creativo Chile (Quillota / Santiago)

const crypto = require('node:crypto');
const { installHttp, readRaw, readJson, parseJson, singleHeader, HttpError, sendError } = require('../lib/http');
const { getDatabase, rpc } = require('../lib/database');
const { calculateShipping, COMMUNE_MAP } = require('./shipping-quote');
const { requireAdmin } = require('../lib/admin-auth');

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
        redirect: 'error',
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
            const cleaned=parsed.messages.filter(item => typeof item === 'string').slice(0,3).map(item => cleanBubbleText(item).slice(0,4096)).filter(Boolean);
            if(cleaned.length)return cleaned;
          }
        } catch (_) {
          const splitLines = rawJson.split(/\n\n+/).map(cleanBubbleText).filter(Boolean);
          if (splitLines.length > 0) return splitLines;
        }
      }
    } catch (err) {
      console.warn('[GEMINI_UNAVAILABLE]');
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


function verifyMeta(req, raw) {
  const secret=process.env.META_APP_SECRET?.trim();
  if (!secret) throw new HttpError(503,'WEBHOOK_NOT_CONFIGURED');
  const signature=singleHeader(req,'x-hub-signature-256');
  if(typeof signature!=='string' || !/^sha256=[a-fA-F0-9]{64}$/.test(signature)) throw new HttpError(401,'INVALID_SIGNATURE');
  const expected=crypto.createHmac('sha256',secret).update(raw).digest();
  if(!crypto.timingSafeEqual(expected,Buffer.from(signature.slice(7),'hex'))) throw new HttpError(401,'INVALID_SIGNATURE');
}
function phoneId() {
  return process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || (!process.env.VERCEL && process.env.WHATSAPP_ALLOW_TEST_NUMBER==='true' ? process.env.WHATSAPP_TEST_PHONE_NUMBER_ID?.trim() : '');
}
function boundedText(value,max,optional=false) {
  if(optional && value===undefined)return '';
  if(typeof value!=='string' || value.length>max || (!optional && !value.trim()) || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value))throw new HttpError(400,'INVALID_MESSAGE');
  return value;
}
async function processMessage(message,db) {
      const claim=await rpc(db,'backend_claim_whatsapp',{p_id:message.id,p_phone:message.phone,p_text:message.text,p_name:message.name});
      if(!claim || typeof claim.claimed!=='boolean')throw new HttpError(503,'MESSAGE_NOT_SAVED');
      if(!claim.claimed) {
        if(claim.reason==='conversation_busy' || claim.status==='processing' || claim.status==='retryable')throw new HttpError(503,'CONVERSATION_BUSY');
        return claim.status;
      }
      const metaToken=process.env.META_ACCESS_TOKEN?.trim();
      if(!metaToken) {
        await rpc(db,'backend_finish_whatsapp',{p_id:message.id,p_response:claim.response || {bubbles:[],lead:{name:message.name,last_message:message.text}},p_status:'awaiting_configuration',p_sent_count:claim.sent_count || 0,p_error_code:'OUTBOUND_NOT_CONFIGURED'});
        return 'awaiting_configuration';
      }
      const receiver=phoneId();
      const version=process.env.META_GRAPH_VERSION || 'v21.0';
      if(!receiver || !/^v\d{1,2}\.\d{1,2}$/.test(version)) throw new HttpError(503,'WHATSAPP_NOT_CONFIGURED');
      let response=claim.response;
      if(!response || !Array.isArray(response.bubbles) || !response.bubbles.length) {
        const history=Array.isArray(claim.history)?claim.history.slice(-18).map(item=>({sender:item.sender,text:String(item.text || '').slice(0,1024)})):[];
        const bubbles=(await generateHumanReply(message.text,message.name,history)).slice(0,3).map(text=>text.slice(0,4096));
        const context=extractConversationContext(history,message.text);
        response={bubbles,history:[...history,{sender:'user',text:message.text.slice(0,1024)},{sender:'bot',text:bubbles.join(' ').slice(0,1024)}].slice(-20),lead:{name:message.name,product:/fogon|fogón/i.test(message.text)?'fogon':'barra_remolque',commune:context.detectedCommune || '',region:context.quote?.region || '',estimated_shipping:context.quote?.couriers?.starken?.cost || 0,last_message:message.text}};
      }
      const bubbles=response.bubbles;
      response={...response,history:Array.isArray(response.history)?[...response.history]:[]};
      // Keep exact replies and the acknowledged prefix; trim only old context.
      if(response.lead) { response.lead={...response.lead}; delete response.lead.last_message; }
      while(Buffer.byteLength(JSON.stringify(response),'utf8')>60000 && response.history.length>2) response.history.shift();
      if(Buffer.byteLength(JSON.stringify(response),'utf8')>60000) throw new HttpError(503,'RESPONSE_TOO_LARGE');
      const offset=claim.sent_count || 0;
      if(!Number.isInteger(offset) || offset<0 || offset>bubbles.length)throw new HttpError(503,'INVALID_DELIVERY_STATE');
      for(let index=offset;index<bubbles.length;index++) {
        const started=await rpc(db,'backend_start_whatsapp_send',{p_id:message.id,p_index:index});
        if(started!==true)throw new HttpError(503,'MESSAGE_SEND_LOCKED');
        let sent;
        try {
          sent=await fetch('https://graph.facebook.com/'+version+'/'+receiver+'/messages',{method:'POST',headers:{Authorization:'Bearer '+metaToken,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:message.phone,type:'text',text:{body:bubbles[index]}}),signal:AbortSignal.timeout(8000),redirect:'error'});
        } catch (_) {
          await rpc(db,'backend_finish_whatsapp',{p_id:message.id,p_response:response,p_status:'uncertain',p_sent_count:index,p_error_code:'PROVIDER_DELIVERY_UNCERTAIN'});
          throw new HttpError(503,'PROVIDER_DELIVERY_UNCERTAIN');
        }
        if(!sent.ok) {
          let rejected;try {rejected=await sent.json();} catch (_) {rejected=null;}
          const transient=sent.status===429 || (rejected?.error && typeof rejected.error.code==='number' && rejected.error.is_transient===true);
          const status=transient?'retryable':sent.status>=500?'uncertain':'failed';
          const code=transient?'PROVIDER_TEMPORARILY_REJECTED':status==='uncertain'?'PROVIDER_DELIVERY_UNCERTAIN':'PROVIDER_REJECTED';
          await rpc(db,'backend_finish_whatsapp',{p_id:message.id,p_response:response,p_status:status,p_sent_count:index,p_error_code:code});
          throw new HttpError(503,code);
        }
        let result;
        try { result=await sent.json(); } catch (_) { result=null; }
        if(!result?.messages?.[0]?.id) {
          await rpc(db,'backend_finish_whatsapp',{p_id:message.id,p_response:response,p_status:'uncertain',p_sent_count:index,p_error_code:'PROVIDER_DELIVERY_UNCERTAIN'});
          throw new HttpError(503,'PROVIDER_DELIVERY_UNCERTAIN');
        }
        await rpc(db,'backend_finish_whatsapp',{p_id:message.id,p_response:response,p_status:'processing',p_sent_count:index+1,p_error_code:null});
      }
      await rpc(db,'backend_finish_whatsapp',{p_id:message.id,p_response:response,p_status:'completed',p_sent_count:bubbles.length,p_error_code:null});
      return 'completed';
    }

module.exports = async (req,res) => {
  installHttp(req,res);
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET') {
    const expected=process.env.WHATSAPP_VERIFY_TOKEN?.trim();
    if(!expected)return res.status(503).send('Webhook no configurado');
    const query=req.query || {};
    if(query['hub.mode']==='subscribe' && typeof query['hub.verify_token']==='string' && query['hub.verify_token']===expected && typeof query['hub.challenge']==='string' && query['hub.challenge'].length<=200)return res.status(200).send(query['hub.challenge']);
    return res.status(403).send('Token no coincide');
  }
  if(req.method!=='POST')return res.status(405).json({error:'Método no permitido'});
  try {
    // Simulator uses the private admin boundary; official events use exact original bytes.
    let body;
    const hasAdmin=Object.keys(req.headers || {}).some(key=>['x-admin-token','authorization'].includes(key.toLowerCase()));
    const parsedBody=Object.getOwnPropertyDescriptor(req,'body')?.value;
    if(hasAdmin || parsedBody?.simulate===true) {
      if(!requireAdmin(req,res))return;
      body=await readJson(req);
      if(body.simulate!==true)throw new HttpError(400,'INVALID_SIMULATION');
      const text=boundedText(body.message || 'Hola, ¿tienen stock?',4000);
      const name=boundedText(body.name,100,true);
      if(body.history!==undefined && (!Array.isArray(body.history) || body.history.length>20))throw new HttpError(400,'INVALID_MESSAGE');
      const history=(body.history || []).map(item=>({sender: ['user','bot'].includes(item?.sender)?item.sender:'user',text:boundedText(item?.text,4000)}));
      const bubbles=await generateHumanReply(text,name,history);
      return res.status(200).json({success:true,mode:'simulated_human_ai',customerMessage:text,messages:bubbles,botResponse:bubbles.join('\n\n')});
    }
    const raw=await readRaw(req);
    verifyMeta(req,raw);
    body=parseJson(raw);
    if(body.object!=='whatsapp_business_account' || !Array.isArray(body.entry))throw new HttpError(400,'INVALID_EVENT');
    const incoming=[];
    for(const entry of body.entry) {
      if(!Array.isArray(entry.changes))throw new HttpError(400,'INVALID_EVENT');
      for(const change of entry.changes) {
        const value=change.value || {};
        if(value.messages===undefined)continue; // Delivery statuses have no reply effects.
        if(!Array.isArray(value.messages))throw new HttpError(400,'INVALID_EVENT');
        const receiver=phoneId();
        if(!receiver)throw new HttpError(503,'WHATSAPP_NOT_CONFIGURED');
        if(String(value.metadata?.phone_number_id)!==receiver)throw new HttpError(403,'WRONG_WHATSAPP_ACCOUNT');
        for(const message of value.messages) {
          if(message.type!=='text')continue;
          if(typeof message.id!=='string' || !/^[A-Za-z0-9._:=+\/-]{1,200}$/.test(message.id) || typeof message.from!=='string' || !/^\d{8,15}$/.test(message.from))throw new HttpError(400,'INVALID_MESSAGE');
          const contact=(value.contacts || []).find(item=>item.wa_id===message.from);
          incoming.push({id:message.id,phone:message.from,text:boundedText(message.text?.body,4000),name:boundedText(contact?.profile?.name,255,true)});
          if(incoming.length>20)throw new HttpError(413,'TOO_MANY_MESSAGES');
        }
      }
    }
    if(!incoming.length)return res.status(200).send('EVENT_RECEIVED');
    const db=getDatabase();
    for(const message of incoming) await processMessage(message,db);
    return res.status(200).send('EVENT_RECEIVED');
  } catch(error) {return sendError(res,error);}
};
module.exports.generateHumanReply=generateHumanReply;

module.exports.processMessage=processMessage;
module.exports.phoneId=phoneId;
