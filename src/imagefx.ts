/* ImageFX — one shared WebGL canvas that floats over whichever photo the pointer is on.
   Shader: lens bulge toward the pointer, RGB split at the edges, and a lime "charge" scan line
   that sweeps up the image. Raw WebGL (no library), ~1 draw call per frame, only while hovering. */

const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; uv.y = 1. - uv.y; gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `precision mediump float;
varying vec2 uv; uniform sampler2D tex; uniform vec2 mouse; uniform float t, amt, aspect; uniform vec2 cover;
vec2 fit(vec2 u){ return (u - .5) * cover + .5; }              // object-fit: cover
void main(){
  vec2 d = uv - mouse; d.x *= aspect; float r = length(d);
  float bulge = amt * .06 * exp(-r * r * 9.);
  vec2 u = uv - normalize(d + 1e-5) * bulge / vec2(aspect, 1.);
  u = (u - .5) * (1. - .035 * amt) + .5;                         // gentle zoom
  float split = amt * .004 * (.4 + r);
  vec3 c = vec3(texture2D(tex, fit(u + vec2(split, 0.))).r, texture2D(tex, fit(u)).g, texture2D(tex, fit(u - vec2(split, 0.))).b);
  float scan = smoothstep(.035, 0., abs(uv.y - (1. - fract(t * .35)))) * amt;
  c += vec3(.61, .85, .15) * scan * .35;
  c += vec3(1.) * .06 * amt * exp(-r * r * 6.);                 // soft highlight under the pointer
  gl_FragColor = vec4(c, texture2D(tex, fit(u)).a);
}`;

export function initImageFX(selector: string): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'fixed', pointerEvents: 'none', zIndex: '5', opacity: '0', transition: 'opacity .25s', borderRadius: 'inherit' });
  document.body.appendChild(cv);
  const gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
  if (!gl) return;
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uMouse = U('mouse'), uT = U('t'), uAmt = U('amt'), uAsp = U('aspect'), uCover = U('cover');
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  let target: HTMLImageElement | null = null, amt = 0, goal = 0, raf = 0;
  const mouse = { x: .5, y: .5 }, t0 = performance.now();

  const place = () => {
    if (!target) return;
    const r = target.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
    Object.assign(cv.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: getComputedStyle(target).borderRadius });
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    gl.viewport(0, 0, cv.width, cv.height);
    const ia = target.naturalWidth / target.naturalHeight, ba = r.width / r.height;
    gl.uniform2f(uCover, ba > ia ? 1 : ia > 0 ? ba / ia : 1, ba > ia ? ia / ba : 1);
    gl.uniform1f(uAsp, ba);
  };
  const frame = () => {
    amt += (goal - amt) * .12;
    gl.uniform2f(uMouse, mouse.x, mouse.y); gl.uniform1f(uAmt, amt); gl.uniform1f(uT, (performance.now() - t0) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (goal === 0 && amt < .01) { cv.style.opacity = '0'; target = null; return; }
    raf = requestAnimationFrame(frame);
  };
  const enter = (img: HTMLImageElement) => {
    if (!img.complete || !img.naturalWidth) return;
    target = img;
    try { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); } catch { target = null; return; }
    place(); goal = 1; cv.style.opacity = '1'; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  };
  document.addEventListener('pointerover', e => {
    const img = (e.target as Element).closest?.(selector)?.querySelector('img') as HTMLImageElement | null
      ?? ((e.target as Element).matches?.(selector + ' img') ? e.target as HTMLImageElement : null);
    if (img && img !== target) enter(img);
  });
  document.addEventListener('pointermove', e => {
    if (!target) return;
    const r = target.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) { goal = 0; return; }
    goal = 1; mouse.x = (e.clientX - r.left) / r.width; mouse.y = (e.clientY - r.top) / r.height;
  }, { passive: true });
  addEventListener('scroll', () => { if (target) place(); }, { passive: true });
  addEventListener('resize', () => { if (target) place(); });
}
