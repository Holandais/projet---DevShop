// DataDash - script.js
const API_BASE = (window.DATA_DASH_API_BASE || '/api').replace(/\/$/, '');
const FALLBACK_BY_CITY = {
  brazzaville: {
    current: { temp: 28, humidity: 64, description: 'partiellement nuageux', icon: '02d' },
    forecast: [
      { day: 'Aujourd\'hui', temp: 29, icon: '02d' },
      { day: 'Demain', temp: 30, icon: '03d' },
      { day: 'Mercredi', temp: 27, icon: '10d' },
      { day: 'Jeudi', temp: 26, icon: '09d' },
      { day: 'Vendredi', temp: 31, icon: '01d' }
    ]
  },
  paris: {
    current: { temp: 18, humidity: 58, description: 'nuageux', icon: '03d' },
    forecast: [
      { day: 'Aujourd\'hui', temp: 19, icon: '03d' },
      { day: 'Demain', temp: 17, icon: '02d' },
      { day: 'Mercredi', temp: 16, icon: '10d' },
      { day: 'Jeudi', temp: 15, icon: '09d' },
      { day: 'Vendredi', temp: 20, icon: '01d' }
    ]
  },
  london: {
    current: { temp: 14, humidity: 71, description: 'pluvieux', icon: '10d' },
    forecast: [
      { day: 'Aujourd\'hui', temp: 14, icon: '10d' },
      { day: 'Demain', temp: 13, icon: '09d' },
      { day: 'Mercredi', temp: 12, icon: '13d' },
      { day: 'Jeudi', temp: 15, icon: '10d' },
      { day: 'Vendredi', temp: 16, icon: '02d' }
    ]
  },
  default: {
    current: { temp: 24, humidity: 60, description: 'ensoleillé', icon: '01d' },
    forecast: [
      { day: 'Aujourd\'hui', temp: 25, icon: '01d' },
      { day: 'Demain', temp: 26, icon: '02d' },
      { day: 'Mercredi', temp: 23, icon: '03d' },
      { day: 'Jeudi', temp: 24, icon: '04d' },
      { day: 'Vendredi', temp: 27, icon: '01d' }
    ]
  }
};

// Éléments DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loaderEl = document.getElementById('loader');
const errorEl = document.getElementById('error');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const humidityEl = document.getElementById('humidity');
const iconEl = document.getElementById('weather-icon');
const lastUpdateEl = document.getElementById('last-update');
const forecastListEl = document.getElementById('forecast-list');
const historyTagsEl = document.getElementById('history-tags');

// Configuration
const DEFAULT_CITY = 'Brazzaville';
const HISTORY_KEY = 'datadash_history';
const MAX_HISTORY = 5;

// --- Initialisation ---
document.addEventListener('DOMContentLoaded', () => {
  bindUI();
  loadHistory();
  fetchAndRender(DEFAULT_CITY);
});

function bindUI(){
  searchBtn.addEventListener('click', () => onSearch());
  cityInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') onSearch(); });
}

// --- Recherche et rendu ---
async function fetchAndRender(city){
  if(!city) return;
  showLoader(true); showError(null);
  try{
    const fallback = buildFallbackWeather(city);
    const [current, forecast] = await Promise.all([
      fetchCurrentWeather(city, fallback),
      fetchForecast(city, fallback)
    ]);
    if(current) renderCurrent(current);
    if(forecast) renderForecast(forecast);
    saveHistory(city);
  }catch(err){
    const fallback = buildFallbackWeather(city);
    renderCurrent(fallback.current);
    renderForecast(fallback.forecast);
    console.error(err);
    showError('API indisponible. Affichage en mode démonstration.');
  }finally{ showLoader(false); }
}

function onSearch(){ const city = cityInput.value.trim(); if(!city) return; fetchAndRender(city); }

function showLoader(visible){ loaderEl.style.display = visible ? 'block' : 'none'; }
function showError(message){ if(!message){ errorEl.hidden = true; errorEl.textContent = ''; } else { errorEl.hidden = false; errorEl.textContent = message; } }

function buildFallbackWeather(city){
  const key = (city || 'Brazzaville').trim().toLowerCase();
  const data = FALLBACK_BY_CITY[key] || FALLBACK_BY_CITY.default;

  const current = {
    name: city || 'Brazzaville',
    main: { temp: data.current.temp, humidity: data.current.humidity },
    weather: [{ description: data.current.description, icon: data.current.icon }],
    dt: Math.floor(Date.now() / 1000)
  };

  const forecast = data.forecast.map((item, index) => ({
    ...item,
    day: index === 0 ? 'Aujourd\'hui' : item.day
  }));

  return { current, forecast };
}

// --- API calls ---
async function fetchCurrentWeather(city, fallback){
  const url = `${API_BASE}/weather?city=${encodeURIComponent(city)}`;
  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.current || fallback.current;
  }catch(e){
    console.warn('Fallback météo actuelle activé:', e);
    return fallback.current;
  }
}

async function fetchForecast(city, fallback){
  const url = `${API_BASE}/weather?city=${encodeURIComponent(city)}`;
  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.forecast || fallback.forecast;
  }catch(e){
    console.warn('Fallback météo prévision activé:', e);
    return fallback.forecast;
  }
}

// --- Rendu DOM ---
function renderCurrent(data){
  const t = Math.round(data.main.temp);
  tempEl.textContent = `${t}°C`;
  descEl.textContent = capitalize(data.weather[0].description);
  humidityEl.textContent = `${data.main.humidity}%`;
  const icon = data.weather[0].icon;
  iconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  iconEl.alt = data.weather[0].description;
  lastUpdateEl.textContent = unixToTime(data.dt);
}

function renderForecast(days){
  forecastListEl.innerHTML = '';
  days.forEach(d => {
    const el = document.createElement('div');
    el.className = 'forecast-day';
    el.innerHTML = `<div class="day">${d.day}</div><img src="https://openweathermap.org/img/wn/${d.icon}@2x.png" alt=""/><div class="t">${d.temp}°C</div>`;
    forecastListEl.appendChild(el);
  });
}

// --- Historique (localStorage) ---
function loadHistory(){
  const raw = localStorage.getItem(HISTORY_KEY);
  const arr = raw ? JSON.parse(raw) : [];
  renderHistory(arr);
}

function saveHistory(city){
  const raw = localStorage.getItem(HISTORY_KEY);
  let arr = raw ? JSON.parse(raw) : [];
  city = city.trim();
  // unique, récent en tête
  arr = arr.filter(c => c.toLowerCase() !== city.toLowerCase());
  arr.unshift(city);
  if(arr.length > MAX_HISTORY) arr = arr.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
  renderHistory(arr);
}

function renderHistory(arr){
  historyTagsEl.innerHTML = '';
  arr.forEach(c => {
    const b = document.createElement('button');
    b.className = 'tag';
    b.textContent = c;
    b.addEventListener('click', () => { cityInput.value = c; fetchAndRender(c); });
    historyTagsEl.appendChild(b);
  });
}

// --- Utilitaires ---
function unixToTime(ts){ const d = new Date(ts*1000); return d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }
function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
