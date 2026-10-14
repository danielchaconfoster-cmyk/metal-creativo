const { getDatabase } = require('../lib/database');
const { HttpError, sendError, installHttp } = require('../lib/http');
const { requireAdmin } = require('../lib/admin-auth');

const LIST_LIMIT = 100;
const ORDER_FIELDS = 'id,status,total_amount,shipping_method,payment_method,tracking_number,channel,created_at,customers(full_name,phone,comuna),order_items(product_name,quantity)';
const LEAD_FIELDS = 'id,name,phone,product,commune,region,status,source,estimated_shipping,last_message,created_at,updated_at';

function orderDto(order) {
  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  return {
    id: order.id,
    customer_name: customer?.full_name || '',
    phone: customer?.phone || '',
    product_name: items.map(item => `${Number(item.quantity) > 1 ? `${item.quantity} × ` : ''}${item.product_name || ''}`).filter(Boolean).join(', '),
    channel: order.channel || (order.payment_method === 'transferencia' ? 'web_transferencia' : 'web_mercadopago'),
    total_amount: Number(order.total_amount),
    shipping_commune: customer?.comuna || '',
    shipping_method: order.shipping_method,
    payment_method: order.payment_method,
    status: order.status,
    tracking_number: order.tracking_number || null,
    created_at: order.created_at
  };
}

function totalNumber(value) {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
    throw new HttpError(503, 'DATABASE_UNAVAILABLE');
  }
  return Number(value);
}

function parseTotals(data) {
  const totals = Array.isArray(data) ? data[0] : data;
  if (!totals || typeof totals !== 'object' || !totals.channels) throw new HttpError(503, 'DATABASE_UNAVAILABLE');
  return {
    totalOrders: totalNumber(totals.total_orders),
    totalRevenue: totalNumber(totals.total_revenue),
    averageTicket: totalNumber(totals.average_ticket),
    leadCount: totalNumber(totals.lead_count),
    wonLeads: totalNumber(totals.won_leads),
    channels: {
      web: totalNumber(totals.channels.web),
      mercadolibre: totalNumber(totals.channels.mercadolibre),
      whatsapp: totalNumber(totals.channels.whatsapp)
    }
  };
}

function emptyMeta(source) {
  return {
    campaignName: '', status: source, dailyBudget: null,
    currencyMetadata: { currency: null, budgetMinorUnitScale: null, budgetConfirmed: false, dailyBudgetRaw: null },
    spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0,
    conversationsStarted: 0, costPerConversation: 0,
    dateRange: '', source
  };
}

function metaNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

async function metaMetrics() {
  const token = process.env.META_ACCESS_TOKEN;
  const campaignId = process.env.META_CAMPAIGN_ID;
  if (!token || !campaignId) return emptyMeta('not_configured');
  if (!/^\d{1,40}$/.test(campaignId)) return emptyMeta('unavailable');
  const version = process.env.META_GRAPH_VERSION || 'v21.0';
  if (!/^v\d{1,2}\.\d{1,2}$/.test(version)) return emptyMeta('unavailable');
  const base = `https://graph.facebook.com/${version}/${campaignId}`;
  const options = () => ({
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000), redirect: 'error'
  });
  try {
    const [campaignResponse, insightResponse] = await Promise.all([
      fetch(`${base}?fields=name,status,daily_budget`, options()),
      fetch(`${base}/insights?fields=impressions,clicks,spend,cpc,ctr,actions,cost_per_action_type&date_preset=maximum`, options())
    ]);
    if (!campaignResponse.ok || !insightResponse.ok) return emptyMeta('unavailable');
    const [campaign, insights] = await Promise.all([campaignResponse.json(), insightResponse.json()]);
    if (campaign.error || insights.error || !Array.isArray(insights.data) || typeof campaign.name !== 'string' || typeof campaign.status !== 'string') {
      return emptyMeta('unavailable');
    }
    const item = insights.data[0] || {};
    const conversation = Array.isArray(item.actions) ? item.actions.find(action => action.action_type === 'onsite_conversion.messaging_conversation_started_7d') : null;
    const cost = Array.isArray(item.cost_per_action_type) ? item.cost_per_action_type.find(action => action.action_type === 'onsite_conversion.messaging_conversation_started_7d') : null;
    return {
      campaignName: campaign.name, status: campaign.status,
      // Provider budget integers need a verified currency scale before being shown as CLP.
      dailyBudget: null,
      currencyMetadata: {
        currency: null, budgetMinorUnitScale: null, budgetConfirmed: false,
        dailyBudgetRaw: typeof campaign.daily_budget === 'string' && /^\d+$/.test(campaign.daily_budget) ? campaign.daily_budget : null
      },
      spend: metaNumber(item.spend), impressions: metaNumber(item.impressions),
      clicks: metaNumber(item.clicks), ctr: metaNumber(item.ctr), cpc: metaNumber(item.cpc),
      conversationsStarted: metaNumber(conversation?.value),
      costPerConversation: metaNumber(cost?.value),
      dateRange: 'Desde el inicio de la campaña', source: 'live_meta_graph_api'
    };
  } catch (_) {
    return emptyMeta('unavailable');
  }
}

async function paymentAccountStatus() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) return 'not_configured';
  if (token.startsWith('TEST-')) return 'sandbox_account';
  try {
    const response = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000), redirect: 'error'
    });
    if (!response.ok) return 'unavailable';
    const account = await response.json();
    if (!account.id || !Array.isArray(account.tags)) return 'unavailable';
    return account.tags.includes('test_user') ? 'sandbox_account' : 'connected_live';
  } catch (_) { return 'unavailable'; }
}

module.exports = async (req, res) => {
  installHttp(req, res);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', error: 'Método no permitido.' });
  }
  try {
    const database = getDatabase();
    const [orders, leads, aggregates, metaAds, mercadoPagoStatus] = await Promise.all([
      database.from('orders').select(ORDER_FIELDS).order('created_at', { ascending: false }).limit(LIST_LIMIT),
      database.from('leads').select(LEAD_FIELDS).order('created_at', { ascending: false }).limit(LIST_LIMIT),
      database.rpc('backend_admin_totals'),
      metaMetrics(),
      paymentAccountStatus()
    ]);
    if (orders.error || leads.error || aggregates.error || !Array.isArray(orders.data) || !Array.isArray(leads.data)) {
      throw new HttpError(503, 'DATABASE_UNAVAILABLE');
    }
    // Database aggregates cover every row; the limits affect only the tables shown in the panel.
    const totals = parseTotals(aggregates.data);
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        supabaseStatus: 'connected',
        metaApiStatus: metaAds.source === 'live_meta_graph_api' ? 'connected_live' : metaAds.source,
        mercadoPagoStatus
      },
      metaAds,
      kpis: {
        totalRevenue: totals.totalRevenue, totalOrders: totals.totalOrders,
        averageTicket: totals.averageTicket, adSpend: metaAds.spend,
        roas: `${metaAds.spend > 0 ? (totals.totalRevenue / metaAds.spend).toFixed(1) : '0.0'}x`,
        whatsappLeads: metaAds.conversationsStarted,
        costPerLead: `$${metaAds.costPerConversation} CLP`,
        conversionRate: `${totals.leadCount > 0 ? (totals.wonLeads / totals.leadCount * 100).toFixed(1) : '0.0'}%`,
        channels: totals.channels
      },
      orders: orders.data.map(orderDto), leads: leads.data,
      listLimits: { orders: LIST_LIMIT, leads: LIST_LIMIT }
    });
  } catch (error) {
    return sendError(res, error);
  }
};
