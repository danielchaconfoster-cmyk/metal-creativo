const fs = require('fs');

const indexFiles = ['public/index.html', 'index.html'];
for (const f of indexFiles) {
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f, 'utf8');
  
  html = html.replace(/\$140\.000/g, '$160.000');
  html = html.replace(/Fogón a Bioetanol \(Desde \$140\.000\)/g, 'Fogón a Bioetanol Madera Noble ($160.000)');
  html = html.replace(/Fogón a Bioetanol \(Desde \$160\.000\)/g, 'Fogón a Bioetanol Madera Noble ($160.000)');
  html = html.replace(/Desde \$160\.000/g, '$160.000');
  html = html.replace(/Desde \$140\.000/g, '$160.000');

  fs.writeFileSync(f, html, 'utf8');
  console.log('Cleaned 140k mentions in:', f);
}

const fogonFiles = ['public/fogon-bioetanol.html', 'fogon-bioetanol.html'];
for (const f of fogonFiles) {
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f, 'utf8');

  html = html.replace(/<!-- MAIN PRODUCT SECTION \(DOS MODELOS: MADERA \$160\.000 \/ ACERO \$140\.000\) -->/g, '<!-- SECCIÓN PRINCIPAL DE PRODUCTO: FOGÓN MADERA NOBLE & ACERO ($160.000) -->');
  html = html.replace(/\$140\.000/g, '$160.000');
  html = html.replace(/Desde \$140\.000 CLP/g, '$160.000 CLP');
  html = html.replace(/Desde \$160\.000 CLP/g, '$160.000 CLP');

  fs.writeFileSync(f, html, 'utf8');
  console.log('Cleaned 140k mentions in:', f);
}
