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

    const flyers = [
        { file: 'flyer_impacto_tavasci_nike.html', out: 'flyer_opcion_tavasci_nike.png' },
        { file: 'flyer_style_1_industrial_forge.html', out: 'flyer_opcion_1_industrial_forge.png' },
        { file: 'flyer_style_2_swiss_tech.html', out: 'flyer_opcion_2_swiss_tech.png' },
        { file: 'flyer_style_3_tactical_4x4.html', out: 'flyer_opcion_3_tactical_4x4.png' },
        { file: 'flyer_style_4_performance_direct.html', out: 'flyer_opcion_4_performance_direct.png' }
    ];

    for (const item of flyers) {
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
    console.log('🎉 Todos los volantes generados exitosamente.');
}

main().catch(console.error);
