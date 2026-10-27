'use strict';
const crypto = require('node:crypto');
const { HttpError, singleHeader } = require('./http');
const { rpc } = require('./database');
const CATALOG = Object.freeze({
 barra_remolque:{name:'Barra de Remolque Desarmable 1.8m (Ley MTT 55/2025)',price:65000},
 lanza_remolque:{name:'Barra de Remolque Desarmable 1.8m (Ley MTT 55/2025)',price:65000},
 cocinilla_acero:{name:'Cocinilla Estructural de Acero',price:35000},
 fogon:{name:'Fogon de Mesa a Bioetanol Ecologico',price:100000},
 fogon_bioetanol:{name:'Fogon de Mesa a Bioetanol Ecologico',price:100000},
 fogon_acero:{name:'Fogón de Acero 50cm para Exterior',price:120000}
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function text(value,max,required=true) {
 if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim()) || /[\x00-\x1f\x7f]/.test(value)) throw new HttpError(400,'INVALID_CUSTOMER');
 return value.trim();
}
function validateRut(value) {
 const rut=value.replace(/[.\-]/g,'').toUpperCase();
 if (/^\d{7,9}[\dK]$/.test(rut)) {
  let sum=0,multiple=2;
  for (let i=rut.length-2;i>=0;i--) {sum+=multiple*Number(rut[i]);multiple=multiple<7?multiple+1:2;}
  const digit=11-sum%11;
  return rut.at(-1)===(digit===11?'0':digit===10?'K':String(digit));
 }
 return /^[A-Z0-9]{6,15}$/.test(rut);
}
function canonicalBase() {
 let parsed;try {parsed=new URL(process.env.SITE_URL || process.env.PUBLIC_BASE_URL || 'https://metalcreativo.cl');} catch (_) {throw new HttpError(503,'SITE_NOT_CONFIGURED');}
 if (parsed.protocol!=='https:' || parsed.username || parsed.password || parsed.pathname!=='/' || parsed.search || parsed.hash) throw new HttpError(503,'SITE_NOT_CONFIGURED');
 return parsed.origin;
}
function checkOrigin(req) {
 const origin=singleHeader(req,'origin');
 if (origin && origin!==canonicalBase() && !(!process.env.VERCEL && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) throw new HttpError(403,'ORIGIN_NOT_ALLOWED');
 if (!origin && singleHeader(req,'sec-fetch-site')==='cross-site') throw new HttpError(403,'ORIGIN_NOT_ALLOWED');
}
function ipHash(req) {
 const forwarded=process.env.VERCEL?singleHeader(req,'x-forwarded-for')?.split(',')[0].trim():'';
 return hash(forwarded || req.socket?.remoteAddress || 'unknown');
}
async function rateLimit(req,db,scope,limit=30,seconds=600) {
 const allowed=await rpc(db,'backend_consume_rate_limit',{p_scope:scope,p_key:ipHash(req),p_limit:limit,p_window_seconds:seconds});
 if (allowed!==true) throw new HttpError(429,'RATE_LIMITED','Demasiadas solicitudes. Espera unos minutos.');
}
function normalizeCheckout(body) {
 const raw=body.customer;
 if (!raw || typeof raw!=='object' || Array.isArray(raw)) throw new HttpError(400,'INVALID_CUSTOMER');
 const customer={};
 for (const [key,max] of Object.entries({rut:20,full_name:255,email:255,phone:50,region:100,comuna:100,address_street:300,address_number:50})) customer[key]=text(raw[key],max);
 customer.address_extra=text(raw.address_extra??'',300,false);customer.email=customer.email.toLowerCase();
 if (!validateRut(customer.rut) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) || !/^\+?[0-9 ()-]{7,30}$/.test(customer.phone)) throw new HttpError(400,'INVALID_CUSTOMER');
 if (!Array.isArray(body.items) || body.items.length<1 || body.items.length>10) throw new HttpError(400,'INVALID_ITEMS');
 const items=body.items.map(item=>{
  if (!item || typeof item.id!=='string' || !Object.hasOwn(CATALOG,item.id)) throw new HttpError(400,'INVALID_PRODUCT');
  if (Object.hasOwn(item,'qty') && Object.hasOwn(item,'quantity') && item.qty!==item.quantity) throw new HttpError(400,'INVALID_QUANTITY');
  const quantity=Object.hasOwn(item,'qty')?item.qty:Object.hasOwn(item,'quantity')?item.quantity:1;
  if (typeof quantity!=='number' || !Number.isInteger(quantity) || quantity<1 || quantity>10) throw new HttpError(400,'INVALID_QUANTITY');
  return {id:item.id,title:CATALOG[item.id].name,quantity,unit_price:CATALOG[item.id].price,currency_id:'CLP'};
 });
 const shippingMethod=body.shipping_method??'starken';
 if (!['rm_express','starken','starken_por_pagar'].includes(shippingMethod)) throw new HttpError(400,'INVALID_SHIPPING');
 const shippingCost=shippingMethod==='rm_express'?4990:0;
 if (shippingCost && !/metropolitana|santiago/i.test(customer.region)) throw new HttpError(400,'INVALID_SHIPPING_REGION');
 return {customer,items,shippingMethod,shippingCost,total:items.reduce((sum,item)=>sum+item.quantity*item.unit_price,shippingCost)};
}
function idempotencyKey(req,body) {
 const header=singleHeader(req,'idempotency-key');
 if (header && body.idempotency_key && header!==body.idempotency_key) throw new HttpError(400,'INVALID_IDEMPOTENCY_KEY');
 const key=header || body.idempotency_key || crypto.randomUUID();
 if (typeof key!=='string' || !/^[A-Za-z0-9_-]{16,128}$/.test(key)) throw new HttpError(400,'INVALID_IDEMPOTENCY_KEY');
 return key;
}
async function createOrder(req,db,body,paymentMethod,channel) {
 const normalized=normalizeCheckout(body),key=idempotencyKey(req,body),secret=process.env.ORDER_ACCESS_SECRET?.trim();
 if (!secret || !/^[\x21-\x7e]{32,512}$/.test(secret)) throw new HttpError(503,'ORDER_ACCESS_NOT_CONFIGURED');
 const token=crypto.createHmac('sha256',secret).update('order:'+key).digest('hex');
 const order=await rpc(db,'backend_create_order',{p_idempotency_key:key,p_request_hash:hash(JSON.stringify({...normalized,paymentMethod,channel})),p_token_hash:hash(token),p_customer:normalized.customer,p_items:normalized.items,p_total:normalized.total,p_shipping_method:normalized.shippingMethod,p_shipping_cost:normalized.shippingCost,p_payment_method:paymentMethod,p_channel:channel,p_ip_hash:ipHash(req),p_user_agent:(singleHeader(req,'user-agent') || '').slice(0,512)});
 if (!order || !UUID.test(order.id)) throw new HttpError(503,'ORDER_NOT_SAVED');
 return {order,normalized,token,key};
}
function setAccessCookie(res,order,token) {
 res.setHeader('Set-Cookie',`mc_order_access=${order.id}.${token}; Path=/api/order-status; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`);
 res.setHeader('Cache-Control','no-store');
}
module.exports={UUID,hash,text,canonicalBase,checkOrigin,ipHash,rateLimit,normalizeCheckout,createOrder,setAccessCookie,validateRut,CATALOG};
