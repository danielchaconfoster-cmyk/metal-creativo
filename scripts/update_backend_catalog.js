const fs = require('fs');

let code = fs.readFileSync('lib/orders.js', 'utf8');

const oldCatalog = `CATALOG = Object.freeze({
 barra_remolque:{name:'Barra de Remolque Desarmable 1.8m (Ley MTT 55/2025)',price:65000},
 lanza_remolque:{name:'Barra de Remolque Desarmable 1.8m (Ley MTT 55/2025)',price:65000},
 cocinilla_acero:{name:'Cocinilla Estructural de Acero',price:35000},
 fogon:{name:'Fogon de Mesa a Bioetanol Ecologico',price:100000},
 fogon_bioetanol:{name:'Fogon de Mesa a Bioetanol Ecologico',price:100000},
 fogon_acero:{name:'Fogón de Acero 50cm para Exterior',price:120000}
});`;

const newCatalog = `CATALOG = Object.freeze({
 barra_remolque:{name:'Barra de Remolque Desarmable 1.8m (Ley MTT 55/2025)',price:65000},
 lanza_remolque:{name:'Barra de Remolque Desarmable 1.8m (Ley MTT 55/2025)',price:65000},
 cocinilla_acero:{name:'Cocinilla Estructural de Acero',price:35000},
 fogon:{name:'Fogon de Mesa a Bioetanol Ecologico',price:100000},
 fogon_bioetanol:{name:'Fogon de Mesa a Bioetanol Ecologico',price:100000},
 fogon_madera:{name:'Fogón Bioetanol Madera Noble & Acero',price:160000},
 fogon_acero:{name:'Fogón Bioetanol Estructural Acero 50cm',price:140000},
 fogon_acero50:{name:'Fogón Bioetanol Estructural Acero 50cm',price:140000}
});`;

if (code.includes(oldCatalog)) {
  code = code.replace(oldCatalog, newCatalog);
  fs.writeFileSync('lib/orders.js', code, 'utf8');
  console.log('Updated CATALOG in lib/orders.js!');
} else {
  console.log('Old catalog pattern not matched exactly, inspecting...');
  const m = code.match(/CATALOG[\s\S]*?\};/);
  console.log(m ? m[0] : 'None');
}
