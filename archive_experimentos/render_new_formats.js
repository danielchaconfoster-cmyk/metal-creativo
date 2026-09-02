const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function main() {
    const browser = await puppeteer.launch({ 
        headless: 'new', 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });

    const outDir = path.resolve(__dirname, 'out');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const formats = [
        { file: 'flyer_formato_a_inmersivo.html', out: 'flyer_formato_a_inmersivo.png' },
        { file: 'flyer_formato_b_split_fresco.html', out: 'flyer_formato_b_split_fresco.png' },
        { file: 'flyer_formato_c_top_hero.html', out: 'flyer_formato_c_top_hero.png' }
    ];

    for (const item of formats) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
        const htmlPath = path.resolve(__dirname, item.file);
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
        const outputPath = path.resolve(outDir, item.out);
        await page.screenshot({ path: outputPath, type: 'png' });
        console.log(`✅ Generado: ${item.out}`);
        await page.close();
    }

    await browser.close();
    console.log('🎉 Los 3 nuevos formatos se generaron con éxito.');
}

main().catch(console.error);
