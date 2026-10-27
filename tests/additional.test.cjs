
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root='C:/Users/usuario/Desktop/Nacho proyecto';
const req=require('node:module').createRequire(root+'/tests/frontend-connections.test.js');
const source=fs.readFileSync(root+'/tests/frontend-connections.test.js','utf8').split("\ntest(")[0];
const context=vm.createContext({require:req,__dirname:root+'/tests',setTimeout,console,TextEncoder,URL,URLSearchParams,Uint8Array,Intl,Date});
vm.runInContext(source+'\nglobalThis.harness={load,reply,checkout,ORDER_ID};',context);
const {load,reply,checkout,ORDER_ID}=context.harness;
const {renderReceiptHtml,renderAdminAlertHtml}=require(root+'/lib/email.js');
const {calculateShipping}=require(root+'/api/shipping-quote.js');
const base={order:{id:ORDER_ID,total_amount:100000,status:'pending',shipping_method:'starken'},customer:{full_name:'Cliente de prueba',email:'synthetic@example.invalid'},items:[{id:'fogon',qty:1,quantity:1}],isPaid:false,isTransfer:true};
test('receipt generated from actual checkout request must describe the fogon at its canonical price',()=>{
const html=renderReceiptHtml(base);assert.ok(html.includes('$100.000 CLP'),'Expected fogon line price 100000; request payload only carries id and qty');
assert.ok(!html.includes('<strong>Barra de Remolque 1.8m</strong>'),'Fogon must not be labelled as a bar');
});
test('paid order receipt must not claim that the goods have been delivered',()=>{
const html=renderReceiptHtml({...base,isPaid:true,isTransfer:false});assert.ok(!html.includes('https://schema.org/OrderDelivered'));
});
test('checkout survives malformed persisted cart JSON',()=>{
assert.doesNotThrow(()=>load('checkout',()=>{}, {localStorage:{mc_cart:'{broken'}}));
});
test('pending Mercado Pago return remains on status screen for reconciliation',async()=>{
const s=load('checkout-success',()=>reply(200,{success:true,order:{id:ORDER_ID,order_number:999,status:'pending',payment_method:'mercadopago',currency:'CLP',total_amount:65000}}),{search:'?order_id='+ORDER_ID+'&status=pending'});
await s.app.init();assert.equal(s.window.location.replaced,'','Must wait/poll instead of returning to checkout');
});
test('checkout department must not be duplicated as street number',async()=>{
const s=checkout(()=>reply(503,{error:'Synthetic stop'}));s.app.direccion='Calle de prueba 123';s.app.depto='502';await s.app.submitOrder();
assert.notEqual(s.calls[0].body.customer.address_number,'502');
});
test('shipping recognises the actual region value emitted by checkout',()=>{
assert.equal(calculateShipping('Región de Magallanes','fogon').region,'Magallanes');
});
test('unknown shipping destination must not silently quote Santiago',()=>{
assert.notEqual(calculateShipping('Comuna inexistente de prueba').region,'Región Metropolitana');
});
test('all valid aliases of the same fogon use the same shipping estimate',()=>{
assert.equal(calculateShipping('Temuco','fogon').couriers.starken.cost,calculateShipping('Temuco','fogon_bioetanol').couriers.starken.cost);
});

