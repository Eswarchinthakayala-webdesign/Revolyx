// src/pages/JSONToolsPage.jsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Toaster } from "sonner";

import {
  Loader2,
  Copy,
  Download,
  Zap,
  AlertCircle,
  Settings,
  Trash,
  FileText,
  Activity,
  Repeat,
} from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";
 // optional fallback: if you don't have this, we'll define below

// NOTE: If your project doesn't export ./_helpers, the local copy function below will be used.
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text || "");
    showToast("success", "Copied to clipboard");
  } catch {
    // fallback
    try {
      await fallbackCopy(text);
    } catch {
      showToast("error", "Copy failed");
    }
  }
}

// ---------- JSON / CSV helpers ----------

function tryParseJSON(input) {
  try {
    const parsed = JSON.parse(input);
    return { ok: true, value: parsed };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

function prettifyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function minifyJSON(obj) {
  return JSON.stringify(obj);
}

// Convert array of objects to CSV (simple and safe-ish: handles commas, quotes)
function jsonToCsv(data, { headers = null, separator = "," } = {}) {
  if (!Array.isArray(data)) throw new Error("JSON root must be an array of objects for CSV conversion.");

  // If no headers provided, build union of keys in order seen
  const keys = headers && headers.length ? [...headers] : Array.from(
    data.reduce((set, row) => {
      if (row && typeof row === "object" && !Array.isArray(row)) {
        Object.keys(row).forEach((k) => set.add(k));
      }
      return set;
    }, new Set())
  );

  const escape = (v) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (s.includes('"') || s.includes(separator) || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = [keys.join(separator)];
  for (const r of data) {
    const row = keys.map((k) => escape(r?.[k]));
    rows.push(row.join(separator));
  }
  return rows.join("\n");
}

// Simple CSV parser into array of objects
function csvToJson(csv, { separator = ",", hasHeader = true } = {}) {
  // Normalize line endings
  csv = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const rows = [];
  let current = "";
  let inQuotes = false;

  const pushCell = () => {
    rows[rows.length - 1].push(current);
    current = "";
  };

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (!rows.length) rows.push([]);

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'; // escaped quote
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && char === separator) {
      pushCell();
    } else if (!inQuotes && char === "\n") {
      pushCell();
      rows.push([]);
    } else {
      current += char;
    }
  }

  // Push last cell
  if (current.length > 0 || csv[csv.length - 1] === separator) {
    pushCell();
  }

  // If no header, create generic
  let headers;
  let startIdx = 0;

  if (hasHeader) {
    headers = rows[0];
    startIdx = 1;
  } else {
    const maxLen = Math.max(...rows.map((r) => r.length));
    headers = Array.from({ length: maxLen }, (_, i) => `column_${i + 1}`);
  }

  const output = [];

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 1 && row[0].trim() === "") continue;

    const obj = {};
    headers.forEach((h, index) => {
      obj[h] = row[index] ?? "";
    });

    output.push(obj);
  }

  return output;
}


// Remove duplicates - by JSON.stringify (full object) or by key path (dot-separated)
function removeDuplicatesFromArray(arr, { keyPath = null } = {}) {
  if (!Array.isArray(arr)) throw new Error("Input must be an array.");
  if (!keyPath) {
    const seen = new Set();
    return arr.filter((item) => {
      const s = JSON.stringify(item);
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  } else {
    // keyPath like 'user.id' or 'id'
    const seen = new Set();
    return arr.filter((item) => {
      const val = keyPath.split('.').reduce((a, k) => (a && a[k] != null ? a[k] : undefined), item);
      const key = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// simple safe JSON stringify for display
function safeStringify(value) {
  try {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// ---------- MAIN PAGE ----------

export default function JSONToolsPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Tool enum
  const TOOLS = {
    FORMATTER: "formatter",
    VALIDATOR: "validator",
    JSON_TO_CSV: "json_to_csv",
    CSV_TO_JSON: "csv_to_json",
    REMOVE_DUPES: "remove_dupes",
    MINIFY: "minify",
    PRETTIFY: "prettify",
  };

  const [selectedTool, setSelectedTool] = useState(TOOLS.FORMATTER);

  // Input & output
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading] = useState(false);

  // CSV options
  const [csvSeparator, setCsvSeparator] = useState(",");
  const [csvHasHeader, setCsvHasHeader] = useState(true);

  // Remove duplicates options
  const [dedupeKeyPath, setDedupeKeyPath] = useState("");

  // Validation result
  const [validationError, setValidationError] = useState(null);

  const resultRef = useRef(null);

  const handleCopy = async () => {
    await copyToClipboard(outputText);
  };

  const handleDownload = () => {
    if (!outputText) {
      showToast("error", "Nothing to download");
      return;
    }
    const blob = new Blob([outputText], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `json-tools-output-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Downloaded");
  };

  // Main "run" action for each tool
  const handleRun = useCallback(async () => {
    setLoading(true);
    setValidationError(null);
    setOutputText("");
    try {
      if (selectedTool === TOOLS.FORMATTER || selectedTool === TOOLS.PRETTIFY) {
        // parse JSON and prettify
        const parsed = tryParseJSON(inputText);
        if (!parsed.ok) {
          setValidationError(parsed.error);
          setOutputText("");
          showToast("error", "Invalid JSON");
          setLoading(false);
          return;
        }
        const out = prettifyJSON(parsed.value);
        setOutputText(out);
        showToast("success", "Formatted");
      } else if (selectedTool === TOOLS.MINIFY) {
        const parsed = tryParseJSON(inputText);
        if (!parsed.ok) {
          setValidationError(parsed.error);
          setOutputText("");
          showToast("error", "Invalid JSON");
          setLoading(false);
          return;
        }
        const out = minifyJSON(parsed.value);
        setOutputText(out);
        showToast("success", "Minified");
      } else if (selectedTool === TOOLS.VALIDATOR) {
        const parsed = tryParseJSON(inputText);
        if (!parsed.ok) {
          setValidationError(parsed.error);
          setOutputText("");
          showToast("error", "Invalid JSON");
          setLoading(false);
          return;
        }
        setValidationError(null);
        setOutputText("JSON is valid ✔");
        showToast("success", "Valid JSON");
      } else if (selectedTool === TOOLS.JSON_TO_CSV) {
        const parsed = tryParseJSON(inputText);
        if (!parsed.ok) {
          setValidationError(parsed.error);
          setOutputText("");
          showToast("error", "Invalid JSON (expected array)");
          setLoading(false);
          return;
        }
        const root = parsed.value;
        if (!Array.isArray(root)) {
          showToast("error", "JSON root must be an array for JSON → CSV conversion");
          setOutputText("");
          setLoading(false);
          return;
        }
        const csv = jsonToCsv(root, { headers: null, separator: csvSeparator });
        setOutputText(csv);
        showToast("success", "Converted to CSV");
      } else if (selectedTool === TOOLS.CSV_TO_JSON) {
        try {
          const arr = csvToJson(inputText, { separator: csvSeparator, hasHeader: csvHasHeader });
          setOutputText(prettifyJSON(arr));
          showToast("success", "Converted CSV → JSON");
        } catch (err) {
          setValidationError(String(err));
          showToast("error", "CSV parse failed");
        }
      } else if (selectedTool === TOOLS.REMOVE_DUPES) {
        const parsed = tryParseJSON(inputText);
        if (!parsed.ok) {
          setValidationError(parsed.error);
          setOutputText("");
          showToast("error", "Invalid JSON (expected array)");
          setLoading(false);
          return;
        }
        const root = parsed.value;
        if (!Array.isArray(root)) {
          showToast("error", "JSON root must be an array to remove duplicates");
          setOutputText("");
          setLoading(false);
          return;
        }
        const result = removeDuplicatesFromArray(root, { keyPath: dedupeKeyPath || null });
        setOutputText(prettifyJSON(result));
        showToast("success", `Removed duplicates (${root.length} → ${result.length})`);
      } else {
        setOutputText("");
      }
    } catch (err) {
      setValidationError(String(err?.message || err));
      showToast("error", String(err?.message || err));
    } finally {
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    }
  }, [selectedTool, inputText, csvSeparator, csvHasHeader, dedupeKeyPath]);

  // small helper to load sample JSON
  const loadSample = () => {
    const sample = [
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" },
      { id: 1, name: "Alice", email: "alice@example.com" },
    ];
    setInputText(JSON.stringify(sample, null, 2));
    showToast("success", "Loaded sample JSON");
  };

  const clearAll = () => {
    setInputText("");
    setOutputText("");
    setValidationError(null);
  };

  // tool label
  const toolLabel = useMemo(() => {
    switch (selectedTool) {
      case TOOLS.FORMATTER:
        return "JSON Formatter";
      case TOOLS.VALIDATOR:
        return "JSON Validator";
      case TOOLS.JSON_TO_CSV:
        return "JSON → CSV Converter";
      case TOOLS.CSV_TO_JSON:
        return "CSV → JSON Converter";
      case TOOLS.REMOVE_DUPES:
        return "Remove Duplicates from Array";
      case TOOLS.MINIFY:
        return "JSON Minify";
      case TOOLS.PRETTIFY:
        return "JSON Prettify";
      default:
        return "JSON Tool";
    }
  }, [selectedTool]);

  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
              JSON Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Formatter • Validator • JSON ↔ CSV • Remove duplicates • Minify / Prettify
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadSample} className="cursor-pointer">
              Load sample
            </Button>
            <Button variant="outline" onClick={clearAll} className="cursor-pointer">
              Clear
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout: left controls, center output, right info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Controls</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">
                  JSON
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select tool</Label>
                <Select value={selectedTool} onValueChange={(v) => setSelectedTool(v)}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value={TOOLS.FORMATTER}>Formatter</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.VALIDATOR}>Validator</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.MINIFY}>Minify</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.PRETTIFY}>Prettify</SelectItem>
                    <Separator />
                    <SelectItem className="cursor-pointer" value={TOOLS.JSON_TO_CSV}>JSON → CSV</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.CSV_TO_JSON}>CSV → JSON</SelectItem>
                    <Separator />
                    <SelectItem className="cursor-pointer" value={TOOLS.REMOVE_DUPES}>Remove duplicates</SelectItem>
                  </SelectContent>
                </Select>

                {/* dynamic options */}
                {(selectedTool === TOOLS.JSON_TO_CSV || selectedTool === TOOLS.CSV_TO_JSON) && (
                  <>
                    <Label className="text-xs">CSV separator</Label>
                    <Select value={csvSeparator} onValueChange={(v) => setCsvSeparator(v)}>
                      <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value=",">Comma (,)</SelectItem>
                        <SelectItem className="cursor-pointer" value=";">Semicolon (;)</SelectItem>
                        <SelectItem className="cursor-pointer" value="\t">Tab (\\t)</SelectItem>
                      </SelectContent>
                    </Select>

                    {selectedTool === TOOLS.CSV_TO_JSON && (
                      <>
                        <Label className="text-xs mt-3">CSV has header?</Label>
                        <Select value={String(csvHasHeader)} onValueChange={(v) => setCsvHasHeader(v === "true")}>
                          <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem className="cursor-pointer" value="true">Yes</SelectItem>
                            <SelectItem className="cursor-pointer" value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </>
                )}

                {selectedTool === TOOLS.REMOVE_DUPES && (
                  <>
                    <Label className="text-xs">Dedupe by key path (optional)</Label>
                    <Input placeholder="e.g. id or user.id" value={dedupeKeyPath} onChange={(e) => setDedupeKeyPath(e.target.value)} />
                    <div className="text-xs text-muted-foreground mt-1">Leave empty to dedupe by full object equality.</div>
                  </>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button className="flex-1 cursor-pointer" onClick={handleRun} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />} Run
                  </Button>
                  <Button variant="outline" className="cursor-pointer" onClick={() => { setInputText(""); setOutputText(""); setValidationError(null); }}>
                    Reset
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">Tip: You can load sample JSON using the "Load sample" button above.</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: Input & Output */}
        <main className="lg:col-span-6 space-y-6">
          {/* Input */}
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> Input</CardTitle>
              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => copyToClipboard(inputText)}><Copy className="w-4 h-4" /></Button>
                <Button className="cursor-pointer bg-red-600 hover:bg-red-500  " size="sm"  onClick={() => { setInputText(""); showToast("success","Cleared input"); }}><Trash className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="max-h-100 resize-none overflow-y-auto font-mono" />
            </CardContent>
          </Card>

          {/* Output */}
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Activity className="w-4 h-4" /> {toolLabel}</CardTitle>
              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={handleCopy}><Copy className="w-4 h-4" /></Button>
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={handleDownload}><Download className="w-4 h-4" /></Button>
                <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setOutputText(""); showToast("success","Cleared output"); }}>Clear</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border  bg-white/50 dark:bg-zinc-900/50 min-h-[220px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="animate-spin w-10 h-10 text-slate-500" />
                    <div className="text-sm text-muted-foreground mt-3">Working…</div>
                  </div>
                ) : validationError ? (
                  <div className="text-sm text-rose-500 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 mt-1 text-rose-500" />
                    <div>
                      <div className="font-medium">Error</div>
                      <pre className="whitespace-pre-wrap text-xs mt-1">{validationError}</pre>
                    </div>
                  </div>
                ) : outputText ? (
                  <div ref={resultRef} data-color-mode={isDark ? "dark" : "light"} className="prose max-w-none">
                    {/* If output looks like JSON or CSV we display as preformatted text */}
                    <MDEditor.Markdown source={"```json\n" + outputText + "\n```"} className="bg-transparent  sm:text-base  h-100 overflow-y-auto " />
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
                    <div className="text-base font-medium">No output yet</div>
                    <div>Run a tool to see results here. Use the controls on the left to pick a tool and options.</div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Tip: Use "Download" to save results or "Copy" to paste elsewhere.</div>
                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => handleRun()}><Zap className="w-4 h-4 mr-1" />Run</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Right: Info / Quick actions */}
        <aside className="lg:col-span-3">
          <div className="space-y-4">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Details & Quick Actions</span>
                  <Settings className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Input size</div>
                    <div className="font-medium">{inputText.length} characters</div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-xs text-muted-foreground">Quick actions</div>
                    <div className="flex flex-col gap-2 mt-2">
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setInputText(prettifyJSON(tryParseJSON(inputText).value || [])); showToast("success","Prettified input"); }}>Prettify input</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => {
                        const parsed = tryParseJSON(inputText);
                        if (!parsed.ok) { showToast("error","Invalid JSON"); return; }
                        setOutputText(minifyJSON(parsed.value));
                        showToast("success", "Minified and placed in output");
                      }}>Minify input → output</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => {
                        const parsed = tryParseJSON(inputText);
                        if (!parsed.ok) { showToast("error","Invalid JSON"); return; }
                        setOutputText(prettifyJSON(parsed.value));
                        showToast("success", "Prettified placed in output");
                      }}>Prettify input → output</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setInputText(""); setOutputText(""); setValidationError(null); showToast("success","Cleared both"); }}>Clear both</Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-xs text-muted-foreground">Notes</div>
                    <div className="text-xs mt-2">• JSON → CSV expects an array of objects at the root.<br />• CSV → JSON will try to detect headers; choose separator if not comma.<br />• Removing duplicates can use a key path (e.g. user.id).</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => {
                    setInputText(JSON.stringify([{ id:1, name:"Alice" }, { id:2, name:"Bob" }, { id:1, name:"Alice" }], null, 2));
                    showToast("success","Sample loaded");
                  }}>Load dedupe sample</Button>

                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => {
                    setInputText('[{"id":1,"a":"x"},{"id":2,"a":"y"}]');
                    setSelectedTool(TOOLS.JSON_TO_CSV);
                    showToast("success","Sample loaded & tool set to JSON→CSV");
                  }}>Load JSON→CSV sample</Button>

                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => {
                    setInputText('id,name\\n1,Alice\\n2,Bob');
                    setSelectedTool(TOOLS.CSV_TO_JSON);
                    showToast("success","CSV sample loaded & tool set to CSV→JSON");
                  }}>Load CSV sample</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
