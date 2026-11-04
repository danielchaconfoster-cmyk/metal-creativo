const fs = require('fs');

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');
  const target = "fbq('track', 'PageView');";
  const addition = `fbq('track', 'PageView');

    // Meta Pixel: Registro oficial de Purchase tras confirmacion de pago Mercado Pago
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var paymentStatus = urlParams.get('status') || urlParams.get('collection_status');
      var paymentMethod = urlParams.get('method');
      if (paymentStatus === 'approved' && paymentMethod !== 'transferencia') {
        fbq('track', 'Purchase', {
          value: 65000,
          currency: 'CLP',
          content_type: 'product',
          content_ids: ['MC-REM-180'],
          content_name: 'Barra de Remolque Desarmable 1.8m'
        });
      }
    } catch (_) {}`;

  if (html.includes(target) && !html.includes("fbq('track', 'Purchase'")) {
    html = html.replace(target, addition);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Purchase event added to ${filePath}`);
  } else {
    console.log(`ℹ️ Already present or target not found in ${filePath}`);
  }
}

updateFile('checkout-success.html');
updateFile('public/checkout-success.html');
