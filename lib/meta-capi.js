'use strict';
const crypto = require('node:crypto');

const META_GRAPH_VERSION = 'v21.0';
const DEFAULT_PIXEL_ID = '1416637987347092';

function hashParam(value) {
  if (!value || typeof value !== 'string') return null;
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return null;
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

function hashPhone(value) {
  if (!value || typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  return crypto.createHash('sha256').update(digits).digest('hex');
}

/**
 * Sends a server-side Purchase event to Meta Conversions API (CAPI).
 * Deduplicates automatically with browser Meta Pixel using event_id = order_id.
 */
async function trackMetaPurchase({ order, customer, amount, paymentId }) {
  const token = process.env.META_ACCESS_TOKEN?.trim();
  const pixelId = process.env.META_PIXEL_ID?.trim() || DEFAULT_PIXEL_ID;
  if (!token || !pixelId) {
    return { ok: false, reason: 'META_NOT_CONFIGURED' };
  }

  const orderId = String(order.order_number || order.id);
  const emailHash = customer?.email ? hashParam(customer.email) : null;
  const phoneHash = customer?.phone ? hashPhone(customer.phone) : null;

  const userData = {};
  if (emailHash) userData.em = [emailHash];
  if (phoneHash) userData.ph = [phoneHash];
  if (customer?.full_name) {
    const parts = customer.full_name.trim().split(/\s+/);
    if (parts[0]) userData.fn = [hashParam(parts[0])];
    if (parts.length > 1) userData.ln = [hashParam(parts.slice(1).join(' '))];
  }
  if (customer?.comuna) userData.ct = [hashParam(customer.comuna)];
  userData.country = [hashParam('cl')];

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: orderId,
        action_source: 'website',
        event_source_url: 'https://metalcreativo.cl/checkout-success',
        user_data: userData,
        custom_data: {
          currency: 'CLP',
          value: Number(amount || order.total_amount || 0),
          order_id: orderId,
          content_type: 'product'
        }
      }
    ]
  };

  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: result };
    }
    return { ok: true, data: result };
  } catch (err) {
    // Fail-safe: CAPI tracking failure must never fail the payment or order status
    return { ok: false, error: err.message };
  }
}

module.exports = {
  trackMetaPurchase,
  hashParam,
  hashPhone
};
