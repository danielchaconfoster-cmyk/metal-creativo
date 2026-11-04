const fs = require('fs');

const updatedGalleryHtml = `                <!-- GALERÍA DE IMÁGENES Y VIDEO 100% REALES -->
                <div class="lg:col-span-6 space-y-4" x-data="{ 
                    currentMedia: 'image', 
                    currentImg: '/images/lanza_armada_completa.jpeg',
                    currentVideo: '/videos/video_demostracion_barra.mp4'
                }">
                    <!-- VISOR PRINCIPAL MULTIMEDIA -->
                    <div class="rounded-xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl relative aspect-[4/3] flex items-center justify-center group select-none">
                        <!-- VISTA IMAGEN -->
                        <template x-if="currentMedia === 'image'">
                            <img :src="currentImg" alt="Barra de Remolque Desarmable Oficial Metal Creativo Chile" class="w-full h-full object-cover transition-all duration-300">
                        </template>

                        <!-- VISTA VIDEO DEMOSTRACIÓN -->
                        <template x-if="currentMedia === 'video'">
                            <video :src="currentVideo" controls autoplay playsinline class="w-full h-full object-contain bg-black"></video>
                        </template>

                        <!-- BADGE INDICADOR -->
                        <span class="absolute top-3 left-3 badge-metal" x-text="currentMedia === 'video' ? '▶ Video Real Demostrativo' : 'Fotografía Real del Producto'"></span>
                    </div>

                    <!-- MINIATURAS INTERACTIVAS (4 FOTOS REALES + 1 VIDEO REAL) -->
                    <div class="grid grid-cols-5 gap-2 sm:gap-3">
                        <!-- Miniatura 1: Armada Completa -->
                        <button 
                            @click="currentMedia = 'image'; currentImg = '/images/lanza_armada_completa.jpeg'" 
                            class="rounded-lg overflow-hidden border focus:outline-none transition-all aspect-video bg-black/40 relative cursor-pointer"
                            :class="currentMedia === 'image' && currentImg === '/images/lanza_armada_completa.jpeg' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-white/10 hover:border-orange-500/50'"
                            type="button"
                            title="Barra armada completa"
                        >
                            <img src="/images/lanza_armada_completa.jpeg" alt="Barra armada completa" class="w-full h-full object-cover">
                            <span class="absolute bottom-0.5 inset-x-0 bg-black/80 text-[8px] sm:text-[9px] text-white py-0.5 text-center font-bold truncate">Armada</span>
                        </button>

                        <!-- Miniatura 2: 3 Tramos Desarmada -->
                        <button 
                            @click="currentMedia = 'image'; currentImg = '/images/lanza_3_tramos_desarmada.jpeg'" 
                            class="rounded-lg overflow-hidden border focus:outline-none transition-all aspect-video bg-black/40 relative cursor-pointer"
                            :class="currentMedia === 'image' && currentImg === '/images/lanza_3_tramos_desarmada.jpeg' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-white/10 hover:border-orange-500/50'"
                            type="button"
                            title="Desarmada en 3 piezas"
                        >
                            <img src="/images/lanza_3_tramos_desarmada.jpeg" alt="Desarmada en 3 tramos" class="w-full h-full object-cover">
                            <span class="absolute bottom-0.5 inset-x-0 bg-black/80 text-[8px] sm:text-[9px] text-white py-0.5 text-center font-bold truncate">3 Tramos</span>
                        </button>

                        <!-- Miniatura 3: En Terreno Ruta 5 -->
                        <button 
                            @click="currentMedia = 'image'; currentImg = '/images/lanza_ruta5.jpg'" 
                            class="rounded-lg overflow-hidden border focus:outline-none transition-all aspect-video bg-black/40 relative cursor-pointer"
                            :class="currentMedia === 'image' && currentImg === '/images/lanza_ruta5.jpg' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-white/10 hover:border-orange-500/50'"
                            type="button"
                            title="En ruta real"
                        >
                            <img src="/images/lanza_ruta5.jpg" alt="En ruta real Ruta 5" class="w-full h-full object-cover">
                            <span class="absolute bottom-0.5 inset-x-0 bg-black/80 text-[8px] sm:text-[9px] text-white py-0.5 text-center font-bold truncate">En Ruta</span>
                        </button>

                        <!-- Miniatura 4: Detalle de Acero y Pasadores -->
                        <button 
                            @click="currentMedia = 'image'; currentImg = '/images/lanza_detalle_acero.jpeg'" 
                            class="rounded-lg overflow-hidden border focus:outline-none transition-all aspect-video bg-black/40 relative cursor-pointer"
                            :class="currentMedia === 'image' && currentImg === '/images/lanza_detalle_acero.jpeg' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-white/10 hover:border-orange-500/50'"
                            type="button"
                            title="Detalle de acero y pasadores"
                        >
                            <img src="/images/lanza_detalle_acero.jpeg" alt="Detalle de fabricación en acero" class="w-full h-full object-cover">
                            <span class="absolute bottom-0.5 inset-x-0 bg-black/80 text-[8px] sm:text-[9px] text-white py-0.5 text-center font-bold truncate">Acero 3mm</span>
                        </button>

                        <!-- Miniatura 5: Video Real Demostrativo -->
                        <button 
                            @click="currentMedia = 'video'" 
                            class="rounded-lg overflow-hidden border focus:outline-none transition-all aspect-video bg-black/60 relative cursor-pointer group"
                            :class="currentMedia === 'video' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-white/10 hover:border-orange-500/50'"
                            type="button"
                            title="Ver video real de la barra"
                        >
                            <img src="/images/poster_video_demostracion.jpg" alt="Video demostración barra" class="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity">
                            <div class="absolute inset-0 flex items-center justify-center">
                                <div class="w-5 h-5 rounded-full bg-orange-600/90 text-white flex items-center justify-center text-[9px] shadow">▶</div>
                            </div>
                            <span class="absolute bottom-0.5 inset-x-0 bg-black/80 text-[8px] sm:text-[9px] text-orange-400 py-0.5 text-center font-bold truncate">▶ Video</span>
                        </button>
                    </div>`;

const files = ['public/barra-de-remolque.html', 'barra-de-remolque.html'];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f, 'utf8');

  // 1. Replace gallery section
  // From <!-- GALERÍA DE IMÁGENES REALES --> up to <!-- BANNER DESCARGA FICHA TÉCNICA -->
  const galleryStart = html.indexOf('<!-- GALERÍA DE IMÁGENES');
  const bannerStart = html.indexOf('<!-- BANNER DESCARGA FICHA TÉCNICA -->');
  
  if (galleryStart !== -1 && bannerStart !== -1) {
    html = html.slice(0, galleryStart) + updatedGalleryHtml + '\n\n                    ' + html.slice(bannerStart);
    console.log('Replaced gallery in:', f);
  } else {
    console.warn('Gallery markers not found in:', f);
  }

  // 2. Replace WhatsApp button text: remove "humano"
  html = html.replace(/Comprar directo por WhatsApp con asesor humano/g, 'Comprar directo por WhatsApp con un Asesor');

  // 3. Update Video 2 poster in the dual video section
  html = html.replace(/poster="\/images\/poster_video_armado\.jpg"/g, 'poster="/images/poster_video_armado_real.jpg"');

  fs.writeFileSync(f, html, 'utf8');
  console.log('Finished updating:', f);
}
