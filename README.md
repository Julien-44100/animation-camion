# Nowirly · motion design promotionnel

Vidéo de 33 secondes qui présente Nowirly : un seul prompt génère la maquette web, le code et les visuels marketing d'une marque.

## Livrables

| Fichier | Format | Usage conseillé |
| --- | --- | --- |
| `exports/nowirly-motion-16x9.mp4` | 1920 × 1080, 60 i/s, H.264 | site web, LinkedIn, YouTube, présentations |
| `exports/nowirly-motion-9x16.mp4` | 1080 × 1920, 60 i/s, H.264 | Reels, TikTok, Stories, Shorts |
| `exports/nowirly-poster-16x9.png`, `exports/nowirly-poster-9x16.png` | image de fin | miniature, couverture |
| `nowirly-motion.html` | page autonome | lecteur interactif : lecture, timeline, bascule 16:9 / 9:16 |

Les vidéos sont muettes. Ajoutez la musique au moment de publier, depuis la bibliothèque sonore d'Instagram, TikTok ou LinkedIn.

En 9:16, les titres et les textes restent entre 150 et 1 600 px de hauteur, au-dessus de la zone des légendes et des boutons des réseaux sociaux.

## Storyboard

| Temps | Scène | Ce qu'on voit |
| --- | --- | --- |
| 0 – 4 s | Accroche | « D'habitude, pour lancer un projet : Maquette + un designer, Code + un développeur, Visuels + un graphiste. » Puis : « Ou un seul prompt. » |
| 4 – 8,5 s | Prompt | Le prompt « Crée le site et la campagne de lancement de Trajeo, transporteur B2B. » est tapé, les trois livrables sont cochés, clic sur « Générer ». |
| 8,5 – 13 s | 01 · Maquette | Un wireframe se construit puis se transforme en page d'accueil finie, avec sélection du titre, mesure d'espacement et styles de la marque. |
| 13 – 19 s | 02 · Code | Le composant `Hero.tsx` s'écrit, la version mobile s'affiche dans un téléphone, puis « Compilé sans erreur », « Responsive sur mobile », « Prêt à déployer ». |
| 19 – 24,5 s | 03 · Visuels | Post 1:1, Story 9:16, Pub 4:5 et bannière LinkedIn 4:1 aux couleurs de la marque. |
| 24,5 – 28,5 s | Convergence | « Un seul prompt. Maquette, code et visuels, orchestrés par l'IA. » Les trois livrables tournent autour du logo puis s'y fondent. |
| 28,5 – 33 s | Carte de fin | Logo Nowirly, « L'IA au service du B2B. », Maquettes · Code · Visuels marketing, nowirly.com, @nowirly. |

Trajeo est une marque fictive inventée pour la démonstration.

## Identité visuelle

- Fond encre `#0C0F24` et papier `#EEF0F7`.
- Une couleur par livrable : rose `#FF4F86` (maquette), menthe `#22D6A0` (code), ambre `#FFB23E` (visuels).
- Typographies : Bricolage Grotesque (titres), Inter (interface), JetBrains Mono (code et étiquettes), toutes sous licence SIL Open Font License et intégrées dans la page.
- Le pictogramme en spirale et le logotype « Nowirly » sont des propositions. Pour utiliser le logo officiel, remplacez la fonction `whirlSVG()` et le contenu de `#wordmark` dans `src/nowirly-motion.html`.

## Modifier et réexporter

Prérequis : Node 18 ou plus récent, ffmpeg, Playwright avec Chromium.

```bash
npm install
npm run build              # génère nowirly-motion.html avec les polices intégrées
npm run render:landscape   # exports/nowirly-motion-16x9.mp4
npm run render:portrait    # exports/nowirly-motion-9x16.mp4
node scripts/render.mjs stills landscape 3,12,31   # images fixes aux instants donnés
```

- Textes, couleurs et positions : `src/nowirly-motion.html` (variables CSS en tête de fichier, mise en page par format avec les classes `.L` et `.P`).
- Rythme : la fonction `makeTimeline()` place chaque animation à un instant précis, en secondes.
- Rendu : `scripts/render.mjs` capture l'animation image par image, donc la vidéo est identique à l'aperçu, sans saccade. Variables utiles : `FPS` (60 par défaut), `WORKERS` (pages en parallèle), `CRF` (qualité, 17 par défaut).
