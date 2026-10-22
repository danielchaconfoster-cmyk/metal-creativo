'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { renderReceiptHtml, renderAdminAlertHtml, sendRawEmail, notifyCustomerOrder, notifyAdminSale } = require('../lib/email');

test('email templates: renders customer receipt with correct items, totals, and branding', () => {
  const html = renderReceiptHtml({
    order: { order_number: 'MC-2026-9999', total_amount: 69990, shipping_method: 'rm_express' },
    customer: { full_name: 'Carlos Muñoz', rut: '18.123.456-7', phone: '+56912345678', address_street: 'Av. Libertador', address_number: '123', comuna: 'Santiago', region: 'RM' },
    items: [{ title: 'Barra de Remolque Desarmable 1.8m', quantity: 1, unit_price: 65000 }],
    isPaid: true,
    isTransfer: false
  });

  assert.ok(html.includes('MC-2026-9999'), 'HTML includes order number');
  assert.ok(html.includes('Carlos Muñoz'), 'HTML includes customer name');
  assert.ok(html.includes('Barra de Remolque Desarmable 1.8m'), 'HTML includes product title');
  assert.ok(html.includes('69.990'), 'HTML includes formatted total');
  assert.ok(html.includes('Pago Aprobado'), 'HTML indicates approved status');
  assert.ok(html.includes('metalcreativo.cl'), 'HTML includes official domain');
});

test('email templates: renders transfer instructions when order is pending transfer', () => {
  const html = renderReceiptHtml({
    order: { order_number: 'MC-2026-8888', total_amount: 65000, shipping_method: 'starken_agency' },
    customer: { full_name: 'Andrea Soto', rut: '19.987.654-3', phone: '+56987654321', comuna: 'Quillota', region: 'Valparaíso' },
    items: [{ title: 'Barra de Remolque Desarmable 1.8m', quantity: 1, unit_price: 65000 }],
    isPaid: false,
    isTransfer: true
  });

  assert.ok(html.includes('Pendiente de Transferencia'), 'HTML includes pending badge');
  assert.ok(html.includes('Datos Oficiales para Transferencia Bancaria'), 'HTML includes transfer block');
  assert.ok(html.includes('MC-2026-8888'), 'HTML includes order number reference in instructions');
});

test('email templates: renders admin alert with order details and 1-click WhatsApp link', () => {
  const html = renderAdminAlertHtml({
    order: { order_number: 'MC-2026-7777', total_amount: 65000, shipping_method: 'starken_agency' },
    customer: { full_name: 'Felipe Gómez', rut: '15.234.567-8', phone: '+56999887766', email: 'felipe@example.com', address_street: 'Los Aromos', address_number: '456', comuna: 'Concepción', region: 'Biobío' },
    items: [{ title: 'Barra de Remolque Desarmable 1.8m', quantity: 1, unit_price: 65000 }],
    isPaid: true,
    isTransfer: false
  });

  assert.ok(html.includes('NUEVA VENTA REGISTRADA'), 'Admin alert contains banner');
  assert.ok(html.includes('Felipe Gómez'), 'Admin alert contains buyer name');
  assert.ok(html.includes('wa.me/56999887766'), 'Admin alert contains direct WhatsApp link with clean phone');
});

test('email delivery: sendRawEmail safely returns null without network calls when RESEND_API_KEY is not set', async () => {
  const originalKey = process.env.RESEND_API_KEY;
  try {
    delete process.env.RESEND_API_KEY;
    const result = await sendRawEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' });
    assert.equal(result, null, 'Must return null in absence of RESEND_API_KEY');

    const customerRes = await notifyCustomerOrder({ order: { id: '123' }, customer: { email: 'client@example.com' }, items: [] });
    assert.equal(customerRes, null, 'Customer notify returns null when unconfigured');

    const adminRes = await notifyAdminSale({ order: { id: '123' }, customer: { email: 'client@example.com' }, items: [] });
    assert.equal(adminRes, null, 'Admin notify returns null when unconfigured');
  } finally {
    if (originalKey !== undefined) process.env.RESEND_API_KEY = originalKey;
  }
});
