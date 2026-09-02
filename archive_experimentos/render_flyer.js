const fs = require('fs');
const path = require('path');

async function main() {
    // Intentar cargar puppeteer o playwright
    let browser;
    try {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    } catch (e) {
        try {
            const { chromium } = require('playwright');
            browser = await chromium.launch({ headless: true });
        } catch (err) {
            console.log('Puppeteer/Playwright no instalados localmente. Instalando puppeteer...');
            const { execSync } = require('child_process');
            execSync('npm install --save-dev puppeteer', { stdio: 'inherit' });
            const puppeteer = require('puppeteer');
            browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        }
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

    const htmlPath = path.resolve(__dirname, 'flyer_master_official_mtt.html');
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

    const outDir = path.resolve(__dirname, 'out');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const outputPath = path.resolve(outDir, 'flyer_master_oficial_mtt.png');
    await page.screenshot({ path: outputPath, type: 'png' });

    console.log(`✅ Imagen PNG generada exitosamente en: ${outputPath}`);
    await browser.close();
}

main().catch(console.error);
