const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 55432;
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

// Simple static server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  if (reqPath === '/barra-de-remolque') reqPath = '/barra-de-remolque.html';
  if (reqPath === '/fogon-bioetanol') reqPath = '/fogon-bioetanol.html';
  if (reqPath === '/checkout') reqPath = '/checkout.html';
  if (reqPath === '/contacto') reqPath = '/contacto.html';

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
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf'
    };
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mobile verification server listening at http://127.0.0.1:${PORT}`);
  
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outDir = 'C:\\Users\\usuario\\.gemini\\antigravity\\brain\\de9f3b92-bce0-4b2e-8d9c-6777b0622f5b';

  // 1. Screenshot mobile index
  const shotIndex = path.join(outDir, 'mobile_index.png');
  execSync(`"${chromePath}" --headless --disable-gpu --window-size=390,844 --screenshot="${shotIndex}" http://127.0.0.1:${PORT}/index.html`);
  console.log('Mobile Index screenshot saved:', shotIndex);

  // 2. Screenshot mobile fogon
  const shotFogon = path.join(outDir, 'mobile_fogon.png');
  execSync(`"${chromePath}" --headless --disable-gpu --window-size=390,844 --screenshot="${shotFogon}" http://127.0.0.1:${PORT}/fogon-bioetanol.html`);
  console.log('Mobile Fogon screenshot saved:', shotFogon);

  // 3. Screenshot mobile barra
  const shotBarra = path.join(outDir, 'mobile_barra.png');
  execSync(`"${chromePath}" --headless --disable-gpu --window-size=390,844 --screenshot="${shotBarra}" http://127.0.0.1:${PORT}/barra-de-remolque.html`);
  console.log('Mobile Barra screenshot saved:', shotBarra);

  server.close(() => {
    console.log('Server closed successfully');
  });
});
