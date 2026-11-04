# ESTÁNDAR MAESTRO DE CREATIVOS, ASPECT RATIOS Y SUBIDA A META ADS
**Metal Creativo Chile — Guía de Arquitectura de Performance Marketing**

---

## 1. ESTADO DE AUTOMATIZACIÓN DE LA TIENDA: ¿ESTÁ 100% AUTOMATIZADA?

### Diagnóstico Técnico del Flujo de Venta:
El sistema digital de `metalcreativo.cl` opera de forma **100% automatizada y desatendida**:

```
[Cliente en Instagram / Anuncio]
             ↓
[Landing Page: /barra-de-remolque]
             ↓
[Checkout: /checkout]
   • Cotización automática en tiempo real de Starken / Chilexpress / Express Santiago (api/shipping-quote.js)
             ↓
[Pasarela de Pago: Mercado Pago]
   • Tarjetas de Crédito, Débito (Redcompra) o Dinero en cuenta
             ↓
[Webhook Criptográfico: api/webhook.js]
   • Validación de firma HMAC-SHA256 (Anti-spoofing)
   • Idempotencia y registro transaccional en Supabase (RPC backend_apply_payment)
   • Actualización de estado de la orden a 'paid'
             ↓
[Notificaciones Automáticas: Resend API]
   • Email 1: Resumen de compra, detalle y boleta/comprobante al cliente.
   • Email 2: Alerta inmediata de nueva venta con datos de despacho al taller.
```

### ¿Qué es automático y qué es manual?
* **100% Automático (Cero intervención humana):** Cobro, validación de pago, registro contable en base de datos, descuento de stock y correos transaccionales.
* **Operación Física (Fulfillment):** Tomar el bulto físico de la barra de remolque (3 tramos de acero, pasadores y bandera) en el taller y entregarlo a la agencia de Starken o Chilexpress, o coordinar el reparto en Santiago.

---

## 2. EL PROBLEMA DE LOS FORMATOS EN META ADS (POR QUÉ RECHAZAR EL ANUNCIO FLOJO)

Si subes un único archivo de video o imagen para todas las ubicaciones de Facebook e Instagram, ocurre el siguiente deterioro de marca:

1. **Si subes solo video vertical 9:16:**
   * En Reels y Stories se ve perfecto.
   * **En el Feed de Facebook / Instagram:** Meta recorta la parte superior e inferior o le coloca barras laterales borrosas. El texto queda cortado y el usuario percibe un anuncio deforme.
2. **Si subes solo video cuadrado 1:1:**
   * En el Feed se ve bien.
   * **En Reels y Stories (9:16):** Meta rellena los extremos superior e inferior con barras grises/negras. El video ocupa solo un tercio de la pantalla móvil y el usuario desliza en 0.5 segundos ("ad blindness").
3. **Pérdida de Dinero (CPM y CTR):**
   * Meta cobra un CPM más caro a los creativos no adaptados porque su índice de interacción baja drásticamente.

---

## 3. ESPECIFICACIONES TÉCNICAS UNIVERSALES Y RELACIONES DE ASPECTO

| Ubicación | Relación de Aspecto | Resolución Óptima | Propósito / Canal |
| :--- | :--- | :--- | :--- |
| **Stories y Reels** | **9:16** (Vertical completo) | **1080 x 1920 px** | Instagram Reels, Facebook Reels, Instagram Stories. |
| **Feed Cuadrado** | **1:1** (Cuadrado estándar) | **1080 x 1080 px** | Feed de Facebook, Perfiles, Búsqueda, Marketplace. |
| **Feed Vertical** | **4:5** (Vertical Feed) | **1080 x 1350 px** | Feed de Instagram (ocupa el máximo espacio de pantalla antes de cortar). |
| **Horizontal / Desktop** | **16:9** (Apaisado) | **1920 x 1080 px** | Facebook In-stream video, computadores de escritorio. |

---

## 4. ZONAS SEGURAS (SAFE ZONES) EN REELS Y STORIES (9:16)

Para evitar que los textos, subtítulos o tu logo queden tapados por los elementos de la interfaz de Instagram y Facebook, **NUNCA** coloques elementos clave en las siguientes zonas:

```
+------------------------------------+  ← 0 px (Borde superior)
|   ZONA PELIGROSA SUPERIOR (250 px) |  ← Tapado por: Nombre de cuenta (@metalcreativo), audio, botones de cerrar.
+------------------------------------+  ← 250 px
|                                    |
|                                    |
|          ZONA SEGURA               |  ← AQUÍ deben ir:
|    (Textos, Subtítulos, Caras,     |     • El Gancho visual
|      Acción del Producto)          |     • Los subtítulos automáticos
|                                    |     • Demostración de arrastre
|                                    |     • Precio y llamado
|                                    |
+------------------------------------+  ← 1520 px
|   ZONA PELIGROSA INFERIOR (400 px) |  ← Tapado por: Botón "Comprar / Más información", Título y copy de Meta.
+------------------------------------+  ← 1920 px (Borde inferior)
      [Margen derecho libre: 120 px]    ← Tapado por: Iconos de Me Gusta, Comentarios y Compartir.
```

---

## 5. AUTOMATIZACIÓN DE CONVERSIÓN CON FFMPEG (CERO TRABAJO MANUAL)

Hemos creado una herramienta en tu proyecto que convierte cualquier video vertical 9:16 en versiones profesionales 1:1 y 4:5 usando la técnica cinematográfica de **fondo desenfocado ambiental (Blurred Pillarbox)**, preservando el 100% de la acción y audio:

### Cómo ejecutar la conversión:
Abre tu consola en la carpeta del proyecto y ejecuta:

```powershell
node scripts/adapt_video_aspect_ratios.js "ruta/al/video.mp4"
```

El script genera automáticamente:
* `video_1x1_feed.mp4` (1080x1080 px)
* `video_4x5_feed.mp4` (1080x1350 px)

---

## 6. CÓMO SUBIR EL ANUNCIO CON MÚLTIPLES RATIOS EN META ADS MANAGER

Cuando estés creando el anuncio en **Ads Manager** (o mediante la API):

1. En el nivel de **Anuncio**, en **Contenido multimedia**, haz clic en **Editar > Cambiar contenido por ubicación** (o *Personalización por ubicación / Placement Asset Customization*).
2. Selecciona los grupos de ubicaciones:
   * **Para Feeds de Facebook e Instagram:** Sube o selecciona la versión **1:1** (`_1x1_feed.mp4`) o la foto cuadrada.
   * **Para Reels y Stories:** Sube o selecciona la versión **9:16** original (`.mp4` vertical nativo 1080x1920).
3. **Miniatura (Thumbnail):**
   * No dejes la miniatura automática que elija Meta si sale oscura o borrosa.
   * Selecciona un fotograma manual donde se aprecie claramente la barra montada en el auto o el texto gancho.
4. **Llamada a la acción (CTA):**
   * Para objetivo de ventas web, usa siempre **"Comprar"** o **"Más información"**.
5. **URL visible y destino:**
   * URL de destino: `https://metalcreativo.cl/barra-de-remolque` (siempre limpia, sin `.html`).
