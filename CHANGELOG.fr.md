# Journal des modifications

[🇬🇧 English](CHANGELOG.md) · 🇫🇷 Français

Toutes les modifications notables du projet sont consignées ici. Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet utilise le [versionnage sémantique](https://semver.org/lang/fr/).

## [0.1.0] - 2026-10-17

Première version.

### Ajouté
- But de session capturé depuis le premier prompt substantiel (au moins 4 mots significatifs), ou défini avec `/anchor <but>`.
- `/anchor` pour afficher le but et `/anchor clear` pour l'effacer.
- Score de dérive fondé sur le recoupement de mots-clés avec le but et les sujets acceptés, lissé d'un prompt à l'autre, avec tolérance aux accents, aux pluriels et aux fautes.
- Bande au-dessus du prompt avec le but, une jauge de focus à 5 points et un bouton **Hide**.
- Notification après plusieurs prompts hors sujet avec un focus bas.
- Rappel du but dans le prompt système, plus ferme une fois la dérive détectée.
- Suite de tests couvrant la capture du but, le score, les fautes, la notification et le prompt système.
- Fichier marketplace pour installer le mod avec `/plugin install task-anchor --marketplace pquattro/task-anchor`.

### Corrigé
- Un premier message anodin (« on est bon ») ne devient plus le but de la session.
