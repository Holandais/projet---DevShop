// script.js — logique de la SPA DevShop
// Utilise fetch + async/await, gère le DOM, filtres, recherche et panier (localStorage)

const API_URL = 'https://fakestoreapi.com/products';
// Taux de conversion fixe : 1 EUR = 655.957 XOF (Franc CFA)
const EUR_TO_XOF = 655.957;


function formatPriceCFA(euro){
  const xof = Math.round((Number(euro) || 0) * EUR_TO_XOF);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(xof);
}

const productsEl = document.getElementById('products');
const loaderEl = document.getElementById('loader');
const errorEl = document.getElementById('error');
const filtersEl = document.querySelector('.filters');
const searchEl = document.getElementById('search');
const cartToggleBtn = document.getElementById('cart-toggle');
const cartCountEl = document.getElementById('cart-count');
const cartDrawer = document.getElementById('cart-drawer');
const overlay = document.getElementById('overlay');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const closeCartBtn = document.getElementById('close-cart');
const sortEl = document.getElementById('sort');
const modalEl = document.getElementById('product-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

let products = [];
let activeCategory = 'all';
let cart = loadCart();

const CATEGORY_TRANSLATIONS = {
  "electronics": "Électronique",
  "jewelery": "Bijoux",
  "men's clothing": "Vêtements homme",
  "women's clothing": "Vêtements femme"
};

function translateCategory(cat){
  return CATEGORY_TRANSLATIONS[cat] || capitalize(cat);
}

const TITLE_LEXICON = {
  "shirt": "chemise",
  "t-shirt": "t‑shirt",
  "jacket": "veste",
  "coat": "manteau",
  "jeans": "jean",
  "sneakers": "baskets",
  "shoes": "chaussures",
  "watch": "montre",
  "leather": "cuir",
  "bag": "sac",
  "case": "étui",
  "ring": "bague",
  "gold": "or",
  "silver": "argent",
  "blue": "bleu",
  "red": "rouge",
  "black": "noir",
  "white": "blanc",
  "wireless": "sans fil",
  "smart": "intelligent",
  "cotton": "coton",
  "vintage": "vintage",
  "classic": "classique",
  "women": "femme",
  "men": "homme",
  "digital": "numérique",
  "portable": "portable"
};

function translateTitle(title){
  if(!title) return '';
  let s = String(title);
  // minuscules pour la détection
  const lower = s.toLowerCase();
  // remplacement mot à mot depuis le lexique
  Object.keys(TITLE_LEXICON).forEach(k => {
    const re = new RegExp("\\b" + escapeRegExp(k) + "\\b", 'gi');
    s = s.replace(re, TITLE_LEXICON[k]);
  });
  // nettoyage d'espaces et capitalisation de début
  s = s.replace(/\s+/g,' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeRegExp(string){ return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// --- Initialisation ---
document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init(){
  updateCartCount();
  bindUI();
  await fetchProducts();
}

function bindUI(){
  searchEl.addEventListener('input', handleSearch);
  if(sortEl) sortEl.addEventListener('change', () => renderProducts(products));
  cartToggleBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  if(modalClose) modalClose.addEventListener('click', closeModal);
}

// --- Fetch produits ---
async function fetchProducts(){
  showLoader(true);
  showError(null);
  try{
    const res = await fetch(API_URL);
    if(!res.ok) throw new Error(`Erreur réseau: ${res.status}`);
    products = await res.json();
    renderFilters(products);
    renderProducts(products);
  }catch(err){
    console.error(err);
    showError("Impossible de charger les produits. Vérifiez votre connexion et réessayez.");
  }finally{
    showLoader(false);
  }
}

function showLoader(visible){
  loaderEl.style.display = visible ? 'block' : 'none';
}

function showError(message){
  if(!message){ errorEl.hidden = true; errorEl.textContent = ''; return; }
  errorEl.hidden = false;
  errorEl.textContent = message;
}

// --- Rendu dynamique des produits ---
function renderProducts(list){
  productsEl.innerHTML = '';
  const filtered = applyFilters(list);
  // Appliquer tri si demandé
  const sortMode = sortEl ? sortEl.value : 'relevance';
  if(sortMode === 'price-asc') filtered.sort((a,b) => a.price - b.price);
  if(sortMode === 'price-desc') filtered.sort((a,b) => b.price - a.price);
  if(filtered.length === 0){
    productsEl.innerHTML = '<p>Aucun produit trouvé.</p>';
    return;
  }
  const frag = document.createDocumentFragment();
  filtered.forEach(p => {
    const card = createProductCard(p);
    frag.appendChild(card);
  });
  productsEl.appendChild(frag);
}

function createProductCard(p){
  const el = document.createElement('article');
  el.className = 'card';

  el.innerHTML = `
    <img src="${p.image}" alt="${escapeHtml(p.title)}" />
    <div class="title">${escapeHtml(translateTitle(p.title))}</div>
    <div class="category">${escapeHtml(translateCategory(p.category))}</div>
    <div class="price">${formatPriceCFA(p.price)}</div>
    <div class="actions">
      <button class="btn ghost" data-id="${p.id}">Détails</button>
      <button class="btn primary" data-add="${p.id}">Ajouter</button>
    </div>
  `;

  // Attacher ajout au panier
  const addBtn = el.querySelector('[data-add]');
  addBtn.addEventListener('click', () => addToCart(p));
  // Attacher détails
  const detailsBtn = el.querySelector('[data-id]');
  if(detailsBtn) detailsBtn.addEventListener('click', () => openModal(p));
  return el;
}

// --- Filtres / recherche ---
function renderFilters(products){
  const categories = Array.from(new Set(products.map(p => p.category)));
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = cat;
    btn.textContent = translateCategory(cat);
    btn.addEventListener('click', () => selectCategory(cat, btn));
    filtersEl.appendChild(btn);
  });
}

function selectCategory(cat, btn){
  activeCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts(products);
}

function handleSearch(){
  renderProducts(products);
}

function applyFilters(list){
  const q = searchEl.value.trim().toLowerCase();
  return list.filter(p => {
    const matchCat = activeCategory === 'all' ? true : p.category === activeCategory;
    const searchable = `${translateTitle(p.title)} ${p.title} ${p.category} ${translateCategory(p.category)}`;
    const matchSearch = q === '' ? true : searchable.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
}

// --- Panier ---
function loadCart(){
  try{
    const raw = localStorage.getItem('devshop_cart');
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.warn('Erreur lecture localStorage', e);
    return [];
  }
}

function saveCart(){
  try{
    localStorage.setItem('devshop_cart', JSON.stringify(cart));
  }catch(e){ console.warn('Erreur sauvegarde panier', e); }
}

function addToCart(product){
  const existing = cart.find(i => i.id === product.id);
  if(existing){ existing.qty += 1; }
  else { cart.push({ id: product.id, title: translateTitle(product.title), price: product.price, image: product.image, qty: 1 }); }
  saveCart();
  updateCartCount();
}

function updateCartCount(){
  const total = cart.reduce((s,i) => s + i.qty, 0);
  cartCountEl.textContent = total;
}

function openCart(){
  renderCart();
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  overlay.hidden = false;
}

function closeCart(){
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  overlay.hidden = true;
}

function renderCart(){
  cartItemsEl.innerHTML = '';
  if(cart.length === 0){ cartItemsEl.innerHTML = '<p>Le panier est vide.</p>'; cartTotalEl.textContent = formatPriceCFA(0); return; }
  const frag = document.createDocumentFragment();
  cart.forEach(item => {
    const it = document.createElement('div');
    it.className = 'cart-item';
    it.innerHTML = `
      <img src="${item.image}" alt="${escapeHtml(item.title)}" />
      <div class="meta">
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="price">${formatPriceCFA(item.price)}</div>
        <div class="qty-controls">
          <button class="btn ghost" data-dec="${item.id}">−</button>
          <strong>${item.qty}</strong>
          <button class="btn ghost" data-inc="${item.id}">+</button>
          <button class="btn ghost" data-rem="${item.id}">Supprimer</button>
        </div>
      </div>
    `;
    frag.appendChild(it);
  });
  cartItemsEl.appendChild(frag);

  // Attacher les contrôles de quantité / suppression
  cartItemsEl.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', e => changeQty(e.target.dataset.inc, +1)));
  cartItemsEl.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', e => changeQty(e.target.dataset.dec, -1)));
  cartItemsEl.querySelectorAll('[data-rem]').forEach(b => b.addEventListener('click', e => removeItem(e.target.dataset.rem)));

  updateCartTotal();
}

function changeQty(id, delta){
  const idx = cart.findIndex(i => String(i.id) === String(id));
  if(idx === -1) return;
  cart[idx].qty += delta;
  if(cart[idx].qty <= 0) cart.splice(idx,1);
  saveCart();
  updateCartCount();
  renderCart();
}

function removeItem(id){
  cart = cart.filter(i => String(i.id) !== String(id));
  saveCart();
  updateCartCount();
  renderCart();
}

function updateCartTotal(){
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  cartTotalEl.textContent = formatPriceCFA(total);
}

// --- Modal produit ---
function openModal(product){
  if(!modalEl) return;
  modalBody.innerHTML = `
    <img src="${product.image}" alt="${escapeHtml(product.title)}" />
    <div class="meta">
      <h3>${escapeHtml(translateTitle(product.title))}</h3>
      <div class="price">${formatPriceCFA(product.price)}</div>
      <p><strong>Description :</strong> ${escapeHtml(product.description)}</p>
      <div style="margin-top:12px">
        <button class="btn primary" id="modal-add">Ajouter au panier</button>
      </div>
    </div>
  `;
  const add = document.getElementById('modal-add');
  if(add) add.addEventListener('click', () => { addToCart(product); closeModal(); });
  modalEl.hidden = false;
  modalEl.setAttribute('aria-hidden','false');
}

function closeModal(){
  if(!modalEl) return;
  modalEl.hidden = true;
  modalEl.setAttribute('aria-hidden','true');
}

// --- Utilitaires ---
function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Rendu initial du panier (compteur) — si l'utilisateur a déjà un panier
updateCartCount();
