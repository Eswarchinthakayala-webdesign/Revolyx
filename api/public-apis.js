// pages/api/public-apis.js (Next.js / Node)
export default async function handler(req, res) {
  try {
    const r = await fetch("https://api.publicapis.org/entries");
    if (!r.ok) return res.status(r.status).send({ error: "Upstream error" });
    const json = await r.json();
    // Optionally: implement simple caching here
    res.status(200).json(json);
  } catch (err) {
    console.error("proxy fetch error:", err);
    res.status(502).json({ error: "Failed to fetch publicapis.org" });
  }
}
