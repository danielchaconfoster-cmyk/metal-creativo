const https = require('https');

const payload = JSON.stringify({
    host: "metalcreativo.cl",
    key: "7c9a4b81ef344c9b98e1a72061de8219",
    keyLocation: "https://metalcreativo.cl/7c9a4b81ef344c9b98e1a72061de8219.txt",
    urlList: [
        "https://metalcreativo.cl/",
        "https://metalcreativo.cl/barra-de-remolque",
        "https://metalcreativo.cl/fogon-bioetanol",
        "https://metalcreativo.cl/preguntas-frecuentes",
        "https://metalcreativo.cl/contacto",
        "https://metalcreativo.cl/devoluciones-garantia",
        "https://metalcreativo.cl/terminos-condiciones",
        "https://metalcreativo.cl/privacidad"
    ]
});

const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/IndexNow',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
    }
};

console.log('📡 Notificando a IndexNow (Bing / Copilot / Yandex)...');

const req = https.request(options, (res) => {
    console.log(`Código de respuesta IndexNow: ${res.statusCode} (${res.statusMessage})`);
    res.on('data', (d) => process.stdout.write(d));
    res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
            console.log('✅ ¡IndexNow aceptó todas las URLs con éxito! Las arañas de Bing/Copilot fueron notificadas.');
        } else {
            console.log(`ℹ️ Estado recibido: ${res.statusCode}`);
        }
    });
});

req.on('error', (e) => {
    console.error('Error al enviar a IndexNow:', e);
});

req.write(payload);
req.end();
