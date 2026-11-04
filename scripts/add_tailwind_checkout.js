const fs = require('fs');
let ch = fs.readFileSync('public/checkout.html', 'utf8');
if (!ch.includes('cdn.tailwindcss.com')) {
  ch = ch.replace('</head>', '    <script src="https://cdn.tailwindcss.com"></script>\n</head>');
  fs.writeFileSync('public/checkout.html', ch, 'utf8');
  console.log('Added Tailwind CDN to public/checkout.html');
} else {
  console.log('checkout.html already has Tailwind CDN');
}
