# Copia de pruebas de Metal Creativo

Estado: copia local creada y verificada; integración de pagos de prueba pendiente de acceso.

- Copia: `.vercel/sandbox-site/` (ignorada por Git).
- Dirección local: http://127.0.0.1:3101/
- Arranque: `node .vercel/sandbox-site/start-local.cjs`.
- Preparación reproducible: `node scripts/prepare-sandbox.cjs`. Se niega a sobrescribir una copia existente y sus claves.
- Configuración privada: `.vercel/sandbox-site/.env.sandbox.local`.
- No se copiaron claves de producción, pedidos, datos de clientes ni el enlace al proyecto Vercel publicado.
- Aviso visual de pruebas, noindex y WhatsApp desactivado en la copia.
- Guardas: rechazan la base de producción, el dominio real, modo live y cuentas Mercado Pago APP_USR que no sean de prueba.

Verificación realizada:

- Inicio y checkout HTTP 200; recorrido de catálogo a checkout en Chrome.
- Barra: $65.000 + despacho RM $4.990 = $69.990.
- Archivos privados y código del servidor: HTTP 404 desde el navegador.
- Administración sin credencial: HTTP 401.
- Inicio de pago sin configuración aislada: HTTP 503 SANDBOX_SITE_REQUIRED, sin llamar al proveedor.
- 40 pruebas existentes de pedidos, pagos y conexiones aprobadas; 3 pruebas adicionales de aislamiento aprobadas.

Pendiente para prueba completa con Mercado Pago:

1. Completar nueva verificación de identidad solicitada por Mercado Pago en Chrome.
2. Obtener credenciales de vendedor y comprador de prueba. No reutilizar las de producción.
3. Elegir organización/acceso para base aislada. Los conectores disponibles no muestran la base de producción hixuaqdkiyirntgvzxff. No reutilizar proyectos de otras tiendas.
4. Consultar costo antes de crear recursos. No se contrataron servicios ni se publicó la copia.
5. Aplicar estructura a base vacía, configurar dominio HTTPS de pruebas y webhook; verificar compra nueva, rechazo, abandono e idempotencia.

El sitio de producción no fue modificado en esta fase. La copia local todavía no demuestra un pago completo ni recepción de un webhook de una compra nueva.

## Avance 2026-10-15

- Proyecto de pruebas creado por el usuario: etbetdtsqxcljvqfpetk, organización zhsprhptcayazpaqdszd (Metal Creativo), plan Free, región us-west-2.
- Esquema base y migración de integridad instalados en una transacción mediante el editor SQL del proyecto vacío.
- Verificado por SQL: 10 tablas, todas con RLS; 0 pedidos, 0 clientes; anon sin permiso de ejecutar backend_apply_payment.
- Clave secret preexistente del proyecto guardada solo en .vercel/sandbox-site/.env.sandbox.local. Conexión API de servidor confirmada: orders count 0.
- Perfil Chrome Metal Creativo conectado mediante extensión ed0e724b-9d72-42dc-a9a2-6b6537235845.
- Pendiente: iniciar Mercado Pago en este perfil y activar credenciales de prueba. Se dejó la pestaña de inicio de sesión para el usuario.
- Pendiente: despliegue HTTPS independiente y pruebas completas del checkout. No se modificó producción.
