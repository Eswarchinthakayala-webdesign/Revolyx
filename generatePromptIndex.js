import fs from "fs";


const OWNER = "x1xhlol";
const REPO = "system-prompts-and-models-of-ai-tools";
const BRANCH = "main";

const API = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;

async function run() {
  const res = await fetch(API);
  const data = await res.json();

  const index = {};

  data.tree.forEach((file) => {
    if (!file.path.endsWith(".txt")) return;

    const parts = file.path.split("/");
    const model = parts[parts.length - 2] || "Unknown";

    if (!index[model]) index[model] = [];

    index[model].push({
      name: file.path.split("/").pop(),
      path: file.path,
      category: parts[0],
    });
  });

  fs.writeFileSync(
    "src/data/aiPromptIndex.json",
    JSON.stringify(index, null, 2)
  );

  console.log("✅ Prompt index generated");
}

run();
