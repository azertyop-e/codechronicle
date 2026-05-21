#!/usr/bin/env node
/**
 * Construit le corps du commentaire PR à partir des articles générés.
 * Usage : node script/build-pr-comment.js blog/article1.md blog/article2.md
 */

const { parseArticleFile } = require("./parse-frontmatter");

function buildCommentBody(articles) {
  if (articles.length === 0) {
    return `<!-- codechronicle-bot -->
## CodeChronicle — Génération IA

Aucun article avec frontmatter détecté dans cette PR.
Ajoutez un fichier \`blog/AAAA-MM-JJ-sujet.md\` vide pour déclencher la génération.`;
  }

  const blocks = articles.map((a) => {
    const tags =
      a.tags?.length > 0
        ? `\n**Tags :** ${a.tags.map((t) => `\`${t}\``).join(", ")}`
        : "";
    return `### ${a.title}

**Fichier :** \`${a.file}\`

**Résumé :** ${a.summary}${tags}`;
  });

  return `<!-- codechronicle-bot -->
## CodeChronicle — Aperçu généré par l'IA

${blocks.join("\n\n---\n\n")}

---
_Article(s) généré(s) automatiquement via GitHub Actions. Téléchargez l'artefact \`generated-articles-*\` pour récupérer les fichiers Markdown complets._`;
}

const files = process.argv.slice(2);
const articles = files.map(parseArticleFile).filter(Boolean);
process.stdout.write(buildCommentBody(articles));
