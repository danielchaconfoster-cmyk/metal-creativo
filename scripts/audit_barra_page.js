const fs = require('fs');

const html = fs.readFileSync('public/barra-de-remolque.html', 'utf8');

console.log('--- VERIFICATION AUDIT FOR barra-de-remolque.html ---');
console.log('1. Has emberCanvas:', html.includes('id="emberCanvas"'));
console.log('2. Has sparkCanvas:', html.includes('id="sparkCanvas"'));
console.log('3. Has initEmbers script:', html.includes('function initEmbers()'));
console.log('4. Has initMouseSparks script:', html.includes('function initMouseSparks()'));
console.log('5. Has Amarok video:', html.includes('/videos/prueba_arrastre_amarok.mp4'));
console.log('6. Has Assembly video:', html.includes('/videos/video_armado_lanza.mp4'));
console.log('7. Has Fotos Reales section:', html.includes('id="fotos-reales"'));
console.log('8. Has Envíos y Reseñas section:', html.includes('id="envios-resenas"'));
console.log('9. Has FAQ section:', html.includes('Preguntas Frecuentes'));
console.log('10. Has Meta Pixel 1416637987347092:', html.includes('1416637987347092'));
console.log('11. Has ViewContent event:', html.includes("fbq('track', 'ViewContent'"));
console.log('12. Has buyNow to checkout:', html.includes("buyNow('barra_remolque'"));

// Check all media files referenced
const mediaRegex = /(?:src|poster)=["']([^"']+)["']/g;
let m;
const missing = [];
while ((m = mediaRegex.exec(html)) !== null) {
  const src = m[1];
  if (src.startsWith('/') || src.startsWith('./')) {
    const clean = 'public/' + src.replace(/^\.?\//, '');
    if (!fs.existsSync(clean)) {
      missing.push(clean);
    }
  }
}

if (missing.length === 0) {
  console.log('🎉 ALL media files exist on disk!');
} else {
  console.warn('WARNING: Missing media files:', missing);
}
