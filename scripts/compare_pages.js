const fs = require('fs');

const indexHtml = fs.readFileSync('public/index.html', 'utf8');
const barraHtml = fs.readFileSync('public/barra-de-remolque.html', 'utf8');

console.log('Index HTML length:', indexHtml.length);
console.log('Barra HTML length:', barraHtml.length);

// Check canvases in index
console.log('Index has emberCanvas:', indexHtml.includes('emberCanvas'));
console.log('Index has sparkCanvas:', indexHtml.includes('sparkCanvas'));
console.log('Barra has emberCanvas:', barraHtml.includes('emberCanvas'));
console.log('Barra has sparkCanvas:', barraHtml.includes('sparkCanvas'));

// Check Amarok video in Barra
console.log('Barra has prueba_arrastre_amarok:', barraHtml.includes('prueba_arrastre_amarok.mp4'));
console.log('Barra has video_armado_lanza:', barraHtml.includes('video_armado_lanza.mp4'));
