# jeux_de_classe — Portfolio

Un site portfolio rapide et sans dépendances pour présenter des jeux éducatifs et des jeux de classe.

## Personnaliser le site

Modifiez **`content.js`**. Ce fichier contient tout le texte du site : nom, rôle, accroche, présentation, statistiques, compétences, contact et projets.
Pas besoin de toucher au HTML, au CSS ni au JS.

Pour chaque projet :

| Champ | Rôle |
| --- | --- |
| `title`, `year`, `summary` | Affichés sur la carte |
| `description`, `role` | Affichés dans la fenêtre de détails |
| `tags` | Créent automatiquement les boutons de filtre |
| `image` | Facultatif. Placez le fichier dans `assets/img/` et écrivez `"assets/img/nom.png"` |
| `accent` | Couleur de la couverture quand il n’y a pas d’image |
| `featured` | `true` affiche la carte en double largeur |
| `links` | Boutons de la fenêtre de détails, ex. `{ label: "Jouer", url: "https://…" }` |

## Aperçu local

Ouvrez `index.html` dans un navigateur. Aucune compilation nécessaire.

## Publier gratuitement avec GitHub Pages

1. Fusionnez cette branche dans `main`.
2. Sur GitHub, allez dans **Settings → Pages**.
3. Sous *Build and deployment*, choisissez **Deploy from a branch**, sélectionnez `main` et `/ (root)`, puis enregistrez.
4. Le site sera en ligne à `https://colorjazz.github.io/jeux_de_classe/`. Vous pouvez y associer un nom de domaine personnalisé depuis la même page.
