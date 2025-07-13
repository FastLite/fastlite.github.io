// generate-posts-json.js
// Node.js script to scan blog/en/ and blog/ru/ for .md files and generate blog/posts.json

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, 'blog');
const LANGS = ['en', 'ru'];
const OUTPUT = path.join(BLOG_DIR, 'posts.json');

function parseFrontmatter(md) {
  const match = md.match(/^---([\s\S]*?)---/);
  if (!match) return {};
  const fm = {};
  match[1].split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      fm[key] = val;
    }
  });
  return fm;
}


function scanPosts() {
  let posts = [];
  for (const lang of LANGS) {
    const dir = path.join(BLOG_DIR, lang);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const filePath = path.join(dir, file);
      const md = fs.readFileSync(filePath, 'utf8');
      const fm = parseFrontmatter(md);
      if (fm.title && fm.date && fm.lang) {
        posts.push({
          file: path.join(lang, file).replace(/\\/g, '/'),
          title: fm.title,
          date: fm.date,
          lang: fm.lang,
          summary: fm.summary || ''
        });
      }
    }
  }
  // Удаляем записи, для которых не существует файла
  posts = posts.filter(post => {
    const absPath = path.join(BLOG_DIR, post.file);
    return fs.existsSync(absPath);
  });
  // Sort by date descending
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

function main() {
  const posts = scanPosts();
  fs.writeFileSync(OUTPUT, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`Wrote ${posts.length} posts to ${OUTPUT}`);
}

main();
