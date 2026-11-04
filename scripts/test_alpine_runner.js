const fs = require('fs');

const testHtml = `<!DOCTYPE html>
<html>
<head>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body x-data="{ cartOpen: false, totalItems: 2 }">
    <header x-data="{ mobileMenuOpen: false }">
        <button id="cartBtn" @click="cartOpen = true; mobileMenuOpen = false"></button>
        <button id="menuBtn" @click="mobileMenuOpen = !mobileMenuOpen"></button>
        <div id="menu" x-show="mobileMenuOpen">Menu Content</div>
    </header>
    <div id="cart" x-show="cartOpen">Cart Content</div>
    <div id="out"></div>
    <script>
        document.addEventListener('alpine:initialized', () => {
            const menuBtn = document.getElementById('menuBtn');
            const cartBtn = document.getElementById('cartBtn');
            menuBtn.click();
            cartBtn.click();
            setTimeout(() => {
                const headerData = Alpine.$data(document.querySelector('header'));
                const bodyData = Alpine.$data(document.querySelector('body'));
                document.getElementById('out').innerText = JSON.stringify({
                    bodyCartOpen: bodyData.cartOpen,
                    headerMenuOpen: headerData.mobileMenuOpen
                });
            }, 100);
        });
    </script>
</body>
</html>`;

fs.writeFileSync('test_alpine.html', testHtml, 'utf8');
console.log('Written test_alpine.html');
