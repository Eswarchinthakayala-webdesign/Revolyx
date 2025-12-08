// api/oui.js
import fetch from "node-fetch"; // Vercel node includes fetch, but node-fetch is safe; you can use global fetch if available

let OUI_MAP = null;
let LOADING = false;

// Parse IEEE OUI text file (oui.txt from standards-oui.ieee.org)
async function loadOuiMap() {
  if (OUI_MAP) return OUI_MAP;
  if (LOADING) {
    // wait until available
    while (LOADING) await new Promise((r) => setTimeout(r, 100));
    return OUI_MAP;
  }
  LOADING = true;
  try {
    // fetch the authoritative OUI file (may change); you can vendor this file in your repo for reliability
    const url = "https://standards-oui.ieee.org/oui/oui.csv"; // CSV is easier to parse
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Failed to fetch OUI list ${r.status}`);
    const text = await r.text();

    // CSV format: registry,assignment,org_name,org_address
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const map = {};
    for (const ln of lines.slice(1)) { // skip header
      const cols = ln.split(",");
      if (cols.length < 3) continue;
      const assignment = cols[1].replace(/"/g, "").trim();
      const org = cols[2].replace(/"/g, "").trim();
      // assignment often formatted as "00-1A-2B"
      const prefix = assignment.replace(/-/g, ":").toUpperCase().split(":").slice(0,3).join(":");
      map[prefix] = org;
    }
    OUI_MAP = map;
    return OUI_MAP;
  } finally {
    LOADING = false;
  }
}

export default async function handler(req, res) {
  try {
    const { mac } = req.query || {};
    if (!mac) return res.status(400).json({ error: "mac param required (3-octet prefix or full MAC)" });

    const normalized = String(mac).toUpperCase().replace(/-/g, ":");
    const parts = normalized.split(":").slice(0, 3);
    if (parts.length < 3) return res.status(400).json({ error: "mac must include at least 3 octets" });
    const prefix = parts.join(":");

    const map = await loadOuiMap();
    const vendor = map[prefix] || null;

    return res.status(200).json({ oui: prefix, vendor });
  } catch (err) {
    console.error("oui error", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
