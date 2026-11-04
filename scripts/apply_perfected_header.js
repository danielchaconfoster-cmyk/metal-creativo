const fs = require('fs');

const perfectedHeader = `    <!-- NAVBAR OFICIAL UNIFICADO CON MENÚ MÓVIL RESPONSIVE -->
    <header class="sticky top-0 z-40 bg-[#07080b]/95 backdrop-blur-md border-b border-white/10 shadow-xl" @keydown.escape.window="mobileMenuOpen = false">
        <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-14 sm:h-16 lg:h-20">
                <!-- LOGO OFICIAL (RESPONSIVE) -->
                <a href="/" class="flex items-center gap-2 sm:gap-3 flex-shrink-0 spark-trigger" title="Metal Creativo Chile - Inicio" @click="mobileMenuOpen = false">
                    <img src="/images/logo_official.png" alt="Metal Creativo" class="h-7 sm:h-9 lg:h-11 w-auto max-w-[135px] sm:max-w-none object-contain">
                </a>

                <!-- NAVEGACIÓN DESKTOP (md:flex) -->
                <nav class="hidden md:flex items-center gap-5 lg:gap-8 text-xs uppercase tracking-wider font-bold text-gray-300">
                    <a href="/" class="hover:text-orange-400 transition-colors spark-trigger">Inicio</a>
                    <a href="/barra-de-remolque" class="hover:text-orange-400 transition-colors spark-trigger">Barra Remolque</a>
                    <a href="/fogon-bioetanol" class="hover:text-orange-400 transition-colors spark-trigger">Fogón Bioetanol</a>
                    <a href="/barra-de-remolque#envios-resenas" class="hover:text-orange-400 transition-colors spark-trigger">Envíos & Reseñas</a>
                    <a href="/barra-de-remolque#comparativa-legal" class="hover:text-orange-400 transition-colors spark-trigger">Ley MTT</a>
                    <a href="/contacto" class="hover:text-orange-400 transition-colors spark-trigger">Contacto</a>
                </nav>

                <!-- BOTONES DE ACCIÓN (RESPONSIVE MÓVIL Y DESKTOP) -->
                <div class="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
                    <!-- LINK MERCADO LIBRE (Desktop lg+) -->
                    <a href="https://articulo.mercadolibre.cl/MLC-4414859324?matt_tool=94515950" target="_blank" rel="noopener noreferrer" class="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#ffe600] text-neutral-950 font-extrabold text-xs hover:bg-yellow-300 transition-all shadow" title="Comprar en Mercado Libre">
                        <img src="/images/logo_mercadolibre_handshake_official.png" alt="Mercado Libre" class="w-5 h-3.5 object-contain">
                        <span>Mercado Libre</span>
                    </a>

                    <!-- LINK TIKTOK (Tablet & Desktop sm+) -->
                    <a href="https://www.tiktok.com/@metalcreativo.cl" target="_blank" rel="noopener noreferrer" class="hidden sm:inline-flex p-2 rounded-[4px] bg-neutral-900/80 border border-white/10 hover:border-pink-500/50 text-white hover:text-pink-400 transition-all" title="TikTok Oficial @metalcreativo.cl">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.298 0 .592.046.87.136V9.41a6.33 6.33 0 00-.87-.06A6.34 6.34 0 003.11 15.7 6.34 6.34 0 009.45 22a6.33 6.33 0 006.34-6.33V9.58a8.16 8.16 0 004.8 1.56V7.7a4.85 4.85 0 01-1-.01z"/></svg>
                    </a>

                    <!-- BOTÓN WHATSAPP OFICIAL -->
                    <a href="https://wa.me/56954922608?text=Hola%20Metal%20Creativo,%20quisiera%20hacer%20una%20consulta" target="_blank" rel="noopener" class="p-2 sm:px-3 sm:py-2 rounded-[4px] bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold transition-all flex items-center gap-1.5 spark-trigger" title="WhatsApp Oficial">
                        <svg class="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        <span class="hidden sm:inline">WhatsApp</span>
                    </a>

                    <!-- BOTÓN CARRITO -->
                    <button @click="cartOpen = true; mobileMenuOpen = false" class="relative p-2 rounded-[4px] bg-neutral-900 border border-white/10 hover:border-orange-500/50 text-white transition-all cursor-pointer spark-trigger flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:p-2.5" title="Ver Carrito de Compras" aria-label="Carrito de compras" type="button">
                        <svg class="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <span x-show="totalItems > 0" x-text="totalItems" class="absolute -top-1 -right-1 bg-[#c83c00] text-white text-[9px] font-black rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center border border-[#07080b]"></span>
                    </button>

                    <!-- BOTÓN HAMBURGUESA MÓVIL (md:hidden) -->
                    <button 
                        @click="mobileMenuOpen = !mobileMenuOpen" 
                        class="md:hidden p-1.5 rounded-[4px] bg-neutral-900 border border-white/10 hover:border-orange-500/50 text-white transition-all cursor-pointer focus:outline-none flex items-center justify-center w-8 h-8"
                        aria-label="Abrir menú de navegación"
                        :aria-expanded="mobileMenuOpen.toString()"
                        type="button"
                    >
                        <!-- Icono hamburguesa cuando está cerrado -->
                        <svg x-show="!mobileMenuOpen" class="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                        <!-- Icono X cuando está abierto -->
                        <svg x-show="mobileMenuOpen" x-cloak class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- MENÚ MÓVIL DESPLEGABLE -->
        <div 
            x-show="mobileMenuOpen" 
            x-cloak
            x-transition:enter="transition ease-out duration-200"
            x-transition:enter-start="opacity-0 -translate-y-2"
            x-transition:enter-end="opacity-100 translate-y-0"
            x-transition:leave="transition ease-in duration-150"
            x-transition:leave-start="opacity-100 translate-y-0"
            x-transition:leave-end="opacity-0 -translate-y-2"
            @click.outside="mobileMenuOpen = false"
            class="md:hidden bg-[#090b10]/98 backdrop-blur-xl border-b border-orange-500/30 px-4 pt-3 pb-5 space-y-3 shadow-2xl"
        >
            <nav class="flex flex-col space-y-1 text-sm font-bold uppercase tracking-wider text-gray-200">
                <a href="/" @click="mobileMenuOpen = false" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-800/80 hover:text-orange-400 transition-colors">
                    <span class="text-orange-500 text-base">🏠</span>
                    <span>Inicio</span>
                </a>
                <a href="/barra-de-remolque" @click="mobileMenuOpen = false" class="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-neutral-800/80 hover:text-orange-400 transition-colors">
                    <div class="flex items-center gap-3">
                        <span class="text-orange-500 text-base">🚗</span>
                        <span>Barra de Remolque</span>
                    </div>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-extrabold normal-case">Norma MTT</span>
                </a>
                <a href="/fogon-bioetanol" @click="mobileMenuOpen = false" class="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-neutral-800/80 hover:text-orange-400 transition-colors">
                    <div class="flex items-center gap-3">
                        <span class="text-orange-500 text-base">🔥</span>
                        <span>Fogón Bioetanol</span>
                    </div>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-extrabold normal-case">$160.000</span>
                </a>
                <a href="/barra-de-remolque#envios-resenas" @click="mobileMenuOpen = false" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-800/80 hover:text-orange-400 transition-colors">
                    <span class="text-orange-500 text-base">📦</span>
                    <span>Envíos & Reseñas</span>
                </a>
                <a href="/barra-de-remolque#comparativa-legal" @click="mobileMenuOpen = false" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-800/80 hover:text-orange-400 transition-colors">
                    <span class="text-orange-500 text-base">⚖️</span>
                    <span>Ley MTT N° 55/2025</span>
                </a>
                <a href="/contacto" @click="mobileMenuOpen = false" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-800/80 hover:text-orange-400 transition-colors">
                    <span class="text-orange-500 text-base">📞</span>
                    <span>Contacto & Taller</span>
                </a>
            </nav>

            <!-- ACCESOS EXTRA EN EL MENÚ MÓVIL -->
            <div class="pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                <a href="https://articulo.mercadolibre.cl/MLC-4414859324?matt_tool=94515950" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 py-2 px-3 rounded bg-[#ffe600] text-neutral-950 font-extrabold text-xs shadow hover:bg-yellow-300 transition-colors">
                    <img src="/images/logo_mercadolibre_handshake_official.png" alt="Mercado Libre" class="w-4 h-3 object-contain">
                    <span>Mercado Libre</span>
                </a>
                <a href="https://www.tiktok.com/@metalcreativo.cl" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 py-2 px-3 rounded bg-neutral-900 border border-white/10 text-white font-bold text-xs hover:border-pink-500/50 hover:text-pink-400 transition-colors">
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.298 0 .592.046.87.136V9.41a6.33 6.33 0 00-.87-.06A6.34 6.34 0 003.11 15.7 6.34 6.34 0 009.45 22a6.33 6.33 0 006.34-6.33V9.58a8.16 8.16 0 004.8 1.56V7.7a4.85 4.85 0 01-1-.01z"/></svg>
                    <span>TikTok</span>
                </a>
            </div>
        </div>
    </header>`;

const standardPages = [
  'public/index.html',
  'index.html',
  'public/barra-de-remolque.html',
  'barra-de-remolque.html',
  'public/fogon-bioetanol.html',
  'fogon-bioetanol.html',
  'public/contacto.html',
  'contacto.html',
  'public/devoluciones-garantia.html',
  'devoluciones-garantia.html',
  'public/preguntas-frecuentes.html',
  'preguntas-frecuentes.html',
  'public/terminos-condiciones.html',
  'terminos-condiciones.html',
  'public/privacidad.html',
  'privacidad.html'
];

for (const p of standardPages) {
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, 'utf8');

  // Replace header
  const headerMatch = html.match(/<header[\s\S]*?<\/header>/);
  if (headerMatch) {
    html = html.replace(headerMatch[0], perfectedHeader.trim());
  }

  // Ensure mobileMenuOpen: false is present in cartStore
  if (!html.includes('mobileMenuOpen:')) {
    html = html.replace(/(cartOpen:\s*false,)/g, '$1\n                mobileMenuOpen: false,');
  }

  fs.writeFileSync(p, html, 'utf8');
  console.log('Applied Perfected Responsive Header to:', p);
}
