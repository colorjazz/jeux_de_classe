# Chapitre 1 : Le sable · Script d'enregistrement des voix

Pour remplacer les voix de synthèse par de vraies voix, enregistrez chaque réplique dans un fichier **MP3**, nommé exactement comme dans la colonne « Fichier ».

Déposez les fichiers dans `frontiere-mexique/voix/`, puis ajoutez leurs noms (sans `.mp3`) dans `frontiere-mexique/voix/liste.json`, par exemple :

```json
["depart", "enfant", "mere"]
```

Les répliques enregistrées sont jouées en son 3D, depuis l'endroit où se trouve le personnage. Celles qui ne sont pas enregistrées gardent la voix de synthèse : on peut donc avancer petit à petit.

**Attention :** les enregistrements ne fonctionnent que sur le site en ligne (Netlify). Si on ouvre le fichier en double-cliquant, le navigateur bloque la lecture et la synthèse prend le relais.

## Conseils

- Un comédien ou une comédienne par personnage, toujours le même. Accents : mexicain pour le guide et Don Ernesto, centraméricain pour Rosa, Mateo, Julio et Yesenia. Pour Yesenia, dont la langue maternelle est le mam, un espagnol plus hésitant.
- Enregistrez dans une pièce calme, sans écho, à 20–30 cm du micro. Laissez une demi-seconde de silence avant et après.
- Les migrants parlent bas : ils se cachent. Même les cris d'alerte sont étouffés, sauf au moment de l'arrestation.
- Les agents crient fort, vite, sans hésitation.
- Format : MP3, mono, 44,1 kHz, 128 kb/s suffisent.

## Les répliques, dans l'ordre de l'histoire

| Fichier | Personnage | Ton | Texte à dire | Sens |
|---|---|---|---|---|
| `murAttente.mp3` | Le guide | chuchoté | Uno por uno. Rápido y sin ruido. | Un par un. Vite, et sans bruit. |
| `murMateo.mp3` | Rosa | tendre, doux | Agárrate fuerte, mijo. No mires abajo. | Tiens-toi bien, mon chéri. Ne regarde pas en bas. |
| `murJoueur.mp3` | Julio | chuchoté, pressé | ¡Sube! ¡Te toca! | Monte ! C'est ton tour ! |
| `murApres.mp3` | Le guide | chuchoté | Ya estamos del otro lado. Ahora empieza lo difícil. | On est de l'autre côté. Maintenant, le plus dur commence. |
| `depart.mp3` | Le guide | chuchoté | Sin luces. Sin hablar. Caminen detrás de mí. | Pas de lumière. Pas un mot. Marchez derrière moi. |
| `enfant.mp3` | Mateo (9 ans) | épuisé | Mami… ¿falta mucho? | Maman… c'est encore loin ? |
| `mere.mp3` | Rosa | tendre, doux | Ya casi, mijo. Ya casi. | Presque, mon chéri. Presque. |
| `yesenia1.mp3` | Yesenia | tendre, doux | Me llamo Yesenia. ¿Y tú? | Je m'appelle Yesenia. Et toi ? |
| `yesenia2.mp3` | Yesenia | tendre, doux | …No hablas mucho. Yo tampoco. | … Tu ne parles pas beaucoup. Moi non plus. |
| `julio1.mp3` | Julio | triste, retenu | Mi hija tiene cinco años. Está en Los Ángeles. Ya ni se acuerda de mi cara. | Ma fille a cinq ans. Elle est à Los Angeles. Elle ne se souvient même plus de mon visage. |
| `coyoteEnfant.mp3` | Mateo (9 ans) | apeuré | Mami, ¿qué es eso? | Maman, c'est quoi ça ? |
| `coyoteMere.mp3` | Rosa | chuchoté | Coyotes. No me sueltes la mano. | Des coyotes. Ne lâche pas ma main. |
| `cruz1.mp3` | Yesenia | triste, retenu | Aquí murió alguien. | Quelqu'un est mort ici. |
| `cruz2.mp3` | Rosa | triste, retenu | Que Dios lo tenga en su gloria. | Que Dieu l'accueille. |
| `halte.mp3` | Le guide | chuchoté | Descansen. Cinco minutos. Nada más. | Reposez-vous. Cinq minutes. Pas plus. |
| `eau.mp3` | Julio | tendre, doux | Toma. Poquito, ¿eh? Hay que guardar. | Tiens. Juste un peu, hein ? Il faut en garder. |
| `eauMerci.mp3` | Julio | tendre, doux | Así. Despacito. | Voilà. Doucement. |
| `berceuse.mp3` | Rosa | chanté tout bas | Duérmete, mi niño, duérmete ya… | Dors, mon petit, dors maintenant… |
| `ernestoHalte.mp3` | Don Ernesto (61 ans) | triste, retenu | Mi hijo me espera en Phoenix. Hace nueve años que no lo veo. | Mon fils m'attend à Phoenix. Ça fait neuf ans que je ne l'ai pas vu. |
| `repart.mp3` | Le guide | chuchoté, pressé | Vámonos. Arriba, arriba. | On y va. Debout, debout. |
| `rythme.mp3` | Le guide | chuchoté, pressé | Rápido. Antes de que salga el sol. | Plus vite. Avant que le soleil se lève. |
| `froid.mp3` | Mateo (9 ans) | épuisé | Mami, tengo frío. | Maman, j'ai froid. |
| `soif.mp3` | Don Ernesto (61 ans) | épuisé | Agua… ¿queda agua? | De l'eau… il reste de l'eau ? |
| `soifReponse.mp3` | Julio | triste, retenu | Ya no queda, don Ernesto. Aguante. | Il n'en reste plus, don Ernesto. Tenez bon. |
| `fausseAlerte.mp3` | Le guide | chuchoté, pressé | ¡Quietos! ¡Abajo! No se muevan. | Stop ! À terre ! Ne bougez plus. |
| `fausseFin.mp3` | Le guide | chuchoté | Ya pasó. Era la carretera. Vámonos. | C'est passé. C'était la route. On y va. |
| `attendre.mp3` | Julio | chuchoté, pressé | ¡Oye! ¡Apúrate! | Hé ! Dépêche-toi ! |
| `attendre2.mp3` | Rosa | chuchoté, pressé | No te quedes atrás… | Ne reste pas derrière… |
| `perdu.mp3` | Yesenia | apeuré | ¿Dónde estás? Por aquí… | Où es-tu ? Par ici… |
| `chute.mp3` | Don Ernesto (61 ans) | douleur, souffle court | Ay… no puedo… mis piernas… | Aïe… je ne peux plus… mes jambes… |
| `aide.mp3` | Don Ernesto (61 ans) | tendre, doux | Gracias, hijo. Dios te lo pague. | Merci, mon fils. Que Dieu te le rende. |
| `aideAutre.mp3` | Julio | chuchoté, pressé | Arriba, don Ernesto. Arriba. | Debout, don Ernesto. Debout. |
| `espoir1.mp3` | Le guide | soulagé, presque joyeux | ¿Ven esas luces? Allá es. Ya casi llegamos. | Vous voyez ces lumières ? C'est là. On y est presque. |
| `espoir2.mp3` | Rosa | soulagé, presque joyeux | Mira, mijo… mira. | Regarde, mon chéri… regarde. |
| `espoir3.mp3` | Mateo (9 ans) | soulagé, presque joyeux | ¿Allá vive mi tía? | C'est là qu'habite ma tante ? |
| `espoir4.mp3` | Rosa | tendre, doux | Sí, mi amor. Allá. | Oui, mon amour. Là-bas. |
| `chut.mp3` | Le guide | chuchoté, pressé | Shhh… ¡Esperen! | Chut… Attendez ! |
| `alerte.mp3` | Le guide | crié | ¡Escóndanse! ¡Al suelo! ¡Ya! | Cachez-vous ! À plat ventre ! Vite ! |
| `panique.mp3` | Rosa | crié | ¡Mateo! ¡Mateo, no te muevas! | Mateo ! Mateo, ne bouge pas ! |
| `priere.mp3` | Yesenia | apeuré | Dios mío, Dios mío… | Mon Dieu, mon Dieu… |
| `agent1.mp3` | Un agent (anglais) | crié | Border Patrol! Stay down! Stay down! | Police des frontières ! Restez à terre ! À terre ! |
| `agent2.mp3` | Un agent (anglais) | crié | Show me your hands! Hands! | Montrez vos mains ! Les mains ! |
| `agent3.mp3` | Un agent (anglais) | crié | Get up on your knees! Hands up! Now! | À genoux ! Les mains en l'air ! Tout de suite ! |
