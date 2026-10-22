# Saisie de notes automatique

Favori (bookmarklet) qui inscrit les notes des élèves dans un site de notes (Mozaïk ou autre)
à partir d'une liste `Nom Prénom ; note`.

- Ouvrir `index.html` dans le navigateur et suivre les instructions (installation, conversion du PDF, utilisation).
- Le favori repère chaque élève par son nom (ordre, accents et majuscules ignorés, petites fautes tolérées),
  trouve la case de note sur la même ligne et y écrit la note. Il n'enregistre jamais : l'enseignant vérifie puis enregistre.
- Tout se passe dans le navigateur ; aucune donnée n'est envoyée.

Pour modifier le favori : éditer `saisie-notes.js`, puis régénérer la page avec `python3 build.py`.
