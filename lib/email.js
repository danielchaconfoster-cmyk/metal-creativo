'use strict';

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Metal Creativo <pedidos@metalcreativo.cl>';
const ADMIN_NOTIFICATION_EMAIL = 'metalcreativo03@gmail.com';

function formatCLP(amount) {
  return new Intl.NumberFormat('es-CL').format(amount || 0);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function sendRawEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null; // No-op in test/isolated environments

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo || ADMIN_NOTIFICATION_EMAIL
      }),
      signal: AbortSignal.timeout(4000)
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // Fail-safe: Email failures must never disrupt checkout or payment database integrity
    return { ok: false, error: err.message };
  }
}

function renderReceiptHtml({ order, customer, items, isPaid, isTransfer }) {
  const orderNumber = escapeHtml(String(order.order_number || order.id?.slice(0, 8).toUpperCase() || ''));
  const customerName = escapeHtml(customer.full_name || '');
  const customerRut = escapeHtml(customer.rut || '');
  const customerPhone = escapeHtml(customer.phone || '');
  const address = escapeHtml(`${customer.address_street || ''} ${customer.address_number || ''}${customer.address_extra ? ' Depto/Casa: ' + customer.address_extra : ''}, ${customer.comuna || ''}, ${customer.region || ''}`);
  const shippingMethod = order.shipping_method === 'rm_express' ? 'Express Santiago ($4.990)' : 'Starken Regional (Por Pagar en destino)';

  const itemsHtml = (items || []).map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #222630; color: #f1f5f9; font-size: 14px;">
        <strong>${escapeHtml(item.title || item.name || 'Barra de Remolque 1.8m')}</strong>
        <span style="display: block; color: #94a3b8; font-size: 12px;">Cantidad: ${item.quantity || item.qty || 1}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #222630; color: #ff6a00; font-size: 14px; font-weight: bold; text-align: right;">
        $${formatCLP((item.unit_price || item.price || 65000) * (item.quantity || item.qty || 1))} CLP
      </td>
    </tr>
  `).join('');

  const statusBadge = isPaid
    ? `<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #059669; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Pago Aprobado (Webpay / Tarjeta)</span>`
    : `<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid #d97706; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Pendiente de Transferencia</span>`;

  const transferBlock = isTransfer ? `
    <div style="background: #181d27; border: 1px solid #f59e0b; border-radius: 8px; padding: 18px; margin: 24px 0;">
      <h3 style="color: #fbbf24; margin: 0 0 10px 0; font-size: 15px; font-weight: bold;">📋 Datos Oficiales para Transferencia Bancaria</h3>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong>Banco:</strong> BancoEstado / Cuenta RUT o Corriente<br>
        <strong>Titular:</strong> Metal Creativo Chile<br>
        <strong>RUT:</strong> 12.345.678-9<br>
        <strong>N° de Cuenta:</strong> Consultar directo o enviar comprobante<br>
        <strong>Correo de confirmación:</strong> metalcreativo03@gmail.com<br>
        <strong>Monto exacto:</strong> <span style="color: #ff6a00; font-weight: bold;">$${formatCLP(order.total_amount)} CLP</span>
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 10px;">
        *Por favor incluye tu N° de orden <strong>#${orderNumber}</strong> en el comentario de la transferencia.
      </p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Confirmación de Pedido Metal Creativo</title>
  <!-- Google Schema Markup para Tarjeta Interactiva en Gmail -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Order",
    "merchant": {
      "@type": "Organization",
      "name": "Metal Creativo Chile",
      "url": "https://metalcreativo.cl"
    },
    "orderNumber": "${orderNumber}",
    "priceCurrency": "CLP",
    "price": "${order.total_amount || 0}",
    "orderStatus": "${isPaid ? 'https://schema.org/OrderDelivered' : 'https://schema.org/OrderProcessing'}",
    "customer": {
      "@type": "Person",
      "name": "${customerName}"
    }
  }
  </script>
</head>
<body style="margin: 0; padding: 0; background-color: #07080b; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #07080b; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #11141a; border: 1px solid #272a33; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          
          <!-- CABECERA CINEMATOGRÁFICA ANIMADA -->
          <tr>
            <td style="background-color: #07080b; padding: 0; text-align: center; border-bottom: 2px solid #ff6a00; line-height: 0;">
              <img src="https://metalcreativo.cl/images/email-banner-animated.gif" alt="Metal Creativo Chile • Fabricación Nacional en Acero" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0; outline: none; margin: 0 auto;">
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="padding: 30px 24px;">
              <div style="text-align: center; margin-bottom: 24px;">
                ${statusBadge}
                <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 16px 0 6px 0;">¡Muchas gracias por tu compra, ${customerName}!</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 0;">Tu orden oficial ha sido registrada con el código: <strong style="color: #ff6a00;">#${orderNumber}</strong></p>
              </div>

              ${transferBlock}

              <!-- REGISTRO DE AUDITORÍA Y SEGURIDAD -->
              <div style="background-color: #0b131e; border: 1px solid #1e3a8a; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">
                  <tr>
                    <td style="color: #38bdf8; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; padding-bottom: 6px;" colspan="2">
                      🛡️ Auditoría de Transacción (${isPaid ? 'Mercado Pago / Webpay' : 'Transferencia Bancaria'})
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0;"><strong>Código de Orden:</strong> #${orderNumber}</td>
                    <td align="right" style="padding: 2px 0;"><span style="color: ${isPaid ? '#34d399' : '#fbbf24'}; font-weight: 600;">● ${isPaid ? 'Fondos Capturados y Aprobados' : 'Esperando Comprobante'}</span></td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0;"><strong>Garantía:</strong> 6 Meses</td>
                    <td align="right" style="padding: 2px 0;"><strong>Homologación:</strong> Decreto MTT 55/2025</td>
                  </tr>
                </table>
              </div>

              <!-- RESUMEN DE PRODUCTOS -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th align="left" style="padding-bottom: 8px; border-bottom: 2px solid #334155; color: #cbd5e1; font-size: 12px; text-transform: uppercase;">Producto</th>
                    <th align="right" style="padding-bottom: 8px; border-bottom: 2px solid #334155; color: #cbd5e1; font-size: 12px; text-transform: uppercase;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td style="padding-top: 14px; color: #94a3b8; font-size: 13px;">Modalidad de Despacho:</td>
                    <td align="right" style="padding-top: 14px; color: #f1f5f9; font-size: 13px; font-weight: 600;">${shippingMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 0 0 0; color: #ffffff; font-size: 16px; font-weight: 800;">Total Final:</td>
                    <td align="right" style="padding: 14px 0 0 0; color: #ff6a00; font-size: 20px; font-weight: 800;">$${formatCLP(order.total_amount)} CLP</td>
                  </tr>
                </tfoot>
              </table>

              <!-- DATOS DE DESPACHO -->
              <div style="background-color: #0c0e12; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin: 24px 0;">
                <h4 style="color: #f8fafc; font-size: 13px; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 0.05em;">📦 Dirección de Despacho</h4>
                <p style="color: #cbd5e1; font-size: 12px; line-height: 1.5; margin: 0;">
                  <strong>Destinatario:</strong> ${customerName} (RUT: ${customerRut})<br>
                  <strong>Teléfono:</strong> ${customerPhone}<br>
                  <strong>Dirección:</strong> ${address}
                </p>
              </div>

              <!-- BOTON DE WHATSAPP -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="https://wa.me/56954922608?text=Hola%20Metal%20Creativo!%20Tengo%20una%20consulta%20sobre%20mi%20orden%20%23${orderNumber}" target="_blank" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 6px; box-shadow: 0 4px 15px rgba(234, 88, 12, 0.4);">
                  💬 Contactar al Taller por WhatsApp
                </a>
              </div>

              <!-- GUÍA RÁPIDA DE ARMADO EN VIDEO -->
              <div style="background: #141720; border: 1px solid #232a3b; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
                <p style="color: #f1f5f9; font-size: 13px; font-weight: 700; margin: 0 0 4px 0;">🎬 ¿Cómo armar tu barra en carretera?</p>
                <p style="color: #94a3b8; font-size: 11px; margin: 0 0 10px 0;">Revisa el video instructivo de 1 minuto del taller para asegurar los 3 tramos de acero.</p>
                <a href="https://metalcreativo.cl/barra-de-remolque.html#video-armado" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 18px; border-radius: 4px;">
                  ▶️ Ver Video de Armado en 1 Minuto
                </a>
              </div>

              <!-- BOTON DE SEGUIMIENTO EN VIVO -->
              <div style="background: #0d1117; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
                <p style="color: #f1f5f9; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">📱 Consulta el Estado de tu Fabricación y Despacho</p>
                <p style="color: #94a3b8; font-size: 12px; margin: 0 0 14px 0; line-height: 1.5;">
                  Puedes ver en tiempo real el avance de tu orden oficial #${orderNumber} directamente en nuestro sitio web:
                </p>
                <a href="https://metalcreativo.cl/checkout-success?order_id=${escapeHtml(order.id || '')}" target="_blank" style="display: inline-block; background-color: #ff6a00; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 800; padding: 10px 22px; border-radius: 6px; box-shadow: 0 4px 12px rgba(255, 106, 0, 0.35);">
                  🔍 Ver Estado de mi Orden en Vivo
                </a>
              </div>

            </td>
          </tr>

          <!-- PIE DE CORREO -->
          <tr>
            <td style="background-color: #0a0c10; padding: 20px 24px; text-align: center; border-top: 1px solid #1e293b; color: #64748b; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;"><strong>Metal Creativo Chile</strong> • Taller de Fabricación en Acero</p>
              <p style="margin: 0 0 6px 0;">Homologación Decreto Supremo MTT 55/2025 • Garantía de 6 Meses</p>
              <p style="margin: 0;">Quillota, Región de Valparaíso • <a href="https://metalcreativo.cl" style="color: #ff6a00; text-decoration: none;">metalcreativo.cl</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function renderAdminAlertHtml({ order, customer, items, isPaid, isTransfer }) {
  const orderNumber = escapeHtml(String(order.order_number || order.id?.slice(0, 8).toUpperCase() || ''));
  const customerName = escapeHtml(customer.full_name || '');
  const customerRut = escapeHtml(customer.rut || '');
  const customerPhone = escapeHtml(customer.phone || '');
  const customerEmail = escapeHtml(customer.email || '');
  const cleanPhone = customerPhone.replace(/\D/g, '');
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('56') ? cleanPhone : '56' + cleanPhone}` : 'https://wa.me/56954922608';
  const address = escapeHtml(`${customer.address_street || ''} ${customer.address_number || ''}${customer.address_extra ? ' Depto: ' + customer.address_extra : ''}, ${customer.comuna || ''}, ${customer.region || ''}`);
  const shippingMethod = order.shipping_method === 'rm_express' ? 'Express RM ($4.990)' : 'Starken Regional (Por Pagar)';

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Nueva Venta en Metal Creativo</title></head>
<body style="font-family: sans-serif; background: #07080b; color: #e2e8f0; padding: 20px;">
  <div style="max-width: 550px; margin: auto; background: #11141a; border: 1px solid #ff6a00; border-radius: 10px; padding: 24px;">
    <h2 style="color: #ff6a00; margin-top: 0;">🚨 ¡NUEVA VENTA REGISTRADA!</h2>
    <p style="font-size: 16px;"><strong>Orden:</strong> #${orderNumber}</p>
    <p style="font-size: 18px; color: #34d399;"><strong>Monto Total:</strong> $${formatCLP(order.total_amount)} CLP (${isPaid ? 'PAGADO VÍA WEBPAY/MP' : 'TRANSFERENCIA PENDIENTE'})</p>
    <hr style="border: 0; border-top: 1px solid #334155; margin: 15px 0;">
    <h3 style="color: #f1f5f9; font-size: 14px; text-transform: uppercase;">Datos del Comprador:</h3>
    <ul style="line-height: 1.6; font-size: 13px; color: #cbd5e1;">
      <li><strong>Cliente:</strong> ${customerName} (RUT: ${customerRut})</li>
      <li><strong>Teléfono:</strong> ${customerPhone}</li>
      <li><strong>Email:</strong> ${customerEmail}</li>
      <li><strong>Dirección:</strong> ${address}</li>
      <li><strong>Despacho:</strong> ${shippingMethod}</li>
    </ul>
    <div style="margin-top: 20px; text-align: center;">
      <a href="${whatsappUrl}" target="_blank" style="background: #22c55e; color: #000; text-decoration: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; display: inline-block;">
        💬 Abrir WhatsApp con el Cliente
      </a>
      <a href="https://metalcreativo.cl/admin.html" target="_blank" style="background: #334155; color: #fff; text-decoration: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; display: inline-block; margin-left: 10px;">
        ⚙️ Ir al Panel Admin
      </a>
    </div>
  </div>
</body>
</html>
  `;
}

async function notifyCustomerOrder({ order, customer, items, isPaid, isTransfer }) {
  if (!customer?.email) return null;
  const orderNumber = order.order_number || order.id?.slice(0, 8).toUpperCase() || '';
  const subject = isPaid
    ? `✅ Confirmación de Pago y Despacho #${orderNumber} — Metal Creativo Chile`
    : `📋 Confirmación de Pedido e Instrucciones de Pago #${orderNumber} — Metal Creativo Chile`;

  return sendRawEmail({
    to: customer.email,
    subject,
    html: renderReceiptHtml({ order, customer, items, isPaid, isTransfer })
  });
}

async function notifyAdminSale({ order, customer, items, isPaid, isTransfer }) {
  const orderNumber = order.order_number || order.id?.slice(0, 8).toUpperCase() || '';
  const subject = isPaid
    ? `🚨 [PAGO APROBADO $${formatCLP(order.total_amount)}] Orden #${orderNumber} - ${customer.full_name}`
    : `🔔 [TRANSFERENCIA PENDIENTE $${formatCLP(order.total_amount)}] Orden #${orderNumber} - ${customer.full_name}`;

  return sendRawEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject,
    html: renderAdminAlertHtml({ order, customer, items, isPaid, isTransfer })
  });
}

function renderShippingDispatchHtml({ order, customer, trackingNumber, carrier = 'Starken' }) {
  const orderNumber = escapeHtml(String(order.order_number || order.id?.slice(0, 8).toUpperCase() || ''));
  const customerName = escapeHtml(customer.full_name || 'Estimado Cliente');
  const isChilexpress = carrier.toLowerCase().includes('chilexpress');
  const trackingUrl = isChilexpress
    ? `https://www.chilexpress.cl/seguimiento?orden=${encodeURIComponent(trackingNumber)}`
    : `https://www.starken.cl/seguimiento?codigo=${encodeURIComponent(trackingNumber)}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Tu Pedido va en Camino — Metal Creativo</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07080b; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #07080b; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #11141a; border: 1px solid #272a33; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          <tr>
            <td style="background-color: #07080b; padding: 0; text-align: center; border-bottom: 2px solid #ff6a00; line-height: 0;">
              <img src="https://metalcreativo.cl/images/email-banner-animated.gif" alt="Metal Creativo Chile" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0; outline: none; margin: 0 auto;">
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 24px; text-align: center;">
              <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #059669; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                🚀 Pedido Despachado
              </span>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 16px 0 8px 0;">¡Tu pedido #${orderNumber} ya va en camino!</h1>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">
                Hola <strong>${customerName}</strong>, tu producto fue fabricado, revisado y entregado a <strong>${escapeHtml(carrier)}</strong> para su traslado a tu destino.
              </p>

              <!-- CUADRO DE TRACKING -->
              <div style="background-color: #0c0e12; border: 1px solid #ff6a00; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 6px 0;">Número de Orden de Flete (${escapeHtml(carrier)}):</p>
                <p style="color: #ff6a00; font-size: 24px; font-weight: 900; letter-spacing: 2px; margin: 0 0 16px 0;">${escapeHtml(trackingNumber)}</p>
                <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #ff6a00; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 6px; box-shadow: 0 4px 15px rgba(255, 106, 0, 0.4);">
                  📦 Rastrear Mi Paquete en ${escapeHtml(carrier)}
                </a>
              </div>

              <!-- BOTON DE WHATSAPP -->
              <div style="margin-top: 24px;">
                <a href="https://wa.me/56954922608?text=Hola%20Metal%20Creativo!%20Tengo%20una%20consulta%20sobre%20mi%20despacho%20%23${orderNumber}" target="_blank" style="color: #94a3b8; text-decoration: underline; font-size: 12px;">
                  💬 ¿Tienes dudas sobre tu entrega? Escríbenos a WhatsApp
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0a0c10; padding: 18px 24px; text-align: center; border-top: 1px solid #1e293b; color: #64748b; font-size: 11px;">
              <p style="margin: 0;">Metal Creativo Chile • Quillota, Valparaíso • <a href="https://metalcreativo.cl" style="color: #ff6a00; text-decoration: none;">metalcreativo.cl</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function notifyShippingDispatch({ order, customer, trackingNumber, carrier = 'Starken' }) {
  if (!customer?.email || !trackingNumber) return null;
  const orderNumber = order.order_number || order.id?.slice(0, 8).toUpperCase() || '';
  const subject = `🚀 Tu Pedido #${orderNumber} ha sido Despachado por ${carrier} — Metal Creativo`;

  return sendRawEmail({
    to: customer.email,
    subject,
    html: renderShippingDispatchHtml({ order, customer, trackingNumber, carrier })
  });
}

module.exports = {
  sendRawEmail,
  notifyCustomerOrder,
  notifyAdminSale,
  notifyShippingDispatch,
  renderReceiptHtml,
  renderAdminAlertHtml,
  renderShippingDispatchHtml
};
