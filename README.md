# DevShop / CineMatch / DataDash

Portfolio de trois mini applications web en JavaScript :
- DevShop : boutique e-commerce
- CinéMatch : application de films
- DataDash : dashboard météo sécurisé avec backend

## Structure

- `projet  1 - DevShop/` — boutique e-commerce
- `Projet 2 - CinéMatch/` — app films
- `projet 3 - DataDash/` — dashboard météo avec backend

## Lancement local

Chaque projet peut être servi localement via :

```bash
python -m http.server 8000
```

Pour DataDash, le backend doit aussi être démarré :

```bash
cd "projet 3 - DataDash"
python server.py
```

## Sécurité

- les clés API ne doivent pas être poussées sur GitHub ;
- les fichiers `.env` sont ignorés par Git ;
- le backend DataDash protège la clé OpenWeatherMap.
