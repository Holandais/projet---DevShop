# DevShop

Ce projet est une application web e-commerce réalisée en JavaScript vanilla, avec une interface moderne et une logique de panier côté client.

## Présentation

- catalogue de produits dynamique
- recherche par nom
- filtres par catégorie
- panier et gestion des quantités
- conversion des prix en XOF
- interface en français
- stockage local des données avec localStorage

## API utilisée

- FakeStore API : https://fakestoreapi.com/

Cette API est publique et ne nécessite pas de clé API.

## Fichiers

- `index.html` : structure de la page
- `style.css` : styles et mise en page
- `script.js` : logique de l’application, appels API, panier et filtres

## Ouvrir le projet

1. Ouvrez un terminal dans le dossier du projet
2. Lancez le serveur local :

```bash
python -m http.server 8000
```

3. Ouvrez dans le navigateur :

```txt
http://localhost:8000/index.html
```

## Utilisation

- Recherchez un produit dans la barre de recherche
- Filtrez par catégorie
- Ajoutez des produits au panier
- Modifiez les quantités depuis le panier latéral
- Consultez les détails du produit dans la modale

## Validation

Le projet a été testé dans un navigateur moderne et les fonctionnalités principales du panier, de la recherche et des filtres ont été vérifiées.
