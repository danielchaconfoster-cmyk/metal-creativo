const fs = require('fs');

if (fs.existsSync('api/create-preference.js')) {
  const code = fs.readFileSync('api/create-preference.js', 'utf8');
  console.log('create-preference.js:');
  const catalogMatch = code.match(/CATALOG[\s\S]*?\};/);
  if (catalogMatch) console.log(catalogMatch[0]);
}
