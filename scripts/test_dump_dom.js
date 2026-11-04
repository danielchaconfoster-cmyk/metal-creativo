const { execSync } = require('child_process');
const path = require('path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'file:///' + path.resolve(__dirname, '..', 'public', 'fogon-bioetanol.html').replace(/\\/g, '/');

// Run Chrome with --dump-dom and check elements
const res = execSync(`"${chrome}" --headless=new --disable-gpu --window-size=390,844 --run-all-compositor-stages-before-draw --virtual-time-budget=2000 --dump-dom "${targetUrl}"`, { encoding: 'utf8' });

console.log('Has hamburger button:', res.includes('aria-label="Abrir menú de navegación"'));
console.log('Has mobile dropdown:', res.includes('x-show="mobileMenuOpen"'));
