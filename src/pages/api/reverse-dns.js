// api/reverse-dns.js
import dns from "dns/promises";

/**
 GET /api/reverse-dns?ip=1.2.3.4
*/
export default async function handler(req, res) {
  try {
    const { ip } = req.query || {};
    if (!ip) return res.status(400).json({ error: "ip required" });

    try {
      const ptr = await dns.reverse(ip);
      return res.status(200).json({ ip, ptr });
    } catch (err) {
      // return structured error but 200 so client can still display message
      console.error("reverse-dns error", err);
      return res.status(200).json({ ip, ptr: null, error: String(err?.code || err?.message || err) });
    }
  } catch (err) {
    console.error("reverse-dns outer error", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
