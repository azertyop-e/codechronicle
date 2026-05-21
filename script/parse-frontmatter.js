const fs = require("fs");

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const readField = (key) => {
    const m = yaml.match(new RegExp(`^${key}:\\s*"(.*)"\\s*$`, "m"));
    if (m) return m[1].replace(/\\"/g, '"');
    const plain = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return plain ? plain[1].trim() : null;
  };

  const tags = [];
  const tagsBlock = yaml.match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (tagsBlock) {
    for (const line of tagsBlock[1].split("\n")) {
      const t = line.match(/^\s+-\s+(.+)$/);
      if (t) tags.push(t[1].trim());
    }
  }

  return {
    title: readField("title"),
    summary: readField("summary"),
    tags,
  };
}

function parseArticleFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8").trim();
  if (!content) return null;
  const meta = parseFrontmatter(content);
  if (!meta?.title || !meta?.summary) return null;
  return { file: filePath, ...meta };
}

module.exports = { parseFrontmatter, parseArticleFile };
