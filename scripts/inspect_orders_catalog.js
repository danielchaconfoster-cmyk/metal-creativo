const fs = require('fs');

if (fs.existsSync('api/orders.js')) {
  const c = fs.readFileSync('api/orders.js', 'utf8');
  console.log('In api/orders.js:');
  const m = c.match(/const [A-Z_]+ = \{[\s\S]*?\};/g);
  if (m) console.log(m.slice(0, 3).join('\n'));
}
