// src/pages/MiscToolsPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Copy,
  Download,
  Globe,
  UserCheck,
  MousePointer,
  AlertCircle,
  Zap,
  Image as ImageIcon,
  FileText,
  Key,
  ShieldCheck,
  Lock,
  Settings,
  Search,
  Eye,
  Tag,
  ScanSearch,
  Monitor,
  Languages,
  AlignHorizontalSpaceAround,
  PanelTopOpen,
  PanelLeftClose,
  Palette,
  Gauge,
  AlignVerticalSpaceAround,
  MonitorSmartphone,
  Scan,
  Smartphone,
  RectangleVertical,
  Info,
  Bot,
  CreditCard,
  Layers,
  Trash2,
  Receipt,
  ShieldAlert,
  Shield,
  XCircle,
  CheckCircle,
  QrCode,
  UserSearch,
  Check,
  ArrowRight,
  Eraser,
  RefreshCcw,
  KeyRound,
  Droplet,
  Pipette,
  
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
import { motion, useScroll, useTransform } from "framer-motion";
// ---------- small helpers ----------
const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text || "");
    showToast("success", "Copied to clipboard");
  } catch {
    showToast("error", "Copy failed");
  }
};
const downloadText = (name, content) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  showToast("success", "Downloaded");
};

// ---------- small MD5 implementation (compact) ----------
/* A minimal MD5 function (public domain compact implementation).
   For production consider using a tested library. */
function md5cycle(x, k) {
  /* ... compact helper functions ... */
  let [a, b, c, d] = x;
  function ff(a, b, c, d, x, s, t) { a = (a + ((b & c) | (~b & d)) + x + t) | 0; return (((a << s) | (a >>> (32 - s))) + b) | 0; }
  function gg(a, b, c, d, x, s, t) { a = (a + ((b & d) | (c & ~d)) + x + t) | 0; return (((a << s) | (a >>> (32 - s))) + b) | 0; }
  function hh(a, b, c, d, x, s, t) { a = (a + (b ^ c ^ d) + x + t) | 0; return (((a << s) | (a >>> (32 - s))) + b) | 0; }
  function ii(a, b, c, d, x, s, t) { a = (a + (c ^ (b | ~d)) + x + t) | 0; return (((a << s) | (a >>> (32 - s))) + b) | 0; }

  a = ff(a, b, c, d, k[0], 7, -680876936);
  a = ff(a, b, c, d, k[1], 12, -389564586);
  a = ff(a, b, c, d, k[2], 17, 606105819);
  a = ff(a, b, c, d, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  a = ff(a, b, c, d, k[5], 12, 1200080426);
  a = ff(a, b, c, d, k[6], 17, -1473231341);
  a = ff(a, b, c, d, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  a = ff(a, b, c, d, k[9], 12, -1958414417);
  a = ff(a, b, c, d, k[10], 17, -42063);
  a = ff(a, b, c, d, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  a = ff(a, b, c, d, k[13], 12, -40341101);
  a = ff(a, b, c, d, k[14], 17, -1502002290);
  a = ff(a, b, c, d, k[15], 22, 1236535329);

  a = gg(a, b, c, d, k[1], 5, -165796510);
  a = gg(a, b, c, d, k[6], 9, -1069501632);
  a = gg(a, b, c, d, k[11], 14, 643717713);
  a = gg(a, b, c, d, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  a = gg(a, b, c, d, k[10], 9, 38016083);
  a = gg(a, b, c, d, k[15], 14, -660478335);
  a = gg(a, b, c, d, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  a = gg(a, b, c, d, k[14], 9, -1019803690);
  a = gg(a, b, c, d, k[3], 14, -187363961);
  a = gg(a, b, c, d, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  a = gg(a, b, c, d, k[2], 9, -51403784);
  a = gg(a, b, c, d, k[7], 14, 1735328473);
  a = gg(a, b, c, d, k[12], 20, -1926607734);

  a = hh(a, b, c, d, k[5], 4, -378558);
  a = hh(a, b, c, d, k[8], 11, -2022574463);
  a = hh(a, b, c, d, k[11], 16, 1839030562);
  a = hh(a, b, c, d, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  a = hh(a, b, c, d, k[4], 11, 1272893353);
  a = hh(a, b, c, d, k[7], 16, -155497632);
  a = hh(a, b, c, d, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  a = hh(a, b, c, d, k[0], 11, -358537222);
  a = hh(a, b, c, d, k[3], 16, -722521979);
  a = hh(a, b, c, d, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  a = hh(a, b, c, d, k[12], 11, -421815835);
  a = hh(a, b, c, d, k[15], 16, 530742520);
  a = hh(a, b, c, d, k[2], 23, -995338651);

  a = ii(a, b, c, d, k[0], 6, -198630844);
  a = ii(a, b, c, d, k[7], 10, 1126891415);
  a = ii(a, b, c, d, k[14], 15, -1416354905);
  a = ii(a, b, c, d, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  a = ii(a, b, c, d, k[3], 10, -1894986606);
  a = ii(a, b, c, d, k[10], 15, -1051523);
  a = ii(a, b, c, d, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359);
  a = ii(a, b, c, d, k[15], 10, -30611744);
  a = ii(a, b, c, d, k[6], 15, -1560198380);
  a = ii(a, b, c, d, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  a = ii(a, b, c, d, k[11], 10, -1120210379);
  a = ii(a, b, c, d, k[2], 15, 718787259);
  a = ii(a, b, c, d, k[9], 21, -343485551);

  x[0] = (x[0] + a) | 0;
  x[1] = (x[1] + b) | 0;
  x[2] = (x[2] + c) | 0;
  x[3] = (x[3] + d) | 0;
}

function md5blk(s) {
  let md5blks = [];
  for (let i = 0; i < 64; i += 4) {
    md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
  }
  return md5blks;
}

function md51(s) {
  let n = s.length;
  let state = [1732584193, -271733879, -1732584194, 271733878];
  let i;
  for (i = 64; i <= n; i += 64) {
    md5cycle(state, md5blk(s.substring(i - 64, i)));
  }
  let tail = s.substring(i - 64);
  let tmp = new Array(16).fill(0);
  for (let j = 0; j < tail.length; j++) tmp[j >> 2] |= tail.charCodeAt(j) << ((j % 4) << 3);
  tmp[tail.length >> 2] |= 0x80 << ((tail.length % 4) << 3);
  if (tail.length > 55) {
    md5cycle(state, tmp);
    tmp = new Array(16).fill(0);
  }
  tmp[14] = n * 8;
  md5cycle(state, tmp);
  return state;
}

function rhex(n) {
  let s = "", j;
  for (j = 0; j < 4; j++) s += ("0" + ((n >> (j * 8 + 4)) & 0xF).toString(16)).slice(-1) + ("0" + ((n >> (j * 8)) & 0xF).toString(16)).slice(-1);
  return s;
}

function md5(s) {
  return md51(unescape(encodeURIComponent(s))).map(rhex).join("");
}

// ---------- Luhn & credit card generator/validator ----------
function luhnChecksum(numStr) {
  let sum = 0;
  let doubleUp = false;
  for (let i = numStr.length - 1; i >= 0; i--) {
    let cur = parseInt(numStr.charAt(i), 10);
    if (doubleUp) {
      cur = cur * 2;
      if (cur > 9) cur -= 9;
    }
    sum += cur;
    doubleUp = !doubleUp;
  }
  return sum % 10 === 0;
}
function completeLuhn(prefix) {
  for (let i = 0; i < 10; i++) {
    const candidate = prefix + i;
    if (luhnChecksum(candidate)) return candidate;
  }
  // brute force last digit if prefix ends with placeholder
  return prefix;
}
function generateCard(type = "visa") {
  const types = {
    visa: ["4"],
    mastercard: ["51", "52", "53", "54", "55", "2221", "2720"],
    amex: ["34", "37"],
  };
  const prefixes = types[type] || types.visa;
  const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
  // make length: visa 16, mastercard 16, amex 15
  const length = type === "amex" ? 15 : 16;
  let number = pref;
  while (number.length < length - 1) {
    number += Math.floor(Math.random() * 10).toString();
  }
  // find last digit to satisfy Luhn
  for (let d = 0; d < 10; d++) {
    const candidate = number + d.toString();
    if (luhnChecksum(candidate)) {
      return candidate;
    }
  }
  return number;
}

// ---------- Color converters ----------
function hexToRgb(hex) {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}
function rgbToHex(r, g, b) {
  const toHex = (n) => ("0" + Number(n).toString(16)).slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------- SRT/VTT conversions ----------
function srtToVtt(srt) {
  // SRT -> VTT: add "WEBVTT" header and ensure timestamps use '.' instead of ','
  const header = "WEBVTT\n\n";
  const body = srt.replace(/(\d+:\d+:\d+),(\d+)/g, "$1.$2");
  return header + body;
}
function vttToSrt(vtt) {
  // Remove WebVTT header then convert '.' to ',' in timestamps
  const body = vtt.replace(/^WEBVTT\s*\n*/i, "");
  return body.replace(/(\d+:\d+:\d+)\.(\d+)/g, "$1,$2");
}

// ---------- QR decoder using BarcodeDetector (where available) ----------
async function decodeQrFromImageFile(file) {
  if ("BarcodeDetector" in window) {
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    const bitmap = await createImageBitmap(file);
    // draw to canvas
    const cnv = document.createElement("canvas");
    cnv.width = bitmap.width;
    cnv.height = bitmap.height;
    const ctx = cnv.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    const imgData = ctx.getImageData(0, 0, cnv.width, cnv.height);
    try {
      const results = await detector.detect(imgData);
      return results.map((r) => r.rawValue).join("\n");
    } catch (e) {
      throw new Error("No QR found or detection failed");
    }
  } else {
    throw new Error("BarcodeDetector API not supported in this browser");
  }
}

// ---------- Main component ----------
export default function MiscToolsPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state: tool selector
  const [tool, setTool] = useState("what_browser");

  // what is my browser / UA / screen
  const [browserInfo, setBrowserInfo] = useState({});
  const [ua, setUa] = useState("");
  const [screenInfo, setScreenInfo] = useState({});

  // screen simulator
  const [simWidth, setSimWidth] = useState(375);
  const [simHeight, setSimHeight] = useState(812);

  // URL opener
  const [openUrl, setOpenUrl] = useState("");

  // Credit card
  const [ccType, setCcType] = useState("visa");
  const [generatedCard, setGeneratedCard] = useState("");
  const [ccToValidate, setCcToValidate] = useState("");
  const [ccValid, setCcValid] = useState(null);

  // QR generator & decode
  const [qrText, setQrText] = useState("");
  const [qrSize, setQrSize] = useState(300);
  const [qrDecodeResult, setQrDecodeResult] = useState("");
  const qrFileRef = useRef(null);

  // MD5 / base64 / color / password
  const [md5Input, setMd5Input] = useState("");
  const [md5Output, setMd5Output] = useState("");
  const [b64Input, setB64Input] = useState("");
  const [b64OutEnc, setB64OutEnc] = useState("");
  const [b64OutDec, setB64OutDec] = useState("");
  const [hexColor, setHexColor] = useState("#1e88e5");
  const [rgbOut, setRgbOut] = useState(null);
  const [rVal, setRVal] = useState(30);
  const [gVal, setGVal] = useState(136);
  const [bVal, setBVal] = useState(229);
  const [generatedPassword, setGeneratedPassword] = useState("");

  // subtitle conversions
  const [srtText, setSrtText] = useState("");
  const [vttText, setVttText] = useState("");
  const [copiedMd5, setCopiedMd5] = useState(false);
  const [copied, setCopied] = useState(false);



const copy = (text) => {
  navigator.clipboard.writeText(text);
  setCopiedMd5(true);
  setTimeout(() => setCopiedMd5(false), 1200);
};


  // Screen resolution detection on mount
  useEffect(() => {
    try {
      const nav = navigator || {};
      const uaString = nav.userAgent || "";
      setUa(uaString);

      const browserName = (() => {
        if (/chrome|chromium|crios/i.test(uaString) && !/edg/i.test(uaString)) return "Chrome";
        if (/firefox|fxios/i.test(uaString)) return "Firefox";
        if (/safari/i.test(uaString) && !/chrome|crios|chromium/i.test(uaString)) return "Safari";
        if (/edg/i.test(uaString)) return "Edge";
        return "Unknown";
      })();

      // browser version extract
      const versionMatch = uaString.match(/(chrome|crios|crmo|firefox|fxios|edg|version|safari)\/?\s*([0-9._]+)/i);
      const browserVersion = versionMatch ? versionMatch[2] : "—";

      const osMatch = uaString.match(/\(([^)]+)\)/);
      const os = osMatch ? osMatch[1] : "—";

      const languages = navigator.languages ? navigator.languages.join(", ") : navigator.language || "—";

      setBrowserInfo({
        browser: browserName,
        version: browserVersion,
        ua: uaString,
        os,
        languages,
      });

      // screen
      setScreenInfo({
        screenW: window.screen?.width ?? "—",
        screenH: window.screen?.height ?? "—",
        dpr: window.devicePixelRatio ?? 1,
        colorDepth: window.screen?.colorDepth ?? "—",
        viewportW: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        viewportH: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ---------- handlers ----------
  const handleOpenUrl = useCallback(() => {
    if (!openUrl) return showToast("error", "Enter a URL");
    // normalize
    let url = openUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    // open window with stripped chrome features; note browser security may still show some UI.
    const features = "toolbar=no,menubar=no,location=no,status=no,resizable=yes,scrollbars=yes,width=1000,height=800";
    const win = window.open(url, "_blank", features);
    if (win) {
      try {
        win.focus();
      } catch {}
    } else {
      showToast("error", "Popup blocked. Allow popups for this site.");
    }
  }, [openUrl]);

  const handleGenerateCard = useCallback(() => {
    const gen = generateCard(ccType);
    setGeneratedCard(gen);
    setCcValid(luhnChecksum(gen));
    showToast("success", `Generated ${ccType.toUpperCase()} card`);
  }, [ccType]);

  const handleValidateCard = useCallback(() => {
    const clean = (ccToValidate || "").replace(/\s+/g, "");
    const valid = clean.length > 0 && luhnChecksum(clean);
    setCcValid(valid);
    showToast(valid ? "success" : "error", valid ? "Valid card (Luhn)" : "Invalid card");
  }, [ccToValidate]);

  const handleQrDecodeFile = useCallback(async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setQrDecodeResult("Decoding…");
      const decoded = await decodeQrFromImageFile(f);
      setQrDecodeResult(decoded || "No QR codes detected");
    } catch (err) {
      setQrDecodeResult(String(err?.message || err));
    } finally {
      if (qrFileRef.current) qrFileRef.current.value = null;
    }
  }, []);

  const handleMd5 = useCallback(() => {
    setMd5Output(md5(md5Input || ""));
  }, [md5Input]);

  const handleBase64Encode = useCallback(() => {
    try {
      setB64OutEnc(btoa(unescape(encodeURIComponent(b64Input || ""))));
      showToast("success", "Encoded");
    } catch {
      setB64OutEnc("Encoding failed");
    }
  }, [b64Input]);

  const handleBase64Decode = useCallback(() => {
    try {
      setB64OutDec(decodeURIComponent(escape(atob(b64Input || ""))));
      showToast("success", "Decoded");
    } catch {
      setB64OutDec("Decoding failed");
    }
  }, [b64Input]);

  const handleHexToRgb = useCallback(() => {
    const out = hexToRgb(hexColor || "");
    setRgbOut(out);
  }, [hexColor]);

  const handleRgbToHex = useCallback(() => {
    setHexColor(rgbToHex(rVal, gVal, bVal));
  }, [rVal, gVal, bVal]);

  const handlePasswordGen = useCallback((len = 16, withSymbols = true) => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" + (withSymbols ? "!@#$%^&*()-_+=<>?" : "");
    let pass = "";
    for (let i = 0; i < len; i++) pass += letters.charAt(Math.floor(Math.random() * letters.length));
    setGeneratedPassword(pass);
  }, []);

  const handleSrtToVtt = useCallback(() => {
    setVttText(srtToVtt(srtText));
    showToast("success", "Converted SRT → VTT");
  }, [srtText]);

  const handleVttToSrt = useCallback(() => {
    setSrtText(vttToSrt(vttText));
    showToast("success", "Converted VTT → SRT");
  }, [vttText]);

  // ---------- computed values ----------
  const qrImgSrc = useMemo(() => {
    if (!qrText) return null;
    // Google Chart API QR (simple). If you want fully offline QR, we can embed a JS lib.
    const encoded = encodeURIComponent(qrText);
   return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encoded}`;

  }, [qrText, qrSize]);

  function formatCardNumber(value) {
  let digits = value.replace(/\D/g, ""); // Keep only numbers

  // Insert spaces every 4 digits (classic format)
  let formatted = digits.match(/.{1,4}/g)?.join(" ") ?? digits;

  return formatted;
}

  const handleCopy = () => {
    if (!generatedPassword) return;
    copy(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };



  // ---------- small presentational helpers ----------


const InfoRow = ({ label, value, icon }) => {
  return (
    <div className="flex items-start sm:items-center justify-between py-2 border-b border-zinc-200/20 last:border-none">
      {/* Left Side */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-zinc-200/40 dark:bg-zinc-800/60">
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>

      {/* Right Side */}
      <div className="text-sm font-medium text-right break-all max-w-[60%] sm:max-w-none">
        {value ?? "—"}
      </div>
    </div>
  );
};


  // ---------- the UI ----------
  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
           Miscellaneous Tools
          </h1>
          <p className="text-sm text-muted-foreground mt-1">A collection of handy  utilities — screen info, encoders, converters, QR, cards and more.</p>
        </div>

      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* left: navigation */}
        <aside className="lg:col-span-3">
          <Card className="dark:bg-black/80 bg-white/80 shadow-md">
            <CardHeader>
              <CardTitle>Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <Select value={tool} onValueChange={setTool}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="h-70">
                    <SelectItem className="cursor-pointer" value="what_browser">What Is My Browser</SelectItem>
                    <SelectItem className="cursor-pointer" value="what_ua">What Is My User Agent</SelectItem>
                    <SelectItem className="cursor-pointer" value="screen_res">What Is My Screen Resolution</SelectItem>
                    <SelectItem className="cursor-pointer" value="screen_sim">Screen Resolution Simulator</SelectItem>
                    <SelectItem className="cursor-pointer" value="url_opener">URL Opener</SelectItem>
                    <SelectItem className="cursor-pointer" value="cc_gen">Credit Card Generator</SelectItem>
                    <SelectItem className="cursor-pointer" value="cc_val">Credit Card Validator</SelectItem>
                    <SelectItem className="cursor-pointer" value="qr_decode">QR Code Decoder</SelectItem>
                    <SelectItem className="cursor-pointer" value="qr_gen">QR Code Generator</SelectItem>
                    <SelectItem className="cursor-pointer" value="fb_finder">Facebook ID Finder</SelectItem>
                    <SelectItem className="cursor-pointer" value="md5">MD5 Generator</SelectItem>
                    <SelectItem className="cursor-pointer" value="b64">Base64 Encode / Decode</SelectItem>
                    <SelectItem className="cursor-pointer" value="color_conv">Color Converter</SelectItem>
                    <SelectItem className="cursor-pointer" value="pwd_gen">Password Generator</SelectItem>
                    <SelectItem className="cursor-pointer" value="hex_rgb">HEX ⇄ RGB</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                <div className="text-xs text-muted-foreground">Quick actions</div>
                <div className="flex gap-2">
                  <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(navigator.userAgent || ""); showToast("success", "UA copied"); }}><Copy className="w-4 h-4" /> Copy UA</Button>
                  <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => { downloadText("screen-info.txt", JSON.stringify(screenInfo, null, 2)); }}><Download className="w-4 h-4" /> Download Info</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* center: tool canvas */}
        <main className="lg:col-span-6 space-y-6">
          {/* WHAT IS MY BROWSER */}
          {tool === "what_browser" && (
                <Card className="dark:bg-black/80 bg-white/80 border border-zinc-200/30 dark:border-zinc-700/40 shadow-lg rounded-xl">
                <CardHeader className="flex items-center justify-between">
                       <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 " />
                    What Is My Browser
                    </CardTitle>

                    <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
                        text-emerald-700 dark:text-emerald-300">
                    Browser Info
                    </Badge>
                </CardHeader>

                <CardContent className="pt-2">
                    <div className="grid grid-cols-1 gap-4">
                    <InfoRow icon={<Globe className="w-4 h-4" />} label="Your Browser" value={browserInfo.browser} />
                    <InfoRow icon={<Tag className="w-4 h-4" />} label="Version" value={browserInfo.version} />
                    <InfoRow icon={<ScanSearch className="w-4 h-4" />} label="User Agent" value={browserInfo.ua} />
                    <InfoRow icon={<Monitor className="w-4 h-4" />} label="Operating System" value={browserInfo.os} />
                    <InfoRow icon={<Languages className="w-4 h-4" />} label="Languages" value={browserInfo.languages} />
                    </div>
                </CardContent>
            </Card>

          )}

          {/* WHAT IS MY UA */}
          {tool === "what_ua" && (
         <Card className="border dark:bg-black/80 bg-white/80 border-zinc-200/40 dark:border-zinc-700/40 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 " />
                    What Is My User Agent
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    <InfoRow
                    icon={<ScanSearch className="w-4 h-4" />}
                    label="User Agent"
                    value={ua}
                    />
                    <InfoRow
                    icon={<Globe className="w-4 h-4" />}
                    label="Browser"
                    value={browserInfo.browser}
                    />
                    <InfoRow
                    icon={<Tag className="w-4 h-4" />}
                    label="Version"
                    value={browserInfo.version}
                    />
                    <InfoRow
                    icon={<Monitor className="w-4 h-4" />}
                    label="Operating System"
                    value={browserInfo.os}
                    />
                    <InfoRow
                    icon={<Languages className="w-4 h-4" />}
                    label="Languages"
                    value={browserInfo.languages}
                    />

                </CardContent>
                </Card>
          )}

          {/* SCREEN RES */}
          {tool === "screen_res" && (
            <Card className="dark:bg-black/80 bg-white/80 border border-zinc-200/30 dark:border-zinc-700/40 shadow-lg rounded-xl">
            <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MonitorSmartphone className="w-5 h-5" />
                What Is My Screen Resolution
                </CardTitle>

                <Badge className="backdrop-blur-md bg-blue-500/10 border border-blue-500/20 
                    text-blue-700 dark:text-blue-300">
                Display Info
                </Badge>
            </CardHeader>

            <CardContent className="pt-2 space-y-1">
                <InfoRow 
                icon={<Scan className="w-4 h-4" />}
                label="Your Screen Resolution" 
                value={`${screenInfo.screenW} x ${screenInfo.screenH}`} 
                />

                <InfoRow 
                icon={<AlignHorizontalSpaceAround className="w-4 h-4" />}
                label="Screen Width" 
                value={`${screenInfo.screenW} Pixels`} 
                />

                <InfoRow 
                icon={<AlignVerticalSpaceAround className="w-4 h-4" />}
                label="Screen Height" 
                value={`${screenInfo.screenH} Pixels`} 
                />

                <InfoRow 
                icon={<Gauge className="w-4 h-4" />}
                label="DPR (Device Pixel Ratio)" 
                value={screenInfo.dpr} 
                />

                <InfoRow 
                icon={<Palette className="w-4 h-4" />}
                label="Color Depth" 
                value={`${screenInfo.colorDepth} bits per pixel`} 
                />

                <InfoRow 
                icon={<PanelLeftClose className="w-4 h-4" />}
                label="Viewport Width" 
                value={`${screenInfo.viewportW} Pixels`} 
                />

                <InfoRow 
                icon={<PanelTopOpen className="w-4 h-4" />}
                label="Viewport Height" 
                value={`${screenInfo.viewportH} Pixels`} 
                />

                <div className="mt-3 text-xs text-muted-foreground">
                Note: Values can vary depending on browser zoom or OS display scaling.
                </div>
            </CardContent>
            </Card>

          )}

          {/* SCREEN SIMULATOR */}
          {tool === "screen_sim" && (
                <Card className="dark:bg-black/80 bg-white/80 shadow-lg border border-zinc-200/20 dark:border-zinc-700/40 rounded-xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Monitor className="w-5 h-5 " />
                    Screen Resolution Simulator
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label className="text-xs mb-1">Width (px)</Label>
                        <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <Input
                            type="number"
                            value={simWidth}
                            onChange={(e) => setSimWidth(Number(e.target.value || 0))}
                            className="bg-white/60 dark:bg-zinc-900/60"
                        />
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs mb-1">Height (px)</Label>
                        <div className="flex items-center gap-2">
                        <RectangleVertical className="w-4 h-4 text-muted-foreground" />
                        <Input
                            type="number"
                            value={simHeight}
                            onChange={(e) => setSimHeight(Number(e.target.value || 0))}
                            className="bg-white/60 dark:bg-zinc-900/60"
                        />
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs mb-1">Preset</Label>
                        <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 " />
                        <Select
                            value={`${simWidth}x${simHeight}`}
                            onValueChange={(val) => {
                            const [w, h] = val.split("x").map(Number);
                            setSimWidth(w);
                            setSimHeight(h);
                            }}
                        >
                            <SelectTrigger className="w-full cursor-pointer bg-white/60 dark:bg-zinc-900/60">
                            <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="375x812">iPhone 12/13/14 — 375×812</SelectItem>
                            <SelectItem value="390x844">iPhone 14 Pro — 390×844</SelectItem>
                            <SelectItem value="768x1024">iPad — 768×1024</SelectItem>
                            <SelectItem value="1366x768">Laptop — 1366×768</SelectItem>
                            <SelectItem value="1920x1080">Desktop — 1920×1080</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                    </div>
                    </div>

                    {/* Preview Frame */}
                    <div className="mt-2 border border-zinc-300/20 dark:border-zinc-700/30 rounded-xl p-4 bg-white/50 dark:bg-black/40 backdrop-blur-sm shadow-inner">
                    <div className="flex items-center justify-center mb-3">
                        <Badge className="text-xs backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
                        text-emerald-700 dark:text-emerald-300 px-2 py-1">
                        Live Viewport Simulation
                        </Badge>
                    </div>

                    <div className="flex items-center justify-center overflow-auto">
                        <div
                        className="
                            border shadow-md rounded-lg 
                            border-zinc-600/20 dark:border-zinc-300/10 
                            relative overflow-hidden
                        "
                        style={{
                            width: simWidth,
                            height: simHeight,
                            background: isDark ? "#0a0a0a" : "white",
                            transition: "all 0.2s ease",
                        }}
                        >
                        {/* Top details */}
                        <div className="p-3">
                            <div className="text-xs text-muted-foreground">Simulated Viewport</div>
                            <div className="mt-1 text-sm font-semibold">
                            {simWidth} × {simHeight}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                            DPR: {window.devicePixelRatio ?? 1}
                            </div>
                        </div>

                        {/* Dotted border overlay for real feel */}
                        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-zinc-700/20 rounded-lg" />
                        </div>
                    </div>
                    </div>
                </CardContent>
                </Card>

          )}

          {/* URL OPENER */}
          {tool === "url_opener" && (
        <Card className="dark:bg-black/80 bg-white/80 shadow-xl border border-zinc-200/20 dark:border-zinc-700/40 rounded-xl backdrop-blur-md">
        <CardHeader className="flex items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <MousePointer className="w-5 h-5 " />
            URL Opener
            </CardTitle>

            <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
            text-emerald-700 dark:text-emerald-300">
            Tool
            </Badge>
        </CardHeader>

        <CardContent className="space-y-3">
            <Label className="text-xs font-medium">Enter URL</Label>

            <div className="flex flex-col sm:flex-row gap-2">
            <Input
                value={openUrl}
                onChange={(e) => setOpenUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 bg-white/60 dark:bg-zinc-900/60"
            />

            {/* Button adapts based on screen size */}
            <Button
                onClick={handleOpenUrl}
                className="flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
                <MousePointer className="w-4 h-4" />
                <span className="hidden sm:inline">Open</span>
            </Button>
            </div>

            {/* Helper text box with icon */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-zinc-200/20 
                dark:bg-zinc-800/40 border border-zinc-200/20 dark:border-zinc-700/40 rounded-md p-2">
            <Info className="w-4 h-4 mt-0.5 opacity-70" />
            <p className="leading-relaxed">
                Opens the URL in a focused window with minimal browser UI (may be restricted by browser settings).
            </p>
            </div>
        </CardContent>
        </Card>

          )}

          {/* CREDIT CARD GENERATOR / VALIDATOR */}
          {tool === "cc_gen" && (
<Card className="dark:bg-black/80 bg-white/80 shadow-xl border border-zinc-200/30 dark:border-zinc-700/40 rounded-xl backdrop-blur-md">
  <CardHeader className="flex items-center justify-between pb-3">
    <CardTitle className="text-lg font-semibold flex items-center gap-2">
      <CreditCard className="w-5 h-5 " />
      Credit Card Generator
    </CardTitle>

    <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
      text-emerald-700 dark:text-emerald-300">
      Tool
    </Badge>
  </CardHeader>

  <CardContent className="space-y-4">
    {/* Card Type */}
    <div>
      <Label className="text-xs font-medium flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 opacity-70" />
        Card Type
      </Label>

      <Select value={ccType} onValueChange={setCcType}>
        <SelectTrigger className="mt-1 w-full cursor-pointer bg-white/60 dark:bg-zinc-900/60">
          <SelectValue placeholder="Select type..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="visa">Visa</SelectItem>
          <SelectItem value="mastercard">Mastercard</SelectItem>
          <SelectItem value="amex">AMEX</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Buttons */}
    <div className="flex flex-col sm:flex-row gap-2">
      <Button onClick={handleGenerateCard} className="flex cursor-pointer items-center gap-2">
        <Key className="w-4 h-4" />
        Generate
      </Button>

      <Button
        variant="outline"
        onClick={() => {
          setGeneratedCard("");
          setCcValid(null);
        }}
        className="flex cursor-pointer items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Clear
      </Button>
    </div>

    {/* Output */}
    <div className="pt-2">
      <Label className="text-xs font-medium flex items-center gap-2 mb-1">
        <Receipt className="w-4 h-4 opacity-70" />
        Generated Number
      </Label>

      <div
        className="
          mt-1 rounded-md border bg-white/60 dark:bg-zinc-900/60 
          border-zinc-200/30 dark:border-zinc-700/40
          p-3 font-mono text-base tracking-wide
        "
      >
        {generatedCard || "—"}
      </div>

      {/* Validation Badge */}
      <div className="mt-3">
        <div
          className={`
            inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium
            ${
              ccValid === true
                ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
                : ccValid === false
                ? "bg-rose-600/10 text-rose-600 dark:text-rose-400"
                : "bg-zinc-200/30 dark:bg-zinc-800/40 text-muted-foreground"
            }
          `}
        >
          {ccValid === true ? (
            <ShieldCheck className="w-4 h-4" />
          ) : ccValid === false ? (
            <ShieldAlert className="w-4 h-4" />
          ) : (
            <Shield className="w-4 h-4 opacity-70" />
          )}

          {ccValid === null
            ? "Not validated"
            : ccValid
            ? "Valid (Luhn)"
            : "Invalid"}
        </div>
      </div>
    </div>
  </CardContent>
</Card>

          )}

          {tool === "cc_val" && (
                <Card className="dark:bg-black/80 bg-white/80 shadow-xl border border-zinc-200/20 dark:border-zinc-700/40 rounded-xl backdrop-blur-md">
                <CardHeader className="flex items-center justify-between pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <CreditCard className="w-5 h-5 " />
                    Credit Card Validator
                    </CardTitle>

                    <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
                    text-emerald-700 dark:text-emerald-300">
                    Validator
                    </Badge>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Input */}
                    <div>
                    <Label className="text-xs font-medium">Card Number</Label>
                    <Input
                        placeholder="4111 1111 1111 1111"
                        value={ccToValidate}
                        onChange={(e) => setCcToValidate(formatCardNumber(e.target.value))}
                        className="bg-white/60 dark:bg-zinc-900/60"
                    />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                    <Button onClick={handleValidateCard} className="flex cursor-pointer items-center gap-2">
                        <Search className="w-4 h-4" />
                        Validate
                    </Button>

                    <Button
                        
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() => {
                        setCcToValidate("");
                        setCcValid(null);
                        }}
                    >
                        Clear
                    </Button>
                    </div>

                    {/* Validation Result */}
                    {ccValid !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                        mt-2 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2
                        ${ccValid
                            ? "bg-emerald-600/10 text-emerald-600 border border-emerald-600/20"
                            : "bg-rose-600/10 text-rose-600 border border-rose-600/20"}
                        `}
                    >
                        {ccValid ? (
                        <CheckCircle className="w-4 h-4" />
                        ) : (
                        <XCircle className="w-4 h-4" />
                        )}
                        {ccValid ? "Valid card number (Luhn check passed)" : "Invalid card number"}
                    </motion.div>
                    )}
                </CardContent>
                </Card>

          )}

          {/* QR Decoder & Generator */}
          {tool === "qr_decode" && (
                <Card className="dark:bg-black/80 bg-white/80 shadow-xl border border-zinc-200/20 dark:border-zinc-700/40 rounded-xl backdrop-blur-md">
            <CardHeader className="flex items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <QrCode className="w-5 h-5 " />
                QR Code Decoder
                </CardTitle>

                <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
                text-emerald-700 dark:text-emerald-300">
                Decode
                </Badge>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* File Input */}
                <div>
                <Label className="text-xs font-medium">Upload QR Image</Label>
                <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Input
                    type="file"
                    accept="image/*"
                    ref={qrFileRef}
                    onChange={handleQrDecodeFile}
                    className="bg-white/60 dark:bg-zinc-900/60"
                    />
                </div>
                </div>

                {/* Result Box */}
                <div>
                <div className="text-xs text-muted-foreground mb-1">Decoded Result</div>

                <motion.div
                    key={qrDecodeResult}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="
                    rounded-md p-3 text-sm 
                    bg-zinc-200/30 dark:bg-zinc-800/40 
                    border border-zinc-200/20 dark:border-zinc-700/40
                    backdrop-blur-md
                    whitespace-pre-wrap break-all
                    "
                >
                    {qrDecodeResult || "No result yet"}
                </motion.div>
                </div>

                {/* Info Note */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-zinc-200/20 
                    dark:bg-zinc-800/40 border border-zinc-200/20 dark:border-zinc-700/40 rounded-md p-2">
                <Info className="w-4 h-4 mt-0.5 opacity-70" />
                <p className="leading-relaxed">
                    Uses the browser <code>BarcodeDetector</code> API when available.
                    Some browsers may not support this feature.
                </p>
                </div>
            </CardContent>
            </Card>

          )}

          {tool === "qr_gen" && (
        <Card className="dark:bg-black/80 bg-white/80 shadow-xl border border-zinc-200/20 dark:border-zinc-700/40 rounded-xl backdrop-blur-md">
        <CardHeader className="flex items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <QrCode className="w-5 h-5 " />
            QR Code Generator
            </CardTitle>

            <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
                text-emerald-700 dark:text-emerald-300">
            QR Tool
            </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
            {/* TEXT INPUT */}
            <div>
            <Label className="text-xs font-medium">Text / URL</Label>
            <Input
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                placeholder="https://example.com"
                className="bg-white/60 dark:bg-zinc-900/60"
            />
            </div>

            {/* SIZE ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <Label className="text-xs font-medium">Size</Label>
                <div className="flex items-center gap-2">
                <Input
                    type="number"
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value || 300))}
                    className="w-full bg-white/60 dark:bg-zinc-900/60"
                />
                <span className="text-xs text-muted-foreground">px</span>
                </div>
            </div>

            {/* OPEN BUTTON */}
            <div className="flex  items-end">
                <Button
              
                onClick={() => {
                    if (!qrImgSrc) {
                    showToast("error", "Enter text first");
                    return;
                    }
                    window.open(qrImgSrc);
                }}
                className="flex cursor-pointer items-center gap-2 w-full "
                >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Open</span>
                </Button>
            </div>
            </div>

            {/* QR PREVIEW */}
            <div className="mt-2 p-4 border rounded-lg bg-white/50 dark:bg-zinc-900/50 
                border-zinc-200/30 dark:border-zinc-700/40 flex items-center justify-center min-h-[160px]">
            {qrImgSrc ? (
                <img
                src={qrImgSrc}
                alt="QR preview"
                width={qrSize}
                height={qrSize}
                className="rounded-md shadow-md"
                />
            ) : (
                <div className="text-sm text-muted-foreground">Enter text above to preview</div>
            )}
            </div>

            {/* INFO BOX */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-zinc-200/20 
                dark:bg-zinc-800/40 border border-zinc-200/20 dark:border-zinc-700/40 rounded-md p-2">
            <Info className="w-4 h-4 mt-0.5 opacity-70" />
            <p className="leading-relaxed">
                QR image generated using the QuickChart API.  
                You can enable offline generation using a local JS QR library if needed.
            </p>
            </div>
        </CardContent>
        </Card>

          )}

          {/* Facebook ID Finder (limited client side) */}
          {tool === "fb_finder" && (

<Card className="dark:bg-black/80 bg-white/80 shadow-xl border border-zinc-200/20 dark:border-zinc-700/40 rounded-xl backdrop-blur-md">
  <CardHeader className="flex items-center justify-between pb-3">
    <CardTitle className="text-lg font-semibold flex items-center gap-2">
      <UserSearch className="w-5 h-5 " />
      Facebook ID Finder
    </CardTitle>

    <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
      text-emerald-700 dark:text-emerald-300">
      Tool
    </Badge>
  </CardHeader>

  <CardContent className="space-y-4">
    <div className="space-y-1">
      <Label className="text-xs font-medium">Profile URL</Label>
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-emerald-500" />
        <span className="text-xs text-muted-foreground">Paste any Facebook profile URL</span>
      </div>
    </div>

    {/* INPUT FIELD */}
    <Input
      placeholder="https://facebook.com/profile.php?id=1000..."
      className="bg-white/60 dark:bg-zinc-900/60"
      onChange={(e) => {
        const raw = e.target.value.trim();
        if (!raw) return;

        let url;
        try {
          url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        } catch (err) {
          showToast("error", "Invalid URL format");
          return;
        }

        const numericId = url.searchParams.get("id");

        if (numericId) {
          showToast("success", `Found ID: ${numericId}`);

          // auto-download text file
          downloadText("fb-id.txt", numericId);
        } else {
          showToast(
            "info",
            "No numeric ID found. Facebook usernames cannot be converted to numeric IDs without server-side API access."
          );
        }
      }}
    />

    {/* INFO BOX */}
    <div className="
      flex items-start gap-2 text-xs text-muted-foreground
      bg-zinc-200/20 dark:bg-zinc-800/40 border border-zinc-200/20 dark:border-zinc-700/40
      rounded-md p-3 leading-relaxed
    ">
      <Info className="w-4 h-4 mt-0.5 opacity-70" />
      <p>
        This tool extracts the numeric <code>id</code> from URLs that contain 
        <code>?id=XXXX</code>.  
        Converting vanity usernames (like <code>/zuck</code>) to numeric IDs requires 
        Facebook Graph API and cannot be done client-side due to CORS & authentication limits.
      </p>
    </div>
  </CardContent>
</Card>

          )}

          {/* MD5 */}
          {tool === "md5" && (
<Card className="dark:bg-black/80 bg-white/80 shadow-xl border border-zinc-200/20 dark:border-zinc-700/40 rounded-xl backdrop-blur-md">
  <CardHeader className="flex items-center justify-between pb-3">
    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
      <FileText className="w-5 h-5 " />
      MD5 Generator
    </CardTitle>

    <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
      text-emerald-700 dark:text-emerald-300">
      Hash Tool
    </Badge>
  </CardHeader>

  <CardContent className="space-y-4">
    {/* Input */}
    <div className="space-y-1">
      <Label className="text-xs font-medium">Input</Label>
      <Input
        value={md5Input}
        onChange={(e) => setMd5Input(e.target.value)}
        placeholder="Enter text to hash…"
        className="bg-white/60 dark:bg-zinc-900/60"
      />
    </div>

    {/* Buttons */}
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleMd5} className="flex items-center gap-2">
        <FileText className="w-4 h-4" />
        <span>Hash</span>
      </Button>

      <Button
        variant="outline"
        onClick={() => { setMd5Input(""); setMd5Output(""); }}
      >
        Clear
      </Button>
    </div>

    {/* Output */}
    <div className="pt-2">
      <div className="text-xs text-muted-foreground">MD5 Output</div>

      <div
        className="
          mt-2 p-3 rounded-lg
          bg-zinc-100/60 dark:bg-zinc-900/60
          border border-zinc-200/20 dark:border-zinc-700/40
          font-mono text-sm break-all shadow-inner
        "
      >
        {md5Output || "—"}
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="flex items-center gap-2"
          onClick={() => md5Output && copy(md5Output)}
          disabled={!md5Output}
        >
          {copiedMd5 ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copiedMd5 ? "Copied!" : "Copy"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => md5Output && downloadText("md5.txt", md5Output)}
          disabled={!md5Output}
        >
          Download
        </Button>
      </div>
    </div>
  </CardContent>
</Card>

          )}

          {/* Base64 */}
          {tool === "b64" && (
<Card className="dark:bg-black/70 bg-white/70 shadow-xl border border-zinc-200/20 dark:border-zinc-700/40 rounded-xl backdrop-blur-md">
  
  {/* Header */}
  <CardHeader className="flex items-center justify-between pb-3">
    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
      <Zap className="w-5 h-5 " />
      Base64 Encode / Decode
    </CardTitle>

    <Badge 
      className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
                 text-emerald-700 dark:text-emerald-300"
    >
      Base64
    </Badge>
  </CardHeader>

  {/* Content */}
  <CardContent className="space-y-4">

    {/* Input */}
    <div>
      <Label className="text-xs font-medium">Input</Label>
      <Textarea
        value={b64Input}
        onChange={(e) => setB64Input(e.target.value)}
        placeholder="Enter text or Base64 string..."
        className="min-h-[120px] bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/40 
                   dark:border-zinc-700/40 rounded-lg px-3 py-2"
      />
    </div>

    {/* Action Buttons */}
    <div className="flex flex-wrap gap-2">
      <Button 
        onClick={handleBase64Encode}
        className="flex items-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Encode
      </Button>

      <Button 
        onClick={handleBase64Decode} 
        variant="outline"
        className="flex items-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Decode
      </Button>
    </div>

    {/* Outputs */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Encoded */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">Encoded Output</div>
        <pre
          className="font-mono text-sm p-3 rounded-lg bg-white/60 dark:bg-zinc-900/60 
                     border border-zinc-200/30 dark:border-zinc-700/40
                     max-h-40 overflow-auto break-all whitespace-pre-wrap"
        >
          {b64OutEnc || "—"}
        </pre>
      </div>

      {/* Decoded */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">Decoded Output</div>
        <pre
          className="font-mono text-sm p-3 rounded-lg bg-white/60 dark:bg-zinc-900/60 
                     border border-zinc-200/30 dark:border-zinc-700/40
                     max-h-40 overflow-auto break-all whitespace-pre-wrap"
        >
          {b64OutDec || "—"}
        </pre>
      </div>

    </div>
  </CardContent>
</Card>

          )}

          {/* Color Converters */}
          {tool === "color_conv" && (
<Card className="dark:bg-black/80 bg-white/80 shadow-xl border border-zinc-200/20 dark:border-zinc-700/40 rounded-xl backdrop-blur-md">
  <CardHeader className="flex items-center justify-between pb-3">
    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
      <Palette className="w-5 h-5 " />
      Color Converter
    </CardTitle>

    <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
      text-emerald-700 dark:text-emerald-300">
      Colors
    </Badge>
  </CardHeader>

  <CardContent className="space-y-6">

    {/* LIVE COLOR PREVIEW */}
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-md border border-zinc-300 dark:border-zinc-700 shadow-inner"
        style={{ background: hexColor || "#000" }}
      ></div>

      <div className="flex flex-col">
        <span className="text-sm font-medium">Preview</span>
        <span className="text-xs text-muted-foreground">
          Selected color: {hexColor || "—"}
        </span>
      </div>
    </div>

    {/* 2-COLUMN GRID */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* HEX → RGB */}
      <div>
        <Label className="text-xs font-medium mb-1">HEX</Label>
        <Input
          value={hexColor}
          onChange={(e) => setHexColor(e.target.value)}
          placeholder="#1A2B3C"
          className="bg-white/60 dark:bg-zinc-900/60"
        />

        <div className="mt-3 flex gap-2">
          <Button onClick={handleHexToRgb} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            HEX → RGB
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setHexColor("#000000");
              setRgbOut(null);
            }}
          >
            Reset
          </Button>
        </div>

        <div className="mt-4 text-sm">
          {rgbOut ? (
            <div className="font-medium">
              RGB: {rgbOut.r}, {rgbOut.g}, {rgbOut.b}
            </div>
          ) : (
            <div className="text-muted-foreground">Result will appear here</div>
          )}
        </div>
      </div>

      {/* RGB → HEX */}
      <div>
        <Label className="text-xs font-medium mb-1">RGB → HEX</Label>

        <div className="flex gap-2">
          <Input
            value={rVal}
            onChange={(e) => setRVal(Number(e.target.value))}
            placeholder="R"
            className="bg-white/60 dark:bg-zinc-900/60"
          />
          <Input
            value={gVal}
            onChange={(e) => setGVal(Number(e.target.value))}
            placeholder="G"
            className="bg-white/60 dark:bg-zinc-900/60"
          />
          <Input
            value={bVal}
            onChange={(e) => setBVal(Number(e.target.value))}
            placeholder="B"
            className="bg-white/60 dark:bg-zinc-900/60"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={handleRgbToHex} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            Convert
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRVal(0);
              setGVal(0);
              setBVal(0);
            }}
          >
            Reset
          </Button>
        </div>

        <div className="mt-4 text-sm">
          HEX:
          <span className="font-mono ml-1">{hexColor}</span>
        </div>
      </div>

    </div>
  </CardContent>
</Card>

          )}

          {/* Password generator */}
          {tool === "pwd_gen" && (
<Card className="dark:bg-black/80 bg-white/80 backdrop-blur-xl border border-zinc-200/20 dark:border-zinc-700/40 shadow-xl rounded-xl">
      {/* Header */}
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="w-5 h-5 " />
          Password Generator
        </CardTitle>

        <Badge className="bg-emerald-500/10 border border-emerald-500/20 
            text-emerald-700 dark:text-emerald-300 backdrop-blur-md">
          Secure
        </Badge>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-4">
        
        {/* Button Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex items-center gap-2"
            onClick={() => handlePasswordGen(16, true)}
          >
            <RefreshCcw className="w-4 h-4" /> Generate 16 chars
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => handlePasswordGen(24, true)}
          >
            <RefreshCcw className="w-4 h-4" /> Generate 24 chars
          </Button>
        </div>

        {/* Password Display */}
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="
            w-full p-3 rounded-lg font-mono text-base sm:text-lg 
            bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/30 dark:border-zinc-700/40
            flex items-center justify-between gap-3
          "
        >
          <span className="break-all">
            {generatedPassword || "—"}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={handleCopy}
            disabled={!generatedPassword}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </motion.div>

        {/* Clear Button */}
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setGeneratedPassword("")}
        >
          <Eraser className="w-4 h-4" /> Clear
        </Button>
      </CardContent>
    </Card>
          )}

          {/* SRT <-> VTT */}
          {tool === "srt_vtt" && (
            <Card>
              <CardHeader>
                <CardTitle>Subtitle Converters — SRT ⇄ VTT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">SRT</div>
                      <div className="text-xs">→ VTT</div>
                    </div>
                    <Textarea value={srtText} onChange={(e) => setSrtText(e.target.value)} className="min-h-[160px]" />
                    <div className="flex gap-2 mt-2">
                      <Button onClick={handleSrtToVtt}>Convert → VTT</Button>
                      <Button variant="outline" onClick={() => setSrtText("")}>Clear</Button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">VTT</div>
                      <div className="text-xs">→ SRT</div>
                    </div>
                    <Textarea value={vttText} onChange={(e) => setVttText(e.target.value)} className="min-h-[160px]" />
                    <div className="flex gap-2 mt-2">
                      <Button onClick={handleVttToSrt}>Convert → SRT</Button>
                      <Button variant="outline" onClick={() => setVttText("")}>Clear</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* HEX ⇄ RGB quick */}
          {tool === "hex_rgb" && (
<Card className="dark:bg-black/80 bg-white/80 shadow-xl border border-zinc-200/20 dark:border-zinc-700/40 rounded-xl backdrop-blur-md">
  <CardHeader className="flex items-center justify-between pb-3">
    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
      <Droplet className="w-5 h-5 " />
      HEX ⇄ RGB Converter
    </CardTitle>

    <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 
      text-emerald-700 dark:text-emerald-300">
      Colors
    </Badge>
  </CardHeader>

  <CardContent className="space-y-6">

    {/* Color Preview */}
    <motion.div
      animate={{ backgroundColor: hexColor || "#ffffff" }}
      transition={{ duration: 0.3 }}
      className="w-full h-24 rounded-lg border border-zinc-300/20 dark:border-zinc-700/40 shadow-inner"
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* LEFT (HEX → RGB) */}
      <Card className="p-4 dark:bg-zinc-900/60 bg-white/60 border border-zinc-200/20 dark:border-zinc-700/40 shadow">
        <Label className="text-xs font-medium">HEX</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={hexColor}
            onChange={(e) => setHexColor(e.target.value)}
            placeholder="#1e90ff"
            className="flex-1 font-mono"
          />
          <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(hexColor)}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={handleHexToRgb}>
            <Pipette className="w-4 h-4 mr-1" /> Convert
          </Button>
        </div>

        <div className="mt-3 text-sm">
          RGB:{" "}
          {rgbOut ? (
            <span className="font-mono">
              {rgbOut.r}, {rgbOut.g}, {rgbOut.b}
            </span>
          ) : (
            "—"
          )}
        </div>
      </Card>

      {/* RIGHT (RGB → HEX) */}
      <Card className="p-4 dark:bg-zinc-900/60 bg-white/60 border border-zinc-200/20 dark:border-zinc-700/40 shadow">
        <Label className="text-xs font-medium">RGB</Label>
        <div className="flex gap-2 mt-1">
          <Input value={rVal} onChange={(e) => setRVal(Number(e.target.value))} placeholder="R" />
          <Input value={gVal} onChange={(e) => setGVal(Number(e.target.value))} placeholder="G" />
          <Input value={bVal} onChange={(e) => setBVal(Number(e.target.value))} placeholder="B" />
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={handleRgbToHex}>
            <Droplet className="w-4 h-4 mr-1" /> Convert
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRVal(0);
              setGVal(0);
              setBVal(0);
            }}
          >
            <RefreshCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>

        <div className="mt-3 flex justify-between items-center">
          <span className="text-sm">
            HEX: <span className="font-mono">{hexColor || "—"}</span>
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(hexColor)}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  </CardContent>
</Card>

          )}
      <Card className="p-4 dark:bg-zinc-900/60 bg-white/60 border border-zinc-200/20 dark:border-zinc-700/40 shadow">
              <CardHeader>
                <CardTitle>Small Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">QR Preview</div>
                <div className="mt-2 flex items-center justify-center">
                  {qrImgSrc ? <img src={qrImgSrc} alt="QR preview" width={150} height={150} /> : <div className="text-sm">No QR text</div>}
                </div>
                <Separator className="my-2" />
                <div className="text-xs text-muted-foreground">Color preview</div>
                <div className="mt-2" style={{ height: 60, background: hexColor, borderRadius: 6 }} />
              </CardContent>
            </Card>
        </main>

        {/* right: details and preview / quick actions */}
        <aside className="lg:col-span-3">
          <div className="space-y-4">
            <Card className="p-4 dark:bg-zinc-900/60 bg-white/60 border border-zinc-200/20 dark:border-zinc-700/40 shadow">
              <CardHeader>
                <CardTitle>Preview & Quick Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div><strong>User agent</strong></div>
                  <div className="font-mono text-xs break-words">{ua}</div>
                  <Separator />
                  <div><strong>Screen</strong></div>
                  <div className="text-xs">Resolution: {screenInfo.screenW} × {screenInfo.screenH}</div>
                  <div className="text-xs">Viewport: {screenInfo.viewportW} × {screenInfo.viewportH}</div>
                  <Separator />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => { navigator.clipboard.writeText(ua || ""); showToast("success", "UA copied"); }}><Copy className="w-4 h-4" /> Copy UA</Button>
                    <Button size="sm" variant="outline" onClick={() => downloadText("screen-info.json", JSON.stringify(screenInfo, null, 2))}><Download className="w-4 h-4" /> Export</Button>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        </aside>
      </div>

      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Info</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">Helper dialog</p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button>Close</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
