/* Revolt Lithium — hero WebGL viewer
   - Procedural 3D battery packs (case, label, LFP cells, busbars, handles, cables)
   - Custom GLSL: animated current-field background + cell "charge" shader
   - Adaptive quality ("GPU load balancing"): pixel ratio scales with frame time,
     rendering pauses off-screen / in hidden tabs, reduced-motion respected. */
import * as THREE from 'three';
import type { BatteryModel, Viewer } from './types';

const MODELS: Record<string, BatteryModel> = window.REVOLT_MODELS || {};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initViewer(canvas: HTMLCanvasElement, opts: { onModel?: (m: BatteryModel) => void } = {}): Viewer | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  if (!renderer.getContext()) return null;

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.autoClear = false;
  // weak / software GPU (SwiftShader, llvmpipe) -> low-power on-demand rendering
  const gl = renderer.getContext(); const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  const lowPower = /swiftshader|llvmpipe|software|basic render/i.test(gpu) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
  let budget = 90;                       // frames left to draw in low-power mode
  const wake = (n = 90) => { const idle = lowPower && budget <= 0; budget = Math.max(budget, n); if (idle) tick(); };

  /* ---------- background: current-field shader ---------- */
  const bgScene = new THREE.Scene();
  const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const bgUni = {
    uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uCharge: { value: 0.8 }
  };
  const bgMat = new THREE.ShaderMaterial({
    uniforms: bgUni, depthWrite: false, depthTest: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv; uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uCharge;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
      float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
      void main(){
        vec2 uv = vUv; vec2 p = (uv-.5)*vec2(uRes.x/uRes.y,1.);
        vec2 m = (uMouse-.5)*vec2(uRes.x/uRes.y,1.);
        float d = length(p-m);
        // field lines: iso-lines of a slowly flowing potential, bent by the pointer
        float pot = p.y*3.2 + fbm(p*1.6 + vec2(uTime*.05, -uTime*.03))*2.4 + .35/(d+.35);
        float lines = abs(fract(pot*2.2 - uTime*.18*(.4+uCharge)) - .5);
        float line = smoothstep(.06, .0, lines) * (.25 + .75*smoothstep(1.2,.0,length(p)));
        vec3 ink = vec3(.039,.122,.231);     // #0A1F3B navy
        vec3 teal = vec3(.086,.231,.42);     // #163B6B
        vec3 lime = mix(vec3(.45,.68,.95), vec3(.61,.83,.15), .35);  // sky-blue field lines with a hint of charge
        vec3 col = mix(ink, teal, smoothstep(.9,-.6,p.y + fbm(p*2.)*.4) * .55);
        col += lime * line * .2;
        col += lime * .05 * smoothstep(.6,.0,d);
        col *= 1. - .35*dot(uv-.5,uv-.5)*2.;                 // vignette
        col += (hash(uv*uRes + uTime) - .5) * .025;            // grain
        gl_FragColor = vec4(col,1.);
      }`
  });
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));

  /* ---------- 3D scene ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
  camera.position.set(0, 0.18, 2.4);

  scene.add(new THREE.HemisphereLight(0xe6effa, 0x0a1f3b, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(1.6, 2.2, 2.4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fb2ff, 1.5); rim.position.set(-2.2, 0.6, -1.8); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x9fd7ff, 0.5); fill.position.set(-1.5, -0.4, 2); scene.add(fill);

  // soft contact shadow
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

  const pivot = new THREE.Group(); scene.add(pivot);
  let current = null, currentId = null;
  const state = { xray: 0, xrayTarget: 0, charge: 0.8, yaw: -0.35, base: -0.35, pitch: 0.12, vyaw: 0, vpitch: 0, dragging: false, auto: !reduceMotion && !lowPower, pop: 0 };

  /* shared cell shader: LFP prismatic cell that fills with "charge" from the bottom */
  const cellUni = { uTime: { value: 0 }, uCharge: { value: 0.8 }, uXray: { value: 0 }, uMinY: { value: 0 }, uMaxY: { value: 1 } };
  const cellMat = new THREE.ShaderMaterial({
    uniforms: cellUni, transparent: true,
    vertexShader: `
      varying vec3 vN; varying vec3 vW; varying vec3 vV;
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal);
        vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `
      varying vec3 vN; varying vec3 vW; varying vec3 vV;
      uniform float uTime, uCharge, uXray, uMinY, uMaxY;
      void main(){
        float h = clamp((vW.y-uMinY)/(uMaxY-uMinY),0.,1.);
        float fres = pow(1.-max(dot(vN,vV),0.),2.);
        vec3 blue = vec3(.11,.32,.62);                         // LFP cell casing blue
        vec3 lime = vec3(.61,.85,.15);
        float filled = step(h, uCharge);
        float edge = smoothstep(.035,0.,abs(h-uCharge));
        float pulse = .5+.5*sin(vW.x*18. - uTime*3.);
        vec3 col = mix(blue*.55, mix(blue, lime, .55), filled*(.55+.25*pulse));
        col += lime*edge*1.4 + fres*vec3(.55,.8,1.)*.35;
        gl_FragColor = vec4(col, mix(0., .96, uXray));
      }`
  });

  function labelTexture(m) {
    const W = 1024, H = Math.round(1024 * m.face[1] / m.face[0]);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const F = (w, s) => `${w} ${s}px "Figtree", Arial, sans-serif`;
    if (m.finish === 'engraved') {
      g.fillStyle = '#1b1f1e'; g.fillRect(0, 0, W, H);
      const silver = g.createLinearGradient(0, 0, W, 0); silver.addColorStop(0, '#9aa3a1'); silver.addColorStop(.5, '#eef2f1'); silver.addColorStop(1, '#9aa3a1');
      g.fillStyle = silver; g.textAlign = 'center';
      g.font = F(800, W * .13); g.fillText(m.brandText, W / 2, H * .36);
      g.font = F(700, W * .085); g.fillText('(LiFePO4)', W / 2, H * .52);
      g.font = F(500, W * .06); g.fillText(m.kind.toUpperCase(), W / 2, H * .66);
      g.textAlign = 'left'; g.font = F(700, W * .05); g.fillText(m.code, W * .07, H * .9);
      g.textAlign = 'right'; g.fillText(`${m.v} VOLT ${m.ah} AH`, W * .93, H * .9);
    } else if (m.brand === 'Livgreen') {
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0d5b52'); gr.addColorStop(.55, '#138a5a'); gr.addColorStop(1, '#8cc63f');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, H * .62); g.lineTo(W * .5, H * .78); g.lineTo(W, H * .62); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      g.fillStyle = '#c8e639'; g.fillRect(0, H * .58, W, H * .02);
      // leaf mark
      g.save(); g.translate(W / 2, H * .17); g.fillStyle = '#b7e04a';
      for (const r of [-0.6, 0.15]) { g.save(); g.rotate(r); g.beginPath(); g.ellipse(0, -H * .05, W * .03, H * .07, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      g.restore();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = F(800, W * .12); g.fillText('LIVGREEN', W / 2, H * .38);
      g.font = F(600, W * .04); g.fillText('LITHIUM FERROPHOSPHATE (LiFePO4)', W / 2, H * .48);
      g.fillStyle = '#c8e639'; g.font = F(800, W * .055); g.fillText(m.kind.toUpperCase(), W / 2, H * .56);
      g.fillStyle = '#0d4a43'; g.font = F(800, W * .06); g.fillText(`${m.v}V  ${m.ah}Ah  ${m.kwh.toFixed(2)} kWh`, W / 2, H * .88);
      badge(g, W * .06, H * .06, W, m.warranty);
    } else {
      g.fillStyle = '#9cd326'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(W * .55, 0); g.lineTo(W, 0); g.lineTo(W, H * .5); g.fill();
      g.textAlign = 'center';
      g.font = F(900, W * .15); const t1 = 'RED', t2 = 'TUFF';
      const w1 = g.measureText(t1).width, w2 = g.measureText(t2).width, x0 = W / 2 - (w1 + w2) / 2;
      const by = Math.max(H * .42, W * .07 + W * .17);
      g.textAlign = 'left'; g.fillStyle = '#e0322b'; g.fillText(t1, x0, by); g.fillStyle = '#2a2f2e'; g.fillText(t2, x0 + w1, by);
      g.textAlign = 'center'; g.fillStyle = '#2a2f2e'; g.font = F(500, W * .035); g.fillText('Always on Always Win', W / 2, by + H * .07);
      g.font = F(700, W * .04); g.fillText('LITHIUM FERROPHOSPHATE (LiFePO4)', W / 2, by + H * .15);
      g.font = F(900, W * .06); g.fillText(m.kind.toUpperCase(), W / 2, by + H * .26);
      g.fillStyle = '#1f3b17'; g.fillRect(0, H * .76, W, H * .24);
      g.fillStyle = '#ffffff'; g.font = F(800, W * .055); g.fillText(`${m.kwh.toFixed(3)} kWh   ${m.v}V   ${m.ah}Ah`, W / 2, H * .9);
      badge(g, W * .06, H * .06, W, m.warranty);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  function badge(g, x, y, W, months) {
    g.fillStyle = '#e0322b'; g.fillRect(x, y, W * .1, W * .07);
    g.fillStyle = '#fff'; g.fillRect(x + W * .1, y, W * .13, W * .07);
    g.font = `900 ${W * .055}px "Figtree", sans-serif`; g.textAlign = 'center'; g.fillText(String(months), x + W * .05, y + W * .055);
    g.fillStyle = '#1b3a8a'; g.font = `800 ${W * .026}px "Figtree", sans-serif`; g.fillText('MONTHS', x + W * .165, y + W * .032); g.fillText('WARRANTY', x + W * .165, y + W * .058);
  }

  function roundedBox(w, h, d, r) {
    const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const geo = new THREE.ExtrudeGeometry(s, { depth: d - r * 2, bevelEnabled: true, bevelThickness: r, bevelSize: r * .6, bevelSegments: 4, curveSegments: 6 });
    geo.translate(0, 0, -(d - r * 2) / 2); return geo;
  }

  function build(id) {
    const m = MODELS[id]; if (!m) return null;
    const g = new THREE.Group();
    const [W, H, D] = m.size;
    const caseColor = m.case === 'steel' ? 0x8d9592 : m.finish === 'engraved' || m.case === 'black' ? 0x1f2423 : (m.case === 'white' || (m.brand === 'Livgreen' && m.case !== 'lime') ? 0xf2f5f3 : 0x8fca22);
    const caseMat = new THREE.MeshPhysicalMaterial({ color: caseColor, metalness: m.case === 'steel' ? .85 : .35, roughness: m.finish === 'engraved' ? .62 : .38, clearcoat: .6, clearcoatRoughness: .3, transparent: true });
    const body = new THREE.Mesh(roundedBox(W, H, D, Math.min(W, H, D) * .06), caseMat); g.add(body);

    if (m.lid) { // lime lid on black 2W packs
      const lid = new THREE.Mesh(roundedBox(W * 1.02, H * .16, D * 1.02, H * .02), new THREE.MeshPhysicalMaterial({ color: 0x9cd326, metalness: .3, roughness: .3, clearcoat: 1, transparent: true }));
      lid.position.y = H * .43; g.add(lid); g.userData.lid = lid;
    }
    let frontZ = D / 2;
    if (m.bezel) {   // lime front panel on steel inverter bodies
      const bz = new THREE.Mesh(roundedBox(W * 1.03, H * 1.02, D * .08, Math.min(W, H) * .05), new THREE.MeshPhysicalMaterial({ color: m.bezel, metalness: .25, roughness: .3, clearcoat: 1, transparent: true }));
      bz.position.z = D / 2 + D * .02; g.add(bz); frontZ = D / 2 + D * .06;
    }
    // front label
    const face = m.face; const lab = new THREE.Mesh(new THREE.PlaneGeometry(face[0], face[1]), new THREE.MeshStandardMaterial({ map: labelTexture(m), roughness: .5, metalness: .05, transparent: true }));
    lab.position.set(0, m.faceY || 0, frontZ + .002); g.add(lab);

    // display (96V and some inverter-style packs)
    if (m.display) {
      const sc = document.createElement('canvas'); sc.width = 256; sc.height = 128; const x = sc.getContext('2d');
      x.fillStyle = '#071a2e'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#9cd326'; x.font = '800 64px Figtree, sans-serif'; x.textAlign = 'center'; x.fillText('71%', 128, 84);
      x.fillStyle = '#3fa9f5'; x.fillRect(30, 100, 196 * .71, 10);
      const disp = new THREE.Mesh(new THREE.PlaneGeometry(W * .16, W * .08), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true }));
      disp.position.set(0, m.displayY != null ? H * m.displayY : -H * .22, frontZ + .004); g.add(disp); g.userData.disp = { tex: disp.material.map, canvas: sc };
    }

    // LFP cells inside
    const n = m.cells, cols = Math.ceil(Math.sqrt(n * W / D)), rows = Math.ceil(n / cols);
    const cw = (W * .86) / cols, cd = (D * .8) / rows, ch = H * .7;
    const cellGeo = new THREE.BoxGeometry(cw * .86, ch, cd * .8);
    const cells = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const cx = (i % cols) - (cols - 1) / 2, cz = Math.floor(i / cols) - (rows - 1) / 2;
      const c = new THREE.Mesh(cellGeo, cellMat); c.position.set(cx * cw, -H * .06, cz * cd); cells.add(c);
    }
    const bus = new THREE.MeshStandardMaterial({ color: 0xc9874a, metalness: 1, roughness: .3, transparent: true, opacity: 0 });
    for (let r = 0; r < rows; r++) { const b = new THREE.Mesh(new THREE.BoxGeometry(W * .84, H * .015, cd * .18), bus); b.position.set(0, -H * .06 + ch / 2 + H * .01, (r - (rows - 1) / 2) * cd); cells.add(b); }
    const bms = new THREE.Mesh(new THREE.BoxGeometry(W * .5, H * .02, D * .3), new THREE.MeshStandardMaterial({ color: 0x0f5132, roughness: .6, transparent: true, opacity: 0 }));
    bms.position.set(0, -H * .06 + ch / 2 + H * .045, 0); cells.add(bms);
    cells.visible = false; g.add(cells);
    g.userData = { ...g.userData, caseMat, lab, cells, bus, bms, minY: -H * .06 - ch / 2, maxY: -H * .06 + ch / 2, m };

    // handles
    const hMat = new THREE.MeshStandardMaterial({ color: m.case === 'lime' ? 0x8fca22 : 0xc7cdcb, metalness: .9, roughness: .25, transparent: true });
    const handle = (x, y, z, ry = 0, scale = 1) => {
      const t = new THREE.Mesh(new THREE.TorusGeometry(.055 * scale, .009 * scale, 10, 24, Math.PI), hMat);
      t.position.set(x, y, z); t.rotation.y = ry; g.add(t);
    };
    if (m.handles === 'top') handle(0, H / 2 + (m.lid ? .01 : 0), 0, 0, W * 3);
    if (m.handles === 'ends') { handle(-W / 2 - .004, 0, 0, Math.PI / 2, 1.4); handle(W / 2 + .004, 0, 0, -Math.PI / 2, 1.4); g.children.slice(-2).forEach(t => t.rotation.z = Math.PI / 2); }
    if (m.handles === 'four') { for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(.045, .007, 8, 20, Math.PI), hMat); t.position.set(sx * W * .4, sy * H * .3, D / 2 + .01); t.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2; t.rotation.y = 0; g.add(t); } }

    // terminals + cables
    const red = new THREE.MeshStandardMaterial({ color: 0xd9302a, roughness: .5, transparent: true }), blk = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: .5, transparent: true });
    const steel = new THREE.MeshStandardMaterial({ color: 0xdfe3e2, metalness: 1, roughness: .2, transparent: true });
    if (m.cable) {
      const topY = H / 2 + (m.lid ? H * .1 : 0);
      ([[W * .28, red], [W * .14, blk]] as [number, THREE.Material][]).forEach(([x, mat], k) => {
        const gland = new THREE.Mesh(new THREE.CylinderGeometry(.012, .014, .02, 12), steel); gland.position.set(x, topY + .01, -D * .2); g.add(gland);
        const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, topY + .01, -D * .2), new THREE.Vector3(x, topY + .06, -D * .2), new THREE.Vector3(x - .03 + k * .01, topY + .11, -D * .05), new THREE.Vector3(W * .2, topY + .13, D * .05)]);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .007, 8), mat));
      });
      const plug = new THREE.Mesh(new THREE.BoxGeometry(.06, .045, .03), new THREE.MeshStandardMaterial({ color: 0xa9aaa6, roughness: .55, transparent: true }));
      plug.position.set(W * .2, topY + .14, D * .06); plug.rotation.z = .4; g.add(plug);
    } else {
      ([[-W / 2 - .01, H * .22, red], [-W / 2 - .01, H * .05, blk]] as [number, number, THREE.Material][]).forEach(([x, y, mat]) => {
        const t = new THREE.Mesh(new THREE.BoxGeometry(.03, .045, .04), mat); t.position.set(x, y, D * .3); g.add(t);
      });
      if (m.display) ([[-W * .25, red], [W * .25, blk]] as [number, THREE.Material][]).forEach(([x, mat]) => { const t = new THREE.Mesh(new THREE.BoxGeometry(.09, .06, .02), mat); t.position.set(x, -H * .38, D / 2 + .01); g.add(t); });
    }
    // fit to view
    const s = 0.9 / Math.max(W, H * (m.cable ? 1.3 : H > W * 1.4 ? 1.55 : 1.15), D);
    g.scale.setScalar(s); g.position.y = -0.02;
    shadow.scale.set(W * s * 1.8, D * s * 2.2, 1); shadow.position.y = -H * s / 2 - 0.02;
    return g;
  }

  function setModel(id) {
    if (id === currentId) return;
    const next = build(id); if (!next) return;
    if (current) { pivot.remove(current); current.traverse(o => { o.geometry?.dispose?.(); if (o.material && o.material !== cellMat) { o.material.map?.dispose?.(); o.material.dispose?.(); } }); }
    current = next; currentId = id; pivot.add(current);
    cellUni.uMinY.value = current.userData.minY * current.scale.y + current.position.y;
    cellUni.uMaxY.value = current.userData.maxY * current.scale.y + current.position.y;
    pivot.rotation.set(0, 0, 0); state.pop = 0; state.base = -0.35; state.yaw = -0.35; state.vyaw = 0; if (!reduceMotion && !lowPower) state.auto = true;
    opts.onModel?.(MODELS[id]); wake();
  }

  /* ---------- interaction ---------- */
  let lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', e => { wake(); state.dragging = true; state.auto = false; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect(); bgUni.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    if (!state.dragging) return;
    wake(60);
    state.vyaw = (e.clientX - lx) * .008; state.vpitch = (e.clientY - ly) * .005; lx = e.clientX; ly = e.clientY;
    state.yaw += state.vyaw; state.pitch = THREE.MathUtils.clamp(state.pitch + state.vpitch, -.5, .7);
  });
  const end = () => { state.dragging = false; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', e => {
    wake(30);
    if (e.key === 'ArrowLeft') state.yaw -= .2; if (e.key === 'ArrowRight') state.yaw += .2;
    if (e.key === 'ArrowUp') state.pitch = Math.max(-.5, state.pitch - .1); if (e.key === 'ArrowDown') state.pitch = Math.min(.7, state.pitch + .1);
  });

  /* ---------- adaptive quality / load balancing ---------- */
  const maxDPR = Math.min(window.devicePixelRatio || 1, 2);
  let dpr = lowPower ? .75 : Math.min(maxDPR, 1.5), frames = 0, acc = 0, visible = true, running = true;
  function resize() {
    const r = canvas.getBoundingClientRect(); const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 0.9 ? 3.3 : 2.5;   // centred in the 3D dialog
    camera.updateProjectionMatrix();
    bgUni.uRes.value.set(w * dpr, h * dpr);
  }
  new ResizeObserver(resize).observe(canvas);
  let started = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && started) tick(); }, { threshold: 0.01 }).observe(canvas);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running && started) tick(); });

  const clock = new THREE.Clock(); let raf = 0;
  function tick() {
    cancelAnimationFrame(raf);
    if (!visible || !running || !started) return;
    if (lowPower) { if (budget-- <= 0) return; }
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    // frame-time governor
    acc += dt; frames++;
    if (frames === 45 && !lowPower) {
      const ms = acc / frames * 1000;
      if (ms > 24 && dpr > .75) { dpr = Math.max(.75, dpr - .25); resize(); }
      else if (ms < 13 && dpr < maxDPR) { dpr = Math.min(maxDPR, dpr + .25); resize(); }
      frames = 0; acc = 0;
    }
    if (!reduceMotion) { bgUni.uTime.value = t; cellUni.uTime.value = t; }
    if (state.auto) state.yaw = state.base + Math.sin(t * .45) * .6;      // gentle sway keeps the label readable
    else if (!state.dragging) { state.yaw += state.vyaw *= .94; }
    state.xray += (state.xrayTarget - state.xray) * Math.min(1, dt * 5);
    cellUni.uXray.value = state.xray; cellUni.uCharge.value += (state.charge - cellUni.uCharge.value) * Math.min(1, dt * 6);
    bgUni.uCharge.value = cellUni.uCharge.value;
    if (current) {
      const u = current.userData; const a = 1 - state.xray * .86;
      u.cells.visible = state.xray > .02;
      u.bus.opacity = state.xray; u.bms.material.opacity = state.xray;
      current.traverse(o => { if (o.material && o.material !== cellMat && o.material !== u.bus && o.material !== u.bms.material) { o.material.opacity = a; o.material.depthWrite = a > .9; } });
      state.pop = Math.min(1, (state.pop || 0) + dt * 2.5);
      const e = 1 - Math.pow(1 - state.pop, 3);
      pivot.rotation.y = state.yaw; pivot.rotation.x = state.pitch * .6;
      pivot.scale.setScalar(.9 + .1 * e);
      pivot.position.y = Math.sin(t * 1.2) * .01 * (reduceMotion ? 0 : 1);
    }
    renderer.clear(); renderer.render(bgScene, bgCam); renderer.clearDepth(); renderer.render(scene, camera);
  }

  resize();
  return {
    // compile shaders off the main thread where the GPU supports it, then start the loop
    async start(id) {
      setModel(id);
      await new Promise(r => requestAnimationFrame(r));
      try { await renderer.compileAsync(bgScene, bgCam); await renderer.compileAsync(scene, camera); } catch { }
      started = true; tick();
    },
    setModel,
    setXray(on) { state.xrayTarget = on ? 1 : 0; wake(); },
    setCharge(v) { state.charge = v; wake(40); },
    get modelId() { return currentId; }
  };
}
