#!/usr/bin/env node
/**
 * Envoie une notification Discord pour chaque article publié.
 * Usage : node script/discord-notify.js blog/article1.md [blog/article2.md ...]
 * Requiert : DISCORD_WEBHOOK_URL
 * Optionnel : BLOG_BASE_URL (ex. https://monblog.infinityfreeapp.com)
 */

const path = require("path");
const { parseArticleFile } = require("./parse-frontmatter");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const BLOG_BASE_URL = (process.env.BLOG_BASE_URL || "").replace(/\/$/, "");

function articleUrl(filePath) {
  if (!BLOG_BASE_URL) return null;
  const slug = path.basename(filePath, ".md");
  return `${BLOG_BASE_URL}/articles/${slug}.html`;
}

function buildEmbed(article) {
  const url = articleUrl(article.file);
  const fields = [
    { name: "Fichier", value: `\`${article.file}\``, inline: true },
  ];

  if (article.tags?.length > 0) {
    fields.push({
      name: "Tags",
      value: article.tags.map((t) => `\`${t}\``).join(" "),
      inline: true,
    });
  }

  if (url) {
    fields.push({ name: "Lire l'article", value: url });
  } else {
    fields.push({
      name: "Lien",
      value: "_À renseigner via le secret `BLOG_BASE_URL` une fois le site en ligne._",
    });
  }

  return {
    title: `📰 ${article.title}`,
    description: article.summary,
    color: 0x5865f2,
    fields,
    footer: { text: "CodeChronicle — nouvel article publié sur main" },
    timestamp: new Date().toISOString(),
  };
}

async function postToDiscord(embed) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "CodeChronicle",
      embeds: [embed],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Discord webhook (${response.status}) : ${err}`);
  }
}

async function main() {
  if (!WEBHOOK_URL) {
    console.error("Variable DISCORD_WEBHOOK_URL requise.");
    process.exit(1);
  }

    const files = process.argv.slice(2);
    console.log("📋 Fichiers à traiter :", files);
    const articles = files.map((f) => {
      const parsed = parseArticleFile(f);
      console.log(`  ${f} → ${parsed ? "✅ OK" : "❌ Pas de frontmatter"}`);
      return parsed;
    }).filter(Boolean);

  if (articles.length === 0) {
    console.log("[skip] Aucun article avec frontmatter à notifier.");
    return;
  }

  for (const article of articles) {
    console.log(`[discord] Notification : ${article.title}`);
    await postToDiscord(buildEmbed(article));
  }

  console.log(`[ok] ${articles.length} notification(s) envoyée(s).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
