const { execSync } = require('child_process');
const path = require('path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'file:///' + path.resolve(__dirname, '..', 'public', 'fogon-bioetanol.html').replace(/\\/g, '/');

// Inspect with Chrome DevTools Protocol or console.log in page
const script = `
const b = document.querySelectorAll('header button, header a');
const rects = Array.from(b).map(el => ({
  text: el.innerText.trim(),
  classes: el.className,
  rect: el.getBoundingClientRect(),
  right: el.getBoundingClientRect().right
}));
console.log('BUTTON_RECTS:' + JSON.stringify(rects));
`;

// Inject into HTML temporarily to see console output
let html = require('fs').readFileSync('public/fogon-bioetanol.html', 'utf8');
html = html.replace('</body>', `<script>${script}</script></body>`);
require('fs').writeFileSync('temp_inspect.html', html, 'utf8');

const res = execSync(`"${chrome}" --headless=new --disable-gpu --window-size=390,844 --enable-logging=stderr "file:///${path.resolve('temp_inspect.html').replace(/\\\\/g, '/')}" 2>&1`, { encoding: 'utf8' });

require('fs').unlinkSync('temp_inspect.html');

const match = res.match(/BUTTON_RECTS:(\[.*?\])/);
if (match) {
  console.log(JSON.parse(match[1]));
} else {
  console.log('Output:', res.slice(0, 1000));
}
