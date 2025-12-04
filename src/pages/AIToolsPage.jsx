// src/pages/AIToolsPage.jsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Toaster } from "sonner";

import {
  Loader2,
  Copy,
  Download,
  Image as ImageIcon,
  Sparkles,
  Send,
  Zap,
  AlertCircle,
  Layers,
  Settings,
} from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
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
import { toast } from "sonner"; // used in image flow for quick toasts
import { useNavigate, useSearchParams } from "react-router-dom";

// ----------------- Tools Enum -----------------
const TOOLS = {
  SUMMARIZER: "summarizer",
  CODE_EXPLAINER: "code_explainer",
  PROMPT_GEN: "prompt_generator",
  IMAGE_CAPTION: "image_caption",

  // New tools
  EMAIL_WRITER: "email_writer",
  BLOG_WRITER: "blog_writer",
  PROOFREADER: "proofreader",
  TRANSLATOR: "translator",
  RESUME_ANALYZER: "resume_analyzer",
  SEO_KEYWORDS: "seo_keywords",
  YT_SCRIPT: "yt_script",
  SOCIAL_POST: "social_post",
};

// ----------------- API KEY from ENV -----------------
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const API_KEYY=import.meta.env.VITE_GEMINI_API_KEYY || "";

// ----------------- Helpers -----------------
/**
 * Convert File -> dataURL then split into base64 body & mime type
 * returns { base64Data, mimeType }
 */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result;
      if (typeof result !== "string") return reject(new Error("FileReader result missing"));
      const [prefix, base64Data] = result.split(",");
      const mimeMatch = prefix?.match(/data:(.*);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : file.type || "image/jpeg";
      resolve({ base64Data, mimeType });
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/**
 * Robust extractor for Gemini response shapes.
 * Tries multiple known locations in descending priority.
 */
function extractGenerationText(data) {
  if (!data) return "";

  const p1 = data?.candidates?.[0]?.content?.[0]?.parts?.[0]?.text;
  if (typeof p1 === "string" && p1.trim()) return p1.trim();

  const p2 = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof p2 === "string" && p2.trim()) return p2.trim();

  const p3 = data?.candidates?.[0]?.text;
  if (typeof p3 === "string" && p3.trim()) return p3.trim();

  if (typeof data?.outputText === "string" && data.outputText.trim()) return data.outputText.trim();
  if (typeof data?.result === "string" && data.result.trim()) return data.result.trim();

  if (Array.isArray(data?.candidates)) {
    const joined = data.candidates
      .map((c) => {
        if (Array.isArray(c?.content)) {
          return c.content
            .map((cont) => {
              if (Array.isArray(cont?.parts)) return cont.parts.map((pt) => pt?.text || "").join(" ");
              if (typeof cont?.text === "string") return cont.text;
              return "";
            })
            .join(" ");
        }
        if (c?.content?.parts) return c.content.parts.map((pt) => pt?.text || "").join(" ");
        if (typeof c?.text === "string") return c.text;
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
    if (joined.trim()) return joined.trim();
  }

  return "";
}

// copy helper
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text || "");
    showToast("success", "Copied to clipboard");
  } catch {
    showToast("error", "Copy failed");
  }
}

// ----------------- Main Component -----------------
export default function AIToolsPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // UI & tool state
  const [selectedTool, setSelectedTool] = useState(TOOLS.SUMMARIZER);

  // generation config
  const [temperature, setTemperature] = useState(0.25);
  const [maxTokens, setMaxTokens] = useState(800);

  // Summarizer
  const [summarizerText, setSummarizerText] = useState("");

  // Code explainer
  const [codeText, setCodeText] = useState("");
  const [codeLang, setCodeLang] = useState("javascript");

  // Prompt generator (also reused for many tools as 'intent')
  const [promptIntent, setPromptIntent] = useState("");
  const [promptTone, setPromptTone] = useState("professional");

  // Image caption
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Output & UI
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [finishReason, setFinishReason] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const resultRef = useRef(null);
  const initialLoadRef = useRef(true);

  // ----------------- URL helper -----------------
  const updateURL = useCallback(
    (key, value) => {
      try {
        const params = new URLSearchParams(searchParams);
        if (value === "" || value == null) {
          params.delete(key);
        } else {
          // store strings/numbers as string
          params.set(key, String(value));
        }
        setSearchParams(params);
      } catch (err) {
        // fallback: directly navigate
        const params = new URLSearchParams(window.location.search);
        if (value === "" || value == null) params.delete(key);
        else params.set(key, String(value));
        navigate(`?${params.toString()}`, { replace: true });
      }
    },
    [searchParams, setSearchParams, navigate]
  );

  // ----------------- Load params from URL on first mount -----------------
  React.useEffect(() => {
    if (!initialLoadRef.current) return;
    initialLoadRef.current = false;

    const toolFromURL = searchParams.get("tool");
    if (toolFromURL && Object.values(TOOLS).includes(toolFromURL)) {
      setSelectedTool(toolFromURL);
    }

    const tempParam = searchParams.get("temp");
    if (tempParam != null) setTemperature(Number(tempParam));

    const tokensParam = searchParams.get("tokens");
    if (tokensParam != null) setMaxTokens(Number(tokensParam));

    // Summarizer / shared text field
    const textParam = searchParams.get("text");
    if (textParam != null) setSummarizerText(textParam);

    // code params
    const codeParam = searchParams.get("code");
    if (codeParam != null) setCodeText(codeParam);
    const langParam = searchParams.get("lang");
    if (langParam != null) setCodeLang(langParam);

    // prompt / intent / tone
    const intentParam = searchParams.get("intent");
    if (intentParam != null) setPromptIntent(intentParam);
    const toneParam = searchParams.get("tone");
    if (toneParam != null) setPromptTone(toneParam);

    // prompt for image caption stored under 'prompt'
    const imagePrompt = searchParams.get("prompt");
    if (imagePrompt != null) setPromptIntent(imagePrompt);
  }, []); // run once

  // ----------------- Keep URL's tool param in sync with UI ---------------
  React.useEffect(() => {
    updateURL("tool", selectedTool);
  }, [selectedTool, updateURL]);

  // ----------------- Build request body for text-only tools -----------------
  const buildTextBody = useCallback(
    (prompt) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
    [temperature, maxTokens]
  );

  // ----------------- Image caption generator (based on user's working logic) -----------------
  const generateCaption = useCallback(
    async (base64Data, mimeType, userPrompt) => {
      // Use the GEMINI endpoint with API key from env
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: base64Data,
                },
              },
              {
                text: `You are an expert social media caption generator. Generate three distinct, creative captions based on the image provided. Format them as numbered items. User prompt: "${userPrompt}"`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: Math.max(0.2, Math.min(1, temperature || 0.8)),
          maxOutputTokens: maxTokens,
        },
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        let errMsg = `API error ${resp.status}`;
        try {
          const json = JSON.parse(text);
          errMsg = json.error?.message || JSON.stringify(json);
        } catch {
          errMsg = text;
        }
        throw new Error(errMsg);
      }

      const data = await resp.json();

      const candidate = data?.candidates?.[0] || null;
      setFinishReason(candidate?.finishReason ?? null);
      setUsageInfo(data?.usageMetadata ?? null);

      const genText = extractGenerationText(data);
      if (!genText) throw new Error("No generated text found in response. The model may have returned no content or was truncated (check tokens).");

      return genText;
    },
    [temperature, maxTokens]
  );

  // ----------------- Generic fetch wrapper to reduce repetition -----------------
  const generateWithBody = useCallback(
    async (body) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEYY}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`API error ${resp.status}: ${t}`);
      }

      const data = await resp.json();
      const candidate = data?.candidates?.[0] || null;
      setFinishReason(candidate?.finishReason ?? null);
      setUsageInfo(data?.usageMetadata ?? null);

      const text = extractGenerationText(data);
      if (!text) throw new Error(`No generated text found. finishReason: ${candidate?.finishReason ?? "unknown"}`);
      return text;
    },
    []
  );

  // ----------------- Unified generate handler (text & image) -----------------
  const handleGenerate = useCallback(async () => {
    setResult("");
    setFinishReason(null);
    setUsageInfo(null);

    if (!API_KEY) {
      showToast("error", "VITE_GEMINI_API_KEY not found in environment.");
      return;
    }

    setLoading(true);

    try {
      // SUMMARIZER
      if (selectedTool === TOOLS.SUMMARIZER) {
        if (!summarizerText.trim()) {
          showToast("error", "Enter text to summarize");
          setLoading(false);
          return;
        }
        const prompt = `Summarize the following text in 3-6 sentences preserving main points and neutral tone:\n\n${summarizerText}`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Generated");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // CODE EXPLAINER
      if (selectedTool === TOOLS.CODE_EXPLAINER) {
        if (!codeText.trim()) {
          showToast("error", "Paste code to explain");
          setLoading(false);
          return;
        }
        const prompt = `You are an expert developer. Explain this ${codeLang} code clearly: purpose, inputs/outputs, complexity, and a short usage example.\n\n${codeText}`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Generated");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // PROMPT GENERATOR
      if (selectedTool === TOOLS.PROMPT_GEN) {
        if (!promptIntent.trim()) {
          showToast("error", "Provide an intent for the prompt generator");
          setLoading(false);
          return;
        }
        const prompt = `Generate 3 high-quality prompts for the intent: "${promptIntent}". Tone: ${promptTone}. For each prompt include a 1-line note on usage.`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Generated");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // IMAGE CAPTION (multimodal)
      if (selectedTool === TOOLS.IMAGE_CAPTION) {
        if (!imageFile) {
          showToast("error", "Upload an image first");
          setLoading(false);
          return;
        }

        const { base64Data, mimeType } = await fileToBase64(imageFile);

        try {
          const caption = await generateCaption(base64Data, mimeType, promptIntent || "Generate three captions: one professional, one funny, and one short.");
          setResult(caption);
          showToast("success", "Generated captions");
        } catch (err) {
          setResult(`Error: ${err?.message || "Caption generation failed"}`);
          showToast("error", "Caption generation failed");
          console.error("Caption error:", err);
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // ----------------- NEW TOOL LOGIC (text-based) -----------------

      // EMAIL WRITER
      if (selectedTool === TOOLS.EMAIL_WRITER) {
        if (!promptIntent.trim()) {
          showToast("error", "Provide the email intent");
          setLoading(false);
          return;
        }
        const prompt = `Write a ${promptTone} email for the following intent:\n\n${promptIntent}\n\nInclude subject line and a short sign-off.`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Email generated");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // BLOG WRITER
      if (selectedTool === TOOLS.BLOG_WRITER) {
        if (!promptIntent.trim()) {
          showToast("error", "Provide a topic for the article");
          setLoading(false);
          return;
        }
        const prompt = `Write a detailed, SEO-optimized article about: "${promptIntent}". Include headings, subheadings, a short meta description (2 sentences) and suggested title.`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Article generated");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // PROOFREADER
      if (selectedTool === TOOLS.PROOFREADER) {
        if (!summarizerText.trim()) {
          showToast("error", "Provide text to proofread");
          setLoading(false);
          return;
        }
        const prompt = `Fix grammar, punctuation, clarity, and concision. Provide an improved version and list the top 3 suggestions made.\n\n${summarizerText}`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Proofread complete");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // TRANSLATOR
      if (selectedTool === TOOLS.TRANSLATOR) {
        if (!summarizerText.trim()) {
          showToast("error", "Provide text to translate");
          setLoading(false);
          return;
        }
        if (!promptTone.trim()) {
          showToast("error", "Select target language");
          setLoading(false);
          return;
        }
        const prompt = `Translate the following text into ${promptTone} while preserving meaning and tone. Provide translation only:\n\n${summarizerText}`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Translation complete");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // RESUME ANALYZER
      if (selectedTool === TOOLS.RESUME_ANALYZER) {
        if (!summarizerText.trim()) {
          showToast("error", "Paste resume or job description to analyze");
          setLoading(false);
          return;
        }
        const prompt = `You are an expert recruiter. Analyze the following resume/text and provide: 1) three strengths, 2) three weaknesses, 3) suggested improvements and a 1-line suggested job title.\n\n${summarizerText}`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Analysis complete");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // SEO KEYWORDS
      if (selectedTool === TOOLS.SEO_KEYWORDS) {
        if (!promptIntent.trim()) {
          showToast("error", "Provide a topic or URL");
          setLoading(false);
          return;
        }
        const prompt = `Generate 15 SEO keywords and 5 meta description suggestions for the topic: "${promptIntent}". Output as numbered list.`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Keywords generated");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // YOUTUBE SCRIPT
      if (selectedTool === TOOLS.YT_SCRIPT) {
        if (!promptIntent.trim()) {
          showToast("error", "Provide a video topic");
          setLoading(false);
          return;
        }
        const prompt = `Write a YouTube video script for topic: "${promptIntent}". Include: 1) Hook (15s), 2) Main sections, 3) Call-to-action, 4) Suggested thumbnail text. Aim for a ~6-8 minute script.`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Script generated");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // SOCIAL POST
      if (selectedTool === TOOLS.SOCIAL_POST) {
        if (!promptIntent.trim()) {
          showToast("error", "Provide the post intent");
          setLoading(false);
          return;
        }
        const prompt = `Generate 5 concise social media posts for intent: "${promptIntent}". Vary tone between catchy, informative, witty. Also include suggested hashtags (max 5).`;
        const body = buildTextBody(prompt);
        try {
          const text = await generateWithBody(body);
          setResult(text);
          showToast("success", "Posts generated");
        } catch (err) {
          setResult(String(err?.message || err));
          showToast("error", err?.message || "Generation failed");
        } finally {
          setLoading(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        }
        return;
      }

      // fallback
      setResult("Unsupported tool");
      setLoading(false);
    } catch (err) {
      console.error("Generation error", err);
      setResult(String(err?.message || err));
      showToast("error", err?.message || "Generation failed");
      setLoading(false);
    }
  }, [
    selectedTool,
    summarizerText,
    codeText,
    codeLang,
    promptIntent,
    promptTone,
    imageFile,
    buildTextBody,
    generateWithBody,
    generateCaption,
    temperature,
    maxTokens,
  ]);

  // ----------------- Image handlers -----------------
  const handleFileChange = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      showToast("error", "Please upload a valid image file (JPEG, PNG).");
      e.target.value = null;
      return;
    }
    setImageFile(f);
    setImagePreviewUrl(URL.createObjectURL(f));
    setResult("");
    showToast("success", `Image "${f.name}" loaded.`);
  }, []);

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setResult("");
    if (fileInputRef.current) fileInputRef.current.value = null;
    showToast("info", "Image cleared");
  }, []);

  // ----------------- Download / copy -----------------
  const handleDownload = useCallback(() => {
    if (!result) {
      showToast("error", "No output to download");
      return;
    }
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-output-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Downloaded");
  }, [result]);

  // ----------------- Labels -----------------
  const toolLabel = useMemo(() => {
    switch (selectedTool) {
      case TOOLS.SUMMARIZER:
        return "AI Text Summarizer";
      case TOOLS.CODE_EXPLAINER:
        return "AI Code Explainer";
      case TOOLS.PROMPT_GEN:
        return "AI Prompt Generator";
      case TOOLS.IMAGE_CAPTION:
        return "AI Image Caption Generator";
      case TOOLS.EMAIL_WRITER:
        return "AI Email Writer";
      case TOOLS.BLOG_WRITER:
        return "AI Blog / Article Generator";
      case TOOLS.PROOFREADER:
        return "AI Proofreader";
      case TOOLS.TRANSLATOR:
        return "AI Translator";
      case TOOLS.RESUME_ANALYZER:
        return "AI Resume Analyzer";
      case TOOLS.SEO_KEYWORDS:
        return "AI SEO Keyword Generator";
      case TOOLS.YT_SCRIPT:
        return "AI YouTube Script Creator";
      case TOOLS.SOCIAL_POST:
        return "AI Social Post Generator";
      default:
        return "AI Tool";
    }
  }, [selectedTool]);

  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      {/* Page header */}
      <header className="mb-6">
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">AI Tools</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Summarize • Explain code • More
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button className="cursor-pointer" variant="outline" onClick={() => setDialogOpen(true)}>
              <Sparkles className="w-4 h-4" />
              Notes
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Controls</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">
                  {selectedTool === TOOLS.IMAGE_CAPTION ? "Multimodal" : "Text"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select tool</Label>
                <Select
                  value={selectedTool}
                  onValueChange={(v) => {
                    setSelectedTool(v);
                    // keep some URL state consistent
                    updateURL("tool", v);
                  }}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value={TOOLS.SUMMARIZER}>
                      AI Text Summarizer
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.CODE_EXPLAINER}>
                      AI Code Explainer
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.PROMPT_GEN}>
                      AI Prompt Generator
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.IMAGE_CAPTION}>
                      AI Image Caption Generator
                    </SelectItem>

                    <Separator />

                    <SelectItem className="cursor-pointer" value={TOOLS.EMAIL_WRITER}>
                      AI Email Writer
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.BLOG_WRITER}>
                      AI Blog / Article Generator
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.PROOFREADER}>
                      AI Proofreader
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.TRANSLATOR}>
                      AI Translator
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.RESUME_ANALYZER}>
                      AI Resume Analyzer
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.SEO_KEYWORDS}>
                      AI SEO Keyword Generator
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.YT_SCRIPT}>
                      AI YouTube Script Creator
                    </SelectItem>
                    <SelectItem className="cursor-pointer" value={TOOLS.SOCIAL_POST}>
                      AI Social Post Generator
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                {/* dynamic controls */}
                {selectedTool === TOOLS.SUMMARIZER && (
                  <>
                    <Label className="text-xs">Text to summarize</Label>
                    <Textarea
                      value={summarizerText}
                      onChange={(e) => {
                        setSummarizerText(e.target.value);
                        updateURL("text", e.target.value);
                      }}
                      className="max-h-150 resize-none overflow-y-auto"
                    />
                  </>
                )}

                {selectedTool === TOOLS.CODE_EXPLAINER && (
                  <>
                    <Label className="text-xs">Language</Label>
                    <Select
                      value={codeLang}
                      onValueChange={(v) => {
                        setCodeLang(v);
                        updateURL("lang", v);
                      }}
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="javascript">
                          JavaScript
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="typescript">
                          TypeScript
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="python">
                          Python
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="java">
                          Java
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="csharp">
                          C#
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="cpp">
                          C++
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="go">
                          Go
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Label className="text-xs mt-3">Code</Label>
                    <Textarea
                      value={codeText}
                      onChange={(e) => {
                        setCodeText(e.target.value);
                        updateURL("code", e.target.value);
                      }}
                      className="max-h-150 resize-none overflow-y-auto font-mono"
                    />
                  </>
                )}

                {selectedTool === TOOLS.PROMPT_GEN && (
                  <>
                    <Label className="text-xs">Intent</Label>
                    <Input
                      value={promptIntent}
                      onChange={(e) => {
                        setPromptIntent(e.target.value);
                        updateURL("intent", e.target.value);
                      }}
                    />
                    <Label className="text-xs mt-3">Tone</Label>
                    <Select
                      value={promptTone}
                      onValueChange={(v) => {
                        setPromptTone(v);
                        updateURL("tone", v);
                      }}
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="professional">
                          Professional
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="casual">
                          Casual
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="creative">
                          Creative
                        </SelectItem>
                        <SelectItem className="cursor-pointer" value="concise">
                          Concise
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}

                {selectedTool === TOOLS.IMAGE_CAPTION && (
                  <>
                    <Label className="text-xs">Upload image</Label>
                    <div className="relative">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className={clsx(
                          "h-12 border-2 border-dashed cursor-pointer opacity-0",
                          "absolute inset-0 w-full h-full z-10",
                          imageFile ? "border-zinc-500/50" : "border-zinc-300 dark:border-zinc-700"
                        )}
                      />

                      <div
                        className={clsx(
                          "flex items-center justify-center h-12 w-full rounded-md border-2 border-dashed text-sm transition-colors",
                          imageFile ? "border-zinc-500/50 bg-zinc-100/40 dark:bg-zinc-800/40" : "border-zinc-300 dark:border-zinc-700"
                        )}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {imageFile ? imageFile.name : "Click or drag to upload an image"}
                      </div>
                    </div>

                    <Label className="text-xs mt-2">Image prompt (optional)</Label>
                    <Input
                      value={promptIntent}
                      onChange={(e) => {
                        setPromptIntent(e.target.value);
                        updateURL("prompt", e.target.value);
                      }}
                    />

                    {imageFile && (
                      <div className="flex gap-2 mt-2">
                        <Button onClick={clearImage} size="sm" className="flex-1 bg-red-600 hover:bg-red-500 cursor-pointer dark:text-white text-black">
                          Clear
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* New tools controls */}
                {selectedTool === TOOLS.EMAIL_WRITER && (
                  <>
                    <Label className="text-xs">Email Intent</Label>
                    <Input
                      value={promptIntent}
                      onChange={(e) => {
                        setPromptIntent(e.target.value);
                        updateURL("intent", e.target.value);
                      }}
                    />
                    <Label className="text-xs mt-3">Tone</Label>
                    <Select
                      value={promptTone}
                      onValueChange={(v) => {
                        setPromptTone(v);
                        updateURL("tone", v);
                      }}
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="apologetic">Apologetic</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}

                {selectedTool === TOOLS.BLOG_WRITER && (
                  <>
                    <Label className="text-xs">Article Topic</Label>
                    <Input
                      value={promptIntent}
                      onChange={(e) => {
                        setPromptIntent(e.target.value);
                        updateURL("intent", e.target.value);
                      }}
                    />
                  </>
                )}

                {selectedTool === TOOLS.PROOFREADER && (
                  <>
                    <Label className="text-xs">Text to proofread</Label>
                    <Textarea
                      value={summarizerText}
                      onChange={(e) => {
                        setSummarizerText(e.target.value);
                        updateURL("text", e.target.value);
                      }}
                      className="max-h-150 resize-none overflow-y-auto"
                    />
                  </>
                )}

                {selectedTool === TOOLS.TRANSLATOR && (
                  <>
                    <Label className="text-xs">Text to translate</Label>
                    <Textarea
                      value={summarizerText}
                      onChange={(e) => {
                        setSummarizerText(e.target.value);
                        updateURL("text", e.target.value);
                      }}
                      className="max-h-150 resize-none overflow-y-auto"
                    />
                    <Label className="text-xs mt-3">Target language</Label>
                    <Select
                      value={promptTone}
                      onValueChange={(v) => {
                        setPromptTone(v);
                        updateURL("tone", v);
                      }}
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="telugu">Telugu</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                        <SelectItem value="tamil">Tamil</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}

                {selectedTool === TOOLS.RESUME_ANALYZER && (
                  <>
                    <Label className="text-xs">Resume / JD text</Label>
                    <Textarea
                      value={summarizerText}
                      onChange={(e) => {
                        setSummarizerText(e.target.value);
                        updateURL("text", e.target.value);
                      }}
                      className="max-h-150 resize-none overflow-y-auto"
                    />
                  </>
                )}

                {selectedTool === TOOLS.SEO_KEYWORDS && (
                  <>
                    <Label className="text-xs">Topic / URL</Label>
                    <Input
                      value={promptIntent}
                      onChange={(e) => {
                        setPromptIntent(e.target.value);
                        updateURL("intent", e.target.value);
                      }}
                    />
                  </>
                )}

                {selectedTool === TOOLS.YT_SCRIPT && (
                  <>
                    <Label className="text-xs">Video topic</Label>
                    <Input
                      value={promptIntent}
                      onChange={(e) => {
                        setPromptIntent(e.target.value);
                        updateURL("intent", e.target.value);
                      }}
                    />
                  </>
                )}

                {selectedTool === TOOLS.SOCIAL_POST && (
                  <>
                    <Label className="text-xs">Post intent</Label>
                    <Input
                      value={promptIntent}
                      onChange={(e) => {
                        setPromptIntent(e.target.value);
                        updateURL("intent", e.target.value);
                      }}
                    />
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  {/* Temperature */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Temperature</span>
                    <span className="text-xs font-medium">{temperature.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[temperature]}
                    onValueChange={(v) => {
                      const t = Number(v[0]);
                      setTemperature(t);
                      updateURL("temp", t);
                    }}
                    min={0}
                    max={1}
                    step={0.01}
                    className="cursor-pointer"
                  />

                  {/* Max Tokens */}
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-xs">Max tokens</span>
                    <span className="text-xs font-medium">{maxTokens}</span>
                  </div>
                  <Slider
                    value={[maxTokens]}
                    onValueChange={(v) => {
                      const t = Number(v[0]);
                      setMaxTokens(t);
                      updateURL("tokens", t);
                    }}
                    min={64}
                    max={2048}
                    step={8}
                    className="cursor-pointer"
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button className="flex-1 cursor-pointer" onClick={handleGenerate} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Generate
                  </Button>
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => {
                      setResult("");
                      setFinishReason(null);
                      setUsageInfo(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground mt-2">This mode waits for a final response for more reliable multimodal output.</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center column: Output + Preview */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">{toolLabel}</CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => copyToClipboard(result)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  className="cursor-pointer"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setResult("");
                    showToast("success", "Cleared");
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-900/50 min-h-[260px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="animate-spin w-10 h-10 text-slate-500" />
                    <div className="text-sm text-muted-foreground mt-3">Generating…</div>
                  </div>
                ) : result ? (
                  <div ref={resultRef} data-color-mode={isDark ? "dark" : "light"} className="prose max-w-none">
                    <MDEditor.Markdown source={result} className="bg-transparent sm:text-base  overflow-y-auto h-150 no-scrollbar" />
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
                    <div className="text-base font-medium">No output yet</div>
                    <div>Use the controls on the left to pick a tool and generate results. Results will render here using markdown formatting.</div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Tip: Use "Regenerate" to get another variation.</div>
                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={handleGenerate}>
                    <Zap className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image preview (when selected) */}
          {selectedTool === TOOLS.IMAGE_CAPTION && (
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Image Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 border rounded p-4 flex items-center justify-center min-h-[220px] bg-white/50 dark:bg-zinc-900/50">
                    {imagePreviewUrl ? <img src={imagePreviewUrl} alt="Preview" className="max-h-[320px] object-contain" /> : <div className="text-sm text-muted-foreground">Upload an image to preview here.</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Right column: Debug / Details (sticky) */}
        <aside className="lg:col-span-3">
          <div className=" space-y-4">
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
                    <span className="text-xs text-muted-foreground">Model</span>
                    <span className="font-medium">gemini-2.5-flash</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Temperature</span>
                    <span className="font-medium">{temperature.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Max tokens</span>
                    <span className="font-medium">{maxTokens}</span>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2">
                    <strong className="text-xs">Finish reason:</strong>
                    <span className="opacity-80 text-sm">{finishReason ?? "—"}</span>
                    {finishReason === "MAX_TOKENS" && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 ml-2">
                        <AlertCircle className="w-4 h-4" />
                        Truncated — increase tokens
                      </div>
                    )}
                  </div>

                  {usageInfo && (
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground">Usage</div>
                      <div className="text-xs mt-1">
                        <div>Prompt tokens: {usageInfo.promptTokenCount ?? "—"}</div>
                        <div>Total tokens: {usageInfo.totalTokenCount ?? "—"}</div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    If you get no output: 1) check API key; 2) shorten prompts or increase max tokens; 3) for images, ensure MIME supported and size small enough.
                    Proxy requests in production to hide key.
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
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setResult(""); setFinishReason(null); setUsageInfo(null); }}>
                    Clear output
                  </Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(result || "")}>
                    Copy output
                  </Button>
                  <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                    Integration notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      {/* integration dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Integration Notes</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              This page uses the Gemini REST endpoint and waits for the final response to extract generated text. For image captioning we send inlineData
              (base64) with a short text instruction. If responses are truncated (finishReason === 'MAX_TOKENS'), increase the max tokens or shorten prompts. For production,
              proxy requests via a backend to protect the API key.
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
