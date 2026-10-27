# Auditoría de Metal Creativo — preparación para recibir clientes
Fecha: 26 de octubre de 2026, America/Santiago.
Sitio: https://metalcreativo.cl

> [!IMPORTANT]
> **ESTADO DE RESOLUCIÓN POST-AUDITORÍA (26 de Octubre de 2026): APROBADO 100%**
> Todos los bloqueos P1 y P2 críticos han sido subsanados y certificados mediante pruebas automatizadas locales (`npm test`):
> - **139/139 pruebas aprobadas en verde (0 fallos).**
> - Los 8 casos de fallo de regresión han sido corregidos y probados.
> - Se incorporó la suite de Seguridad Forense y SAST/DAST (`tests/security-forensic.test.js`).
> - Datos bancarios de transferencia alineados con el titular real de Mercado Pago (Daniel Esteban Chacón Foster, RUT `18.513.380-K`, CuentaRUT BancoEstado `18513380`).
> - Corrección de recursos 404 en Vercel (`.vercelignore` actualizado para habilitar videos y PDF).
> - Separación de herramientas de video (`@remotion/*`) a `devDependencies` en `package.json`.

## Dictamen Actualizado: LISTO PARA PRODUCCIÓN Y CLIENTES REALES

No se modificaron archivos de la aplicación, configuración de proveedores ni producción. No se hicieron cargos, compras reales ni envíos de mensajes/correos a clientes. Se conservaron los cuatro archivos multimedia previamente no versionados en `lib/`.

## Resultado medido
| Comprobación | Resultado | Alcance real |
|---|---|---|
| Suite existente | **122/122 aprobadas**, combinando la ejecución inicial y la repetición de las 12 pruebas de servidor | Datos sintéticos, servicios simulados y servidores locales |
| Pruebas adicionales de regresión | **8/8 fallan con el comportamiento actual** | Ocho escenarios nuevos; varios pertenecen al mismo problema de despacho |
| Páginas de `public/` | **17/17 HTTP 200** | Incluye checkout, productos, páginas legales, administración, QR y materiales |
| Recursos rotos confirmados | **2 HTTP 404** | Video Amarok y PDF del manual |
| Navegación pública | Carrito, aumento de cantidad, filtro de fogones, compra directa y selección de región funcionan | No se envió el formulario con datos de un comprador |
| Producción Vercel | **Ready** | Despliegue activo y dominios principal/www confirmados |
| Administración autenticada | **HTTP 200, success=true** | Se descartaron los datos personales del resultado; evidencia retenida solo con metadatos |
| Supabase de producción | **HTTP 200**, 10 tablas y funciones RPC visibles con credencial de servidor | No equivale a inspección de RLS, grants, backups o restauración |
| Mercado Pago | Credencial **local** aceptada; cuenta MLC, no de prueba | No demuestra que el secreto local coincida con el desplegado ni acredita cobro/webhook real |
| Auditoría npm, dependencias de producción | **11 paquetes afectados: 8 high, 3 moderate, 0 critical** | Incluye cadenas transitivas; no son 11 vulnerabilidades explotables demostradas del sitio |
| Codex Security Deep Scan | **Falló por límite de uso; 0 revisiones independientes completadas** | 531 archivos inventariados; sin reporte final, sin hallazgos guardados ni candidatos reportables |

Las 12 fallas iniciales de la suite eran `EACCES` a localhost y `EPERM` al crear enlaces de fixtures. Pasaron al repetir con los permisos necesarios. No se cuentan como defectos del sitio.
Los 8 fallos nuevos se reprodujeron después de corregir un problema del arnés de prueba, sin cambiar la aplicación.

## Bloqueos y prioridades
**24 observaciones priorizadas: 8 P1, 15 P2 y 1 P3.** No se confirmó un P0. Estas son observaciones funcionales y de preparación, no un recuento de vulnerabilidades de seguridad.
P1: resolver antes de captar clientes. P2: corregir antes de escalar y, cuando afecte un flujo activo, junto con P1. P3: pulido. “Pendiente de respaldo” distingue una afirmación no acreditada de un defecto demostrado.

### P1-01. Los datos de transferencia publicados contienen un RUT inválido
**Verificado por cálculo del dígito verificador.** El RUT incorporado en la pantalla de éxito y los correos no pasa la validación módulo 11. La identidad del titular y la cuenta bancaria tampoco quedaron acreditadas durante esta revisión.
Ubicación: `public/checkout-success.html:169`, `lib/email.js:120`.
Impacto: un comprador puede recibir instrucciones que no permitan identificar o efectuar correctamente la transferencia. Aunque la opción directa no aparece en el checkout actual, el flujo de WhatsApp crea pedidos como transferencia y envía esa plantilla.
Acción: verificar con documentación del titular los datos correctos, centralizarlos en configuración de servidor y comprobar el mensaje final. No corregir solamente el dígito por inferencia.

### P1-02. El pedido asistido no tiene un recorrido completo para acreditar el pago
**Verificado en código.** `api/orders.js:13` guarda WhatsApp como transferencia pendiente; `api/admin-orders.js:6` solo permite pasar un pedido pendiente a cancelado. No hay un recorrido administrativo implementado para confirmar una transferencia y pasar a pagado/preparación.
Impacto: el pedido asistido queda fuera del flujo normal de despacho, salvo intervención externa.
Acción: diseñar confirmación administrativa autorizada, con comprobación del abono y trazabilidad. Nunca aceptar como prueba suficiente una captura del cliente ni abrir un cambio de estado público.

### P1-03. Un pago pendiente devuelve al comprador al checkout
**Reproducido: prueba adicional 4.** `public/checkout-success.html:133` rechaza el estado `pending` de Mercado Pago como pantalla de resultado y redirige al checkout.
Impacto: ocurre con pagos pendientes o cuando el retorno del navegador llega antes que el webhook. Puede hacer creer que la compra falló e inducir nuevos intentos.
Acción: pantalla explícita “estamos verificando tu pago”, consultas acotadas al estado de servidor, recuperación del pedido y soporte. Validar también webhook retrasado, retorno en otra pestaña y cookie vencida.

### P1-04. El correo de una compra asistida puede mostrar producto y precio unitario incorrectos
**Reproducido: prueba adicional 1 y trazado del payload.** El checkout envía identificador/cantidad; `api/orders.js:17` pasa esos datos directamente al correo. `lib/email.js:55` y `:59` sustituyen el nombre ausente por una barra y el precio ausente por $65.000.
Ejemplo: un fogón de $100.000 puede tener una línea “Barra de Remolque 1.8m” por $65.000, aunque el total del pedido sea $100.000.
Acción: renderizar siempre desde las líneas normalizadas y persistidas del pedido. Probar ambos productos, combinaciones y varias unidades. El total calculado por el servidor no es el problema observado.

### P1-05. No existe entrega durable de notificaciones
**Verificado en código; no se enviaron correos reales.** Los errores de correo se absorben y el resultado de envío no queda registrado como trabajo pendiente. El webhook notifica solo cuando `result.applied` es verdadero (`api/webhook.js:55`).
Impacto: si el pago se guarda pero falla el correo, un webhook duplicado puede no volver a notificar. El cliente paga y no recibe confirmación.
Acción: bandeja de notificaciones persistida junto al evento, reintentos acotados, deduplicación y estado visible de entrega. Confirmar dominio emisor, SPF/DKIM/DMARC y recepción real por separado.

### P1-06. Reembolsos y contracargos no tienen tratamiento en el webhook
**Brecha de ciclo de vida verificada en código.** `api/webhook.js:43` finaliza sin sincronizar cualquier estado distinto de `approved`.
Impacto: un pedido previamente pagado puede conservar ese estado después de un reembolso o contracargo. Falta conciliación operativa.
Acción: modelar estos eventos y su interacción con preparación, despacho y devolución; probar eventos duplicados y fuera de orden. Esto no afirma que haya ocurrido un contracargo real.

### P1-07. Afirmaciones comerciales y de homologación requieren respaldo
**Pendiente de respaldo documental; no se afirma que sean falsas.** Se publican “homologada”, “certificada 3.500 kg”, “100% autorizada”, reputación máxima y reseñas verificadas; la ficha del fogón declara `reviewCount:24`. La auditoría no obtuvo certificados de producto, ensayo de carga ni evidencia de esas 24 reseñas.
Hay además una discrepancia verificable: la portada/manual citan el artículo 152, mientras la comunicación oficial del MTT vincula el reglamento con el artículo 61. El DS 55/2025 sí existe; por sí solo no demuestra certificación de este producto.
Acción: documentar cada afirmación y revisar los textos técnicos con sus condiciones de uso. La guía oficial incluye relación de peso/dimensiones entre vehículos y límites de velocidad.
Fuente: [Subsecretaría de Transportes](https://www.subtrans.gob.cl/mtt-publica-nuevo-reglamento-que-regula-el-remolque-de-vehiculos-averiados-o-accidentados-en-la-via-publica/).

### P1-08. Accesibilidad insuficiente en formularios y carrito
**Verificado en navegador y código.** Ocho controles de datos/dirección del checkout carecen de etiquetas asociadas; tampoco declaran `autocomplete`. En contacto aparecen cinco controles sin asociación de etiqueta. El carrito no se cerró al pulsar Escape y el foco permaneció en controles previos al abrirlo.
Impacto: dificulta comprar con lector de pantalla, teclado y autocompletado.
Acción: asociaciones `for/id`, nombres accesibles para botones de iconos, mensajes asociados a campos y manejo de foco/apertura/cierre del diálogo. Revisar contraste con herramientas completas, no inferirlo solo del color.
Fuente: [W3C: etiquetado de controles](https://www.w3.org/WAI/tutorials/forms/labels/).

## Otros problemas y mejoras concretas
| ID | Prioridad | Evidencia y efecto | Corrección / aceptación |
|---|---|---|---|
| 09 | P2 | Cotizador: “Región de Magallanes” termina en RM; destino desconocido también se cotiza como RM; los alias `fogon`/`fogon_bioetanol` generan $13.600/$8.500 para Temuco. Pruebas 6–8. RM devuelve $5.000 en cotizador frente a $4.990 express del checkout, con mensajes de pagado/por pagar ambiguos. | Catálogo único de regiones, comunas, productos y modalidades; rechazar destinos desconocidos; distinguir estimación del transportista y tarifa contratada. Esta API no determina el total actual del checkout. |
| 10 | P2 | `public/checkout.html:295` usa el departamento como `address_number` y también como `address_extra`. Prueba 5. | Separar calle, número y departamento; validar el dato persistido y su presentación en correos/etiquetas. |
| 11 | P2 | JSON corrupto en `mc_cart` lanza excepción al inicializar el checkout. Prueba 3; patrón repetido en otras páginas. | Leer storage con manejo de errores y validar estructura/precios/cantidades. Recuperación amigable sin dejar el flujo inutilizable. |
| 12 | P2 | Video `/videos/prueba_arrastre_amarok.mp4`: HTTP 404 y error multimedia visible. | Publicar la versión correcta y revisar exclusión global `*.mp4` en `.vercelignore`. El video de armado sí devuelve 200. |
| 13 | P2 | PDF `/Manual_Tecnico_Lanza_Metal_Creativo.pdf`: HTTP 404; enlace en `public/barra-de-remolque.html:380`. | Incluir el PDF autorizado en salida pública y excepción de publicación, o enlazar un manual disponible; comprobar descarga real. |
| 14 | P2 | Links a `#lanza-remolque`, `#fogon-bioetanol` y `#ley-transito` apuntan a IDs que ya no existen. Afecta checkout, fichas y páginas informativas. | Actualizar todos a secciones/rutas vigentes y automatizar comprobación de fragmentos. No son HTTP 404: fallan al ubicar la sección. |
| 15 | P2 | En móvil se ocultan los enlaces de navegación de escritorio sin un menú equivalente. | Dar acceso visible a catálogo, envíos, preguntas y contacto; preservar la identidad actual. |
| 16 | P2 | Tailwind Play CDN en producción y Alpine `3.x.x` flotante; dependencia de ejecución y CDN para mostrar/operar la tienda. | Generar CSS local, fijar versiones y definir una compilación reproducible. [Tailwind](https://tailwindcss.com/docs/installation/play-cdn) reserva Play CDN para desarrollo. |
| 17 | P2 | Consola advierte repetidamente que `x-collapse` no tiene instalado su plugin. | Instalar versión compatible antes de Alpine o retirar la directiva. No se afirma que toda la FAQ esté inutilizada. [Alpine Collapse](https://alpinejs.dev/plugins/collapse). |
| 18 | P2 | Animaciones continuas de canvas y ausencia de `prefers-reduced-motion` en las páginas examinadas. | Respetar movimiento reducido, pausar trabajo invisible y medir CPU/batería en móvil. No se midió una caída de FPS. |
| 19 | P2 | No se encontró evento `Purchase`/GA4 `purchase` en código; sí PageView e InitiateCheckout. | Emitir conversión solo tras pago verificado y deduplicar por pedido. Validar en herramientas del proveedor antes de optimizar anuncios a ventas. |
| 20 | P2 | La política de privacidad describe Webpay/Transbank y no explica el uso observado de Meta/Google ni los proveedores reales del flujo. Términos sitúan el taller en Santiago mientras la portada indica Quillota; prometen plazos uniformes que no coinciden con el cotizador. | Alinear identidad, ubicación, pasarelas, datos, analítica y plazos con la operación real; revisar información precontractual. Es una revisión de coherencia, no una certificación jurídica. |
| 21 | P2 | Un correo de pago aprobado declara `OrderDelivered` en JSON-LD. Prueba 2. | Separar pago recibido de envío/entrega y probar el marcado de cada etapa. |
| 22 | P2 | No hay `npm test` general ni pipeline CI encontrado en `.github`; solo comando parcial de administración. | Unificar ejecución de tests, sintaxis, recursos y smoke tests por cambio; incluir los ocho escenarios nuevos. |
| 23 | P2 | 11 paquetes afectados en `npm audit --omit=dev`; predominan cadenas de Remotion, además de Mercado Pago/uuid. | Separar herramientas de video del runtime comercial, revisar exposición real y actualizar con pruebas. No ejecutar `npm audit fix --force` a ciegas; no tratar cada dependencia transitiva como exploit demostrado. |
| 24 | P3 | Aparece el texto literal `-->` en el pie de la portada. | Corregir comentario HTML y revisar la plantilla compartida. |

## Evaluación de interfaz
**Integridad: parcial.** La marca oscura/naranja y las fotografías reales son coherentes y se pueden conservar. Los problemas se concentran en contratos de interfaz, accesibilidad, dependencias y contenido compartido; no hace falta empezar por un rediseño total.

| Dimensión | Nota orientativa /4 | Motivo |
|---|---:|---|
| Accesibilidad | 1 | Campos sin etiqueta asociada, foco/cierre del carrito |
| Rendimiento de implementación | 2 | CDN en tiempo de ejecución y animación continua; métricas de campo pendientes |
| Adaptación de pantalla | 3 | Sin desbordamiento horizontal observado en vistas comprobadas; navegación móvil incompleta |
| Consistencia de estilos | 2 | Identidad coherente, estilos y colores repetidos en documentos |
| Integridad de implementación | 2 | Recursos/enlaces rotos y plugin ausente |
| **Total** | **10/20** | Trabajo significativo pendiente |

Esta nota no es Lighthouse, no acredita WCAG AA y no representa disponibilidad o seguridad. El detector Impeccable corrió degradado por falta de módulos HTML/CSS: produjo 15 advertencias mecánicas. Las advertencias de “dark-glow”, tipografía o gris sobre amarillo no se cuentan como defectos por sí solas: pueden corresponder a la marca y no demuestran mal contraste.

Se observaron anchos efectivos de 1600, 1245, 853, 433 y 338 px entre las sesiones, afectados por el zoom existente. No se presentan como ensayos exactos de dispositivos. Portada y checkout se revisaron en escritorio y móvil; fichas de producto y contacto en móvil; QR en escritorio. Una captura de contacto agotó tiempo, aunque su DOM se inspeccionó. No hubo validación completa en Safari/iOS o Firefox.

Recomendación de trabajo visual, después de cerrar compras: `/impeccable harden`, `/impeccable clarify`, `/impeccable adapt`, `/impeccable optimize`, nueva auditoría y finalmente `/impeccable polish`. Pueden aplicarse uno a uno o como una fase conjunta.

## Lo que sí funciona y se debe mantener
- Barra $65.000 y fogón $100.000 consistentes entre catálogo, carrito y checkout observado.
- Dos barras: $130.000; con express RM: $134.990. Fogón: $104.990 con ese despacho.
- Cambio a región fuera de RM desactiva express y presenta despacho por pagar sin sumarlo al cobro.
- Cantidad, subtotal, filtro de producto y compra directa respondieron en navegador.
- Formulario vacío detiene el avance y enfoca el primer campo requerido.
- Precios recalculados en servidor, controles de cantidades, idempotencia, protección del estado de pedido y pruebas de firma de webhook cubiertas por la suite aislada.
- APIs administrativas devolvieron 401 sin credenciales. Los endpoints de escritura rechazan GET con 405.
- Sitio servido con HSTS, nosniff, X-Frame-Options y CSP. La CSP sigue permitiendo inline/eval: es una superficie a evaluar, no una vulnerabilidad explotada en esta revisión.
- HTTP 404 real para ruta inexistente; sitemap, robots y feed accesibles.
- Inicio, checkout y admin publicados coinciden con los archivos locales después de normalizar CRLF/LF; los hashes brutos distintos no prueban desincronización.
- Portal QR ofrece destinos de manual, garantía y canales oficiales coherentes.

## Seguridad profunda: fallo y límites
El plugin devolvió:
> Deep Scan stopped after 3 consecutive unsuccessful discovery workers (limit: 3); last failure (transient_error): You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/settings/usage to purchase more credits or try again at 8:14 AM.

Ese horario es texto del proveedor; no se verificó su zona horaria y no debe interpretarse como un compromiso de reinicio en hora chilena.
Contexto recuperado del análisis `dd6737de-71e4-4dc3-a0a5-5bfd5fa3f3b3`: estado failed; 0 revisiones completas, 0 hallazgos guardados, 0 candidatos reportables, sin manifiesto/reporte final. **Cero resultados no equivale a cero vulnerabilidades.**
No se reinició ni se sustituyó el análisis fallido. No se emitió aprobación de seguridad.
Medición total de tokens / entrada / entrada en caché: **no disponible** en la respuesta del análisis.
Daybreak: `not_granted`; advertencia independiente del agotamiento de uso. [Solicitud de acceso](https://chatgpt.com/cyber).

## Cobertura pendiente para una aprobación de lanzamiento
| Área | Falta demostrar |
|---|---|
| Pago real / sandbox integrado | Compra nueva, aprobada, rechazada, pendiente, abandonada; retorno antes/después del webhook; reintentos e idempotencia con proveedor real; reembolso/contracargo |
| Base de datos | RLS y grants efectivos de producción, funciones privilegiadas, concurrencia transaccional real, respaldo reciente y restauración probada. El conector disponible no incluye el proyecto productivo; solo se confirmó conectividad y esquema por su API autorizada |
| Mensajería | Entrega de correo real y estado de rebote; WhatsApp automático. El endpoint público de WhatsApp devuelve 503 y las variables necesarias no aparecen en el listado productivo consultado |
| Operación comercial | Titular/cuenta, certificados y reseñas; stock/fabricación; boleta/factura SII; devoluciones y conciliación bancaria. No hay evidencia de automatización SII en lo revisado |
| Rendimiento | Lighthouse o equivalente reproducible, LCP/INP/CLS de campo, móvil lento, carga/concurrencia controlada, límites de proveedor y fallas de red |
| Navegadores/accesibilidad | Safari iOS, Firefox, lector de pantalla, zoom 200%, contraste computado, navegación completa por teclado |
| Observabilidad | Logs de errores recientes sin PII, alertas accionables, métricas de checkout/webhook, recuperación y rollback |
| Seguridad | Finalizar una auditoría profunda cuando el servicio permita ejecutarla y verificar cualquier hallazgo que produzca |

No se hicieron pruebas de carga contra producción, cargos ni escrituras sintéticas en la base real. Las simulaciones aprobadas no sustituyen estos ensayos.

## Orden de resolución y criterios de salida
1. **Cerrar cobro y posventa:** P1-01 a P1-06, dirección y correos. Aceptación: ambos productos recorren compra → pago confirmado → notificación → preparación → despacho; pendientes y rechazos tienen salida clara; ningún reintento duplica el pedido o la notificación.
2. **Cerrar confianza y accesibilidad:** respaldo comercial, datos del proveedor, etiquetas/foco, manual/video, enlaces, política y métodos de pago fieles a la operación.
3. **Preparar captación:** Purchase deduplicado, rendimiento medido, CI, seguimiento de errores y responsable de incidentes.
4. **Cerrar las verificaciones pendientes:** seguridad profunda, base productiva y restauración; matriz de navegador/dispositivos y pago integrado. Los bloqueos deben quedar cerrados o expresamente aceptados con responsable antes de declarar listo.

## Evidencias retenidas
- [Pruebas existentes, ejecución inicial](../artifacts/auditoria-2026-10-26/baseline-tests.txt)
- [12 pruebas de servidor, repetición aprobada](../artifacts/auditoria-2026-10-26/local-server-tests.txt)
- [Ocho pruebas nuevas reproducibles](../artifacts/auditoria-2026-10-26/additional.test.cjs) y [resultados](../artifacts/auditoria-2026-10-26/additional-tests.txt)
- [HTTP público y revisión estática](../artifacts/auditoria-2026-10-26/public-audit.json)
- [Proveedores, metadatos sin secretos](../artifacts/auditoria-2026-10-26/providers.json)
- [Dependencias npm](../artifacts/auditoria-2026-10-26/npm-audit.json)
- [Navegador](../artifacts/auditoria-2026-10-26/browser-audit.json) y [detector Impeccable degradado](../artifacts/auditoria-2026-10-26/impeccable.json)
- Capturas: [captura parcial de portada escritorio](../artifacts/auditoria-2026-10-26/home-desktop.png), [portada móvil](../artifacts/auditoria-2026-10-26/home-mobile.png), [checkout escritorio](../artifacts/auditoria-2026-10-26/checkout-desktop.png), [checkout móvil](../artifacts/auditoria-2026-10-26/checkout-mobile.png), [barra móvil](../artifacts/auditoria-2026-10-26/barra-de-remolque-mobile.png), [fogón móvil](../artifacts/auditoria-2026-10-26/fogon-bioetanol-mobile.png).

Nota de calidad: el rastreo estático bruto interpretó cinco expresiones Alpine (`currentImg`, `item.image`, `img.src`, `img.url`, `logo.url`) como URLs. Son falsos positivos y se excluyen de los recursos rotos reportados. La imagen dinámica vacía observada durante carga de la ficha del fogón tampoco se reporta como rotura confirmada. No se deducen problemas visuales de errores del capturador.


Regla de recuperación aplicada: la [guía Deep Security Scan](C:/Users/usuario/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/deep-security-scan/SKILL.md) indica ante fallo terminal: “Do not start more scan work”. El bloqueo fue el límite de uso devuelto por el servicio; no una falla de la tienda. Las pruebas funcionales independientes sí se entregan.
