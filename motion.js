// Capa de movimiento. Sin GSAP o con movimiento reducido no corre nada y la página queda quieta y completa.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frameNext = () => window.showFrame && window.showFrame(([...document.querySelectorAll('[data-frame] img')].findIndex((i) => i.classList.contains('is-on')) + 1) || 1);
  if (!reduce) setInterval(() => { if (!document.hidden) frameNext(); }, 2600);
  if (reduce || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ease = 'expo.out';
  const wide = matchMedia('(min-width: 761px)').matches;

  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { duration: 1.4 }); }
    }));
  }

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
  // Entra una vez al aparecer; si el disparador nunca llega, el contenido sigue visible
  const enter = (targets, trigger, vars = {}) => gsap.from(targets, { y: 28, opacity: 0, duration: 0.9, ease, stagger: 0.05, immediateRender: false, ...vars, scrollTrigger: { trigger, start: 'top bottom', once: true } });

  // Portada: el fuego sube desde abajo, el nombre sale de la brasa
  const markChars = split($('.wordmark'));
  const titleChars = split($('.hero-title'));
  gsap.timeline({ defaults: { ease } })
    .from('.stage-frame', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
    .from('.shot.is-active .shot-media', { scale: 1.25, duration: 2.2 }, 0.2)
    .from(markChars, { yPercent: 110, duration: 1.3, stagger: 0.035 }, 0.7)
    .from(titleChars, { yPercent: 110, duration: 1, stagger: 0.01 }, 0.9)
    .from(['.hero-lead', '.links'], { y: 20, opacity: 0, duration: 0.9, stagger: 0.1 }, 1.2);
  gsap.to('.wordmark', { scale: 0.94, yPercent: -18, transformOrigin: '100% 100%', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // El escenario cambia con cada sección: la foto nueva sube como una llama
  if (wide) {
    const scenes = Object.fromEntries($$('.shot').map((s) => [s.dataset.shot, s]));
    let current = 'fuego', z = 1;
    $$('.shot').forEach((s) => gsap.set(s, { opacity: 1, clipPath: s.dataset.shot === 'fuego' ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)' }));
    function show(name) {
      if (name === current || !scenes[name]) return;
      const s = scenes[name];
      current = name;
      gsap.set(s, { zIndex: ++z });
      gsap.fromTo(s, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut', overwrite: true });
      gsap.fromTo($('.shot-media', s), { scale: 1.22, yPercent: 6 }, { scale: 1.04, yPercent: 0, duration: 1.8, ease, overwrite: true });
    }
    $$('[data-for]').forEach((sec) => ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) show(sec.dataset.for); },
    }));
  }

  // Chispas de leña sobre el escenario
  const canvas = $('.sparks');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const resize = () => { W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); addEventListener('resize', resize);
  const sparks = Array.from({ length: wide ? 46 : 22 }, () => ({}));
  const spawn = (p, fresh) => { p.x = Math.random() * W; p.y = fresh ? H + Math.random() * 40 : Math.random() * H; p.r = 0.6 + Math.random() * 1.6; p.vy = 0.35 + Math.random() * 1.1; p.vx = (Math.random() - 0.5) * 0.4; p.life = 0.5 + Math.random() * 0.5; p.t = Math.random() * 6; };
  sparks.forEach((p) => spawn(p, false));
  let stageVisible = true;
  new IntersectionObserver(([e]) => { stageVisible = e.isIntersecting; }).observe(canvas);
  gsap.ticker.add(() => {
    if (!stageVisible || document.hidden) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of sparks) {
      p.t += 0.03; p.y -= p.vy; p.x += p.vx + Math.sin(p.t) * 0.35;
      const fade = Math.max(0, Math.min(1, p.y / H)) * p.life;
      if (p.y < -10) spawn(p, true);
      ctx.fillStyle = `rgba(255, ${150 + Math.floor(p.r * 40)}, 60, ${fade})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  });

  // Entradas de cada sección
  enter($$('.intro p'), '.intro', { stagger: 0.09 });
  ['.carta h2', '.showcase h2', '.frame-section h2', '.reserva h2'].forEach((sel) => {
    const chars = split($(sel));
    gsap.from(chars, { yPercent: 110, duration: 1, ease, stagger: 0.025, immediateRender: false, scrollTrigger: { trigger: sel, start: 'top bottom', once: true } });
  });
  enter('.carta-hint', '.carta-hint');
  $$('.carta .dishes').forEach((list) => enter([list.previousElementSibling, ...$$('li', list)], list, { stagger: 0.045, y: 22 }));
  gsap.from('.plate img', { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.2, duration: 1.4, ease: 'expo.inOut', immediateRender: false, scrollTrigger: { trigger: '.plate', start: 'top bottom', once: true } });
  enter(['.sizes', '.plate-desc', '.plate-actions'], '.plate-copy', { stagger: 0.1 });
  enter('.frame', '.frame', { y: 60, duration: 1.2 });
  enter($$('.reserva .field-row, .reserva .order, .reserva .btn'), '.reserva', { stagger: 0.06 });

  // El total cuenta hasta el número nuevo
  const totalEl = $('[data-order-total]');
  const tally = { v: 0 };
  document.addEventListener('mesa:update', (e) => {
    gsap.to(tally, { v: e.detail.total, duration: 0.6, ease: 'power3.out', onUpdate: () => { totalEl.textContent = `$${Math.round(tally.v)}`; } });
  });

  const reserveChars = split($('.contact h2 a'));
  gsap.from(reserveChars, { yPercent: 110, rotation: 4, duration: 1.2, ease, stagger: 0.03, immediateRender: false, scrollTrigger: { trigger: '.contact h2', start: 'top bottom', once: true } });
  enter(['.contact-lead', '.contact-foot'], '.contact', { stagger: 0.15 });
  gsap.fromTo('.footer-photo img', { scale: 1.25, yPercent: -8 }, { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  enter($$('.footer-menu nav a'), '.footer-menu', { stagger: 0.07, y: 40 });

  addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
