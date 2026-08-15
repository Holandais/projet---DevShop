# DataDash

Application météo complète en JavaScript avec architecture correcte pour un déploiement réel :
- le frontend est statique et ne contient aucune clé secrète ;
- le backend protège l’API OpenWeatherMap ;
- le frontend appelle le backend via `/api/weather`.

## Architecture finale

La version finale n’exécute pas directement l’API OpenWeatherMap dans le navigateur. Le navigateur appelle un serveur backend local ou distant, et ce backend récupère les données météo avec la clé secrète stockée côté serveur uniquement.

Cela évite :
- fuite de clé API dans le code public ;
- blocage par GitHub Pages pour les secrets ;
- échec sur les sites statiques sans backend.

## Prérequis
- Python 3.10+
- Une clé API OpenWeatherMap : https://openweathermap.org/
- Un hébergement backend réel (Render, Railway, Fly.io, VPS, etc.)

## Configuration locale
1. Créez un fichier `.env` à la racine du projet :
```bash
OPENWEATHER_API_KEY=votre_cle_ici
PORT=8000
```
2. Démarrez le backend :
```bash
python server.py
```
3. Ouvrez le frontend via le même serveur HTTP, par exemple :
```bash
http://localhost:8000
```

Important : ne lancez pas le frontend uniquement avec `python -m http.server` si le backend n’est pas disponible. La vraie route est `/api/weather` côté serveur.

## Déploiement réel
- Publiez le backend sur un service qui accepte des variables d’environnement.
- Définit la variable `OPENWEATHER_API_KEY` sur le service d’hébergement.
- Publiez aussi le frontend statique sur GitHub Pages, Netlify ou un autre service statique.
- Configurez le frontend pour pointer vers votre backend public, par exemple :
```html
<script>
  window.DATA_DASH_API_BASE = 'https://votre-backend.example.com/api';
</script>
<script src="script.js"></script>
```
ou laissez `'/api'` si le backend est servi sur le même domaine.

## Fichiers principaux
- `index.html` — interface utilisateur
- `style.css` — styles
- `script.js` — appels frontend vers `/api/weather`
- `server.py` — backend sécurisé avec fallback
- `.env` — variables locales non versionnées
- `.env.example` — exemple de configuration

## Fallback
Si la clé API est absente ou la requête échoue, le backend retourne des données de démonstration par ville pour garder l’interface fonctionnelle sans rupture.
