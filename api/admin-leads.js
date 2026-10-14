const { getDatabase } = require('../lib/database');
const { readJson, HttpError, sendError, installHttp } = require('../lib/http');
const { requireAdmin } = require('../lib/admin-auth');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ['new', 'negotiating', 'quoted', 'won', 'lost'];

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
    if (typeof body.lead_id !== 'string' || !UUID.test(body.lead_id) || !STATUSES.includes(body.status) || Object.keys(body).some(key => !['lead_id', 'status'].includes(key))) {
      throw new HttpError(400, 'INVALID_LEAD_UPDATE');
    }
    const changed = await getDatabase().from('leads').update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', body.lead_id).select('id,status,updated_at').maybeSingle();
    if (changed.error) throw new HttpError(503, 'DATABASE_UNAVAILABLE');
    if (!changed.data) throw new HttpError(404, 'LEAD_NOT_FOUND');
    return res.status(200).json({ success: true, lead: changed.data });
  } catch (error) {
    return sendError(res, error);
  }
};
