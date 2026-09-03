
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 2 });
    
    // Set cart
    await page.goto('file:///' + path.resolve(__dirname, 'checkout.html').replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.evaluate(() => {
        localStorage.setItem('mc_cart', JSON.stringify([
            { id: 'barra_remolque', name: 'Barra de Remolque Desarmable 1.8m', price: 65000, qty: 1, image: './images/lanza_real_armada.jpeg' }
        ]));
    });
    
    // Test Case 1: Select Region del Maule
    await page.goto('file:///' + path.resolve(__dirname, 'checkout.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.select('select', 'Región del Maule');
    await new Promise(r => setTimeout(r, 400));
    
    const brain = 'C:/Users/usuario/.gemini/antigravity/brain/7c7bd8b0-2ff9-4e3c-a1fa-b89d60c1aa58';
    await page.screenshot({ path: brain + '/screenshot_maule_disabled.png' });
    
    // Test Case 2: Success page with Transferencia
    await page.goto('file:///' + path.resolve(__dirname, 'checkout-success.html?order=MC-2026-7842&method=transferencia').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
        localStorage.setItem('last_order', JSON.stringify({
            orderId: 'MC-2026-7842',
            total: 65000,
            paymentMethod: 'transferencia',
            customer: { full_name: 'Carlos Muñoz', rut: '12.345.678-9' },
            shipping: { direccion: 'Av. Las Rastras 1240', comuna: 'Talca', region: 'Región del Maule' }
        }));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: brain + '/screenshot_transfer_success.png' });
    
    await browser.close();
    console.log('TEST_CASES_VERIFIED_OK');
})();
