import urllib.request, re, html, json, time, urllib.parse, os

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, 'data.js')
OUT = os.path.join(ROOT, 'enrich.js')
BASE = 'https://hlm.yanghuide.kdns.fr'

def log(*a): print(*a, flush=True)

def fetch(u):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read().decode('utf-8', 'ignore')
    except Exception as e:
        return None

def clean(t):
    t = re.sub(r'<[^>]+>', ' ', t)
    t = html.unescape(t)
    t = re.sub(r'[ \t\u3000]+', ' ', t)
    t = re.sub(r'\n\s*\n+', '\n', t)
    return t.strip()

def parse_sections(s):
    m = re.search(r'<article[^>]*>(.*?)</article>', s, re.S)
    if not m:
        m = re.search(r'<main[^>]*>(.*?)</main>', s, re.S)
    if not m:
        m = re.search(r'<body[^>]*>(.*?)</body>', s, re.S)
    block = m.group(1) if m else s
    block = re.sub(r'<(script|style|nav|footer|header|aside)[^>]*>.*?</\1>', '', block, flags=re.S)
    parts = re.split(r'(<h[1-4][^>]*>.*?</h[1-4]>)', block, flags=re.S)
    sections, cur, buf = [], None, []
    def flush():
        if cur is not None:
            sections.append((cur, clean('\n'.join(buf))))
    for p in parts:
        hm = re.match(r'<h[1-4][^>]*>(.*?)</h[1-4]>', p, re.S)
        if hm:
            flush(); cur = clean(hm.group(1)); buf = []
        elif cur is not None:
            buf.append(p)
    flush()
    return sections

def select(sections, keys):
    order = {k: i for i, k in enumerate(keys)}
    picked = []
    for title, text in sections:
        for k in keys:
            if k in title or title in k:
                picked.append((order[k], k, text)); break
    picked.sort()
    return picked

def build_detail(sections, keys, maxlen=2600):
    out, total = [], 0
    for _, k, text in select(sections, keys):
        if not text or len(text) < 8:
            continue
        para = '【%s】\n%s' % (k, text)
        if total + len(para) > maxlen:
            remain = maxlen - total
            if remain > 50:
                out.append(para[:remain] + '…')
            break
        out.append(para); total += len(para) + 2
    return '\n\n'.join(out)

KEYS = {
    '人物':   ['一句话定位','身份','关键关系','性格与特征','外貌与仪态','命运走向','判词','名场面'],
    '地点':   ['一句话定位','居所','关键词','相关人物','关键事件','意象与衰败的变化'],
    '诗词判词': ['一句话定位','原文','创作信息','意象分析','关键人物关联'],
    '章回':   ['一句话定位','情节','关键事件','意义','关键人物'],
}

def slug(title):
    t = title.replace('《','').replace('》','').replace('“','').replace('”','').replace('‘','').replace('’','').strip()
    return urllib.parse.quote(t, safe='')

def url_for(cat, title):
    seg = {'人物':'characters','地点':'places','诗词判词':'poems','章回':'chapters'}.get(cat)
    if not seg: return None
    return '%s/%s/%s' % (BASE, seg, slug(title))

# parse data.js entries
s = open(DATA, encoding='utf-8').read()
entries = re.findall(r'\{\s*id:\s*"([^"]+)"[^}]*?title:\s*"([^"]+)"[^}]*?category:\s*"([^"]+)"', s, re.S)
log('parsed entries:', len(entries))

enrich = {}
for eid, title, cat in entries:
    u = url_for(cat, title)
    if not u:
        continue
    html_txt = fetch(u)
    time.sleep(1.2)
    if not html_txt:
        log('  skip(no page) %s %s' % (eid, title)); continue
    secs = parse_sections(html_txt)
    detail = build_detail(secs, KEYS.get(cat, []))
    if len(detail) < 30:
        log('  empty %s %s' % (eid, title)); continue
    enrich[eid] = detail
    log('  OK %s %s (%d chars)' % (eid, title, len(detail)))

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('// 来自 hlm.yanghuide.kdns.fr（用户自有《红楼梦》知识库）的详细文字，\n')
    f.write('// 由 enrich.py 抓取各词条对应页面、提取要点生成；museum.js 合并进 EXHIBITS.detail。\n')
    f.write('export const ENRICH = ')
    f.write(json.dumps({k: {'detail': v} for k, v in enrich.items()}, ensure_ascii=False, indent=2))
    f.write(';\n')

log('TOTAL enriched:', len(enrich), '/', len(entries))
