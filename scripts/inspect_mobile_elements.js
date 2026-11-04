const fs = require('fs');

const h = fs.readFileSync('public/index.html', 'utf8');
const idx = h.indexOf('cartOpen');
console.log('Cart drawer preview:');
const cartIdx = h.indexOf('class="fixed inset-y-0 right-0');
if (cartIdx !== -1) {
  console.log(h.slice(cartIdx - 200, cartIdx + 600));
} else {
  // search for cart drawer container
  const drawer = h.match(/<div[^>]*x-show="cartOpen"[^>]*>[\s\S]*?<\/div>/);
  console.log(drawer ? drawer[0].slice(0, 500) : 'not found');
}
