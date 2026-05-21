#!/usr/bin/env node
/**
 * Génère un article Markdown complet à partir du nom de fichier (prompt).
 * Usage : node script/generate.js blog/2025-04-21-les-bases-de-github.md
 * Requiert : OPENAI_API_KEY
 */

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function promptFromFilename(filePath) {
  const base = path.basename(filePath, ".md");
  const match = base.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  const slug = match ? match[1] : base;
  return slug.replace(/-/g, " ");
}

function buildMarkdown({ title, summary, tags, content }) {
  const tagList = Array.isArray(tags) ? tags : [];
  const yamlTags =
    tagList.length > 0
      ? tagList.map((t) => `  - ${String(t).replace(/"/g, '\\"')}`).join("\n")
      : "  - devops";

  const escapeYaml = (s) => String(s).replace(/"/g, '\\"');

  return `---
title: "${escapeYaml(title)}"
summary: "${escapeYaml(summary)}"
tags:
${yamlTags}
---

${content.trim()}
`;
}

async function callOpenAI(topic) {
  const system = `Tu es rédacteur pour CodeChronicle, un blog technique DevOps en français.
À partir du sujet fourni, produis un article complet, pédagogique et structuré.
Réponds UNIQUEMENT en JSON valide avec ces clés :
- "title" : titre accrocheur
- "summary" : résumé en 1 à 2 phrases
- "tags" : tableau de 3 à 6 mots-clés (strings)
- "content" : corps en Markdown (titres ##/###, listes, exemples de code si pertinent), sans frontmatter`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Sujet de l'article : ${topic}`,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API (${response.status}) : ${err}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Réponse OpenAI vide");

  const parsed = JSON.parse(raw);
  for (const key of ["title", "summary", "tags", "content"]) {
    if (parsed[key] == null || parsed[key] === "") {
      throw new Error(`Champ manquant dans la réponse IA : ${key}`);
    }
  }
  return parsed;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage : node script/generate.js <chemin/vers/article.md>");
    process.exit(1);
  }

  if (!API_KEY) {
    console.error("Variable OPENAI_API_KEY requise.");
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Fichier introuvable : ${resolved}`);
    process.exit(1);
  }

  const existing = fs.readFileSync(resolved, "utf8").trim();
  if (existing.length > 0) {
    console.log(`[skip] ${filePath} — déjà rempli.`);
    return;
  }

  const topic = promptFromFilename(filePath);
  console.log(`[generate] Sujet : "${topic}" → ${filePath}`);

  const article = await callOpenAI(topic);
  const markdown = buildMarkdown(article);
  fs.writeFileSync(resolved, markdown, "utf8");
  console.log(`[ok] Article généré : ${article.title}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
