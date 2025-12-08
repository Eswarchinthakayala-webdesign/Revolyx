// api/ping.js
import net from "net";

const DEFAULT_PORT = 443;
const DEFAULT_COUNT = 4;
const DEFAULT_TIMEOUT_MS = 2000;

// small helper to measure a TCP connect time
function tcpPingOnce(host, port, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const start = Date.now();
    let settled = false;
    const s = new net.Socket();

    const onDone = (obj) => {
      if (settled) return;
      settled = true;
      try { s.destroy(); } catch {}
      resolve(obj);
    };

    s.setTimeout(timeoutMs, () => onDone({ ok: false, err: "timeout", ms: null }));
    s.once("error", (err) => onDone({ ok: false, err: err.message, ms: null }));
    s.connect(port, host, () => {
      const ms = Date.now() - start;
      onDone({ ok: true, err: null, ms });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { host, port = DEFAULT_PORT, count = DEFAULT_COUNT, timeout = DEFAULT_TIMEOUT_MS } = req.body || {};

    if (!host || typeof host !== "string") return res.status(400).json({ error: "Missing host" });
    const cnt = Math.min(Math.max(Number(count) || DEFAULT_COUNT, 1), 20);
    const p = Number(port) || DEFAULT_PORT;
    const t = Number(timeout) || DEFAULT_TIMEOUT_MS;

    const values = [];
    for (let i = 0; i < cnt; i++) {
      // small delay between attempts to avoid hammering
      // Note: in serverless short sleeps consume execution time — keep small
      const r = await tcpPingOnce(host, p, t);
      values.push(r.ok ? r.ms : null);
    }

    return res.status(200).json({ host, port: p, values, note: "TCP-connect-based timings. Null = timeout/error" });
  } catch (err) {
    console.error("ping error", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
