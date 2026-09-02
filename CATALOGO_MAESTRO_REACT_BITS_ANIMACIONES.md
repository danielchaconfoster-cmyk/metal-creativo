# CATÁLOGO MAESTRO DE ANIMACIONES Y COMPONENTES WEB
## Librería Oficial: React Bits (David Haz — reactbits.dev)
*Guía completa de 145+ componentes, animaciones tipográficas, fondos 3D y tarjetas interactivas para Metal Creativo Chile.*

---

## RESUMEN POR CATEGORÍAS

| Categoría | N° de Componentes | Tecnologías y Motores |
| :--- | :---: | :--- |
| **1. Text Animations** | **32** | GSAP, ScrollTrigger, Framer Motion, Variable Fonts, Matter.js, CSS Keyframes |
| **2. Interactive Animations** | **38** | WebGL, Canvas 2D, Three.js, Pointer Tracking, SVG Filters, CSS 3D |
| **3. Backgrounds (Fondos 3D)** | **56** | WebGL GLSL Shaders, Raymarching, Three.js, Canvas Particles, Volumetric Light |
| **4. Components & UI Cards** | **45** | CSS 3D, Bento Grids, Embla Carousel, GLTF 3D Viewer, Spring Physics |
| **TOTAL GENERAL** | **171** | **Catálogo completo de efectos de vanguardia mundial** |

---

## 1. ANIMACIONES DE TEXTO Y TIPOGRAFÍA (TEXT ANIMATIONS — 32)

| Componente | Motor / Tecnología | ¿Qué hace exactamente? | Uso recomendado en Metal Creativo |
| :--- | :--- | :--- | :--- |
| **ScrollFloat** | GSAP (ScrollTrigger) | El texto flota hacia arriba en 3D letra por letra al hacer scroll por la página con aceleración elástica. | Títulos principales del Hero: *"Lanza de Remolque Homologada"* y *"Fogón a Bioetanol"*. |
| **ShinyText** | CSS / Tailwind | Reflejo de brillo metálico animado que se desplaza continuamente a lo largo de las letras. | Insignias de *"Cumple Ley MTT 55/2025"* y *"Garantía 6 Meses SERNAC"* para simular acero pulido. |
| **SplitText** | Framer Motion / GSAP | Descompone frases y las revela palabra por palabra o carácter por carácter con retrasos escalonados. | Bajadas de título y frases de impacto en testimonios y beneficios. |
| **TrueFocus** | Framer Motion / CSS | Caja de enfoque nítido con esquinas luminosas que salta automáticamente de palabra en palabra. | Resaltar los 3 atributos clave: *"LIVIANA (5mm)"*, *"SEGURA (3.500kg)"* y *"DESARMABLE (65cm)"*. |
| **DecryptedText** | React Hooks / RAF | Efecto de desencriptación estilo hacker militar donde caracteres aleatorios rotan hasta fijar el texto real. | Fichas técnicas, números de serie y certificados de ensayo estructural en acero. |
| **CountUp** | React Hooks | Contador numérico animado ascendente con formateo de decimales y separadores de miles. | Estadísticas: *"+1.200 Lanzas Despachadas"*, *"3.500 kg de arrastre"*, *"$65.000 CLP"*. |
| **RotatingText** | Framer Motion | Rueda de palabras vertical/horizontal que va cambiando en bucle fluido dentro de una frase fija. | Frase dinámica: *"Lanza obligatoria para [Autos \| Camionetas \| Furgones \| SUV]"*. |
| **TextPressure** | Canvas 2D / Variable Fonts | Tipografía variable interactiva que se estira, engorda o deforma según la proximidad y presión del cursor. | Título interactivo en el footer o en la sección de maestranza nacional. |
| **VariableProximity** | Variable Font / CSS | Letras cuyo grosor (font-weight) cambia dinámicamente según la distancia a la que se encuentre el cursor. | Menús de navegación y enlaces principales para una respuesta táctil ultra moderna. |
| **GlitchText** | CSS Keyframes | Distorsión visual cromática con desfase de canales RGB y estática digital. | Advertencia vial: *"Peligro: Las cuerdas elásticas están prohibidas por Ley"*. |
| **GradientText** | CSS Gradient / Clip | Texto con degradado fluido multicolor animado en bucle continuo (tonos cobre, fuego y acero). | Precios oficiales de productos y botones de llamada a la acción principales. |
| **CurvedLoop** | SVG Motion / RAF | Cinta de texto que se desplaza de forma infinita a lo largo de una trayectoria ondulada o curva SVG. | Separadores de sección modernos con frases de marca repetitivas. |
| **FallingText** | Matter.js (Physics 2D) | Letras y palabras que caen como objetos sólidos con gravedad real y colisionan entre sí al tocar el fondo. | Elemento lúdico interactivo en páginas de error 404 o confirmación de compra. |
| **ASCIIText** | Three.js / WebGL | Renderizado de texto en tiempo real convertido a caracteres ASCII interactivos que reaccionan a la luz del puntero. | Sección de planos y códigos técnicos de taller. |
| **CircularText** | CSS 3D Transform | Texto dispuesto en un anillo circular rotatorio continuo de 360° alrededor de un icono central. | Sello circular de *"Fabricación Nacional 100% Chilena"* o *"Garantía SERNAC"*. |
| **EchoText** | CSS 3D Shadow | Texto que proyecta múltiples sombras y ecos cromáticos en profundidad tridimensional. | Títulos de impacto en banners promocionales y afiches de ofertas de temporada. |
| **DepthText** | CSS Perspective | Texto volumétrico con perspectiva 3D interactiva que rota según el movimiento del mouse. | Cabecera de la sección de ingeniería y soldadura. |
| **FoldText** | Framer Motion 3D | Texto que se desdobla como origami o láminas de acero articuladas al entrar en pantalla. | Presentación de los 3 tramos desarmables de la lanza. |
| **FuzzyText** | SVG Filters | Tipografía con vibración de ruido analógico y bordes difusos estilo holograma de tubo. | Efectos de calidez en la sección de calefacción y fogones a bioetanol. |
| **MaskedHeading** | CSS Mask-Image | Texto gigante con máscara de recorte que deja ver un video de chispas de soldadura o fuego real en su interior. | Hero principal mostrando el acero cortándose con plasma dentro de las letras. |
| **ParticleText** | Canvas 2D / Particles | Texto formado por miles de partículas que explotan y se dispersan al pasar el mouse y vuelven a armarse solas. | Logotipo interactivo de Metal Creativo en la portada. |
| **ScrambledText** | JS Interval | Texto que entra desordenado en caracteres crípticos y se va ordenando de izquierda a derecha. | Mensajes de estado en la pasarela de pago (*"Verificando con Webpay Plus..."*). |
| **ScrollReveal** | Intersection Observer | Texto atenuado en gris que se ilumina en blanco brillante palabra por palabra mientras el usuario hace scroll. | Párrafos explicativos de la normativa MTT y de la garantía legal de 6 meses. |
| **ScrollVelocity** | Framer Motion / Scroll | Marquesina de texto infinito que acelera o cambia de sentido según la velocidad con que el usuario baje o suba. | Cinta de marcas de autos compatibles (Toyota, Chevrolet, Hyundai, Suzuki, Ford, etc.). |
| **Shuffle** | JS Animation | Caracteres que se barajan rápidamente como un marcador de aeropuerto de aletas hasta fijar la palabra final. | Encabezados de cambio de producto o especificación. |
| **SplitFlapText** | CSS 3D Flip | Imitación mecánica retro de tableros de trenes donde las letras caen en mitades abatibles. | Visualización de stock en tiempo real (*"STOCK DISPONIBLE: 14 UNIDADES"*). |
| **StrokeText** | SVG Stroke-Dasharray | Animación del contorno de las letras como si un soplete estuviera dibujando el texto en el aire. | Firma oficial de los maestros forjadores de Metal Creativo. |
| **TextCursor** | Canvas / Pointer | Efecto donde las letras de una frase siguen el cursor del mouse como una serpiente tipográfica. | Efecto interactivo en la sección de contacto. |
| **TextLoop** | Framer Motion | Transición vertical ultra suave entre diferentes frases o beneficios que rotan cada 3 segundos. | Subtítulo del checkout: *"Despacho asegurado por [Starken \| Chilexpress \| Blue Express]"*. |
| **TextType** | React Typed Hook | Simulador de máquina de escribir con cursor parpadeante y velocidad ajustable por carácter. | Mensajes de bienvenida y explicaciones de preguntas frecuentes. |
| **WarpText** | Three.js / Shaders | Texto deformado en una malla tridimensional curva con curvatura espacial según el scroll. | Efectos de fondo cinemáticos de alta gama. |
| **BlurredExitText** | Framer Motion Blur | Texto que al salir se difumina suavemente hacia los lados como humo disipándose. | Transiciones entre diapositivas del carrusel de productos. |

---

## 2. ANIMACIONES E INTERACCIONES DINÁMICAS (ANIMATIONS — 38)

| Componente | Motor / Tecnología | ¿Qué hace exactamente? | Uso recomendado en Metal Creativo |
| :--- | :--- | :--- | :--- |
| **Magnet** | GSAP / Pointer Event | Atrae físicamente el botón o icono hacia la posición del cursor del mouse cuando este se aproxima. | Botones de *"Comprar Ahora"* y *"WhatsApp Directo"* para aumentar drásticamente el CTR de clics. |
| **ClickSpark** | Canvas 2D | Genera una explosión radial de chispas luminosas de soldadura dorada en el punto exacto del clic. | Clic en botones de compra, añadir al carrito y selector de imágenes. |
| **SplashCursor** | WebGL Fluid Dynamics | Simulación física de fluido líquido/humo de alta definición que reacciona a los movimientos y velocidad del mouse. | Efecto de calidez de bioetanol y estelas de fuego al interactuar con el fondo del fogón. |
| **BlobCursor** | CSS Spring / SVG | Gota de líquido orgánico elástica que persigue el cursor deformándose suavemente. | Cursor personalizado interactivo para navegación en computadores de escritorio. |
| **ElectricBorder** | SVG Filters / CSS | Rayos de electricidad y energía que recorren el perímetro de un contenedor o tarjeta. | Borde de la tarjeta de *"Oferta Especial"* o del kit completo de remolque. |
| **StarBorder** | CSS Conic Gradient | Línea perimetral con estela luminosa giratoria tipo cometa que resalta el borde de un botón. | Botón de *"Finalizar Pedido"* en el Checkout para guiar el ojo del cliente. |
| **GlareHover** | CSS 3D / Radial Gradient | Reflejo de luz especular pulida que recorre la superficie de una tarjeta según la inclinación del mouse. | Tarjetas de producto para dar apariencia de acero templado y acero inoxidable AISI 304. |
| **MetallicPaint** | WebGL Shaders | Pintura metálica reflectante en tiempo real que simula el brillo de una chapa de auto pulida. | Sección de acabado de pintura electroestática al horno de las lanzas. |
| **StickerPeel** | CSS 3D / Clip-Path | Efecto interactivo donde la esquina de una etiqueta se dobla y despega al pasar el mouse por encima. | Sello de *"Garantía 6 Meses"* o *"Homologado MTT"* en la esquina de las fotos. |
| **HalftoneReveal** | Canvas / Blend Modes | Revela imágenes fotográficas mediante un patrón de puntos de semitono estilo grabado industrial. | Presentación de la galería del taller y procesos de corte y soldadura. |
| **PixelTransition** | Canvas / Shaders | Transición de imágenes mediante una disolución progresiva de bloques pixelados en cascada. | Cambio entre vista armada y vista desarmada de la lanza en el maletero. |
| **ImageTrail** | Framer Motion / Pointer | Rastro de fotos flotantes que van apareciendo y desvaneciéndose detrás del movimiento del cursor. | Galería dinámica de clientes satisfechos y autos remolcados en carretera. |
| **Antigravity** | Physics 2D / Matter.js | Elementos flotantes ingrávidos que rebotan y se repelen suavemente al mover el cursor. | Iconos de beneficios flotando en el fondo del hero. |
| **LaserFlow** | Canvas 2D / Glow | Rayos láser brillantes que recorren circuitos y bordes geométricos con alta intensidad. | Destacar las líneas de resistencia de 3.500 kg en el diagrama de la lanza. |
| **LogoLoop** | CSS Translate Loop | Cinta continua en movimiento infinito con los logotipos de bancos, couriers y certificaciones. | Barra inferior con Starken, Chilexpress, Transbank, Webpay Plus, BancoEstado y Santander. |
| **MagicRings** | Three.js / WebGL | Anillos holográficos concéntricos que giran en diferentes ejes 3D alrededor de un elemento. | Destacar el quemador de bioetanol como núcleo de fuego limpio. |
| **MagnetLines** | Canvas Vector Field | Rejilla de agujas o líneas vectoriales que se orientan magnéticamente apuntando hacia el cursor. | Fondo interactivo de la sección técnica de tracción y fuerzas mecánicas. |
| **MetaBalls** | GLSL Shaders / Canvas | Gotas de mercurio líquido que se fusionan entre sí cuando están cerca y se separan con tensión superficial. | Efecto decorativo para secciones de bioetanol y líquidos combustibles limpios. |
| **Noise** | SVG / Canvas Noise | Capa sutil de grano cinematográfico analógico sobre los fondos oscuros. | Aporta textura premium a toda la estética *"dark metal"* del sitio web. |
| **OrbitImages** | CSS 3D Preserve | Fotos en miniatura que orbitan en una elipse tridimensional alrededor del producto estrella. | Fotos de los accesorios (pasadores, seguros, bolso, bandera) orbitando la lanza de remolque. |
| **PixelSwap** | Canvas Voxel Swap | Intercambio de dos fotografías mediante desvanecimiento de vóxeles tridimensionales. | Comparación antes/después: Cuerda rota vs. Barra rígida segura. |
| **PixelTrail** | Canvas 2D | Estela de píxeles fluorescentes que se van apagando progresivamente tras el puntero. | Efecto interactivo en botones y menús. |
| **Ribbons** | Three.js Splines | Cintas tridimensionales brillantes que ondean en el espacio con física de viento. | Efectos de calidez y movimiento orgánico en la página de fogones. |
| **RippleDistortion** | WebGL Displacement | Onda expansiva en el agua cuando el cursor toca una imagen fotográfica. | Efecto al hacer clic sobre las fotos del fogón a bioetanol. |
| **ScrollExpand** | GSAP ScrollTrigger | Imagen incrustada que se expande suavemente hasta ocupar el 100% de la pantalla mientras se hace scroll. | Transición de apertura del video demostrativo de remolque en autopista. |
| **ShapeBlur** | CSS Blur / Keyframes | Formas geométricas de colores que flotan desenfocadas creando ambiente de luz volumétrica. | Luces naranja cálido y azul cobalto detrás de las fotos de producto. |
| **Strands** | WebGL Geometry | Filamentos luminosos que vibran y se tensan según la velocidad de navegación. | Simulación de líneas de fuerza y tensión de tiro automotriz. |
| **SwarmCursor** | Canvas Boids | Enjambre de micropartículas inteligentes que persiguen y rodean al cursor como luciérnagas. | Interacción de mouse en secciones nocturnas o de fogón. |
| **TargetCursor** | SVG / Pointer Tracking | Retícula de puntería táctica con coordenadas numéricas en vivo que sigue el mouse. | Enfoque de alta precisión en la sección de detalles milimétricos del tubo de 5 mm. |
| **Crosshair** | CSS Fixed Lines | Líneas de mira telescópica en los ejes X e Y que cruzan toda la pantalla. | Herramienta visual para modo de inspección técnica del producto. |
| **CursorGrid** | Canvas Grid | Cuadrícula que ilumina las casillas por donde pasa el mouse con un gradiente cálido. | Fondo interactivo de la sección de cotización y medidas especiales. |
| **ElasticMesh** | Spring Physics | Malla elástica que se deforma al tirar de ella con el cursor y regresa con inercia. | Demostración visual de elasticidad peligrosa en cuerdas vs rigidez en acero. |
| **FadeContent** | Intersection Observer | Desvanecimiento y subida progresiva de bloques de texto al entrar en el campo visual. | Carga limpia y ordenada de todas las secciones de la página. |
| **GhostCursor** | Canvas Ghost Trail | Copia translúcida con retraso del cursor del usuario que dibuja su trayectoria. | Efecto sutil de navegación en pantallas de escritorio. |
| **GlowCursor** | Radial Gradient Hook | Halo de luz naranja suave que ilumina los componentes oscuros por detrás del mouse. | Efecto de linterna o antorcha sobre la chapa metálica de la web. |
| **GradualBlur** | CSS Backdrop-Filter | Degradado de desenfoque progresivo en los bordes de la pantalla para efecto de lente cinematográfico. | Bordes superior e inferior de los videos promocionales de Remotion. |
| **Cubes** | CSS 3D Cubes | Matriz de cubos isométricos que giran y reflejan la luz al interactuar. | Fondo decorativo en tarjetas de características técnicas. |
| **PulseGlow** | CSS Keyframes | Efecto de respiración luminosa periódica en botones y llamadas a la acción clave. | Botón flotante de WhatsApp en la esquina inferior derecha. |

---

## 3. FONDOS DINÁMICOS Y SHADERS 3D (BACKGROUNDS — 56)

| Componente | Motor / Tecnología | ¿Qué hace exactamente? | Uso recomendado en Metal Creativo |
| :--- | :--- | :--- | :--- |
| **MoltenMetal** | WebGL GLSL Shaders | Simulación hiperrealista de acero fundido incandescente fluyendo con calor radiante y vetas doradas. | **Fondo estelar temático para Metal Creativo que transmite fuego, forja y resistencia pura.** |
| **LiquidChrome** | WebGL Raymarching | Cromo y mercurio líquido en movimiento con reflejos especulares de espejo de alta definición. | Fondo de la sección de acero inoxidable AISI 304 del fogón ecológico. |
| **Aurora** | GLSL Fragment Shader | Ondas de luz boreal en tonos esmeralda, cian y violeta flotando suavemente en la oscuridad. | Fondo elegante para la sección de terrazas y calefacción nocturna sin humo. |
| **Hyperspeed** | Three.js / Trail Shaders | Líneas de luz de carretera nocturna a hipervelocidad con perspectiva de autopista en fuga. | Fondo de la sección de seguridad en carretera y viajes largos con lanza de remolque. |
| **Lightning** | Canvas Procedural | Generación procedural de rayos y arcos voltaicos de alta tensión en tiempo real. | Demostración visual de potencia y resistencia ante esfuerzos extremos. |
| **Particles** | Canvas 2D / Distance | Constelación de partículas interconectadas por líneas dinámicas que reaccionan al mouse. | Fondo de la sección de preguntas frecuentes y garantías legales. |
| **Prism** | WebGL Refraction | Dispersión cromática de luz refractada a través de un bloque de cristal transparente. | Fondo de la galería de imágenes del fogón con piedras de cuarzo. |
| **Beams** | Three.js Volumetric Light | Haces de luz de estudio fotográfico descendiendo desde la parte superior sobre el producto. | Iluminación de fondo para resaltar la barra de remolque en el Hero slider. |
| **Ballpit** | Three.js + Cannon-es | Piscina de esferas 3D con físicas de gravedad y colisión que el usuario puede golpear con el mouse. | Elemento interactivo divertido para generar engagement en la web. |
| **Balatro** | GLSL Shader | Espirales hipnóticas de colores cálidos y psicodélicos con movimiento continuo. | Fondo dinámico para banners de promociones especiales. |
| **CRTWarp** | Post-Processing | Curvatura de monitor de tubo retro con líneas de barrido entrelazadas y viñeteado. | Efecto visual para secciones con estética de planos antiguos de maestranza. |
| **ColorBends** | WebGL Wave Shader | Láminas de color translúcidas que se doblan y superponen con deformaciones suaves. | Fondo artístico para ambientaciones de living y diseño de interiores. |
| **DarkVeil** | Volumetric Smoke | Niebla oscura volumétrica con iluminación sutil en los bordes para crear profundidad. | Fondo sobrio y profesional para páginas legales y de términos de servicio. |
| **Dither** | Retro Dithering | Textura gráfica de tramado de puntos al estilo de pantallas monocromáticas clásicas. | Estilo gráfico para afiches técnicos descargables en PDF. |
| **DotField** | Three.js Points | Túnel de puntos 3D en perspectiva estelar que se desplaza hacia la cámara. | Fondo de la sección de despachos rápidos a regiones por Starken. |
| **DotGrid** | Canvas 2D Responsive | Matriz de puntos minimalista que se amplían e iluminan al pasar el cursor. | Fondo técnico limpio y moderno detrás de las tablas de medidas y pesos. |
| **EvilEye** | WebGL Eye Tracking | Globo ocular 3D interactivo con iris reflectante que sigue la posición del puntero. | Elemento de alto impacto visual para creativos de marketing. |
| **FaultyTerminal** | Canvas Text Glitch | Pantalla de terminal con fallas de sincronización vertical y caracteres parpadeantes. | Animación de carga interactiva. |
| **Ferrofluid** | WebGL Fluid Solver | Fluido magnético con picos geométricos que se agrupan siguiendo el imán del cursor. | Representación visual de física de materiales ferrosos. |
| **FloatingLines** | Three.js Curves | Curvas de nivel topográficas flotando en un espacio tridimensional oscuro. | Fondo de la sección de cobertura nacional desde Arica hasta Punta Arenas. |
| **Galaxy** | Three.js Particle Galaxy | Galaxia espiral en 3D compuesta por miles de estrellas girando en órbita armónica. | Fondo para la página de 'Nosotros' y visión de diseño sustentable. |
| **GhostFibers** | Canvas Fibers | Fibras de vidrio y filamentos luminosos flotando en una corriente de aire digital. | Fondo para destacar la fibra cerámica del quemador térmico. |
| **GradientBlinds** | CSS 3D / Clip | Persianas verticales de colores que rotan reflejando diferentes tonos metálicos. | Transiciones entre secciones de productos. |
| **GradientWaves** | WebGL Shaders | Olas de color ultra fluidas con iluminación especular suave y relajante. | Fondo para la sección de ambientación de terrazas en el hogar. |
| **Grainient** | SVG Noise + Gradients | Gradiente moderno con textura de grano fotográfico integrado de alto contraste. | Fondos de tarjetas de checkout y comprobante de compra exitosa. |
| **GridDistortion** | Canvas Mesh Warp | Cuadrícula que se estira y deforma elásticamente como una sábana al interactuar. | Fondo para la sección de cálculo de distancias de frenado reglamentarias. |
| **GridMotion** | CSS Grid Translation | Cuadrícula infinita de imágenes o celdas en movimiento oblicuo constante. | Muro interactivo con fotos de instalaciones y autos remolcados. |
| **GridScan** | Canvas Laser Line | Línea de escáner láser verde/naranja que barre una cuadrícula técnica. | Animación de 'Verificación de Stock' antes de añadir al carrito. |
| **Iridescence** | WebGL Thin Film | Reflejos de película delgada tornasolada con brillo de aceite y metales tratados térmicamente. | Sección de templado de acero y tratamiento térmico de pasadores. |
| **LetterGlitch** | Canvas Matrix Fall | Lluvia de caracteres alfanuméricos con fallas estáticas periódicas. | Animación de código de seguimiento de envíos Starken/Chilexpress. |
| **LightPillar** | Three.js Cylinder | Columna de luz monumental que emana destellos hacia el cielo desde la base. | Destacar la presentación del Fogón Ecológico en eventos o ferias. |
| **LightRays** | GLSL God Rays | Rayos de sol crepusculares penetrando oblicuamente en la escena. | Fondo cálido para la galería de fogones encendidos en el atardecer. |
| **LightTunnel** | Three.js Cylinder Tube | Túnel de luces de alta velocidad que envuelve la visión del usuario. | Fondo para la sección de envíos express a todo Chile. |
| **Lightfall** | Canvas Vertical Rays | Cascada de rayos de luz blanca y dorada cayendo suavemente como lluvia estelar. | Fondo de la página de confirmación de pago exitoso. |
| **Lightning** | Procedural Electricity | Tormenta de rayos eléctricos procedurales con destellos de iluminación ambiental. | Efecto para destacar la resistencia ante impactos de 3.5 toneladas. |
| **LineWaves** | Canvas Trigonometry | Múltiples líneas sinusoidales superpuestas oscilando en armonía matemática. | Fondo detrás del formulario de contacto y cotizaciones personalizadas. |
| **LiquidChrome** | Raymarching Metal | Espejo líquido con ondas de mercurio reflectante. | Fondo premium de la sección de acero inoxidable AISI 304. |
| **LiquidEther** | WebGL Fluid Dynamics | Niebla cuántica de colores etéreos que se expande y mezcla al deslizar el mouse. | Fondo interactivo para páginas de aterrizaje de campañas de Meta Ads. |
| **Orb** | Three.js MeshPhysical | Esfera de plasma tridimensional flotante con superficie luminosa y reflejos realistas. | Elemento central en la explicación de combustión ecológica a bioetanol. |
| **PixelBlast** | Canvas Particles | Explosión de píxeles cuadrados de colores cálidos que se desintegran al hacer clic. | Efecto de celebración al completar una compra en el Checkout. |
| **PixelSnow** | Canvas 2D Falling Pixels | Copos de nieve de píxeles retro cayendo a diferentes velocidades y capas de profundidad. | Modo temático de invierno para la venta de estufas a bioetanol. |
| **Plasma** | GLSL Fragment Plasma | Fluido de plasma incandescente con gradientes de calor de fragua y soldadura. | Fondo de la sección de forja y procesos térmicos del taller. |
| **PlasmaWave** | WebGL Waves | Olas de energía plasmática con movimiento oscilatorio suave. | Fondo para la sección de preguntas sobre autonomía y calor de los fogones. |
| **Prism** | Three.js Refraction | Refracción de haces de luz en prismas geométricos tridimensionales. | Fondo de la sección de accesorios de cuarzo y madera tratada. |
| **PrismaticBurst** | Canvas Radial Rays | Ráfaga de colores refractados que emanan desde el centro de la pantalla. | Animación de apertura de promociones exclusivas de fin de semana. |
| **Radar** | Canvas 2D Polar | Radar militar circular con barrido giratorio y detección de puntos de contacto. | Mapa de cobertura nacional de despachos con puntos en cada región de Chile. |
| **RippleGrid** | Canvas Wave Propagation | Cuadrícula que propaga ondas concéntricas de agua al hacer clic o mover el cursor. | Fondo interactivo detrás del cotizador de productos a medida. |
| **Scanner** | Canvas Line Scanner | Barrido de escaneo horizontal/vertical que inspecciona los componentes de la interfaz. | Simulador de control de calidad e inspección de soldaduras. |
| **ShapeGrid** | Canvas Polygon Grid | Mosaico de hexágonos y polígonos que cambian de color según la posición del usuario. | Fondo interactivo para el pie de página corporativo. |
| **SideRays** | CSS Radial Overlay | Iluminación rasante lateral que baña los productos con luz de estudio automotriz. | Fondos de las tarjetas de catálogo para realzar las fotografías reales. |
| **Silk** | Three.js Cloth Simulation | Simulación física de tela de seda ondeando con suavidad y brillo satinado. | Fondo para la presentación de los bolsos de transporte de la lanza. |
| **SlicedWaves** | CSS Transform Slices | Olas de mar divididas en franjas horizontales con desplazamiento alternado. | Separador visual dinámico entre secciones de la página de inicio. |
| **SoftAurora** | Canvas Multi-Gradient | Versión pastel y ultra suave de la aurora boreal con transición imperceptible. | Fondo relajante para lectura de políticas de privacidad y garantías. |
| **Threads** | Canvas Bezier Threads | Hilos dorados y cobrizos flotando en el espacio que se entrelazan al moverse. | Fondo temático para detalles de artesanía y acabados nobles. |
| **Topography** | Canvas Contour Lines | Líneas de curvas de nivel que se mueven simulando un mapa geográfico vivo. | Fondo de la sección de rutas y viajes por la Carretera Austral y Ruta 5. |
| **Waves** | Three.js Plane Geometry | Malla de olas tridimensionales con sombreado de luces y sombras en movimiento. | Fondo dinámico para la cabecera del blog de consejos mecánicos y viales. |

---

## 4. COMPONENTES Y TARJETAS INTERACTIVAS (COMPONENTS & UI CARDS — 45)

| Componente | Motor / Tecnología | ¿Qué hace exactamente? | Uso recomendado en Metal Creativo |
| :--- | :--- | :--- | :--- |
| **SpotlightCard** | CSS Radial Gradient / JS | Tarjeta interactiva con reflector de luz radial que sigue el cursor iluminando bordes metálicos. | Tarjetas de características de la Lanza de Remolque (Tubo 5mm, Pasadores, Bandera reflectante). |
| **TiltedCard** | CSS 3D Perspective / JS | Tarjeta con inclinación giroscópica tridimensional que sigue el ángulo exacto del mouse. | Fichas principales de compra de la Barra de Remolque ($65.000) y Fogón ($149.900). |
| **MagicBento** | CSS Bento Grid + Spotlight | Grilla Bento inteligente donde todas las tarjetas comparten el mismo haz de luz reflectante conjunto. | Sección de especificaciones técnicas completas y normativas legales MTT 55/2025. |
| **PixelCard** | Canvas Pixel Dissolve | Tarjeta cuya superficie se transforma en un mosaico de píxeles luminosos al pasar el cursor. | Tarjeta de *"Proyectos Especiales y Forja a Medida"* para llamar la atención. |
| **ReflectiveCard** | CSS Reflection + WebGL | Tarjeta con superficie reflectante de espejo que simula el brillo de una chapa de acero cromado. | Presentación de la bandeja de acero inoxidable del quemador a bioetanol. |
| **DecayCard** | Framer Motion Physics | Tarjeta que responde a la fricción e inercia física del cursor con balanceo realista. | Galería de productos secundarios y accesorios de fijación. |
| **BounceCards** | Framer Motion Spring | Mazo de tarjetas de fotos que se abren en abanico rebotando elásticamente al hacer hover. | Galería fotográfica mostrando la lanza en uso, en maletero y desarmada. |
| **CardSwap** | Framer Motion | Pila de tarjetas que intercambian de posición suavemente como baraja de naipes. | Presentación de testimonios de clientes y conductores que evitaron multas de Carabineros. |
| **ScrollStack** | GSAP ScrollTrigger | Tarjetas que se van apilando una sobre otra fijándose en pantalla a medida que el usuario baja. | Explicación paso a paso de cómo ensamblar la lanza en menos de 1 minuto en la berma. |
| **CircularGallery** | Three.js / Canvas 3D | Galería circular de imágenes que giran en un anillo tridimensional infinito controlado por el mouse. | Carrusel 360° con todas las fotos de instalaciones de fogones en terrazas y departamentos. |
| **DomeGallery** | Three.js Sphere Panorama | Galería panorámica inmersiva en forma de cúpula esférica navegable en 360°. | Visualización inmersiva de quinchos y terrazas equipadas con calefacción Metal Creativo. |
| **DepthCarousel** | Three.js Depth Mapping | Carrusel donde la tarjeta central tiene foco nítido y las laterales se desenfocan en profundidad. | Selector principal de modelos de fogones y quemadores. |
| **Lanyard** | Three.js + Rapier.js | Credencial 3D interactiva colgando de un cordón de tela que puedes agarrar y sacudir con el mouse. | Sello oficial de certificación de taller chileno *"Garantía Metal Creativo"*. |
| **ModelViewer** | Three.js / GLTF Loader | Visor interactivo de modelos 3D que permite rotar, hacer zoom e inspeccionar la lanza y el fogón en 360°. | Permite al cliente girar la lanza en su pantalla antes de comprar para ver los pasadores y ojales macizos. |
| **SpecularButton** | CSS Specular Gradient | Botón con brillo de cristal pulido y reflejos que reaccionan a la luz ambiente del cursor. | Botón principal de *"Añadir al Carrito"* y *"Pagar con Webpay"*. |
| **BorderGlow** | CSS Conic Gradient | Borde perimetral con halo luminoso suave de neón que rodea la tarjeta continuamente. | Resaltar el banner de *"Envío Rápido a Regiones en 24/48 Horas"*. |
| **Dock** | Framer Motion | Barra de navegación fija estilo macOS donde los iconos aumentan de tamaño suavemente al acercar el mouse. | Menú flotante inferior de acceso rápido: Catálogo, WhatsApp, Carrito, FAQ y Contacto. |
| **PillNav** | Framer Motion LayoutId | Barra de navegación tipo píldora con indicador flotante que se desliza elásticamente entre pestañas. | Navegación entre categorías: [Todos \| Lanzas de Remolque \| Fogones Bioetanol \| Medidas Especiales]. |
| **GooeyNav** | SVG Gooey Filter | Menú interactivo con efecto de líquido viscoso que une los botones con una gota al seleccionarlos. | Selector de métodos de pago en el checkout: [Webpay \| Transferencia \| WhatsApp]. |
| **FlowingMenu** | GSAP Infinite Loop | Menú donde al posarse sobre cada ítem se despliega una cinta horizontal continua de fotos alusivas. | Menú de servicios del taller metalúrgico. |
| **InfiniteMenu** | Three.js Circular Menu | Menú radial tridimensional que gira en bucle infinito permitiendo explorar el catálogo. | Explorador visual de productos para pantallas táctiles o móviles. |
| **InfiniteSpiral** | Three.js Spiral Geometry | Espiral infinita de fotografías que se hunden hacia el fondo del espacio. | Galería de trabajos realizados a lo largo de los años por el taller. |
| **StaggeredMenu** | Framer Motion Stagger | Menú lateral desplegable donde los enlaces entran en cascada con retraso armónico. | Menú hamburguesa para teléfonos móviles. |
| **BubbleMenu** | Framer Motion Springs | Botón flotante que al presionarse despliega burbujas de opciones con rebote elástico. | Botón de ayuda rápida: [Llamar \| WhatsApp \| Enviar Correo \| Ver Mapa]. |
| **LineSidebar** | CSS SVG Path Morphing | Barra lateral con indicador vertical de línea viva que se estira hacia el enlace activo. | Menú de navegación para páginas legales y documentación técnica. |
| **Folder** | Framer Motion 3D Folder | Componente de carpeta que se abre en 3D revelando documentos y fichas técnicas en su interior. | Pestaña de *"Documentación Legal"*: abre el Decreto Supremo MTT 55/2025 y ficha de garantía. |
| **GlassIcons** | CSS Backdrop-Filter | Iconos de vidrio esmerilado con refracción interna de luz y colores vibrantes. | Iconos de beneficios: [Envío Seguro, Acero Estructural, Garantía SERNAC, Pago Encriptado]. |
| **GlassSurface** | CSS Glassmorphism | Panel de vidrio translúcido con desenfoque de fondo y borde iluminado. | Contenedor de la barra de navegación y del drawer del carrito de compras. |
| **FluidGlass** | WebGL Refraction | Superficie de vidrio líquido que distorsiona ópticamente los elementos detrás al moverla. | Efecto interactivo sobre imágenes de fogones encendidos. |
| **FlyingPosters** | Three.js 3D Mesh | Posters publicitarios suspendidos en el aire que se inclinan con la inercia del scroll vertical. | Galería de infografías de uso reglamentario de la barra de remolque. |
| **DriftWall** | CSS Parallax Drift | Muro infinito de imágenes con movimiento de deriva constante y efecto de profundidad. | Muro social de publicaciones de Instagram (@metalcreativo.cl) en la web. |
| **Masonry** | Framer Motion Grid | Grilla estilo Pinterest con reordenamiento suave de tarjetas de diferentes alturas. | Galería de fotos de proyectos especiales, rejas, mesas y fogones. |
| **AccordionGallery** | Framer Motion Flex Grow | Galería donde la imagen sobre la que se pasa el mouse se expande ocupando el 60% del ancho. | Comparativa visual de los 3 acabados disponibles para los fogones a bioetanol. |
| **AnimatedList** | Framer Motion List | Lista de elementos que entran con animación escalonada y se reorganizan solas al filtrar. | Lista interactiva de preguntas frecuentes con buscador en vivo. |
| **Carousel** | Embla Carousel / Touch | Carrusel táctil con inercia suave, soporte para gestos móviles y miniaturas de navegación. | Carrusel de fotos del producto en la vista de detalle de compra. |
| **ChromaGrid** | Canvas Dynamic Palette | Grilla que extrae y adapta su iluminación según los colores dominantes de la foto del producto. | Fondo dinámico que cambia de tono según si ves la lanza (naranja/acero) o el fogón (ámbar/madera). |
| **Counter** | Framer Motion Number | Odómetro numérico que rueda como reloj mecánico al cambiar las cantidades en el carrito. | Selector de unidades (+ / -) y cálculo en vivo del subtotal en el carrito. |
| **CurvedInput** | CSS SVG Border | Campos de texto para formularios con bordes interactivos que se iluminan al escribir. | Formulario de cotización de medidas especiales en contacto.html. |
| **ElasticSlider** | Framer Motion Drag | Control deslizante de rango con respuesta elástica que se estira al llegar al tope. | Filtro de presupuesto o selector de medidas de largo en centímetros. |
| **MorphSlider** | SVG Morphing Shaders | Deslizador donde la forma del botón muta orgánicamente mientras se arrastra. | Selector de capacidad térmica para estufas a bioetanol. |
| **OptionWheel** | CSS 3D Cylinder | Rueda selectora giratoria estilo caja fuerte para elegir opciones y acabados. | Selector de color de la lanza: [Naranja Seguridad Reglamentario \| Negro Mate \| Amarillo Vial]. |
| **ProfileCard** | CSS 3D Card Hover | Tarjeta de presentación de perfil de artesano o equipo de maestranza con insignias y sellos. | Ficha de *"Nuestros Maestros Soldadores"* para dar cercanía humana a la marca. |
| **Stack** | Framer Motion Drag | Pila de fotos interactivas que el usuario puede deslizar a la izquierda o derecha para descartar. | Mazo de fotos de clientes remolcando sus autos con la lanza en situaciones reales. |
| **Stepper** | Framer Motion Steps | Barra de progreso numerada con checkmarks animados que avanza con el flujo de compra. | Cabecera del proceso de pago: [1. Carrito ➡️ 2. Datos de Envío ➡️ 3. Pago Seguro ➡️ 4. Comprobante]. |
| **AccordionFAQ** | Alpine.js / Framer Motion | Módulos de preguntas colapsables con apertura elástica y rotación suave de flecha indicadora. | Despliegue de preguntas frecuentes sobre compatibilidad con vehículos y envíos. |
