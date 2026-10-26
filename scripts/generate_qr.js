const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const url = 'https://metalcreativo.cl/qr';

async function generate() {
  console.log('Generating QR code for:', url);

  const pngPath1 = path.join(__dirname, '..', 'public', 'images', 'qr_barra_metalcreativo.png');
  const pngPath2 = path.join(__dirname, '..', 'images', 'qr_barra_metalcreativo.png');

  await QRCode.toFile(pngPath1, url, {
    width: 1200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
  fs.copyFileSync(pngPath1, pngPath2);
  console.log('PNG generated at:', pngPath1, pngPath2);

  const svgPath1 = path.join(__dirname, '..', 'public', 'images', 'qr_barra_metalcreativo.svg');
  const svgPath2 = path.join(__dirname, '..', 'images', 'qr_barra_metalcreativo.svg');

  const svgString = await QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
  fs.writeFileSync(svgPath1, svgString, 'utf8');
  fs.writeFileSync(svgPath2, svgString, 'utf8');
  console.log('SVG generated at:', svgPath1, svgPath2);
}

generate().catch(err => {
  console.error('Error generating QR:', err);
  process.exit(1);
});
