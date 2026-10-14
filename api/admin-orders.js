const { getDatabase } = require('../lib/database');
const { readJson, HttpError, sendError, installHttp } = require('../lib/http');
const { requireAdmin } = require('../lib/admin-auth');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NEXT_STATUS = { pending: 'cancelled', paid: 'preparing', preparing: 'shipped', shipped: 'delivered' };

module.exports = async (req, res) => {
  installHttp(req, res);
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', error: 'Método no permitido.' });
  }
  try {
    const body = await readJson(req);
    if (typeof body.order_id !== 'string' || !UUID.test(body.order_id) || Object.keys(body).some(key => !['order_id', 'status', 'tracking_number'].includes(key))) {
      throw new HttpError(400, 'INVALID_ORDER_UPDATE');
    }
    const hasStatus = Object.hasOwn(body, 'status');
    const hasTracking = Object.hasOwn(body, 'tracking_number');
    if ((!hasStatus && !hasTracking) || (hasStatus && !['preparing', 'shipped', 'delivered', 'cancelled'].includes(body.status))) {
      throw new HttpError(400, 'INVALID_ORDER_UPDATE');
    }
    let tracking;
    if (hasTracking) {
      if (typeof body.tracking_number !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9 ._/-]{0,99}$/.test(body.tracking_number.trim())) {
        throw new HttpError(400, 'INVALID_TRACKING_NUMBER');
      }
      tracking = body.tracking_number.trim();
    }
    const database = getDatabase();
    const existing = await database.from('orders').select('id,status,tracking_number,payment_id,updated_at').eq('id', body.order_id).maybeSingle();
    if (existing.error) throw new HttpError(503, 'DATABASE_UNAVAILABLE');
    if (!existing.data) throw new HttpError(404, 'ORDER_NOT_FOUND');
    const order = existing.data;
    const status = hasStatus ? body.status : order.status;
    if (hasStatus && status !== order.status && NEXT_STATUS[order.status] !== status) {
      throw new HttpError(409, 'INVALID_ORDER_TRANSITION');
    }
    if (hasTracking && !['shipped', 'delivered'].includes(status)) {
      throw new HttpError(409, 'INVALID_ORDER_TRANSITION');
    }
    if (status === 'shipped' && !(tracking || order.tracking_number)) {
      throw new HttpError(400, 'TRACKING_NUMBER_REQUIRED');
    }
    const updates = { updated_at: new Date().toISOString() };
    if (hasStatus) updates.status = status;
    if (hasTracking) updates.tracking_number = tracking;
    // Include the version so simultaneous edits to tracking cannot overwrite each other.
    let update = database.from('orders').update(updates).eq('id', body.order_id).eq('status', order.status);
    if (order.updated_at !== null && order.updated_at !== undefined) update = update.eq('updated_at', order.updated_at);
    const changed = await update.select('id,status,tracking_number,updated_at').maybeSingle();
    if (changed.error) throw new HttpError(503, 'DATABASE_UNAVAILABLE');
    if (!changed.data) throw new HttpError(409, 'ORDER_CHANGED');
    return res.status(200).json({ success: true, order: changed.data });
  } catch (error) {
    return sendError(res, error);
  }
};
