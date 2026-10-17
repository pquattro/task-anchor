# task-anchor

[🇬🇧 English](README.md) · 🇫🇷 Français

**Gardez le cap dans les longues sessions Claude Code.** `task-anchor` est un mod qui retient à quoi sert la session, repère quand la conversation s'en éloigne, et vous ramène, vous comme le modèle, vers le but.

## Pourquoi

Dans une longue session, chaque demande éloigne un peu le contexte de votre point de départ. Rien ne casse d'un coup : le travail cesse simplement, peu à peu, de servir le but initial. `task-anchor` rend cette dérive visible tôt et applique un contrepoids.

L'idée s'inspire de Johnson & Huo, *Competition for attention predicts good-to-bad tipping in AI* (Patterns, 2026) : le contexte accumulé oriente la suite, et injecter le bon contenu dans le contexte retarde la bascule. Un mod ne voit pas les états cachés d'un modèle, ce n'est donc **pas** une implémentation de leur formule, seulement la même intuition appliquée avec des signaux textuels.

## Ce que fait le mod

- **Retient le but.** Le premier prompt substantiel de la session (au moins 4 mots significatifs) devient le but. Les messages anodins comme « ok » ou « on est bon » sont ignorés. Vous pouvez le définir ou le changer à tout moment avec `/anchor <but>`.
- **Mesure la dérive.** Chaque prompt est comparé au but et aux sujets déjà jugés pertinents, par recoupement de mots-clés. Accents, pluriels et fautes de frappe sont tolérés. Les réponses très courtes (« ok », « oui, vas-y ») sont neutres. Le score est lissé : une question isolée hors sujet ne déclenche pas d'alerte.
- **L'affiche.** Une bande au-dessus du prompt montre le but et une jauge de focus à 5 points, en jaune quand le focus est bas. Un bouton **Hide** la masque.
- **Prévient.** Après plusieurs prompts hors sujet avec un focus bas, une notification vous invite à redéfinir le but ou à poursuivre.
- **Réancre le modèle.** Le but est ajouté au prompt système. Une fois la dérive détectée, le modèle doit expliquer le lien entre la demande en cours et le but, ou vérifier si le but a changé.

## Installation

Dans une session Claude Code en terminal :

```
/plugin install task-anchor --marketplace pquattro/task-anchor
```

Répondez `y` pour ajouter la marketplace, puis choisissez une portée.

Pour l'essayer depuis une copie locale :

```
claude --plugin-dir /chemin/vers/task-anchor
```

## Utilisation

| Commande | Effet |
| --- | --- |
| `/anchor <but>` | Définit le but et remet le focus à zéro |
| `/anchor` | Affiche le but courant |
| `/anchor clear` | Efface le but (le prochain prompt substantiel devient le nouveau) |

La dérive est normale quand vous changez volontairement de sujet. Tapez `/anchor <nouveau but>` et le suivi repart.

## Limites

- Le score est un **proxy lexical**, pas sémantique. Un prompt pertinent formulé avec un vocabulaire tout autre peut passer pour de la dérive, et un changement de sujet qui reprend les mots du but passe inaperçu.
- La tolérance aux fautes exige la même première lettre et, sous 5 lettres, une correspondance exacte.
- L'ajout au prompt système ne s'applique pas là où une organisation gère Claude Code et restreint les hooks `prompt.compose` des plugins installés.
- L'état est conservé par session, pas d'une session à l'autre.

## Développement

```
claude plugin validate .
claude plugin test .
```

Les tests sont dans `hooks/register.test.ts`. Le mod tient en un seul module de hooks, `hooks/register.tsx`.

## Licence

[MIT](LICENSE)
