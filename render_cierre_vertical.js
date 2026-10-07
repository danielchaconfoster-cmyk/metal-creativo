const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function renderCierreVertical() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });

    const htmlPath = path.resolve(__dirname, 'cierre_vertical_template.html');
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

    const outDir = path.resolve(__dirname, 'out');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const outputPath = path.resolve(outDir, 'cierre_vertical_1080x1920.png');
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`✅ Imagen vertical generada con éxito en: ${outputPath}`);

    await browser.close();
}

renderCierreVertical().catch(console.error);
