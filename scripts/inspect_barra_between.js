const fs = require('fs');
const html = fs.readFileSync('public/barra-de-remolque.html', 'utf8');

const videoArmadoIdx = html.indexOf('id="video-armado"');
const footerIdx = html.indexOf('<footer');

console.log('Video armado idx:', videoArmadoIdx);
console.log('Footer idx:', footerIdx);

const between = html.slice(videoArmadoIdx, footerIdx);
console.log('Between length:', between.length);
fs.writeFileSync('scripts/barra_between.html', between, 'utf8');
