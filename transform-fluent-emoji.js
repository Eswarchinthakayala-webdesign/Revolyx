import fs from "fs";
import path from "path";

// 🗂 Folder containing your JSON icon collections
const folderPath = "E:/Revolyx/src/IconData/json/json";

// 🚀 Read all .json files in the folder
const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".json"));

console.log(`Found ${files.length} files to process...`);

for (const file of files) {
  const filePath = path.join(folderPath, file);
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const iconNames = Object.keys(raw.icons || {});
    const reduced = {
      prefix: raw.prefix || path.basename(file, ".json"),
      total: iconNames.length,
      icons: Object.fromEntries(iconNames.map((name) => [name, true])),
    };

    fs.writeFileSync(filePath, JSON.stringify(reduced, null, 2));
    console.log(`✅ Processed ${file}: ${iconNames.length} icons`);
  } catch (err) {
    console.error(`❌ Error in ${file}:`, err.message);
  }
}

console.log("🎉 All files processed successfully!");
