// src/pages/SecurityToolsPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  AlertCircle,
  Copy,
  Download,
  Key,
  Lock,
  ShieldCheck,
  Zap,
  Settings,
  Globe,
  Clipboard,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../components/theme-provider";
import { Checkbox } from "@/components/ui/checkbox";

import { showToast } from "../lib/ToastHelper";


//
// Security Tools Page with OSM map for IP lookup
//

const TOOLS = {
  PASSWORD: "password_generator",
  AES: "aes_encrypt_decrypt",
  CLIP_MONITOR: "clipboard_monitor",
  IP_LOOKUP: "ip_lookup",
};

const DEFAULT_PASSWORD_LENGTH = 16;

function bufToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToBuf(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
function strToBuf(s) {
  return new TextEncoder().encode(s);
}
function bufToStr(buf) {
  return new TextDecoder().decode(buf);
}

function computeEntropy(length, poolSize) {
  const bits = length * Math.log2(poolSize || 1);
  return Number(bits.toFixed(2));
}

async function deriveKeyFromPassword(password, salt, iterations = 200000) {
  const pwKey = await window.crypto.subtle.importKey("raw", strToBuf(password), "PBKDF2", false, ["deriveKey"]);
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations,
      hash: "SHA-256",
    },
    pwKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
}

async function aesEncrypt(plaintext, password) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);
  const ct = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, strToBuf(plaintext));
  return {
    salt: bufToBase64(salt.buffer),
    iv: bufToBase64(iv.buffer),
    ciphertext: bufToBase64(ct),
    combined: `${bufToBase64(salt.buffer)}:${bufToBase64(iv.buffer)}:${bufToBase64(ct)}`,
  };
}

async function aesDecrypt(combined, password) {
  const parts = combined.split(":");
  if (parts.length !== 3) throw new Error("Invalid data format. Expect salt:iv:ciphertext (base64).");
  const salt = base64ToBuf(parts[0]);
  const iv = base64ToBuf(parts[1]);
  const ct = base64ToBuf(parts[2]);
  const key = await deriveKeyFromPassword(password, new Uint8Array(salt));
  const plainBuf = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, ct);
  return bufToStr(plainBuf);
}

function buildCharSet(opts) {
  const sets = [];
  if (opts.lowercase) sets.push("abcdefghijklmnopqrstuvwxyz");
  if (opts.uppercase) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (opts.digits) sets.push("0123456789");
  if (opts.symbols) sets.push("!@#$%^&*()-_=+[]{};:,.<>/?`~");
  return sets.join("");
}
function secureRandomFromCharset(charset, length) {
  const out = [];
  const pool = new Uint32Array(length);
  window.crypto.getRandomValues(pool);
  for (let i = 0; i < length; i++) {
    const idx = pool[i] % charset.length;
    out.push(charset.charAt(idx));
  }
  return out.join("");
}

async function fetchIpInfo(ip = "") {
  const target = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : `https://ipapi.co/json/`;
  const resp = await fetch(target, { method: "GET" });
  if (!resp.ok) throw new Error(`IP API error ${resp.status}`);
  return await resp.json();
}

// DYNAMIC Leaflet loader (only runs in browser)
function ensureLeafletLoaded() {
  // returns Promise that resolves to window.L
  if (typeof window === "undefined") return Promise.reject(new Error("Not in browser"));
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    // Insert CSS
    if (!document.querySelector('link[data-leaflet="true"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.setAttribute("data-leaflet", "true");
      // Optional integrity attributes removed for simplicity (CDN may change)
      document.head.appendChild(css);
    }

    // Insert script
    if (document.querySelector('script[data-leaflet-script="true"]')) {
      // script exists but L not ready yet: poll
      const check = () => {
        if (window.L) resolve(window.L);
        else setTimeout(check, 50);
      };
      check();
      return;
    }

    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.async = true;
    s.setAttribute("data-leaflet-script", "true");
    s.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet loaded but window.L missing"));
    };
    s.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.body.appendChild(s);
  });
}

export default function SecurityToolsPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [selectedTool, setSelectedTool] = useState(TOOLS.PASSWORD);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const resultRef = useRef(null);

  // Password
  const [pwLength, setPwLength] = useState(DEFAULT_PASSWORD_LENGTH);
  const [pwOpts, setPwOpts] = useState({
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: false,
  });
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [entropyBits, setEntropyBits] = useState(0);

  // AES
  const [aesPlain, setAesPlain] = useState("");
  const [aesPassword, setAesPassword] = useState("");
  const [aesCipher, setAesCipher] = useState("");

  // Clipboard monitor
  const [monitoring, setMonitoring] = useState(false);
  const [clipboardEvents, setClipboardEvents] = useState([]);
  const monitorRef = useRef({ listener: null, pasteListener: null });

  // IP lookup
  const [ipQuery, setIpQuery] = useState("");
  const [ipInfo, setIpInfo] = useState(null);
  const [ipLoading, setIpLoading] = useState(false);

  // Leaflet map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const handleGeneratePassword = useCallback(() => {
    const charset = buildCharSet(pwOpts);
    if (!charset || charset.length === 0) {
      showToast("error", "Please enable at least one character set.");
      return;
    }
    setLoading(true);
    try {
      const pw = secureRandomFromCharset(charset, pwLength);
      setGeneratedPassword(pw);
      const bits = computeEntropy(pwLength, charset.length);
      setEntropyBits(bits);
      setResult(`Generated password (${pwLength} chars) — entropy ${bits} bits.`);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      showToast("success", "Password generated");
    } catch (err) {
      console.error(err);
      showToast("error", "Generation failed");
    } finally {
      setLoading(false);
    }
  }, [pwLength, pwOpts]);

  const handleCopyPassword = useCallback(async () => {
    if (!generatedPassword) {
      showToast("error", "No password to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedPassword);
      showToast("success", "Password copied to clipboard");
    } catch {
      showToast("error", "Copy failed — user gesture required");
    }
  }, [generatedPassword]);

  const handleAesEncrypt = useCallback(async () => {
    if (!aesPlain) {
      showToast("error", "Enter plaintext to encrypt");
      return;
    }
    if (!aesPassword) {
      showToast("error", "Enter a password for key derivation");
      return;
    }
    setLoading(true);
    try {
      const out = await aesEncrypt(aesPlain, aesPassword);
      setAesCipher(out.combined);
      setResult("Encrypted (base64 salt:iv:ciphertext).");
      showToast("success", "Encrypted");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch (err) {
      console.error(err);
      showToast("error", `Encrypt failed: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  }, [aesPlain, aesPassword]);

  const handleAesDecrypt = useCallback(async () => {
    if (!aesCipher) {
      showToast("error", "Provide combined salt:iv:ciphertext (base64) to decrypt");
      return;
    }
    if (!aesPassword) {
      showToast("error", "Enter the password used during encryption");
      return;
    }
    setLoading(true);
    try {
      const plain = await aesDecrypt(aesCipher, aesPassword);
      setAesPlain(plain);
      setResult("Decryption successful — plaintext restored.");
      showToast("success", "Decrypted");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch (err) {
      console.error(err);
      showToast("error", `Decrypt failed: ${err?.message || err}`);
      setResult(`Decrypt error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  }, [aesCipher, aesPassword]);

  useEffect(() => {
    return () => {
      if (monitorRef.current.listener) window.removeEventListener("copy", monitorRef.current.listener);
      if (monitorRef.current.pasteListener) window.removeEventListener("paste", monitorRef.current.pasteListener);
      // cleanup leaflet map
      if (mapInstanceRef.current && typeof mapInstanceRef.current.remove === "function") {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const startMonitoring = useCallback(async () => {
    if (monitoring) return;
    setMonitoring(true);
    showToast("success", "Clipboard monitoring started (listening for copy/paste events).");

    const onCopy = (e) => {
      try {
        navigator.clipboard.readText?.().then((text) => {
          const item = { type: "copy", text, time: new Date().toISOString() };
          setClipboardEvents((s) => [item, ...s].slice(0, 25));
        }).catch(() => {
          const selection = window.getSelection()?.toString() || "";
          const item = { type: "copy", text: selection, time: new Date().toISOString() };
          setClipboardEvents((s) => [item, ...s].slice(0, 25));
        });
      } catch {
        // ignore
      }
    };
    monitorRef.current.listener = onCopy;
    window.addEventListener("copy", onCopy);

    const onPaste = (e) => {
      const text = e.clipboardData?.getData("text") || "";
      const item = { type: "paste", text, time: new Date().toISOString() };
      setClipboardEvents((s) => [item, ...s].slice(0, 25));
    };
    monitorRef.current.pasteListener = onPaste;
    window.addEventListener("paste", onPaste);

    try {
      const perm = await navigator.permissions?.query?.({ name: "clipboard-read" });
      if (perm?.state === "granted") {
        try {
          const text = await navigator.clipboard.readText();
          const item = { type: "initial", text, time: new Date().toISOString() };
          setClipboardEvents((s) => [item, ...s].slice(0, 25));
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }, [monitoring]);

  const stopMonitoring = useCallback(() => {
    if (!monitoring) return;
    setMonitoring(false);
    if (monitorRef.current.listener) {
      window.removeEventListener("copy", monitorRef.current.listener);
      monitorRef.current.listener = null;
    }
    if (monitorRef.current.pasteListener) {
      window.removeEventListener("paste", monitorRef.current.pasteListener);
      monitorRef.current.pasteListener = null;
    }
    showToast("success", "Stopped clipboard monitoring");
  }, [monitoring]);

  const handleCopyClipboardItem = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      showToast("success", "Copied to clipboard");
    } catch {
      showToast("error", "Copy failed");
    }
  }, []);

  const handleIpLookup = useCallback(async () => {
    setIpLoading(true);
    setIpInfo(null);
    setResult("");
    try {
      const info = await fetchIpInfo(ipQuery.trim() || "");
      setIpInfo(info);
      setResult(`IP lookup complete: ${info.ip || info.ip}`);
      showToast("success", "IP info fetched");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch (err) {
      console.error(err);
      showToast("error", `IP lookup failed: ${err?.message || err}`);
      setResult(`IP lookup error: ${err?.message || err}`);
    } finally {
      setIpLoading(false);
    }
  }, [ipQuery]);

  // initialize or update Leaflet map whenever ipInfo has lat/lon
  useEffect(() => {
    // require browser and lat/lon present
    const lat = ipInfo?.latitude ?? ipInfo?.lat ?? null;
    const lon = ipInfo?.longitude ?? ipInfo?.lon ?? ipInfo?.longitude === 0 ? ipInfo.longitude : null;

    if (!lat || !lon) {
      // if map exists but no coords now, remove map to avoid stale display
      if (mapInstanceRef.current && typeof mapInstanceRef.current.remove === "function") {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    let canceled = false;
    (async () => {
      try {
        const L = await ensureLeafletLoaded();
        if (canceled) return;
        // create map if doesn't exist
        if (!mapInstanceRef.current) {
          // clear container (if any)
          if (mapContainerRef.current) mapContainerRef.current.innerHTML = "";
          // initialize map
          mapInstanceRef.current = L.map(mapContainerRef.current, { attributionControl: true });
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(mapInstanceRef.current);
        }
        // set view and marker
        mapInstanceRef.current.setView([Number(lat), Number(lon)], 10);
        if (markerRef.current) {
          markerRef.current.setLatLng([Number(lat), Number(lon)]);
        } else {
          markerRef.current = L.marker([Number(lat), Number(lon)]).addTo(mapInstanceRef.current);
        }

        // popup content: ip and location summary
        const popupParts = [];
        if (ipInfo?.ip) popupParts.push(`<b>${ipInfo.ip}</b>`);
        if (ipInfo?.city || ipInfo?.region || ipInfo?.country_name) {
          popupParts.push(`${ipInfo.city || ""}${ipInfo.city ? ", " : ""}${ipInfo.region || ""}${(ipInfo.region && ipInfo.country_name) ? ", " : ""}${ipInfo.country_name || ipInfo.country || ""}`);
        }
        const popupHtml = popupParts.join("<br/>");
        markerRef.current.bindPopup(popupHtml || "Location").openPopup();
      } catch (err) {
        console.warn("Map init error:", err);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [ipInfo]);

  const toolLabel = useMemo(() => {
    switch (selectedTool) {
      case TOOLS.PASSWORD:
        return "Password Generator";
      case TOOLS.AES:
        return "AES Encrypt / Decrypt (AES-GCM, PBKDF2)";
      case TOOLS.CLIP_MONITOR:
        return "Clipboard Monitor";
      case TOOLS.IP_LOOKUP:
        return "IP Information Lookup";
      default:
        return "Security Tool";
    }
  }, [selectedTool]);

  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            Security Tools
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">Password generator • AES encrypt/decrypt • Clipboard monitor • IP lookup</p>
        </div>

        <div className="flex items-center gap-3">
      
          <Button className="cursor-pointer" variant="secondary" onClick={() => setDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" /> Info
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Controls</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300" >{selectedTool === TOOLS.CLIP_MONITOR ? "Monitor" : "Tool"}</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select tool</Label>
                <Select value={selectedTool} onValueChange={(v) => setSelectedTool(v)}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value={TOOLS.PASSWORD}>Password Generator</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.AES}>AES Encrypt / Decrypt</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.CLIP_MONITOR}>Clipboard Monitor</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.IP_LOOKUP}>IP Lookup</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                {selectedTool === TOOLS.PASSWORD && (
                  <>
                    <div className="space-y-4">
                    {/* Password Length */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                        <Label className="text-xs">Length</Label>
                        <span className="text-xs font-medium">{pwLength}</span>
                        </div>

                        <Slider
                        value={[pwLength]}
                        min={8}
                        max={64}
                        step={1}
                        onValueChange={(v) => setPwLength(v[0])}
                        className="cursor-pointer"
                        />
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                            className="cursor-pointer"
                            checked={pwOpts.lowercase}
                            onCheckedChange={(v) => setPwOpts(p => ({ ...p, lowercase: Boolean(v) }))}
                        />
                        <span>lowercase</span>
                        </label>

                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                            className="cursor-pointer"
                            checked={pwOpts.uppercase}
                            onCheckedChange={(v) => setPwOpts(p => ({ ...p, uppercase: Boolean(v) }))}
                        />
                        <span>UPPERCASE</span>
                        </label>

                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                            className="cursor-pointer"
                            checked={pwOpts.digits}
                            onCheckedChange={(v) => setPwOpts(p => ({ ...p, digits: Boolean(v) }))}
                        />
                        <span>digits</span>
                        </label>

                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                            className="cursor-pointer"
                            checked={pwOpts.symbols}
                            onCheckedChange={(v) => setPwOpts(p => ({ ...p, symbols: Boolean(v) }))}
                        />
                        <span>symbols</span>
                        </label>
                    </div>
                    </div>



                    <div className="flex gap-2 mt-3">
                      <Button className="flex-1 cursor-pointer" onClick={handleGeneratePassword} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />} Generate
                      </Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setGeneratedPassword(""); setResult(""); setEntropyBits(0); }}>
                        Clear
                      </Button>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      Entropy = length × log₂(poolSize). Aim for &gt; 80 bits for strong passwords.
                    </div>
                  </>
                )}

                {selectedTool === TOOLS.AES && (
                  <>
                    <Label className="text-xs">Password (for key derivation)</Label>
                    <Input type="password" value={aesPassword} onChange={(e) => setAesPassword(e.target.value)} />
                    <Label className="text-xs mt-3">Plaintext</Label>
                    <Textarea value={aesPlain} onChange={(e) => setAesPlain(e.target.value)} className="max-h-100 overflow-y-auto resize-none no-scrollbar " />
                    <Label className="text-xs mt-3">Cipher (salt:iv:ciphertext base64)</Label>
                    <Textarea value={aesCipher} onChange={(e) => setAesCipher(e.target.value)} className="max-h-100 overflow-y-auto resize-none no-scrollbar" />

                    <div className="flex gap-2 mt-3">
                      <Button onClick={handleAesEncrypt} className="flex-1 cursor-pointer" disabled={loading}>Encrypt</Button>
                      <Button onClick={handleAesDecrypt} variant="outline" className="flex-1 cursor-pointer" disabled={loading}>Decrypt</Button>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">Uses PBKDF2 (200k iterations) to derive AES-GCM-256 key locally in the browser. Keep passwords private.</div>
                  </>
                )}

                {selectedTool === TOOLS.CLIP_MONITOR && (
                  <>
                    <div className="flex items-center gap-2">
                      <Button onClick={startMonitoring} disabled={monitoring} className="flex-1 cursor-pointer">Start</Button>
                      <Button onClick={stopMonitoring} disabled={!monitoring} variant="outline" className="flex-1 cursor-pointer">Stop</Button>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      The monitor listens to copy/paste events and attempts to read clipboard with permission. Browsers restrict programmatic reads — user gestures may be required.
                    </div>
                  </>
                )}

                {selectedTool === TOOLS.IP_LOOKUP && (
                  <>
                    <Label className="text-xs">IP (leave empty to lookup your IP)</Label>
                    <Input value={ipQuery} onChange={(e) => setIpQuery(e.target.value)} placeholder="e.g., 8.8.8.8 or leave empty" />
                    <div className="flex gap-2 mt-3">
                      <Button onClick={handleIpLookup} className="flex-1 cursor-pointer" disabled={ipLoading}>Lookup</Button>
                      <Button className="cursor-pointer" onClick={() => { setIpQuery(""); setIpInfo(null); setResult(""); }} variant="outline">Clear</Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Uses a public IP info service (runtime fetch). Avoid sending private IPs to public APIs.</div>
                  </>
                )}

              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">{toolLabel}</CardTitle>
                <div className="text-xs text-muted-foreground">Client-first, privacy-conscious utilities</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(result || ""); }}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => {
                  if (!result) { showToast("error", "No output to download"); return; }
                  const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `security-output-${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast("success", "Downloaded");
                }}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setResult(""); showToast("success", "Cleared"); }}>Clear</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4  min-h-[220px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="animate-spin w-10 h-10 text-slate-500" />
                    <div className="text-sm text-muted-foreground mt-3">Processing…</div>
                  </div>
                ) : (
                  <>
                    {selectedTool === TOOLS.PASSWORD && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Generated password</div>
                          <div className="text-xs text-muted-foreground">Entropy: <span className="font-medium">{entropyBits} bits</span></div>
                        </div>

                        <div className="rounded border p-3 bg-white/60 dark:bg-black/60 flex items-center justify-between">
                          <div className="truncate pr-3 font-mono text-sm">{generatedPassword || <span className="text-muted-foreground">No password yet</span>}</div>
                          <div className="flex items-center gap-2">
                            <Button className="cursor-pointer" size="sm" variant="ghost" onClick={handleCopyPassword} disabled={!generatedPassword}><Copy className="w-4 h-4" /></Button>
                            <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => {
                              if (generatedPassword) {
                                setResult(`Password: ${generatedPassword}\nLength: ${pwLength}\nEntropy: ${entropyBits} bits`);
                                showToast("success", "Result prepared");
                              } else {
                                showToast("error", "No password to show");
                              }
                            }}>Show</Button>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">Tip: store long random passwords in a secure password manager. Avoid reusing passwords.</div>
                      </div>
                    )}

                    {selectedTool === TOOLS.AES && (
                      <div className="space-y-3">
                        <div className="text-xs text-muted-foreground">Encryption output uses format <code>salt:iv:ciphertext</code> (each base64).</div>

                        <div className="grid grid-cols-1 gap-2">
                          <div className="text-sm font-medium">Ciphertext</div>
                          <Textarea value={aesCipher} onChange={(e) => setAesCipher(e.target.value)} className="max-h-120 resize-none overflow-y-auto no-scrollbar" />
                        </div>

                        <div className="flex items-center gap-2">
                          <Button className="cursor-pointer" onClick={() => {
                            if (!aesCipher) { showToast("error", "No ciphertext to copy"); return; }
                            navigator.clipboard.writeText(aesCipher).then(() => showToast("success", "Copied ciphertext")).catch(() => showToast("error", "Copy failed"));
                          }}>Copy cipher</Button>
                          <Button className="cursor-pointer" onClick={() => {
                            if (!aesPlain) { showToast("error", "No plaintext to copy"); return; }
                            navigator.clipboard.writeText(aesPlain).then(() => showToast("success", "Copied plaintext")).catch(() => showToast("error", "Copy failed"));
                          }} variant="outline">Copy plaintext</Button>
                        </div>
                      </div>
                    )}

                    {selectedTool === TOOLS.CLIP_MONITOR && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Recent clipboard events</div>
                          <div className="text-xs text-muted-foreground">Showing up to 25 events</div>
                        </div>

                        <div className="rounded border p-3 min-h-[120px] max-h-[300px] overflow-y-auto   bg-white/60 dark:bg-black/60">
                          {clipboardEvents.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No events yet — perform copy/paste in this tab or grant clipboard permission.</div>
                          ) : (
                            <div className="space-y-2">
                              {clipboardEvents.map((it, idx) => (
                                <div key={idx} className="flex items-start justify-between gap-2">
                                  <div className=" overflow-hidden text-xs">
                                    <div className="text-xs text-muted-foreground">{it.type} • {new Date(it.time).toLocaleString()}</div>
                                    <div className="font-mono  truncate">{it.text}</div>
                                  </div>
                                  <div className="flex-shrink-0 flex flex-col gap-1 items-end">
                                    <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => handleCopyClipboardItem(it.text)}><Copy className="w-4 h-4" /></Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedTool === TOOLS.IP_LOOKUP && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Result</div>

                        <div className="rounded border p-3 min-h-[120px] max-h-[320px] overflow-auto bg-white/60 dark:bg-black/60">
                          {ipLoading ? (
                            <div className="text-sm text-muted-foreground">Fetching IP info…</div>
                          ) : ipInfo ? (
                            <div className="text-sm">
                              <div className="mb-2 font-medium">{ipInfo.ip || "—"} <span className="text-xs text-muted-foreground">({ipInfo.org || ""})</span></div>
                              <div className="grid grid-cols-1 gap-1 text-xs">
                                <div><strong>City:</strong> {ipInfo.city || "—"}</div>
                                <div><strong>Region:</strong> {ipInfo.region || "—"}</div>
                                <div><strong>Country:</strong> {ipInfo.country_name || ipInfo.country || "—"}</div>
                                <div><strong>Latitude,Longitude:</strong> {ipInfo.latitude ? `${ipInfo.latitude}, ${ipInfo.longitude}` : "—"}</div>
                                <div><strong>ASN:</strong> {ipInfo.asn || ipInfo.org || "—"}</div>
                                <div><strong>Timezone:</strong> {ipInfo.timezone || "—"}</div>
                                <div><strong>Postal:</strong> {ipInfo.postal || "—"}</div>
                                <div className="pt-2 text-xs text-muted-foreground">Full JSON:</div>
                                <pre className="text-xs max-h-36 overflow-auto bg-transparent">{JSON.stringify(ipInfo, null, 2)}</pre>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No result — try lookup.</div>
                          )}
                        </div>

                        {/* Map container: shows only when ipInfo has latitude & longitude */}
                        <div className="mt-3">
                          <div className="text-xs text-muted-foreground mb-2">Location map (OpenStreetMap)</div>
                          <div
                            ref={mapContainerRef}
                            id="ip-map"
                            className="w-full h-64 rounded border leaflet-container bg-white/60 dark:bg-black/60"
                            style={{ minHeight: 220 }}
                          >
                            {/* Map will be injected here when coords available */}
                            {(!ipInfo || (!ipInfo.latitude && !ipInfo.lat && !ipInfo.longitude && !ipInfo.lon)) && (
                              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                Map will appear here when a location is available.
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">Map tiles: OpenStreetMap. Click marker for details.</div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </main>

        <aside className="lg:col-span-3">
          <div className="space-y-4">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Details & Utilities</span>
                  <Settings className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Active tool</span>
                    <span className="font-medium text-sm">{toolLabel}</span>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    <div className="mb-2"><strong>AES notes:</strong> keys are derived locally via PBKDF2. Encrypted data format is <code>salt:iv:ciphertext</code> (base64). Keep passwords secret.</div>

                    <div><strong>Clipboard:</strong> browser security requires user gestures to allow programmatic reads. This monitor is best-effort and listens to copy/paste events in the page.</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button className="cursor-pointer" onClick={() => {
                    let blobText = "";
                    if (selectedTool === TOOLS.PASSWORD) blobText = `Password: ${generatedPassword}\nEntropy: ${entropyBits} bits`;
                    else if (selectedTool === TOOLS.AES) blobText = `Cipher: ${aesCipher}\nPlaintext: ${aesPlain ? "(present)" : "(empty)"}`;
                    else if (selectedTool === TOOLS.CLIP_MONITOR) blobText = `Clipboard events: ${clipboardEvents.length}`;
                    else if (selectedTool === TOOLS.IP_LOOKUP) blobText = `IP info: ${ipInfo ? JSON.stringify(ipInfo, null, 2) : "none"}`;
                    else blobText = result || "";

                    if (!blobText) { showToast("error", "Nothing to prepare"); return; }
                    const blob = new Blob([blobText], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `security-${selectedTool}-${Date.now()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast("success", "Prepared download");
                  }}>Export visible results</Button>

                  <Button className="cursor-pointer" variant="outline" onClick={() => {
                    setGeneratedPassword(""); setEntropyBits(0); setAesCipher(""); setAesPlain(""); setAesPassword("");
                    setClipboardEvents([]); setIpInfo(null); setResult("");
                    showToast("success", "Reset cleared");
                  }}>Reset all fields</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Security Tools Notes</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              These tools are client-side utilities. AES encryption/decryption uses PBKDF2 and AES-GCM in the browser — keep passwords safe and do not send passwords to remote servers.
            </p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>

      <div ref={resultRef} />
    </div>
  );
}
