// Brasas en WebGL y capa de movimiento. Sin WebGL, sin GSAP o con movimiento reducido no corre nada:
// la carta queda abierta, las fotos quietas y todo el contenido visible.
import * as THREE from 'three';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const { gsap, ScrollTrigger, Lenis } = window;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const phone = () => innerWidth <= 900;

if (!reduce && gsap && ScrollTrigger) start();

function start() {
  gsap.registerPlugin(ScrollTrigger);
  const ease = 'expo.out';
  if (finePointer) document.documentElement.classList.add('has-heat');

  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { duration: 1.4 }); }
    }));
  }
  const goTo = (el) => (lenis ? lenis.scrollTo(el, { duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' }));

  // Parte un texto en palabras con máscara y letras; el lector de pantalla recibe el texto entero
  function split(el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    [...el.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const w = document.createElement('span');
        w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        [...part].forEach((c) => { const ch = document.createElement('span'); ch.className = 'ch'; ch.textContent = c; w.append(ch); });
        frag.append(w);
      });
      n.replaceWith(frag);
    });
    return $$('.ch', el);
  }
  const enter = (targets, trigger, vars = {}) => gsap.from(targets, { y: 30, opacity: 0, duration: 0.9, ease, stagger: 0.06, immediateRender: false, ...vars, scrollTrigger: { trigger, start: 'top bottom', once: true } });

  // ---------- Ceniza que se quema: revela un elemento con un borde de brasa ----------
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.setAttribute('aria-hidden', 'true');
  defs.style.position = 'absolute';
  document.body.append(defs);
  let burnId = 0;
  function burn(el, { freq = 0.02, duration = 1.6, delay = 0 } = {}) {
    const id = 'burn' + burnId++;
    defs.insertAdjacentHTML('beforeend', `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${burnId * 7}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6 0 0 0 -5.2" result="a"/>
      <feComposite in="SourceGraphic" in2="a" operator="in" result="shown"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6 0 0 0 -4.8" result="a2"/>
      <feComposite in="a2" in2="a" operator="out" result="edge"/>
      <feComposite in="edge" in2="SourceAlpha" operator="in" result="rim"/>
      <feFlood flood-color="#ff7a2a"/>
      <feComposite in2="rim" operator="in" result="glow"/>
      <feGaussianBlur in="glow" stdDeviation="2.5" result="soft"/>
      <feMerge><feMergeNode in="soft"/><feMergeNode in="glow"/><feMergeNode in="shown"/></feMerge>
    </filter>`);
    const f = defs.lastElementChild, [m1, m2] = $$('feColorMatrix', f);
    const state = { b: -5.2 };
    el.style.filter = `url(#${id})`;
    return gsap.to(state, { b: 0.4, duration, delay, ease: 'power1.inOut',
      onUpdate: () => {
        m1.setAttribute('values', `0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6 0 0 0 ${state.b}`);
        m2.setAttribute('values', `0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6 0 0 0 ${state.b + 0.45}`);
      },
      onComplete: () => { el.style.filter = ''; f.remove(); },
    });
  }
  const burnOnEnter = (el, vars) => ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => burn(el, vars) });

  // ---------- Portada ----------
  const embers = buildEmbers();
  const titleChars = split($('.hero-title'));
  gsap.timeline({ defaults: { ease } })
    .from(titleChars, { yPercent: 110, duration: 1.2, stagger: 0.06 }, 0.1)
    .from(['.kicker', '.hero-lead', '.hero-actions', '.hero-facts'], { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, 0.5)
    .from('.hero-glow', { opacity: 0, duration: 2 }, 0);
  if (embers) gsap.from(embers.uniforms.uIntensity, { value: 0, duration: 2.5, ease: 'power2.out' });
  // al bajar, el título se aleja y el fuego baja
  gsap.to('.hero-body', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // ---------- Del fogón a la mesa ----------
  const fogon = $('.fogon'), steps = $$('.fstep'), shots = $$('.fshot');
  document.documentElement.classList.add('is-pinned-fogon');
  const words = steps.map((s) => split($('.fstep-word', s)));
  steps.forEach((s, i) => { if (i) gsap.set(s, { autoAlpha: 0 }); });
  shots.forEach((s, i) => gsap.set(s, { zIndex: i ? 0 : 1, autoAlpha: i ? 0 : 1 }));
  let cur = 0, z = 2;
  function showStep(i) {
    if (i === cur) return;
    const prev = cur; cur = i;
    gsap.to(steps[prev], { autoAlpha: 0, y: i > prev ? -30 : 30, duration: 0.4, ease: 'power2.in', overwrite: true });
    gsap.fromTo(steps[i], { autoAlpha: 1, y: 0 }, { autoAlpha: 1, y: 0, duration: 0.01, overwrite: true });
    gsap.fromTo(words[i], { yPercent: i > prev ? 110 : -110 }, { yPercent: 0, duration: 0.9, ease, stagger: 0.03, delay: 0.15, overwrite: true });
    gsap.fromTo($$('.fstep-num, .fstep-text', steps[i]), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease, delay: 0.3, stagger: 0.05, overwrite: true });
    // la foto nueva aparece quemando la anterior
    gsap.set(shots[i], { zIndex: z++, autoAlpha: 1 });
    gsap.fromTo($('img', shots[i]), { scale: 1.12 }, { scale: 1, duration: 1.8, ease });
    burn(shots[i], { freq: 0.012, duration: 1.2 });
  }
  ScrollTrigger.create({
    trigger: fogon, start: 'top top', end: () => '+=' + innerHeight * 1.8, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: (self) => showStep(self.progress < 0.34 ? 0 : self.progress < 0.68 ? 1 : 2),
  });
  gsap.from('.fogon .eyebrow', { y: 20, opacity: 0, duration: 0.8, ease, scrollTrigger: { trigger: fogon, start: 'top 70%', once: true } });

  // ---------- La carta: la tapa se abre con el scroll ----------
  const book = $('#book'), cover = $('.cover');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    gsap.set(cover, { rotationY: 0 });
    gsap.set(book, { xPercent: -25, rotationX: 10 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.carta', start: 'top top', end: () => '+=' + innerHeight * 1.6, pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true } });
    tl.to(cover, { rotationY: -180, duration: 1, ease: 'power2.inOut' }, 0)
      .to(book, { xPercent: 0, rotationX: 0, duration: 1, ease: 'power2.inOut' }, 0)
      .fromTo('.index li', { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.12, duration: 0.5 }, 0.55)
      .to(book, { scale: 1.04, duration: 0.5 }, 1);
    return () => gsap.set([cover, book, ...$$('.index li')], { clearProps: 'all' });
  });
  mm.add('(max-width: 900px)', () => {
    gsap.set(cover, { rotationY: 0, opacity: 1 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.carta', start: 'top top', end: () => '+=' + innerHeight * 1.2, pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true } });
    tl.to(cover, { rotationY: -120, duration: 1, ease: 'power2.in' }, 0)
      .to(cover, { opacity: 0, duration: 0.3 }, 0.7)
      .fromTo('.index li', { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.12, duration: 0.5 }, 0.6);
    return () => gsap.set([cover, ...$$('.index li')], { clearProps: 'all' });
  });
  gsap.from('.carta .eyebrow', { y: 20, opacity: 0, duration: 0.8, ease, scrollTrigger: { trigger: '.carta', start: 'top 70%', once: true } });
  document.addEventListener('carta:go', (e) => goTo(e.detail));

  // ---------- Platos: entran flotando desde abajo ----------
  burnOnEnter($('.menu-head h2'), { freq: 0.03 });
  enter('.menu-head p', '.menu-head');
  enter('.tabs', '.tabs', { y: 20 });
  const platesIn = (plates) => gsap.from($$('.dish', plates), { y: 120, opacity: 0, rotate: () => gsap.utils.random(-8, 8), duration: 1.2, ease, stagger: 0.08 });
  ScrollTrigger.create({ trigger: '.panel:not([hidden]) .plates', start: 'top 85%', once: true, onEnter: () => platesIn($('.panel:not([hidden]) .plates')) });
  document.addEventListener('carta:tab', (e) => platesIn(e.detail));

  // La ficha se abre con el plato redondo que se vuelve cuadrado.
  // GSAP mide la ficha la primera vez que la anima; si lo hace abierta (position fixed, sin offsetParent)
  // la saca y la reinserta en el DOM y el <dialog> pierde la capa superior. Se mide aquí, cerrada.
  gsap.set('#sheet', { y: 0, scale: 1 });
  document.addEventListener('ficha:open', (e) => {
    gsap.fromTo('#sheet', { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease });
    gsap.fromTo(e.detail.to, { clipPath: 'circle(32% at 50% 50%)', scale: 1.08, rotate: -6 }, { clipPath: 'circle(75% at 50% 50%)', scale: 1, rotate: 0, duration: 0.9, ease, delay: 0.05 });
    gsap.fromTo($$('.sheet-body > *'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease, stagger: 0.06, delay: 0.15, overwrite: true });
  });

  // ---------- Pedido ----------
  burnOnEnter($('.pedir-head h2'), { freq: 0.03 });
  enter('.pedir-head p', '.pedir-head');
  enter($$('.pedir .box'), '.pedir-grid', { y: 60, duration: 1.1, stagger: 0.12 });
  const totalEl = $('#order-total'), tally = { v: 0 };
  document.addEventListener('pedido:total', (e) => gsap.to(tally, { v: e.detail.total, duration: 0.6, ease: 'power3.out', onUpdate: () => (totalEl.textContent = `$${Math.round(tally.v)}`) }));

  // ---------- Pie: el nombre gigante se enciende de abajo hacia arriba ----------
  burnOnEnter($('.footer-word'), { freq: 0.008, duration: 2 });

  addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
}

// ---------- Brasas: chispas que suben del fogón y se apartan del cursor ----------
function buildEmbers() {
  const canvas = $('.embers'), hero = $('.hero');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); }
  catch { return null; }
  if (!renderer.getContext()) return null;
  const pr = Math.min(devicePixelRatio || 1, phone() ? 1.25 : 1.75);
  renderer.setPixelRatio(pr);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 10;

  const count = phone() ? 180 : 520;
  const pos = new Float32Array(count * 3), seed = new Float32Array(count), speed = new Float32Array(count), size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() * 2 - 1); // se escala al ancho visible en el shader
    pos[i * 3 + 2] = Math.random() * 6 - 3;
    seed[i] = Math.random(); speed[i] = 0.6 + Math.random() * 1.4; size[i] = 3 + Math.random() * 11;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const uniforms = { uTime: { value: 0 }, uH: { value: 10 }, uW: { value: 10 }, uPR: { value: pr }, uMouse: { value: new THREE.Vector2(99, 99) }, uIntensity: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uH, uW, uPR; uniform vec2 uMouse;
      attribute float aSeed, aSpeed, aSize;
      varying float vLife; varying float vSeed;
      void main() {
        float travel = mod(uTime * aSpeed + aSeed * uH, uH);
        vLife = travel / uH;
        vec3 p = position;
        p.x *= uW * 0.55;
        p.y = -uH * 0.5 + travel;
        p.x += sin(uTime * 0.6 + aSeed * 12.0) * 0.45 * vLife + sin(uTime * 1.7 + aSeed * 30.0) * 0.06;
        vec2 d = p.xy - uMouse;
        float f = exp(-dot(d, d) * 0.5);
        p.xy += normalize(d + vec2(0.0001)) * f * 1.1;
        p.y += f * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPR * (1.0 - vLife * 0.7) * (10.0 / -mv.z);
        vSeed = aSeed;
      }`,
    fragmentShader: `
      uniform float uTime, uIntensity;
      varying float vLife; varying float vSeed;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = pow(smoothstep(0.5, 0.0, d), 1.6);
        float flicker = 0.7 + 0.3 * sin(uTime * 12.0 + vSeed * 50.0);
        vec3 col = mix(vec3(1.0, 0.86, 0.55), vec3(1.0, 0.42, 0.12), smoothstep(0.0, 0.35, vLife));
        col = mix(col, vec3(0.55, 0.1, 0.03), smoothstep(0.5, 1.0, vLife));
        float fade = smoothstep(0.0, 0.06, vLife) * (1.0 - smoothstep(0.65, 1.0, vLife));
        gl_FragColor = vec4(col, a * fade * flicker * uIntensity);
      }`,
  });
  scene.add(new THREE.Points(geo, mat));

  let w = 0, h = 0;
  function resize() {
    w = hero.clientWidth; h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(25)) * 10;
    uniforms.uH.value = vh + 1.5; uniforms.uW.value = vh * camera.aspect;
  }
  resize();
  addEventListener('resize', resize);

  // el cursor aviva y aparta las chispas
  const target = new THREE.Vector2(99, 99);
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const vh = uniforms.uH.value - 1.5;
    target.set(((e.clientX - r.left) / r.width - 0.5) * vh * camera.aspect, -((e.clientY - r.top) / r.height - 0.5) * vh);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => target.set(99, 99));

  let onScreen = true;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(hero);
  const clock = new THREE.Clock();
  gsap.ticker.add(() => {
    if (!onScreen || document.hidden) return;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(target, 0.08);
    renderer.render(scene, camera);
  });
  return { uniforms };
}
