const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Tu mesa: platos marcados, personas, día y hora, y el mensaje de WhatsApp
const state = { personas: 2, items: new Map() };
const orderList = $('[data-order-list]');
const orderEmpty = $('[data-order-empty]');
const orderTotal = $('[data-order-total]');
const send = $('[data-send]');
const tray = $('[data-tray]');
const trayTotal = $('[data-tray-total]');
const trayCount = $('[data-tray-count]');
const personasOut = $('[data-personas]');

function update() {
  const items = [...state.items.entries()];
  const total = items.reduce((sum, [, price]) => sum + price, 0);
  orderList.innerHTML = items.map(([name, price]) => `<li><span>${name}</span><span>$${price}</span></li>`).join('');
  orderEmpty.hidden = items.length > 0;
  orderTotal.textContent = `$${total}`;
  trayTotal.textContent = `$${total}`;
  trayCount.textContent = items.length === 1 ? '1 plato' : `${items.length} platos`;
  personasOut.textContent = state.personas;
  tray.classList.toggle('is-shown', items.length > 0 && !trayHidden);

  const dia = $('input[name=dia]:checked').value;
  const hora = $('#hora').value;
  const nombre = $('#nombre').value.trim();
  let msg = `Hola Brasa Nativa${nombre ? ', soy ' + nombre : ''}. Quiero reservar una mesa para ${state.personas} el ${dia} a las ${hora}.`;
  if (items.length) msg += ` Queremos adelantar: ${items.map(([n]) => n).join(', ')} (total $${total}).`;
  send.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
  document.dispatchEvent(new CustomEvent('mesa:update', { detail: { total } }));
}

$$('.dish').forEach((dish) => dish.addEventListener('click', () => {
  const on = dish.getAttribute('aria-pressed') !== 'true';
  dish.setAttribute('aria-pressed', String(on));
  if (on) state.items.set(dish.dataset.name, Number(dish.dataset.price));
  else state.items.delete(dish.dataset.name);
  update();
}));

$$('[data-step]').forEach((b) => b.addEventListener('click', () => {
  state.personas = Math.min(20, Math.max(1, state.personas + Number(b.dataset.step)));
  update();
}));
$$('input[name=dia], #hora').forEach((el) => el.addEventListener('change', update));
$('#nombre').addEventListener('input', update);

// Mesa del fuego: para 2, 4 o 6
const sizes = $$('[data-size]');
const platePrice = $('[data-plate-price]');
let plate = { size: 2, price: 34 };
sizes.forEach((b) => b.addEventListener('click', () => {
  sizes.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  plate = { size: Number(b.dataset.size), price: Number(b.dataset.price) };
  platePrice.textContent = `$${plate.price} para ${plate.size} personas`;
}));
const addPlate = $('[data-add-plate]');
addPlate.addEventListener('click', () => {
  [...state.items.keys()].filter((k) => k.startsWith('Mesa del fuego')).forEach((k) => state.items.delete(k));
  state.items.set(`Mesa del fuego para ${plate.size}`, plate.price);
  state.personas = Math.max(state.personas, plate.size);
  addPlate.textContent = 'En tu mesa';
  setTimeout(() => { addPlate.textContent = 'Sumar a mi mesa'; }, 1600);
  update();
});

// La bandeja se esconde mientras la reserva está a la vista
var trayHidden = false;
new IntersectionObserver(([entry]) => { trayHidden = entry.isIntersecting; update(); }, { threshold: .15 }).observe($('#reserva'));

// Un marco, varias fotos: tocar avanza
const frame = $('[data-frame]');
const frameImgs = $$('img', frame);
const caption = $('[data-frame-caption]');
let frameIndex = 0;
function showFrame(i) {
  frameIndex = (i + frameImgs.length) % frameImgs.length;
  frameImgs.forEach((img, k) => { img.classList.toggle('is-on', k === frameIndex); img.classList.toggle('is-off', k !== frameIndex); });
  caption.textContent = frameImgs[frameIndex].dataset.caption;
}
window.showFrame = showFrame;
frame.addEventListener('click', () => showFrame(frameIndex + 1));
frame.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showFrame(frameIndex + 1); } });

const video = $('.shot video');
if (navigator.connection?.saveData || matchMedia('(prefers-reduced-motion: reduce)').matches) { video.removeAttribute('autoplay'); video.pause(); }

update();
