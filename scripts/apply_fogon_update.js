const fs = require('fs');

// 1. UPDATE FOGON BIOETANOL
console.log('1. Updating fogon-bioetanol.html...');
const fogonHtml = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');

const mainStart = fogonHtml.indexOf('<main class="py-10 lg:py-16">');
const ventajasStart = fogonHtml.indexOf('<!-- SECCIÓN VENTAJAS BIOETANOL');

if (mainStart !== -1 && ventajasStart !== -1) {
  const newMain = `
    <!-- MAIN PRODUCT SECTION (DOS MODELOS: MADERA $160.000 / ACERO $140.000) -->
    <main class="py-10 lg:py-16" x-data="{
        selectedModel: 'madera',
        activeImg: '/images/fogon_bioetanol_madera.jpg',
        get currentPrice() {
            return this.selectedModel === 'madera' ? 160000 : 140000;
        },
        get currentName() {
            return this.selectedModel === 'madera' ? 'Fogón Bioetanol Madera Noble & Acero' : 'Fogón Bioetanol Estructural Acero 50cm';
        },
        get currentImg() {
            return this.selectedModel === 'madera' ? this.activeImg : '/images/fogon_real_50.jpg';
        },
        get currentSku() {
            return this.selectedModel === 'madera' ? 'MC-FOG-MAD' : 'MC-FOG-ACE50';
        },
        selectModel(m) {
            this.selectedModel = m;
            if (m === 'madera') {
                this.activeImg = '/images/fogon_bioetanol_madera.jpg';
            } else {
                this.activeImg = '/images/fogon_real_50.jpg';
            }
        }
    }">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

                <!-- GALERÍA DE IMÁGENES INTERACTIVA (SIN IMAGEN 3, CON IMAGEN 1, 2 Y 4) -->
                <div class="lg:col-span-6 space-y-4">
                    <!-- VISOR PRINCIPAL -->
                    <div class="rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl relative aspect-[4/3] flex items-center justify-center group select-none">
                        <img 
                            :src="currentImg" 
                            :alt="currentName" 
                            class="w-full h-full object-cover transition-all duration-300"
                        >
                        <div class="absolute top-3 left-3 bg-[#c83c00] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow">
                            <span x-text="selectedModel === 'madera' ? 'Modelo Madera Noble & Acero' : 'Modelo 100% Acero (50 cm)'"></span>
                        </div>
                    </div>

                    <!-- MINIATURAS INTERACTIVAS -->
                    <div class="grid grid-cols-3 gap-3">
                        <!-- Miniatura 1: Madera Frontal -->
                        <button 
                            @click="selectModel('madera'); activeImg = '/images/fogon_bioetanol_madera.jpg'" 
                            class="rounded-lg overflow-hidden border focus:outline-none transition-all aspect-video bg-black/40 relative cursor-pointer"
                            :class="selectedModel === 'madera' && activeImg === '/images/fogon_bioetanol_madera.jpg' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-white/10 hover:border-orange-500/50'"
                        >
                            <img src="/images/fogon_bioetanol_madera.jpg" alt="Madera Noble" class="w-full h-full object-cover">
                            <span class="absolute bottom-1 left-1 bg-black/80 text-[9px] text-white px-1.5 py-0.5 rounded font-bold">Madera</span>
                        </button>

                        <!-- Miniatura 2: Noche Terraza -->
                        <button 
                            @click="selectModel('madera'); activeImg = '/images/fogon_terraza_noche.jpeg'" 
                            class="rounded-lg overflow-hidden border focus:outline-none transition-all aspect-video bg-black/40 relative cursor-pointer"
                            :class="selectedModel === 'madera' && activeImg === '/images/fogon_terraza_noche.jpeg' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-white/10 hover:border-orange-500/50'"
                        >
                            <img src="/images/fogon_terraza_noche.jpeg" alt="Terraza Nocturna" class="w-full h-full object-cover">
                            <span class="absolute bottom-1 left-1 bg-black/80 text-[9px] text-white px-1.5 py-0.5 rounded font-bold">Terraza</span>
                        </button>

                        <!-- Miniatura 3: Acero 50cm (Ex-cuarta imagen) -->
                        <button 
                            @click="selectModel('acero'); activeImg = '/images/fogon_real_50.jpg'" 
                            class="rounded-lg overflow-hidden border focus:outline-none transition-all aspect-video bg-black/40 relative cursor-pointer"
                            :class="selectedModel === 'acero' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-white/10 hover:border-orange-500/50'"
                        >
                            <img src="/images/fogon_real_50.jpg" alt="Acero 50cm" class="w-full h-full object-cover">
                            <span class="absolute bottom-1 left-1 bg-black/80 text-[9px] text-white px-1.5 py-0.5 rounded font-bold">Acero 50cm</span>
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
                            <span class="text-gray-400 text-xs" x-text="'SKU: ' + currentSku"></span>
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                            Fogón Ecológico a Bioetanol
                        </h1>
                        <p class="text-gray-400 text-sm leading-relaxed">
                            Calor real, diseño de taller y máxima calidez. Fabricado en acero estructural chileno de alta resistencia con quemador de combustión limpia y piedras decorativas de cuarzo natural.
                        </p>
                    </div>

                    <!-- SELECTOR DE MODELOS CLARO PARA EL CLIENTE -->
                    <div class="space-y-2.5">
                        <label class="block text-xs font-bold uppercase tracking-wider text-orange-400">
                            1. Selecciona tu Modelo de Fogón:
                        </label>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            
                            <!-- MODELO 1: MADERA NOBLE ($160.000) -->
                            <div 
                                @click="selectModel('madera')" 
                                class="p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2"
                                :class="selectedModel === 'madera' ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50' : 'border-white/10 bg-neutral-900/60 hover:border-white/20'"
                            >
                                <div class="flex items-center justify-between">
                                    <strong class="text-white text-xs font-bold">Madera Noble & Acero</strong>
                                    <span class="text-xs font-mono font-bold text-orange-400">$160.000</span>
                                </div>
                                <p class="text-[11px] text-gray-400 leading-tight">Bandeja de madera noble tratada combinada con acero estructural.</p>
                                <div class="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold pt-1">
                                    <span>✓ Piedras de Cuarzo</span>
                                </div>
                            </div>

                            <!-- MODELO 2: 100% ACERO 50CM ($140.000) -->
                            <div 
                                @click="selectModel('acero')" 
                                class="p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2"
                                :class="selectedModel === 'acero' ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50' : 'border-white/10 bg-neutral-900/60 hover:border-white/20'"
                            >
                                <div class="flex items-center justify-between">
                                    <strong class="text-white text-xs font-bold">100% Acero Estructural</strong>
                                    <span class="text-xs font-mono font-bold text-orange-400">$140.000</span>
                                </div>
                                <p class="text-[11px] text-gray-400 leading-tight">Perfil de 50 cm en acero chileno soldado, acabado alta temperatura.</p>
                                <div class="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold pt-1">
                                    <span>✓ Piedras de Cuarzo</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    <!-- PRECIO Y CONDICIONES -->
                    <div class="p-5 rounded-xl bg-[#0e1117] border border-white/10 space-y-3">
                        <div class="flex items-baseline justify-between">
                            <div class="flex items-baseline gap-3">
                                <span class="text-4xl font-black text-white font-mono" x-text="'$' + formatPrice(currentPrice)"></span>
                                <span class="text-xs text-gray-400 uppercase tracking-widest font-bold">CLP</span>
                            </div>
                            <span class="text-xs px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 font-bold" x-text="selectedModel === 'madera' ? 'Madera Noble ($160.000)' : 'Acero 50 cm ($140.000)'"></span>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>Garantía Legal de 6 Meses directa conforme a Ley N° 19.496 (SERNAC)</span>
                        </div>
                        <p class="text-[11px] text-gray-400 border-t border-white/5 pt-2">
                            Incluye quemador de combustión controlada, carga de piedras de cuarzo y tapa de apagado instantáneo por sofocación.
                        </p>
                    </div>

                    <!-- BOTONES DE COMPRA DIRECTA -->
                    <div class="space-y-3 pt-2">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button 
                                @click="buyNow(selectedModel === 'madera' ? 'fogon_madera' : 'fogon_acero', currentName, currentPrice, currentImg)" 
                                class="btn-metal-orange w-full !text-sm !py-3.5 cursor-pointer spark-trigger"
                            >
                                <span>Comprar Ahora &rarr;</span>
                            </button>
                            <button 
                                @click="addItem(selectedModel === 'madera' ? 'fogon_madera' : 'fogon_acero', currentName, currentPrice, currentImg)" 
                                class="btn-metal-secondary w-full !text-sm !py-3.5 cursor-pointer spark-trigger"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                                </svg>
                                <span>Añadir al Carrito</span>
                            </button>
                        </div>

                        <a :href="'https://wa.me/56954922608?text=Hola%20Metal%20Creativo,%20quiero%20hacer%20el%20pedido%20directo%20del%20' + encodeURIComponent(currentName) + '%20de%20$' + formatPrice(currentPrice)" target="_blank" rel="noopener" class="w-full py-3 px-4 rounded-[4px] bg-[#128C7E]/20 border border-[#25D366]/30 hover:border-[#25D366] text-emerald-400 hover:text-white flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all">
                            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            <span>Comprar directo por WhatsApp con asesor humano</span>
                        </a>
                    </div>

                    <!-- TABLA TÉCNICA HONESTA DE TALLER -->
                    <div class="pt-6 border-t border-white/10 space-y-3">
                        <h3 class="text-xs uppercase tracking-widest font-extrabold text-orange-400">Especificaciones Técnicas del Fogón</h3>
                        <div class="overflow-hidden rounded-lg border border-white/10 text-xs">
                            <table class="w-full text-left">
                                <tbody class="divide-y divide-white/5">
                                    <tr class="bg-white/[0.02]">
                                        <th class="py-2.5 px-4 font-semibold text-gray-400 w-1/3">Estructura Base</th>
                                        <td class="py-2.5 px-4 text-white font-medium">Acero estructural chileno soldado en taller con terminación de alta temperatura</td>
                                    </tr>
                                    <tr>
                                        <th class="py-2.5 px-4 font-semibold text-gray-400">Bandeja Superior</th>
                                        <td class="py-2.5 px-4 text-white font-medium" x-text="selectedModel === 'madera' ? 'Madera noble tratada y sellada para intemperie' : 'Perfil y chapa de acero macizo 50 cm'"></td>
                                    </tr>
                                    <tr class="bg-white/[0.02]">
                                        <th class="py-2.5 px-4 font-semibold text-gray-400">Piedras Decorativas</th>
                                        <td class="py-2.5 px-4 text-white font-medium">Piedras de cuarzo natural de alta inercia térmica</td>
                                    </tr>
                                    <tr>
                                        <th class="py-2.5 px-4 font-semibold text-gray-400">Combustible</th>
                                        <td class="py-2.5 px-4 text-white font-medium">Bioetanol / Alcohol vegetal desnaturalizado al 96° (Cero humo, cero olor)</td>
                                    </tr>
                                    <tr class="bg-white/[0.02]">
                                        <th class="py-2.5 px-4 font-semibold text-gray-400">Autonomía Térmica</th>
                                        <td class="py-2.5 px-4 text-white font-medium">3.5 a 5 horas continuas de llama real por recarga de 1 litro</td>
                                    </tr>
                                    <tr>
                                        <th class="py-2.5 px-4 font-semibold text-gray-400">Mecanismo de Apagado</th>
                                        <td class="py-2.5 px-4 text-orange-400 font-bold">Tapa obturadora metálica para sofocación inmediata de oxígeno</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    </main>
`;

  let updatedFogon = fogonHtml.slice(0, mainStart) + newMain + '\n' + fogonHtml.slice(ventajasStart);
  
  // Clean up any remaining inox/termoesmaltado
  updatedFogon = updatedFogon.replace(/Acero Inoxidable AISI 304/g, 'Acero Estructural');
  updatedFogon = updatedFogon.replace(/acero inoxidable/gi, 'acero estructural');
  updatedFogon = updatedFogon.replace(/termoesmaltad[oa]/gi, 'acabado para alta temperatura');

  fs.writeFileSync('public/fogon-bioetanol.html', updatedFogon, 'utf8');
  if (fs.existsSync('fogon-bioetanol.html')) {
    fs.writeFileSync('fogon-bioetanol.html', updatedFogon, 'utf8');
  }
  console.log('fogon-bioetanol.html updated successfully! Length:', updatedFogon.length);
} else {
  console.error('Could not find start or end tags in fogon-bioetanol.html');
}
