# Un Petit Coeur Qui Bat - Scrollytelling Project

## Vue d'ensemble du projet
Projet de scrollytelling interactif contrôlé par la souris. L'utilisateur contrôle la tête de lecture d'une vidéo via le scroll de la molette, avec des événements déclenchés à des moments précis (affichage d'éléments HTML, sons, etc.).

## Technologies utilisées
- **JavaScript Vanilla** (pas de framework)
- **GSAP avec ScrollTrigger** pour gérer le scroll
- **HTML5 Video API** pour le contrôle de la vidéo
- **Web Audio API** pour les sons

## Assets disponibles
```
/assets/
  - test.mp4 (~26MB) - vidéo principale
  - coeur1.mp3 - son 1
  - coeur2.mp3 - son 2
```

## Structure des fichiers

### 1. events.json
Configuration principale du projet contenant :

#### Structure :
```json
{
  "speedRoadmap": [
    {
      "timeStart": 0,
      "timeEnd": 12,
      "speed": 1.4
    },
    {
      "timeStart": 12,
      "timeEnd": 15,
      "speed": 0.4
    },
    {
      "timeStart": 15,
      "timeEnd": 20,
      "speed": 2.0
    }
  ],
  "events": [
    {
      "type": "element",
      "elementId": "text1",
      "timeIn": 5.2,
      "timeOut": 10.5
    },
    {
      "type": "sound",
      "file": "coeur1.mp3",
      "timeIn": 3.0,
      "timeOut": 15.0,
      "loop": true
    }
  ]
}
```

**speedRoadmap** : Définit la vitesse de défilement selon le bracket de temps
- `timeStart` : début du bracket (en secondes)
- `timeEnd` : fin du bracket (en secondes)
- `speed` : multiplicateur de vitesse (plus élevé = avance plus vite)

**events** : Tableau d'événements à déclencher

Types d'événements :
1. **element** : Affiche/cache un élément HTML
   - `elementId` : ID de l'élément HTML à contrôler
   - `timeIn` : moment où l'élément apparaît (secondes)
   - `timeOut` : moment où l'élément disparaît (secondes)

2. **sound** : Joue un fichier audio
   - `file` : nom du fichier dans /assets/
   - `timeIn` : moment de démarrage (secondes)
   - `timeOut` : moment d'arrêt (secondes)
   - `loop` : true/false - si le son doit boucler

### 2. index.html
Structure HTML de base contenant :
- Barre de progression pour le preloader
- Bouton "Play" initial (requis pour autoriser la lecture audio)
- Vidéo sticky positionnée en haut de page
- Containers placeholder pour les éléments à afficher (textes, images, etc.)

### 3. style.css
Styles pour :
- Vidéo : responsive, sticky, occupe une bonne portion de la largeur, ne dépasse pas sur petits écrans
- Preloader : barre de progression simple
- Bouton Play : simple et fonctionnel
- Éléments placeholder : positionnés via CSS (exemples au bas de l'écran)

### 4. script.js
Logique principale de l'application

## Fonctionnalités détaillées

### Système de Preload
- Charge la vidéo (test.mp4) et tous les sons (coeur1.mp3, coeur2.mp3)
- Affiche une barre de progression pendant le chargement
- Une fois terminé, affiche le bouton "Play"

### Bouton Play Initial
- Gros bouton simple permettant de démarrer l'expérience
- **Requis** pour permettre la lecture des sons (contrainte des navigateurs)
- Au clic : cache le bouton, démarre l'expérience

### Système de Scroll Virtuel
- **Pas de hauteur de page longue** : la page reste courte
- Capture les événements de la molette (`wheel` events)
- Calcule une position virtuelle de scroll
- Convertit cette position en `currentTime` de la vidéo
- Supporte le scroll avant ET arrière

### Speed Roadmap
- Lit le `speedRoadmap` du JSON
- Selon le `currentTime` actuel, détermine dans quel bracket on se trouve
- Applique le multiplicateur de vitesse correspondant
- Ajuste la conversion scroll → temps de vidéo en temps réel

### Système d'événements - Éléments HTML

**Comportement :**
- Vérifie à chaque update si `currentTime` est entre `timeIn` et `timeOut`
- Si oui : affiche l'élément (retire classe `.hidden` ou `display: block`)
- Si non : cache l'élément (ajoute classe `.hidden` ou `display: none`)
- Pas de fade in/out (géré par CSS si désiré plus tard)

**Gestion du scroll arrière :**
- Les éléments se cachent automatiquement si on sort de leur bracket de temps

### Système d'événements - Sons

**Comportement des sons AVEC loop :**
- Si `currentTime` entre `timeIn` et `timeOut` : le son joue en boucle
- Si on sort du bracket : le son s'arrête et se "clean"
- Si on revient dans le bracket : le son redémarre

**Comportement des sons SANS loop :**
- Le son se joue quand on atteint `timeIn`
- **SAUF** si on a déjà dépassé `timeOut` (scroll rapide)
- Si on scroll en arrière et repasse le `timeIn` : le son peut rejouer
- Le son s'arrête à `timeOut`

**Gestion importante :**
- Cleanup strict des sons lors du scroll arrière pour éviter :
  - Répétitions de sons
  - Sons qui continuent en arrière-plan
  - Bugs de superposition
- Les sons peuvent se superposer intentionnellement
- Chaque son doit être une instance Audio distincte

### Synchronisation Vidéo
- Le `currentTime` de la vidéo est directement contrôlé par la position de scroll virtuel
- La vidéo ne "joue" pas automatiquement, elle est "scrubbed"
- Permet d'avancer et reculer frame par frame selon le scroll

## Positionnement et UI

### Vidéo
- Sticky en haut de la page
- Toujours visible pendant le scroll
- Prend une bonne portion de la largeur (environ 70-80% ?)
- Responsive : ne dépasse pas la largeur sur petits écrans
- Centrée horizontalement

### Éléments overlay
- Positionnables via CSS (flexibilité totale)
- Dans le premier prototype : exemples de boîtes placeholder au bas de l'écran
- Chaque élément a un ID unique référencé dans events.json

## Points d'attention technique

### Cleanup des sons
- **Critique** : bien gérer l'arrêt et le nettoyage des sons lors du scroll arrière
- Vérifier qu'un son n'est pas déjà en train de jouer avant de le relancer
- Utiliser `audio.pause()` et `audio.currentTime = 0` pour reset

### Performance
- Throttle/debounce des wheel events si nécessaire
- Éviter de recalculer inutilement la vitesse à chaque frame

### Edge cases
- Que se passe-t-il si on scroll très rapidement ?
- Gestion de la fin de vidéo (limite max du currentTime)
- Gestion du début (currentTime ne peut pas être négatif)

## Prochaines étapes d'implémentation

1. ✅ Créer events.json avec structure speedRoadmap et events sample
2. ✅ Créer index.html avec vidéo, preloader, bouton play, éléments placeholder
3. ✅ Créer style.css avec positionnement vidéo et styles de base
4. ⏳ Implémenter le système de preload (vidéo + sons)
5. ⏳ Implémenter le scroll virtuel avec wheel events
6. ⏳ Implémenter le speed roadmap
7. ⏳ Implémenter le système d'événements pour éléments HTML
8. ⏳ Implémenter le système de sons avec loop et cleanup
9. ⏳ Tester le scroll avant/arrière et vérifier le cleanup

## Notes pour reprendre la session
- Le projet est dans `/mnt/e/samp/htdocs/icayer/unPtitCoeurQuiBat/`
- Assets sont dans `/assets/`
- Utiliser GSAP CDN pour ScrollTrigger
- Pas besoin d'animations fancy pour le prototype
- Focus sur la fonctionnalité et la robustesse du système de scroll/événements
