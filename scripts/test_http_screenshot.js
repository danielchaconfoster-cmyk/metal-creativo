const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 54321;
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(PUBLIC_DIR, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Server up');
  const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const out = 'C:\\Users\\usuario\\.gemini\\antigravity\\brain\\de9f3b92-bce0-4b2e-8d9c-6777b0622f5b\\mobile_fogon_http.png';
  try {
    execSync(`"${chrome}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${out}" http://127.0.0.1:${PORT}/fogon-bioetanol.html`);
    console.log('Screenshot captured via HTTP');
  } catch (err) {
    console.error(err);
  } finally {
    server.close();
  }
});
