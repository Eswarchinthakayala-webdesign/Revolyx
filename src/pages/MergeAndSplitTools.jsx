// src/pages/MergeAndSplitTools.jsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  ArrowDownSquare,
  FileText,
  FilePlus,
  Image as ImageIcon,
  Layers,
  Loader2,
  Download,
  Trash2,
  Eye,
  Zap,
} from "lucide-react";
import { PDFDocument } from "pdf-lib"; // npm i pdf-lib
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";

//
// Merge & Split Tools - Client-side only
// Tools implemented:
//  - PDF Merge
//  - PDF Split (extract selected pages)
//  - Image Merge (create a single PDF and combined single image)
//  - Text Merge (concatenate .txt files)
//  - CSV Merge (concatenate CSVs, preserve header from first file)
//
//
// Notes: this file expects `pdf-lib` to be installed. Preview uses blob URLs and thumbnails.
// For very large files, operations might be heavy on the browser. Consider server-side for heavy loads.
//

const TOOLS = {
  PDF_MERGE: "pdf_merge",
  PDF_SPLIT: "pdf_split",
  IMAGE_MERGE: "image_merge",
  TEXT_MERGE: "text_merge",
  CSV_MERGE: "csv_merge",
};

export default function MergeAndSplitTools() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [selectedTool, setSelectedTool] = useState(TOOLS.PDF_MERGE);

  // files state
  const [files, setFiles] = useState([]); // array of File
  const fileInputRef = useRef(null);

  // split-specific
  const [splitRanges, setSplitRanges] = useState(""); // e.g. "1-2,4,6-8"

  // preview & result
  const [previewUrl, setPreviewUrl] = useState(null); // blob URL
  const [resultFilename, setResultFilename] = useState("");
  const [resultBlobUrl, setResultBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // CSV options
  const [preserveHeader, setPreserveHeader] = useState(true);

  // Text preview
  const [textPreview, setTextPreview] = useState("");

  // helpers
  const clearAll = useCallback(() => {
    setFiles([]);
    setPreviewUrl(null);
    setResultBlobUrl(null);
    setResultFilename("");
    setTextPreview("");
    if (fileInputRef.current) fileInputRef.current.value = null;
  }, []);

  const handleFilesChosen = useCallback((e) => {
    const chosen = Array.from(e.target.files || []);
    if (!chosen.length) return;
    setFiles((prev) => [...prev, ...chosen]);
    // generate quick preview for first item (if PDF or image or text)
    const f = chosen[0];
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setResultBlobUrl(null);
    setResultFilename("");
  }, []);

  const removeFile = useCallback((idx) => {
    setFiles((prev) => {
      const copy = [...prev];
      const removed = copy.splice(idx, 1);
      // revoke objectURL if it was preview
      if (previewUrl && removed?.[0]) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {}
      }
      return copy;
    });
  }, [previewUrl]);

  // Utility: parse split ranges like "1-3,5,7-9" into array of 0-based page indices
  function parseRanges(str) {
    if (!str) return [];
    const parts = str.split(",").map((p) => p.trim()).filter(Boolean);
    const pages = new Set();
    for (const part of parts) {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map((n) => parseInt(n, 10));
        if (Number.isFinite(a) && Number.isFinite(b) && b >= a) {
          for (let i = a; i <= b; i++) pages.add(i - 1);
        }
      } else {
        const n = parseInt(part, 10);
        if (Number.isFinite(n)) pages.add(n - 1);
      }
    }
    return Array.from(pages).filter((p) => p >= 0).sort((a, b) => a - b);
  }

  // Converts image File -> dataURL (base64) for embedding into PDF or creating combined image.
  async function fileToDataUrl(file) {
    return await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  // PDF Merge
  const runPdfMerge = useCallback(async () => {
    if (!files.length) {
      showToast("error", "Upload PDF files to merge");
      return;
    }
    setLoading(true);
    setResultBlobUrl(null);
    setResultFilename("");

    try {
      // load destination PDF
      const mergedPdf = await PDFDocument.create();

      for (const f of files) {
        const arrayBuffer = await f.arrayBuffer();
        // try to load each file as PDF; if not: skip with warning
        try {
          const donor = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const donorPages = await mergedPdf.copyPages(donor, donor.getPageIndices());
          donorPages.forEach((p) => mergedPdf.addPage(p));
        } catch (err) {
          console.warn("Skipping non-PDF file in merge:", f.name, err);
        }
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResultBlobUrl(url);
      setResultFilename(`merged-${Date.now()}.pdf`);
      setPreviewUrl(url);
      showToast("success", "PDFs merged (client-side)");
    } catch (err) {
      console.error(err);
      showToast("error", "PDF merge failed");
    } finally {
      setLoading(false);
    }
  }, [files]);

  // PDF Split: create new PDF with selected pages from first PDF file
  const runPdfSplit = useCallback(async () => {
    if (!files.length) {
      showToast("error", "Upload a PDF to split (first file will be used)");
      return;
    }
    setLoading(true);
    setResultBlobUrl(null);
    setResultFilename("");

    try {
      const f = files[0];
      const arrayBuffer = await f.arrayBuffer();
      const src = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const total = src.getPageCount();

      const indices = parseRanges(splitRanges);
      if (!indices.length) {
        showToast("error", "Provide pages or ranges (e.g. 1-3,5)");
        setLoading(false);
        return;
      }

      // filter indices within range
      const valid = indices.filter((i) => i >= 0 && i < total);
      if (!valid.length) {
        showToast("error", "No valid pages selected");
        setLoading(false);
        return;
      }

      const outPdf = await PDFDocument.create();
      const pages = await outPdf.copyPages(src, valid);
      pages.forEach((p) => outPdf.addPage(p));
      const bytes = await outPdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResultBlobUrl(url);
      setResultFilename(`${f.name.replace(/\.pdf$/i, "")}-pages-${splitRanges || "custom"}.pdf`);
      setPreviewUrl(url);
      showToast("success", "Pages extracted");
    } catch (err) {
      console.error(err);
      showToast("error", "PDF split failed");
    } finally {
      setLoading(false);
    }
  }, [files, splitRanges]);

  // Image Merge: two modes: (A) create single PDF with each image as a page; (B) combine images into a single long image
  const runImageMerge = useCallback(
    async (mode = "pdf") => {
      if (!files.length) {
        showToast("error", "Upload images to merge");
        return;
      }
      setLoading(true);
      setResultBlobUrl(null);
      setResultFilename("");
      try {
        if (mode === "pdf") {
          // create PDF with images as pages
          const pdfDoc = await PDFDocument.create();
          for (const f of files) {
            const dataUrl = await fileToDataUrl(f);
            const imgBytes = await (await fetch(dataUrl)).arrayBuffer();
            let img;
            if (/png/i.test(f.type)) img = await pdfDoc.embedPng(imgBytes);
            else img = await pdfDoc.embedJpg(imgBytes);
            const page = pdfDoc.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          }
          const bytes = await pdfDoc.save();
          const blob = new Blob([bytes], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          setResultBlobUrl(url);
          setResultFilename(`images-${Date.now()}.pdf`);
          setPreviewUrl(url);
          showToast("success", "Images merged into PDF");
        } else {
          // combine images vertically onto a canvas and export single PNG
          // compute combined height and max width
          const imgs = await Promise.all(
            files.map((f) =>
              new Promise((res, rej) => {
                const url = URL.createObjectURL(f);
                const i = new Image();
                i.onload = () => {
                  res({ img: i, url });
                };
                i.onerror = rej;
                i.src = url;
              })
            )
          );
          const maxW = Math.max(...imgs.map((x) => x.img.width));
          const totalH = imgs.reduce((s, x) => s + x.img.height, 0);
          const canvas = document.createElement("canvas");
          canvas.width = maxW;
          canvas.height = totalH;
          const ctx = canvas.getContext("2d");
          let y = 0;
          for (const it of imgs) {
            ctx.drawImage(it.img, 0, y);
            y += it.img.height;
            URL.revokeObjectURL(it.url);
          }
          // export
          const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
          const url = URL.createObjectURL(blob);
          setResultBlobUrl(url);
          setResultFilename(`images-combined-${Date.now()}.png`);
          setPreviewUrl(url);
          showToast("success", "Images combined into single image");
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Image merge failed");
      } finally {
        setLoading(false);
      }
    },
    [files]
  );

  // Text merge: concatenate plain text files and show preview
  const runTextMerge = useCallback(async () => {
    if (!files.length) {
      showToast("error", "Upload text files to merge");
      return;
    }
    setLoading(true);
    setResultBlobUrl(null);
    setResultFilename("");
    try {
      let combined = "";
      for (const f of files) {
        const text = await f.text();
        combined += `/* ===== ${f.name} ===== */\n` + text + "\n\n";
      }
      setTextPreview(combined);
      const blob = new Blob([combined], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      setResultBlobUrl(url);
      setResultFilename(`merged-${Date.now()}.txt`);
      setPreviewUrl(null);
      showToast("success", "Text files merged");
    } catch (err) {
      console.error(err);
      showToast("error", "Text merge failed");
    } finally {
      setLoading(false);
    }
  }, [files]);

  // CSV merge: simple: keep header from first csv (if preserveHeader true), and append all rows from subsequent
  const runCsvMerge = useCallback(async () => {
    if (!files.length) {
      showToast("error", "Upload CSV files to merge");
      return;
    }
    setLoading(true);
    setResultBlobUrl(null);
    setResultFilename("");
    try {
      let output = "";
      let header = null;
      for (let idx = 0; idx < files.length; idx++) {
        const f = files[idx];
        const txt = await f.text();
        const rows = txt.split(/\r?\n/).filter(Boolean);
        if (!rows.length) continue;
        if (idx === 0) {
          header = rows[0];
          output += rows.join("\n") + "\n";
        } else {
          // skip header line if same or preserveHeader true
          const start = preserveHeader ? 1 : 0;
          for (let i = start; i < rows.length; i++) {
            output += rows[i] + "\n";
          }
        }
      }
      const blob = new Blob([output], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      setResultBlobUrl(url);
      setResultFilename(`merged-${Date.now()}.csv`);
      setTextPreview(output.slice(0, 10000)); // show first part
      showToast("success", "CSV files merged");
    } catch (err) {
      console.error(err);
      showToast("error", "CSV merge failed");
    } finally {
      setLoading(false);
    }
  }, [files, preserveHeader]);

  // run action based on selected tool
  const handleRun = useCallback(
    async (opt) => {
      switch (selectedTool) {
        case TOOLS.PDF_MERGE:
          await runPdfMerge();
          break;
        case TOOLS.PDF_SPLIT:
          await runPdfSplit();
          break;
        case TOOLS.IMAGE_MERGE:
          await runImageMerge(opt?.mode || "pdf");
          break;
        case TOOLS.TEXT_MERGE:
          await runTextMerge();
          break;
        case TOOLS.CSV_MERGE:
          await runCsvMerge();
          break;
        default:
          showToast("error", "Unknown tool");
      }
    },
    [selectedTool, runPdfMerge, runPdfSplit, runImageMerge, runTextMerge, runCsvMerge]
  );

  // Download action
  const downloadResult = useCallback(() => {
    if (!resultBlobUrl || !resultFilename) {
      showToast("error", "No result to download");
      return;
    }
    const a = document.createElement("a");
    a.href = resultBlobUrl;
    a.download = resultFilename;
    a.click();
  }, [resultBlobUrl, resultFilename]);

  // Quick file-type hint for the input accept attribute
  const acceptByTool = useMemo(() => {
    switch (selectedTool) {
      case TOOLS.PDF_MERGE:
      case TOOLS.PDF_SPLIT:
        return ".pdf,application/pdf";
      case TOOLS.IMAGE_MERGE:
        return "image/*";
      case TOOLS.TEXT_MERGE:
        return ".txt,text/plain";
      case TOOLS.CSV_MERGE:
        return ".csv,text/csv";
      default:
        return "*/*";
    }
  }, [selectedTool]);

  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
               Merge & Split Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Client-side PDF, image, text and CSV merge & split — preview and download</p>
          </div>

          <div className="flex items-center gap-2">
            
            <Button className="cursor-pointer" variant="outline" onClick={() => { clearAll(); showToast("success", "Cleared inputs"); }}>
              <Trash2 className="w-4 h-4" /> Clear
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
                <span>Controls</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{selectedTool === TOOLS.IMAGE_MERGE ? "Images" : selectedTool === TOOLS.PDF_SPLIT ? "PDF" : "Files"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Tool</Label>
                <Select value={selectedTool} onValueChange={(v) => { setSelectedTool(v); clearAll(); }}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value={TOOLS.PDF_MERGE}>PDF — Merge</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.PDF_SPLIT}>PDF — Split (extract pages)</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.IMAGE_MERGE}>Image — Merge (PDF / Combined PNG)</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.TEXT_MERGE}>Text — Merge (.txt)</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.CSV_MERGE}>CSV — Merge</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                <Label className="text-xs">Upload files</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptByTool}
                  multiple
                  onChange={handleFilesChosen}
                  className="block w-full text-sm file:cursor-pointer text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-md  file:text-sm file:font-semibold file:bg-zinc-100 file:border-zinc-400/50 file:border file:border-dashed file:text-zinc-700 hover:file:bg-zinc-100"
                />

                {selectedTool === TOOLS.PDF_SPLIT && (
                  <>
                    <Label className="text-xs">Pages / ranges (1-based)</Label>
                    <Input placeholder="e.g. 1-3,5" value={splitRanges} onChange={(e) => setSplitRanges(e.target.value)} />
                    <div className="text-xs text-muted-foreground">Example: <code>1-3,5,7</code> extracts pages 1,2,3,5,7</div>
                  </>
                )}

                {selectedTool === TOOLS.IMAGE_MERGE && (
                  <>
                    <Label className="text-xs">Image merge mode</Label>
                    <div className="flex gap-2">
                      <Button className="cursor-pointer" size="sm" onClick={() => handleRun({ mode: "pdf" })}>Merge → PDF</Button>
                      <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => handleRun({ mode: "image" })}>Combine → Image</Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">PDF mode embeds each image on its own PDF page. Combined image stacks them vertically.</div>
                  </>
                )}

                {selectedTool === TOOLS.CSV_MERGE && (
                  <>
                    <Label className="text-xs">CSV options</Label>
                    <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
                className="cursor-pointer"
                id="preserve"
                checked={preserveHeader}
                onCheckedChange={(val) => setPreserveHeader(Boolean(val))}
            />
            <label htmlFor="preserve" className="text-sm">
                Preserve Header
            </label>
            </div>

                      <Label className="text-xs" htmlFor="preserve">Preserve header from first file</Label>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex gap-2">
                  {/* For image merge we've already provided buttons; for others show a generic run */}
                  {selectedTool !== TOOLS.IMAGE_MERGE && (
                    <Button className="flex-1 cursor-pointer" onClick={() => handleRun({ mode: "pdf" })} disabled={loading}>
                      {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <FilePlus className="w-4 h-4 mr-2" />}
                      Run
                    </Button>
                  )}
                  <Button className="cursor-pointer" variant="outline" onClick={clearAll}>Reset</Button>
                </div>

                <div className="text-xs text-muted-foreground">Preview updates after operation. Download result from the panel to the right.</div>
              </div>
            </CardContent>
          </Card>

          {/* file list */}
          <Card className="mt-4 shadow-sm dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Files ({files.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {files.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No files uploaded yet.</div>
                ) : (
                  files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center overflow-hidden gap-3">
                       
                        <div className="text-sm overflow-hidden">
                          <div className="font-medium  truncate">{f.name}</div>
                          <div className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB • {f.type || "file"}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => {
                          // preview this file
                          try {
                            const url = URL.createObjectURL(f);
                            setPreviewUrl(url);
                          } catch {}
                        }}><Eye className="w-4 h-4" /></Button>
                        <Button className="cursor-pointer text-red-500 bg-transparent hover:bg-transparent" size="sm"  onClick={() => removeFile(i)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* center: preview + result */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Preview</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{previewUrl ? "Live preview" : "No preview"}</span>
                {previewUrl && <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { window.open(previewUrl, "_blank"); }}><ArrowDownSquare className="w-4 h-4" /></Button>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-3 bg-white/60 dark:bg-zinc-900/60 min-h-[260px] flex items-stretch">
                {loading ? (
                  <div className="w-full flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin w-10 h-10" />
                    <div className="text-sm text-muted-foreground mt-3">Processing…</div>
                  </div>
                ) : previewUrl ? (
                  // For PDFs and images, use embed/object/iframe. For other text show Textarea
                  (previewUrl && /\.(png|jpg|jpeg|gif|bmp)$/i.test(previewUrl)) ? (
                    <img src={previewUrl} alt="preview" className="max-h-[520px] w-full object-contain" />
                  ) : (
                    <iframe src={previewUrl} title="preview" className="w-full h-[520px] border rounded" />
                  )
                ) : textPreview ? (
                  <Textarea value={textPreview} readOnly className="min-h-[260px]" />
                ) : (
                  <div className="w-full h-full flex flex-col items-start justify-center text-sm text-muted-foreground">
                    <div className="text-base font-medium mb-2">No preview available</div>
                    <div>Run an operation to see results, or click file preview on the file list.</div>
                  </div>
                )}
              </div>

              {/* result download */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Result: {resultFilename || "—"}</div>
                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" size="sm" onClick={downloadResult} disabled={!resultBlobUrl}><Download className="w-4 h-4 mr-2" />Download</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { if (resultBlobUrl) { navigator.clipboard.writeText(resultBlobUrl); showToast("success", "Result URL copied"); } else showToast("error", "No result URL"); }}>Copy URL</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* text preview area for big text outputs */}
          {selectedTool === TOOLS.TEXT_MERGE || selectedTool === TOOLS.CSV_MERGE ? (
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader><CardTitle>Output Preview</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={textPreview} onChange={(e) => setTextPreview(e.target.value)} className="min-h-[200px]" />
                <div className="mt-3 text-xs text-muted-foreground">You can edit the merged result here before downloading.</div>
              </CardContent>
            </Card>
          ) : null}
        </main>

        {/* right: details & quick actions */}
        <aside className="lg:col-span-3">
          <div className="space-y-4">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader><CardTitle>Details & Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>Tool</div>
                    <div className="font-medium">{selectedTool.replace("_", " ").toUpperCase()}</div>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Button className="cursor-pointer" size="sm" onClick={() => { if (selectedTool === TOOLS.IMAGE_MERGE) handleRun({ mode: "pdf" }); else handleRun(); }}>Run</Button>
                    <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setFiles([]); setPreviewUrl(null); setResultBlobUrl(null); setResultFilename(""); if (fileInputRef.current) fileInputRef.current.value = null; }}>Clear inputs</Button>
                    <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { if (resultBlobUrl) { window.open(resultBlobUrl, "_blank"); } else showToast("error", "No result"); }}>Open result</Button>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    Tips:
                    <ul className="list-disc ml-4 mt-2">
                      <li>PDF merge will skip non-PDF files.</li>
                      <li>PDF split uses 1-based page numbers; input like <code>1-3,5</code>.</li>
                      <li>CSV merge preserves first header by default.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader><CardTitle>Quick Examples</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div><strong>Merge PDFs</strong>: Select multiple PDFs and click Run.</div>
                  <div><strong>Split PDF</strong>: Upload a PDF and enter pages like <code>2,4-6</code>.</div>
                  <div><strong>Image → PDF</strong>: Upload images, choose Merge → PDF.</div>
                  <div><strong>CSV</strong>: Upload CSVs with same columns for best result.</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
