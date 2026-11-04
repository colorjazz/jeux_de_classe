# Chapitre 1 : Le sable · Guide pour l'enseignant

*Frontière Mexique – États-Unis. Premier des quatre chapitres de* Traversées.

Public : élèves de 16 à 17 ans. Durée de l'expérience : environ 12 minutes par élève (15 avec les témoignages). Prévoir 55 minutes de séance avec le débrief.

## L'intention

Faire ressentir, plutôt qu'expliquer, ce que vit un groupe de migrants qui traverse de nuit le désert de Sonora, entre le Mexique et l'Arizona. Le projet s'inspire de la démarche de *Carne y Arena* (A. G. Iñárritu, 2017), sans la réalité virtuelle et avec des scènes et des personnages originaux.

Trois principes guident la conception :

- **Ce n'est pas un jeu à gagner.** Il n'y a ni score, ni échec, ni moyen d'échapper à la patrouille. Quoi que fasse l'élève, l'issue est la même, et c'est le propos.
- **L'élève n'est pas un héros.** Il marche avec le groupe. Il peut aider ou non un homme âgé qui tombe, mais ce geste ne change pas l'issue.
- **On entend leur langue.** Les migrants parlent espagnol et les agents anglais. Les sous-titres ne montrent que la traduction, en français ou en anglais selon le choix fait sur l'écran d'accueil.

## Déroulé de l'expérience

L'expérience est construite comme une montée : appréhension, calme, intimité, fatigue et peur, espoir, puis le choc. Le choc arrive au moment où l'élève croit que c'est presque fini.

| Séquence | Durée | Ce qui se passe | Émotion visée |
|---|---|---|---|
| Avertissement | libre | Contenu, durée, consigne des écouteurs, choix des sous-titres | – |
| Le sas | ~45 s | Écran froid, bourdonnement, quelques phrases sur le désert et les objets abandonnés | Se taire, entrer |
| Le mur | ~1 min 30 | Côté mexicain, le groupe attend au pied du mur. Chacun monte à l'échelle à son tour ; Joseph aide Mateo. L'élève passe en dernier (touche E) | Appréhension |
| Première marche | ~2 min 30 | Marche de nuit derrière le guide. Les personnages se présentent : Mateo demande si c'est encore loin, Yesenia dit son prénom, Valeria, infirmière, propose son aide, Julio parle de sa fille. Des coyotes au loin. Une croix au bord du chemin, où Joseph prie en créole | Calme, attachement |
| La halte | ~1 min | Le groupe s'assoit. Julio partage l'eau (touche E pour boire). Rosa chante une berceuse à Mateo qui s'endort ; Valeria le couvre. Don Ernesto parle de son fils, Joseph des immeubles qu'il construisait au Chili | Intimité |
| Deuxième marche | ~2 min 15 | Le froid, la soif, il n'y a plus d'eau. Fausse alerte : des phares sur une route au loin, tout le monde se cache. Don Ernesto tombe : Valeria s'agenouille près de lui, l'élève peut l'aider (touche E) | Fatigue, peur |
| L'espoir | ~30 s | Les lumières d'une ville apparaissent à l'horizon. « On y est presque. » Une musique douce s'installe | Soulagement |
| Le choc | ~45 s | La musique se coupe net. Un hélicoptère, tout le monde se jette à plat ventre autour de l'élève. Projecteur, le guide s'enfuit, un pick-up, trois agents. Ordre de se mettre à genoux, mains en l'air, lampe torche dans les yeux | Choc, impuissance |
| La rupture | ~45 s | Silence. Le monde se fige et change de couleur. Les agents disparaissent. Les personnes se relèvent, leurs noms s'élèvent dans la lumière | Suspension |
| Les témoignages | libre | Le récit de chaque personne et ce qui lui est arrivé ensuite | Comprendre |
| La fin | ~30 s | Rappel que les personnages sont fictifs mais que leurs histoires sont réelles | Recul |

**Violence** : elle est suggérée (cris, armes et lampes braquées, mains en l'air), jamais montrée. Aucun coup, aucun sang.

## Matériel

- Un ordinateur par élève, ou un poste tournant. Il faut un navigateur récent : Chrome, Edge ou Firefox.
- **Des écouteurs par poste (indispensables).** Le son est spatialisé en 3D.
- Une salle sombre si possible.
- Aucune installation ni connexion internet : il suffit d'ouvrir `frontiere-mexique/index.html` en double-cliquant dessus.

**Les voix**
- **Avec Microsoft Edge, les voix sont nettement plus humaines.** Edge propose des voix neuronales « Natural » en espagnol et en anglais, et l'expérience les choisit automatiquement : une voix différente par personnage, avec un ton par réplique (chuchotée, criée, épuisée, tendre…).
- Avec Chrome ou Firefox, ce sont les voix du système, plus mécaniques. Sous Windows, on peut en ajouter dans Paramètres → Heure et langue → Voix.
- **Pour des voix vraiment expressives, on peut les générer avec Gemini** (outil fourni, une clé d'API Google suffit) **ou enregistrer de vrais comédiens.** Le fichier [`script-enregistrement.md`](script-enregistrement.md) liste les 43 répliques, avec le personnage, le ton et le nom de fichier. Chaque enregistrement ajouté remplace la voix de synthèse, et il est joué en son 3D depuis la position du personnage. Cela fonctionne sur le site en ligne, pas en ouvrant le fichier en double-cliquant.
- Si aucune voix n'est disponible, les répliques s'affichent quand même en sous-titres.

## Commandes

- **Z Q S D** (ou W A S D, ou les flèches) : marcher.
- **Souris** : regarder autour de soi. Il faut d'abord cliquer dans l'image.
- **E** : agir (monter à l'échelle, boire, tendre la main).
- **Sur téléphone ou tablette**, tenus à l'horizontale : joystick en bas à gauche pour marcher, glisser le doigt ailleurs pour regarder, bouton **Agir** quand une action est possible. Un ordinateur reste préférable : l'écran est plus grand et la 3D plus fluide.
- **Pause** : bouton en haut à droite, touche **P** ou **Échap**. Le temps, le son et les voix s'arrêtent. Depuis la pause, on peut aussi recommencer depuis le début.

## Accès direct à une séquence (préparation, reprise)

Ajoutez ces paramètres à l'adresse dans le navigateur :

- `index.html?scene=desert` : commencer au mur.
- `index.html?scene=desert&t=160` : la halte.
- `index.html?scene=desert&t=270` : juste avant la fausse alerte.
- `index.html?scene=desert&t=345` : l'espoir, puis le choc.
- `index.html?scene=reve` : la rupture onirique.
- `index.html?scene=temoignages` : les témoignages seuls.
- Ajouter `&qualite=legere` (ou `?qualite=legere`) : graphismes allégés, sans ombres ni halos, pour les ordinateurs lents. Par défaut, la qualité est choisie automatiquement : complète sur ordinateur, allégée sur téléphone, et elle se réduit d'elle-même si l'image devient saccadée.
- Ajouter `&st=en` (ou `?st=en`) : sous-titres en anglais. Sinon, c'est le choix fait sur l'écran d'accueil qui s'applique.

## Avant la séance

- Prévenez les élèves du contenu : une arrestation à la frontière. Ne dévoilez pas le reste.
- Signalez qu'on peut faire une pause ou arrêter à tout moment, sans avoir à se justifier.
- Soyez attentif aux élèves qui ont eux-mêmes un parcours migratoire, ou dont la famille en a un. Proposez-leur de choisir s'ils participent, éventuellement en leur parlant avant la séance.

## Débrief (20 à 30 minutes)

Laissez d'abord **une minute de silence** après l'expérience. Ensuite :

**Ressenti**
1. Quel moment vous a le plus marqué ? Pourquoi ?
2. À quel moment avez-vous eu le sentiment de ne plus rien contrôler ?
3. Avez-vous aidé Don Ernesto ? Avez-vous bu l'eau que Julio vous tendait ? Qu'est-ce qui vous a décidé, ou retenu ?
4. Quand les lumières de la ville sont apparues, qu'avez-vous ressenti ? Et quand la musique s'est coupée ?

**Comprendre**
5. Pourquoi chacune de ces personnes est-elle partie ? Classez les raisons : violence, économie, climat, famille.
6. Pourquoi l'expérience ne permet-elle pas d'échapper à la patrouille ?
7. Les personnages parlent espagnol, créole haïtien et anglais : quel effet cela produit-il, même avec les sous-titres ?
8. Que devient chaque personne après l'arrestation ? Ces issues sont-elles les mêmes pour tous ?

**Prendre du recul**
9. Les personnages sont fictifs. Est-ce que cela change ce que vous ressentez ? Est-ce honnête de les présenter ainsi ?
10. Une expérience comme celle-ci permet-elle vraiment de « se mettre à la place » de quelqu'un ? Quelles sont ses limites ?
11. Qu'est-ce qu'une œuvre (film, jeu, installation) apporte par rapport à un article ou à des statistiques ?

## Pour aller plus loin (pistes à vérifier avant utilisation)

- *Carne y Arena*, A. G. Iñárritu (2017), installation en réalité virtuelle. Plusieurs reportages la décrivent.
- Jason De León, *The Land of Open Graves* (2015), anthropologie de la traversée du désert de Sonora.
- Le **Missing Migrants Project** de l'OIM recense les décès sur les routes migratoires.
- Des associations d'aide dans le désert : Humane Borders, No More Deaths, Colibri Center (identification des disparus).

Les chiffres évoluent chaque année. Vérifiez-les dans ces sources avant de les donner aux élèves.

## Limites du prototype

- Voix synthétiques : à remplacer par des enregistrements (voir le script d'enregistrement).
- Personnages stylisés, sans expressions faciales : la nuit et la distance laissent l'imagination faire le reste.
- Les témoignages sont des **récits composites fictifs**. Ils sont écrits pour être plausibles, mais ce ne sont pas des citations de personnes réelles.
