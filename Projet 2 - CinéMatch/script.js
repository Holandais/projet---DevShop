// CineMatch - script.js
// Remarque : vous devez définir la constante `TMDB_API_KEY` avec votre clé API TMDB
const TMDB_API_KEY = '857c83263f229dc4f84a2e7f0da48d94';
const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_MOVIES = [
  {
    id: 1,
    title: 'Inception',
    overview: 'Un voleur expert en extraction de secrets par le rêve entre en mission pour implanter une idée dans l’esprit d’un PDG.',
    poster_path: '/edv5CZvWj09upOaVvsQb4pxTuNd.jpg',
    vote_average: 8.8,
    release_date: '2010-07-16'
  },
  {
    id: 2,
    title: 'Interstellar',
    overview: 'Un groupe d’explorateurs traverse un trou de ver à la recherche d’une nouvelle planète habitable pour sauver l’humanité.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    vote_average: 8.7,
    release_date: '2014-11-05'
  },
  {
    id: 3,
    title: 'Dune',
    overview: 'Dans un désert lointain, un jeune noble est entraîné dans une lutte pour la survie et le pouvoir.',
    poster_path: '/8hoD3f3p1Y9z1v7G7pM3ghjKZ2n.jpg',
    vote_average: 8.1,
    release_date: '2021-10-22'
  },
  {
    id: 4,
    title: 'The Batman',
    overview: 'Batman cherche à faire tomber le règne du crime à Gotham pendant une nuit de chaos.',
    poster_path: '/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    vote_average: 8.1,
    release_date: '2022-03-04'
  }
];

// DOM
const moviesEl = document.getElementById('movies');
const loaderEl = document.getElementById('loader');
const errorEl = document.getElementById('error');
const searchEl = document.getElementById('search');
const favListEl = document.getElementById('fav-list');
const favCountEl = document.getElementById('fav-count');
const showFavsBtn = document.getElementById('show-favs');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

let favorites = loadFavorites();

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  bindUI();
  fetchTrending();
  renderFavorites();
});

function bindUI(){
  searchEl.addEventListener('input', debounce(handleSearch, 350));
  if(showFavsBtn) showFavsBtn.addEventListener('click', () => {
    document.getElementById('favorites').scrollIntoView({behavior:'smooth'});
  });
  if(modalClose) modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeModal(); });
}

// --- Fetching ---
async function fetchTrending(){
  showLoader(true); showError(null);
  try{
    const fallback = [...FALLBACK_MOVIES];
    if(!TMDB_API_KEY || TMDB_API_KEY.includes('YOUR_TMDB')) {
      renderMovies(fallback);
      return;
    }
    const res = await fetch(`${API_BASE}/trending/movie/day?api_key=${TMDB_API_KEY}`);
    if(!res.ok) throw new Error(`Erreur API: ${res.status}`);
    const data = await res.json();
    renderMovies(data.results && data.results.length ? data.results : fallback);
  }catch(err){
    console.error(err);
    renderMovies(FALLBACK_MOVIES);
    showError('API indisponible. Affichage en mode démonstration.');
  }finally{ showLoader(false); }
}

async function searchMovies(query){
  if(!query) return fetchTrending();
  showLoader(true); showError(null);
  try{
    if(!TMDB_API_KEY || TMDB_API_KEY.includes('YOUR_TMDB')) {
      const filtered = FALLBACK_MOVIES.filter(movie => movie.title.toLowerCase().includes(query.toLowerCase()));
      renderMovies(filtered.length ? filtered : FALLBACK_MOVIES);
      return;
    }
    const url = `${API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(`Erreur API: ${res.status}`);
    const data = await res.json();
    renderMovies(data.results && data.results.length ? data.results : FALLBACK_MOVIES);
  }catch(err){
    console.error(err);
    const filtered = FALLBACK_MOVIES.filter(movie => movie.title.toLowerCase().includes(query.toLowerCase()));
    renderMovies(filtered.length ? filtered : FALLBACK_MOVIES);
    showError('Recherche impossible, affichage des résultats de démonstration.');
  }finally{ showLoader(false); }
}

async function fetchMovieDetails(id){
  try{
    if(!TMDB_API_KEY || TMDB_API_KEY.includes('YOUR_TMDB')) {
      return FALLBACK_MOVIES.find(movie => String(movie.id) === String(id)) || null;
    }
    const res = await fetch(`${API_BASE}/movie/${id}?api_key=${TMDB_API_KEY}&language=fr-FR`);
    if(!res.ok) throw new Error('Détails indisponibles');
    return await res.json();
  }catch(e){
    console.error(e);
    return FALLBACK_MOVIES.find(movie => String(movie.id) === String(id)) || null;
  }
}

function ensureApiKey(){
  if(!TMDB_API_KEY || TMDB_API_KEY.includes('YOUR_TMDB')) {
    console.warn('TMDB key absent: mode démonstration activé');
  }
}

// --- UI helpers ---
function showLoader(visible){ loaderEl.style.display = visible ? 'block' : 'none'; }
function showError(msg){ if(!msg){ errorEl.hidden = true; errorEl.textContent=''; } else { errorEl.hidden = false; errorEl.textContent = msg; } }

function renderMovies(list){
  moviesEl.innerHTML = '';
  if(!list || list.length === 0){ moviesEl.innerHTML = '<p>Aucun film trouvé.</p>'; return; }
  const frag = document.createDocumentFragment();
  list.forEach(m => frag.appendChild(createMovieCard(m)));
  moviesEl.appendChild(frag);
}

function createMovieCard(m){
  const el = document.createElement('article');
  el.className = 'card';
  const poster = m.poster_path ? `${IMG_BASE}${m.poster_path}` : '';
  const title = m.title || m.name || 'Titre inconnu';
  const date = m.release_date || m.first_air_date || '';
  const vote = (m.vote_average || 0).toFixed(1);

  el.innerHTML = `
    <img src="${poster}" alt="Affiche ${escapeHtml(title)}" onerror="this.style.opacity=0.6;" />
    <div class="body">
      <h3>${escapeHtml(title)}</h3>
      <div class="meta"><span>${formatDate(date)}</span><span class="rating ${ratingClass(vote)}">${vote}</span></div>
      <div class="actions">
        <button class="btn ghost" data-details="${m.id}">Détails</button>
        <button class="btn" data-fav="${m.id}">❤</button>
      </div>
    </div>
  `;

  // events
  el.querySelector('[data-details]')?.addEventListener('click', async () => {
    const details = await fetchMovieDetails(m.id);
    openModal(details || m);
  });
  el.querySelector('[data-fav]')?.addEventListener('click', () => toggleFavorite(m));
  return el;
}

// --- Search ---
function handleSearch(e){ const q = e.target.value.trim(); searchMovies(q); }
function debounce(fn, wait){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); }; }

// --- Rating color ---
function ratingClass(v){ const n = Number(v); if(n>7) return 'green'; if(n>=5) return 'orange'; return 'red'; }

// --- Modal ---
function openModal(details){
  if(!details) return;
  const poster = details.poster_path ? `${IMG_BASE}${details.poster_path}` : '';
  const genres = details.genres ? details.genres.map(g=>g.name).join(', ') : '';
  modalBody.innerHTML = `
    <img src="${poster}" alt="Affiche" />
    <div class="info">
      <h2>${escapeHtml(details.title || details.name)}</h2>
      <p><strong>Genres:</strong> ${escapeHtml(genres)}</p>
      <p><strong>Synopsis:</strong> ${escapeHtml(details.overview || 'Aucune description.')}</p>
    </div>
  `;
  modal.hidden = false; modal.setAttribute('aria-hidden','false');
}
function closeModal(){ modal.hidden = true; modal.setAttribute('aria-hidden','true'); modalBody.innerHTML=''; }

// --- Favorites ---
function loadFavorites(){ try{ const raw = localStorage.getItem('cinematch_favs'); return raw ? JSON.parse(raw) : []; }catch(e){ return []; } }
function saveFavorites(){ localStorage.setItem('cinematch_favs', JSON.stringify(favorites)); }

function isFavorited(id){ return favorites.some(f => String(f.id)===String(id)); }

function toggleFavorite(movie){ const id = movie.id; if(isFavorited(id)){ favorites = favorites.filter(f=>String(f.id)!==String(id)); } else { favorites.push({ id: movie.id, title: movie.title, poster_path: movie.poster_path, release_date: movie.release_date }); } saveFavorites(); renderFavorites(); }

function renderFavorites(){ favListEl.innerHTML=''; if(!favorites.length) { favListEl.innerHTML = '<p>Aucun favori.</p>'; favCountEl.textContent = '0'; return; } const frag = document.createDocumentFragment(); favorites.forEach(f=>{ const el = document.createElement('div'); el.className='fav-item'; el.innerHTML = `<img src="${f.poster_path?IMG_BASE+f.poster_path:''}" alt="${escapeHtml(f.title)}"/><div><strong>${escapeHtml(f.title)}</strong><div style="font-size:0.85rem;color:#666">${f.release_date||''}</div></div><button class="btn ghost" data-rem="${f.id}">Supprimer</button>`; el.querySelector('[data-rem]')?.addEventListener('click', ()=>{ favorites = favorites.filter(x=>String(x.id)!==String(f.id)); saveFavorites(); renderFavorites(); }); frag.appendChild(el); }); favListEl.appendChild(frag); favCountEl.textContent = String(favorites.length); }

// --- Utils ---
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function formatDate(d){ if(!d) return ''; try{ const dt = new Date(d); return dt.toLocaleDateString('fr-FR'); }catch(e){ return d||''; } }
