const fs = require('fs');

const files = [
  'public/index.html', 'index.html',
  'public/barra-de-remolque.html', 'barra-de-remolque.html',
  'public/fogon-bioetanol.html', 'fogon-bioetanol.html',
  'public/contacto.html', 'contacto.html',
  'public/devoluciones-garantia.html', 'devoluciones-garantia.html',
  'public/preguntas-frecuentes.html', 'preguntas-frecuentes.html',
  'public/privacidad.html', 'privacidad.html',
  'public/terminos-condiciones.html', 'terminos-condiciones.html',
  'public/checkout.html', 'checkout.html'
];

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.log(f, 'MISSING');
    continue;
  }
  const c = fs.readFileSync(f, 'utf8');
  const hasCartStore = c.includes('function cartStore()');
  const bodyMatch = c.match(/<body[^>]*>/i);
  console.log(f, 'cartStore:', hasCartStore, 'body:', bodyMatch ? bodyMatch[0] : 'none');
}
