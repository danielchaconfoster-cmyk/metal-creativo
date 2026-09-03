
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
    
    // Set mock cart in localStorage
    await page.goto('file:///' + path.resolve(__dirname, 'checkout.html').replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.evaluate(() => {
        localStorage.setItem('mc_cart', JSON.stringify([
            { id: 'barra_remolque', name: 'Barra de Remolque Desarmable 1.8m', price: 65000, qty: 1, image: './images/lanza_real_armada.jpeg' }
        ]));
    });
    
    // Reload with cart
    await page.goto('file:///' + path.resolve(__dirname, 'checkout.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    
    const brain = 'C:/Users/usuario/.gemini/antigravity/brain/7c7bd8b0-2ff9-4e3c-a1fa-b89d60c1aa58';
    await page.screenshot({ path: brain + '/screenshot_checkout_pro.png' });
    
    // Success page screenshot
    await page.goto('file:///' + path.resolve(__dirname, 'checkout-success.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: brain + '/screenshot_success_pro.png' });
    
    await browser.close();
    console.log('CHECKOUT_SHOTS_OK');
})();
