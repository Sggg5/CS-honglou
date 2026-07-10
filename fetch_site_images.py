import urllib.request, re, json, os, time, urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, 'data.js')
IMG = os.path.join(ROOT, 'images.js')
ASSETS = os.path.join(ROOT, 'assets')
os.makedirs(ASSETS, exist_ok=True)
BASE = 'https://hlm.yanghuide.kdns.fr'

def get(u):
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read()
    except Exception:
        return None

def q(t): return urllib.parse.quote(t)

s = open(DATA, encoding='utf-8').read()
entries = re.findall(r'\{\s*id:\s*"([^"]+)"[^}]*?title:\s*"([^"]+)"[^}]*?category:\s*"([^"]+)"', s, re.S)
DIR = {'人物': 'chars', '诗词判词': 'poems', '章回': 'chapters'}

downloaded = []
for eid, title, cat in entries:
    if cat == '地点':   # 地点图已抓（/images/places/）
        continue
    d = DIR.get(cat)
    if not d:
        continue
    t = title.replace('《', '').replace('》', '').strip()
    u = f'{BASE}/images/{d}/{q(t)}.webp'
    data = get(u)
    if data and len(data) > 2000:
        open(os.path.join(ASSETS, eid + '.webp'), 'wb').write(data)
        downloaded.append((eid, cat, len(data)))
        print('OK  ', eid, cat, len(data))
    else:
        print('NO  ', eid, cat)
    time.sleep(0.3)

# 合并进 images.js：站点图优先（覆盖原 Commons），其余保持不变
mapping = {}
if os.path.exists(IMG):
    try:
        txt = open(IMG, encoding='utf-8').read()
        mapping = json.loads(txt.split('=', 1)[1].rsplit(';', 1)[0].strip())
    except Exception as e:
        print('load err', e)
for eid, _, _ in downloaded:
    mapping[eid] = 'assets/' + eid + '.webp'

with open(IMG, 'w', encoding='utf-8') as f:
    f.write('// 图像映射：人物/诗词/章回 配图来自 hlm.yanghuide.kdns.fr（用户自有站点，水墨风格）；\n')
    f.write('// 地点立轴图亦来自该站（/images/places/）；个别无站点图的回退 Wikimedia Commons 公有领域插图。\n')
    f.write('export const IMAGES = ')
    f.write(json.dumps(mapping, ensure_ascii=False, indent=2))
    f.write(';\n')

print('\nTOTAL images mapped:', len(mapping))
print('site images pulled this run:', len(downloaded))
