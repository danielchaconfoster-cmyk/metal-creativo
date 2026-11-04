const fs = require('fs');

const indexHtml = fs.readFileSync('public/index.html', 'utf8');
const originalBarra = fs.readFileSync('public/barra-de-remolque.html', 'utf8');

// 1. Extract canvas styles and scripts from index
const canvasStyle = `
        /* LIENZOS DE EFECTOS ESPECIALES (CHISPAS Y BRASAS CONTINUAS) */
        #emberCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 20;
        }

        #sparkCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
        }

        .spark-trigger {
            cursor: pointer;
        }
`;

// Extract initEmbers and initMouseSparks from index.html
const emberScriptMatch = indexHtml.match(/\/\/ 1\. CHISPAS Y FUEGO ASCENDENTE CONTINUO[\s\S]*?<\/script>/);
const particleScript = emberScriptMatch ? emberScriptMatch[0].replace('</script>', '') : '';

// 2. Build the Dual Video Section (Armado 45s + Amarok Tracción Real)
const dualVideoSection = `
            <!-- SECCIÓN DEMOSTRACIÓN DE ARMADO Y PRUEBA REAL EN PENDIENTE -->
            <section id="videos-demostracion" class="mt-20 pt-16 border-t border-white/10 scroll-mt-24">
                <div class="max-w-7xl mx-auto space-y-12">
                    <div class="text-center space-y-3">
                        <span class="badge-metal">Evidencia en Video 100% Real</span>
                        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                            Comprobada en Terreno: Ensamble en 45s y Resistencia Extrema
                        </h2>
                        <p class="text-gray-400 text-sm max-w-2xl mx-auto leading-relaxed">
                            Sin maquetas ni renders 3D. Observa cómo se ensambla sin herramientas y cómo soporta la tracción directa de vehículos pesados en pendientes pronunciadas.
                        </p>
                    </div>

                    <!-- DUAL VIDEO GRID -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
                        
                        <!-- VIDEO 1: PRUEBA DE TIRO REAL AMAROK -->
                        <div class="flex flex-col items-center space-y-4">
                            <div class="relative w-full max-w-[320px] rounded-2xl overflow-hidden border-2 border-orange-500/40 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group">
                                <video 
                                    controls 
                                    playsinline 
                                    preload="metadata" 
                                    poster="/images/thumb_cliente_amarok.jpg"
                                    class="w-full aspect-[9/16] object-cover bg-black"
                                >
                                    <source src="/videos/prueba_arrastre_amarok.mp4" type="video/mp4">
                                    Tu navegador no soporta reproducción de video HTML5.
                                </video>
                                <div class="absolute top-3 left-3 bg-[#c83c00] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow pointer-events-none">
                                    Prueba de Fuerza en Pendiente
                                </div>
                            </div>
                            <div class="text-center space-y-1">
                                <h3 class="text-sm font-bold text-white uppercase tracking-wider">Tracción Real sin Tirones Bruscos</h3>
                                <p class="text-xs text-gray-400">Camioneta Amarok remolcando en subida sin deformación</p>
                            </div>
                        </div>

                        <!-- VIDEO 2: ENSAMBLE EN 45 SEGUNDOS -->
                        <div class="flex flex-col items-center space-y-4">
                            <div class="relative w-full max-w-[320px] rounded-2xl overflow-hidden border-2 border-white/20 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group">
                                <video 
                                    controls 
                                    playsinline 
                                    preload="metadata" 
                                    poster="/images/poster_video_armado.jpg"
                                    class="w-full aspect-[9/16] object-cover bg-black"
                                >
                                    <source src="/videos/video_armado_lanza.mp4" type="video/mp4">
                                    Tu navegador no soporta reproducción de video HTML5.
                                </video>
                                <div class="absolute top-3 left-3 bg-neutral-900/90 text-orange-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-orange-500/30 pointer-events-none">
                                    Armado Paso a Paso
                                </div>
                            </div>
                            <div class="text-center space-y-1">
                                <h3 class="text-sm font-bold text-white uppercase tracking-wider">Montaje Modular en Terreno</h3>
                                <p class="text-xs text-gray-400">3 tramos compactos con pasadores de seguridad y chavetas R</p>
                            </div>
                        </div>

                    </div>

                    <!-- PASOS DE ARMADO RÁPIDO -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6">
                        <div class="metal-card p-5 rounded-xl border border-white/10 space-y-2">
                            <div class="flex items-center gap-3">
                                <span class="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-black text-sm flex items-center justify-center shrink-0 border border-orange-500/30">1</span>
                                <h4 class="text-sm font-bold text-white uppercase tracking-wider">Despliegue Rápido</h4>
                            </div>
                            <p class="text-xs text-gray-400 leading-relaxed pl-11">
                                Retira los 3 tramos (65 cm c/u) de tu maletero o de la rueda de repuesto y alinéalos en la berma de seguridad.
                            </p>
                        </div>

                        <div class="metal-card p-5 rounded-xl border border-white/10 space-y-2">
                            <div class="flex items-center gap-3">
                                <span class="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-black text-sm flex items-center justify-center shrink-0 border border-orange-500/30">2</span>
                                <h4 class="text-sm font-bold text-white uppercase tracking-wider">Pasadores y Chavetas</h4>
                            </div>
                            <p class="text-xs text-gray-400 leading-relaxed pl-11">
                                Inserta las espigas en el tramo central, cruza los pasadores galvanizados y asegura con las chavetas tipo R.
                            </p>
                        </div>

                        <div class="metal-card p-5 rounded-xl border border-white/10 space-y-2">
                            <div class="flex items-center gap-3">
                                <span class="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-black text-sm flex items-center justify-center shrink-0 border border-orange-500/30">3</span>
                                <h4 class="text-sm font-bold text-white uppercase tracking-wider">Conexión y Bandera</h4>
                            </div>
                            <p class="text-xs text-gray-400 leading-relaxed pl-11">
                                Acopla los ojales forjados a los ganchos del auto y pon la bandera reflectante obligatoria por la Ley MTT 55/2025.
                            </p>
                        </div>
                    </div>

                    <!-- BANNER CTA INTERMEDIO -->
                    <div class="max-w-5xl mx-auto p-5 rounded-xl bg-gradient-to-r from-orange-950/40 via-black to-orange-950/20 border border-orange-500/30 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <span class="text-white font-extrabold text-base block">¿Listo para viajar protegido y sin multas graves?</span>
                            <span class="text-xs text-gray-300">Precio de taller: $65.000 CLP con despacho a todo Chile vía Starken y Chilexpress.</span>
                        </div>
                        <button @click="buyNow('barra_remolque', 'Barra de Remolque Desarmable 1.8m (Ley MTT 55/2025)', 65000, '/images/lanza_real_armada.jpeg')" class="btn-metal-orange spark-trigger !py-3 !px-6">
                            Comprar Ahora por $65.000 &rarr;
                        </button>
                    </div>

                </div>
            </section>
`;

// 3. Road & Workshop Photos Section from index
const fotosRealesSection = `
            <!-- SECCIÓN PRUEBAS EN RUTA Y TALLER (FOTOGRAFÍAS REALES) -->
            <section id="fotos-reales" class="mt-20 pt-16 border-t border-white/10 scroll-mt-24">
                <div class="max-w-7xl mx-auto space-y-10">
                    <div class="text-center max-w-2xl mx-auto space-y-2">
                        <span class="badge-metal">Pruebas en Ruta y Taller</span>
                        <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Fotografías Reales en Terreno
                        </h2>
                        <p class="text-gray-400 text-sm">
                            Sin maquetas digitales ni ilustraciones artificiales. Fotografías auténticas de nuestros clientes y pruebas de taller.
                        </p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div class="rounded-xl overflow-hidden bg-black border border-white/10 space-y-3 p-3 group">
                            <img src="/images/prueba_remolque_pendiente_amarok.jpeg" alt="Prueba de tracción en pendiente Amarok" class="w-full h-56 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300">
                            <div class="px-1 text-xs text-center md:text-left">
                                <strong class="text-white block">Remolque en Subida</strong>
                                <span class="text-gray-400 text-[11px]">Tracción directa de camioneta en cerro</span>
                            </div>
                        </div>

                        <div class="rounded-xl overflow-hidden bg-black border border-white/10 space-y-3 p-3 group">
                            <img src="/images/lanza_carretera_pro.jpg" alt="Barra armada en carretera" class="w-full h-56 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300">
                            <div class="px-1 text-xs text-center md:text-left">
                                <strong class="text-white block">Distancia Reglamentaria 1.8m</strong>
                                <span class="text-gray-400 text-[11px]">Cero riesgo de impacto por frenado brusco</span>
                            </div>
                        </div>

                        <div class="rounded-xl overflow-hidden bg-black border border-white/10 space-y-3 p-3 group">
                            <img src="/images/lanza_3tramos_real.jpeg" alt="Despiece real de 3 tramos" class="w-full h-56 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300">
                            <div class="px-1 text-xs text-center md:text-left">
                                <strong class="text-white block">Despiece Compacto</strong>
                                <span class="text-gray-400 text-[11px]">3 tramos de 65 cm con pasadores pasantes</span>
                            </div>
                        </div>

                        <div class="rounded-xl overflow-hidden bg-black border border-white/10 space-y-3 p-3 group">
                            <img src="/images/prueba_remolque_pendiente_fiat.jpeg" alt="Remolque de vehículo menor" class="w-full h-56 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300">
                            <div class="px-1 text-xs text-center md:text-left">
                                <strong class="text-white block">Vehículo Urbano</strong>
                                <span class="text-gray-400 text-[11px]">Control total de giro y alineación en curvas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
`;

// 4. Shipping & Reviews Section
const enviosResenasSection = `
            <!-- SECCIÓN: ENVÍOS DIARIOS A TODO CHILE Y RESEÑAS VERIFICADAS -->
            <section id="envios-resenas" class="mt-20 pt-16 border-t border-white/10 scroll-mt-24">
                <div class="max-w-7xl mx-auto space-y-12">
                    
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div class="lg:col-span-7 space-y-4">
                            <span class="badge-metal">Logística y Despacho Express</span>
                            <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                                Despachos Diarios por Starken y Chilexpress
                            </h2>
                            <p class="text-gray-400 text-sm leading-relaxed">
                                Embalaje de alta resistencia con protección termocontraíble y esquineros reforzados. Cada paquete viaja asegurado con número de orden y seguimiento en línea directo a tu WhatsApp y correo.
                            </p>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                                <div class="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <span class="text-orange-400 font-bold block text-sm">📦 Embalaje</span>
                                    <span class="text-gray-300 text-[11px]">Protección ultra resistente</span>
                                </div>
                                <div class="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <span class="text-emerald-400 font-bold block text-sm">🚚 24-48h</span>
                                    <span class="text-gray-300 text-[11px]">Despacho express a courier</span>
                                </div>
                                <div class="p-3 rounded-lg bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
                                    <span class="text-sky-400 font-bold block text-sm">📍 Seguimiento</span>
                                    <span class="text-gray-300 text-[11px]">Rastreo en tiempo real</span>
                                </div>
                            </div>
                        </div>

                        <div class="lg:col-span-5 flex justify-center">
                            <div class="rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl relative max-w-sm w-full group">
                                <img src="/images/envio_paquetes_embalados.jpeg" alt="Paquetes de barras listos para despacho" class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300">
                                <div class="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md p-2.5 rounded-lg border border-white/10 text-xs flex items-center justify-between">
                                    <span class="text-white font-bold">Lotes listos en taller</span>
                                    <span class="text-emerald-400 font-semibold">Starken / Chilexpress</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TESTIMONIOS Y CALIFICACIONES REALES -->
                    <div class="space-y-6 pt-6">
                        <div class="text-center space-y-1">
                            <div class="flex items-center justify-center gap-1 text-amber-400 text-lg">
                                ★★★★★
                            </div>
                            <h3 class="text-lg font-bold text-white">4.9 / 5 Calificación de Conductores en Chile</h3>
                            <p class="text-xs text-gray-400">Opiniones de compradores verificados en taller y Mercado Libre</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="metal-card p-5 rounded-xl border border-white/10 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-white text-xs">Rodrigo F. (Rancagua)</span>
                                    <span class="text-amber-400 text-xs">★★★★★</span>
                                </div>
                                <p class="text-xs text-gray-400 leading-relaxed">
                                    "Tuve que remolcar la camioneta de un colega en la Ruta 5 Sur. Con la barra rígida se siente firme, cero tirones y no vas con el miedo de chocarlo al frenar. Muy sólida la soldadura."
                                </p>
                                <span class="text-[10px] text-emerald-400 font-semibold block">✓ Compra verificada</span>
                            </div>

                            <div class="metal-card p-5 rounded-xl border border-white/10 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-white text-xs">Mauricio T. (Viña del Mar)</span>
                                    <span class="text-amber-400 text-xs">★★★★★</span>
                                </div>
                                <p class="text-xs text-gray-400 leading-relaxed">
                                    "La compré para cumplir con la nueva ley del MTT. Cabe perfecto al lado de la rueda de repuesto del auto y se arma en un minuto con los pasadores. Despacho rápido por Starken."
                                </p>
                                <span class="text-[10px] text-emerald-400 font-semibold block">✓ Compra verificada</span>
                            </div>

                            <div class="metal-card p-5 rounded-xl border border-white/10 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-white text-xs">Esteban C. (Santiago)</span>
                                    <span class="text-amber-400 text-xs">★★★★★</span>
                                </div>
                                <p class="text-xs text-gray-400 leading-relaxed">
                                    "Excelente producto chileno. El acero es grueso y los ojales forjados dan muchísima confianza. Por $65.000 te ahorras una multa gravísima y un choque seguro."
                                </p>
                                <span class="text-[10px] text-emerald-400 font-semibold block">✓ Compra verificada</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
`;

console.log('Sections prepared successfully!');
fs.writeFileSync('scripts/generated_dual_video.html', dualVideoSection, 'utf8');
fs.writeFileSync('scripts/generated_fotos_reales.html', fotosRealesSection, 'utf8');
fs.writeFileSync('scripts/generated_envios_resenas.html', enviosResenasSection, 'utf8');
