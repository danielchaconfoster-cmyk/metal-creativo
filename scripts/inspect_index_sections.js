const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const regex = /<section[^>]*id=["']([^"']+)["'][^>]*>/g;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log('Section ID:', m[1]);
}

// Find video sections
const vidRegex = /<video[\s\S]*?<\/video>/g;
let v;
let count = 0;
while ((v = vidRegex.exec(html)) !== null) {
  count++;
  console.log(`Video #${count}:`, v[0].slice(0, 200));
}
