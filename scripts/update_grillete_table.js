const fs = require('fs');

['public/barra-de-remolque.html', 'barra-de-remolque.html'].forEach(f => {
  if (fs.existsSync(f)) {
    let html = fs.readFileSync(f, 'utf8');
    html = html.replace(
      '<td class="py-2.5 px-4 text-white font-medium">2 pasadores pasantes galvanizados con seguro tipo horquilla</td>',
      '<td class="py-2.5 px-4 text-white font-medium">2 pasadores pasantes de 1/2" con chaveta tipo R + 2 grilletes forjados tipo lira de 5/8" galvanizados</td>'
    );
    fs.writeFileSync(f, html, 'utf8');
    console.log('Updated grilletes 5/8 in', f);
  }
});
