const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function renderCierreCuadrado() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

    const htmlPath = path.resolve(__dirname, 'cierre_cuadrado_template.html');
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

    const outDir = path.resolve(__dirname, 'out');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const outputPath = path.resolve(outDir, 'cierre_cuadrado_1080x1080.png');
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`✅ Imagen cuadrada generada con éxito en: ${outputPath}`);

    await browser.close();
}

renderCierreCuadrado().catch(console.error);
