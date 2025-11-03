import React from "react";

// ✅ Proper Vite-compatible importAll function
function importAll(modules) {
  return Object.entries(modules).map(([path, src]) => ({
    name: path
      .split("/")
      .pop()
      .replace(".svg", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    src,
  }));
}

// ✅ Correct path for node_modules
const outlineModules = import.meta.glob(
  "/src/assets/teenyicons/outline/*.svg",
  { eager: true, query: "?url", import: "default" }
);

const solidModules = import.meta.glob(
  "/src/assets/teenyicons/solid/*.svg",
  { eager: true, query: "?url", import: "default" }
);

// ✅ Convert to usable arrays
const outlineIcons = importAll(outlineModules);
const solidIcons = importAll(solidModules);

const allTeenyIcons = [
  ...outlineIcons.map((icon) => ({ ...icon, type: "Outline" })),
  ...solidIcons.map((icon) => ({ ...icon, type: "Solid" })),
];

export default allTeenyIcons;
