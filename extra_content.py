# -*- coding: utf-8 -*-
"""
extra_content.py — 从用户自有站点 hlm.yanghuide.kdns.fr 抓取"研究/事件/主题/线索/器物/民俗/图表"板块，
生成两个前端模块：
  extra_exhibits.js : export const EXTRA = [...新展厅...];  export const CATEGORIES_EXTRA = {...};
  extra_detail.js   : export const EXTRA_DETAIL = { 现有展品id: "并入的专题文字..." };

设计（遵循"混合用上"）：
  - 研究考据 -> 新"研究"分类展厅（概览 hub + 各考据子文）
  - 关键事件 -> 新"事件"分类展厅（概览 hub + 站点上尚未收录的事件；data.js 已有的 7 个事件则把更丰富叙事并入其详情）
  - 主题/线索/器物/民俗/图表 -> 拆子话题，按人物/地点/诗词关键词挂到现有 54 件展品详情
绝不改写 data.js / enrich.js（脆弱手工数据），只用独立 overlay 注入。
"""
import urllib.request, urllib.parse, re, json, html as htmlmod, time, sys

BASE = "https://hlm.yanghuide.kdns.fr"

# ---------- 网络 ----------
def fetch(path, trailing=True):
    url = BASE + path
    if trailing and not url.endswith('/'):
        url += '/'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                return r.read().decode('utf-8', 'ignore')
        except Exception:
            time.sleep(1.5)
    return ''

def exists(path):
    url = BASE + path + '/'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}, method='HEAD')
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status == 200
    except Exception:
        return False

# ---------- HTML 解析 ----------
def get_article(html):
    for tag in ('article', 'main', 'section'):
        m = re.search(r'<%s[^>]*>(.*?)</%s>' % (tag, tag), html, re.S | re.I)
        if m and len(m.group(1)) > 200:
            return m.group(1)
    return html

def clean_text(s):
    s = re.sub(r'<script[\s\S]*?</script>', '', s, flags=re.I)
    s = re.sub(r'<style[\s\S]*?</style>', '', s, flags=re.I)
    s = re.sub(r'<[^>]+>', '', s)
    s = htmlmod.unescape(s)
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)   # markdown 链接 -> 文本
    s = re.sub(r'`+', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def parse_sections(html):
    art = get_article(html)
    parts = re.split(r'<h([1-4])[^>]*>(.*?)</h\1>', art, flags=re.S | re.I)
    sections = []
    if parts[0].strip():
        sections.append(('', clean_text(parts[0])))
    i = 1
    while i + 2 < len(parts):
        htext = clean_text(parts[i + 1])
        body = clean_text(parts[i + 2])
        sections.append((htext, body))
        i += 3
    return sections

def build_detail(sections, cap=2600):
    out, total = [], 0
    for h, body in sections:
        if not body:
            continue
        block = (("【%s】\n" % h) if h else "") + body
        if total + len(block) > cap:
            rem = cap - total
            if rem > 40:
                out.append(block[:rem] + "…")
            break
        out.append(block)
        total += len(block) + 2
    return '\n\n'.join(out).strip()

def first_sentence(text, n=60):
    for ch in ['。', '；', '！', '？', '.', '!', '?']:
        idx = text.find(ch)
        if 0 < idx < n + 10:
            return text[:idx + 1]
    return text[:n]

# ---------- 现有展品关键词表（用于"并入详情"匹配）----------
KEYWORDS = {
    "baoyu": ["贾宝玉", "宝玉", "通灵宝玉", "神瑛", "衔玉", "怡红院", "怡红"], "daiyu": ["林黛玉", "黛玉", "绛珠", "潇湘", "葬花", "泪尽"],
    "baochai": ["薛宝钗", "宝钗", "金锁", "金玉良缘", "冷香丸", "蘅芜"], "xifeng": ["王熙凤", "凤姐", "熙凤", "弄权", "协理"],
    "jiamu": ["贾母", "史太君", "老太太"], "jiazheng": ["贾政"], "wangfuren": ["王夫人"], "xiangyun": ["史湘云", "湘云"],
    "miaoyu": ["妙玉"], "yanchun": ["贾元春", "元春", "元妃", "省亲"], "tanchun": ["贾探春", "探春", "敏探春", "理家"],
    "yingchun": ["贾迎春", "迎春"], "xichun": ["贾惜春", "惜春"], "keqing": ["秦可卿", "可卿", "宁府大丧"], "liwan": ["李纨"],
    "qiaojie": ["贾巧姐", "巧姐"], "xiren": ["袭人"], "qingwen": ["晴雯"], "xiangling": ["香菱", "甄英莲"],
    "zijuan": ["紫鹃"], "pingr": ["平儿"], "yuanyang": ["鸳鸯", "抗婚"], "jialian": ["贾琏"],
    "xuepan": ["薛蟠"], "zhenshiyin": ["甄士隐"], "yucun": ["贾雨村"], "liaolao": ["刘姥姥", "姥姥"],
    "xianglian": ["柳湘莲", "湘莲"], "jiangyuhan": ["蒋玉菡"], "mingyan": ["茗烟"],
    "daguanyuan": ["大观园", "园子", "诗社"], "rongguofu": ["荣国府"], "ningguofu": ["宁国府", "宁国府"],
    "yihongyuan": ["怡红院"], "xiaoxiangguan": ["潇湘馆"], "hengwuyuan": ["蘅芜苑"],
    "daoxiangcun": ["稻香村"], "longcuan": ["栊翠庵"], "taihu": ["太虚幻境"],
    "jinling": ["十二钗", "判词", "金陵"], "zanghua": ["葬花吟", "葬花"], "qiuchuang": ["秋窗风雨夕"],
    "taohua": ["桃花行"], "liuxu": ["柳絮词"], "haole": ["好了歌"], "shierzhi": ["红楼梦十二支", "十二支"],
    "baihaitang": ["咏白海棠", "白海棠", "海棠"],
    # 章回事件（站点叙事可能提到）
    "daiyu_jinfu": ["黛玉进贾府", "进贾府"], "yuanchun_xingqin": ["元春省亲", "省亲"],
    "baoyu_ada": ["宝玉挨打", "挨打"], "daiyu_zanghua": ["黛玉葬花"], "chaojian": ["抄检大观园"],
    "daiyu_fengao": ["黛玉焚稿"], "baoyu_chujia": ["宝玉出家", "悬崖撒手", "出家"],
}
EXISTING_TITLES = {  # 用于判断事件是否已收录
    "黛玉进贾府", "元春省亲", "宝玉挨打", "黛玉葬花", "抄检大观园", "黛玉焚稿", "宝玉出家",
}
RESEARCH_HUB_ID = "research-hub"
EVENT_HUB_ID = "event-hub"

def match_exhibit(text):
    for eid, kws in KEYWORDS.items():
        for kw in kws:
            if kw and kw in text:
                return eid
    return None

# ---------- 抓取：研究 ----------
def harvest_research():
    html = fetch("/research/")
    if not html:
        return [], ""
    # 概览详情
    secs = parse_sections(html)
    hub_detail = build_detail(secs, cap=2200)
    # 发现子页
    subs = []
    for m in re.finditer(r'href="(/research/[^"#?]+)"', html):
        p = m.group(1)
        if p.rstrip('/') == '/research' or p.count('/') != 2:
            continue
        name = urllib.parse.unquote(p.rstrip('/').split('/')[-1])
        if name and name not in [s[0] for s in subs]:
            subs.append((name, p.rstrip('/')))
    halls = []
    ids = []
    for name, path in subs:
        if len(halls) >= 16:
            break
        sub = fetch("/research/" + urllib.parse.quote(name))
        if not sub:
            continue
        s2 = parse_sections(sub)
        detail = build_detail(s2, cap=2400)
        if len(detail) < 160:
            continue
        eid = "res-" + name
        ids.append(eid)
        halls.append(make_exhibit(eid, "研究", name, detail))
    # hub links
    hub = make_exhibit(RESEARCH_HUB_ID, "研究", "红学考据", hub_detail)
    hub["links"] = ids
    for h in halls:
        others = [i for i in ids if i != h["id"]][:2]
        h["links"] = [RESEARCH_HUB_ID] + others
    return [hub] + halls, hub_detail

# ---------- 抓取：事件 ----------
def harvest_events():
    html = fetch("/events/")
    if not html:
        return [], ""
    secs = parse_sections(html)
    hub_detail = build_detail(secs, cap=2000)
    # 概览里的事件段落（h2/h3）
    events = [(h, b) for (h, b) in secs if h]
    halls, ids = [], []
    enriched_existing = {}   # 已收录事件 -> 更丰富叙事（并入详情）
    for name, body in events:
        if not name or len(name) < 2:
            continue
        enc = urllib.parse.quote(name)
        detail = None
        if exists("/events/" + enc):
            sub = fetch("/events/" + enc)
            if sub:
                detail = build_detail(parse_sections(sub), cap=2200)
        if not detail:
            detail = body
        if len(detail) < 80:
            continue
        # 已收录 -> 并入现有展品详情，不再开新厅
        if name in EXISTING_TITLES:
            eid = match_existing_event(name)
            if eid:
                enriched_existing.setdefault(eid, "")
                enriched_existing[eid] += "\n\n【站点·事件】\n" + detail
            continue
        eid = "evt-" + name
        ids.append(eid)
        halls.append(make_exhibit(eid, "事件", name, detail))
    hub = make_exhibit(EVENT_HUB_ID, "事件", "关键事件", hub_detail)
    hub["links"] = ids
    for h in halls:
        others = [i for i in ids if i != h["id"]][:1]
        h["links"] = [EVENT_HUB_ID] + others
    return [hub] + halls, enriched_existing

def match_existing_event(name):
    mp = {
        "黛玉进贾府": "daiyu_jinfu", "元春省亲": "yuanchun_xingqin", "宝玉挨打": "baoyu_ada",
        "黛玉葬花": "daiyu_zanghua", "抄检大观园": "chaojian", "黛玉焚稿": "daiyu_fengao",
        "宝玉出家": "baoyu_chujia",
    }
    return mp.get(name)

# ---------- 抓取：主题/线索/器物/民俗/图表 -> 并入详情 ----------
FOLD_SECTIONS = ["themes", "clues", "objects", "folklore", "charts"]
FOLD_LABEL = {"themes": "主题", "clues": "线索", "objects": "器物", "folklore": "民俗", "charts": "图表"}

def harvest_fold():
    detail_map = {}   # eid -> text
    unmatched = []    # 无法挂到具体展品 -> 归到 research-hub
    for sec in FOLD_SECTIONS:
        html = fetch("/" + sec + "/")
        if not html:
            continue
        secs = parse_sections(html)
        for h, body in secs:
            if not body or len(body) < 40:
                continue
            topic = (("【%s·%s】\n" % (FOLD_LABEL[sec], h)) if h else ("【%s】\n" % FOLD_LABEL[sec])) + body
            eid = match_exhibit(h + " " + body)
            if eid:
                detail_map.setdefault(eid, "")
                detail_map[eid] += "\n\n" + topic
            else:
                unmatched.append(topic)
    if unmatched:
        detail_map.setdefault(RESEARCH_HUB_ID, "")
        detail_map[RESEARCH_HUB_ID] += "\n\n【延伸专题】\n" + "\n\n".join(unmatched)
    return detail_map

# ---------- 工具 ----------
def make_exhibit(eid, cat, title, detail):
    summary = first_sentence(detail.replace("\n", " "), 56)
    body = detail[:240].replace("\n", " ")
    return {"id": eid, "category": cat, "title": title, "summary": summary, "body": body, "links": [], "detail": detail}

def write_js(extra, categories, detail_map):
    with open("extra_exhibits.js", "w", encoding="utf-8") as f:
        f.write("// 自动生成（extra_content.py）。站点内容 overlay，绝不改动 data.js。\n")
        f.write("export const CATEGORIES_EXTRA = ")
        f.write(json.dumps(categories, ensure_ascii=False))
        f.write(";\n\n")
        f.write("export const EXTRA = ")
        f.write(json.dumps(extra, ensure_ascii=False, indent=1))
        f.write(";\n")
    with open("extra_detail.js", "w", encoding="utf-8") as f:
        f.write("// 自动生成（extra_content.py）。主题/线索/器物/民俗/图表 并入现有展品详情。\n")
        f.write("export const EXTRA_DETAIL = ")
        f.write(json.dumps(detail_map, ensure_ascii=False, indent=1))
        f.write(";\n")
    print("extra_exhibits.js: %d 新展厅" % len(extra))
    print("extra_detail.js : %d 件现有展品被并入专题" % len(detail_map))

def main():
    research, research_hub_detail = harvest_research()
    events, enriched = harvest_events()
    fold = harvest_fold()
    # 已收录事件的更丰富叙事并入 EXTRA_DETAIL
    for eid, txt in enriched.items():
        fold.setdefault(eid, "")
        fold[eid] += txt
    extra = research + events
    cats = {
        "研究": {"color": "#6b4ea0", "glyph": "研"},
        "事件": {"color": "#a0432e", "glyph": "事"},
    }
    write_js(extra, cats, fold)
    print("\n--- 新展厅一览 ---")
    for e in extra:
        print("  [%s] %s  (links:%d)" % (e["category"], e["title"], len(e["links"])))
    print("\n--- 并入详情的展品 ---")
    for k, v in fold.items():
        print("  %s : %d 字" % (k, len(v)))

if __name__ == "__main__":
    main()
