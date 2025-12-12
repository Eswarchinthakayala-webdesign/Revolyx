// src/pages/BinaryToolsPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "sonner";
import {
  Copy,
  Download,
  Zap,
  Layers,
  Settings,
  Loader2,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ==========================
   Binary / Hex / Octal / ASCII helper functions
   ========================== */

// pad helpers
function padLeft(str, size, pad = "0") {
  return str.length >= size ? str : padLeft(pad + str, size - (str.length - size) + pad.length).slice(-size);
}
function bytePad8(n) {
  return n.toString(2).padStart(8, "0");
}
function nToBin(n, bits = 8) {
  return (typeof n === "number" ? n : Number(n)).toString(2).padStart(bits, "0");
}

// ------------- text <-> binary --------------
function textToBinary(text, spaceSeparated = true) {
  if (text == null || text === "") return "";
  // Work on UTF-16 code units and represent each code unit as 16-bit or 8-bit depending on ASCII
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 0xff) {
      bytes.push(code.toString(2).padStart(8, "0"));
    } else {
      // for non-ASCII, split into two bytes (UTF-16 code unit)
      bytes.push(((code >> 8) & 0xff).toString(2).padStart(8, "0"));
      bytes.push((code & 0xff).toString(2).padStart(8, "0"));
    }
  }
  return spaceSeparated ? bytes.join(" ") : bytes.join("");
}

function binaryToText(binStr) {
  if (!binStr) return "";
  // normalize: accept space-separated or continuous. Remove non-binary chars except space.
  const cleaned = binStr.trim().replace(/[^01\s]/g, "");
  const tokens = cleaned.includes(" ") ? cleaned.split(/\s+/) : cleaned.match(/.{1,8}/g) || [];
  try {
    const bytes = tokens.map((b) => parseInt(b, 2));
    // Try to coalesce into code units: if any sequences produce high bytes of 0 for ASCII, just map ascii
    let i = 0;
    let out = "";
    while (i < bytes.length) {
      const b = bytes[i];
      if (b <= 0x7f) {
        out += String.fromCharCode(b);
        i += 1;
      } else {
        // assume two-byte UTF-16 code unit if available
        if (i + 1 < bytes.length) {
          const hi = b;
          const lo = bytes[i + 1];
          const code = (hi << 8) + lo;
          out += String.fromCharCode(code);
          i += 2;
        } else {
          // leftover byte; treat as ISO-8859-1
          out += String.fromCharCode(b);
          i += 1;
        }
      }
    }
    return out;
  } catch {
    return "Invalid binary input";
  }
}

// ------------- text <-> ascii --------------
function textToAscii(text) {
  if (!text) return "";
  return text.split("").map((ch) => ch.charCodeAt(0)).join(" ");
}
function asciiToText(asciiStr) {
  if (!asciiStr) return "";
  const toks = asciiStr.trim().split(/\s+/);
  const chars = toks.map((t) => {
    const n = Number(t);
    if (Number.isNaN(n)) return "?";
    return String.fromCharCode(n);
  });
  return chars.join("");
}

// ------------- hex helpers --------------
function hexNormalize(s) {
  return s.trim().replace(/0x/g, "").replace(/[^0-9a-fA-F]/g, "");
}
function hexToBinary(hexStr, spaceSeparated = true) {
  if (!hexStr) return "";
  const clean = hexNormalize(hexStr);
  if (clean.length % 2 !== 0) {
    // pad with leading zero
    clean = "0" + clean;
  }
  const bytes = [];
  for (let i = 0; i < clean.length; i += 2) {
    const byte = parseInt(clean.slice(i, i + 2), 16);
    bytes.push(byte.toString(2).padStart(8, "0"));
  }
  return spaceSeparated ? bytes.join(" ") : bytes.join("");
}
function binaryToHex(binStr, spaceSeparated = true) {
  if (!binStr) return "";
  const cleaned = binStr.trim().replace(/[^01]/g, "");
  const tokens = cleaned.includes(" ") ? cleaned.split(/\s+/) : cleaned.match(/.{1,8}/g) || [];
  const hexes = tokens.map((b) => {
    const val = parseInt(b, 2);
    if (Number.isNaN(val)) return "??";
    return val.toString(16).padStart(2, "0");
  });
  return spaceSeparated ? hexes.join(" ") : hexes.join("");
}
function hexToText(hexStr) {
  if (!hexStr) return "";
  const clean = hexNormalize(hexStr);
  const bytes = [];
  for (let i = 0; i < clean.length; i += 2) {
    const v = parseInt(clean.slice(i, i + 2), 16);
    bytes.push(v);
  }
  return bytes.map((b) => String.fromCharCode(b)).join("");
}
function textToHex(text, spaceSeparated = true) {
  if (!text) return "";
  const hex = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 0xff) hex.push(code.toString(16).padStart(2, "0"));
    else {
      hex.push(((code >> 8) & 0xff).toString(16).padStart(2, "0"));
      hex.push((code & 0xff).toString(16).padStart(2, "0"));
    }
  }
  return spaceSeparated ? hex.join(" ") : hex.join("");
}

// ------------- decimal helpers --------------
function decimalToBinary(decStr, spaceSeparated = false) {
  if (decStr == null || decStr === "") return "";
  const n = Number(decStr);
  if (Number.isNaN(n)) return "NaN";
  if (!Number.isInteger(n)) {
    // for non-integers, convert integer part and fractional to bin (approx) — keep it simple: convert integer only
    return n.toString(2);
  }
  return spaceSeparated ? n.toString(2) : n.toString(2);
}
function binaryToDecimal(binStr) {
  if (!binStr) return "";
  const cleaned = binStr.trim().replace(/[^01]/g, "");
  return parseInt(cleaned, 2).toString(10);
}
function decimalToHex(decStr) {
  if (decStr == null || decStr === "") return "";
  const n = Number(decStr);
  if (Number.isNaN(n)) return "NaN";
  return n.toString(16);
}
function hexToDecimal(hexStr) {
  const clean = hexNormalize(hexStr);
  if (!clean) return "";
  return parseInt(clean, 16).toString(10);
}

// ------------- octal helpers --------------
function octalNormalize(s) {
  return s.trim().replace(/[^0-7]/g, "");
}
function octalToBinary(octStr) {
  const clean = octalNormalize(octStr);
  if (!clean) return "";
  // convert each octal digit to 3 bits
  return clean.split("").map((d) => parseInt(d, 8).toString(2).padStart(3, "0")).join(" ");
}
function binaryToOctal(binStr) {
  if (!binStr) return "";
  const cleaned = binStr.trim().replace(/[^01]/g, "");
  // group into 3 bits from right
  let padded = cleaned;
  while (padded.length % 3 !== 0) padded = "0" + padded;
  const groups = padded.match(/.{1,3}/g) || [];
  return groups.map((g) => parseInt(g, 2).toString(8)).join("");
}
function decimalToOctal(decStr) {
  if (!decStr) return "";
  const n = Number(decStr);
  if (Number.isNaN(n)) return "NaN";
  return n.toString(8);
}
function octalToDecimal(octStr) {
  const clean = octalNormalize(octStr);
  if (!clean) return "";
  return parseInt(clean, 8).toString(10);
}
function octalToHex(octStr) {
  const d = octalToDecimal(octStr);
  return d === "" ? "" : decimalToHex(d);
}
function hexToOctal(hexStr) {
  const d = hexToDecimal(hexStr);
  return d === "" ? "" : decimalToOctal(d);
}

// helpers: parse binary tokens gracefully
function parseBinaryTokens(input) {
  if (!input) return [];
  const cleaned = input.trim();
  if (cleaned.includes(" ")) return cleaned.split(/\s+/);
  // else chunk into bytes of 8 when possible
  return cleaned.match(/.{1,8}/g) || [];
}

/* ==========================
   Tools registry
   ========================== */

const TOOLS = [
  { id: "text_to_binary", label: "Text → Binary", type: "text" },
  { id: "binary_to_text", label: "Binary → Text", type: "binary" },
  { id: "hex_to_binary", label: "HEX → Binary", type: "hex" },
  { id: "binary_to_hex", label: "Binary → HEX", type: "binary" },
  { id: "ascii_to_binary", label: "ASCII → Binary", type: "text" },
  { id: "binary_to_ascii", label: "Binary → ASCII", type: "binary" },
  { id: "decimal_to_binary", label: "Decimal → Binary", type: "numeric" },
  { id: "binary_to_decimal", label: "Binary → Decimal", type: "binary" },
  { id: "text_to_ascii", label: "Text → ASCII", type: "text" },
  { id: "ascii_to_text", label: "ASCII → Text", type: "text" },
  { id: "hex_to_decimal", label: "HEX → Decimal", type: "hex" },
  { id: "decimal_to_hex", label: "Decimal → HEX", type: "numeric" },
  { id: "octal_to_binary", label: "Octal → Binary", type: "octal" },
  { id: "binary_to_octal", label: "Binary → Octal", type: "binary" },
  { id: "octal_to_decimal", label: "Octal → Decimal", type: "octal" },
  { id: "decimal_to_octal", label: "Decimal → Octal", type: "numeric" },
  { id: "hex_to_octal", label: "HEX → Octal", type: "hex" },
  { id: "octal_to_hex", label: "Octal → HEX", type: "octal" },
  { id: "text_to_octal", label: "Text → Octal", type: "text" },
  { id: "octal_to_text", label: "Octal → Text", type: "octal" },
  { id: "text_to_hex", label: "Text → HEX", type: "text" },
  { id: "hex_to_text", label: "HEX → Text", type: "hex" },
  { id: "text_to_decimal", label: "Text → Decimal (codes)", type: "text" },
  { id: "decimal_to_text", label: "Decimal → Text (codes)", type: "numeric" },
];

/* ==========================
   Component
   ========================== */

export default function BinaryToolsPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // URL sync: read ?tool= on mount (vanilla browser history)
  const defaultTool = "text_to_binary";
  const [selectedTool, setSelectedTool] = useState(() => {
    try {
      if (typeof window === "undefined") return defaultTool;
      const p = new URLSearchParams(window.location.search);
      const t = p.get("tool");
      return t && TOOLS.find((x) => x.id === t) ? t : defaultTool;
    } catch {
      return defaultTool;
    }
  });

  const [inputValue, setInputValue] = useState("");
  const [spaceSeparated, setSpaceSeparated] = useState(true); // output format toggle
  const [result, setResult] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);

  // sync URL on tool change
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      p.set("tool", selectedTool);
      const newUrl = `${window.location.pathname}?${p.toString()}`;
      window.history.replaceState(null, "", newUrl);
    } catch {
      // ignore
    }
  }, [selectedTool]);

  // run conversion
  const computeResult = useCallback(() => {
    setLoading(true);
    try {
      const tool = selectedTool;
      const input = inputValue ?? "";
      let out = "";
      switch (tool) {
        case "text_to_binary":
          out = textToBinary(input, spaceSeparated);
          break;
        case "binary_to_text":
          out = binaryToText(input);
          break;
        case "hex_to_binary":
          out = hexToBinary(input, spaceSeparated);
          break;
        case "binary_to_hex":
          out = binaryToHex(input, spaceSeparated);
          break;
        case "ascii_to_binary":
          out = (input || "").split("").map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(spaceSeparated ? " " : "");
          break;
        case "binary_to_ascii":
          out = parseBinaryTokens(input).map((b) => {
            const v = parseInt(b, 2);
            if (Number.isNaN(v)) return "?";
            return String.fromCharCode(v);
          }).join("");
          break;
        case "decimal_to_binary":
          out = decimalToBinary(input, spaceSeparated);
          break;
        case "binary_to_decimal":
          out = binaryToDecimal(input);
          break;
        case "text_to_ascii":
          out = textToAscii(input);
          break;
        case "ascii_to_text":
          out = asciiToText(input);
          break;
        case "hex_to_decimal":
          out = hexToDecimal(input);
          break;
        case "decimal_to_hex":
          out = decimalToHex(input);
          break;
        case "octal_to_binary":
          out = octalToBinary(input);
          break;
        case "binary_to_octal":
          out = binaryToOctal(input);
          break;
        case "octal_to_decimal":
          out = octalToDecimal(input);
          break;
        case "decimal_to_octal":
          out = decimalToOctal(input);
          break;
        case "hex_to_octal":
          out = hexToOctal(input);
          break;
        case "octal_to_hex":
          out = octalToHex(input);
          break;
        case "text_to_octal": {
          const arr = [];
          for (let i = 0; i < input.length; i++) arr.push(input.charCodeAt(i).toString(8));
          out = arr.join(spaceSeparated ? " " : "");
          break;
        }
        case "octal_to_text": {
          const tokens = input.trim().split(/\s+/);
          out = tokens.map((t) => String.fromCharCode(parseInt(octalNormalize(t), 8))).join("");
          break;
        }
        case "text_to_hex":
          out = textToHex(input, spaceSeparated);
          break;
        case "hex_to_text":
          out = hexToText(input);
          break;
        case "text_to_decimal":
          out = input.split("").map((c) => c.charCodeAt(0)).join(spaceSeparated ? " " : ",");
          break;
        case "decimal_to_text":
          out = input.split(/\s+|,/).map((t) => String.fromCharCode(Number(t))).join("");
          break;
        default:
          out = "Unsupported tool";
      }
      setResult(out);
    } finally {
      setLoading(false);

    }
  }, [selectedTool, inputValue, spaceSeparated]);

  // compute on input or tool change
  useEffect(() => {
    computeResult();
  }, [selectedTool, inputValue, spaceSeparated, computeResult]);

  const handleCopy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy || "");
      showToast("success", "Copied to clipboard");
    } catch {
      showToast("error", "Copy failed");
    }
  };

  const handleDownload = () => {
    if (!result) {
      showToast("error", "No output to download");
      return;
    }
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversion-${selectedTool}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Downloaded");
  };

  const toolLabel = useMemo(() => {
    const t = TOOLS.find((x) => x.id === selectedTool);
    return t ? t.label : "Binary Tool";
  }, [selectedTool]);

  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
             Binary Converter Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Text ↔ Binary • HEX ↔ Binary • Octal ↔ Binary • ASCII • Decimal • and more</p>
          </div>

        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Controls</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{spaceSeparated ? "Space bytes" : "Packed"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Pick tool</Label>
                <Select value={selectedTool} onValueChange={(v) => setSelectedTool(v)}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="h-60">
                    {TOOLS.map((t) => (
                      <SelectItem className="cursor-pointer" key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Separator />

                <div>
                  <Label className="text-xs">Input</Label>
                  <Textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter text, binary, hex, octal, or decimal depending on the selected tool" className="min-h-[120px] resize-none overflow-y-auto no-scrollbar mt-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSpaceSeparated((s) => !s); showToast("success",`Output format: ${!spaceSeparated ? "Space-separated" : "Packed"}`); }}>
                    {spaceSeparated ? "Packed output" : "Space-separated"}
                  </Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setInputValue(""); setResult(""); }}>Clear</Button>
                </div>

                <Separator />

                <div className="text-xs opacity-70">Tip: Results update instantly as you type. Use the copy/export tools in the preview area.</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* center preview */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">{toolLabel}</CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => handleCopy(result)}><Copy className="w-4 h-4" /></Button>
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={handleDownload}><Download className="w-4 h-4" /></Button>
                <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setResult(""); showToast("success", "Cleared"); }}>Clear</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-900/50 min-h-[240px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="animate-spin w-10 h-10 text-slate-500" />
                    <div className="text-sm text-muted-foreground mt-3">Computing…</div>
                  </div>
                ) : result ? (
                  <div ref={resultRef} className="prose max-w-none">
                    <pre className="whitespace-pre-wrap break-words bg-transparent p-0">{result}</pre>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Output will appear here.</div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Tip: try "Hello" → Text → Binary or paste "01001000 01100101 ..." to convert back.</div>
              </div>
            </CardContent>
          </Card>

          {/* quick examples card */}
          <Card className="shadow-sm dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle>Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className=" border p-3 rounded-2xl  hover:bg-zinc-600/30  bg-gradient-to-r from-zinc-200/80 via-zinc-100 to-zinc-100/50 dark:from-zinc-400/15 dark:via-zinc-700/10 dark:to-emerald-700/10">
                  <div className="text-xs opacity-70">Text → Binary</div>
                  <div className="font-mono mt-1">Hello → 01001000 01100101 01101100 01101100 01101111</div>
                </div>
                               <div className=" border p-3 rounded-2xl  hover:bg-zinc-600/30  bg-gradient-to-r from-zinc-200/80 via-zinc-100 to-zinc-100/50 dark:from-zinc-400/15 dark:via-zinc-700/10 dark:to-emerald-700/10">
                  <div className="text-xs opacity-70">Hex → Text</div>
                  <div className="font-mono mt-1">48656c6c6f → Hello</div>
                </div>
                       <div className=" border p-3 rounded-2xl  hover:bg-zinc-600/30  bg-gradient-to-r from-zinc-200/80 via-zinc-100 to-zinc-100/50 dark:from-zinc-400/15 dark:via-zinc-700/10 dark:to-emerald-700/10">
                  <div className="text-xs opacity-70">Decimal → Hex</div>
                  <div className="font-mono mt-1">65 → 41</div>
                </div>
                <div className=" border p-3 rounded-2xl  hover:bg-zinc-600/30  bg-gradient-to-r from-zinc-200/80 via-zinc-100 to-zinc-100/50 dark:from-zinc-400/15 dark:via-zinc-700/10 dark:to-emerald-700/10">
                  <div className="text-xs opacity-70">Octal → Binary</div>
                  <div className="font-mono mt-1">12 → 001 010</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* right debug */}
        <aside className="lg:col-span-3">
          <div className="space-y-4 ">
            <Card className="shadow-sm dark:bg-black/80 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div className="flex items-center justify-between"><span className="opacity-70">Selected</span><span className="font-medium">{toolLabel}</span></div>
                  <div className="flex items-center justify-between"><span className="opacity-70">Input length</span><span className="font-medium">{(inputValue || "").length}</span></div>
                  <div className="flex items-center justify-between"><span className="opacity-70">Output preview</span><span className="font-medium truncate">{result ? (result.length > 40 ? `${result.slice(0, 40)}…` : result) : "—"}</span></div>
                  <Separator />
                  <div className="text-xs opacity-70">All conversions are local. For large inputs, consider using packed format (no spaces).</div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => handleCopy(result)}>Copy output</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => handleDownload()}>Export</Button>
                  <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { setInputValue("Hello"); setSelectedTool("text_to_binary"); }}>Try "Hello"</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Binary Tools — Notes</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              This page uses client-side utilities to convert between text, binary, hex, decimal, octal and ASCII. It follows the same layout and theme used across your measurement tools and AI tools pages.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
