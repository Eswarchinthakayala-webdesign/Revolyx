// api/port-check.js
import net from "net";

const DEFAULT_TIMEOUT_MS = 1500;

function tcpCheck(host, port, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let settled = false;
    const s = new net.Socket();

    const cleanup = (res) => {
      if (settled) return;
      settled = true;
      try { s.destroy(); } catch {}
      resolve(res);
    };

    s.setTimeout(timeoutMs, () => cleanup({ port, open: false, reason: "timeout" }));
    s.once("error", (e) => cleanup({ port, open: false, reason: e.message }));
    s.connect(port, host, () => cleanup({ port, open: true, reason: null }));
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { host, ports, timeout = DEFAULT_TIMEOUT_MS } = req.body || {};
    if (!host || !ports || !Array.isArray(ports) || ports.length === 0) return res.status(400).json({ error: "host and ports[] required" });

    if (ports.length > 50) return res.status(400).json({ error: "Too many ports (max 50)" });

    const checks = await Promise.all(ports.map((p) => {
      const portNum = Number(p);
      if (!Number.isFinite(portNum) || portNum <= 0 || portNum > 65535) return Promise.resolve({ port: p, open: false, reason: "invalid" });
      return tcpCheck(host, portNum, Number(timeout));
    }));

    return res.status(200).json({ host, results: checks });
  } catch (err) {
    console.error("port-check error", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
