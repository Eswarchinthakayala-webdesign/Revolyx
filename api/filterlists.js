export default async function handler(req, res) {
  const path = req.query.path?.join("/") || "";
  const url = `https://api.filterlists.com/${path}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy error", details: err.message });
  }
}
