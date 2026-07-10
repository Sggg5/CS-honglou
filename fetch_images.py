import json, re, urllib.parse, urllib.request, os, time

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, 'data.js')
IMAGES_JS = os.path.join(ROOT, 'images.js')
OUT = os.path.join(ROOT, 'assets')
os.makedirs(OUT, exist_ok=True)

def log(*a):
    print(*a, flush=True)

s = open(DATA, encoding='utf-8').read()
pairs = []
for line in s.splitlines():
    if 'id:' in line and 'title:' in line:
        try:
            idv = line.split('id: "')[1].split('"')[0]
            tv  = line.split('title: "')[1].split('"')[0]
            cat = line.split('category: "')[1].split('"')[0]
            pairs.append((idv, tv, cat))
        except Exception:
            pass

mapping = {}
if os.path.exists(IMAGES_JS):
    try:
        txt = open(IMAGES_JS, encoding='utf-8').read()
        mapping = json.loads(txt.split('=', 1)[1].rsplit(';', 1)[0].strip())
    except Exception as e:
        log('load mapping err', e)

API = "https://commons.wikimedia.org/w/api.php"
UA = 'HLMuseumBot/1.0 (https://example.org; museum@example.org) Python-urllib'
PREF = ['honglou', 'tuyong', 'hong_lou', 'sunwen', 'sun_wen', 'gengqi', 'baoyu', 'daiyu', '红楼梦']
SKIP = ['logo', 'flag', 'icon', 'signature', 'map', 'commons-', 'wikimedia', 'qrcode', 'badge']

def api_search(q):
    params = {'action': 'query', 'generator': 'search', 'gsrsearch': q, 'gsrnamespace': '6',
              'gsrlimit': '8', 'prop': 'imageinfo', 'iiprop': 'url|mime', 'iiurlwidth': '600', 'format': 'json'}
    url = API + '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        d = json.load(r)
    pages = (d.get('query', {}) or {}).get('pages', {}) or {}
    res = []
    for p in pages.values():
        ii = (p.get('imageinfo') or [{}])[0]
        u = ii.get('thumburl') or ii.get('url')
        mime = ii.get('mime', '')
        if u and mime in ('image/jpeg', 'image/png'):
            res.append(u)
    return res

def pick(urls):
    for kw in PREF:
        for u in urls:
            if kw in u.lower():
                return u
    for u in urls:
        if not any(k in u.lower() for k in SKIP):
            return u
    return None

def ext(u):
    m = re.search(rb'\.([a-z0-9]+)(?:$|[:?])', u.encode(), re.I)
    e = (m.group(1).decode().lower() if m else 'jpg')
    return 'jpg' if e in ('jpeg', 'jpe') else e

def save():
    with open(IMAGES_JS, 'w', encoding='utf-8') as f:
        f.write('// 自动抓取的公有领域《红楼梦》插图（改琦/孙温等），来自 Wikimedia Commons\n')
        f.write('export const IMAGES = ')
        f.write(json.dumps(mapping, ensure_ascii=False, indent=2))
        f.write(';\n')

todo = [(i, t, c) for (i, t, c) in pairs if i not in mapping]
log('already', len(mapping), 'todo', len(todo))

for eid, title, cat in todo:
    queries = ['红楼梦 ' + title, title, title + ' 红楼梦 人物', title + ' 红楼梦']
    done = False
    for rnd in range(3):
        try:
            time.sleep(4)
            for q in queries:
                try:
                    urls = api_search(q)
                except urllib.error.HTTPError as e:
                    log('  api429', eid, e.code); time.sleep(20); continue
                except Exception as e:
                    log('  apierr', eid, e); time.sleep(8); continue
                u = pick(urls)
                if not u:
                    continue
                dest = 'assets/' + eid + '.' + ext(u)
                try:
                    req = urllib.request.Request(u, headers={'User-Agent': UA})
                    with urllib.request.urlopen(req, timeout=35) as rr, open(dest, 'wb') as ff:
                        ff.write(rr.read())
                    mapping[eid] = dest
                    log('  OK', eid, title, os.path.getsize(dest), 'B')
                    done = True
                    break
                except urllib.error.HTTPError as e:
                    log('  dl429', eid, e.code); time.sleep(20)
                except Exception as e:
                    log('  dlerr', eid, e); time.sleep(8)
            if done:
                break
        except Exception as e:
            log('  rounderr', eid, e); time.sleep(10)
    if not done:
        log('  NO IMAGE', eid, title)
    save()

log('TOTAL', len(mapping), '/', len(pairs))
