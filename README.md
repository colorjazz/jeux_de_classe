# Sable

Des expériences interactives sur ordinateur, inspirées de la démarche de *Carne y Arena* (Iñárritu, 2017), mais sans réalité virtuelle. On ne joue pas un rôle : on marche avec un groupe de migrants, et on vit avec lui un moment qu'on ne contrôle pas.

Elles sont conçues pour une classe d'élèves de 16 à 17 ans.

| Expérience | Dossier | État |
|---|---|---|
| Frontière Mexique – États-Unis (désert de Sonora) | `frontiere-mexique/` | prototype jouable |
| Deuxième route | à venir | à concevoir |

## Lancer

Ouvrez `frontiere-mexique/index.html` dans Chrome, Edge ou Firefox, en double-cliquant dessus. Il n'y a rien à installer et aucune connexion n'est nécessaire. **Les écouteurs sont indispensables.**

Le guide pour l'enseignant (déroulé, précautions, questions de débrief) se trouve dans [`docs/guide-enseignant.md`](docs/guide-enseignant.md).

## Organisation

```
frontiere-mexique/
  index.html        écrans : avertissement, sas, témoignages, fin
  css/style.css
  js/contenu.js     textes, répliques, personnages et témoignages (à modifier ici)
  js/audio.js       sons procéduraux spatialisés (vent, pas, respiration, hélicoptère…)
  js/desert.js      scène 3D : marche, arrestation, rupture onirique
  js/main.js        enchaînement des séquences
vendor/three.min.js Three.js r160 (licence MIT, voir vendor/THREE_LICENSE)
docs/guide-enseignant.md
```

Tous les textes se trouvent dans `js/contenu.js`. On peut les retravailler sans toucher au code.

Pour les tests, `?scene=desert&t=345`, `?scene=reve` et `?scene=temoignages` permettent d'aller directement à une séquence. `&acc=3` accélère le temps.
