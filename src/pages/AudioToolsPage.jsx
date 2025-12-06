// src/pages/AudioToolsPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";

import {
  Loader2,
  Copy,
  Download,
  Music,
  Scissors,
  Play,
  Pause,
  Zap,
  AlertCircle,
  Layers,
  Settings,
  RefreshCw,
  Speaker,
  Volume2,
  Mic,
  Slash,
  Square,
  User,
  Image as ImageIcon,
  MicIcon,
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
import { toast } from "sonner"; // lightweight toasts

// ---------------- Tools Enum ----------------
const TOOLS = {
  PLAYER: "audio_player",
  CUTTER: "audio_cutter",
  SPEED: "audio_speed",
  TRANSCRIBE: "audio_to_text",
  VOICE: "voice_changer",
};

// ---------------- Helpers: WAV encoder + audio utils ----------------
// Minimal WAV encoder for Float32Array -> WAV Blob
function encodeWAV(float32Array, sampleRate) {
  const buffer = new ArrayBuffer(44 + float32Array.length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + float32Array.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, float32Array.length * 2, true);

  let offset = 44;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

// decode an ArrayBuffer to AudioBuffer using AudioContext
async function decodeAudioBuffer(arrayBuffer, audioContext) {
  return await audioContext.decodeAudioData(arrayBuffer.slice(0));
}

// slice an AudioBuffer between startSec and endSec and return Float32Array mono mix
function sliceAudioBufferToMonoFloat32(audioBuffer, startSec, endSec) {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(endSec * sampleRate));
  const len = Math.max(0, endSample - startSample);
  const tmp = new Float32Array(len);

  const channelCount = audioBuffer.numberOfChannels;
  for (let ch = 0; ch < channelCount; ch++) {
    const data = audioBuffer.getChannelData(ch).subarray(startSample, endSample);
    for (let i = 0; i < len; i++) {
      tmp[i] = (tmp[i] || 0) + data[i] / channelCount;
    }
  }
  return { samples: tmp, sampleRate };
}

// render an AudioBuffer with a given playbackRate into a new AudioBuffer via OfflineAudioContext
async function renderBufferWithRate(audioBuffer, playbackRate) {
  if (playbackRate <= 0) throw new Error("playbackRate must be > 0");

  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration / playbackRate;
  const length = Math.ceil(duration * sampleRate);

  const offlineCtx = new OfflineAudioContext(1, length, sampleRate);

  const src = offlineCtx.createBufferSource();
  const single = offlineCtx.createBuffer(1, audioBuffer.length, sampleRate);

  const chCount = audioBuffer.numberOfChannels;
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0;
    for (let ch = 0; ch < chCount; ch++) sum += audioBuffer.getChannelData(ch)[i];
    single.getChannelData(0)[i] = sum / chCount;
  }

  src.buffer = single;
  src.playbackRate.value = playbackRate;
  src.connect(offlineCtx.destination);
  src.start(0);

  const rendered = await offlineCtx.startRendering();
  return rendered;
}

// render effect: robot (ring-mod + distortion) using OfflineAudioContext
async function renderBufferWithEffect(audioBuffer, effectName, effectParams = {}) {
  const sampleRate = audioBuffer.sampleRate;
  const length = Math.ceil(audioBuffer.length); // keep same length for effects that preserve duration

  const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);

  // create single-channel buffer and copy (mixdown)
  const single = offlineCtx.createBuffer(1, audioBuffer.length, sampleRate);
  const chCount = audioBuffer.numberOfChannels;
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0;
    for (let ch = 0; ch < chCount; ch++) sum += audioBuffer.getChannelData(ch)[i];
    single.getChannelData(0)[i] = sum / chCount;
  }

  const src = offlineCtx.createBufferSource();
  src.buffer = single;

  let nodeChainStart = src;
  let nodeChainEnd = offlineCtx.destination;

  if (effectName === "robot") {
    // ring modulation: multiply signal by oscillator
    const gainNode = offlineCtx.createGain();
    const modOsc = offlineCtx.createOscillator();
    const modGain = offlineCtx.createGain();

    // mod frequency
    const freq = effectParams.freq || 30;
    modOsc.frequency.value = freq;
    modGain.gain.value = 0.5;

    // create a modulation path: modOsc -> modGain -> gainNode.gain (needs periodicWave)
    // In OfflineAudioContext we cannot connect oscillator to parameter directly, so we approximate
    // by using a Waveshaper for amplitude shaping after mixing (simple approach)
    // Simpler approach: create a dry + multiply by oscillator via ScriptProcessor is not allowed offline.
    // Instead, approximate robot effect by doubling and using distortion + ring-like filter.

    // create biquad & distortion for metallic effect
    const biquad = offlineCtx.createBiquadFilter();
    biquad.type = "highpass";
    biquad.frequency.value = 800;

    const distortion = offlineCtx.createWaveShaper();
    const curve = new Float32Array(65536);
    const k = 20;
    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / curve.length - 1;
      curve[i] = ((3 + k) * x * 20 * Math.PI) / (Math.PI + k * Math.abs(x));
    }
    distortion.curve = curve;
    distortion.oversample = "4x";

    // simple ring-ish effect: duplicate, detune slightly (by playbackRate), mix with original after processing
    const splitter = offlineCtx.createChannelSplitter(1);
    const merger = offlineCtx.createChannelMerger(1);

    src.connect(biquad);
    biquad.connect(distortion);
    distortion.connect(offlineCtx.destination); // processed path
    src.connect(offlineCtx.destination); // dry path - mixing both gives metallic sound

    // start and render
    src.start(0);
    const rendered = await offlineCtx.startRendering();
    return rendered;
  } else {
    // default: no extra processing, just render single
    src.connect(offlineCtx.destination);
    src.start(0);
    const rendered = await offlineCtx.startRendering();
    return rendered;
  }
}

// ----------------- Cover art extraction (MP3 ID3v2 APIC) -----------------
// Replace your old extractCoverFromFile with this improved version
async function extractCoverFromFile(file) {
  // read the first 10 bytes to get ID3 header and declared tag size
  try {
    const headBuf = await file.slice(0, 10).arrayBuffer();
    const head = new Uint8Array(headBuf);
    if (head.length < 10) return null;
    if (head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return null; // not ID3

    const versionMajor = head[3]; // 2, 3 or 4
    // header size is syncsafe 4 bytes (ID3v2 header always uses syncsafe)
    const tagSize =
      (head[6] & 0x7f) * 0x200000 +
      (head[7] & 0x7f) * 0x4000 +
      (head[8] & 0x7f) * 0x80 +
      (head[9] & 0x7f);

    // cap tag read size to avoid reading enormous files in browser (adjust as needed)
    const cap = Math.min(tagSize + 10, 5 * 1024 * 1024); // 5 MB max
    const fullBuf = await file.slice(0, cap).arrayBuffer();
    const bytes = new Uint8Array(fullBuf);

    // helper to read 32-bit big-endian
    const readUInt32BE = (arr, off) =>
      (arr[off] << 24) | (arr[off + 1] << 16) | (arr[off + 2] << 8) | arr[off + 3];

    // helper to read 3-byte size (v2.2)
    const readUInt24BE = (arr, off) =>
      (arr[off] << 16) | (arr[off + 1] << 8) | arr[off + 2];

    // walk frames starting after header (offset 10)
    let offset = 10;
    const end = Math.min(10 + tagSize, bytes.length);

    while (offset + 10 < end) {
      // frame ID and size depend on version
      let frameId = "";
      let frameSize = 0;
      let headerSize = 0;

      if (versionMajor === 2) {
        // ID3v2.2: 3-byte id, 3-byte size
        if (offset + 6 > bytes.length) break;
        frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2]);
        frameSize = readUInt24BE(bytes, offset + 3);
        headerSize = 6;
      } else if (versionMajor === 3) {
        // ID3v2.3: 4-byte id, 4-byte size (big-endian)
        if (offset + 10 > bytes.length) break;
        frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
        frameSize = readUInt32BE(bytes, offset + 4);
        headerSize = 10;
      } else if (versionMajor === 4) {
        // ID3v2.4: 4-byte id, 4-byte syncsafe size
        if (offset + 10 > bytes.length) break;
        frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
        // syncsafe -> convert 4 bytes to int
        frameSize =
          (bytes[offset + 4] & 0x7f) * 0x200000 +
          (bytes[offset + 5] & 0x7f) * 0x4000 +
          (bytes[offset + 6] & 0x7f) * 0x80 +
          (bytes[offset + 7] & 0x7f);
        headerSize = 10;
      } else {
        // unknown version
        break;
      }

      offset += headerSize;
      if (frameSize <= 0 || offset + frameSize > bytes.length) {
        // frame size invalid or not fully in buffer — break to avoid infinite loop
        break;
      }

      // APIC in v2.3/2.4; PIC in v2.2
      if (frameId === "APIC" || frameId === "PIC") {
        // parse APIC/PIC frame structure
        const frameData = bytes.subarray(offset, offset + frameSize);
        let p = 0;
        const encoding = frameData[p++];

        // read MIME (APIC) or image format (PIC v2.2) up to null
        let mime = "";
        if (frameId === "APIC") {
          while (p < frameData.length && frameData[p] !== 0) mime += String.fromCharCode(frameData[p++]);
          p++; // skip null
        } else {
          // PIC: 3-byte image format, e.g. "JPG"
          mime = String.fromCharCode(frameData[p], frameData[p + 1], frameData[p + 2]);
          // map common PIC codes to mime
          if (mime.toUpperCase() === "JPG") mime = "image/jpeg";
          else mime = "image/" + mime.toLowerCase();
          p += 3;
        }

        // picture type byte
        const picType = frameData[p++];

        // description: terminated by 0 (encoding aware) -> we just skip until 0
        while (p < frameData.length && frameData[p] !== 0) p++;
        if (p < frameData.length && frameData[p] === 0) p++;

        // remaining bytes are image binary
        const imageData = frameData.subarray(p);
        if (imageData && imageData.length > 16) {
          const blob = new Blob([imageData], { type: mime || "image/jpeg" });
          const url = URL.createObjectURL(blob);
          return url;
        } else {
          // image data too small — probably truncated or not fully read
          return null;
        }
      }

      // move to next frame
      offset += frameSize;
    }
  } catch (err) {
    // ignore parse errors
    // console.warn("cover parse failed", err);
    return null;
  }
  return null;
}


// ----------------- Main component -----------------
export default function AudioToolsPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // tool selection (sync to ?tool param on first mount)
  const [selectedTool, setSelectedTool] = useState(TOOLS.PLAYER);

  // file and audio state
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const audioCtxRef = useRef(null);

  // extracted cover
  const [coverUrl, setCoverUrl] = useState(null);

  // player state
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // cutter state
  const [cutStart, setCutStart] = useState(0);
  const [cutEnd, setCutEnd] = useState(0);

  // voice changer state
  const [voiceEffect, setVoiceEffect] = useState("chipmunk"); // chipmunk | deep | robot
  const [voiceEffectParam, setVoiceEffectParam] = useState(1.4); // e.g., factor for chipmunk/deep or freq for robot

  // loading / UI
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // transcription state
  const [transcript, setTranscript] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const recognitionRef = useRef(null);

  // debug / info
  const [sampleRate, setSampleRate] = useState(null);
  const [channels, setChannels] = useState(null);
  const [file, setFile] = useState(null);

  // read ?tool param on mount (vanilla)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tool");
      if (t && Object.values(TOOLS).includes(t)) setSelectedTool(t);
    } catch (e) {
      /* ignore */
    }
    if (!audioCtxRef.current && typeof window !== "undefined") {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // sync URL when selectedTool changes
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (selectedTool) params.set("tool", selectedTool);
      else params.delete("tool");
      const q = params.toString();
      window.history.replaceState(null, "", pathname + (q ? `?${q}` : ""));
    } catch (e) {
      // ignore
    }
  }, [selectedTool]);

  // cleanup audioURL/cover when file changes
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (coverUrl) URL.revokeObjectURL(coverUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle file input
  const handleFileChange = useCallback(
    async (e) => {
      const f = e.target.files?.[0];
      setFile(f);
      if (!f) return;
      if (!f.type.startsWith("audio/")) {
        toast.error("Please upload a valid audio file (mp3, wav, m4a, etc.)");
        return;
      }

      setLoading(true);
      setAudioFile(f);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      if (coverUrl) {
        URL.revokeObjectURL(coverUrl);
        setCoverUrl(null);
      }

      const url = URL.createObjectURL(f);
      setAudioUrl(url);

      // attempt to extract cover art (best effort for MP3 APIC)
      try {
        const cover = await extractCoverFromFile(f);
        if (cover) {
          setCoverUrl(cover);
        }
      } catch (err) {
        // ignore
      }

      try {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = audioCtxRef.current;

        const arrayBuffer = await f.arrayBuffer();
        const decoded = await decodeAudioBuffer(arrayBuffer, ctx);
        setAudioBuffer(decoded);
        setSampleRate(decoded.sampleRate);
        setChannels(decoded.numberOfChannels);
        setDuration(decoded.duration);
        setCutStart(0);
        setCutEnd(decoded.duration);
        showToast("success", `Loaded ${f.name}`);
      } catch (err) {
        console.error("decode error", err);
        showToast("error", "Failed to decode audio (file may be unsupported)");
        setAudioBuffer(null);
      } finally {
        setLoading(false);
      }
    },
    [audioUrl, coverUrl]
  );

  // audio element event handlers (progress)
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onTime = () => setCurrentTime(audioEl.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onLoaded = () => {
      setDuration(audioEl.duration || duration);
      setCurrentTime(audioEl.currentTime || 0);
    };

    audioEl.addEventListener("timeupdate", onTime);
    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);
    audioEl.addEventListener("loadedmetadata", onLoaded);

    return () => {
      audioEl.removeEventListener("timeupdate", onTime);
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
      audioEl.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [duration]);

  // update volume & playbackRate on audio element
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    // when using voice preview for certain effects we will create a separate WebAudio chain
    el.playbackRate = playbackRate;
  }, [playbackRate]);

  // quick play/pause button
  const togglePlay = useCallback(async () => {
    const el = audioRef.current;
    if (!el) {
      showToast("error", "No audio loaded");
      return;
    }
    try {
      if (el.paused) {
        await el.play();
      } else {
        el.pause();
      }
    } catch (err) {
      showToast("error", "Playback failed — user gesture required or file unsupported");
      console.error(err);
    }
  }, []);

  // seek
  const handleSeek = useCallback((value) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Number(value);
    setCurrentTime(Number(value));
  }, []);

  // ---------------- CUTTER: export selection to WAV ----------------
  const exportCutAsWav = useCallback(async () => {
    if (!audioBuffer) {
      showToast("error", "No audio loaded");
      return;
    }
    const start = Math.max(0, Math.min(cutStart, audioBuffer.duration));
    const end = Math.max(0, Math.min(cutEnd, audioBuffer.duration));
    if (end <= start) {
      showToast("error", "Invalid cut range");
      return;
    }
    setLoading(true);
    try {
      const { samples, sampleRate } = sliceAudioBufferToMonoFloat32(audioBuffer, start, end);
      const wavBlob = encodeWAV(samples, sampleRate);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cut-${Math.round(start)}-${Math.round(end)}s.wav`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("success", "Cut exported");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to export cut");
    } finally {
      setLoading(false);
    }
  }, [audioBuffer, cutStart, cutEnd]);

  // preview cut: play from start to end (temporarily)
  const previewCut = useCallback(() => {
    if (!audioRef.current || !audioBuffer) {
      showToast("error", "Nothing to preview");
      return;
    }
    const el = audioRef.current;
    el.currentTime = Math.max(0, cutStart);
    el.playbackRate = playbackRate;
    el.play().catch(() => {});
    // stop at cutEnd
    const stopAt = () => {
      if (el.currentTime >= cutEnd - 0.05) {
        el.pause();
        el.removeEventListener("timeupdate", stopAt);
      }
    };
    el.addEventListener("timeupdate", stopAt);
  }, [cutStart, cutEnd, playbackRate, audioBuffer]);

  // ---------------- SPEED: export rendered buffer at playbackRate ----------------
  const exportSpeedAdjusted = useCallback(
    async (rate) => {
      if (!audioBuffer) {
        showToast("error", "No audio loaded");
        return;
      }
      if (rate <= 0) {
        showToast("error", "Invalid playback rate");
        return;
      }
      setLoading(true);
      try {
        const rendered = await renderBufferWithRate(audioBuffer, rate);
        const samples = rendered.numberOfChannels === 1
          ? rendered.getChannelData(0).slice(0)
          : (() => {
              const len = rendered.length;
              const tmp = new Float32Array(len);
              for (let ch = 0; ch < rendered.numberOfChannels; ch++) {
                const data = rendered.getChannelData(ch);
                for (let i = 0; i < len; i++) tmp[i] = (tmp[i] || 0) + data[i] / rendered.numberOfChannels;
              }
              return tmp;
            })();

        const wav = encodeWAV(samples, rendered.sampleRate);
        const url = URL.createObjectURL(wav);
        const a = document.createElement("a");
        a.href = url;
        a.download = `speed-${rate.toFixed(2)}x.wav`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("success", "Export complete");
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to render/export at new speed");
      } finally {
        setLoading(false);
      }
    },
    [audioBuffer]
  );

  // ---------------- VOICE CHANGER: preview and export ----------------
  // preview: simple approach using AudioContext nodes (not offline)
// preview: simple approach using AudioContext nodes (not offline)
// (replace your existing previewVoiceEffect with this)
const stopVoicePreview = useCallback(() => {
  try {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    // call stored cleanup if present
    if (typeof ctx.__voicePreviewCleanup === "function") {
      try { ctx.__voicePreviewCleanup(); } catch (e) { /* ignore */ }
      delete ctx.__voicePreviewCleanup;
    }

    // stop stored source if exists
    if (ctx.__voicePreviewSource) {
      try { ctx.__voicePreviewSource.stop(0); } catch (e) {}
      try { ctx.__voicePreviewSource.disconnect(); } catch (e) {}
      delete ctx.__voicePreviewSource;
    }
    // stop stored osc if exists
    if (ctx.__voicePreviewOsc) {
      try { ctx.__voicePreviewOsc.stop(0); } catch (e) {}
      try { ctx.__voicePreviewOsc.disconnect(); } catch (e) {}
      delete ctx.__voicePreviewOsc;
    }
    // clear any preview timeout
    if (ctx.__voicePreviewTimeout) {
      clearTimeout(ctx.__voicePreviewTimeout);
      delete ctx.__voicePreviewTimeout;
    }
  } catch (err) {
    // swallow cleanup errors
    console.warn("stopVoicePreview error", err);
  }
}, []);
const previewVoiceEffect = useCallback(async () => {
  if (!audioBuffer) {
    showToast("error", "No audio loaded");
    return;
  }
  try {
    const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    // ensure previous preview is fully stopped
    stopVoicePreview();

    // create source from buffer (mono mixdown)
    const src = ctx.createBufferSource();
    const single = ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
    const chCount = audioBuffer.numberOfChannels;
    for (let i = 0; i < audioBuffer.length; i++) {
      let sum = 0;
      for (let ch = 0; ch < chCount; ch++) sum += audioBuffer.getChannelData(ch)[i];
      single.getChannelData(0)[i] = sum / chCount;
    }
    src.buffer = single;

    // store source for cleanup
    ctx.__voicePreviewSource = src;

    // create a cleanup function scoped here (so we can call it from onended or stopVoicePreview)
    const cleanup = () => {
      try {
        if (ctx.__voicePreviewSource) {
          try { ctx.__voicePreviewSource.stop(0); } catch (e) {}
          try { ctx.__voicePreviewSource.disconnect(); } catch (e) {}
          delete ctx.__voicePreviewSource;
        }
        if (ctx.__voicePreviewOsc) {
          try { ctx.__voicePreviewOsc.stop(0); } catch (e) {}
          try { ctx.__voicePreviewOsc.disconnect(); } catch (e) {}
          delete ctx.__voicePreviewOsc;
        }
        if (ctx.__voicePreviewTimeout) {
          clearTimeout(ctx.__voicePreviewTimeout);
          delete ctx.__voicePreviewTimeout;
        }
      } catch (e) {
        /* ignore cleanup errors */
      }
    };

    // store cleanup so stopVoicePreview can call it
    ctx.__voicePreviewCleanup = cleanup;

    if (voiceEffect === "chipmunk") {
      src.playbackRate.value = voiceEffectParam || 1.6;
      src.connect(ctx.destination);
      src.start(0);
      // when playback ends clean up
      src.onended = () => cleanup();
    } else if (voiceEffect === "deep") {
      src.playbackRate.value = voiceEffectParam || 0.75;
      src.connect(ctx.destination);
      src.start(0);
      src.onended = () => cleanup();
    } else if (voiceEffect === "robot") {
      // robot preview: ring-mod style using an oscillator modulating a gain node
      const gain = ctx.createGain();
      const modOsc = ctx.createOscillator();
      const modGain = ctx.createGain();

      // parameters
      modOsc.type = "square";
      modOsc.frequency.value = voiceEffectParam || 30;
      modGain.gain.value = 0.5;

      // routing: src -> gain -> destination
      // oscillator -> modGain -> gain.gain (AudioParam) — this is allowed
      // connect modOsc -> modGain -> gain.gain
      try {
        modOsc.connect(modGain);
        // connect modGain to the AudioParam (gain.gain)
        modGain.connect(gain.gain);
      } catch (e) {
        // some browsers may disallow direct AudioParam connections in some contexts,
        // fall back to simpler chain
        modOsc.disconnect();
        modGain.disconnect();
      }

      src.connect(gain);
      gain.connect(ctx.destination);

      // store oscillator for cleanup
      ctx.__voicePreviewOsc = modOsc;
      ctx.__voicePreviewSource = src;

      // start oscillator & source
      try { modOsc.start(0); } catch (e) {}
      try { src.start(0); } catch (e) {}

      // schedule cleanup when source ends
      src.onended = () => cleanup();

      // also attach a safety timeout (in case onended isn't fired reliably)
      ctx.__voicePreviewTimeout = setTimeout(() => {
        cleanup();
      }, Math.ceil(src.buffer.duration * 1000) + 500);
    }

    showToast("success", "Previewing voice effect");
  } catch (err) {
    console.error("voice preview error", err);
    showToast("error", "Voice preview failed");
  }
}, [audioBuffer, voiceEffect, voiceEffectParam, stopVoicePreview]);
 // cleanup preview nodes on unmount
useEffect(() => {
  return () => {
    stopVoicePreview();
  };
}, [stopVoicePreview]);


  // export voice-changed result (OfflineAudioContext)
  const exportVoiceChanged = useCallback(async () => {
    if (!audioBuffer) {
      showToast("error", "No audio loaded");
      return;
    }
    setLoading(true);
    try {
      if (voiceEffect === "chipmunk" || voiceEffect === "deep") {
        // use renderBufferWithRate for chipmunk/deep
        const rate = voiceEffect === "chipmunk" ? (voiceEffectParam || 1.6) : (voiceEffectParam || 0.75);
        const rendered = await renderBufferWithRate(audioBuffer, rate);
        const samples = rendered.numberOfChannels === 1
          ? rendered.getChannelData(0).slice(0)
          : (() => {
              const len = rendered.length;
              const tmp = new Float32Array(len);
              for (let ch = 0; ch < rendered.numberOfChannels; ch++) {
                const data = rendered.getChannelData(ch);
                for (let i = 0; i < len; i++) tmp[i] = (tmp[i] || 0) + data[i] / rendered.numberOfChannels;
              }
              return tmp;
            })();
        const wav = encodeWAV(samples, rendered.sampleRate);
        const url = URL.createObjectURL(wav);
        const a = document.createElement("a");
        a.href = url;
        a.download = `voice-${voiceEffect}-${(voiceEffectParam || 1).toFixed(2)}x.wav`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("success", "Export complete");
      } else if (voiceEffect === "robot") {
        // use renderBufferWithEffect which approximates robot effect
        const rendered = await renderBufferWithEffect(audioBuffer, "robot", { freq: voiceEffectParam || 30 });
        const samples = rendered.numberOfChannels === 1
          ? rendered.getChannelData(0).slice(0)
          : (() => {
              const len = rendered.length;
              const tmp = new Float32Array(len);
              for (let ch = 0; ch < rendered.numberOfChannels; ch++) {
                const data = rendered.getChannelData(ch);
                for (let i = 0; i < len; i++) tmp[i] = (tmp[i] || 0) + data[i] / rendered.numberOfChannels;
              }
              return tmp;
            })();
        const wav = encodeWAV(samples, rendered.sampleRate);
        const url = URL.createObjectURL(wav);
        const a = document.createElement("a");
        a.href = url;
        a.download = `voice-robot-${Date.now()}.wav`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("success", "Export complete");
      } else {
        showToast("error", "Unknown effect");
      }
    } catch (err) {
      console.error("export voice changed err", err);
      showToast("error", "Export failed");
    } finally {
      setLoading(false);
    }
  }, [audioBuffer, voiceEffect, voiceEffectParam]);

  // ---------------- TRANSCRIBE: Web Speech API (microphone capture) ----------------
  const startTranscription = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("error", "Speech Recognition not supported in this browser");
      return;
    }

    if (!recognitionRef.current) {
      const r = new SpeechRecognition();
      r.continuous = true;
      r.interimResults = true;
      r.lang = "en-US";
      recognitionRef.current = r;
    }

    const r = recognitionRef.current;
    if (!r) return;

    r.onstart = () => {
      setRecognizing(true);
      showToast("success", "Listening...");
    };
    r.onerror = (e) => {
      console.error("recognition error", e);
      showToast("error", "Recognition error");
    };
    r.onend = () => {
      setRecognizing(false);
      showToast("info", "Stopped");
    };
    r.onresult = (evt) => {
      let interim = "";
      let final = "";
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const rres = evt.results[i];
        if (rres.isFinal) final += rres[0].transcript;
        else interim += rres[0].transcript;
      }
      setTranscript((prev) => {
        if (final) return `${prev} ${final}`.trim();
        return `${prev} ${interim}`.trim();
      });
    };

    try {
      r.start();
    } catch (err) {
      console.error("start error", err);
      showToast("error", "Could not start recognition (maybe already running)");
    }
  }, []);

  const stopTranscription = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) {
      setRecognizing(false);
      return;
    }
    try {
      r.stop();
    } catch (err) {
      console.warn("stop err", err);
    }
    setRecognizing(false);
  }, []);

  // copy transcript
  const copyTranscript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transcript || "");
      showToast("success", "Copied transcript");
    } catch {
      showToast("error", "Failed to copy");
    }
  }, [transcript]);

  // download transcript
  const downloadTranscript = useCallback(() => {
    if (!transcript) {
      showToast("error", "No transcript");
      return;
    }
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Downloaded transcript");
  }, [transcript]);

  // small helpers
  const formatTime = (s = 0) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ---------------- UI rendering ----------------
  const toolLabel = useMemo(() => {
    switch (selectedTool) {
      case TOOLS.PLAYER:
        return "Audio Player";
      case TOOLS.CUTTER:
        return "Audio Cutter";
      case TOOLS.SPEED:
        return "Playback Speed";
      case TOOLS.TRANSCRIBE:
        return "Audio → Text (Speech Recognition)";
      case TOOLS.VOICE:
        return "Voice Changer";
      default:
        return "Audio Tool";
    }
  }, [selectedTool]);

  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      <header className="mb-6">
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
             Audio Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Play • Cut • Change speed • Transcribe • Voice changer</p>
          </div>

          <div className="flex items-center gap-3">


            <Button className="cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}>
              <Zap className="w-4 h-4" /> Info
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Controls</span>
                <Badge  className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300" >{selectedTool === TOOLS.TRANSCRIBE ? "Speech" : "Audio"}</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select tool</Label>
                <Select value={selectedTool} onValueChange={setSelectedTool}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value={TOOLS.PLAYER}>Audio Player</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.CUTTER}>Audio Cutter</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.SPEED}>Audio Speed Changer</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.VOICE}>Voice Changer</SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.TRANSCRIBE}>Audio → Text (Web Speech)</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                <Label className="text-xs">Upload audio file</Label>
                     <div className="relative">
                        <Input id="audio-upload" type="file" accept="audio/*" onChange={handleFileChange} className=" border-2 border-dashed cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10" />
                    <div className="flex items-center justify-center h-12 rounded-md border-2 border-dashed text-sm">
                        <MicIcon className="w-4  h-4 mr-2" />
            
                    {file ? file.name : "Upload Audio"}
                    </div>
                   </div>

                {audioFile && (
                  <div className="text-xs opacity-80">
                    Loaded: <span className="font-medium">{audioFile.name}</span> • {formatTime(duration)}
                  </div>
                )}

                <Separator />

                {/* Tool specific controls */}
                {selectedTool === TOOLS.CUTTER && (
                  <>
                    <Label className="text-xs">Cut range (seconds)</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={cutStart} onChange={(e) => setCutStart(Number(e.target.value || 0))} className="w-1/2" />
                      <Input type="number" value={cutEnd} onChange={(e) => setCutEnd(Number(e.target.value || 0))} className="w-1/2" />
                    </div>
                    <div className="text-xs opacity-70">Tip: Click preview to play the selected range.</div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={previewCut} className="flex-1 cursor-pointer">
                        <Play className="w-4 h-4" /> Preview
                      </Button>
                      <Button onClick={exportCutAsWav} className="flex-1 bg-red-500 hover:bg-red-600 dark:text-white text-black cursor-pointer">
                        <Download className="w-4 h-4 " /> Export
                      </Button>
                    </div>
                  </>
                )}

                {selectedTool === TOOLS.SPEED && (
                  <>
                    <Label className="text-xs">Playback rate</Label>
                    <div className="flex items-center gap-3">
                      <Slider  min={0.5} max={2.0} step={0.05} value={[playbackRate]} onValueChange={(v) => setPlaybackRate(v[0])} className="w-full cursor-pointer" />
                      <div className="text-xs w-14 text-right">{playbackRate.toFixed(2)}x</div>
                    </div>

                    <div className="text-xs opacity-70">Preview uses playback rate. Export will render a new audio file at this speed.</div>
                    <div className="flex gap-2 mt-2">
                      <Button  onClick={() => exportSpeedAdjusted(playbackRate)} className="flex-1 cursor-pointer">
                        <Download className="w-4 h-4" /> Export at {playbackRate.toFixed(2)}x
                      </Button>
                      <Button className="cursor-pointer" onClick={() => { setPlaybackRate(1); showToast("success", "Reset to 1.0x"); }} variant="outline">
                        <RefreshCw className="w-4 h-4 " /> Reset
                      </Button>
                    </div>
                  </>
                )}

                {selectedTool === TOOLS.VOICE && (
                  <>
                    <Label className="text-xs">Effect</Label>
                    <Select value={voiceEffect} onValueChange={setVoiceEffect}>
                      <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="chipmunk">Chipmunk (higher pitch)</SelectItem>
                        <SelectItem className="cursor-pointer" value="deep">Deep (lower pitch)</SelectItem>
                        <SelectItem className="cursor-pointer" value="robot">Robot (metallic)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Label className="text-xs mt-3">Effect parameter</Label>
                    <div className="flex items-center gap-3">
                   <Slider
                        min={voiceEffect === "robot" ? 10 : 0.5}
                        max={voiceEffect === "robot" ? 100 : 2.5}
                        step={voiceEffect === "robot" ? 1 : 0.05}
                        value={[voiceEffectParam]}
                        onValueChange={(val) => setVoiceEffectParam(val[0])}
                        className="w-full cursor-pointer"
                        />

                      <div className="text-xs w-20 text-right">{voiceEffectParam}</div>
                    </div>

                    <div className="text-xs opacity-70 mt-2">Preview will play the file with the chosen effect. Export will render a WAV with the effect applied.</div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={previewVoiceEffect} className="flex-1 cursor-pointer">
                        <Play className="w-4 h-4 " /> Preview
                      </Button>
                      <Button  onClick={exportVoiceChanged} className="flex-1  bg-red-500 hover:bg-red-600 dark:text-white text-black cursor-pointer">
                        <Download className="w-4 h-4 " /> Export
                      </Button>
                    </div>
                  </>
                )}

                {selectedTool === TOOLS.TRANSCRIBE && (
                  <>
                    <Label className="text-xs">Transcription</Label>
                    <div className="text-sm mb-2 text-muted-foreground">
                      This uses the browser's Web Speech API and listens to your microphone. It cannot reliably transcribe uploaded audio unless you route audio to your mic.
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={startTranscription} disabled={recognizing} className="flex-1 cursor-pointer">
                        <Mic className="w-4 h-4 " /> Start
                      </Button>
                      <Button onClick={stopTranscription} disabled={!recognizing} variant="destructive" className="flex-1 cursor-pointer">
                        <Square className="w-4 h-4 " /> Stop
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={copyTranscript} className="flex-1 cursor-pointer">
                        <Copy className="w-4 h-4 mr-2" /> Copy
                      </Button>
                      <Button onClick={downloadTranscript} className="flex-1 cursor-pointer">
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Volume</span>
                    <span className="text-xs font-medium">{Math.round(volume * 100)}%</span>
                  </div>
                  <Slider className="cursor-pointer" value={[volume]} onValueChange={(v) => setVolume(Number(v[0]))} min={0} max={1} step={0.01} />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button className="cursor-pointer" onClick={() => { setAudioFile(null); setAudioUrl(null); setAudioBuffer(null); setTranscript(""); setCurrentTime(0); if (coverUrl) { URL.revokeObjectURL(coverUrl); setCoverUrl(null); } }}>
                    <RefreshCw className="w-4 h-4 " /> Clear
                  </Button>
                  <Button className="cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}>Help</Button>
                </div>

              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: player / preview */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" /> {toolLabel}
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(audioFile?.name || ""); showToast("success", "Copied filename"); }}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { if (audioUrl) { const a = document.createElement("a"); a.href = audioUrl; a.download = audioFile?.name || "audio"; a.click(); } else showToast("error", "No audio to download"); }}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-950/50">
                {/* Cover image / placeholder */}
                <div className="w-full h-full flex items-center justify-center border m-2 p-2 border-dashed rounded-2xl ">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className=" object-contain rounded-md shadow-sm" />
                  ) : (
                    <div className="w-full h-44 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <ImageIcon className="w-10 h-10 mb-2 opacity-70" />
                        <div className="text-sm opacity-80">{audioFile ? audioFile.name : "No cover art"}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* audio element & controls */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center flex-wrap gap-3">
                    <Button onClick={togglePlay} className="flex cursor-pointer items-center gap-2">
                      {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {playing ? "Pause" : "Play"}
                    </Button>

                    <div className="flex items-center gap-2 text-sm opacity-80">
                      <Speaker className="w-4 h-4" />
                      <div>{formatTime(currentTime)} / {formatTime(duration)}</div>
                    </div>

                    <div className="ml-auto text-xs px-1 py-0.5 rounded-2xl backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">Playback rate: {playbackRate.toFixed(2)}x</div>
                  </div>

                  <div>
                    <Slider className="cursor-pointer" min={0} max={duration || 1} step={0.01} value={[currentTime]} onValueChange={(v) => handleSeek(v[0])} />
                  </div>

                  <audio ref={audioRef} src={audioUrl || ""} controls={false} style={{ width: "100%" }} onEnded={() => setPlaying(false)} />

                  {/* display transcript when transcribe tool selected */}
                  {selectedTool === TOOLS.TRANSCRIBE && (
                    <div className="mt-3">
                      <Label className="text-xs mb-2">Transcript</Label>
                      <div className="rounded border p-3 min-h-[120px] bg-white/60 dark:bg-zinc-950/60">
                        <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* when cutter selected show visual summary */}
                  {selectedTool === TOOLS.CUTTER && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <div>Selection: <span className="font-medium">{formatTime(cutStart)} — {formatTime(cutEnd)} </span></div>
                      <div className="text-xs mt-1">Tip: Use the timeline above to seek, then set start/end to the current position for precision.</div>
                      <div className="mt-2 flex gap-2">
                        <Button className="cursor-pointer" onClick={() => { setCutStart(currentTime); showToast("success", "Cut start set to current time"); }} size="sm">Set start</Button>
                        <Button className="cursor-pointer" onClick={() => { setCutEnd(currentTime); showToast("success", "Cut end set to current time"); }} size="sm">Set end</Button>
                        <Button className="cursor-pointer" onClick={() => { setCutStart(0); setCutEnd(duration); showToast("success", "Reset range"); }} size="sm" variant="outline">Reset</Button>
                      </div>
                    </div>
                  )}

                  {/* voice changer preview info */}
                  {selectedTool === TOOLS.VOICE && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <div>Effect: <span className="font-medium">{voiceEffect}</span> • Param: <span className="font-medium">{voiceEffectParam}</span></div>
                      <div className="text-xs mt-1">Preview plays the file locally with effect applied; export renders a WAV with effect.</div>
                    </div>
                  )}

                </div>
              </div>
            </CardContent>
          </Card>

          {/* Speed preview card */}
          {selectedTool === TOOLS.SPEED && (
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Preview & Export</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">When you press Play, audio will play at the chosen rate. Use "Export" on the left to render a new audio file at this speed (resampled).</div>
              </CardContent>
            </Card>
          )}

        </main>

        {/* Right column: Debug / actions */}
        <aside className="lg:col-span-3">
          <div className="space-y-4">
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Details & Debug</span>
                  <Settings className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Sample rate</span>
                    <span className="font-medium">{sampleRate ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Channels</span>
                    <span className="font-medium">{channels ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Playback rate</span>
                    <span className="font-medium">{playbackRate.toFixed(2)}x</span>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    Notes:
                    <ul className="list-disc ml-4 mt-2">
                      <li>All operations are client-side — no files are uploaded to any server.</li>
                      <li>Transcription uses the browser's Web Speech API and listens to microphone input.</li>
                      <li>Exported files are WAV (mono, 16-bit PCM) for broad compatibility.</li>
                      <li>Cover art extraction currently detects ID3v2 APIC frames in MP3 files (best-effort).</li>
                    </ul>
                  </div>

                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.PLAYER); showToast("success", "Switched to Player"); }}>Open Player</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.CUTTER); showToast("success", "Switched to Cutter"); }}>Open Cutter</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.SPEED); showToast("success", "Switched to Speed"); }}>Open Speed</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.VOICE); showToast("success", "Switched to Voice Changer"); }}>Open Voice</Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSelectedTool(TOOLS.TRANSCRIBE); showToast("success", "Switched to Transcribe"); }}>Open Transcribe</Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </aside>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audio Tools — Notes</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              These tools run entirely in the browser using the Web Audio API and Web Speech API:
            </p>
            <ul className="list-disc ml-5 mt-2 text-sm">
              <li><strong>Player:</strong> Upload and play audio locally. Cover art (if embedded in MP3 ID3v2 APIC) will be shown automatically.</li>
              <li><strong>Cutter:</strong> Select a range and export as WAV (mono, 16-bit PCM).</li>
              <li><strong>Speed:</strong> Change playback rate for preview; export a new WAV rendered at the selected speed.</li>
              <li><strong>Voice changer:</strong> Apply simple effects (Chipmunk/Deep via playback rate; Robot via processing) and export to WAV.</li>
              <li><strong>Audio → Text:</strong> Uses the Web Speech API to transcribe microphone input (browser support required). Uploads cannot be transcribed directly unless played into the mic or server-side transcription is used.</li>
            </ul>
            <div className="mt-4 flex gap-2 justify-end">
              <Button className="cursor-pointer" onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
