const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'http://127.0.0.1:3000/fogon-bioetanol.html';
const out = 'C:\\Users\\usuario\\.gemini\\antigravity\\brain\\de9f3b92-bce0-4b2e-8d9c-6777b0622f5b\\mobile_fogon_live.png';

console.log('Capturing:', targetUrl);
execSync(`"${chrome}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${out}" "${targetUrl}"`);
console.log('Exists:', fs.existsSync(out), 'Size:', fs.existsSync(out) ? fs.statSync(out).size : 0);
