// api/dns.js
import dns from "dns/promises";

/**
 Query types supported: A, AAAA, CNAME, TXT, MX, NS, PTR
 Example: /api/dns?name=example.com&type=A
*/
export default async function handler(req, res) {
  try {
    const { name, type = "A" } = req.query || {};
    if (!name) return res.status(400).json({ error: "name required" });

    const qType = String(type).toUpperCase();
    let result = null;

    switch (qType) {
      case "A":
        result = await dns.resolve4(name);
        break;
      case "AAAA":
        result = await dns.resolve6(name);
        break;
      case "CNAME":
        result = await dns.resolveCname(name);
        break;
      case "TXT":
        result = await dns.resolveTxt(name);
        break;
      case "MX":
        result = await dns.resolveMx(name);
        break;
      case "NS":
        result = await dns.resolveNs(name);
        break;
      case "PTR":
        // PTR is normally reverse name; try reverse
        result = await dns.reverse(name);
        break;
      default:
        return res.status(400).json({ error: "unsupported type" });
    }

    return res.status(200).json({ name, type: qType, answer: result });
  } catch (err) {
    // dns.resolve throws detailed errors (e.g., ENODATA, ENOTFOUND)
    console.error("dns query error", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
