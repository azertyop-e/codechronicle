# CodeChronicle

[![GitHub](https://img.shields.io/badge/GitHub-codechronicle-181717?logo=github)](https://github.com)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

Blog technique automatisé par intelligence artificielle, avec chaîne DevOps complète (GitHub Actions, notifications Discord, déploiement FTP sur InfinityFree).

## Objectif

Automatiser la création, la gestion et la publication d’articles techniques générés par IA, depuis un fichier Markdown vide jusqu’à la mise en ligne sur un hébergeur web.

## Structure du projet

```
codechronicle/
├── blog/              # Articles Markdown (nom du fichier = prompt IA)
├── public/            # Site statique HTML généré
├── .github/workflows/ # Pipelines CI/CD
├── script/            # Scripts Node (génération IA)
├── package.json
└── README.md
```

## Démarrage local

```bash
npm install
export OPENAI_API_KEY="votre-clé"
node script/generate.js blog/2025-04-21-les-bases-de-github.md
```

### Secret GitHub requis

| Secret | Usage |
|--------|--------|
| `OPENAI_API_KEY` | Génération d’articles à l’ouverture d’une PR sur `main` |
| `DISCORD_WEBHOOK_URL` | Webhook Discord — notification au merge sur `main` |
| `BLOG_BASE_URL` | *(optionnel)* URL du blog en production (lien dans le message Discord) |

Le workflow [generate-article.yml](.github/workflows/generate-article.yml) détecte les fichiers `blog/*.md` **vides** ajoutés ou modifiés dans la PR, les enrichit via `script/generate.js`, publie le dossier `blog/` en artefact GitHub, puis poste un **commentaire automatique** sur la PR (titre + résumé IA).

Au **merge dans `main`**, [discord-notify.yml](.github/workflows/discord-notify.yml) envoie un message Discord avec le titre, le résumé IA et le lien vers l’article (`BLOG_BASE_URL/articles/<slug>.html`).

## Blog en production

> Lien InfinityFree à renseigner une fois le déploiement configuré : `https://votre-site.infinityfreeapp.com`

## État du projet

- [x] Initialisation Node.js et structure `blog/`
- [x] Génération automatique d’articles via GitHub Actions
- [x] Commentaire automatique sur les PR
- [x] Notification Discord au merge
- [ ] Génération du site statique
- [ ] Déploiement FTP sur InfinityFree

## Licence

ISC