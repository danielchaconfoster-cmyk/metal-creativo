
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
    
    await page.goto('file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 600));
    
    const footer = await page.footer;
    const brain = 'C:/Users/usuario/.gemini/antigravity/brain/7c7bd8b0-2ff9-4e3c-a1fa-b89d60c1aa58';
    if (footer) {
        await footer.screenshot({ path: brain + '/screenshot_footer_socials.png' });
    }
    
    await browser.close();
    console.log('FOOTER_SHOT_OK');
})();
