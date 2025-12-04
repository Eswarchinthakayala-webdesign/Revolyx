// src/pages/WebUtilitiesPage.jsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  RefreshCcw,
  Clipboard,
  Hash,
  Code,
  Eye,
  Droplet,
  ShieldCheck,
  Search,
  Check,
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
import { showToast } from "../lib/ToastHelper";
import CryptoJS from "crypto-js";

/**
 * WebUtilitiesPage
 *
 * - Left column: controls & tool selector
 * - Center column: outputs / previews (markdown-like / textarea)
 * - Right column: details / quick actions (information about tool)
 *
 * Tools included:
 * - UUID generator
 * - Hash generator (MD5, SHA1, SHA256, SHA512)
 * - Base64 encoder/decoder
 * - Regex tester
 * - Color contrast checker (WCAG)
 * - Password strength checker
 */

// Small helper to copy and toast
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text || "");
    showToast("success", "Copied to clipboard");
  } catch {
    showToast("error", "Copy failed");
  }
}

// Password strength scoring (simple)
function scorePassword(pw = "") {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 5);
}

// Color luminance & contrast helpers
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const vals = h.length === 3
    ? [h[0]+h[0], h[1]+h[1], h[2]+h[2]]
    : [h.slice(0,2), h.slice(2,4), h.slice(4,6)];
  return vals.map(v => parseInt(v, 16) / 255);
}
function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055)/1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function computeContrast(hex1, hex2) {
  const L1 = relativeLuminance(hex1);
  const L2 = relativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return +( (lighter + 0.05) / (darker + 0.05) ).toFixed(2);
}

export default function WebUtilitiesPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  

  
  // active tool
  const TOOLS = {
    UUID: "uuid",
    HASH: "hash",
    BASE64: "base64",
    REGEX: "regex",
    CONTRAST: "contrast",
    PASSWORD: "password",
  };
  const [selectedTool, setSelectedTool] = useState(TOOLS.UUID);

  // UUID
  const [uuidCount, setUuidCount] = useState(5);
  const [uuids, setUuids] = useState([]);

  // Hash
  const [hashInput, setHashInput] = useState("");
  const [hashAlgo, setHashAlgo] = useState("MD5");
  const [hashOutput, setHashOutput] = useState("");

  // Base64
  const [b64Input, setB64Input] = useState("");
  const [b64Output, setB64Output] = useState("");

  // Regex
  const [regexText, setRegexText] = useState("");
  const [regexPattern, setRegexPattern] = useState("");
  const [regexFlags, setRegexFlags] = useState("g");
  const [regexMatches, setRegexMatches] = useState([]);

  // Contrast
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  // Password
  const [password, setPassword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const resultRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [uuidCopiedIndex, setUuidCopiedIndex] = useState(null);



  // ---------- Handlers / Logic ----------

  const handleGenerateUUIDs = useCallback(() => {
    const count = Math.min(Math.max(Number(uuidCount) || 1, 1), 100);
    const arr = Array.from({ length: count }, () => (crypto && crypto.randomUUID ? crypto.randomUUID() : fallbackUUID()));
    setUuids(arr);
    showToast("success", `Generated ${arr.length} UUID(s)`);
    setTimeout(()=> resultRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [uuidCount]);

  // fallback v4 UUID (if crypto.randomUUID not available)
  function fallbackUUID(){
    // simple RFC4122 v4 imitation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  const handleHash = useCallback(() => {
    try {
      if (!hashInput) {
        setHashOutput("");
        showToast("error", "Enter input to hash");
        return;
      }
      let out = "";
      if (hashAlgo === "MD5") {
        out = CryptoJS.MD5(hashInput).toString(CryptoJS.enc.Hex);
      } else if (hashAlgo === "SHA1") {
        out = CryptoJS.SHA1(hashInput).toString(CryptoJS.enc.Hex);
      } else if (hashAlgo === "SHA256") {
        out = CryptoJS.SHA256(hashInput).toString(CryptoJS.enc.Hex);
      } else if (hashAlgo === "SHA512") {
        out = CryptoJS.SHA512(hashInput).toString(CryptoJS.enc.Hex);
      }
      setHashOutput(out);
      showToast("success", `${hashAlgo} generated`);
      setTimeout(()=> resultRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch (err) {
      setHashOutput("");
      showToast("error", "Hashing failed");
      console.error(err);
    }
  }, [hashInput, hashAlgo]);

  const handleBase64Encode = useCallback(() => {
    try {
      setB64Output(btoa(unescape(encodeURIComponent(b64Input))));
      showToast("success", "Encoded to Base64");
    } catch {
      showToast("error", "Encoding failed");
      setB64Output("");
    }
  }, [b64Input]);

  const handleBase64Decode = useCallback(() => {
    try {
      const dec = decodeURIComponent(escape(atob(b64Input)));
      setB64Output(dec);
      showToast("success", "Decoded from Base64");
    } catch {
      showToast("error", "Invalid Base64 string");
      setB64Output("");
    }
  }, [b64Input]);

  const handleRegexTest = useCallback(() => {
    try {
      if (!regexPattern) {
        setRegexMatches([]);
        showToast("error", "Enter a regex pattern");
        return;
      }
      const re = new RegExp(regexPattern, regexFlags);
      const matches = [...regexText.matchAll(re)].map(m => m[0]);
      setRegexMatches(matches.length ? matches : []);
      showToast("success", `Found ${matches.length} match(es)`);
      setTimeout(()=> resultRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch (e) {
      setRegexMatches(["Invalid pattern"]);
      showToast("error", "Invalid regex pattern");
    }
  }, [regexText, regexPattern, regexFlags]);

  const contrast = useMemo(() => computeContrast(fgColor, bgColor), [fgColor, bgColor]);
  const wcag = useMemo(() => {
    const r = contrast;
    if (r >= 7) return "AAA";
    if (r >= 4.5) return "AA";
    if (r >= 3) return "AA Large";
    return "Fail";
  }, [contrast]);

  const passwordScore = useMemo(() => scorePassword(password), [password]);
  const passwordLabel = useMemo(() => ["Very weak","Weak","Fair","Good","Strong","Excellent"][passwordScore] || "Very weak", [passwordScore]);

  const handleGeneratePassword = useCallback((len = 16) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_+=[]{}|;:,.<>?";
    let p = "";
    for (let i=0;i<len;i++) p += charset[Math.floor(Math.random()*charset.length)];
    setPassword(p);
    showToast("success", "Password generated");
  }, []);

  const handleCopy = () => {
  const text =
    selectedTool === TOOLS.UUID ? uuids.join("\n") :
    selectedTool === TOOLS.HASH ? hashOutput :
    selectedTool === TOOLS.BASE64 ? b64Output :
    selectedTool === TOOLS.REGEX ? regexMatches.join("\n") :
    selectedTool === TOOLS.CONTRAST ? `${contrast}:1 (${wcag})` :
    selectedTool === TOOLS.PASSWORD ? password : "";

  copyToClipboard(text);
  
  setCopied(true);
  setTimeout(() => setCopied(false), 1200);
};

const handleUuidCopy = (uuid, index) => {
  copyToClipboard(uuid);
  setUuidCopiedIndex(index);
  setTimeout(() => setUuidCopiedIndex(null), 1200);
};

const strengthColor = {
  0: "backdrop-blur-md bg-red-500 border border-red-500/20 text-red-700 dark:text-red-300",
  1: "backdrop-blur-md bg-orange-500 border border-orange-500/20 text-orange-700 dark:text-orange-300",
  2: "backdrop-blur-md bg-amber-500 border border-amber-500/20 text-amber-700 dark:text-amber-300",
  3: "backdrop-blur-md bg-teal-500 border border-teal-500/20 text-teal-700 dark:text-teal-300",
  4: "backdrop-blur-md bg-emerald-500 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  5: "backdrop-blur-md bg-green-500 border border-green-500/20 text-green-700 dark:text-green-300",
}[passwordScore] || "bg-gray-400";

const strengthLabelColor = {
  0: "text-red-500",
  1: "text-orange-500",
  2: "text-yellow-600",
  3: "text-lime-500",
  4: "text-emerald-600",
  5: "text-green-600",
}[passwordScore] || "text-gray-500";

const wcagColor = {
  "AAA": "text-emerald-600",
  "AA": "text-green-600",
  "AA Large": "text-lime-600",
  "Fail": "text-red-600",
}[wcag] || "text-gray-500";





  // ---------- UI rendering ----------

  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      <header className="mb-6">
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">Web Utilities</h1>
            <p className="text-sm text-muted-foreground mt-1">UUIDs • Hashing • Base64 • Regex • Contrast • Passwords</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(true)} className="cursor-pointer">
              <Search className="w-4 h-4" /> Help
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Utilities</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{selectedTool === TOOLS.CONTRAST ? "Visual" : "Text"}</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select utility</Label>
                <Select value={selectedTool} onValueChange={(v) => setSelectedTool(v)}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value={TOOLS.UUID}>UUID Generator</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.HASH}>Hash Generator</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.BASE64}>Base64 Encode/Decode</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.REGEX}>Regex Tester</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.CONTRAST}>Color Contrast Checker</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.PASSWORD}>Password Strength Checker</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                {/* UUID */}
                {selectedTool === TOOLS.UUID && (
                  <>
                    <Label className="text-xs">Count (1-100)</Label>
                    <Input value={uuidCount} onChange={(e) => setUuidCount(e.target.value)} />
                    <div className="flex gap-2 mt-3">
                      <Button className="flex-1 cursor-pointer" onClick={handleGenerateUUIDs}>
                        <RefreshCcw className="w-4 h-4 mr-2" /> Generate
                      </Button>
                      <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => { setUuids([]); showToast("success","Cleared"); }}>
                        Clear
                      </Button>
                    </div>
                  </>
                )}

                {/* Hash */}
                {selectedTool === TOOLS.HASH && (
                  <>
                    <Label className="text-xs">Text to hash</Label>
                    <Input value={hashInput} onChange={(e) => setHashInput(e.target.value)} />
                    <Label className="text-xs mt-2">Algorithm</Label>
                    <Select value={hashAlgo} onValueChange={(v) => setHashAlgo(v)}>
                      <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="MD5">MD5</SelectItem>
                        <SelectItem className="cursor-pointer" value="SHA1">SHA1</SelectItem>
                        <SelectItem className="cursor-pointer" value="SHA256">SHA256</SelectItem>
                        <SelectItem className="cursor-pointer" value="SHA512">SHA512</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2 mt-3">
                      <Button className="flex-1 cursor-pointer" onClick={handleHash}><Hash className="w-4 h-4 mr-2" /> Hash</Button>
                      <Button className="flex-1 cursor-pointer" variant="outline" onClick={() => { setHashInput(""); setHashOutput(""); showToast("success","Cleared"); }}>Clear</Button>
                    </div>
                  </>
                )}

                {/* Base64 */}
                {selectedTool === TOOLS.BASE64 && (
                  <>
                    <Label className="text-xs">Input</Label>
                    <Textarea value={b64Input} onChange={(e)=>setB64Input(e.target.value)} className="min-h-[120px]" />
                    <div className="flex gap-2 mt-3">
                      <Button className="flex-1 cursor-pointer" onClick={handleBase64Encode}>Encode</Button>
                      <Button className="flex-1 cursor-pointer" variant="outline" onClick={handleBase64Decode}>Decode</Button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="flex-1 cursor-pointer" variant="outline" onClick={() => { setB64Input(""); setB64Output(""); showToast("success","Cleared"); }}>Clear</Button>
                      <Button className="flex-1 cursor-pointer" onClick={() => copyToClipboard(b64Output)}>Copy</Button>
                    </div>
                  </>
                )}

                {/* Regex */}
                {selectedTool === TOOLS.REGEX && (
                  <>
                    <Label className="text-xs">Text</Label>
                    <Textarea value={regexText} onChange={(e)=>setRegexText(e.target.value)} className="max-h-100 resize-none overflow-y-auto no-scrollbar" />
                    <Label className="text-xs mt-2">Pattern</Label>
                    <Input value={regexPattern} onChange={(e)=>setRegexPattern(e.target.value)} />
                    <Label className="text-xs mt-2">Flags</Label>
                    <Select value={regexFlags} onValueChange={(v)=>setRegexFlags(v)}>
                      <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="g">g</SelectItem>
                        <SelectItem className="cursor-pointer" value="gi">gi</SelectItem>
                        <SelectItem className="cursor-pointer" value="gm">gm</SelectItem>
                        <SelectItem className="cursor-pointer" value="gim">gim</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 mt-3">
                      <Button className="flex-1 cursor-pointer" onClick={handleRegexTest}><Search className="w-4 h-4 mr-2" /> Test</Button>
                      <Button className="flex-1 cursor-pointer" variant="outline" onClick={() => { setRegexPattern(""); setRegexMatches([]); setRegexText(""); showToast("success","Cleared"); }}>Clear</Button>
                    </div>
                  </>
                )}

                {/* Contrast */}
                {selectedTool === TOOLS.CONTRAST && (
                  <>
                    <Label className="text-xs">Foreground</Label>
                    <Input type="color" value={fgColor} onChange={(e)=>setFgColor(e.target.value)} className="h-10" />
                    <Label className="text-xs mt-2">Background</Label>
                    <Input type="color" value={bgColor} onChange={(e)=>setBgColor(e.target.value)} className="h-10" />
                    <div className="flex gap-2 mt-3">
                      <Button className="flex-1 cursor-pointer" onClick={() => showToast("success",`Contrast ${contrast}:1 - ${wcag}`)}>Check</Button>
                      <Button className="flex-1 cursor-pointer" variant="outline" onClick={() => { setFgColor("#000000"); setBgColor("#ffffff"); showToast("success","Reset"); }}>Reset</Button>
                    </div>
                  </>
                )}

                {/* Password */}
                {selectedTool === TOOLS.PASSWORD && (
                  <>
                    <Label className="text-xs">Password</Label>
                    <Input value={password} onChange={(e)=>setPassword(e.target.value)} />
                    <div className="flex gap-2 mt-3">
                      <Button className="flex-1 cursor-pointer" onClick={() => handleGeneratePassword(16)}><RefreshCcw className="w-4 h-4 mr-2" /> Generate</Button>
                      <Button className="flex-1 cursor-pointer" variant="outline" onClick={() => { setPassword(""); showToast("success","Cleared"); }}>Clear</Button>
                    </div>
                  </>
                )}

              </div>
            </CardContent>
          </Card>
        </aside>

        {/* center output */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedTool === TOOLS.UUID && <RefreshCcw className="w-4 h-4" />}
                  {selectedTool === TOOLS.HASH && <Hash className="w-4 h-4" />}
                  {selectedTool === TOOLS.BASE64 && <Code className="w-4 h-4" />}
                  {selectedTool === TOOLS.REGEX && <Search className="w-4 h-4" />}
                  {selectedTool === TOOLS.CONTRAST && <Droplet className="w-4 h-4" />}
                  {selectedTool === TOOLS.PASSWORD && <ShieldCheck className="w-4 h-4" />}
                  <span className="ml-1">
                    {selectedTool === TOOLS.UUID && "UUID Generator"}
                    {selectedTool === TOOLS.HASH && "Hash Generator"}
                    {selectedTool === TOOLS.BASE64 && "Base64 Encode/Decode"}
                    {selectedTool === TOOLS.REGEX && "Regex Tester"}
                    {selectedTool === TOOLS.CONTRAST && "Color Contrast Checker"}
                    {selectedTool === TOOLS.PASSWORD && "Password Strength Checker"}
                  </span>
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="cursor-pointer"
                >
                {copied ? (
                    <span className="text-green-500 transition-all">
                    <Check className="w-4 h-4" />
                    </span>
                ) : (
                    <Clipboard className="w-4 h-4" />
                )}
                </Button>

                <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setDialogOpen(true); }}>Help</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-900/50 min-h-[260px]">
                {/* content per tool */}
                {selectedTool === TOOLS.UUID && (
                  <div ref={resultRef} className="space-y-3">
                    {uuids.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No UUIDs generated yet. Choose count and click Generate.</div>
                    ) : (
                      <div className="space-y-2 max-h-100 no-scrollbar overflow-y-auto">
                        {uuids.map((u,i) => (
                          <div key={i} className="flex items-center justify-between rounded border p-2">
                            <div className="text-sm break-all">{u}</div>
                            <div className="flex gap-2">
                            <Button
                            size="sm"
                            variant="ghost"
                            className="cursor-pointer"
                            onClick={() => handleUuidCopy(u, i)}
                            >
                            {uuidCopiedIndex === i ? (
                                <Check className="w-4 h-4 text-green-500 transition-all" />
                            ) : (
                                <Clipboard className="w-4 h-4" />
                            )}
                            </Button>

                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedTool === TOOLS.HASH && (
                  <div ref={resultRef} className="space-y-3">
                    <div className="text-xs text-muted-foreground">Input</div>
                    <div className="rounded border p-2 min-h-[80px] text-sm break-words">{hashInput || <span className="text-muted-foreground">—</span>}</div>

                    <div className="text-xs text-muted-foreground mt-2">Output ({hashAlgo})</div>
                    <div className="rounded border p-2 min-h-[100px] text-sm break-words">{hashOutput || <span className="text-muted-foreground">No output</span>}</div>

                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={handleHash}>Generate</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => copyToClipboard(hashOutput)}>Copy</Button>
                    </div>
                  </div>
                )}

                {selectedTool === TOOLS.BASE64 && (
                  <div ref={resultRef} className="space-y-3">
                    <div className="text-xs text-muted-foreground">Input</div>
                    <div className="rounded border p-2 min-h-[100px] text-sm whitespace-pre-wrap break-words">{b64Input || <span className="text-muted-foreground">—</span>}</div>

                    <div className="text-xs text-muted-foreground mt-2">Result</div>
                    <div className="rounded border p-2 min-h-[120px] text-sm whitespace-pre-wrap break-words">{b64Output || <span className="text-muted-foreground">—</span>}</div>

                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={handleBase64Encode}>Encode</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={handleBase64Decode}>Decode</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => copyToClipboard(b64Output)}>Copy</Button>
                    </div>
                  </div>
                )}

                {selectedTool === TOOLS.REGEX && (
                  <div ref={resultRef} className="space-y-3">
                    <div className="text-xs text-muted-foreground">Matches</div>
                    <div className="rounded border p-2 min-h-[120px] text-sm">
                      {regexMatches.length === 0 ? <span className="text-muted-foreground">No matches</span> : regexMatches.map((m, i) => (<div key={i} className="py-1 border-b last:border-b-0">{m}</div>))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={handleRegexTest}>Run</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => copyToClipboard(regexMatches.join("\n"))}>Copy</Button>
                    </div>
                  </div>
                )}

                {selectedTool === TOOLS.CONTRAST && (
                  <div ref={resultRef} className="space-y-3">
                    <div className="rounded border p-4" style={{ background: bgColor, color: fgColor }}>
                      <div className="text-sm">Preview — foreground on background</div>
                      <div className="mt-3 text-lg font-medium">Aa</div>
                    </div>

                    <div className="mt-3 text-sm">Contrast ratio: <strong>{contrast}:1</strong></div>
                    <div className="text-sm">
                    WCAG rating: <strong className={wcagColor}>{wcag}</strong>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={() => { copyToClipboard(`${contrast}:1 (${wcag})`); }}>Copy ratio</Button>
                    </div>
                  </div>
                )}

                {selectedTool === TOOLS.PASSWORD && (
                  <div ref={resultRef} className="space-y-3">
                    <div className="text-xs text-muted-foreground">Password</div>
                    <div className="rounded border p-2 min-h-[80px] text-sm break-words">{password || <span className="text-muted-foreground">No password</span>}</div>

                   <div className="mt-3 text-sm">
                    Strength: <strong className={strengthLabelColor}>{passwordLabel}</strong>
                    </div>

                    <div className="mt-2 relative">
                    <Slider
                        value={[passwordScore]}
                        min={0}
                        max={5}
                        step={1}
                        disabled
                        className="pointer-events-none"
                    />

                    {/* Dynamic colored bar overlay */}
                    <div
                        className={`
                        absolute top-1/2 transform -translate-y-1/2 h-2 rounded
                        ${strengthColor}
                        `}
                        style={{
                        width: `${(passwordScore / 5) * 100}%`,
                        transition: "width 0.3s ease, background-color 0.3s ease",
                        }}
                    />
                    </div>


                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={() => handleGeneratePassword(16)}>Generate</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => copyToClipboard(password)}>Copy</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => setPassword("")}>Clear</Button>
                    </div>
                  </div>
                )}

              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Results update after actions above.</div>
               
              </div>
            </CardContent>
          </Card>
        </main>

        {/* right debug / quick actions */}
        <aside className="lg:col-span-3">
          <div className="space-y-4">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quick Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div><strong className="text-xs text-muted-foreground">Selected</strong> <div className="font-medium">{selectedTool}</div></div>

                  <Separator />

                  <div><strong className="text-xs text-muted-foreground">Tips</strong>
                    <ul className="list-disc ml-4 mt-2 text-xs">
                      <li>Use small inputs for hashing to avoid long processing times.</li>
                      <li>Base64 decode uses UTF-8 aware helpers for safety.</li>
                      <li>Regex Tester supports flags input (g, i, m).</li>
                      <li>Contrast checker reports WCAG categories.</li>
                    </ul>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">Shortcuts</div>
                  <div className="flex flex-col gap-2 mt-2">
                    <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.UUID); }}>Open UUID</Button>
                    <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.HASH); }}>Open Hash</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText("Sample text"); showToast("success","Sample copied"); }}>Copy sample</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setUuids([]); setHashInput(""); setHashOutput(""); setB64Input(""); setB64Output(""); setRegexMatches([]); setPassword(""); showToast("success","Cleared all"); }}>Clear all</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      {/* Help dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Utilities help</DialogTitle></DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            <p className="mb-2">This page provides small developer utilities using the same visual style as your AI Tools page.</p>
            <ul className="list-disc ml-5">
              <li>UUID generator uses <code>crypto.randomUUID()</code> where available.</li>
              <li>Hashing uses <code>crypto-js</code> for MD5 & SHA family.</li>
              <li>Base64 encoder/decoder handles UTF-8 safely.</li>
              <li>Regex tester returns matched substrings (use flags for global / insensitive matching).</li>
              <li>Contrast checker computes WCAG ratio and rating.</li>
              <li>Password checker provides a simple strength score and generator.</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Button className="cursor-pointer" onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
