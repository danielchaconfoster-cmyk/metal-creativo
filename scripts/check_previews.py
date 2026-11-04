import urllib.request
import json
import ssl

env = {}
with open('.env', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()

token = env.get('META_ACCESS_TOKEN')
ctx = ssl.create_default_context()

ads = [
    ('120251414430970615', 'Anuncio 3 - Foto Real Auto'),
    ('120251414428300615', 'Anuncio 1 - Reel 02 Fuerza 3500kg'),
    ('120251414429640615', 'Anuncio 2 - Reel 01 Alerta Legal MTT')
]

formats = [
    'DESKTOP_FEED_STANDARD',
    'MOBILE_FEED_STANDARD',
    'INSTAGRAM_STANDARD',
    'INSTAGRAM_STORY',
    'INSTAGRAM_REELS',
    'FACEBOOK_STORY_MOBILE',
    'FACEBOOK_REELS_MOBILE',
    'MARKETPLACE_MOBILE',
    'RIGHT_HAND_COLUMN',
    'MESSENGER_MOBILE_INBOX_MEDIA',
    'AUDIENCE_NETWORK_OUTSTREAM_VIDEO'
]

for ad_id, ad_name in ads:
    print(f"\n==================== {ad_name} ({ad_id}) ====================")
    for fmt in formats:
        url = f'https://graph.facebook.com/v21.0/{ad_id}/previews?access_token={token}&ad_format={fmt}'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, context=ctx) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                has_preview = bool(data.get('data') and data['data'][0].get('body'))
                print(f"  {fmt:<32}: {'[Válido / Generado]' if has_preview else '[VACÍO]'}")
        except urllib.error.HTTPError as e:
            err = e.read().decode('utf-8')
            err_json = json.loads(err) if '{' in err else {'error': {'message': err}}
            msg = err_json.get('error', {}).get('message', '')
            user_msg = err_json.get('error', {}).get('error_user_msg', '')
            print(f"  {fmt:<32}: [NO COMPATIBLE / SIN ASSET] -> {msg} {user_msg}")
