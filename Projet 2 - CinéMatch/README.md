# CineMatch

Ce projet est une application web de catalogue de films développée en JavaScript vanilla. Elle utilise l’API TMDB pour afficher les films populaires, rechercher des titres et consulter les détails d’un film.

## Présentation

- films tendance du jour
- recherche de films
- affichage des résultats dans une grille
- modale de détails
- gestion des favoris
- sauvegarde des favoris dans le navigateur

## API utilisée

- TMDB API : https://www.themoviedb.org/documentation/api
- Documentation officielle : https://developer.themoviedb.org/docs

Pour utiliser cette application, il faut générer une clé API TMDB depuis le site officiel.

## Fichiers

- `index.html` : structure du site
- `style.css` : styles et mise en page
- `script.js` : logique de recherche, affichage des films et gestion des favoris

## Ouvrir le projet

1. Ouvrez un terminal dans le dossier du projet
2. Remplacez la valeur de `TMDB_API_KEY` dans le fichier JavaScript
3. Lancez le serveur local :

```bash
python -m http.server 8000
```

4. Ouvrez dans le navigateur :

```txt
http://localhost:8000/index.html
```

## Utilisation

- Entrez un nom de film dans la barre de recherche
- Consultez les films tendances sur la page d’accueil
- Cliquez sur un film pour voir ses détails dans la modale
- Ajoutez des films aux favoris
- Les favoris restent enregistrés dans le navigateur

## Validation

Le projet est compatible avec les navigateurs modernes et a été conçu pour fonctionner avec une clé API TMDB valide.
