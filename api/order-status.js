'use strict';
const {getDatabase}=require('../lib/database');
const {installHttp,singleHeader,HttpError,sendError}=require('../lib/http');
const {UUID,hash}=require('../lib/orders');
module.exports=async(req,res)=>{
 installHttp(req,res);
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Metodo no permitido'});
 try{
  const id=req.query?.order_id;
  if(typeof id!=='string'||!UUID.test(id))throw new HttpError(400,'INVALID_ORDER');
  const cookies=(singleHeader(req,'cookie')||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith('mc_order_access='));
  const credential=cookies.length===1?cookies[0].slice('mc_order_access='.length).split('.'):[];
  const token=singleHeader(req,'x-order-token') || (credential[0]===id?credential[1]:'');
  if(!token||!/^[a-f0-9]{64}$/.test(token))throw new HttpError(404,'ORDER_NOT_FOUND');
  const {data,error}=await getDatabase().from('orders').select('id,order_number,status,total_amount,currency,payment_method,tracking_number,paid_at').eq('id',id).eq('public_token_hash',hash(token)).maybeSingle();
  if(error)throw new HttpError(503,'DATABASE_UNAVAILABLE');
  if(!data)throw new HttpError(404,'ORDER_NOT_FOUND');
  return res.status(200).json({success:true,order:data});
 }catch(error){return sendError(res,error);}
};
