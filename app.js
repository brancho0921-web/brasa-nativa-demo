const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const money = (n) => `$${n}`;

// Menú del teléfono
const menuBtn = $('#menu-btn'), nav = $('#nav');
const closeMenu = () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menú'; };
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Cerrar' : 'Menú';
});
$$('a', nav).forEach((a) => a.addEventListener('click', closeMenu));

// Abierto ahora: martes a domingo de 12:00 a 23:00, hora de Venezuela
(function status() {
  const el = $('#status');
  const parts = new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
  const day = parts.find((p) => p.type === 'weekday').value.toLowerCase();
  const hour = +parts.find((p) => p.type === 'hour').value;
  const open = !day.startsWith('lun') && hour >= 12 && hour < 23;
  el.classList.add(open ? 'is-open' : 'is-closed');
  $('b', el).textContent = open ? 'Abierto ahora' : 'Cerrado ahora';
})();

// Pestañas de la carta
const tabs = $$('[role=tab]');
function selectTab(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $('#' + t.getAttribute('aria-controls')).hidden = !on;
  });
  const plates = $('.plates', $('#' + tab.getAttribute('aria-controls')));
  plates.scrollLeft = 0;
  requestAnimationFrame(() => shape(plates));
  document.dispatchEvent(new CustomEvent('carta:tab', { detail: plates }));
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', (e) => {
    const n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!n) return;
    const next = tabs[(i + n + tabs.length) % tabs.length];
    next.focus(); selectTab(next);
  });
});
// El índice de la carta abre la sección y baja a los platos
$$('.index button').forEach((b) => b.addEventListener('click', () => {
  selectTab($('#tab-' + b.dataset.go));
  document.dispatchEvent(new CustomEvent('carta:go', { detail: $('#menu') }));
}));

// Platos flotando: el del centro crece, los de los lados se alejan
function shape(plates) {
  const mid = plates.getBoundingClientRect().left + plates.clientWidth / 2;
  $$('.dish', plates).forEach((d) => {
    const r = d.getBoundingClientRect();
    const off = (r.left + r.width / 2 - mid) / plates.clientWidth;
    const k = Math.min(1, Math.abs(off) * 1.6);
    d.style.setProperty('--s', (1 - k * 0.28).toFixed(3));
    d.style.setProperty('--ry', `${(off * 10).toFixed(2)}deg`);
    d.style.opacity = (1 - k * 0.45).toFixed(3);
  });
  const bar = $('.menu-progress span');
  if (!plates.closest('[hidden]')) bar.style.transform = `scaleX(${plates.scrollLeft / Math.max(1, plates.scrollWidth - plates.clientWidth) || 0})`;
}
$$('.plates').forEach((plates) => {
  $$('.dish', plates).forEach((d, i) => d.style.setProperty('--d', `${-i * 1.3}s`));
  let raf = 0;
  plates.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; shape(plates); }); }, { passive: true });
  shape(plates);
  // con el mouse también se arrastra, con inercia
  if (!finePointer) return;
  let down = false, moved = 0, x0 = 0, s0 = 0, vx = 0, lastX = 0, lastT = 0;
  plates.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = 0; x0 = lastX = e.clientX; s0 = plates.scrollLeft; lastT = performance.now(); vx = 0;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - x0;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 4) plates.classList.add('is-dragging');
    plates.scrollLeft = s0 - dx;
    const t = performance.now();
    vx = (e.clientX - lastX) / Math.max(1, t - lastT); lastX = e.clientX; lastT = t;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    let v = -vx * 16;
    const glide = () => {
      plates.scrollLeft += v; v *= 0.92;
      if (Math.abs(v) > 0.5) requestAnimationFrame(glide);
      else plates.classList.remove('is-dragging');
    };
    requestAnimationFrame(glide);
  });
  // un arrastre no cuenta como toque sobre el plato
  plates.addEventListener('click', (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); } }, true);
});
addEventListener('resize', () => $$('.plates').forEach(shape));

// Pedido
const items = new Map(); // id → { name, price, qty }
const dishes = Object.fromEntries($$('.dish').map((d) => [d.dataset.id, { name: $('.dish-name', d).textContent, price: +d.dataset.price, desc: d.dataset.desc, img: $('img', d).getAttribute('src'), alt: $('img', d).alt }]));
function renderOrder() {
  const list = $('#order');
  list.innerHTML = '';
  let total = 0, count = 0;
  items.forEach((it, id) => {
    total += it.price * it.qty; count += it.qty;
    const li = document.createElement('li');
    li.innerHTML = `<span>${it.qty} × ${it.name}</span><span class="mini"><button type="button" aria-label="Quitar uno de ${it.name}" data-d="-1">−</button><button type="button" aria-label="Agregar uno de ${it.name}" data-d="1">+</button></span><span class="sub">${money(it.price * it.qty)}</span>`;
    $$('button', li).forEach((b) => b.addEventListener('click', () => { it.qty += +b.dataset.d; if (it.qty <= 0) items.delete(id); renderOrder(); }));
    list.append(li);
  });
  $('#order-empty').hidden = items.size > 0;
  document.dispatchEvent(new CustomEvent('pedido:total', { detail: { total } }));
  if (reduce || !window.gsap) $('#order-total').textContent = money(total);
  $('#dock-total').textContent = count ? `Tu pedido · ${money(total)}` : 'Tu pedido';
  $('#dock-count').textContent = count ? `${count} ${count === 1 ? 'plato' : 'platos'}` : 'Vacío';
  updateOrderLink(total);
}
function updateOrderLink(total) {
  const modo = $('input[name=modo]:checked').value, nombre = $('#o-nombre').value.trim(), dir = $('#o-dir').value.trim();
  const lines = [...items.values()].map((it) => `• ${it.qty} × ${it.name} (${money(it.price * it.qty)})`);
  let msg = `Hola Ceniza${nombre ? ', soy ' + nombre : ''}. Quiero hacer un pedido ${modo === 'delivery' ? 'a domicilio' : 'para llevar'}`;
  msg += lines.length ? `:\n${lines.join('\n')}\nTotal: ${money(total)}` : '.';
  if (modo === 'delivery' && dir) msg += `\nDirección: ${dir}`;
  $('#send-order').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
}
$$('input[name=modo]').forEach((r) => r.addEventListener('change', () => { $('#o-dir').hidden = $('input[name=modo]:checked').value !== 'delivery'; renderOrder(); }));
$$('#o-nombre, #o-dir').forEach((el) => el.addEventListener('input', renderOrder));

// Ficha del plato
const sheet = $('#sheet');
let current = null, qty = 1;
const sheetTotal = () => { $('#qty').textContent = qty; $('#add-total').textContent = money(dishes[current].price * qty); };
function openSheet(id, from) {
  current = id; qty = 1;
  const d = dishes[id];
  $('#sheet-img').src = d.img; $('#sheet-img').alt = d.alt;
  $('#sheet-name').textContent = d.name; $('#sheet-desc').textContent = d.desc;
  sheetTotal();
  sheet.showModal();
  document.dispatchEvent(new CustomEvent('ficha:open', { detail: { from, to: $('#sheet-img') } }));
}
$$('.dish').forEach((d) => d.addEventListener('click', () => openSheet(d.dataset.id, $('img', d))));
$('#qty-minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); sheetTotal(); });
$('#qty-plus').addEventListener('click', () => { qty = Math.min(20, qty + 1); sheetTotal(); });
$('#add').addEventListener('click', () => {
  const d = dishes[current], it = items.get(current) || { name: d.name, price: d.price, qty: 0 };
  it.qty += qty; items.set(current, it);
  renderOrder();
  sheet.close();
});
sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });
renderOrder();

// Reserva
let people = 2;
const dia = $('#r-dia');
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dia.min = today; dia.value = today;
function updateRes() {
  $('#people').textContent = people;
  const nombre = $('#r-nombre').value.trim();
  const fecha = dia.value ? new Date(dia.value + 'T12:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' }) : 'el día que me indiquen';
  const msg = `Hola Ceniza${nombre ? ', soy ' + nombre : ''}. Quiero reservar una mesa para ${people} ${people === 1 ? 'persona' : 'personas'} el ${fecha} a las ${$('#r-hora').value}.`;
  $('#send-res').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
}
$('#p-minus').addEventListener('click', () => { people = Math.max(1, people - 1); updateRes(); });
$('#p-plus').addEventListener('click', () => { people = Math.min(20, people + 1); updateRes(); });
$$('#r-dia, #r-hora, #r-nombre').forEach((el) => el.addEventListener('input', updateRes));
updateRes();

// La barra del teléfono se esconde en la portada, en el pedido y en el pie
const dock = $('#dock'), hideFor = new Set();
const io = new IntersectionObserver((es) => {
  es.forEach((e) => (e.isIntersecting ? hideFor.add(e.target) : hideFor.delete(e.target)));
  dock.classList.toggle('away', hideFor.size > 0);
});
['#inicio', '#pedir', '.footer'].forEach((s) => io.observe($(s)));

// Botones magnéticos
if (!reduce && finePointer) {
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}
