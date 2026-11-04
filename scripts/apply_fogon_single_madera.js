const fs = require('fs');

const fogonMainContent = `    <!-- CONTENIDO PRINCIPAL: FOGÓN MADERA NOBLE & ACERO ($160.000) -->
    <main class="py-8 sm:py-12 lg:py-16" x-data="{
        activeImg: '/images/fogon_bioetanol_madera.jpg',
        productPrice: 160000,
        productName: 'Fogón Bioetanol Madera Noble & Acero',
        productSku: 'MC-FOG-MAD'
    }">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">

                <!-- GALERÍA DE IMÁGENES INTERACTIVA: FOTOS REALES MADERA NOBLE & ACERO -->
                <div class="lg:col-span-6 space-y-4">
                    <!-- VISOR PRINCIPAL -->
                    <div class="rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl relative aspect-[4/3] flex items-center justify-center group select-none">
                        <img 
                            :src="activeImg" 
                            alt="Fogón Bioetanol Madera Noble y Acero" 
                            class="w-full h-full object-cover transition-all duration-300"
                        >
                        <div class="absolute top-3 left-3 bg-[#c83c00] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow">
                            <span>Madera Noble Tratada & Acero</span>
                        </div>
                    </div>

                    <!-- MINIATURAS INTERACTIVAS (FOTOS REALES) -->
                    <div class="grid grid-cols-2 gap-3">
                        <!-- Miniatura 1: Madera Frontal -->
                        <button 
                            @click="activeImg = '/images/fogon_bioetanol_madera.jpg'" 
                            class="rounded-lg overflow-hidden border focus:outline-none transition-all aspect-video bg-black/40 relative cursor-pointer"
                            :class="activeImg === '/images/fogon_bioetanol_madera.jpg' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-white/10 hover:border-orange-500/50'"
                            type="button"
                        >
                            <img src="/images/fogon_bioetanol_madera.jpg" alt="Madera Noble Frontal" class="w-full h-full object-cover">
                            <span class="absolute bottom-1 left-1 bg-black/80 text-[9px] text-white px-1.5 py-0.5 rounded font-bold">Frontal Madera</span>
                        </button>

                        <!-- Miniatura 2: Noche Terraza -->
                        <button 
                            @click="activeImg = '/images/fogon_terraza_noche.jpeg'" 
                            class="rounded-lg overflow-hidden border focus:outline-none transition-all aspect-video bg-black/40 relative cursor-pointer"
                            :class="activeImg === '/images/fogon_terraza_noche.jpeg' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-white/10 hover:border-orange-500/50'"
                            type="button"
                        >
                            <img src="/images/fogon_terraza_noche.jpeg" alt="Terraza Nocturna" class="w-full h-full object-cover">
                            <span class="absolute bottom-1 left-1 bg-black/80 text-[9px] text-white px-1.5 py-0.5 rounded font-bold">Encendido Terraza</span>
                        </button>
                    </div>

                    <div class="p-4 rounded-lg bg-orange-950/20 border border-orange-500/20 flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">🔥</span>
                            <div>
                                <h4 class="text-xs font-bold text-white uppercase tracking-wider">Combustión Limpia & Sin Olores</h4>
                                <p class="text-[11px] text-gray-400">Bioetanol vegetal. No emite humo ni hollín en living o terrazas.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- INFORMACIÓN TÉCNICA Y ACCIONES DE COMPRA -->
                <div class="lg:col-span-6 space-y-6">
                    <div class="space-y-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="badge-metal">Fuego 100% Ecológico</span>
                            <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">En Existencia (Fabricación Nacional)</span>
                            <span class="text-gray-400 text-xs font-mono">SKU: MC-FOG-MAD</span>
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                            Fogón Ecológico a Bioetanol en Madera Noble & Acero
                        </h1>
                        <p class="text-gray-400 text-sm leading-relaxed">
                            Calor real, diseño de taller y máxima calidez para living, departamentos y terrazas. Fabricado con bandeja perimetral en madera noble tratada y estructura de acero estructural de alta resistencia, con quemador de combustión limpia y piedras decorativas de cuarzo blanco natural.
                        </p>
                    </div>

                    <!-- PRECIO Y CONDICIONES -->
                    <div class="p-5 rounded-xl bg-[#0e1117] border border-white/10 space-y-3">
                        <div class="flex items-baseline justify-between">
                            <div class="flex items-baseline gap-3">
                                <span class="text-4xl font-black text-white font-mono">$160.000</span>
                                <span class="text-xs text-gray-400 uppercase tracking-widest font-bold">CLP</span>
                            </div>
                            <span class="text-xs px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 font-bold">Madera Noble & Acero</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>Garantía Legal de 6 Meses conforme a Ley N° 19.496 (SERNAC)</span>
                        </div>
                        <p class="text-[11px] text-gray-400 border-t border-white/5 pt-2">
                            Incluye quemador central de combustión controlada, carga de piedras de cuarzo blanco natural y tapa metálica de sofocación para apagado instantáneo.
                        </p>
                    </div>

                    <!-- BOTONES DE COMPRA DIRECTA -->
                    <div class="space-y-3 pt-2">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button 
                                @click="buyNow('fogon_madera', productName, productPrice, activeImg)" 
                                class="btn-metal-orange w-full !text-sm !py-3.5 cursor-pointer spark-trigger"
                                type="button"
                            >
                                <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                                </svg>
                                <span>Comprar Ahora — $160.000</span>
                            </button>
                            <button 
                                @click="addItem('fogon_madera', productName, productPrice, activeImg)" 
                                class="btn-metal-primary w-full !text-sm !py-3.5 cursor-pointer spark-trigger"
                                type="button"
                            >
                                <svg class="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                </svg>
                                <span>Agregar al Carrito</span>
                            </button>
                        </div>

                        <!-- CONSULTA DIRECTA WHATSAPP -->
                        <a 
                            href="https://wa.me/56954922608?text=Hola%20Metal%20Creativo,%20quiero%20consultar%20por%20el%20Fog%C3%B3n%20Bioetanol%20Madera%20Noble%20de%20$160.000" 
                            target="_blank" 
                            rel="noopener" 
                            class="w-full py-2.5 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            <span>Consultar por WhatsApp con el Fabricante</span>
                        </a>
                    </div>

                    <!-- ESPECIFICACIONES TÉCNICAS (CON HONESTIDAD Y PRECISIÓN) -->
                    <div class="border-t border-white/10 pt-4 space-y-3">
                        <h3 class="text-xs font-bold text-white uppercase tracking-wider">Especificaciones Técnicas:</h3>
                        <div class="overflow-x-auto rounded-lg border border-white/10">
                            <table class="w-full text-left text-xs text-gray-300">
                                <tbody class="divide-y divide-white/5 bg-black/30">
                                    <tr>
                                        <td class="p-3 font-semibold text-gray-400 bg-white/5 w-1/3">Estructura Base</td>
                                        <td class="p-3 text-white">Acero estructural nacional reforzado + Madera noble tratada</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 font-semibold text-gray-400 bg-white/5">Quemador</td>
                                        <td class="p-3 text-white">Acero estructural con cámara de bioetanol y fibra térmica</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 font-semibold text-gray-400 bg-white/5">Dimensiones</td>
                                        <td class="p-3 text-white">50 cm largo × 16 cm ancho × 12 cm alto (aprox.)</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 font-semibold text-gray-400 bg-white/5">Combustible</td>
                                        <td class="p-3 text-white">Bioetanol vegetal desnaturalizado al 96%</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 font-semibold text-gray-400 bg-white/5">Autonomía</td>
                                        <td class="p-3 text-white">2 a 3 horas continuas de llama viva por carga</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 font-semibold text-gray-400 bg-white/5">Emisiones</td>
                                        <td class="p-3 text-white">Cero humo, cero cenizas y sin olores en interiores</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 font-semibold text-gray-400 bg-white/5">Accesorios</td>
                                        <td class="p-3 text-white">Carga de piedras de cuarzo blanco natural + tapa de apagado</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 font-semibold text-gray-400 bg-white/5">Garantía</td>
                                        <td class="p-3 text-white">6 Meses conforme a Ley N° 19.496 (SERNAC)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

            </div>
        </div>`;

const files = ['public/fogon-bioetanol.html', 'fogon-bioetanol.html'];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f, 'utf8');

  // Replace from <main ... to <!-- SECCIÓN VENTAJAS BIOETANOL VS LEÑA O GAS -->
  const mainStart = html.indexOf('<main');
  const ventajasStart = html.indexOf('<!-- SECCIÓN VENTAJAS BIOETANOL VS LEÑA O GAS -->');
  
  if (mainStart !== -1 && ventajasStart !== -1) {
    html = html.slice(0, mainStart) + fogonMainContent + '\n\n            ' + html.slice(ventajasStart);
  }

  // Update title and meta
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Fogón Bioetanol en Madera Noble y Acero | Metal Creativo Chile</title>');
  html = html.replace(/Desde \$140\.000 CLP/g, '$160.000 CLP');
  html = html.replace(/"price":\s*"1[04]0000"/g, '"price": "160000"');
  
  fs.writeFileSync(f, html, 'utf8');
  console.log('Successfully updated fogon-bioetanol:', f);
}
