
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
        
        const filePath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
        await page.goto(filePath, { waitUntil: 'networkidle0' });
        
        const footer = await page.footer;
        if (footer) {
            await footer.screenshot({ path: path.join(__dirname, 'footer_shot.png') });
            console.log('FOOTER_OK');
        } else {
            console.log('FOOTER_NOT_FOUND');
        }
        await browser.close();
    } catch(e) {
        console.error(e);
    }
})();
