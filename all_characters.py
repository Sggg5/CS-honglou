# -*- coding: utf-8 -*-
"""
all_characters.py — 把站点 hlm.yanghuide.kdns.fr 的全部人物"搬进"博物馆（稳健可续跑版）。
  - 抓 /characters/ 索引 -> 全部人物名
  - 逐个抓页面 -> 分段成 detail；下载 /images/chars/<名>.webp -> assets/<id>.webp
  - 与 data.js 已有 30 人去重；解析"关键关系"文本互链成图
  - 增量写 chars_all.js（每处理一人即落盘），崩溃可续跑（跳过已完成的名）
产物：chars_all.js  (export const IMAGES_CHARS / EXTRA_CHARS)
绝不改动 data.js / images.js / enrich.js。
"""
import urllib.request, urllib.parse, re, json, html as htmlmod, time, os, sys

BASE = "https://hlm.yanghuide.kdns.fr"
ASSETS = "assets"
OUT = "chars_all.js"

EXISTING = {
    "贾宝玉","林黛玉","薛宝钗","王熙凤","贾母","贾政","王夫人","史湘云","妙玉","贾元春",
    "贾探春","贾迎春","贾惜春","秦可卿","李纨","贾巧姐","袭人","晴雯","香菱","紫鹃",
    "平儿","鸳鸯","贾琏","薛蟠","甄士隐","贾雨村","刘姥姥","柳湘莲","蒋玉菡","茗烟",
}
EXISTING_ID = {
    "贾宝玉":"baoyu","林黛玉":"daiyu","薛宝钗":"baochai","王熙凤":"xifeng","贾母":"jiamu",
    "贾政":"jiazheng","王夫人":"wangfuren","史湘云":"xiangyun","妙玉":"miaoyu","贾元春":"yanchun",
    "贾探春":"tanchun","贾迎春":"yingchun","贾惜春":"xichun","秦可卿":"keqing","李纨":"liwan",
    "贾巧姐":"qiaojie","袭人":"xiren","晴雯":"qingwen","香菱":"xiangling","紫鹃":"zijuan",
    "平儿":"pingr","鸳鸯":"yuanyang","贾琏":"jialian","薛蟠":"xuepan","甄士隐":"zhenshiyin",
    "贾雨村":"yucun","刘姥姥":"liaolao","柳湘莲":"xianglian","蒋玉菡":"jiangyuhan","茗烟":"mingyan",
}

def log(*a):
    print(*a, flush=True)

def fetch(path, binary=False):
    url = BASE + path
    req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                data = r.read()
                return data if binary else data.decode('utf-8','ignore')
        except Exception:
            time.sleep(1.0)
    return b'' if binary else ''

def clean(s):
    s = re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I)
    s = re.sub(r'<style[\s\S]*?</style>','',s,flags=re.I)
    s = re.sub(r'<[^>]+>','',s)
    s = htmlmod.unescape(s)
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)
    s = re.sub(r'`+','',s)
    s = re.sub(r'[ \t]+',' ',s)
    s = re.sub(r'\s*\n\s*','\n',s)
    return s.strip()

def get_article(html):
    for tag in ('article','main'):
        m = re.search(r'<%s[^>]*>(.*?)</%s>'%(tag,tag), html, re.S|re.I)
        if m and len(m.group(1))>200:
            return m.group(1)
    return html

def parse_sections(html):
    art = get_article(html)
    parts = re.split(r'<h([1-4])[^>]*>(.*?)</h\1>', art, flags=re.S|re.I)
    secs=[]
    if parts[0].strip():
        t=clean(parts[0])
        if t: secs.append(('',t))
    i=1
    while i+2 < len(parts):
        secs.append((clean(parts[i+1]).replace('\n',' '), clean(parts[i+2])))
        i+=3
    return secs

WANT = ["一句话定位","身份与事迹","身份","关键关系","性格与特征","外貌与仪态",
        "结构作用","命运走向","结局","关键章节","判词","误读辨析","多层深读"]
SKIP = ["人物速览","首页","项目 内容"]

def build_detail(secs, cap=2400):
    picked=[]; used=set()
    for key in WANT:
        for i,(h,b) in enumerate(secs):
            if i in used: continue
            if key and key in h:
                picked.append((i,h,b)); used.add(i)
    for i,(h,b) in enumerate(secs):
        if i in used: continue
        if h and not any(sk in h for sk in SKIP) and len(b)>30:
            picked.append((i,h,b)); used.add(i)
    picked.sort(key=lambda x:x[0])
    out,total=[],0
    for _,h,b in picked:
        if not b: continue
        block=(("【%s】\n"%h) if h else "")+b
        if total+len(block)>cap:
            rem=cap-total
            if rem>40: out.append(block[:rem]+"…")
            break
        out.append(block); total+=len(block)+2
    return '\n\n'.join(out).strip()

def one_liner(secs, name):
    for h,b in secs:
        if "一句话定位" in h and b: return b.replace('\n',' ')[:60]
    for h,b in secs:
        if b and len(b)>10: return b.replace('\n',' ')[:60]
    return name

def get_index():
    html = fetch("/characters/")
    names=[]
    for m in re.finditer(r'href="/characters/([^"#?/]+)/?"', html):
        name=urllib.parse.unquote(m.group(1))
        if name and name not in names:
            names.append(name)
    return names

def save(exhibits, images):
    with open(OUT,"w",encoding="utf-8") as f:
        f.write("// 自动生成（all_characters.py）。站点全部人物 overlay，绝不改动 data.js/images.js。\n")
        f.write("export const IMAGES_CHARS = ")
        f.write(json.dumps(images, ensure_ascii=False, indent=1))
        f.write(";\n\n")
        f.write("export const EXTRA_CHARS = ")
        f.write(json.dumps(exhibits, ensure_ascii=False, indent=1))
        f.write(";\n")
        f.flush(); os.fsync(f.fileno())

def load_done():
    if not os.path.exists(OUT): return [], {}, set()
    try:
        txt=open(OUT,encoding="utf-8").read()
        m=re.search(r'IMAGES_CHARS = (\{.*?\});', txt, re.S)
        images=json.loads(m.group(1)) if m else {}
        m2=re.search(r'EXTRA_CHARS = (\[.*?\]);', txt, re.S)
        exhibits=json.loads(m2.group(1)) if m2 else []
        done=set(e["title"] for e in exhibits)
        return exhibits, images, done
    except Exception:
        return [], {}, set()

def slugify(idx): return "p%03d"%idx

def main():
    exhibits, images, done = load_done()
    names = get_index()
    log("索引人物数:", len(names))
    os.makedirs(ASSETS, exist_ok=True)

    name2id = dict(EXISTING_ID)
    new_names = [n for n in names if n not in EXISTING]
    # 给新人物分配 id（按索引稳定）
    counter=[0]
    def nid(name):
        counter[0]+=1
        return slugify(counter[0])
    # 续跑：已完成的用其 id；新建的重新编号（简单起见全部重排，但跳过已完成）
    # 重新编号会改 id；为稳定，按 names 顺序给新名固定 id
    new_index = {n:"p%03d"%(i+1) for i,n in enumerate(new_names)}
    name2id.update(new_index)

    # 去掉已完成的人（其 id 需在 name2id 中保留以便互链）
    pending = [n for n in new_names if n not in done]
    log("已有(续跑):", len(done), "| 待处理:", len(pending))

    n_img=0; n_txt=0; fails=[]
    for i,name in enumerate(pending,1):
        eid = new_index[name]
        try:
            enc = urllib.parse.quote(name)
            html = fetch("/characters/"+enc)
            if not html:
                fails.append(name); log("[%d/%d] %s FETCH FAIL"%(i,len(pending),name)); continue
            secs = parse_sections(html)
            detail = build_detail(secs)
            summary = one_liner(secs, name)
            body = (detail[:220].replace('\n',' ')) if detail else name
            if detail: n_txt+=1
            fpath=os.path.join(ASSETS, eid+".webp")
            if not (os.path.exists(fpath) and os.path.getsize(fpath)>500):
                img = fetch("/images/chars/%s.webp"%enc, binary=True)
                if img and img[:4] not in (b'<!DO', b'<htm') and len(img)>500:
                    with open(os.path.join(ASSETS, eid+".webp"),"wb") as f:
                        f.write(img); f.flush()
                    images[eid]="assets/%s.webp"%eid; n_img+=1
            exhibits.append({"id":eid,"category":"人物","title":name,
                             "summary":summary or name,"body":body,
                             "links":[], "detail":detail or (name+"（详见站点）")})
        except Exception as e:
            fails.append(name); log("[%d/%d] %s ERR %s"%(i,len(pending),name,repr(e)))
        # 每 5 人落盘一次，崩溃可续
        if i % 5 == 0:
            save(exhibits, images)
            log("  ...%d/%d | 图:%d 文:%d"%(i,len(pending),n_img,n_txt))

    # 互链
    all_names_sorted = sorted(name2id.keys(), key=len, reverse=True)
    for e in exhibits:
        text=e["detail"]; found=[]
        for nm in all_names_sorted:
            if nm==e["title"]: continue
            if nm in text:
                tid=name2id[nm]
                if tid not in found: found.append(tid)
            if len(found)>=8: break
        e["links"]=found

    save(exhibits, images)
    log("\n=== 汇总 ===")
    log("新增人物展品:", len(exhibits), "| 图:", n_img, "| 文:", n_txt, "| 失败:", len(fails), fails[:10])

if __name__=="__main__":
    main()
