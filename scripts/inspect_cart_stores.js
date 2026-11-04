const fs = require('fs');

const standardPages = [
  'public/index.html', 'index.html',
  'public/barra-de-remolque.html', 'barra-de-remolque.html',
  'public/fogon-bioetanol.html', 'fogon-bioetanol.html',
  'public/contacto.html', 'contacto.html',
  'public/devoluciones-garantia.html', 'devoluciones-garantia.html',
  'public/preguntas-frecuentes.html', 'preguntas-frecuentes.html',
  'public/privacidad.html', 'privacidad.html',
  'public/terminos-condiciones.html', 'terminos-condiciones.html'
];

for (const p of standardPages) {
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');
  const match = content.match(/function cartStore\(\)\s*\{[\s\S]*?return\s*\{/);
  console.log(p, '->', match ? match[0].replace(/\s+/g, ' ') : 'NOT MATCHED');
}
