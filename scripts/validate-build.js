const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(htmlPath, "utf8");

if (!html.includes("<!doctype html>")) {
  throw new Error("index.html nao parece ser um documento HTML valido.");
}

const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/i);
if (!scriptMatch) {
  throw new Error("Nao foi encontrado o script principal embutido em index.html.");
}

new Function(scriptMatch[1]);

console.log("Build ok: site estatico validado.");
