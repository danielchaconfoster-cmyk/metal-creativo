'use strict';
const {getDatabase}=require('../lib/database');
const {installHttp,readJson,HttpError,sendError}=require('../lib/http');
const {checkOrigin,rateLimit,createOrder,setAccessCookie}=require('../lib/orders');
const {notifyCustomerOrder,notifyAdminSale}=require('../lib/email');
module.exports=async(req,res)=>{
 installHttp(req,res);
 if(req.method!=='POST')return res.status(405).json({error:'Metodo no permitido'});
 try{
  checkOrigin(req);const db=getDatabase(),body=await readJson(req);
  if(!['transferencia','whatsapp'].includes(body.payment_method))throw new HttpError(400,'INVALID_PAYMENT_METHOD');
  await rateLimit(req,db,'orders');
  const {order,token}=await createOrder(req,db,body,'transferencia',body.payment_method==='whatsapp'?'whatsapp_bot':'web_transferencia');
  setAccessCookie(res,order,token);
  try{
   await Promise.allSettled([
    notifyCustomerOrder({order,customer:body.customer,items:body.items,isPaid:false,isTransfer:true}),
    notifyAdminSale({order,customer:body.customer,items:body.items,isPaid:false,isTransfer:true})
   ]);
  }catch(_){}
  return res.status(201).json({success:true,order_id:order.id,order_number:order.order_number,status:order.status,total_amount:order.total_amount});
 }catch(error){return sendError(res,error);}
};
