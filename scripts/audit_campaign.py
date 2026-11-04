import urllib.request
import json
import ssl
import sys

# Read env
env = {}
with open('.env', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()

token = env.get('META_ACCESS_TOKEN')
camp_id = '120251412084360615'
ad_account = env.get('META_AD_ACCOUNT_ID')
pixel_id = '1416637987347092'
ctx = ssl.create_default_context()

def get_graph(endpoint, params=''):
    url = f'https://graph.facebook.com/v21.0/{endpoint}?access_token={token}&{params}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return {'error': e.read().decode('utf-8'), 'code': e.code}

print("================== 1. CAMPAIGN INFO ==================")
camp = get_graph(camp_id, 'fields=id,name,objective,status,effective_status,daily_budget,lifetime_budget,budget_rebalance_flag,buying_type,special_ad_categories,issues_info,recommendations')
print(json.dumps(camp, indent=2))

print("\n================== 2. ADSETS INFO ==================")
adsets = get_graph(f'{camp_id}/adsets', 'fields=id,name,status,effective_status,daily_budget,lifetime_budget,optimization_goal,billing_event,bid_amount,promoted_object,targeting,start_time,end_time,issues_info,recommendations')
print(json.dumps(adsets, indent=2))

print("\n================== 3. ADS INFO ==================")
ads = get_graph(f'{camp_id}/ads', 'fields=id,name,status,effective_status,creative{id,name,title,body,image_url,video_id,object_story_spec,asset_feed_spec},tracking_specs,conversion_specs,recommendations,issues_info')
for ad in ads.get('data', []):
    print("--------------------------------------------------")
    print(f"AD ID: {ad.get('id')} | Name: {ad.get('name')}")
    print(f"Status: {ad.get('status')} | Effective: {ad.get('effective_status')}")
    print(f"Issues: {ad.get('issues_info')}")
    print(f"Recommendations: {ad.get('recommendations')}")
    cr = ad.get('creative', {})
    print(f"Creative ID: {cr.get('id')} | Name: {cr.get('name')}")
    feed_spec = cr.get('asset_feed_spec')
    if feed_spec:
        print(f"  Format: {feed_spec.get('ad_formats')}")
        print(f"  Images ({len(feed_spec.get('images', []))}):")
        for img in feed_spec.get('images', []):
            print(f"    - Hash: {img.get('hash')}, Url: {img.get('url', '')[:60]}..., Labels: {img.get('adlabels')}")
        print(f"  Videos ({len(feed_spec.get('videos', []))}):")
        for vid in feed_spec.get('videos', []):
            print(f"    - Vid ID: {vid.get('video_id')}, Labels: {vid.get('adlabels')}")
        print(f"  Asset Customization Rules ({len(feed_spec.get('asset_customization_rules', []))}):")
        for idx, rule in enumerate(feed_spec.get('asset_customization_rules', [])):
            spec = rule.get('customization_spec', {})
            print(f"    Rule {idx+1}:")
            print(f"      Publishers: {spec.get('publisher_platforms')}")
            print(f"      FB Positions: {spec.get('facebook_positions')}")
            print(f"      IG Positions: {spec.get('instagram_positions')}")
            print(f"      Audience Network: {spec.get('audience_network_positions')}")
            print(f"      Messenger: {spec.get('messenger_positions')}")
            print(f"      Image Label: {rule.get('image_label')}")
            print(f"      Video Label: {rule.get('video_label')}")
    else:
        print("  Object Story Spec:")
        print(json.dumps(cr.get('object_story_spec'), indent=4))

print("\n================== 4. PIXEL INFO & RECENT STATS ==================")
pixel = get_graph(pixel_id, 'fields=id,name,is_unavailable,last_fired_time,first_party_cookie_status,creation_time')
print("Pixel Data:", json.dumps(pixel, indent=2))

pixel_stats = get_graph(f'{pixel_id}/stats', 'aggregation=event')
print("Pixel Stats:", json.dumps(pixel_stats, indent=2))
