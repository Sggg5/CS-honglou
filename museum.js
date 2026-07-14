import * as THREE from 'three';
import { EXHIBITS, CATEGORIES } from './data.js';
import { IMAGES } from './images.js';
import { ENRICH } from './enrich.js';
import { EXTRA, CATEGORIES_EXTRA } from './extra_exhibits.js';
import { EXTRA_DETAIL } from './extra_detail.js';
import { EXTRA_CHARS, IMAGES_CHARS } from './chars_all.js';
// 接入站点新增内容（研究/事件 新展厅 + 主题/线索/器物/民俗 并入详情），绝不改动 data.js
Object.assign(CATEGORIES, CATEGORIES_EXTRA);
EXHIBITS.push(...EXTRA);

// 接入站点全部 228 人物：原有 30 位手写展品保留，新增去重后注入
Object.assign(IMAGES, IMAGES_CHARS);
// 语义去重：若新增人物的姓名被已有 30 位“姓氏+姓名”完整包含（贾元春 ⊃ 元春），
// 视为同一人 → 不开重复房间，仅把站点更丰富的详情并入已有展品；
// 同名异人（甄宝玉 vs 贾宝玉、邢夫人 vs 王夫人）不被误删，正常保留。
const DUP = new Set();
const REMAP = {};
EXTRA_CHARS.forEach(c => {
  const ex = EXHIBITS.find(e => e.category === '人物' && e.id !== c.id && e.title.includes(c.title));
  if (ex) {
    // 原有 5 位（元春/探春/迎春/惜春/巧姐）站点无独立人物页，本只有回退短文，用站点富文本升级
    if (!ENRICH[ex.id] && c.detail && c.detail.length > (ex.detail || '').length) ex.detail = c.detail;
    DUP.add(c.id); REMAP[c.id] = ex.id;
  }
});
const EXTRA_CHARS_UNIQUE = EXTRA_CHARS.filter(c => !DUP.has(c.id));
// 把指向被弃房间的链接改指到原有同人展品，避免死链
EXTRA_CHARS_UNIQUE.forEach(c => { c.links = c.links.map(l => REMAP[l] || l); });
EXHIBITS.push(...EXTRA_CHARS_UNIQUE);

// 桥接新人物（及少数单向诗词）进主馆：原本新人物只「向外指」、无人「向内指」，
// 从主馆走不进，是个孤岛。这里做双向回链——被新人物指向的主馆房间回加至多 5 条
// 新人物回链（控门数），再对仍不可达的展品做最小强制补全，保证全图连通。
{
  const newIds = new Set(EXTRA_CHARS_UNIQUE.map(e => e.id));
  const byIdMap = {}; EXHIBITS.forEach(e => byIdMap[e.id] = e);
  const K = 5;
  const inbox = {};
  EXTRA_CHARS_UNIQUE.forEach(c => {
    c.links.forEach(t => { if (byIdMap[t] && !newIds.has(t)) { (inbox[t] = inbox[t] || []).push(c.id); } });
  });
  Object.keys(inbox).forEach(t => {
    inbox[t].slice(0, K).forEach(cid => { if (!byIdMap[t].links.includes(cid)) byIdMap[t].links.push(cid); });
  });
  const reach = () => {
    const s = new Set(['baoyu']); const q = ['baoyu'];
    while (q.length) { const u = q.shift(); (byIdMap[u].links || []).forEach(v => { if (byIdMap[v] && !s.has(v)) { s.add(v); q.push(v); } }); }
    return s;
  };
  let reached = reach(); let guard = 0;
  while (guard++ < EXHIBITS.length) {
    const un = EXHIBITS.filter(e => !reached.has(e.id));
    if (!un.length) break;
    let added = false;
    for (const c of un) {
      const nb = c.links.find(t => byIdMap[t] && reached.has(t));
      if (nb) { if (!byIdMap[nb].links.includes(c.id)) byIdMap[nb].links.push(c.id); added = true; break; }
    }
    if (!added) break;
    reached = reach();
  }
}

// ===================== 基础设置 =====================
const W = 28, D = 28, H = 13;          // 展厅尺寸
const EYE = 1.7;                        // 视点高度
const FONT = '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// 关键修复：vendored three 为 r160，默认物理光照，而本工程灯光强度是按 legacy 模型写的，
// 不开启则整厅几乎无光、发灰。开启 legacy 光照即可还原作者原本调好的亮度与对比。
renderer.useLegacyLights = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x16110d);
// 雾推远：近面 45 > 展厅对角线(~40)，保证厅内任何位置都不会被灰雾压暗，只在极远处与背景融合
scene.fog = new THREE.Fog(0x16110d, 45, 120);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.rotation.order = 'YXZ';
scene.add(camera);

// 镜头内的三维木弓
const weapon3d = new THREE.Group();
weapon3d.position.set(0.43, -0.18, -0.78);
weapon3d.rotation.set(0, -0.08, 0);
weapon3d.scale.setScalar(0.52);
camera.add(weapon3d);
const gunDark = new THREE.MeshStandardMaterial({ color: 0x171310, metalness: .2, roughness: .6 });
const bowWood = new THREE.MeshStandardMaterial({ color: 0x6f3218, roughness: .48 });
const arrowMat = new THREE.MeshStandardMaterial({ color: 0x382315, roughness: .7 });
function gunPart(geo, mat, x, y, z, rx=0, ry=0, rz=0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z); m.rotation.set(rx,ry,rz); weapon3d.add(m); return m;
}
const bowCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,-.68,0), new THREE.Vector3(-.13,-.34,0), new THREE.Vector3(-.18,0,0),
  new THREE.Vector3(-.13,.34,0), new THREE.Vector3(0,.68,0)
]);
gunPart(new THREE.TubeGeometry(bowCurve,36,.035,10,false), bowWood,0,0,0);
gunPart(new THREE.CylinderGeometry(.055,.055,.24,12), gunDark,-.17,0,0);
const stringGeo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0,-.68,0), new THREE.Vector3(-.02,0,.28), new THREE.Vector3(0,.68,0)
]);
weapon3d.add(new THREE.Line(stringGeo,new THREE.LineBasicMaterial({color:0xe5d8bd})));
const heldArrow = new THREE.Group();
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,1.15,8),arrowMat); shaft.rotation.x=Math.PI/2; shaft.position.z=-.26; heldArrow.add(shaft);
const tip = new THREE.Mesh(new THREE.ConeGeometry(.035,.11,8),gunDark); tip.rotation.x=-Math.PI/2; tip.position.z=-.89; heldArrow.add(tip);
const feather = new THREE.Mesh(new THREE.BoxGeometry(.09,.045,.16),new THREE.MeshStandardMaterial({color:0x8b2830,side:THREE.DoubleSide})); feather.position.z=.28; heldArrow.add(feather);
heldArrow.position.set(-.02,0,.18); weapon3d.add(heldArrow);
let recoil = 0;
const flyingArrows = [];
const flyingBullets = [];
const enemyTracers = [];

// 备用武器：手枪与小刀
const pistol3d = new THREE.Group(); pistol3d.position.set(.34,-.3,-.62); pistol3d.scale.setScalar(.78); camera.add(pistol3d);
function pistolPart(geo,mat,x,y,z,rx=0,ry=0,rz=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);pistol3d.add(m);}
const pistolMetal=new THREE.MeshStandardMaterial({color:0x343a40,metalness:.8,roughness:.25});
pistolPart(new THREE.BoxGeometry(.2,.16,.62),pistolMetal,0,.04,-.12);
pistolPart(new THREE.CylinderGeometry(.038,.038,.5,14),gunDark,0,.05,-.48,Math.PI/2);
pistolPart(new THREE.BoxGeometry(.16,.38,.17),gunDark,0,-.25,.02,-.18);
const knife3d = new THREE.Group(); knife3d.position.set(.34,-.28,-.58); knife3d.rotation.z=-.18; camera.add(knife3d);
const blade=pistolPart; // 保留下方建模函数的简洁命名
const knifeBlade=new THREE.Mesh(new THREE.BoxGeometry(.055,.08,.72),new THREE.MeshStandardMaterial({color:0xc7cbd0,metalness:.92,roughness:.14})); knifeBlade.position.z=-.34; knife3d.add(knifeBlade);
const knifeTip=new THREE.Mesh(new THREE.ConeGeometry(.065,.22,4),knifeBlade.material); knifeTip.rotation.x=-Math.PI/2; knifeTip.position.z=-.8; knife3d.add(knifeTip);
const knifeGrip=new THREE.Mesh(new THREE.BoxGeometry(.11,.12,.34),gunDark); knifeGrip.position.z=.18; knife3d.add(knifeGrip);
let weaponMode='bow';
let audioCtx=null, soundEnabled=true;
let bowCharging=false, chargeStarted=0;
const weaponState={bow:{ammo:1,reserve:30},gun:{ammo:12,reserve:48}};
pistol3d.visible=false; knife3d.visible=false;
function ensureAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}
function tone(freq,duration,type='sine',volume=.04,slide=0){if(!soundEnabled)return;ensureAudio();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.linearRampToValueAtTime(freq+slide,audioCtx.currentTime+duration);g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}
function sound(name){if(name==='bow'){tone(210,.12,'triangle',.08,-90);tone(520,.08,'sine',.035,-180);}if(name==='gun'){tone(92,.08,'square',.1,-45);tone(780,.045,'sawtooth',.035,-500);}if(name==='knife')tone(620,.16,'triangle',.045,-500);if(name==='hit')tone(180,.08,'square',.07,120);if(name==='damage')tone(75,.2,'sawtooth',.08,-25);}
document.getElementById('btn-sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;document.getElementById('btn-sound').textContent=soundEnabled?'音效开':'音效关';if(soundEnabled)ensureAudio();});

let roomGroup = new THREE.Group();
scene.add(roomGroup);

// 灯光（每厅重建时微调）
const ambient = new THREE.HemisphereLight(0xfff3e0, 0x3a2a1a, 0.7);
scene.add(ambient);
const keyLight = new THREE.PointLight(0xffe7c2, 0.9, 60, 1.6);
keyLight.position.set(0, H - 1.5, 2);
keyLight.castShadow = true;
scene.add(keyLight);
const fillLight = new THREE.PointLight(0xcfe0ff, 0.35, 60, 2);
fillLight.position.set(0, H - 2, -6);
scene.add(fillLight);

// ===================== 纹理工具 =====================
function ricePaper(w, h, base = '#f4ecd8') {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  // 细微噪点
  for (let i = 0; i < (w * h) / 900; i++) {
    const a = Math.random() * 0.05;
    x.fillStyle = `rgba(90,60,30,${a})`;
    x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  return { canvas: c, ctx: x };
}

function wrapText(ctx, text, x, y, maxW, lh, maxLines = 99) {
  const chars = [...text];
  let line = '', lines = 0;
  for (const ch of chars) {
    if (ch === '\n') { ctx.fillText(line, x, y); line = ''; y += lh; lines++; continue; }
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      if (lines >= maxLines - 1) { // 末行省略
        while (ctx.measureText(line + '…').width > maxW) line = line.slice(0, -1);
        ctx.fillText(line + '…', x, y); return y + lh;
      }
      ctx.fillText(line, x, y); line = ch; y += lh; lines++;
    } else line = test;
  }
  if (line) { ctx.fillText(line, x, y); y += lh; }
  return y;
}

function plaqueTexture(ex) {
  const w = 1500, h = 1000;
  const { canvas: c, ctx: x } = ricePaper(w, h);
  // 双线边框
  x.strokeStyle = '#7a2e22'; x.lineWidth = 10;
  x.strokeRect(40, 40, w - 80, h - 80);
  x.strokeStyle = '#b8862f'; x.lineWidth = 3;
  x.strokeRect(62, 62, w - 124, h - 124);

  const cat = CATEGORIES[ex.category];
  // 分类标签
  x.fillStyle = cat.color;
  roundRect(x, w / 2 - 90, 90, 180, 56, 12); x.fill();
  x.fillStyle = '#fff'; x.font = `bold 34px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ex.category, w / 2, 118);

  // 标题
  x.fillStyle = '#1c140d'; x.font = `bold 96px ${FONT}`;
  x.fillText(ex.title, w / 2, 250);

  // 分隔
  x.strokeStyle = '#7a2e22'; x.lineWidth = 4;
  x.beginPath(); x.moveTo(w / 2 - 220, 320); x.lineTo(w / 2 + 220, 320); x.stroke();

  // 摘要
  x.fillStyle = '#5a3a22'; x.font = `italic 40px ${FONT}`; x.textAlign = 'center';
  let yy = wrapText(x, ex.summary, w / 2, 380, w - 220, 52, 2);

  // 正文
  x.fillStyle = '#2a1d12'; x.font = `42px ${FONT}`; x.textAlign = 'left';
  wrapText(x, ex.body, 140, yy + 30, w - 280, 58);

  // 印章
  x.fillStyle = '#a52a1f'; roundRect(x, w - 200, h - 200, 120, 120, 10); x.fill();
  x.fillStyle = '#fff'; x.font = `bold 60px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(cat.glyph, w - 140, h - 140);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function featureTexture(ex) {
  const s = 1024;
  const { canvas: c, ctx: x } = ricePaper(s, s, '#efe6cf');
  const cat = CATEGORIES[ex.category];
  // 留白圆（禅意）
  x.strokeStyle = 'rgba(120,90,50,0.35)'; x.lineWidth = 6;
  x.beginPath(); x.arc(s / 2, s / 2 - 30, 330, 0, Math.PI * 2); x.stroke();
  // 大字水印
  x.fillStyle = 'rgba(120,40,30,0.10)'; x.font = `bold 360px ${FONT}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ex.title[0], s / 2, s / 2 - 30);
  // 标题
  x.fillStyle = '#1c140d'; x.font = `bold 78px ${FONT}`;
  x.fillText(ex.title, s / 2, s - 150);
  // 分类点缀
  x.fillStyle = cat.color; roundRect(x, s / 2 - 60, s - 110, 120, 40, 8); x.fill();
  x.fillStyle = '#fff'; x.font = `bold 26px ${FONT}`; x.textBaseline = 'middle';
  x.fillText(ex.category, s / 2, s - 90);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

function doorTexture(title, color) {
  const w = 420, h = 640;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  // 门扇底色
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#3a2418'); g.addColorStop(1, '#241408');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // 顶部分类条
  x.fillStyle = color; x.fillRect(0, 0, w, 90);
  x.fillStyle = '#fff'; x.font = `bold 34px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('展 厅', w / 2, 46);
  // 标题
  x.fillStyle = '#f4ecd8'; x.font = `bold 52px ${FONT}`;
  wrapText(x, title, w / 2, 200, w - 40, 64, 3);
  // 门环装饰
  x.strokeStyle = '#caa24a'; x.lineWidth = 6;
  x.beginPath(); x.arc(w / 2, h - 150, 34, 0, Math.PI * 2); x.stroke();
  // 进入提示
  x.fillStyle = '#caa24a'; x.font = `30px ${FONT}`;
  x.fillText('推门而入', w / 2, h - 90);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

function roundRect(x, rx, ry, rw, rh, r) {
  x.beginPath();
  x.moveTo(rx + r, ry);
  x.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
  x.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
  x.arcTo(rx, ry + rh, rx, ry, r);
  x.arcTo(rx, ry, rx + rw, ry, r);
  x.closePath();
}

// 右墙画作：有插图用真实图（按原比例避免变形），无图回退水墨意象
function makeFeaturePanel(ex) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 })
  );
  if (IMAGES[ex.id]) {
    new THREE.TextureLoader().load(
      IMAGES[ex.id],
      t => {
        t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        const img = t.image;
        const a = (img && img.width && img.height) ? img.width / img.height : 1;
        if (a > 1) mesh.scale.set(1, 1 / a, 1); else mesh.scale.set(a, 1, 1);
        mesh.material.map = t; mesh.material.needsUpdate = true;
      },
      undefined,
      () => { mesh.material.map = featureTexture(ex); mesh.material.needsUpdate = true; }
    );
  } else {
    mesh.material.map = featureTexture(ex);
  }
  return mesh;
}

// 展厅中央三维展品：人物 → 展台 + 旋转的画像碑（正反面贴画像，缓慢自转）
function makeCenterpiece(ex) {
  if (ex.category !== '人物') return null;
  const g = new THREE.Group();

  // 展台
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.15, 1.0, 28),
    new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.85 })
  );
  ped.position.y = 0.5; ped.castShadow = true; g.add(ped);
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 0.12, 28),
    new THREE.MeshStandardMaterial({ color: 0xb8862f, roughness: 0.6, metalness: 0.3 })
  );
  collar.position.y = 1.0; g.add(collar);

  // 碑身
  const bodyH = 3.0;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, bodyH, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x2a1c10, roughness: 0.9 })
  );
  body.position.y = 1.0 + bodyH / 2; body.castShadow = true; g.add(body);

  // 画像（正反面），有真图异步加载，否则用水墨意象
  const mat = new THREE.MeshStandardMaterial({ map: featureTexture(ex), roughness: 0.7 });
  const faceGeo = new THREE.PlaneGeometry(2.0, 2.7);
  const face = new THREE.Mesh(faceGeo, mat); face.position.set(0, 2.5, 0.16); g.add(face);
  const face2 = new THREE.Mesh(faceGeo, mat); face2.position.set(0, 2.5, -0.16); face2.rotation.y = Math.PI; g.add(face2);
  if (IMAGES[ex.id]) {
    new THREE.TextureLoader().load(
      IMAGES[ex.id],
      t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; mat.map = t; mat.needsUpdate = true; },
      undefined, () => {}
    );
  }
  return g;
}

// ===================== 展厅构建 =====================
let doorMeshes = [];
let targetMeshes = [];
let botGroups = [];
let pickupMeshes = [];
let playerHealth = 100;
let missionStartedAt = 0;
let missionComplete = false;
let killStreak = 0, lastKillAt = 0;
let roundNumber=0, roundState='idle', roundCountdown=0;
const difficulty = { speed: 1.15, damageMin: 7, damageMax: 11, attackMin: 1300, attackMax: 2200, name:'普通' };
const difficultyPresets = {
  easy: {speed:.72,damageMin:3,damageMax:6,attackMin:2100,attackMax:3200,name:'简单'},
  normal: {speed:1.15,damageMin:7,damageMax:11,attackMin:1300,attackMax:2200,name:'普通'},
  hard: {speed:1.65,damageMin:11,damageMax:17,attackMin:750,attackMax:1350,name:'困难'}
};
document.querySelectorAll('[data-difficulty]').forEach(btn=>btn.addEventListener('click',()=>{
  Object.assign(difficulty,difficultyPresets[btn.dataset.difficulty]);
  document.querySelectorAll('[data-difficulty]').forEach(b=>b.classList.toggle('selected',b===btn));
}));
let ammo = 1, reserve = 30, score = 0, reloading = false, lastShot = 0;
let current = null;
let currentCenterpiece = null;
let detailOpen = false;
let hoverCenter = null;

function disposeGroup(g) {
  g.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
    }
  });
}

function makeWall(w, h, tex) {
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  return m;
}

function floorTexture() {
  const w = 1024, h = 1024;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#5a3d24'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    x.fillStyle = i % 2 ? '#4a3019' : '#543620';
    x.fillRect(0, i * h / 8, w, h / 8);
    x.strokeStyle = 'rgba(20,10,4,0.6)'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(0, i * h / 8); x.lineTo(w, i * h / 8); x.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const FLOOR_TEX = floorTexture();

function addCombatTargets() {
  targetMeshes = [];
  botGroups = [];
  missionComplete = false;
  missionStartedAt = performance.now();
  const spots = [[-7,0,-6],[7,0,-7],[-8,0,5],[8,0,6],[0,0,-9]];
  spots.forEach((p, i) => {
    const group = new THREE.Group();
    const isFrost=i===0;
    const mat = new THREE.MeshStandardMaterial({ color: isFrost?0x9fc9eb:(i%2?0x8fc7b0:0xe6a1a8), roughness: .68 });
    const trim = new THREE.MeshStandardMaterial({ color: isFrost?0xd9f3ff:0xd1aa62, metalness:.2, roughness:.55 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(.92,1.15,.34), mat);
    body.position.y = 1.55; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 16), new THREE.MeshStandardMaterial({color:0xb89272,roughness:.8}));
    head.position.y = 2.48; head.castShadow = true; head.userData.headshot = true;
    const eyeMat=new THREE.MeshBasicMaterial({color:0x271c27});
    const eyeL=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),eyeMat); eyeL.position.set(-.12,2.53,.31);
    const eyeR=eyeL.clone(); eyeR.position.x=.12;
    const cheekMat=new THREE.MeshBasicMaterial({color:0xf28e9d,transparent:true,opacity:.8});
    const cheekL=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),cheekMat); cheekL.position.set(-.2,2.42,.29);
    const cheekR=cheekL.clone(); cheekR.position.x=.2;
    const smile=new THREE.Mesh(new THREE.TorusGeometry(.09,.018,6,14,Math.PI),new THREE.MeshBasicMaterial({color:0x7e3d46})); smile.position.set(0,2.38,.3); smile.rotation.z=Math.PI;
    const frostHair=new THREE.Mesh(new THREE.SphereGeometry(.37,16,12),new THREE.MeshStandardMaterial({color:0x4e82b5,roughness:.65})); frostHair.position.y=2.68; frostHair.scale.set(1,.62,1);
    const ponyL=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),frostHair.material); ponyL.position.set(-.34,2.37,-.02); ponyL.scale.set(.8,1.8,.8);
    const ponyR=ponyL.clone(); ponyR.position.x=.34;
    const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.12),new THREE.MeshStandardMaterial({color:0xa9eaff,emissive:0x24536b,emissiveIntensity:.5,metalness:.2,roughness:.2})); crystal.position.set(0,1.96,.3);
    const chest = new THREE.Mesh(new THREE.TorusGeometry(.22,.035,8,22), trim); chest.position.set(0,1.62,.19);
    const limbGeo = new THREE.CapsuleGeometry(.13,.72,4,8);
    const armL = new THREE.Mesh(limbGeo, mat); armL.position.set(-.58,1.55,0); armL.rotation.z=-.12;
    const armR = new THREE.Mesh(limbGeo, mat); armR.position.set(.58,1.55,0); armR.rotation.z=.12;
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(.15,.78,4,8), gunDark); legL.position.set(-.23,.65,0);
    const legR = new THREE.Mesh(new THREE.CapsuleGeometry(.15,.78,4,8), gunDark); legR.position.set(.23,.65,0);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(.65,.9,.16,16), new THREE.MeshStandardMaterial({color:0x17120e}));
    stand.position.y = .08;
    group.add(body, head, eyeL, eyeR, cheekL, cheekR, smile, chest, armL, armR, legL, legR, stand);
    if(isFrost) group.add(frostHair,ponyL,ponyR,crystal);
    group.position.set(p[0], 0, p[2]);
    group.userData.alive = true;
    group.userData.health = i%3===0 ? 2 : 1;
    group.userData.armored = i%3===0;
    group.userData.home = new THREE.Vector3(p[0],0,p[2]);
    group.userData.phase = Math.random()*Math.PI*2;
    group.userData.nextAttack = performance.now()+1200+Math.random()*1600;
    [body,head,chest,armL,armR,legL,legR].forEach(m => { m.castShadow=true; m.userData.targetRoot=group; });
    roomGroup.add(group); botGroups.push(group); targetMeshes.push(body,head,chest,armL,armR,legL,legR);
  });
}

function startRound(){
  roundNumber++; roundState='countdown'; roundCountdown=3; playerHealth=100; missionComplete=false;
  document.getElementById('health').textContent='生命 100';
  missionStartedAt=performance.now()+3000;
}
function restartRound(){
  if(!started||!byId[current])return;
  buildRoom(byId[current]); camera.position.set(0,EYE,D/2-4); yaw=0; pitch=0; camera.rotation.set(0,0,0); startRound();
}

function addPickups() {
  pickupMeshes=[];
  const spots=[[-10,0,-2],[10,0,-2],[0,0,7]];
  spots.forEach((p,i)=>{
    const group=new THREE.Group();
    const isHealth=i===0;
    const box=new THREE.Mesh(new THREE.BoxGeometry(.7,.5,.7),new THREE.MeshStandardMaterial({color:isHealth?0xb52f2f:0xc48b2d,roughness:.5,metalness:.2}));
    box.position.y=.35; group.add(box);
    if(isHealth){const cross=new THREE.Mesh(new THREE.BoxGeometry(.12,.52,.04),new THREE.MeshBasicMaterial({color:0xffe8d0}));cross.position.set(0,.36,.36);group.add(cross);const cross2=cross.clone();cross2.rotation.z=Math.PI/2;group.add(cross2);}
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.018,8,24),new THREE.MeshBasicMaterial({color:isHealth?0xff7a63:0xffdb6e}));ring.rotation.x=Math.PI/2;ring.position.y=.04;group.add(ring);
    group.position.set(p[0],0,p[2]);group.userData.type=isHealth?'health':'ammo';group.userData.phase=Math.random()*6;roomGroup.add(group);pickupMeshes.push(group);
  });
}

function updatePickups(dt){
  pickupMeshes.forEach(p=>{if(!p.visible)return;p.userData.phase+=dt*2;p.position.y=Math.sin(p.userData.phase)*.06; p.rotation.y+=dt*.5;const d=p.position.distanceTo(camera.position);if(d<1.45){if(p.userData.type==='health'&&playerHealth<100){playerHealth=Math.min(100,playerHealth+35);document.getElementById('health').textContent=`生命 ${playerHealth}`;p.visible=false;sound('hit');setPrompt('医疗包 +35');}else if(p.userData.type==='ammo'){weaponState.bow.reserve+=8;weaponState.gun.reserve+=12;reserve+=weaponMode==='bow'?8:12;updateAmmoHud();p.visible=false;sound('hit');setPrompt('弹药补给');}}});
}

function buildRoom(ex) {
  disposeGroup(roomGroup);
  scene.remove(roomGroup);
  roomGroup = new THREE.Group();
  scene.add(roomGroup);
  doorMeshes = [];

  // 地板 / 天花
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ map: FLOOR_TEX.clone(), roughness: 0.8 })
  );
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  roomGroup.add(floor);
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ color: 0x2a1d12, roughness: 1 })
  );
  ceil.rotation.x = Math.PI / 2; ceil.position.y = H; roomGroup.add(ceil);

  // 后墙：说明牌（平面 15×10 与画布 1500×1000 同比例，避免文字拉伸）
  const plaque = makeWall(15, 10, plaqueTexture(ex));
  plaque.position.set(0, 5, -D / 2 + 0.05);
  roomGroup.add(plaque);

  // 右墙：插图（有图用真图，无图回退水墨意象）+ 画框
  const feat = makeFeaturePanel(ex);
  feat.rotation.y = -Math.PI / 2; feat.position.set(W / 2 - 0.10, 5, 0);
  roomGroup.add(feat);
  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(8.7, 8.7),
    new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.8 })
  );
  frame.rotation.y = -Math.PI / 2; frame.position.set(W / 2 - 0.04, 5, 0);
  roomGroup.add(frame);

  // 门：左墙 + 前墙
  const links = ex.links.slice(0, 10);
  const leftN = Math.min(5, Math.ceil(links.length / 2));
  const frontN = links.length - leftN;
  const catColor = id => CATEGORIES[byId[id].category].color;

  links.slice(0, leftN).forEach((id, i) => {
    const z = -D / 2 + (D - 4) * ((i + 1) / (leftN + 1));
    addDoor(id, catColor(id), new THREE.Vector3(-W / 2 + 0.1, 2.2, z), Math.PI / 2);
  });
  links.slice(leftN).forEach((id, i) => {
    const xx = -W / 2 + (W - 4) * ((i + 1) / (frontN + 1));
    addDoor(id, catColor(id), new THREE.Vector3(xx, 2.2, D / 2 - 0.1), Math.PI);
  });

  // 当前展品名 HUD
  document.getElementById('cur-name').textContent = ex.title;
  document.getElementById('cur-cat').textContent = ex.category;
  document.getElementById('cur-cat').style.background = CATEGORIES[ex.category].color;

  // 中央三维展品（人物）
  const cp = makeCenterpiece(ex);
  currentCenterpiece = cp;
  if (cp) roomGroup.add(cp);
  addCombatTargets();
  addPickups();
}

function addDoor(id, color, pos, rotY) {
  const t = doorTexture(byId[id].title, color);
  const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, emissive: 0x000000 });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4), mat);
  panel.position.copy(pos); panel.rotation.y = rotY;
  panel.userData.target = id;
  // 门框
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 4.4, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.9 })
  );
  frame.position.copy(pos); frame.rotation.y = rotY; frame.position.add(new THREE.Vector3(0, 0, -0.2).applyAxisAngle(new THREE.Vector3(0,1,0), rotY));
  roomGroup.add(frame); roomGroup.add(panel);
  doorMeshes.push(panel);
  panel.userData.center = pos.clone();
}

// ===================== 控制 =====================
let yaw = 0, pitch = 0;
const keys = {};
let locked = false;
let started = false;
let dragging = false;
let dragX = 0, dragY = 0;
let skipFirstMove = false; // 指针锁定后丢弃首帧，避免 movementX/Y 的首帧大跳

// 沉浸模式：空闲数秒后自动淡出 HUD/工具栏，有操作时立刻恢复
let idleTimer = null;
function showChrome() {
  const tb = document.getElementById('toolbar'), hud = document.getElementById('hud-top');
  tb.style.opacity = '1'; tb.style.pointerEvents = 'auto';
  hud.style.opacity = '1';
}
function hideChrome() {
  const tb = document.getElementById('toolbar'), hud = document.getElementById('hud-top');
  tb.style.opacity = '0'; tb.style.pointerEvents = 'none';
  hud.style.opacity = '0';
}
function wakeChrome() {
  if (!locked) return;
  showChrome();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(hideChrome, 3500);
}

const ray = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
let hoverDoor = null;

canvas.addEventListener('click', () => {
  if (!locked) canvas.requestPointerLock();
});
// 暂停遮罩：点击任意处重新锁定指针继续漫游
document.getElementById('pause').addEventListener('click', () => {
  if (!locked) canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (locked) { skipFirstMove = true; wakeChrome(); } // 进锁后第一帧 movement 常异常大，下一帧起再接收
  else { hideChrome(); clearMovementKeys(); dragging=false; }
  if (!detailOpen) document.getElementById('pause').style.display = locked ? 'none' : 'flex';
});
document.addEventListener('mousemove', e => {
  if (!locked && !dragging) return;
  if (locked && skipFirstMove) { skipFirstMove = false; return; } // 丢弃锁定瞬间的首帧巨跳
  wakeChrome();
  // 钳制单帧位移：阻止偶发/快速甩动造成的巨大 movement 值（一帧猛转几十度 → 视觉「跳」）
  const rawX = locked ? e.movementX : e.clientX - dragX;
  const rawY = locked ? e.movementY : e.clientY - dragY;
  dragX = e.clientX; dragY = e.clientY;
  const dx = Math.max(-120, Math.min(120, rawX));
  const dy = Math.max(-120, Math.min(120, rawY));
  yaw -= dx * 0.0022;
  pitch -= dy * 0.0022;
  pitch = Math.max(-1.2, Math.min(1.2, pitch));
  // 归一化 yaw，避免长期单方向旋转后数值无限累积带来的浮点抖动
  if (yaw > Math.PI) yaw -= Math.PI * 2;
  else if (yaw < -Math.PI) yaw += Math.PI * 2;
});
canvas.addEventListener('pointerdown', e => {
  if (locked || !started) return;
  dragging = true; dragX = e.clientX; dragY = e.clientY;
});
window.addEventListener('pointerup', () => { dragging = false; });
document.addEventListener('pointerlockerror', () => {
  setPrompt('鼠标锁定不可用：仍可用 WASD 行走，按住鼠标拖动视角');
});
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  wakeChrome();
  if (e.code === 'KeyE' && hoverDoor) go(hoverDoor.userData.target);
  if (e.code === 'KeyR') reloadWeapon();
  if (e.code === 'KeyN' && (roundState==='win'||roundState==='lose')) restartRound();
  if (e.code === 'Digit1') switchWeapon('bow');
  if (e.code === 'Digit2') switchWeapon('gun');
  if (e.code === 'Digit3') switchWeapon('knife');
  if (e.code === 'KeyM') toggleMap();
  if (e.code === 'KeyF') openDetail(current);
  if (e.code === 'Escape' && detailOpen) closeDetail();
  if (e.code === '/' ) { e.preventDefault(); openSearch(); }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
function clearMovementKeys(){ Object.keys(keys).forEach(k=>{keys[k]=false;}); }
window.addEventListener('blur', clearMovementKeys);
document.addEventListener('visibilitychange', ()=>{if(document.hidden)clearMovementKeys();});

// 点击进门（准星对准门）
canvas.addEventListener('mousedown', () => {
  if (!locked) return;
  wakeChrome();
  if(weaponMode==='bow'){bowCharging=true;chargeStarted=performance.now();document.getElementById('charge').style.display='block';}
  else shoot();
});
window.addEventListener('mouseup',()=>{if(bowCharging){bowCharging=false;document.getElementById('charge').style.display='none';shoot();}});

function updateAmmoHud() {
  const names={bow:'弓箭 [1]',gun:'手枪 [2]',knife:'小刀 [3]'};
  document.getElementById('weapon-name').textContent=names[weaponMode];
  document.getElementById('ammo').textContent = weaponMode==='knife' ? '近战' :
    (reloading ? (weaponMode==='bow'?'搭箭中…':'换弹中…') : `${weaponMode==='bow'?'箭':'弹'} ${ammo} / ${reserve}`);
  document.getElementById('score').textContent = `命中 ${score}`;
}

function switchWeapon(mode){
  if(mode===weaponMode)return;
  if(weaponMode!=='knife') weaponState[weaponMode]={ammo,reserve};
  weaponMode=mode; reloading=false;
  weapon3d.visible=mode==='bow'; pistol3d.visible=mode==='gun'; knife3d.visible=mode==='knife';
  if(mode!=='knife'){ammo=weaponState[mode].ammo;reserve=weaponState[mode].reserve;}
  heldArrow.visible=mode==='bow'&&ammo>0; updateAmmoHud();
}

function reloadWeapon() {
  if (weaponMode==='knife' || reloading || ammo === (weaponMode==='bow'?1:12) || reserve <= 0) return;
  reloading = true; updateAmmoHud();
  setTimeout(() => {
    const capacity=weaponMode==='bow'?1:12;
    const take = Math.min(capacity - ammo, reserve); ammo += take; reserve -= take;
    reloading = false; updateAmmoHud();
    heldArrow.visible = true;
  }, weaponMode==='bow'?650:900);
}

function shoot() {
  if(roundState!=='live')return;
  const now = performance.now();
  const chargePower=weaponMode==='bow'?Math.min(1,(now-chargeStarted)/900):1;
  const delay=weaponMode==='bow'?550:weaponMode==='gun'?150:420;
  if (reloading || now - lastShot < delay) return;
  if (weaponMode!=='knife' && ammo <= 0) { reloadWeapon(); return; }
  lastShot = now; recoil = 1;
  sound(weaponMode);
  if(weaponMode!=='knife'){ammo--;updateAmmoHud();}
  if(weaponMode==='bow'){
    heldArrow.visible = false;
    const flying = heldArrow.clone(true);
    const wp = new THREE.Vector3(); const wq = new THREE.Quaternion();
    heldArrow.getWorldPosition(wp); camera.getWorldQuaternion(wq);
    flying.position.copy(wp); flying.quaternion.copy(wq); scene.add(flying);
    const direction = new THREE.Vector3(0,0,-1).applyQuaternion(wq);
    const trail=new THREE.Line(new THREE.BufferGeometry().setFromPoints([wp.clone(),wp.clone()]),new THREE.LineBasicMaterial({color:0xffd37a,transparent:true,opacity:.9}));scene.add(trail);
    flyingArrows.push({mesh:flying,velocity:direction.multiplyScalar(18+26*chargePower),born:now,trail,points:[wp.clone()],power:chargePower});
  } else if(weaponMode==='gun') {
    const origin=new THREE.Vector3(); const q=new THREE.Quaternion();
    pistol3d.getWorldPosition(origin); camera.getWorldQuaternion(q);
    const direction=new THREE.Vector3(0,0,-1).applyQuaternion(q);
    const bullet=new THREE.Mesh(new THREE.SphereGeometry(.025,6,4),new THREE.MeshBasicMaterial({color:0xffe4a0}));
    bullet.position.copy(origin); scene.add(bullet);
    const trail=new THREE.Line(new THREE.BufferGeometry().setFromPoints([origin.clone(),origin.clone()]),new THREE.LineBasicMaterial({color:0xffb347,transparent:true,opacity:.95}));scene.add(trail);
    flyingBullets.push({mesh:bullet,velocity:direction.multiplyScalar(95),born:now,trail,points:[origin.clone()]});
  } else {
    // 刀刃挥到画面中央时才进行近战接触判定
    setTimeout(meleeStrike, 145);
  }
  if (weaponMode!=='knife' && ammo === 0) setTimeout(reloadWeapon, 250);
}

function meleeStrike() {
  if (weaponMode !== 'knife') return;
  ray.setFromCamera(center, camera);
  const hit=ray.intersectObjects(targetMeshes.filter(m=>m.visible&&m.userData.targetRoot?.visible),false)[0];
  if(hit&&hit.distance<3.2) hitTarget(hit);
}

function hitTarget(hit,power=1) {
  const root = hit.object.userData.targetRoot;
  if (!root || !root.visible) return;
  const headshot=!!hit.object.userData.headshot;
  root.userData.health -= headshot ? 2 : 1;
  const killed=root.userData.health<=0;
  score += killed ? (headshot ? 2 : (power>.8 ? 2 : 1)) : 0; updateAmmoHud();
  if(!killed){
    const text=document.getElementById('combat-text');text.textContent='命中';text.style.left='50%';text.style.top='45%';text.classList.remove('show');void text.offsetWidth;text.classList.add('show');sound('hit');return;
  }
  const now=performance.now(); killStreak=now-lastKillAt<3200?killStreak+1:1; lastKillAt=now;
  const p=hit.point.clone().project(camera); const text=document.getElementById('combat-text');
  text.textContent=headshot?'爆头 +2':(power>.8?'+2':'+1'); text.style.left=`${(p.x*.5+.5)*innerWidth}px`; text.style.top=`${(-p.y*.5+.5)*innerHeight}px`; text.classList.remove('show');void text.offsetWidth;text.classList.add('show');
  const feed=document.getElementById('killfeed'); const entry=document.createElement('div'); entry.className=`kill-entry${headshot?' head':''}`; entry.textContent=headshot?'爆头击杀  +2':'目标击杀  +1'; if(killStreak>1)entry.textContent+=`  · ${killStreak} 连杀`; feed.prepend(entry); while(feed.children.length>4)feed.lastElementChild.remove(); setTimeout(()=>entry.remove(),4200);
  sound('hit');
  const hm = document.getElementById('hitmarker'); hm.classList.remove('show'); void hm.offsetWidth; hm.classList.add('show');
  root.visible = false;
}

function damagePlayer(amount) {
  if (!started || playerHealth<=0 || roundState!=='live') return;
  playerHealth=Math.max(0,playerHealth-amount);
  sound('damage');
  const hp=document.getElementById('health'); hp.textContent=`生命 ${playerHealth}`; hp.style.color=playerHealth>35?'#a9e3a1':'#ff7770';
  const flash=document.getElementById('damage-flash');flash.classList.remove('show');void flash.offsetWidth;flash.classList.add('show');
  if(playerHealth===0){
    roundState='lose'; clearMovementKeys(); setPrompt(`第 ${roundNumber} 回合失败 · 按 N 重新开始`);
  }
}

function updateBots(dt) {
  if(roundState!=='live')return;
  const now=performance.now();
  botGroups.forEach((bot,i)=>{
    if(!bot.visible)return;
    const dx=camera.position.x-bot.position.x,dz=camera.position.z-bot.position.z;
    const dist=Math.hypot(dx,dz)||1;
    bot.rotation.y=Math.atan2(dx,dz);
    bot.userData.phase+=dt*(1.5+i*.08);
    if(dist>4.6){
      const speed=difficulty.speed*dt;
      bot.position.x+=dx/dist*speed+Math.cos(bot.userData.phase)*dt*.28;
      bot.position.z+=dz/dist*speed+Math.sin(bot.userData.phase)*dt*.28;
    } else {
      bot.position.x+=Math.cos(bot.userData.phase)*dt*.75;
      bot.position.z+=Math.sin(bot.userData.phase)*dt*.75;
    }
    bot.position.x=Math.max(-W/2+2,Math.min(W/2-2,bot.position.x));
    bot.position.z=Math.max(-D/2+2,Math.min(D/2-2,bot.position.z));
    bot.position.y=0;
    if(dist<17&&now>bot.userData.nextAttack&&playerHealth>0){
      bot.userData.nextAttack=now+difficulty.attackMin+Math.random()*(difficulty.attackMax-difficulty.attackMin);
      const from=bot.position.clone();from.y=2.05;const to=camera.position.clone();
      const tracer=new THREE.Line(new THREE.BufferGeometry().setFromPoints([from,to]),new THREE.LineBasicMaterial({color:0xff4938,transparent:true,opacity:.85}));
      scene.add(tracer);enemyTracers.push({mesh:tracer,born:now});
      if(Math.random()<Math.max(.35,.82-dist/30)) damagePlayer(difficulty.damageMin+Math.floor(Math.random()*(difficulty.damageMax-difficulty.damageMin+1)));
    }
  });
}

function updateMission() {
  const alive=botGroups.filter(b=>b.visible).length;
  const total=botGroups.length;
  document.getElementById('mission').textContent=`清除人机 ${total-alive} / ${total}`;
  const now=performance.now();
  if(roundState==='countdown'){
    roundCountdown=Math.ceil((missionStartedAt-now)/1000);
    if(roundCountdown<=0){roundState='live';missionStartedAt=now;}
  }
  const elapsed=Math.max(0,Math.floor((now-missionStartedAt)/1000));
  document.getElementById('mission-time').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`;
  const status=document.getElementById('round-status');
  status.textContent=roundState==='countdown'?`${roundCountdown} 秒`:(roundState==='live'?`第 ${roundNumber} 回合`:(roundState==='win'?'胜利':'失败'));
  if(roundState==='live'&&total>0&&alive===0&&!missionComplete){
    missionComplete=true; document.getElementById('mission').textContent='展厅已清除 ✓';
    roundState='win'; setPrompt(`第 ${roundNumber} 回合胜利 · 按 N 再来一回合`);
  }
}

function updateHover() {
  if (!locked) { hoverDoor = null; hoverCenter = null; setPrompt(null); return; }
  ray.setFromCamera(center, camera);
  const hit = ray.intersectObjects(doorMeshes, false)[0];
  const next = hit ? hit.object : null;
  if (next !== hoverDoor) {
    if (hoverDoor) hoverDoor.material.emissive.setHex(0x000000);
    hoverDoor = next;
    if (hoverDoor) hoverDoor.material.emissive.setHex(0x553311);
  }
  // 中央展品（人物雕像）悬停检测
  let hc = null;
  if (currentCenterpiece) {
    const ch = ray.intersectObject(currentCenterpiece, true)[0];
    if (ch) hc = ch.object;
  }
  hoverCenter = hc;
  if (hoverDoor) setPrompt(`进入展厅 · ${byId[hoverDoor.userData.target].title}（点击 / 按 E）`);
  else if (hoverCenter) setPrompt(`查看「${byId[current].title}」详细解读（点击 / 按 F）`);
  else setPrompt(null);
}

function setPrompt(t) {
  const p = document.getElementById('prompt');
  p.textContent = t || '';
  p.style.opacity = t ? 1 : 0;
}

// ===================== 移动 =====================
const clock = new THREE.Clock();
const vel = new THREE.Vector3();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (started && document.getElementById('intro').style.display === 'none'
      && document.getElementById('map-overlay').style.display !== 'flex'
      && document.getElementById('search-overlay').style.display !== 'flex'
      && !detailOpen) {
    const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const sp = 9;
    const move = new THREE.Vector3();
    if (keys['KeyW']) move.add(fwd);
    if (keys['KeyS']) move.sub(fwd);
    if (keys['KeyD']) move.add(right);
    if (keys['KeyA']) move.sub(right);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(sp * dt);
    camera.position.add(move);
    camera.position.x = Math.max(-W / 2 + 1.4, Math.min(W / 2 - 1.4, camera.position.x));
    camera.position.z = Math.max(-D / 2 + 1.4, Math.min(D / 2 - 1.4, camera.position.z));
    // 不穿过中央展台
    const hd = Math.hypot(camera.position.x, camera.position.z);
    if (hd < 1.8) { const k = 1.8 / (hd || 1); camera.position.x *= k; camera.position.z *= k; }
    camera.position.y = EYE;
    camera.rotation.set(pitch, yaw, 0);
    updateHover();
  }
  if (currentCenterpiece) currentCenterpiece.rotation.y += dt * 0.4;
  if(started&&!detailOpen) updateBots(dt);
  if(started&&!detailOpen) updateMission();
  if(started&&!detailOpen) updatePickups(dt);
  // 枪械后坐力回弹与轻微呼吸摆动
  recoil = Math.max(0, recoil - dt * (weaponMode==='knife' ? 4 : 8));
  const moving = keys['KeyW'] || keys['KeyA'] || keys['KeyS'] || keys['KeyD'];
  const bob = moving && started ? Math.sin(performance.now() * .012) * .012 : 0;
  if(bowCharging) document.querySelector('#charge span').style.width=`${Math.min(100,(performance.now()-chargeStarted)/9)}%`;
  weapon3d.position.set(.43 + bob * .35, -.18, -.78 + recoil * .10);
  weapon3d.rotation.x = recoil * .08;
  heldArrow.position.z = .18 + recoil * .24;
  pistol3d.position.z=-.62+recoil*.12; pistol3d.rotation.x=recoil*.14;
  knife3d.rotation.x=recoil*.85; knife3d.position.z=-.58-recoil*.2;
  for (let i = flyingArrows.length - 1; i >= 0; i--) {
    const a = flyingArrows[i];
    const previous = a.mesh.position.clone();
    const step = a.velocity.clone().multiplyScalar(dt);
    const stepLength = step.length();
    const direction = step.clone().normalize();
    ray.set(previous, direction);
    const arrowHit = ray.intersectObjects(targetMeshes.filter(m => m.visible && m.userData.targetRoot?.visible), false)[0];
    if (arrowHit && arrowHit.distance <= stepLength + .12) {
      a.mesh.position.copy(arrowHit.point); hitTarget(arrowHit,a.power);
      scene.remove(a.mesh); scene.remove(a.trail); a.trail.geometry.dispose(); flyingArrows.splice(i,1);
      continue;
    }
    a.mesh.position.add(step);
    a.velocity.y -= 2.2 * dt;
    a.points.push(a.mesh.position.clone()); if(a.points.length>12)a.points.shift();
    a.trail.geometry.dispose(); a.trail.geometry=new THREE.BufferGeometry().setFromPoints(a.points);
    a.trail.material.opacity=Math.max(.15,1-(performance.now()-a.born)/1800);
    if (performance.now() - a.born > 1800) { scene.remove(a.mesh); scene.remove(a.trail); a.trail.geometry.dispose(); flyingArrows.splice(i,1); }
  }
  for(let i=flyingBullets.length-1;i>=0;i--){
    const b=flyingBullets[i], previous=b.mesh.position.clone(), step=b.velocity.clone().multiplyScalar(dt);
    ray.set(previous,step.clone().normalize());
    const hit=ray.intersectObjects(targetMeshes.filter(m=>m.visible&&m.userData.targetRoot?.visible),false)[0];
    if(hit&&hit.distance<=step.length()+.08){
      b.mesh.position.copy(hit.point); hitTarget(hit);
      scene.remove(b.mesh);scene.remove(b.trail);b.trail.geometry.dispose();flyingBullets.splice(i,1);continue;
    }
    b.mesh.position.add(step); b.points.push(b.mesh.position.clone()); if(b.points.length>7)b.points.shift();
    b.trail.geometry.dispose();b.trail.geometry=new THREE.BufferGeometry().setFromPoints(b.points);
    b.trail.material.opacity=Math.max(.15,1-(performance.now()-b.born)/650);
    if(performance.now()-b.born>650){scene.remove(b.mesh);scene.remove(b.trail);b.trail.geometry.dispose();flyingBullets.splice(i,1);}
  }
  for(let i=enemyTracers.length-1;i>=0;i--){const t=enemyTracers[i],age=performance.now()-t.born;t.mesh.material.opacity=1-age/180;if(age>180){scene.remove(t.mesh);t.mesh.geometry.dispose();enemyTracers.splice(i,1);}}
  renderer.render(scene, camera);
}
animate();

// ===================== 切换展厅 =====================
function go(id) {
  if (!byId[id]) return;
  const f = document.getElementById('fade');
  f.style.opacity = 1;
  hoverDoor = null; setPrompt(null);
  setTimeout(() => {
    current = id;
    buildRoom(byId[id]);
    startRound();
    // 重置位置：面朝后墙说明牌
    camera.position.set(0, EYE, D / 2 - 4);
    yaw = 0; pitch = 0; camera.rotation.set(0, yaw, 0);
    highlightMap(id);
    setTimeout(() => { f.style.opacity = 0; }, 60);
  }, 480);
}

// ===================== 数据索引 + 地图 =====================
const byId = {};
EXHIBITS.forEach(e => byId[e.id] = e);
// 合并来自 hlm.yanghuide.kdns.fr（用户自有知识库）的详细文字：ENRICH 主库 + EXTRA_DETAIL 专题并入
EXHIBITS.forEach(e => {
  let d = e.detail;
  const en = ENRICH[e.id];
  if (en && en.detail) d = en.detail;
  if (EXTRA_DETAIL[e.id]) d = (d ? d + '\n\n' : '') + EXTRA_DETAIL[e.id];
  if (d) e.detail = d;
});
// 让新"研究 / 事件"展厅从核心人物可达
['baoyu', 'daiyu', 'baochai', 'xifeng', 'jiamu'].forEach(id => {
  const e = byId[id];
  if (e) {
    if (!e.links.includes('research-hub')) e.links.push('research-hub');
    if (!e.links.includes('event-hub')) e.links.push('event-hub');
  }
});

// 聚类布局
const nodePos = {};
(() => {
  const cats = Object.keys(CATEGORIES);
  const cx = 400, cy = 300, R = 230;
  cats.forEach((cat, ci) => {
    const ang = (Math.PI * 2 * ci) / cats.length - Math.PI / 2;
    const ccx = cx + Math.cos(ang) * R, ccy = cy + Math.sin(ang) * R;
    const items = EXHIBITS.filter(e => e.category === cat);
    items.forEach((e, i) => {
      const a2 = (Math.PI * 2 * i) / items.length;
      const r2 = 70 + (i % 2) * 34;
      nodePos[e.id] = { x: ccx + Math.cos(a2) * r2, y: ccy + Math.sin(a2) * r2 };
    });
  });
})();

function buildMap() {
  const svg = document.getElementById('map-svg');
  let s = '';
  // 连线
  EXHIBITS.forEach(e => e.links.forEach(l => {
    if (nodePos[l]) {
      s += `<line x1="${nodePos[e.id].x}" y1="${nodePos[e.id].y}" x2="${nodePos[l].x}" y2="${nodePos[l].y}" stroke="rgba(150,120,80,0.18)" stroke-width="1"/>`;
    }
  }));
  // 节点
  EXHIBITS.forEach(e => {
    const p = nodePos[e.id]; const col = CATEGORIES[e.category].color;
    s += `<g class="node" data-id="${e.id}" style="cursor:pointer">
      <circle cx="${p.x}" cy="${p.y}" r="13" fill="${col}" stroke="#f4ecd8" stroke-width="2"/>
      <text x="${p.x}" y="${p.y + 30}" text-anchor="middle" fill="#f0e6d2" font-size="13" font-family='${FONT}'>${e.title}</text>
    </g>`;
  });
  svg.innerHTML = s;
  svg.querySelectorAll('.node').forEach(g => {
    g.addEventListener('click', () => { closeMap(); go(g.dataset.id); });
  });
}
function highlightMap(id) {
  document.querySelectorAll('#map-svg .node circle').forEach(c => {
    const g = c.parentElement;
    c.setAttribute('r', g.dataset.id === id ? 18 : 13);
    c.setAttribute('stroke', g.dataset.id === id ? '#ffd479' : '#f4ecd8');
  });
  document.querySelectorAll('#map-svg .node').forEach(g => g.dataset.id = g.dataset.id);
  // 滚动到当前
  const p = nodePos[id];
  if (p) {
    const svg = document.getElementById('map-svg');
    const box = svg.getBoundingClientRect();
    // 仅高亮，不强制滚动
  }
}

function toggleMap() {
  const m = document.getElementById('map-overlay');
  if (m.style.display === 'flex') closeMap(); else openMap();
}
function openMap() { document.getElementById('map-overlay').style.display = 'flex'; if (locked) document.exitPointerLock(); highlightMap(current); }
function closeMap() { document.getElementById('map-overlay').style.display = 'none'; }

// ===================== 搜索 =====================
function openSearch() {
  const s = document.getElementById('search-overlay');
  s.style.display = 'flex'; if (locked) document.exitPointerLock();
  const inp = document.getElementById('search-input'); inp.value = ''; inp.focus(); renderSearch('');
}
function closeSearch() { document.getElementById('search-overlay').style.display = 'none'; }

// ===================== 详情（来自站点知识库） =====================
function openDetail(id) {
  const ex = byId[id]; if (!ex) return;
  const ov = document.getElementById('detail-overlay');
  const body = ex.detail || (ex.summary + '\n\n' + ex.body);
  document.getElementById('detail-title').textContent = ex.title;
  const dc = document.getElementById('detail-cat');
  dc.textContent = ex.category; dc.style.background = CATEGORIES[ex.category].color;
  document.getElementById('detail-body').textContent = body;
  ov.style.display = 'flex';
  detailOpen = true;
  if (locked) document.exitPointerLock();
  setPrompt(null);
}
function closeDetail() {
  document.getElementById('detail-overlay').style.display = 'none';
  detailOpen = false;
  document.getElementById('pause').style.display = locked ? 'none' : 'flex';
}
document.getElementById('detail-close').addEventListener('click', closeDetail);
document.getElementById('detail-overlay').addEventListener('click', e => {
  if (e.target.id === 'detail-overlay') closeDetail();
});
function renderSearch(q) {
  const list = document.getElementById('search-list');
  const ql = q.trim();
  const res = EXHIBITS.filter(e => !ql || e.title.includes(ql) || e.summary.includes(ql)).slice(0, 40);
  list.innerHTML = res.map(e =>
    `<div class="s-item" data-id="${e.id}"><span class="s-cat" style="background:${CATEGORIES[e.category].color}">${e.category}</span>${e.title}<span class="s-sum">${e.summary}</span></div>`
  ).join('');
  list.querySelectorAll('.s-item').forEach(it =>
    it.addEventListener('click', () => { closeSearch(); go(it.dataset.id); }));
}
document.getElementById('search-input').addEventListener('input', e => renderSearch(e.target.value));
document.getElementById('search-close').addEventListener('click', closeSearch);

// ===================== 启动 =====================
function start() {
  ensureAudio();
  document.getElementById('intro').style.display = 'none';
  started = true;
  document.getElementById('combat-hud').style.display = 'flex';
  updateAmmoHud();
  current = 'baoyu';
  buildRoom(byId[current]);
  startRound();
  camera.position.set(0, EYE, D / 2 - 4);
  yaw = 0; pitch = 0; camera.rotation.set(0, yaw, 0);
  canvas.requestPointerLock();
}
document.getElementById('enter-btn').addEventListener('click', start);
document.getElementById('btn-map').addEventListener('click', () => { if (document.getElementById('intro').style.display !== 'none') return; openMap(); });
document.getElementById('btn-search').addEventListener('click', () => { if (document.getElementById('intro').style.display !== 'none') return; openSearch(); });
document.getElementById('map-close').addEventListener('click', closeMap);

// 起始统计 + 图例
const counts = {};
EXHIBITS.forEach(e => counts[e.category] = (counts[e.category] || 0) + 1);
document.getElementById('intro-stats').innerHTML =
  Object.keys(CATEGORIES).map(c => `<span>${c} <b>${counts[c] || 0}</b></span>`).join('')
  + `<span class="total">共 <b>${EXHIBITS.length}</b> 间展厅</span>`;
document.getElementById('map-legend').innerHTML =
  Object.keys(CATEGORIES).map(c => `<span><i style="background:${CATEGORIES[c].color}"></i>${c}</span>`).join('');

buildMap();
highlightMap('baoyu');

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
