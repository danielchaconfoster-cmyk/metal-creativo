const fs = require('fs');

['public/index.html', 'index.html'].forEach(f => {
  if (fs.existsSync(f)) {
    let html = fs.readFileSync(f, 'utf8');
    
    // Update Fogón 1 to 160000
    html = html.replace(
      `<span class="text-2xl font-black text-white">$100.000 <span class="text-xs text-orange-400 font-bold">CLP</span></span>`,
      `<span class="text-2xl font-black text-white">$160.000 <span class="text-xs text-orange-400 font-bold">CLP</span></span>`
    );
    html = html.replace(
      `addItem('fogon', 'Fogón Abierto a Bioetanol Ecológico', 100000, './images/fogon_bioetanol_madera.jpg')`,
      `addItem('fogon_madera', 'Fogón Bioetanol Madera Noble & Acero', 160000, './images/fogon_bioetanol_madera.jpg')`
    );
    html = html.replace(
      `buyNow('fogon', 'Fogón Abierto a Bioetanol Ecológico', 100000, './images/fogon_bioetanol_madera.jpg')`,
      `buyNow('fogon_madera', 'Fogón Bioetanol Madera Noble & Acero', 160000, './images/fogon_bioetanol_madera.jpg')`
    );

    // Update Fogón 2 to 140000
    html = html.replace(
      `<span class="text-2xl font-black text-white">$120.000 <span class="text-xs text-orange-400 font-bold">CLP</span></span>`,
      `<span class="text-2xl font-black text-white">$140.000 <span class="text-xs text-orange-400 font-bold">CLP</span></span>`
    );
    html = html.replace(
      `addItem('fogon_acero', 'Fogón de Acero 50cm para Exterior', 120000, './images/fogon_bioetanol_acero50.jpg')`,
      `addItem('fogon_acero', 'Fogón Bioetanol Estructural Acero 50cm', 140000, './images/fogon_real_50.jpg')`
    );
    html = html.replace(
      `buyNow('fogon_acero', 'Fogón de Acero 50cm para Exterior', 120000, './images/fogon_bioetanol_acero50.jpg')`,
      `buyNow('fogon_acero', 'Fogón Bioetanol Estructural Acero 50cm', 140000, './images/fogon_real_50.jpg')`
    );

    // Update footer link
    html = html.replace(
      `Fogón a Bioetanol ($100.000)`,
      `Fogón a Bioetanol (Desde $140.000)`
    );

    fs.writeFileSync(f, html, 'utf8');
    console.log('Updated fogon pricing in', f);
  }
});
