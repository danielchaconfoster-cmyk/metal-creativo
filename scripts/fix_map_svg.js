const fs = require('fs');

const files = [
  'public/checkout.html',
  'public/barra-de-remolque.html',
  'public/index.html',
  'public/fogon-bioetanol.html',
  'public/contacto.html',
  'public/devoluciones-garantia.html',
  'public/preguntas-frecuentes.html',
  'public/privacidad.html',
  'public/terminos-condiciones.html',
  'public/checkout-success.html'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  
  // Find map SVG and fix styling so it cannot explode
  // Replace svg in map with strict inline styles
  const badSvgPattern = /<svg class="w-8 h-8 text-white group-hover:text-orange-500 group-hover:scale-110 transition-all duration-500"[^>]*>[\s\S]*?<\/svg>/g;
  
  const fixedSvg = `<svg class="w-7 h-7 text-white group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300" width="28" height="28" style="width: 28px !important; height: 28px !important; max-width: 28px !important; max-height: 28px !important; min-width: 28px !important; min-height: 28px !important; flex-shrink: 0; color: #ffffff; display: block; margin: 0 auto;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                                <circle cx="12" cy="9" r="2.5"/>
                            </svg>`;

  if (badSvgPattern.test(html)) {
    html = html.replace(badSvgPattern, fixedSvg);
    fs.writeFileSync(file, html, 'utf8');
    console.log(`Fixed map SVG in ${file}`);
  }
}
