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
├── .github/workflows/ # Pipelines CI/CD (à venir)
├── package.json
└── README.md
```

## Démarrage local

```bash
npm install
```

## Blog en production

> Lien InfinityFree à renseigner une fois le déploiement configuré : `https://votre-site.infinityfreeapp.com`

## État du projet

- [x] Initialisation Node.js et structure `blog/`
- [ ] Génération automatique d’articles via GitHub Actions
- [ ] Commentaire automatique sur les PR
- [ ] Notification Discord au merge
- [ ] Génération du site statique
- [ ] Déploiement FTP sur InfinityFree

## Licence

ISC
