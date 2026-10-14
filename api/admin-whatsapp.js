'use strict';
const { requireAdmin } = require('../lib/admin-auth');
const { installHttp, readJson, HttpError, sendError } = require('../lib/http');
const { getDatabase, rpc } = require('../lib/database');
const { processMessage, phoneId } = require('./whatsapp-webhook');

module.exports = async (req,res) => {
  installHttp(req,res);
  res.setHeader('Cache-Control','no-store');
  if (!requireAdmin(req,res)) return;
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({success:false,code:'METHOD_NOT_ALLOWED'});
  try {
    const db = getDatabase();
    if (req.method === 'GET') {
      const {data,error} = await db.from('whatsapp_messages').select('id,status,error_code,sent_count,retry_count,retry_after,created_at,updated_at')
        .in('status',['failed','retryable','uncertain','awaiting_configuration']).order('updated_at',{ascending:false}).limit(20);
      if (error) throw new HttpError(503,'DATABASE_UNAVAILABLE');
      return res.status(200).json({success:true,messages:data});
    }
    const body = await readJson(req);
    if (typeof body.message_id !== 'string' || !/^[A-Za-z0-9._:=+\/-]{1,200}$/.test(body.message_id) ||
      Object.keys(body).some(key=>!['message_id','confirm_delivery_uncertain'].includes(key)) ||
      (body.confirm_delivery_uncertain !== undefined && typeof body.confirm_delivery_uncertain !== 'boolean')) throw new HttpError(400,'INVALID_RETRY');
    if (!process.env.META_ACCESS_TOKEN?.trim() || !phoneId()) throw new HttpError(503,'WHATSAPP_NOT_CONFIGURED');
    const record = await db.from('whatsapp_messages').select('id,phone,text,customer_name,status').eq('id',body.message_id).maybeSingle();
    if (record.error) throw new HttpError(503,'DATABASE_UNAVAILABLE');
    if (!record.data) throw new HttpError(404,'MESSAGE_NOT_FOUND');
    if (record.data.status === 'uncertain' && body.confirm_delivery_uncertain !== true) throw new HttpError(409,'DELIVERY_CONFIRMATION_REQUIRED','La entrega anterior es incierta. Confirma el riesgo de duplicar la respuesta antes de reintentar.');
    const queued = await rpc(db,'backend_requeue_whatsapp',{p_id:body.message_id,p_confirm_delivery_uncertain:body.confirm_delivery_uncertain===true});
    if (queued !== true) throw new HttpError(409,'MESSAGE_NOT_RETRYABLE');
    const status = await processMessage({id:record.data.id,phone:record.data.phone,text:record.data.text,name:record.data.customer_name},db);
    if (status !== 'completed') throw new HttpError(503,'MESSAGE_NOT_COMPLETED');
    return res.status(200).json({success:true,message_id:body.message_id,status});
  } catch (error) { return sendError(res,error); }
};
