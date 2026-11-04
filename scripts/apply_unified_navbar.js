const fs = require('fs');

const unifiedHeader = `    <!-- NAVBAR OFICIAL UNIFICADO -->
    <header class="sticky top-0 z-40 bg-[#07080b]/95 backdrop-blur-md border-b border-white/10 py-3 shadow-xl">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <a href="/" class="flex items-center gap-3 spark-trigger" title="Metal Creativo Chile - Inicio">
                <img src="/images/logo_official.png" alt="Metal Creativo Chile" class="h-10 sm:h-12 w-auto object-contain">
            </a>

            <!-- NAVEGACIÓN GLOBAL COHERENTE -->
            <nav class="hidden md:flex items-center gap-6 lg:gap-8 text-xs uppercase tracking-wider font-bold text-gray-300">
                <a href="/" class="hover:text-orange-400 transition-colors spark-trigger">Inicio</a>
                <a href="/barra-de-remolque" class="hover:text-orange-400 transition-colors spark-trigger">Barra Remolque</a>
                <a href="/fogon-bioetanol" class="hover:text-orange-400 transition-colors spark-trigger">Fogón Bioetanol</a>
                <a href="/barra-de-remolque#envios-resenas" class="hover:text-orange-400 transition-colors spark-trigger">Envíos & Reseñas</a>
                <a href="/barra-de-remolque#comparativa-legal" class="hover:text-orange-400 transition-colors spark-trigger">Ley MTT</a>
                <a href="/contacto" class="hover:text-orange-400 transition-colors spark-trigger">Contacto</a>
            </nav>

            <div class="flex items-center gap-2 sm:gap-3">
                <!-- LINK MERCADO LIBRE -->
                <a href="https://articulo.mercadolibre.cl/MLC-4414859324?matt_tool=94515950" target="_blank" rel="noopener noreferrer" class="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#ffe600] text-neutral-950 font-extrabold text-xs hover:bg-yellow-300 transition-all shadow" title="Comprar en Mercado Libre">
                    <img src="/images/logo_mercadolibre_handshake_official.png" alt="Mercado Libre" class="w-5 h-3.5 object-contain">
                    <span>Mercado Libre</span>
                </a>

                <!-- LINK TIKTOK -->
                <a href="https://www.tiktok.com/@metalcreativo.cl" target="_blank" rel="noopener noreferrer" class="hidden sm:inline-flex p-2 rounded-[4px] bg-neutral-900/80 border border-white/10 hover:border-pink-500/50 text-white hover:text-pink-400 transition-all" title="TikTok Oficial @metalcreativo.cl">
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.298 0 .592.046.87.136V9.41a6.33 6.33 0 00-.87-.06A6.34 6.34 0 003.11 15.7 6.34 6.34 0 009.45 22a6.33 6.33 0 006.34-6.33V9.58a8.16 8.16 0 004.8 1.56V7.7a4.85 4.85 0 01-1-.01z"/></svg>
                </a>

                <!-- BOTÓN CARRITO -->
                <button @click="cartOpen = true" class="relative p-2.5 rounded-[4px] bg-neutral-900 border border-white/10 hover:border-orange-500/50 text-white transition-all cursor-pointer spark-trigger" title="Ver Carrito de Compras">
                    <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span x-show="totalItems > 0" x-text="totalItems" class="absolute -top-1.5 -right-1.5 bg-[#c83c00] text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#07080b]"></span>
                </button>

                <!-- BOTÓN WHATSAPP OFICIAL -->
                <a href="https://wa.me/56954922608?text=Hola%20Metal%20Creativo,%20quisiera%20hacer%20una%20consulta" target="_blank" rel="noopener" class="btn-metal-orange spark-trigger !py-2 !px-3.5 !text-xs">
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    <span class="hidden sm:inline">WhatsApp</span>
                </a>
            </div>
        </div>
    </header>`;

const checkoutHeader = `    <!-- TOP BAR DE NAVEGACIÓN EN CHECKOUT -->
    <header class="sticky top-0 z-40 bg-[#07080b]/95 backdrop-blur-md border-b border-white/10 py-3 shadow-md">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <a href="/" class="flex items-center gap-3" title="Volver a Inicio">
                <img src="/images/logo_official.png" alt="Metal Creativo Chile" class="h-9 sm:h-10 w-auto object-contain">
            </a>
            <div class="flex items-center gap-4 text-xs font-semibold">
                <a href="/" class="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                    <span>&larr;</span>
                    <span>Seguir Comprando</span>
                </a>
                <a href="/barra-de-remolque" class="text-gray-300 hover:text-orange-400 transition-colors hidden sm:inline">
                    Barra Remolque
                </a>
                <a href="/fogon-bioetanol" class="text-gray-300 hover:text-orange-400 transition-colors hidden sm:inline">
                    Fogón Bioetanol
                </a>
                <a href="https://wa.me/56954922608?text=Hola%20Metal%20Creativo,%20necesito%20ayuda%20con%20mi%20compra" target="_blank" rel="noopener" class="btn-metal-orange !py-1.5 !px-3 !text-[11px]">
                    Ayuda WhatsApp
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
  
  // Replace existing header with unifiedHeader
  const headerMatch = html.match(/<header[\s\S]*?<\/header>/);
  if (headerMatch) {
    html = html.replace(headerMatch[0], unifiedHeader.trim());
    fs.writeFileSync(p, html, 'utf8');
    console.log('Applied Unified Header to:', p);
  }
}

// For checkout.html: add checkoutHeader right after <body ...>
['public/checkout.html', 'checkout.html'].forEach(p => {
  if (fs.existsSync(p)) {
    let html = fs.readFileSync(p, 'utf8');
    // If it already has TOP BAR DE NAVEGACIÓN EN CHECKOUT, replace it
    if (html.includes('TOP BAR DE NAVEGACIÓN EN CHECKOUT')) {
      const match = html.match(/<!-- TOP BAR DE NAVEGACIÓN EN CHECKOUT -->[\s\S]*?<\/header>/);
      if (match) html = html.replace(match[0], checkoutHeader.trim());
    } else {
      // Insert right after body tag
      html = html.replace(/(<body[^>]*>)/i, '$1\n\n' + checkoutHeader.trim() + '\n');
    }
    fs.writeFileSync(p, html, 'utf8');
    console.log('Applied Checkout Top Bar to:', p);
  }
});
