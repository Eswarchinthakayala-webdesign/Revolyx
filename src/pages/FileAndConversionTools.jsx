// src/pages/FileAndConversionTools.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Loader2,
  Download,
  Image as ImageIcon,
  Zap,
  AlertCircle,
  Layers,
  Settings,
  FileText,
  Columns,
  Hash,
  Archive,
  Film,
  ImageIcon as ImgIcon,
  Feather,
  Video,
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
import { toast } from "sonner";

import heic2any from "heic2any";
import JSZip from "jszip";
import { parseGIF, decompressFrames } from "gifuct-js";
import GIF from "gif.js.optimized"; // browser-friendly encoder
import pdfToText from "react-pdftotext";

/* ---------- Utilities ---------- */

const readFileAsArrayBuffer = (file) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsArrayBuffer(file);
  });

const readFileAsDataURL = (file) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

function estimatePasswordEntropy(password) {
  if (!password) return { bits: 0, guesses: 0, seconds: 0 };
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 32;
  const bits = Math.log2(Math.pow(pool, password.length));
  const guesses = Math.pow(pool, password.length);
  const guessesPerSecond = 1e9;
  const seconds = guesses / guessesPerSecond;
  return { bits: Math.round(bits * 100) / 100, guesses, seconds };
}

function formatDurationSeconds(sec) {
  if (!isFinite(sec) || sec <= 0) return "unbounded";
  const units = [
    ["years", 60 * 60 * 24 * 365],
    ["days", 60 * 60 * 24],
    ["hours", 60 * 60],
    ["minutes", 60],
    ["seconds", 1],
  ];
  for (const [name, v] of units) {
    if (sec >= v) {
      const val = Math.floor(sec / v);
      return `${val} ${name}`;
    }
  }
  return `${Math.round(sec)}s`;
}

async function sha256HashOfFile(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }
  if (field !== "" || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

/* ---------- Component ---------- */

export default function FileAndConversionTools() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const TOOLS = {
    HEIC2JPG: "heic2jpg",
    ZIP_PW_EST: "zip_pw_est",
    HASH_COMPARE: "hash_compare",
    SIZE_PREDICT: "size_predict",
    CSV_DEDUP: "csv_dedup",
    PDF_EXTRACT: "pdf_extract",
    VIDEO_BITRATE: "video_bitrate",
    SPRITE_GEN: "sprite_gen",
    GIF_SPEED: "gif_speed",
    ICON_EXPORT: "icon_export",
  };

  const [selectedTool, setSelectedTool] = useState(TOOLS.HEIC2JPG);

  const [loading, setLoading] = useState(false);
  const [resultPreview, setResultPreview] = useState(null);
  const [log, setLog] = useState("");
  const fileInputRef = useRef(null);

  // HEIC
  const [heicFile, setHeicFile] = useState(null);
  // zip pw
  const [pwValue, setPwValue] = useState("");
  const [pwEstimate, setPwEstimate] = useState(null);
  // hash compare
  const [hashFileA, setHashFileA] = useState(null);
  const [hashFileB, setHashFileB] = useState(null);
  const [hashA, setHashA] = useState(null);
  const [hashB, setHashB] = useState(null);
  // size predict
  const [sizeFile, setSizeFile] = useState(null);
  const [sizeEstimate, setSizeEstimate] = useState(null);
  // csv dedup
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [csvDedupResult, setCsvDedupResult] = useState(null);
  // pdf extract
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfText, setPdfText] = useState("");
  // video bitrate
  const [videoFile, setVideoFile] = useState(null);
  const [videoBitrateResult, setVideoBitrateResult] = useState(null);
  // sprite
  const [spriteFiles, setSpriteFiles] = useState([]);
  const [spriteResultUrl, setSpriteResultUrl] = useState(null);
  // gif
  const [gifFile, setGifFile] = useState(null);
  const [gifSpeedFactor, setGifSpeedFactor] = useState(1.0);
  const [modifiedGifUrl, setModifiedGifUrl] = useState(null);
  // svg export
  const [svgFiles, setSvgFiles] = useState([]);


  const [file1, setFile1] = useState(null);

  const appendLog = (msg) => setLog((s) => `${new Date().toLocaleTimeString()} • ${msg}\n${s}`);

  const onFileChange = useCallback((e, setter) => {
    const f = e.target.files?.[0];
    setFile1(f)
    if (!f) return;
    setter(f);
  }, []);

  const onMultiFileChange = useCallback((e, setter) => {
    const files = Array.from(e.target.files || []);
    setter(files);
  }, []);

  /* HEIC -> JPG */
  const convertHeicToJpg = useCallback(async () => {
    if (!heicFile) { showToast("error", "Choose a HEIC/HEIF file first."); return; }
    setLoading(true);
    setResultPreview(null);
    appendLog(`Converting ${heicFile.name}...`);
    try {
      const arrayBuffer = await heicFile.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: heicFile.type || "image/heic" });
      const outBlob = await heic2any({ blob, toType: "image/jpeg", quality: 0.92 });
      const url = URL.createObjectURL(outBlob);
      setResultPreview({ url, filename: `${heicFile.name.replace(/\.[^.]+$/, "")}.jpg`, blob: outBlob });
      appendLog("Conversion successful.");
      showToast("success", "Converted to JPG (preview ready).");
    } catch (err) {
      console.error(err);
      appendLog("Conversion failed.");
      showToast("error", `Conversion failed: ${String(err?.message ?? err)}`);
    } finally {
      setLoading(false);
    }
  }, [heicFile]);

  /* ZIP password estimator */
  const evaluatePassword = useCallback(() => {
    const r = estimatePasswordEntropy(pwValue);
    setPwEstimate(r);
  }, [pwValue]);

  /* Hash compare */
  const computeHashA = useCallback(async () => {
    if (!hashFileA) { showToast("error", "Choose file A"); return; }
    setLoading(true);
    appendLog(`Hashing ${hashFileA.name}...`);
    try {
      const h = await sha256HashOfFile(hashFileA);
      setHashA(h);
      appendLog("Hash A computed.");
      showToast("success", "Hash A computed");
    } catch (err) {
      appendLog("Hash A failed.");
      showToast("error", "Hash A failed");
    } finally { setLoading(false); }
  }, [hashFileA]);

  const computeHashB = useCallback(async () => {
    if (!hashFileB) { showToast("error", "Choose file B"); return; }
    setLoading(true);
    appendLog(`Hashing ${hashFileB.name}...`);
    try {
      const h = await sha256HashOfFile(hashFileB);
      setHashB(h);
      appendLog("Hash B computed.");
      showToast("success", "Hash B computed");
    } catch (err) {
      appendLog("Hash B failed.");
      showToast("error", "Hash B failed");
    } finally { setLoading(false); }
  }, [hashFileB]);

  const compareHashes = useCallback(() => {
    if (!hashA || !hashB) { showToast("error", "Compute both hashes first"); return; }
    const equal = hashA === hashB;
    appendLog(`Compare result: ${equal ? "MATCH" : "DIFFER"}`);
    showToast(equal ? "success" : "error", equal ? "Files match (SHA-256)" : "Files differ (SHA-256)");
  }, [hashA, hashB]);

  /* Size predictor */
  const estimateCompressedSize = useCallback(async () => {
    if (!sizeFile) { showToast("error", "Pick a file to estimate"); return; }
    setLoading(true);
    appendLog(`Estimating compressed size for ${sizeFile.name}...`);
    try {
      const name = sizeFile.name.toLowerCase();
      const type = sizeFile.type || "";
      const size = sizeFile.size;
      let ratio = 0.5;
      if (type.startsWith("image/") || name.match(/\.(jpg|jpeg|png|webp|heic|gif)$/)) ratio = 0.95;
      else if (type.startsWith("video/") || name.match(/\.(mp4|mov|mkv|webm)$/)) ratio = 0.98;
      else if (type === "application/pdf" || name.endsWith(".pdf")) ratio = 0.9;
      else if (name.endsWith(".csv") || name.endsWith(".txt") || type.startsWith("text/")) ratio = 0.25;
      else if (name.endsWith(".json")) ratio = 0.3;
      else ratio = 0.6;
      const estimated = Math.round(size * ratio);
      setSizeEstimate({ original: size, estimate: estimated, ratio });
      appendLog(`Estimated compressed size: ${estimated} bytes (ratio ${ratio})`);
      showToast("success", "Estimate ready");
    } catch (err) {
      appendLog("Estimate failed");
      showToast("error", "Estimate failed");
    } finally { setLoading(false); }
  }, [sizeFile]);

  /* CSV dedup */
  const previewCsv = useCallback(async () => {
    if (!csvFile) { showToast("error", "Choose a CSV file first"); return; }
    setLoading(true);
    appendLog(`Parsing CSV ${csvFile.name}...`);
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);
      setCsvPreviewRows(rows.slice(0, 20));
      showToast("success", "Preview loaded");
    } catch (err) {
      appendLog("CSV parse failed");
      showToast("error", "CSV parse failed");
    } finally { setLoading(false); }
  }, [csvFile]);

  const dedupCsv = useCallback(async () => {
    if (!csvFile) { showToast("error", "Choose a CSV file first"); return; }
    setLoading(true);
    appendLog(`Deduplicating ${csvFile.name}...`);
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { showToast("error", "No rows found"); setLoading(false); return; }
      const header = rows[0];
      const body = rows.slice(1);
      const seen = new Set();
      const deduped = [];
      for (const r of body) {
        const key = r.join("|");
        if (!seen.has(key)) { seen.add(key); deduped.push(r); }
      }
      const csvOutRows = [header, ...deduped];
      const csvText = csvOutRows.map((r) => r.map((cell) => (cell.includes(",") || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell)).join(",")).join("\n");
      setCsvDedupResult({ text: csvText, rows: csvOutRows.length });
      appendLog(`Deduplicated to ${csvOutRows.length} rows`);
      showToast("success", `Deduplicated: ${csvOutRows.length} rows`);
    } catch (err) {
      appendLog("Deduplicate failed");
      showToast("error", "Deduplicate failed");
    } finally { setLoading(false); }
  }, [csvFile]);

  /* PDF extract using react-pdftotext */
  const extractPdfText = useCallback(async () => {
    if (!pdfFile) { showToast("error", "Choose a PDF file"); return; }
    setLoading(true);
    appendLog(`Extracting text from ${pdfFile.name}...`);
    try {
      const text = await pdfToText(pdfFile);
      if (typeof text !== "string" || text.trim().length === 0) {
        setPdfText("");
        appendLog("No text found in PDF (may be image-based).");
        showToast("warning", "No extractable text found (PDF might be scanned images).");
      } else {
        setPdfText(text);
        appendLog("PDF text extraction complete");
        showToast("success", "Extracted PDF text");
      }
    } catch (err) {
      console.error("PDF extraction error:", err);
      appendLog("PDF extraction failed");
      showToast("error", `PDF extraction failed: ${String(err?.message ?? err)}`);
    } finally { setLoading(false); }
  }, [pdfFile]);

  /* Video bitrate */
  const calculateVideoBitrate = useCallback(async () => {
    if (!videoFile) { showToast("error", "Choose a video file first"); return; }
    setLoading(true);
    appendLog(`Calculating bitrate for ${videoFile.name}...`);
    try {
      const url = URL.createObjectURL(videoFile);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      await new Promise((res, rej) => {
        const onLoaded = () => res();
        const onError = () => rej(new Error("Failed to read video metadata"));
        video.addEventListener("loadedmetadata", onLoaded, { once: true });
        video.addEventListener("error", onError, { once: true });
      });
      const duration = video.duration || 0;
      URL.revokeObjectURL(url);
      if (!duration || !isFinite(duration) || duration === 0) {
        appendLog("Video duration unavailable");
        showToast("error", "Could not determine video duration");
        setLoading(false);
        return;
      }
      const bits = videoFile.size * 8;
      const bitrate = Math.round(bits / duration);
      const kbps = Math.round(bitrate / 1000);
      setVideoBitrateResult({ bitrate, kbps, duration });
      appendLog(`Bitrate ~ ${kbps} kbps`);
      showToast("success", "Bitrate calculated");
    } catch (err) {
      appendLog("Bitrate calc failed");
      showToast("error", "Bitrate calc failed");
    } finally { setLoading(false); }
  }, [videoFile]);

  /* Sprite sheet */
  const buildSpriteSheet = useCallback(async (columns = 4, padding = 4) => {
    if (!spriteFiles || spriteFiles.length === 0) { showToast("error", "Upload images first"); return; }
    setLoading(true);
    appendLog(`Generating sprite sheet for ${spriteFiles.length} images...`);
    try {
      const imgs = await Promise.all(spriteFiles.map((f) => new Promise((res, rej) => {
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); res({ img, w: img.width, h: img.height, name: f.name }); };
        img.onerror = (e) => rej(e);
        img.src = url;
      })));
      const maxW = Math.max(...imgs.map((i) => i.w));
      const maxH = Math.max(...imgs.map((i) => i.h));
      const cols = Math.min(columns, imgs.length);
      const rows = Math.ceil(imgs.length / cols);
      const canvasW = cols * maxW + (cols - 1) * padding;
      const canvasH = rows * maxH + (rows - 1) * padding;
      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!isDark) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvasW, canvasH); } else { ctx.clearRect(0, 0, canvasW, canvasH); }
      const cssMap = {};
      for (let i = 0; i < imgs.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * (maxW + padding);
        const y = row * (maxH + padding);
        const { img, name } = imgs[i];
        const offsetX = x + Math.round((maxW - img.width) / 2);
        const offsetY = y + Math.round((maxH - img.height) / 2);
        ctx.drawImage(img, offsetX, offsetY);
        cssMap[name] = { x: offsetX, y: offsetY, w: img.width, h: img.height };
      }
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const url = URL.createObjectURL(blob);
      setSpriteResultUrl({ url, blob, cssMap, width: canvasW, height: canvasH });
      appendLog("Sprite generated.");
      showToast("success", "Sprite sheet ready");
    } catch (err) {
      console.error(err);
      appendLog("Sprite generation failed");
      showToast("error", "Sprite generation failed");
    } finally { setLoading(false); }
  }, [spriteFiles, isDark]);

  const downloadSpriteZip = useCallback(async () => {
    if (!spriteResultUrl) { showToast("error", "Generate sprite first"); return; }
    setLoading(true);
    appendLog("Preparing zip...");
    try {
      const zip = new JSZip();
      const spriteBlob = spriteResultUrl.blob;
      zip.file("sprite.png", spriteBlob);
      let css = `.icon { background-image: url('sprite.png'); background-repeat: no-repeat; display: inline-block; }\n`;
      Object.entries(spriteResultUrl.cssMap).forEach(([name, r]) => {
        const cls = name.replace(/\.[^.]+$/, "").replace(/\s+/g, "-").toLowerCase();
        css += `.icon-${cls} { width: ${r.w}px; height: ${r.h}px; background-position: -${r.x}px -${r.y}px; }\n`;
      });
      zip.file("sprite.css", css);
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sprite-pack-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      appendLog("Zip ready");
      showToast("success", "Downloaded sprite zip");
    } catch (err) {
      appendLog("Zip failed");
      showToast("error", "Zip failed");
    } finally { setLoading(false); }
  }, [spriteResultUrl]);

  /* GIF speed change using gif.js (browser encoder) + gifuct-js (parser) */
/* Robust GIF speed changer — worker fetched as blob, better diagnostics, longer timeout */
const changeGifSpeed = useCallback(async () => {
  if (!gifFile) {
    showToast("error", "Upload a GIF first");
    return;
  }

  setLoading(true);
  appendLog(`Altering GIF speed (factor ${gifSpeedFactor})...`);

  let finished = false;
  const finishCleanup = (resultBlob, err) => {
    if (finished) return;
    finished = true;
    try {
      if (resultBlob) {
        const url = URL.createObjectURL(resultBlob);
        setModifiedGifUrl({ url, blob: resultBlob });
        appendLog("GIF updated (finished).");
        showToast("success", "Modified GIF ready (preview)");
      } else if (err) {
        appendLog(`GIF modify error: ${String(err)}`);
        showToast("error", `GIF modify failed: ${String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  let workerBlobUrl = null;
  try {
    // 1) fetch worker script as blob to avoid path/CORS issues
    appendLog("Fetching worker script /gif.worker.js as blob...");
    const workerResp = await fetch("/gif.worker.js");
    if (!workerResp.ok) {
      throw new Error(`/gif.worker.js fetch failed: ${workerResp.status}`);
    }
    const workerText = await workerResp.text();
    const workerBlob = new Blob([workerText], { type: "application/javascript" });
    workerBlobUrl = URL.createObjectURL(workerBlob);
    appendLog("Worker blob created.");

    // 2) parse GIF and frames
    const arrayBuf = await gifFile.arrayBuffer();
    const gif = parseGIF(arrayBuf);
    const frames = decompressFrames(gif, true);
    if (!frames || frames.length === 0) throw new Error("No frames parsed from GIF");

    const width = Math.max(1, Math.floor(frames[0].dims.width || 0));
    const height = Math.max(1, Math.floor(frames[0].dims.height || 0));

    // 3) create encoder with blob worker URL
    const encoder = new GIF({
      workers: 1, // single worker tends to be more stable in browsers
      quality: 10, // 10 is a balanced quality / performance; increase to 20 to reduce CPU if needed
      workerScript: workerBlobUrl,
    });

    // diagnostics
    appendLog("Encoder created; attaching listeners...");
    encoder.on && encoder.on("start", () => appendLog("Encoder start"));
    encoder.on && encoder.on("progress", (p) => appendLog(`Encoder progress: ${(p * 100).toFixed(1)}%`));
    encoder.on && encoder.on("error", (e) => appendLog(`Encoder error event: ${String(e)}`));

    // Safety timeout (120s)
    const TIMEOUT_MS = 120_000;
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("GIF encoding timed out")), TIMEOUT_MS);
    });

    // 4) add frames — compose each frame into a full-size tmp canvas before adding
    for (const fr of frames) {
      const fW = Math.max(1, Math.floor(fr.dims.width || 0));
      const fH = Math.max(1, Math.floor(fr.dims.height || 0));
      const fLeft = Math.max(0, Math.floor(fr.dims.left || 0));
      const fTop = Math.max(0, Math.floor(fr.dims.top || 0));

      // imageData
      const patchArray = new Uint8ClampedArray(fr.patch);
      const imgData = new ImageData(patchArray, Math.max(1, fW), Math.max(1, fH));

      // full-size tmp canvas
      const tmp = document.createElement("canvas");
      tmp.width = width;
      tmp.height = height;
      const tctx = tmp.getContext("2d");
      tctx.clearRect(0, 0, width, height);

      // small canvas to putImageData then draw onto tmp
      const small = document.createElement("canvas");
      small.width = Math.max(1, fW);
      small.height = Math.max(1, fH);
      const sctx = small.getContext("2d");
      sctx.putImageData(imgData, 0, 0);
      tctx.drawImage(small, fLeft, fTop);

      const origDelayCS = Number(fr.delay || 10);
      const origDelayMs = origDelayCS * 10;
      const newDelayMs = Math.max(20, Math.round(origDelayMs / (Number(gifSpeedFactor) || 1)));

      encoder.addFrame(tmp, { copy: true, delay: newDelayMs });
    }

    // 5) render -> promise race with timeout
    const renderPromise = new Promise((resolve, reject) => {
      let settled = false;
      encoder.on("finished", (blob) => {
        if (settled) return;
        settled = true;
        resolve(blob);
      });
      encoder.on("error", (err) => {
        if (settled) return;
        settled = true;
        reject(err);
      });
      try {
        encoder.render();
      } catch (e) {
        if (settled) return;
        settled = true;
        reject(e);
      }
    });

    const outBlob = await Promise.race([renderPromise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
    finishCleanup(outBlob, null);
  } catch (err) {
    finishCleanup(null, err);
  } finally {
    if (workerBlobUrl) {
      try {
        URL.revokeObjectURL(workerBlobUrl);
        appendLog("Worker blob URL revoked.");
      } catch {}
    }
  }
}, [gifFile, gifSpeedFactor]);


  /* SVG pack export */
  const exportSvgZip = useCallback(async () => {
    if (!svgFiles || svgFiles.length === 0) { showToast("error", "Upload SVG files first"); return; }
    setLoading(true);
    appendLog(`Packaging ${svgFiles.length} SVG(s) ...`);
    try {
      const zip = new JSZip();
      for (const f of svgFiles) {
        const text = await f.text();
        zip.file(f.name, text);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `icons-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      appendLog("SVG pack exported");
      showToast("success", "SVG pack exported");
    } catch (err) {
      appendLog("SVG zip failed");
      showToast("error", "SVG zip failed");
    } finally { setLoading(false); }
  }, [svgFiles]);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toolLabel = useMemo(() => {
    switch (selectedTool) {
      case TOOLS.HEIC2JPG: return "HEIC → JPG Converter";
      case TOOLS.ZIP_PW_EST: return "ZIP Password Strength Tester (Estimator)";
      case TOOLS.HASH_COMPARE: return "File Hash Compare (SHA-256)";
      case TOOLS.SIZE_PREDICT: return "File Size Predictor (Compression Estimate)";
      case TOOLS.CSV_DEDUP: return "CSV Deduplicator";
      case TOOLS.PDF_EXTRACT: return "PDF Text Extractor (Client-side)";
      case TOOLS.VIDEO_BITRATE: return "Video Bitrate Calculator";
      case TOOLS.SPRITE_GEN: return "Sprite Sheet Generator";
      case TOOLS.GIF_SPEED: return "GIF Speed Changer (Browser)";
      case TOOLS.ICON_EXPORT: return "Icon Pack Exporter (ZIP of SVGs)";
      default: return "File & Conversion Tool";
    }
  }, [selectedTool]);

  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
               File & Conversion Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Client-side utilities: convert, inspect, extract, export.</p>
          </div>

        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tools</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{selectedTool === TOOLS.SPRITE_GEN ? "Graphics" : "Files"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select tool</Label>
                <Select value={selectedTool} onValueChange={(v) => setSelectedTool(v)}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value={TOOLS.HEIC2JPG}><ImageIcon className="mr-2 inline" /> HEIC → JPG</SelectItem>
                    <SelectItem className="cursor-pointer"  value={TOOLS.ZIP_PW_EST}><Archive className="mr-2 inline" /> ZIP password estimator</SelectItem>
                    <SelectItem className="cursor-pointer"  value={TOOLS.HASH_COMPARE}><Hash className="mr-2 inline" /> File hash compare</SelectItem>
                    <SelectItem className="cursor-pointer"  value={TOOLS.SIZE_PREDICT}><FileText className="mr-2 inline" /> File size predictor</SelectItem>
                    <SelectItem className="cursor-pointer"  value={TOOLS.CSV_DEDUP}><Columns className="mr-2 inline" /> CSV deduplicator</SelectItem>
                    <SelectItem className="cursor-pointer"  value={TOOLS.PDF_EXTRACT}><FileText className="mr-2 inline" /> PDF text extractor</SelectItem>
                    <SelectItem className="cursor-pointer"  value={TOOLS.VIDEO_BITRATE}><Film className="mr-2 inline" /> Video bitrate calculator</SelectItem>
                    <SelectItem className="cursor-pointer"  value={TOOLS.SPRITE_GEN}><ImgIcon className="mr-2 inline" /> Sprite sheet generator</SelectItem>

                    <SelectItem className="cursor-pointer"  value={TOOLS.ICON_EXPORT}><FileText className="mr-2 inline" /> Icon pack exporter (SVG → ZIP)</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                {selectedTool === TOOLS.HEIC2JPG && (
                  <>
                    <Label className="text-xs">HEIC / HEIF file</Label>
                    <div className="relative">
                    <Input type="file" accept="image/heic,image/heif" onChange={(e) => onFileChange(e, setHeicFile)} className="border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" />
                    <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <ImageIcon className="w-4  h-4 mr-2" />
                    {heicFile ? heicFile.name : "Click or drag to upload an image"}
                    </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={convertHeicToJpg} disabled={!heicFile || loading}>Convert</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setHeicFile(null); setResultPreview(null); }}>Clear</Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Converted image will be shown in preview; you can download it as JPG.</div>
                  </>
                )}

                {selectedTool === TOOLS.ZIP_PW_EST && (
                  <>
                    <Label className="text-xs">Password to test</Label>
                    <Input value={pwValue} onChange={(e) => setPwValue(e.target.value)} placeholder="Type a password..." />
                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={evaluatePassword}>Estimate strength</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setPwValue(""); setPwEstimate(null); }}>Clear</Button>
                    </div>
                    {pwEstimate && (
                      <div className="mt-3 text-sm">
                         <div className="text-sm">Bits: <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">{pwEstimate.bits}</Badge></div>
                        <div className="text-sm">Est. brute force time at 1e9 g/s: <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{formatDurationSeconds(pwEstimate.seconds)}</Badge></div>
                     </div>
                    )}
                  </>
                )}

                {selectedTool === TOOLS.HASH_COMPARE && (
                  <>
                    <Label className="text-xs">Select File A</Label>
                    <div className="relative">
                    <Input className="border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" type="file" onChange={(e) => onFileChange(e, setHashFileA)} />
                    
                    <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <FileText className="w-4  h-4 mr-2" />
                    {hashFileA ? hashFileA.name : "Click to upload"}
                    </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={computeHashA} disabled={!hashFileA || loading}>Compute A</Button>
                      <div className="text-sm opacity-70 self-center">{hashA ? <span className="font-mono text-xs">{hashA.slice(0, 8)}…</span> : null}</div>
                    </div>

                    <Label className="text-xs mt-3">Select File B</Label>

                    <div className="relative">
                    <Input  className="border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" type="file" onChange={(e) => onFileChange(e, setHashFileB)} />
                    <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <FileText className="w-4  h-4 mr-2" />
                    {hashFileB ? hashFileB.name : "Click to upload"}
                    </div>

                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button className="cursor-pointer" onClick={computeHashB} disabled={!hashFileB || loading}>Compute B</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={compareHashes} disabled={!hashA || !hashB}>Compare</Button>
                    </div>
                    {hashA && hashB && (
                      <div className="mt-2 text-sm ">
                        <div>Hash A: <p className="font-mono overflow-x-auto text-xs">{hashA}</p></div>
                        <div>Hash B: <p className="font-mono overflow-x-auto text-xs">{hashB}</p></div>
                        <div className="mt-1">{hashA === hashB ? <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">MATCH</Badge> : <Badge className="backdrop-blur-md   rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300">DIFFER</Badge>}</div>
                      </div>
                    )}
                  </>
                )}

                {selectedTool === TOOLS.SIZE_PREDICT && (
                  <>
                    <Label className="text-xs">Pick a file</Label>
                    <div className="relative">
                    <Input className="border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" type="file" onChange={(e) => onFileChange(e, setSizeFile)} />
                       <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <FileText className="w-4  h-4 mr-2" />
                    {sizeFile ? sizeFile.name : "Click to upload"}
                    </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className='cursor-pointer' onClick={estimateCompressedSize} disabled={!sizeFile || loading}>Estimate</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setSizeFile(null); setSizeEstimate(null); }}>Clear</Button>
                    </div>
                    {sizeEstimate && (
                      <div className="mt-3 flex flex-col gap-1 text-sm">
                        <div>Original: <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300" >{(sizeEstimate.original / 1024).toFixed(2)} KB</Badge></div>
                        <div>Estimate: <Badge className="backdrop-blur-md bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">{(sizeEstimate.estimate / 1024).toFixed(2)} KB</Badge> (ratio {sizeEstimate.ratio})</div>
                      </div>
                    )}
                  </>
                )}

                {selectedTool === TOOLS.CSV_DEDUP && (
                  <>
                    <Label className="text-xs">CSV file</Label>
                    <div className="relative">
                    <Input className="border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" type="file" accept=".csv,text/csv" onChange={(e) => onFileChange(e, setCsvFile)} />
                           <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <FileText className="w-4  h-4 mr-2" />
                    {csvFile ? csvFile.name : "Click to upload"}
                    </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={previewCsv} disabled={!csvFile || loading}>Preview</Button>
                      <Button className="cursor-pointer" onClick={dedupCsv} disabled={!csvFile || loading}>Deduplicate</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setCsvFile(null); setCsvPreviewRows([]); setCsvDedupResult(null); }}>Clear</Button>
                    </div>
                    {csvPreviewRows.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium mb-2">Preview (first 20 rows)</div>
                        <div className="overflow-auto border rounded p-2 max-h-48">
                          <table className="table-auto text-sm w-full">
                            <tbody>
                              {csvPreviewRows.map((r, idx) => (
                                <tr key={idx}><td className="p-1 align-top whitespace-pre">{r.join(" | ")}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {csvDedupResult && (
                      <div className="mt-3">
                        <div className="text-sm">Deduplicated rows: <strong>{csvDedupResult.rows}</strong></div>
                        <div className="mt-2">
                          <Button className="cursor-pointer"  onClick={() => downloadBlob(new Blob([csvDedupResult.text], { type: "text/csv" }), `dedup-${csvFile.name}`)}>Download CSV</Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedTool === TOOLS.PDF_EXTRACT && (
                  <>
                    <Label className="text-xs">PDF file</Label>
                    <div className="relative">
                    <Input className="border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" type="file" accept="application/pdf" onChange={(e) => onFileChange(e, setPdfFile)} />
                            <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <FileText className="w-4  h-4 mr-2" />
                    {pdfFile ? pdfFile.name : "Click to upload"}
                    </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={extractPdfText} disabled={!pdfFile || loading}>Extract text</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setPdfFile(null); setPdfText(""); }}>Clear</Button>
                    </div>
                    {pdfText && (
                      <div className="mt-3">
                        <div className="text-sm font-medium">Extracted text (preview)</div>
                        <div className="max-h-44 overflow-auto border rounded p-2 text-xs whitespace-pre-wrap">{pdfText.slice(0, 5000)}</div>
                        <div className="mt-2">
                          <Button className="cursor-pointer" onClick={() => downloadBlob(new Blob([pdfText], { type: "text/plain" }), `${pdfFile.name}.txt`)}>Download text</Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedTool === TOOLS.VIDEO_BITRATE && (
                  <>
                    <Label className="text-xs">Video file</Label>
                    <div className="relative">
                    <Input className="border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" type="file" accept="video/*" onChange={(e) => onFileChange(e, setVideoFile)} />
                                 <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <Video className="w-4  h-4 mr-2" />
                    {videoFile ? videoFile.name : "Click to upload"}
                    </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={calculateVideoBitrate} disabled={!videoFile || loading}>Calculate</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setVideoFile(null); setVideoBitrateResult(null); }}>Clear</Button>
                    </div>
                    {videoBitrateResult && (
                      <div className="mt-3 flex flex-col gap-1 text-sm">
                        <div>Duration: <Badge className="backdrop-blur-md bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300" >{videoBitrateResult.duration.toFixed(2)} s</Badge></div>
                        <div>Estimated bitrate: <Badge className="backdrop-blur-md bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">{videoBitrateResult.kbps} kbps</Badge></div>
                      </div>
                    )}
                  </>
                )}

                {selectedTool === TOOLS.SPRITE_GEN && (
                  <>
                    <Label className="text-xs">Images (PNG/JPG/SVG)</Label>
                    <div className="relative">
                        
                    <Input className="border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" type="file" accept="image/*" multiple onChange={(e) => onMultiFileChange(e, setSpriteFiles)} />
                                 <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <ImageIcon className="w-4  h-4 mr-2" />
                    {spriteFiles.length===0?"Click to Upload":(spriteFiles.length===1 ? spriteFiles[0].name : spriteFiles.length)}
                    </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={() => buildSpriteSheet(4, 8)} disabled={!spriteFiles.length || loading}>Generate (4 cols)</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setSpriteFiles([]); setSpriteResultUrl(null); }}>Clear</Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Uploads: {spriteFiles.length} images</div>
                  </>
                )}

                {selectedTool === TOOLS.GIF_SPEED && (
                  <>
                    <Label className="text-xs">GIF file</Label>
                    <Input type="file" accept="image/gif" onChange={(e) => onFileChange(e, setGifFile)} />
                    <Label className="text-xs mt-2">Speed factor (0.5 = half speed, 2 = double speed)</Label>
                    <Input value={gifSpeedFactor} onChange={(e) => setGifSpeedFactor(Number(e.target.value) || 1)} />
                    <div className="flex gap-2 mt-3">
                      <Button onClick={changeGifSpeed} disabled={!gifFile || loading}>Apply</Button>
                      <Button variant="outline" onClick={() => { setGifFile(null); setModifiedGifUrl(null); }}>Clear</Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Note: GIF re-encoding on the client is best-effort — some GIFs may not re-encode identical to original.</div>
                  </>
                )}

                {selectedTool === TOOLS.ICON_EXPORT && (
                  <>
                    <Label className="text-xs">SVG files</Label>
                    <div className="relative">
                    <Input className="border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" type="file" accept="image/svg+xml" multiple onChange={(e) => onMultiFileChange(e, setSvgFiles)} />
                             <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                    <ImageIcon className="w-4  h-4 mr-2" />
                    {svgFiles.length===0?"Click to Upload":(svgFiles.length===1 ? svgFiles[0].name : svgFiles.length)}
                    </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button className="cursor-pointer" onClick={exportSvgZip} disabled={!svgFiles.length || loading}>Export ZIP</Button>
                      <Button className="cursor-pointer" variant="outline" onClick={() => { setSvgFiles([]); }}>Clear</Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Upload your SVGs and download a ZIP pack for distribution.</div>
                  </>
                )}

              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80 ">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">{toolLabel}</CardTitle>
                <div className="text-xs text-muted-foreground mt-1">Preview & results</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { if (resultPreview?.blob) downloadBlob(resultPreview.blob, resultPreview.filename); }}>
                  <Download className="w-4 h-4" /> {resultPreview ? "Download" : "No file"}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-950/50 min-h-[220px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="animate-spin w-10 h-10 text-slate-500" />
                    <div className="text-sm text-muted-foreground mt-3">Processing…</div>
                  </div>
                ) : (
                  <>
                    {selectedTool === TOOLS.HEIC2JPG && resultPreview && (
                      <div className="flex flex-col gap-3 items-center">
                        <img src={resultPreview.url} alt="converted" className="max-h-64 object-contain border rounded" />
                        <div>
                          <Button className="cursor-pointer" onClick={() => downloadBlob(resultPreview.blob, resultPreview.filename)}>Download JPG</Button>
                        </div>
                      </div>
                    )}

                    {selectedTool === TOOLS.ZIP_PW_EST && pwEstimate && (
                      <div>
                        <div className="text-sm">Bits: <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">{pwEstimate.bits}</Badge></div>
                        <div className="text-sm">Est. brute force time at 1e9 g/s: <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{formatDurationSeconds(pwEstimate.seconds)}</Badge></div>
                      </div>
                    )}

                    {selectedTool === TOOLS.HASH_COMPARE && (hashA || hashB) && (
                      <div className="text-sm ">
                        <div>Hash A: <p className="font-mono overflow-x-auto text-xs">{hashA || "—"}</p></div>
                        <div>Hash B: <p className="font-mono overflow-x-auto text-xs">{hashB || "—"}</p></div>
                      </div>
                    )}

                    {selectedTool === TOOLS.SIZE_PREDICT && sizeEstimate && (
                      <div className="flex flex-col gap-1">
                        <div className="text-sm">Original: <Badge className="backdrop-blur-md bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300">{(sizeEstimate.original / 1024).toFixed(2)} KB</Badge></div>
                        <div className="text-sm">Estimated compressed: <Badge className='backdrop-blur-md bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300'>{(sizeEstimate.estimate / 1024).toFixed(2)} KB</Badge></div>
                      </div>
                    )}

                    {selectedTool === TOOLS.CSV_DEDUP && csvDedupResult && (
                      <div>
                        <div className="text-sm mb-2">Deduplicated CSV has <strong>{csvDedupResult.rows}</strong> rows.</div>
                        <div className="mt-2">
                          <Button className="cursor-pointer" onClick={() => downloadBlob(new Blob([csvDedupResult.text], { type: "text/csv" }), `dedup-${csvFile.name}`)}>Download</Button>
                        </div>
                      </div>
                    )}

                    {selectedTool === TOOLS.PDF_EXTRACT && pdfText && (
                      <div className="text-xs max-h-64 overflow-auto whitespace-pre-wrap">{pdfText}</div>
                    )}

                    {selectedTool === TOOLS.VIDEO_BITRATE && videoBitrateResult && (
                        
                    <div className="text-sm flex w-full flex-col items-center gap-1">
                        <div className="flex items-start  gap-2 w-full">
                    <div>
                        Duration: 
                        <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        {videoBitrateResult.duration.toFixed(2)} s
                        </Badge>
                    </div>

                    <div>
                        Bitrate:
                        <Badge className="backdrop-blur-md bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                        {videoBitrateResult.kbps} kbps
                        </Badge>
                    </div>
                    </div>

                    {/* 🌟 VIDEO PREVIEW HERE */}
                    {videoFile && (
                        <div className="mt-3 flex items-center ">
                        <video
                            src={URL.createObjectURL(videoFile)}
                            controls
                            className="rounded-md border w-full h-auto shadow-md"
                        />
                        </div>
                    )}
                    </div>

                    )}

                    {selectedTool === TOOLS.SPRITE_GEN && spriteResultUrl && (
                      <div className="flex flex-col gap-3">
                        <img src={spriteResultUrl.url} alt="sprite" className="max-w-full border rounded" />
                        <Badge className="text-xs backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">Sprite size: {spriteResultUrl.width} × {spriteResultUrl.height}</Badge>
                        <div className="flex gap-2">
                          <Button className="cursor-pointer" onClick={() => downloadBlob(spriteResultUrl.blob, "sprite.png")}>Download PNG</Button>
                          <Button className="cursor-pointer" onClick={downloadSpriteZip}>Download ZIP (PNG + CSS)</Button>
                        </div>
                      </div>
                    )}

                    {selectedTool === TOOLS.GIF_SPEED && modifiedGifUrl && (
                      <div>
                        <img src={modifiedGifUrl.url} alt="modified gif" className="max-w-full border rounded" />
                        <div className="mt-2">
                          <Button className="cursor-pointer" onClick={() => downloadBlob(modifiedGifUrl.blob, `modified-${gifFile.name}`)}>Download GIF</Button>
                        </div>
                      </div>
                    )}

                    {selectedTool === TOOLS.ICON_EXPORT && svgFiles.length > 0 && (
                    <div>
                    <div className="text-sm">Uploaded: {svgFiles.length} SVG(s)</div>
                    <div className="space-y-2 overflow-y-auto h-70 no-scrollbar">

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-3">
                        {svgFiles.map((file, idx) => (
                        <div key={idx} className="border p-2 rounded-md bg-muted/40">
                            <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-auto"
                            />
                            <div className="text-xs mt-2 truncate">{file.name}</div>
                        </div>
                        ))}
                    </div>
                    </div>

                    <div className="mt-4">
                        <Button className="cursor-pointer" onClick={exportSvgZip}>Export ZIP</Button>
                    </div>
                    </div>

                    )}

                    {!resultPreview && !pwEstimate && !hashA && !sizeEstimate && !csvDedupResult && !pdfText && !videoBitrateResult && !spriteResultUrl && !modifiedGifUrl && svgFiles.length === 0 && (
                      <div className="text-sm text-muted-foreground">Tool results will appear here. Upload files or run an action from the left panel.</div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Tip: Large files more than 20MB may be slow to process in the browser.</div>
                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { /* placeholder */ }}><Zap className="w-4 h-4 mr-1" />Action</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Activity & Logs</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-36 overflow-auto text-xs whitespace-pre-wrap font-mono bg-black/5 dark:bg-white/5 p-2 rounded">{log || "No activity yet."}</div>
            </CardContent>
          </Card>
        </main>

        <aside className="lg:col-span-3">
          <div className="space-y-4 sticky top-24">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Details</span>
                  <Settings className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div>Client-side only • Uses libs: <code>heic2any</code>, <code>gifuct-js</code>, <code>gif.js.optimized</code>, <code>react-pdftotext</code>, <code>jszip</code></div>
                  <Separator />
                  <div className="text-xs">Tips:</div>
                  <ul className="text-xs list-disc ml-4">
                    <li>Use small files for quick runs during testing.</li>
                    <li>GIF re-encoding can be CPU-heavy and may fail for complex GIFs.</li>
                    <li>PDF extraction works for searchable PDFs; scanned PDFs need OCR (Tesseract).</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setLog(""); showToast("success", "Logs cleared"); }}>Clear logs</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setResultPreview(null); setPdfText(""); setModifiedGifUrl(null); showToast("success", "Cleared results"); }}>Clear results</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader><DialogTitle>Notes</DialogTitle></DialogHeader>
          <div className="py-2 text-sm">All tools run in the browser. For large or production workflows, prefer server-side processing for reliability and security.</div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
