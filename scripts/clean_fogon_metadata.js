const fs = require('fs');

['public/fogon-bioetanol.html', 'fogon-bioetanol.html'].forEach(f => {
  if (fs.existsSync(f)) {
    let html = fs.readFileSync(f, 'utf8');
    html = html.replace(/quemador de acero estructural AISI 304/gi, 'quemador de acero estructural');
    html = html.replace(/quemador AISI 304/gi, 'quemador en acero estructural');
    html = html.replace(/AISI 304/gi, 'acero estructural');
    html = html.replace(/quirúrgico/gi, 'estructural');
    html = html.replace(/\$100\.000 CLP/g, 'Desde $140.000 CLP');
    html = html.replace('"price": "100000"', '"price": "140000", "highPrice": "160000"');
    fs.writeFileSync(f, html, 'utf8');
    console.log('Cleaned AISI 304 and updated schema in', f);
  }
});
