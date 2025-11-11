import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const baseDir = path.join(__dirname, "node_modules", "ui-neumorphism");

function scanFiles(dir) {
  const files = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) files.push(...scanFiles(fullPath));
    else if (file.endsWith(".js")) files.push(fullPath);
  }
  return files;
}

function extractExports(content) {
  const names = [];
  const regex = /export\s+(?:const|function|class)\s+([A-Z]\w*)/g;
  let match;
  while ((match = regex.exec(content))) names.push(match[1]);
  return names;
}

console.log("🔍 Scanning ui-neumorphism deeply for exported components...\n");

const jsFiles = scanFiles(baseDir);
const allExports = new Set();

for (const file of jsFiles) {
  try {
    const content = fs.readFileSync(file, "utf-8");
    for (const name of extractExports(content)) allExports.add(name);
  } catch {}
}

if (allExports.size === 0) {
  console.log("⚠️  No component exports detected. The library may bundle everything into a single export.");
} else {
  console.log("🧱 Components found:\n");
  Array.from(allExports)
    .sort()
    .forEach(n => console.log("•", n));
}

console.log("\n✅ Deep scan complete!");
