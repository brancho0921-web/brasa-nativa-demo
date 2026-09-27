const menu = {
  entradas: [
    ['Tiradito de ají amarillo', 'Pesca blanca, leche de tigre ahumada, maíz crocante.', '14'],
    ['Remolachas a la llama', 'Cítricos, queso fresco, semillas tostadas y hierbas.', '12'],
    ['Arepitas de maíz morado', 'Queso de cabra, chutney de piña y chile dulce.', '10'],
    ['Provoleta nativa', 'Tomates confitados, orégano fresco y pan de masa madre.', '13'],
  ],
  brasas: [
    ['Costilla de cocción lenta', 'Glaseado de tamarindo, yuca crujiente y ensalada fresca.', '26'],
    ['Picanha al quebracho', 'Papas aplastadas, chimichurri de la casa y ajos asados.', '29'],
    ['Pollo de campo', 'Marinado en achiote, maíz tierno y crema de aguacate.', '21'],
    ['Pesca del día', 'Hoja de plátano, coco, limón y vegetales de temporada.', '25'],
  ],
  especiales: [
    ['La Nativa', 'Doble carne, queso maduro, cebolla encurtida y salsa de brasas.', '17'],
    ['Arroz de la costa', 'Mariscos, sofrito criollo, coco tostado y limón.', '24'],
    ['Coliflor entera', 'Mole de semillas, yogur de hierbas y cebolla quemada.', '18'],
    ['Mesa del fuego', 'Selección del parrillero para compartir entre dos personas.', '46'],
  ],
  bebidas: [
    ['Sol de agave', 'Mezcal, piña asada, romero y bitter de cacao.', '11'],
    ['Selva alta', 'Ron añejo, café, cítricos y panela.', '10'],
    ['Tónica nativa', 'Guayaba, albahaca, limón y tónica artesanal. Sin alcohol.', '7'],
    ['Limonada de carbón', 'Limón, menta, miel y carbón activado. Sin alcohol.', '6'],
  ],
  postres: [
    ['Cacao & dulce de leche', 'Chocolate 70%, caramelo de leche y naranja tostada.', '9'],
    ['Piña a las brasas', 'Coco, ron especiado y helado de vainilla.', '8'],
    ['Tres leches de maíz', 'Bizcocho suave, canela y crema de elote.', '8'],
    ['Helados de temporada', 'Tres sabores de frutas latinoamericanas.', '7'],
  ],
};

const reviews = [
  { quote: '“Cada plato se siente cercano y sorprendente a la vez. El aroma de la brasa te acompaña desde que entras.”', name: 'Mariana R.', detail: 'Reseña ficticia · contenido de muestra' },
  { quote: '“Una cena cálida, sin pretensiones y con sabores que se quedan contigo. Volveríamos por la costilla.”', name: 'Diego & Ana', detail: 'Reseña ficticia · contenido de muestra' },
  { quote: '“La carta tiene identidad: buen producto, cócteles con intención y un espacio que invita a quedarse.”', name: 'Camila T.', detail: 'Reseña ficticia · contenido de muestra' },
];

const heroVideo = document.querySelector('.hero-video');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const saveData = navigator.connection?.saveData === true;
if (saveData || reducedMotion.matches) {
  heroVideo.pause();
  heroVideo.removeAttribute('autoplay');
}

const list = document.querySelector('[data-menu-list]');
const tabs = [...document.querySelectorAll('[data-category]')];
function renderMenu(category) {
  list.innerHTML = menu[category].map(([name, description, price]) => `
    <article class="menu-item"><h3>${name}</h3><p>${description}</p><strong>$${price}</strong></article>
  `).join('');
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
    renderMenu(tab.dataset.category);
  });
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus(); tabs[next].click();
  });
});
renderMenu('entradas');

let reviewIndex = 0;
const reviewStage = document.querySelector('[data-review-stage]');
function renderReview() {
  const review = reviews[reviewIndex];
  reviewStage.innerHTML = `<article class="review-quote"><span aria-hidden="true">“</span><blockquote><p>${review.quote}</p><cite>${review.name} <span>— ${review.detail}</span></cite></blockquote></article>`;
}
document.querySelector('[data-review-prev]').addEventListener('click', () => { reviewIndex = (reviewIndex - 1 + reviews.length) % reviews.length; renderReview(); });
document.querySelector('[data-review-next]').addEventListener('click', () => { reviewIndex = (reviewIndex + 1) % reviews.length; renderReview(); });
renderReview();

const modal = document.querySelector('[data-modal]');
const modalTitle = document.querySelector('[data-modal-title]');
const modalCopy = document.querySelector('[data-modal-copy]');
function openModal(type = 'reservation') {
  const isOrder = type === 'order';
  modalTitle.textContent = isOrder ? 'Haz tu pedido' : 'Reserva tu mesa';
  modalCopy.textContent = `En una web real, este botón abriría el WhatsApp oficial del restaurante con un mensaje listo para ${isOrder ? 'hacer el pedido' : 'reservar'}. Aquí no contactará a ningún tercero.`;
  modal.showModal();
}
document.querySelectorAll('[data-reservation]').forEach((button) => button.addEventListener('click', () => openModal()));
document.querySelectorAll('[data-order]').forEach((button) => button.addEventListener('click', () => openModal('order')));
document.querySelectorAll('[data-dish]').forEach((card) => card.addEventListener('click', () => {
  modalTitle.textContent = card.querySelector('h3').textContent;
  modalCopy.textContent = 'Esta interacción podría mostrar ingredientes, alérgenos, maridajes y opciones para añadir el plato al pedido. Es una muestra visual sin transacciones reales.';
  modal.showModal();
}));
document.querySelector('[data-modal-close]').addEventListener('click', () => modal.close());
modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });

const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const toggle = document.querySelector('[data-nav-toggle]');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open)); nav.classList.toggle('is-open', !open);
});
nav.querySelectorAll('a,button').forEach((item) => item.addEventListener('click', () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }));
addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 24), { passive: true });

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
document.querySelector('[data-year]').textContent = new Date().getFullYear();
