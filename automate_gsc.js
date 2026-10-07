const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    console.log('====================================================');
    console.log('🤖 INICIANDO AGENTE VISUAL PASO A PASO (PLAYWRIGHT/PUPPETEER)');
    console.log('====================================================');

    const profileDir = path.join(process.env.USERPROFILE || 'C:\\Users\\usuario', '.agent_chrome_profile');
    if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
    }

    // Lanzar navegador VISIBLE con retardos (slowMo) para que el usuario vea cada movimiento
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 1200, // 1.2 segundos entre cada acción (escritura, clics, etc.)
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--window-size=1366,768'
        ],
        userDataDir: profileDir,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Evitar que Google detecte el bot
    await page.evaluateOnNewDocument(() => {
        delete navigator.__proto__.webdriver;
    });

    console.log('\n[Paso 1] Abriendo Google Search Console en pantalla...');
    await page.goto('https://search.google.com/search-console', { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    let currentUrl = page.url();
    console.log('📍 URL actual:', currentUrl);

    // Si está en la página de bienvenida de Google o login
    if (currentUrl.includes('about') || currentUrl.includes('accounts.google.com') || (await page.$('a[href*="accounts.google.com"]')) !== null) {
        console.log('\n👉 [ACCIÓN]: Se abrió la ventana de Google.');
        console.log('   Si necesitas iniciar sesión o hacer clic en "Empezar ahora", hazlo en la ventana que ves en pantalla.');
        console.log('⏳ Esperando a que estés dentro de Search Console...');

        // Esperar hasta que estemos en la consola activa
        try {
            await page.waitForFunction(
                () => window.location.href.includes('search.google.com/search-console') && !window.location.href.includes('about'),
                { timeout: 180000 } // 3 minutos
            );
            console.log('✅ ¡Sesión detectada dentro de Search Console!');
        } catch (e) {
            console.log('⚠️ Tiempo de espera agotado para el inicio de sesión manual.');
        }
        await sleep(3000);
    }

    console.log('\n[Paso 2] Buscando selector para agregar Metal Creativo (https://metalcreativo.cl/)...');
    await sleep(2000);

    // Revisar si ya está el modal de "Seleccionar tipo de propiedad" abierto
    let modalInput = await page.$('input[placeholder*="ejemplo.com"], input[placeholder*="https://"], input[aria-label*="URL"], input[type="text"]');
    
    if (!modalInput) {
        // Intentar abrir el selector de propiedades arriba a la izquierda
        console.log('👉 Abriendo selector de propiedades...');
        const buttons = await page.$$('div[role="button"], button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && (text.includes('Añadir propiedad') || text.includes('Buscar una propiedad') || text.includes('propiedad'))) {
                await btn.click();
                await sleep(2000);
                break;
            }
        }

        // Buscar botón "+ Añadir propiedad"
        const addPropBtn = await page.evaluateHandle(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            return elements.find(el => el.textContent && el.textContent.trim() === 'Añadir propiedad');
        });
        if (addPropBtn && addPropBtn.asElement()) {
            console.log('👉 Clic en "+ Añadir propiedad"...');
            await addPropBtn.asElement().click();
            await sleep(2500);
        }
    }

    // Buscar el input de "Prefijo de la URL"
    console.log('\n[Paso 3] Buscando el campo "Prefijo de la URL"...');
    const inputs = await page.$$('input[type="text"]');
    let targetInput = null;

    for (const input of inputs) {
        const placeholder = await page.evaluate(el => el.getAttribute('placeholder') || el.getAttribute('aria-label') || '', input);
        if (placeholder.includes('https://') || placeholder.includes('example.com') || placeholder.includes('ejemplo')) {
            targetInput = input;
            break;
        }
    }

    if (!targetInput && inputs.length > 0) {
        targetInput = inputs[inputs.length - 1]; // Suele ser el de la derecha (Prefijo de URL)
    }

    if (targetInput) {
        console.log('👉 Campo encontrado. Esperando 2 segundos...');
        await sleep(2000);

        console.log('✍️ Escribiendo: https://metalcreativo.cl/ paso a paso...');
        await targetInput.click();
        await targetInput.type('https://metalcreativo.cl/', { delay: 100 });
        await sleep(2000);

        console.log('👉 Buscando botón "Continuar"...');
        const continueBtn = await page.evaluateHandle(() => {
            const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
            return btns.find(b => b.textContent && b.textContent.includes('Continuar'));
        });

        if (continueBtn && continueBtn.asElement()) {
            console.log('👆 Haciendo clic en "Continuar"...');
            await continueBtn.asElement().click();
            await sleep(4000);
        }
    } else {
        console.log('ℹ️ No se detectó automáticamente el campo de texto. La ventana está abierta para que la uses.');
    }

    console.log('\n[Paso 4] Buscando etiqueta de verificación HTML...');
    await sleep(2000);

    // Intentar desplegar "Etiqueta HTML"
    const htmlTagOption = await page.evaluateHandle(() => {
        const els = Array.from(document.querySelectorAll('*'));
        return els.find(e => e.textContent && e.textContent.includes('Etiqueta HTML') && !e.children.length);
    });

    if (htmlTagOption && htmlTagOption.asElement()) {
        console.log('👉 Desplegando sección "Etiqueta HTML"...');
        await htmlTagOption.asElement().click();
        await sleep(2000);
    }

    // Buscar código <meta name="google-site-verification"
    const verificationCode = await page.evaluate(() => {
        const codeElement = document.querySelector('input[readonly], textarea, code, pre');
        if (codeElement && (codeElement.value || codeElement.textContent)) {
            const val = codeElement.value || codeElement.textContent;
            if (val.includes('google-site-verification')) return val;
        }
        const matches = document.body.innerText.match(/<meta name="google-site-verification" content="([^"]+)"/);
        return matches ? matches[0] : null;
    });

    if (verificationCode) {
        console.log('\n🎉 ¡CÓDIGO DE VERIFICACIÓN ENCONTRADO!');
        console.log(verificationCode);
        fs.writeFileSync(path.join(__dirname, 'google_verification.txt'), verificationCode.trim(), 'utf8');
        console.log('💾 Guardado automáticamente en google_verification.txt');
    } else {
        console.log('ℹ️ La ventana está abierta en tu pantalla.');
    }

    console.log('\n====================================================');
    console.log('👀 MODO MONITOR ACTIVO: El navegador permanecerá abierto.');
    console.log('   Si inicias sesión o haces clic en verificar, el script seguirá atento.');
    console.log('====================================================');

    // Bucle de monitoreo continuo para capturar el código si el usuario navega
    for (let i = 0; i < 60; i++) {
        await sleep(5000);
        try {
            const code = await page.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input[readonly], textarea, code, pre'));
                for (const el of inputs) {
                    const text = el.value || el.textContent || '';
                    if (text.includes('google-site-verification')) return text;
                }
                const matches = document.body.innerText.match(/<meta name="google-site-verification" content="([^"]+)"/);
                if (matches) return matches[0];
                const contentMatch = document.body.innerText.match(/google-site-verification=([a-zA-Z0-9_-]+)/);
                if (contentMatch) return contentMatch[0];
                return null;
            });
            if (code && !fs.existsSync(path.join(__dirname, 'google_verification.txt'))) {
                console.log('\n🎯 ¡Código detectado durante la interacción!:');
                console.log(code);
                fs.writeFileSync(path.join(__dirname, 'google_verification.txt'), code.trim(), 'utf8');
                console.log('💾 Guardado en google_verification.txt');
            }
        } catch (err) {
            // El usuario puede estar navegando entre páginas
        }
    }
})();
