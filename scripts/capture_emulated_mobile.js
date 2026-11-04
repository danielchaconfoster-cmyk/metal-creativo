const { execSync } = require('child_process');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'http://127.0.0.1:3000/fogon-bioetanol.html';
const out = 'C:\\Users\\usuario\\.gemini\\antigravity\\brain\\de9f3b92-bce0-4b2e-8d9c-6777b0622f5b\\mobile_fogon_emulated.png';

console.log('Capturing with mobile emulation...');
// Chrome mobile emulation flag: --user-agent, --window-size, --hide-scrollbars
execSync(`"${chrome}" --headless=new --disable-gpu --window-size=390,844 --hide-scrollbars --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" --screenshot="${out}" "${targetUrl}"`);
console.log('Screenshot saved:', fs.existsSync(out));
