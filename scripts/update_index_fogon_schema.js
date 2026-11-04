const fs = require('fs');

['public/index.html', 'index.html'].forEach(f => {
  if (!fs.existsSync(f)) return;
  let html = fs.readFileSync(f, 'utf8');
  
  // Replace schema price for fogon
  html = html.replace(/("@id":\s*"https:\/\/metalcreativo\.cl\/#fogon-bioetanol"[\s\S]*?"price":\s*")100000(")/, '$1160000$2');
  
  fs.writeFileSync(f, html, 'utf8');
  console.log('Updated index fogon schema price:', f);
});
