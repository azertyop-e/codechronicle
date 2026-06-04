#!/usr/bin/env node
/**
 * Transforme les articles blog/*.md en site statique dans public/.
 * Usage : npm run build
 */

const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const { parseFrontmatter } = require("./parse-frontmatter");

const ROOT = path.join(__dirname, "..");
const BLOG_DIR = path.join(ROOT, "blog");
const PUBLIC_DIR = path.join(ROOT, "public");
const ARTICLES_DIR = path.join(PUBLIC_DIR, "articles");

const STYLES = `
  :root {
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    color: #1a1a2e;
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  a { color: #2563eb; }
  h1 { color: #1a1a2e; margin-bottom: 0.25rem; }
  .meta { color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem; }
  .tags span {
    display: inline-block;
    background: #e2e8f0;
    color: #334155;
    font-size: 0.8rem;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    margin-right: 0.35rem;
  }
  article h2 { margin-top: 1.75rem; font-size: 1.25rem; }
  article h3 { margin-top: 1.25rem; }
  article pre {
    background: #0f172a;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 0.9rem;
  }
  article code {
    font-family: ui-monospace, monospace;
  }
  article p code {
    background: #f1f5f9;
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    font-size: 0.9em;
  }
  ul.articles { list-style: none; padding: 0; }
  ul.articles li {
    margin-bottom: 1.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid #e2e8f0;
  }
  ul.articles li:last-child { border-bottom: none; }
  ul.articles .summary { color: #475569; margin: 0.35rem 0; }
  .back { display: inline-block; margin-bottom: 1rem; font-size: 0.95rem; }
`;

function extractBody(content) {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return match ? match[1].trim() : content.trim();
}

function slugFromFilename(filename) {
  return path.basename(filename, ".md");
}

function dateFromSlug(slug) {
  const m = slug.match(/^(\d{4}-\d{2}-\d{2})-/);
  return m ? m[1] : null;
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(
    "fr-FR",
    { day: "numeric", month: "long", year: "numeric" }
  );
}

function pageShell({ title, description, body }) {
  const desc = description
    ? `<meta name="description" content="${escapeAttr(description)}">`
    : "";
  const pageTitle =
    title === "CodeChronicle" ? title : `${title} — CodeChronicle`;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  ${desc}
  <style>${STYLES}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, "&#39;");
}

function tagsHtml(tags) {
  if (!tags?.length) return "";
  return `<div class="tags">${tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>`;
}

function buildArticlePage(article) {
  const htmlBody = marked.parse(article.body, { gfm: true, breaks: false });
  const dateLabel = formatDate(article.date);

  const body = `
  <a class="back" href="../index.html">← Retour au blog</a>
  <h1>${escapeHtml(article.title)}</h1>
  <p class="meta">${dateLabel ? `${escapeHtml(dateLabel)} · ` : ""}${escapeHtml(article.summary)}</p>
  ${tagsHtml(article.tags)}
  <article>${htmlBody}</article>
`;

  return pageShell({
    title: article.title,
    description: article.summary,
    body,
  });
}

function buildIndex(articles) {
  const listItems =
    articles.length === 0
      ? "<li><em>Aucun article publié pour le moment.</em></li>"
      : articles
          .map((a) => {
            const dateLabel = formatDate(a.date);
            return `<li>
      <a href="articles/${escapeHtml(a.slug)}.html"><strong>${escapeHtml(a.title)}</strong></a>
      ${dateLabel ? `<br><small>${escapeHtml(dateLabel)}</small>` : ""}
      <p class="summary">${escapeHtml(a.summary)}</p>
      ${tagsHtml(a.tags)}
    </li>`;
          })
          .join("\n");

  const body = `
  <h1>CodeChronicle</h1>
  <p>Blog technique automatisé par IA.</p>
  <ul class="articles">
    ${listItems}
  </ul>
`;

  return pageShell({
    title: "CodeChronicle",
    description: "Blog technique DevOps automatisé par IA",
    body,
  });
}

function loadArticles() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.error(`Dossier introuvable : ${BLOG_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const articles = [];

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) continue;

    const meta = parseFrontmatter(content);
    if (!meta?.title || !meta?.summary) {
      console.warn(`[skip] Frontmatter incomplet : ${file}`);
      continue;
    }

    const slug = slugFromFilename(file);
    articles.push({
      ...meta,
      slug,
      date: dateFromSlug(slug),
      body: extractBody(content),
    });
  }

  articles.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return articles;
}

function main() {
  const articles = loadArticles();

  fs.mkdirSync(ARTICLES_DIR, { recursive: true });

  for (const article of articles) {
    const outPath = path.join(ARTICLES_DIR, `${article.slug}.html`);
    fs.writeFileSync(outPath, buildArticlePage(article), "utf8");
    console.log(`→ ${path.relative(ROOT, outPath)}`);
  }

  const indexPath = path.join(PUBLIC_DIR, "index.html");
  fs.writeFileSync(indexPath, buildIndex(articles), "utf8");
  console.log(`→ ${path.relative(ROOT, indexPath)}`);
  console.log(`[ok] ${articles.length} article(s) généré(s) dans public/`);
}

main();
