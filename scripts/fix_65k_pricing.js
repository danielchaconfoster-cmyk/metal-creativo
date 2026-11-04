const fs = require('fs');

async function fixPricing() {
  const env = fs.readFileSync('.env', 'utf8');
  const token = env.match(/^META_ACCESS_TOKEN=(.*)$/m)[1].trim();
  const adAccountId = env.match(/^META_AD_ACCOUNT_ID=(.*)$/m)[1].trim();
  const campaignId = '120251412084360615';
  const adsetId = '120251412094790615';

  // 1. Fix Campaign Name
  console.log('1. Fixing Campaign Name...');
  const campRes = await fetch('https://graph.facebook.com/v21.0/' + campaignId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'METAL CREATIVO — Ventas Web Barra Remolque ($65.000)',
      access_token: token
    })
  });
  console.log('Campaign Name updated:', await campRes.json());

  // Helper for video creative
  async function createPACVideoCreative(name, vFeed, vReels, bodyText, titleText) {
    const payload = {
      name: name,
      object_story_spec: {
        page_id: '1360810953772283',
        instagram_user_id: '17841438108059701'
      },
      asset_feed_spec: {
        optimization_type: 'PLACEMENT',
        ad_formats: ['SINGLE_VIDEO'],
        call_to_action_types: ['SHOP_NOW'],
        bodies: [{ text: bodyText }],
        titles: [{ text: titleText }],
        descriptions: [{ text: 'Envío a todo Chile • Compra Segura Online' }],
        link_urls: [{ website_url: 'https://metalcreativo.cl/barra-de-remolque' }],
        videos: [
          { video_id: vFeed, adlabels: [{ name: 'feed_video' }] },
          { video_id: vReels, adlabels: [{ name: 'reels_video' }] }
        ],
        asset_customization_rules: [
          {
            priority: 1,
            video_label: { name: 'feed_video' },
            customization_spec: {
              publisher_platforms: ['facebook', 'instagram'],
              facebook_positions: ['feed', 'marketplace', 'profile_feed'],
              instagram_positions: ['stream', 'explore_home', 'profile_feed']
            }
          },
          {
            priority: 2,
            video_label: { name: 'reels_video' },
            customization_spec: {
              publisher_platforms: ['facebook', 'instagram'],
              facebook_positions: ['story', 'facebook_reels', 'facebook_reels_overlay'],
              instagram_positions: ['story', 'reels']
            }
          }
        ]
      },
      access_token: token
    };

    const res = await fetch('https://graph.facebook.com/v21.0/' + adAccountId + '/adcreatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  // 2. Create Creative Reel 02 (Fuerza 3.500kg) with explicit $65.000 CLP
  console.log('2. Creating Creative Reel 02 with $65.000 CLP...');
  const cr2 = await createPACVideoCreative(
    'Creativo Web — Reel 02 Fuerza 3.500kg ($65.000 CLP)',
    '1667181168535156',
    '1114861741462695',
    '💪 ¿AGUANTA EL TIRÓN O SE DOBLA? PUSIMOS A PRUEBA LA BARRA METAL CREATIVO 🚙💨\n\nMira cómo remolcamos sin tirones bruscos ni riesgo de impacto:\n• Acero reforzado de 3 mm de grosor con ojales forjados en candente.\n• Hasta 3.500 kg de fuerza de tracción comprobada.\n• Se arma en 1 minuto con pasadores de alta seguridad.\n• Cumple al 100% el Decreto Supremo 55 del MTT.\n\n💰 Precio directo de taller: $65.000 CLP.\n🛒 Compra online con despacho express a todo Chile en nuestra web oficial.',
    'Barra Rígida Remolque 3.500 kg — $65.000 CLP'
  );
  console.log('CR2 Result:', cr2);

  // 3. Create Creative Reel 01 (Alerta Legal MTT) with explicit $65.000 CLP
  console.log('3. Creating Creative Reel 01 with $65.000 CLP...');
  const cr1 = await createPACVideoCreative(
    'Creativo Web — Reel 01 Alerta Legal MTT ($65.000 CLP)',
    '1464779679167638',
    '1477164844561245',
    '⚖️ EVITA MULTAS GRAVES Y REMOLCA SEGURO SEGÚN LA LEY MTT 🇨🇱\n\nEl Ministerio de Transportes ya fiscaliza el remolque con cuerdas o piolas. Conoce la Barra Rígida Desarmable de Metal Creativo:\n• Fabricada en tubo de acero reforzado de 3 mm de espesor.\n• Soporta hasta 3.500 kg de arrastre directo.\n• Se desarma en 3 piezas compactas (65 cm) para entrar en cualquier maleta.\n• Distancia fija de 1.8 m que previene choques por alcance.\n\n💰 Solo $65.000 CLP con envío a todo Chile.\n🛒 Haz tu pedido directo en nuestra web oficial con Webpay o Mercado Pago.',
    'Barra Rígida Remolque MTT — $65.000 CLP'
  );
  console.log('CR1 Result:', cr1);

  // 4. Create Creative Foto Real Auto with explicit $65.000 CLP
  console.log('4. Creating Creative Foto Real with $65.000 CLP...');
  const cr3Payload = {
    name: 'Creativo Web — Foto Real Auto ($65.000 CLP)',
    object_story_spec: {
      page_id: '1360810953772283',
      instagram_user_id: '17841438108059701'
    },
    asset_feed_spec: {
      optimization_type: 'PLACEMENT',
      ad_formats: ['SINGLE_IMAGE'],
      call_to_action_types: ['SHOP_NOW'],
      bodies: [{
        text: '🚨 ¿SABÍAS QUE REMOLCAR CON CUERDA O PIOLA ES ILEGAL EN CHILE? 🚗⚖️\n\nEl Decreto Supremo N° 55 del Ministerio de Transportes exige acople metálico rígido por seguridad vial.\n\n🛠️ BARRA RÍGIDA DE REMOLQUE DESARMABLE — METAL CREATIVO\n✅ Soporta hasta 3.500 kg de arrastre directo.\n✅ Acero macizo reforzado de 3 mm de espesor.\n✅ Se desarma en 3 tramos compactos (menos de 65 cm).\n✅ Mantiene 1.8 metros de distancia fija reglamentaria.\n✅ Incluye pasadores de seguridad y bandera reflectante.\n\n💰 Precio de Oferta: $65.000 CLP\n📦 Despacho a todo Chile por Starken y Chilexpress.\n💳 Compra segura con débito o crédito vía Mercado Pago en nuestra web.'
      }],
      titles: [{ text: 'Barra Rígida de Remolque Ley MTT ($65.000 CLP)' }],
      descriptions: [{ text: 'Envío a todo Chile • Compra Segura Online' }],
      link_urls: [{ website_url: 'https://metalcreativo.cl/barra-de-remolque' }],
      images: [
        { hash: 'da159823f796dc1b2b800ed0b377e041', adlabels: [{ name: 'story_label' }] },
        { hash: '879bedd6d7c6a5e588b5aaab4c8cf197', adlabels: [{ name: 'feed_label' }] }
      ],
      asset_customization_rules: [
        {
          priority: 1,
          image_label: { name: 'feed_label' },
          customization_spec: {
            publisher_platforms: ['facebook', 'instagram'],
            facebook_positions: ['feed', 'marketplace', 'profile_feed'],
            instagram_positions: ['stream', 'explore_home', 'profile_feed']
          }
        },
        {
          priority: 2,
          image_label: { name: 'story_label' },
          customization_spec: {
            publisher_platforms: ['facebook', 'instagram'],
            facebook_positions: ['story', 'facebook_reels_overlay'],
            instagram_positions: ['story']
          }
        }
      ]
    },
    access_token: token
  };
  const cr3Res = await fetch('https://graph.facebook.com/v21.0/' + adAccountId + '/adcreatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cr3Payload)
  });
  const cr3 = await cr3Res.json();
  console.log('CR3 Result:', cr3);

  // 5. Update the 3 Ads with the fixed creatives
  console.log('5. Updating the 3 Ads...');
  const ads = await (await fetch('https://graph.facebook.com/v21.0/' + adsetId + '/ads?fields=id,name&access_token=' + token)).json();
  for (const ad of ads.data) {
    let targetCreativeId = null;
    if (ad.name.includes('Reel 02') || ad.name.includes('Fuerza')) {
      targetCreativeId = cr2.id;
    } else if (ad.name.includes('Reel 01') || ad.name.includes('Legal')) {
      targetCreativeId = cr1.id;
    } else if (ad.name.includes('Foto Real')) {
      targetCreativeId = cr3.id;
    }

    if (targetCreativeId) {
      const u = await fetch('https://graph.facebook.com/v21.0/' + ad.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creative: { creative_id: targetCreativeId }, access_token: token })
      });
      console.log(`Updated ${ad.name} with creative ${targetCreativeId} ->`, await u.json());
    }
  }

  console.log('🎉 Fix completed successfully!');
}

fixPricing().catch(console.error);
