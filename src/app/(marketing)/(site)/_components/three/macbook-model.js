import * as THREE from 'three';

/* ---------- helpers ---------- */

function roundedRectShape(w, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  r = Math.min(r, w / 2 - 0.0001, d / 2 - 0.0001);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Rounded slab: footprint w (x) by d (z), height h (y), centred on origin. */
function slab(w, d, h, r, segments = 14) {
  const b = Math.min(0.0005, h / 5);
  const g = new THREE.ExtrudeGeometry(
    roundedRectShape(w - 2 * b, d - 2 * b, Math.max(r - b, 0.0004)),
    { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: segments }
  );
  g.rotateX(-Math.PI / 2);
  g.translate(0, b - h / 2, 0);
  return g;
}

function mesh(name, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* ---------- materials ---------- */

const M = {
  // Lower roughness slightly to get that smooth, photorealistic Apple satin reflection
  alu: new THREE.MeshStandardMaterial({ name: 'aluminium_body', color: 0x9da1a7, metalness: 0.95, roughness: 0.22, envMapIntensity: 1.2 }),
  aluDark: new THREE.MeshStandardMaterial({ name: 'anodized_dark', color: 0x0e1013, metalness: 0.55, roughness: 0.55, envMapIntensity: 0.5 }),
  keycap: new THREE.MeshStandardMaterial({ name: 'keycap_black', color: 0x232528, metalness: 0.08, roughness: 0.56, envMapIntensity: 0.45 }),
  glass: new THREE.MeshStandardMaterial({ name: 'display_glass', color: 0x050607, metalness: 0.1, roughness: 0.09, envMapIntensity: 1.25 }),
  trackpad: new THREE.MeshStandardMaterial({ name: 'trackpad_glass', color: 0x8f9399, metalness: 0.75, roughness: 0.42, envMapIntensity: 0.85 }),
  display: new THREE.MeshStandardMaterial({
    name: 'display_on', color: 0x21384d, metalness: 0.0, roughness: 0.35,
    emissive: 0x5980a6, emissiveIntensity: 0.55,
  }),
  rubber: new THREE.MeshStandardMaterial({ name: 'rubber_foot', color: 0x15171a, metalness: 0.0, roughness: 0.92 }),
  
  // Refined logo settings to mimic the polished-inlay look
  logo: new THREE.MeshStandardMaterial({
    name: 'lid_logo', color: 0x767a80, metalness: 1.0, roughness: 0.12,
    envMapIntensity: 1.8, transparent: true,
  }),
};

export const FINISHES = {
  /* `logo` sits just below `alu` in value — never a hard-contrast sticker. */
  silver:    { alu: 0xb9bdc2, dark: 0x121316, pad: 0xaeb2b7, logo: 0xa7abb1 },
  spacegray: { alu: 0x9da1a7, dark: 0x0e1013, pad: 0x8f9399, logo: 0x8d9197 },
  starlight: { alu: 0xe8ddca, dark: 0x161410, pad: 0xdfd3bf, logo: 0xd6cab5 },
  midnight:  { alu: 0x2e3540, dark: 0x0c0e12, pad: 0x272d38, logo: 0x262c36 },
  skyblue:   { alu: 0xc9d7e4, dark: 0x11141a, pad: 0xbecddb, logo: 0xb7c6d3 },
};

/* ---------- dimensions (metres, MacBook-Air-class 13") ---------- */

const W = 0.3041;          // width
const D = 0.2151;          // depth
const BASE_H = 0.0068;     // base thickness
const LID_H = 0.0040;      // lid thickness
const SCREEN_H = 0.2100;   // lid height
const R = 0.0105;          // corner radius
const KEY_PITCH = 0.019;
const HINGE_Z = -D / 2 + LID_H;

export function buildMacBook(options = {}) {
  const { logoUrl = './lid-logo-mark.png' } = options;
  const root = new THREE.Group();
  root.name = 'macbook_air';

  /* ----- base ----- */
  const base = new THREE.Group();
  base.name = 'base_assembly';
  const baseTop = BASE_H;
  base.add(mesh('base_unibody', slab(W, D, BASE_H, R, 22), M.alu, 0, BASE_H / 2, 0));

  // keyboard well (recessed dark plate)
  const kbW = KEY_PITCH * 14.2;
  const kbD = KEY_PITCH * 5 + 0.0115;
  const kbZ = -D / 2 + 0.0125 + kbD / 2;
  base.add(mesh('keyboard_well', slab(kbW, kbD, 0.0012, 0.0018), M.aluDark, 0, baseTop - 0.0004, kbZ));

  // keycaps: function row (short) + 5 full rows
  const rows = [
    { count: 13, h: 0.0100, split: null },
    { count: 14, h: KEY_PITCH - 0.0031, split: null },
    { count: 14, h: KEY_PITCH - 0.0031, split: null },
    { count: 13, h: KEY_PITCH - 0.0031, split: null },
    { count: 12, h: KEY_PITCH - 0.0031, split: null },
    { count: 0, h: KEY_PITCH - 0.0031, split: 'space' },
  ];
  const capKeyGeoCache = new Map();
  const capGeo = (w, d) => {
    const k = w.toFixed(4) + '|' + d.toFixed(4);
    if (!capKeyGeoCache.has(k)) capKeyGeoCache.set(k, slab(w, d, 0.0008, 0.0006, 6));
    return capKeyGeoCache.get(k);
  };
  const rowTop = kbZ - kbD / 2 + 0.0055;
  let zCursor = rowTop;
  rows.forEach((row, ri) => {
    const usable = kbW - 0.008;
    const capD = ri === 0 ? 0.0088 : 0.0158;
    const y = baseTop + 0.0004;
    if (row.split === 'space') {
      // bottom row: modifiers + spacebar + arrow cluster
      const items = [0.026, 0.019, 0.024, 0.024, 0.096, 0.024, 0.024, 0.019];
      const gap = 0.0028;
      let total = items.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
      let x = -total / 2;
      items.forEach((w, i) => {
        base.add(mesh(`key_bottom_${i}`, capGeo(w, capD), M.keycap, x + w / 2, y, zCursor + capD / 2));
        x += w + gap;
      });
      // arrow cluster (half-height up/down) sits inside the right modifiers
      const ax = total / 2 - 0.019 - gap - 0.024;
      base.add(mesh('key_arrow_left', capGeo(0.0155, capD), M.keycap, ax - 0.0165, y, zCursor + capD / 2));
    } else {
      const gap = 0.0028;
      const capW = (usable - gap * (row.count - 1)) / row.count;
      let x = -usable / 2;
      for (let i = 0; i < row.count; i++) {
        base.add(mesh(`key_r${ri}_${i}`, capGeo(capW, capD), M.keycap, x + capW / 2, y, zCursor + capD / 2));
        x += capW + gap;
      }
    }
    zCursor += (ri === 0 ? 0.0088 : KEY_PITCH - 0.0032) + 0.0024;
  });

  // trackpad
  const tpD = 0.0795, tpW = 0.1295;
  const tpZ = D / 2 - 0.0135 - tpD / 2;
  base.add(mesh('trackpad', slab(tpW, tpD, 0.0009, 0.0035, 18), M.trackpad, 0, baseTop - 0.00015, tpZ));

  // ports
  const portY = BASE_H / 2;
  base.add(mesh('port_magsafe', slab(0.0035, 0.0105, 0.0028, 0.0012, 8), M.aluDark, -W / 2 + 0.0012, portY, -0.052));
  base.add(mesh('port_usbc_1', slab(0.0035, 0.0092, 0.0032, 0.0014, 8), M.aluDark, -W / 2 + 0.0012, portY, -0.020));
  base.add(mesh('port_usbc_2', slab(0.0035, 0.0092, 0.0032, 0.0014, 8), M.aluDark, -W / 2 + 0.0012, portY, -0.005));
  base.add(mesh('port_headphone', slab(0.0035, 0.0042, 0.0042, 0.0019, 10), M.aluDark, W / 2 - 0.0012, portY, -0.028));

  // rubber feet
  const footGeo = new THREE.CylinderGeometry(0.0058, 0.0062, 0.0012, 24);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
    base.add(mesh(`foot_${i}`, footGeo, M.rubber, sx * (W / 2 - 0.019), -0.0005, sz * (D / 2 - 0.016)));
  });

  // hinge barrel
  const hingeGeo = new THREE.CylinderGeometry(0.0026, 0.0026, W - 0.055, 28);
  hingeGeo.rotateZ(Math.PI / 2);
  base.add(mesh('hinge_barrel', hingeGeo, M.aluDark, 0, baseTop - 0.0032, HINGE_Z - 0.0004));

  root.add(base);

  /* ----- lid (pivots at the hinge) ----- */
  const lid = new THREE.Group();
  lid.name = 'lid_pivot';
  lid.position.set(0, baseTop + 0.0012, HINGE_Z);

  const lidGeo = slab(W, SCREEN_H, LID_H, R, 22);
  lidGeo.rotateX(Math.PI / 2);              // height -> y, thickness -> z
  lidGeo.translate(0, SCREEN_H / 2, -LID_H / 2);
  lid.add(mesh('lid_unibody', lidGeo, M.alu));

  // cover glass, flush with the lid face
  const glassGeo = slab(W - 0.0060, SCREEN_H - 0.0060, 0.0008, 0.0082, 18);
  glassGeo.rotateX(Math.PI / 2);
  glassGeo.translate(0, SCREEN_H / 2, 0.0000);
  lid.add(mesh('display_glass', glassGeo, M.glass));

  // active area: 16:10, clean UVs so an image maps square
  const sideBezel = 0.0075, topBezel = 0.0070;
  const panelW = W - 2 * sideBezel;
  const panelH = panelW / 1.6;
  const panelCY = SCREEN_H - topBezel - panelH / 2;
  const panel = mesh('display_panel', new THREE.PlaneGeometry(panelW, panelH), M.display, 0, panelCY, 0.0006);
  panel.castShadow = false;
  lid.add(panel);

  // logo plate on the lid's outer face (user-supplied artwork)
  const logoW = 0.056;
  const logo = mesh('lid_logo', new THREE.PlaneGeometry(logoW, logoW * 1.26), M.logo, 0, SCREEN_H / 2, -LID_H - 0.0002);
  logo.rotation.y = Math.PI;
  logo.castShadow = false;
  logo.visible = false;
  lid.add(logo);

  // camera notch housing + lens
  const notchY = SCREEN_H - topBezel - 0.0034;
  const notchGeo = slab(0.0165, 0.0068, 0.0006, 0.0012, 8);
  notchGeo.rotateX(Math.PI / 2);
  notchGeo.translate(0, notchY, 0.0008);
  lid.add(mesh('camera_notch', notchGeo, M.glass));
  const lensGeo = new THREE.CylinderGeometry(0.0011, 0.0011, 0.0004, 20);
  lensGeo.rotateX(Math.PI / 2);
  lid.add(mesh('camera_lens', lensGeo, M.aluDark, 0, notchY, 0.0011));

  root.add(lid);

  // centre the whole thing on the origin in x/z, base resting at y=0
  root.position.set(0, 0, 0);

  const setFinish = (key) => {
    const f = FINISHES[key] || FINISHES.silver;
    M.alu.color.setHex(f.alu);
    M.aluDark.color.setHex(f.dark);
    M.trackpad.color.setHex(f.pad);
    M.logo.color.setHex(f.logo);
  };

  /**
   * Lid opening angle in degrees. 0 = fully closed, 90 = vertical,
   * ~112 = typical open pose. Screen brightness fades out as it closes.
   */
  const setLidAngle = (deg) => {
    const d = THREE.MathUtils.clamp(deg, 0.8, 135);   // 0.8° keeps a visible seam
    lid.rotation.x = Math.PI / 2 - THREE.MathUtils.degToRad(d);
    const open = THREE.MathUtils.clamp((d - 12) / 30, 0, 1);
    M.display.emissiveIntensity = (M.display.emissiveMap ? 0.42 : 0.55) * open;
  };

  const loader = new THREE.TextureLoader();

  const setLidLogo = (url) => {
    if (!url) { logo.visible = false; return Promise.resolve(); }
    return new Promise((resolve, reject) => {
      loader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        if (M.logo.map) M.logo.map.dispose();
        M.logo.map = tex;
        M.logo.needsUpdate = true;
        const img = tex.image;
        if (img && img.width && img.height) {
          logo.geometry.dispose();
          logo.geometry = new THREE.PlaneGeometry(logoW, logoW * (img.height / img.width));
        }
        logo.visible = true;
        resolve(tex);
      }, undefined, reject);
    });
  };
  if (logoUrl) setLidLogo(logoUrl).catch(() => {});

  const setScreenImage = (url) => {
    if (!url) {
      if (M.display.map) M.display.map.dispose();
      M.display.map = null;
      M.display.emissiveMap = null;
      M.display.color.setHex(0x21384d);
      M.display.emissive.setHex(0x5980a6);
      M.display.emissiveIntensity = 0.55;
      M.display.needsUpdate = true;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      loader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        if (M.display.map) M.display.map.dispose();
        M.display.map = tex;
        M.display.emissiveMap = tex;
        M.display.color.setHex(0xffffff);
        M.display.emissive.setHex(0xffffff);
        M.display.emissiveIntensity = 0.42;
        M.display.needsUpdate = true;
        resolve(tex);
      }, undefined, reject);
    });
  };

  return {
    root, lid, materials: M,
    setFinish, setLidAngle, setScreenImage, setLidLogo,
    logo, dims: { W, D, BASE_H, SCREEN_H },
  };
}