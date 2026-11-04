const fs = require('fs');

const pages = [
  'public/index.html',
  'public/barra-de-remolque.html',
  'public/fogon-bioetanol.html',
  'public/checkout.html',
  'public/contacto.html'
];

for (const p of pages) {
  if (fs.existsSync(p)) {
    const html = fs.readFileSync(p, 'utf8');
    const navMatch = html.match(/<header[\s\S]*?<\/header>/);
    console.log(`=== NAVBAR IN ${p} ===`);
    if (navMatch) {
      console.log(navMatch[0].slice(0, 800));
    } else {
      console.log('No <header> found!');
    }
  }
}
