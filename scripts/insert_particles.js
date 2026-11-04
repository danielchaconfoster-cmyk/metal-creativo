const fs = require('fs');

const indexHtml = fs.readFileSync('public/index.html', 'utf8');
let barraHtml = fs.readFileSync('public/barra-de-remolque.html', 'utf8');

const emberMatch = indexHtml.match(/\/\/ 1\. CHISPAS Y FUEGO ASCENDENTE CONTINUO[\s\S]*?<\/script>/);
if (emberMatch) {
  const code = '\n\n        ' + emberMatch[0].replace('</script>', '').trim();
  barraHtml = barraHtml.replace('    </script>\r\n</body>', code + '\n    </script>\r\n</body>');
  barraHtml = barraHtml.replace('    </script>\n</body>', code + '\n    </script>\n</body>');
  fs.writeFileSync('public/barra-de-remolque.html', barraHtml, 'utf8');
  if (fs.existsSync('barra-de-remolque.html')) {
    fs.writeFileSync('barra-de-remolque.html', barraHtml, 'utf8');
  }
  console.log('Successfully added particle scripts!');
} else {
  console.error('Could not find ember script in indexHtml');
}
