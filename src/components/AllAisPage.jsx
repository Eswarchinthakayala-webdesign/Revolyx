// src/pages/AllAisPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  BookText,
  Music2,
  Film,
  Code2,
  BrainCircuit,
  Database, // Main Icon for AI
  Search,
  Menu,
  RefreshCw,
  ExternalLink,
  Copy,
  Download,
  List,
  X,
  Check,
  Layers,
  Star,
  Cpu,
  Coins,
  Wallet,
  CheckCheck,
  FileText,
  Zap, // For speed/fast AI
  Lightbulb,
  MessageSquare,
  Video,
  Mic,
  Music,
  Code,
  Bot,
  BookOpen,
  Presentation,
  Briefcase,
  Phone,
  PenTool,
  Cuboid,
  Server,
  Image,
  Brain,
  SearchCheck,
  Edit3,
  Puzzle,
  Coffee,
  CalendarCheck,
  Headset,
  BookOpenCheck, // For General AI
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- Category definitions + icons ---------- */
const CATEGORIES = [
 { id: "image-gen", label: "Image Generation", Icon: Palette },
 { id: "chat", label: "Companion Chatbots", Icon: MessageSquare },
 { id: "video", label: "Video Generation", Icon: Video },
 { id: "audio", label: "Audio Generation & Tools", Icon: Mic },
 { id: "music", label: "Music Creation", Icon: Music },
 { id: "engineering", label: "Software Engineering Tools", Icon: Code2 },
 { id: "software-models", label: "Models for Software Engineering", Icon: Code },
 { id: "agents", label: "Agents & Automation", Icon: Bot },
 { id: "research", label: "Research Tools", Icon: BookOpen },
 { id: "design", label: "Presentation & Design", Icon: Presentation },
 { id: "business", label: "Business & Automation Tools", Icon: Briefcase },
 { id: "caller", label: "Automated Caller", Icon: Phone },
 { id: "photo", label: "Photo Editing", Icon: Image },
 { id: "writing", label: "Writing", Icon: PenTool },
 { id: "3d", label: "3D Models & Textures", Icon: Cuboid },
 { id: "local", label: "Run Models Locally", Icon: Server },
 { id: "models", label: "AI Models", Icon: Brain },
 { id: "search", label: "AI Search Engines", Icon: SearchCheck },
 { id: "local_search", label: "Local Search Engines", Icon: Search },
 { id: "AI writing", label: "AI Writing Assistants", Icon: Edit3 },
 { id: "chatgpt-extensions", label: "ChatGPT Extensions", Icon: Puzzle },
 { id: "productivity", label: "Productivity Tools", Icon: Coffee },
 { id: "meeting", label: "Meeting Assistants", Icon: CalendarCheck },
 { id: "academia", label: "Academia & Research Tools", Icon: BookOpenCheck },
{ id: "customerSupport", label: "Customer Support AI", Icon: Headset }








];

/* ---------- Sample AI data ---------- */
const SAMPLE_AIS = {


  academia: [
  {
    name: "Elicit",
    description:
      "Automate research workflows and literature reviews using advanced language models, saving time on academic tasks.",
    website: "https://elicit.org/",
    pricing: "Free / Paid",
    tags: ["research", "literature review", "academic", "AI-assistant"],
    featured: true,
  },
  {
    name: "genei",
    description:
      "Summarize academic articles in seconds and reduce research time by up to 80%, powered by AI.",
    website: "https://www.genei.io/",
    pricing: "Paid",
    tags: ["research", "summary", "academic", "AI-assistant"],
    featured: true,
  },
  {
    name: "Explainpaper",
    description:
      "Upload academic papers, highlight confusing text, and get AI-generated explanations for better comprehension.",
    website: "https://www.explainpaper.com/",
    pricing: "Freemium",
    tags: ["academic", "explanation", "research", "AI-assistant"],
    featured: false,
  },
  {
    name: "Galactica",
    description:
      "Large language model for science: summarize literature, solve math problems, write scientific code, annotate molecules, and more.",
    website: "https://galactica.org/",
    pricing: "Open-source / API",
    tags: ["research", "scientific", "coding", "AI-model", "papers"],
    featured: false,
  },
  {
    name: "Consensus",
    description:
      "AI-powered search engine to find evidence-based answers from scientific research.",
    website: "https://consensus.app/search/",
    pricing: "Free / Paid",
    tags: ["research", "search", "scientific", "AI-assistant"],
    featured: true,
  },
  {
    name: "Sourcely",
    description:
      "AI-driven academic citation finder to streamline your research and bibliography creation.",
    website: "https://www.sourcely.net/",
    pricing: "Paid",
    tags: ["academic", "citation", "research", "AI-assistant"],
    featured: false,
  },
  {
    name: "SciSpace",
    description:
      "Chat with AI on scientific PDFs, summarize content, and extract key insights effortlessly.",
    website: "https://scispace.com/",
    pricing: "Freemium",
    tags: ["research", "PDF", "academic", "AI-chat"],
    featured: true,
  },
  {
    name: "NotebookLM",
    description:
      "AI chat assistant for your documents, links, and text resources to boost learning and research productivity.",
    website: "https://notebooklm.google.com/",
    pricing: "Free / Paid",
    tags: ["academic", "research", "document", "AI-assistant"],
    featured: false,
  },
  {
    name: "Mathos AI",
    description:
      "AI-powered math solver, calculator, and tutor for academic learning and problem solving.",
    website: "https://www.mathgptpro.com/",
    pricing: "Paid",
    tags: ["math", "academic", "solver", "AI-tutor"],
    featured: true,
  },
],

customerSupport: [
  {
    name: "SiteGPT",
    description:
      "Turn AI into your expert customer support agent, handling queries, FAQs, and user interactions.",
    website: "https://sitegpt.ai/?ref=mahseema-awesome-ai-tools",
    pricing: "Paid",
    tags: ["customer support", "AI-assistant", "chatbot", "automation"],
    featured: true,
  },
  {
    name: "GPTHelp.ai",
    description:
      "Deploy ChatGPT as an AI-powered support chatbot on your website for real-time assistance.",
    website: "https://gpthelp.ai/?ref=mahseema-awesome-ai-tools",
    pricing: "Paid",
    tags: ["customer support", "AI-chatbot", "website", "automation"],
    featured: true,
  },
  {
    name: "SiteSpeakAI",
    description:
      "Automate customer support with AI-powered responses and improved user experience.",
    website: "https://sitespeak.ai",
    pricing: "Paid",
    tags: ["customer support", "AI-assistant", "automation"],
    featured: false,
  },
  {
    name: "Dear AI",
    description:
      "Supercharge customer services and boost sales with AI chat, providing fast and accurate responses.",
    website: "https://www.dearai.online",
    pricing: "Paid",
    tags: ["customer support", "AI-chatbot", "sales", "automation"],
    featured: false,
  },
  {
    name: "Inline Help",
    description:
      "Answer customer questions proactively before they ask, using AI-powered support snippets.",
    website: "https://inlinehelp.com",
    pricing: "Freemium",
    tags: ["customer support", "AI-assistant", "automation"],
    featured: false,
  },
  {
    name: "Aidbase",
    description:
      "AI-powered support specifically for SaaS startups, providing efficient issue resolution.",
    website: "https://www.aidbase.ai",
    pricing: "Paid",
    tags: ["customer support", "AI-assistant", "SaaS", "automation"],
    featured: false,
  },
  {
    name: "Twig",
    description:
      "AI assistant resolving customer issues instantly, supporting users and support agents 24/7.",
    website: "https://www.twig.so",
    pricing: "Paid",
    tags: ["customer support", "AI-assistant", "automation", "24/7"],
    featured: true,
  },
]
,



  meeting: [
  {
    name: "Otter.ai",
    description:
      "AI-powered meeting assistant that records audio, transcribes conversations, captures slides, and generates concise summaries for effortless follow-ups.",
    website: "https://otter.ai/",
    pricing: "Freemium",
    tags: ["meeting", "transcription", "notes", "summaries", "collaboration"],
    featured: true,
  },
  {
    name: "Cogram",
    description:
      "Automates note-taking during virtual meetings and highlights key action items, helping teams stay organized and aligned.",
    website: "https://www.cogram.com/",
    pricing: "Paid",
    tags: ["meeting", "notes", "action-items", "productivity", "AI"],
    featured: false,
  },
  {
    name: "Sybill",
    description:
      "Generates smart summaries of sales calls by analyzing transcripts and emotional cues, highlighting pain points, next steps, and key insights.",
    website: "https://www.sybill.ai/",
    pricing: "Paid",
    tags: ["meeting", "sales", "summaries", "analytics", "AI"],
    featured: true,
  },
  {
    name: "Loopin AI",
    description:
      "Collaborative AI workspace for meetings: record, transcribe, summarize, and automatically organize notes within your calendar for easy tracking.",
    website: "https://www.loopinhq.com/",
    pricing: "Freemium",
    tags: ["meeting", "collaboration", "notes", "summaries", "calendar-integration"],
    featured: true,
  },
  {
    name: "Scribbl",
    description:
      "Quick AI meeting notes tool that generates concise summaries to help teams stay on top of discussions and decisions.",
    website: "https://www.scribbl.co/",
    pricing: "Free",
    tags: ["meeting", "notes", "AI", "summaries", "productivity"],
    featured: false,
  },
]
,

  productivity: [
  {
    name: "Mem",
    description: "AI-powered personal workspace that automates organization, boosts creativity, and keeps notes and tasks synchronized.",
    website: "https://mem.ai/",
    pricing: "Freemium",
    tags: ["workspace", "notes", "ai-assistant", "productivity", "organization"],
    featured: true,
  },
  {
    name: "Taskade",
    description: "Collaborative workspace with AI agents to manage tasks, projects, and workflows, supporting team productivity and automation.",
    website: "https://www.taskade.com/",
    pricing: "Freemium",
    tags: ["tasks", "collaboration", "ai-agent", "workflow", "productivity"],
    featured: true,
  },
  {
    name: "Notion AI",
    description: "Enhanced note-taking and documentation with AI assistance for writing, summarizing, and organizing content efficiently.",
    website: "https://www.notion.so/product/ai",
    pricing: "Freemium",
    tags: ["notes", "ai-writing", "documentation", "organization"],
    featured: true,
  },
  {
    name: "Nekton AI",
    description: "Automate and streamline workflows by describing processes in natural language; AI executes and optimizes them.",
    website: "https://nekton.ai",
    pricing: "Paid",
    tags: ["workflow", "automation", "ai-assistant", "productivity"],
    featured: false,
  },
  {
    name: "Elephas",
    description: "Personal AI writing assistant for Mac to enhance creativity, compose content, and speed up writing tasks.",
    website: "https://elephas.app/?ref=mahseema-awesome-ai-tools",
    pricing: "Paid",
    tags: ["writing", "ai-assistant", "mac", "productivity"],
    featured: false,
  },
  {
    name: "Lemmy",
    description: "Autonomous AI assistant designed to help you manage tasks, emails, and workflows efficiently.",
    website: "https://lemmy.co/?ref=mahseema-awesome-ai-tools",
    pricing: "Freemium",
    tags: ["ai-assistant", "automation", "tasks", "productivity"],
    featured: false,
  },
  {
    name: "Google Sheets Formula Generator",
    description: "AI-powered formula generator to quickly create and troubleshoot complex Google Sheets formulas without errors.",
    website: "https://bettersheets.co/google-sheets-formula-generator?ref=mahseema-awesome-ai-tools",
    pricing: "Free",
    tags: ["spreadsheets", "formulas", "automation", "productivity"],
    featured: false,
  },
  {
    name: "CreateEasily",
    description: "Free speech-to-text AI tool for content creators, accurately transcribing audio and video files up to 2GB.",
    website: "https://createeasily.com/?ref=mahseema-awesome-ai-tools",
    pricing: "Free",
    tags: ["speech-to-text", "transcription", "ai-tools", "content-creation"],
    featured: false,
  },
  {
    name: "Cosmos",
    description: "Offline AI-powered media search tool to find images, video scenes, and transcribe media locally on your device.",
    website: "https://meetcosmos.com/",
    pricing: "Paid",
    tags: ["media", "offline", "search", "ai-tools"],
    featured: false,
  },
  {
    name: "aiPDF",
    description: "Advanced AI document assistant to read, summarize, and interact with PDF files efficiently.",
    website: "https://aipdf.ai",
    pricing: "Paid",
    tags: ["pdf", "ai-assistant", "document", "productivity"],
    featured: true,
  },
  {
    name: "Summary With AI",
    description: "Summarizes long PDF documents comprehensively, extracting key insights from all pages.",
    website: "https://www.summarywithai.com/",
    pricing: "Free",
    tags: ["pdf", "summarization", "ai-tools", "productivity"],
    featured: false,
  },
  {
    name: "Emilio",
    description: "AI email assistant that prioritizes, automates, and organizes emails, saving up to 60% of your time.",
    website: "https://getemil.io?ref=mahseema-awesome-ai-tools",
    pricing: "Paid",
    tags: ["email", "ai-assistant", "automation", "productivity"],
    featured: true,
  },
  {
    name: "Pieces",
    description: "On-device AI copilot for developers to capture, enrich, and reuse materials, streamline collaboration, and solve complex problems contextually.",
    website: "https://pieces.app/",
    pricing: "Paid",
    tags: ["developer", "ai-copilot", "productivity", "collaboration"],
    featured: true,
  },
  {
    name: "Huntr AI Resume Builder",
    description: "AI-powered tool to craft professional, ATS-friendly resumes to help you land interviews faster.",
    website: "https://huntr.co/product/ai-resume-builder/?ref=mahseema-awesome-ai-tools",
    pricing: "Freemium",
    tags: ["resume", "ai-writing", "career", "productivity"],
    featured: false,
  },
  {
    name: "Chat With PDF by Copilot.us",
    description: "Interact with multiple PDF files through AI-driven dialogue for efficient document understanding.",
    website: "https://copilot.us/apps/chat-with-pdf",
    pricing: "Paid",
    tags: ["pdf", "ai-chat", "document", "productivity"],
    featured: false,
  },
  {
    name: "Recall",
    description: "AI tool to summarize any content and retain knowledge so you forget nothing.",
    website: "https://www.getrecall.ai/",
    pricing: "Free",
    tags: ["summarization", "knowledge", "ai-tools", "productivity"],
    featured: false,
  },
  {
    name: "Talently AI",
    description: "AI interviewer conducting live, conversational interviews and delivering real-time evaluations for recruitment efficiency.",
    website: "https://interview.talently.ai/?utm_source=mahseema-awesome-ai-tool&utm_medium=c_and_p&utm_campaign=tool-listing",
    pricing: "Paid",
    tags: ["ai-interviewer", "recruitment", "evaluation", "productivity"],
    featured: false,
  },
  {
    name: "TailorTask",
    description: "Automate repetitive tasks effortlessly using AI, without learning new tools.",
    website: "https://wwww.tailortask.ai",
    pricing: "Free",
    tags: ["automation", "ai-tools", "tasks", "productivity"],
    featured: false,
  },
  {
    name: "AnkiDecks AI",
    description: "Generate Anki flashcards from any file or text 10x faster using AI-assisted learning tools.",
    website: "https://anki-decks.com",
    pricing: "Freemium",
    tags: ["flashcards", "ai-learning", "productivity", "education"],
    featured: false,
  },
  {
    name: "AI for Google Slides",
    description: "AI presentation maker to quickly create slides in Google Slides with content suggestions and designs.",
    website: "https://www.aiforgoogleslides.com/",
    pricing: "Paid",
    tags: ["presentation", "google-slides", "ai-tools", "productivity"],
    featured: false,
  },
  {
    name: "FARSITE",
    description: "AI-powered compliance software for U.S. government contractors to simplify regulations and reporting.",
    website: "https://far.site/",
    pricing: "Paid",
    tags: ["compliance", "ai-tools", "automation", "productivity"],
    featured: false,
  },
  {
    name: "GOSH",
    description: "AI price tracker to monitor product prices across stores automatically.",
    website: "https://gosh.app",
    pricing: "Free",
    tags: ["price-tracking", "automation", "ai-tools", "productivity"],
    featured: false,
  },
  {
    name: "BrainSoup",
    description: "Multi-agent AI client that remembers, reacts, uses tools, and collaborates autonomously for complex workflows.",
    website: "https://www.nurgo-software.com/products/brainsoup",
    pricing: "Paid",
    tags: ["multi-agent", "workflow", "ai-tools", "productivity"],
    featured: false,
  },
  {
    name: "MindPal",
    description: "Build an AI second brain with multi-agent workflows and collaborative intelligence.",
    website: "https://mindpal.space/",
    pricing: "Paid",
    tags: ["ai-brain", "multi-agent", "productivity", "collaboration"],
    featured: false,
  },
  {
    name: "fabric",
    description: "Apply AI to everyday terminal tasks using prebuilt prompt patterns for better results.",
    website: "https://github.com/danielmiessler/fabric/",
    pricing: "Free",
    tags: ["terminal", "ai-tools", "automation", "productivity"],
    featured: false,
  },
  {
    name: "Riffo",
    description: "AI-powered file management tool for bulk renaming and automatic folder organization.",
    website: "https://riffo.ai/",
    pricing: "Paid",
    tags: ["file-management", "ai-tools", "automation", "productivity"],
    featured: false,
  },
  {
    name: "SlidesWizard",
    description: "AI-powered tool to generate Google Slides and PowerPoint presentations quickly for any topic.",
    website: "https://slideswizard.io",
    pricing: "Paid",
    tags: ["presentation", "ai-tools", "automation", "productivity"],
    featured: false,
  },
  {
    name: "Transgate",
    description: "AI-powered speech-to-text tool for fast, accurate transcription.",
    website: "https://transgate.ai",
    pricing: "Paid",
    tags: ["speech-to-text", "transcription", "ai-tools", "productivity"],
    featured: false,
  },
  {
    name: "RabbitHoles AI",
    description: "Interactive infinite canvas to chat and explore ideas with AI visually.",
    website: "https://www.rabbitholes.ai/",
    pricing: "Paid",
    tags: ["visualization", "ai-chat", "creativity", "productivity"],
    featured: false,
  },
  {
    name: "Rember",
    description: "Spaced repetition system powered by AI to help you remember more efficiently.",
    website: "https://www.rember.com/",
    pricing: "Free",
    tags: ["learning", "ai-tools", "memory", "productivity"],
    featured: false,
  },
  {
    name: "Qurate",
    description: "AI companion that suggests contextually relevant quotes for writing and inspiration.",
    website: "https://qurate.appcradle.net/",
    pricing: "Free",
    tags: ["quotes", "ai-assistant", "writing", "productivity"],
    featured: false,
  },
  {
    name: "FirmOS",
    description: "AI-powered automation platform for accounting firms to optimize workflows.",
    website: "https://www.firmos.ai/",
    pricing: "Paid",
    tags: ["automation", "accounting", "ai-tools", "productivity"],
    featured: false,
  },
  {
    name: "Whisper API",
    description: "AI transcription API powered by OpenAI Whisper model, supporting robust control over model parameters.",
    website: "https://whisper-api.com",
    pricing: "Freemium",
    tags: ["speech-to-text", "api", "transcription", "ai-tools"],
    featured: false,
  },
  {
    name: "Smmry",
    description: "Summarize long content into concise, actionable insights using AI.",
    website: "https://smmry.com/",
    pricing: "Free",
    tags: ["summarization", "ai-tools", "productivity", "reading"],
    featured: false,
  },
  {
    name: "Nudge AI",
    description: "Ambient AI scribe for healthcare professionals, recording and summarizing interactions efficiently.",
    website: "https://getnudgeai.com/",
    pricing: "Paid",
    tags: ["healthcare", "ai-assistant", "transcription", "productivity"],
    featured: false,
  },
  {
    name: "Summara",
    description: "YouTube AI summary and transcript widget to extract video insights quickly.",
    website: "https://summara.io/",
    pricing: "Free",
    tags: ["video", "summarization", "ai-tools", "productivity"],
    featured: false,
  },
  {
    name: "Mocha",
    description: "AI app builder to create custom applications with minimal effort.",
    website: "https://getmocha.com/",
    pricing: "Paid",
    tags: ["app-builder", "ai-tools", "automation", "productivity"],
    featured: false,
  },
  {
    name: "Marblism",
    description: "AI-powered virtual employees for automating business tasks and workflows.",
    website: "https://marblism.com/",
    pricing: "Paid",
    tags: ["automation", "ai-employees", "business", "productivity"],
    featured: false,
  },
  {
    name: "Spell",
    description: "AI-powered writing platform as an alternative to Google Docs for efficient content creation.",
    website: "https://spellapp.com/",
    pricing: "Paid",
    tags: ["writing", "ai-tools", "productivity", "documents"],
    featured: false,
  },
  {
    name: "Kosmik",
    description: "AI moodboarding platform to quickly visualize ideas, designs, and inspiration.",
    website: "https://www.kosmik.app/",
    pricing: "Paid",
    tags: ["design", "moodboard", "ai-tools", "creativity", "productivity"],
    featured: false,
  },
  {
    name: "Magic Potion",
    description: "Visual AI prompt editor to generate creative outputs quickly.",
    website: "https://www.magicpotion.app/",
    pricing: "Paid",
    tags: ["ai-tools", "creativity", "prompting", "visual"],
    featured: false,
  },
  {
    name: "MinusX",
    description: "AI analyst for Metabase to answer data questions, generate insights, and provide reliable analytics.",
    website: "https://minusx.ai/",
    pricing: "Paid",
    tags: ["data-analysis", "ai-tools", "analytics", "productivity"],
    featured: false,
  },
  {
    name: "Excelmatic",
    description: "AI-powered Excel assistant that converts uploaded data into charts, insights, and visualizations automatically.",
    website: "https://excelmatic.ai/",
    pricing: "Paid",
    tags: ["excel", "data-analysis", "ai-tools", "productivity"],
    featured: false,
  },
  {
    name: "Langfa.st",
    description: "Fast, no-signup playground for testing and sharing AI prompt templates instantly.",
    website: "https://langfa.st/",
    pricing: "Free",
    tags: ["ai-tools", "prompting", "productivity", "testing"],
    featured: false,
  },
  {
    name: "SalesAgent Chat",
    description: "AI sales coach and copilot providing real-time guidance to improve sales performance.",
    website: "https://www.salesagent.chat/",
    pricing: "Paid",
    tags: ["sales", "ai-assistant", "productivity", "automation"],
    featured: false,
  },
  {
    name: "ReBillion.ai",
    description: "AI-powered workflow automation platform for real estate transactions and coordination.",
    website: "https://tc.rebillion.ai/",
    pricing: "Paid",
    tags: ["real-estate", "workflow", "ai-tools", "automation"],
    featured: false,
  },
  {
    name: "Perch Reader",
    description: "AI-enabled aggregator for blogs and newsletters with summaries and text-to-speech features.",
    website: "https://perch.app/",
    pricing: "Free",
    tags: ["reading", "summarization", "ai-tools", "productivity"],
    featured: false,
  },
  {
    name: "X-doc AI",
    description: "Accurate AI translator supporting multiple languages for documents and text.",
    website: "https://x-doc.ai/",
    pricing: "Paid",
    tags: ["translation", "ai-tools", "productivity", "documents"],
    featured: false,
  }
]
,

 "chatgpt-extensions": [
  {
    name: "Gist AI",
    description: "ChatGPT-powered free summarizer for websites, YouTube videos, and PDFs.",
    website: "https://www.gistai.tech?utm_source=tool_directory&utm_medium=post&utm_campaign=launch",
    pricing: "Free",
    tags: ["summarizer", "web", "youtube", "pdf", "productivity"],
    featured: true,
  },
  {
    name: "WebChatGPT",
    description: "Enhance your ChatGPT prompts with live web search results for up-to-date answers.",
    website: "https://chrome.google.com/webstore/detail/webchatgpt-chatgpt-with-i/lpfemeioodjbpieminkklglpmhlngfcn",
    pricing: "Free",
    tags: ["search", "chatgpt", "extension", "productivity", "web"],
    featured: true,
  },
  {
    name: "GPT for Sheets and Docs",
    description: "Integrate ChatGPT directly into Google Sheets and Docs to automate text, formulas, and data tasks.",
    website: "https://workspace.google.com/marketplace/app/gpt_for_sheets_and_docs/677318054654",
    pricing: "Freemium",
    tags: ["google sheets", "google docs", "automation", "productivity"],
    featured: true,
  },
  {
    name: "YouTube Summary with ChatGPT",
    description: "Summarize YouTube videos quickly using ChatGPT for faster insights.",
    website: "https://chrome.google.com/webstore/detail/youtube-summary-with-chat/nmmicjeknamkfloonkhhcjmomieiodli",
    pricing: "Free",
    tags: ["youtube", "summarizer", "chatgpt", "productivity"],
    featured: false,
  },
  {
    name: "ChatGPT Prompt Genius",
    description: "Discover, share, and import the best prompts for ChatGPT; save your chat history locally.",
    website: "https://chrome.google.com/webstore/detail/chatgpt-prompt-genius/jjdnakkfjnnbbckhifcfchagnpofjffo",
    pricing: "Free",
    tags: ["prompts", "chatgpt", "productivity", "history", "tool"],
    featured: true,
  },
  {
    name: "ChatGPT for Search Engines",
    description: "Displays ChatGPT responses alongside Google, Bing, and DuckDuckGo search results.",
    website: "https://chrome.google.com/webstore/detail/chatgpt-for-search-engine/feeonheemodpkdckaljcjogdncpiiban",
    pricing: "Free",
    tags: ["search", "chatgpt", "browser extension", "productivity"],
    featured: true,
  },
  {
    name: "ShareGPT",
    description: "Easily share your ChatGPT conversations and explore shared conversations from the community.",
    website: "https://sharegpt.com/",
    pricing: "Free",
    tags: ["sharing", "chatgpt", "community", "productivity"],
    featured: false,
  },
  {
    name: "Merlin",
    description: "ChatGPT Plus extension available on all websites to enhance workflow with AI.",
    website: "https://merlin.foyer.work/",
    pricing: "Freemium",
    tags: ["chatgpt", "extension", "workflow", "ai"],
    featured: true,
  },
  {
    name: "ChatGPT Writer",
    description: "Generate full emails and messages effortlessly using ChatGPT AI.",
    website: "https://chatgptwriter.ai/",
    pricing: "Freemium",
    tags: ["email", "messaging", "chatgpt", "automation"],
    featured: true,
  },
  {
    name: "ChatGPT for Jupyter",
    description: "Add helper functions in Jupyter Notebook & Lab powered by ChatGPT for coding productivity.",
    website: "https://github.com/TiesdeKok/chat-gpt-jupyter-extension",
    pricing: "Free",
    tags: ["jupyter", "notebook", "coding", "chatgpt", "extension"],
    featured: false,
  },
  {
    name: "editGPT",
    description: "Proofread, edit, and track changes in your content using ChatGPT with ease.",
    website: "https://www.editgpt.app/",
    pricing: "Freemium",
    tags: ["editing", "proofreading", "chatgpt", "content"],
    featured: false,
  },
  {
    name: "Chatbot UI",
    description: "Open-source UI for ChatGPT, allowing customizable chat experiences. [Source code](https://github.com/mckaywrigley/chatbot-ui)",
    website: "https://www.chatbotui.com/",
    pricing: "Free",
    tags: ["chatgpt", "open-source", "ui", "customizable"],
    featured: false,
  },
  {
    name: "Forefront",
    description: "A better ChatGPT experience with improved interface and enhanced productivity tools.",
    website: "https://www.forefront.ai/",
    pricing: "Freemium",
    tags: ["chatgpt", "interface", "productivity", "ai"],
    featured: false,
  },
  {
    name: "AI Character for GPT",
    description: "One-click tool to create custom AI characters for ChatGPT or Google Bard to improve responses.",
    website: "https://chromewebstore.google.com/detail/ai-character-for-gpt/daoeioifimkjegafelcaljboknjkkohh",
    pricing: "Free",
    tags: ["chatgpt", "bard", "ai character", "customization", "extension"],
    featured: false,
  },
]
,

  "AI writing": [
  {
    name: "Jasper",
    description: "Create high-quality content faster with AI-powered assistance for blogs, social media, and marketing.",
    website: "https://www.jasper.ai/",
    pricing: "Paid",
    tags: ["writing", "content", "marketing", "ai"],
    featured: true,
  },
  {
    name: "Compose AI",
    description: "Free Chrome extension that cuts your writing time by 40% using AI-powered autocompletion.",
    website: "https://www.compose.ai/",
    pricing: "Free",
    tags: ["writing", "autocompletion", "productivity", "ai"],
    featured: true,
  },
  {
    name: "Rytr",
    description: "AI writing assistant to generate high-quality content for blogs, emails, ads, and more.",
    website: "https://rytr.me/",
    pricing: "Freemium",
    tags: ["writing", "content", "ai", "productivity"],
    featured: true,
  },
  {
    name: "Wordtune",
    description: "Personal AI writing assistant that helps refine, rephrase, and enhance your writing.",
    website: "https://www.wordtune.com/",
    pricing: "Freemium",
    tags: ["writing", "rephrase", "ai", "personal-assistant"],
    featured: false,
  },
  {
    name: "HyperWrite",
    description: "Write with confidence using AI that guides you from ideation to final draft faster.",
    website: "https://hyperwriteai.com/",
    pricing: "Paid",
    tags: ["writing", "ai", "productivity", "drafting"],
    featured: false,
  },
  {
    name: "Nexus AI",
    description: "Generative AI platform for writing, coding, voiceovers, research, image creation, and more.",
    website: "https://mynexusai.com/",
    pricing: "Freemium",
    tags: ["writing", "ai", "multimodal", "research", "creativity"],
    featured: false,
  },
  {
    name: "Moonbeam",
    description: "Write better blogs in a fraction of the time using AI-assisted content creation tools.",
    website: "https://www.gomoonbeam.com/",
    pricing: "Paid",
    tags: ["writing", "blogs", "ai", "content"],
    featured: false,
  },
  {
    name: "Copy.ai",
    description: "AI platform to generate marketing copy and content effortlessly with creativity and speed.",
    website: "https://www.copy.ai/",
    pricing: "Freemium",
    tags: ["writing", "marketing", "content", "ai"],
    featured: true,
  },
  {
    name: "Anyword",
    description: "AI-powered assistant to generate high-performing copy for marketing, social media, and ads.",
    website: "https://anyword.com/",
    pricing: "Paid",
    tags: ["writing", "marketing", "ai", "copywriting"],
    featured: false,
  },
  {
    name: "Contenda",
    description: "Create content your audience wants using AI that repurposes your existing material.",
    website: "https://contenda.co/",
    pricing: "Paid",
    tags: ["writing", "content", "ai", "repurposing"],
    featured: false,
  },
  {
    name: "Hypotenuse AI",
    description: "Transform a few keywords into original articles, product descriptions, or social media copy.",
    website: "https://www.hypotenuse.ai/",
    pricing: "Paid",
    tags: ["writing", "ai", "content", "articles", "ecommerce"],
    featured: false,
  },
  {
    name: "Lavender",
    description: "AI email assistant that improves communication and boosts response rates efficiently.",
    website: "https://www.lavender.ai/",
    pricing: "Freemium",
    tags: ["writing", "email", "ai", "productivity"],
    featured: false,
  },
  {
    name: "Lex",
    description: "AI-powered word processor designed to help you write faster and smarter.",
    website: "https://lex.page/",
    pricing: "Paid",
    tags: ["writing", "word-processor", "ai", "productivity"],
    featured: false,
  },
  {
    name: "Jenni",
    description: "AI writing assistant that saves hours on ideation and drafting for blogs and content.",
    website: "https://jenni.ai/",
    pricing: "Paid",
    tags: ["writing", "content", "ai", "blogging"],
    featured: false,
  },
  {
    name: "LAIKA",
    description: "Personalized AI writing partner trained on your own writing style for creative collaboration.",
    website: "https://www.writewithlaika.com/",
    pricing: "Paid",
    tags: ["writing", "ai", "personalized", "creative"],
    featured: false,
  },
  {
    name: "QuillBot",
    description: "AI-powered paraphrasing tool that helps improve clarity, style, and conciseness.",
    website: "https://quillbot.com/",
    pricing: "Freemium",
    tags: ["writing", "paraphrasing", "ai", "editing"],
    featured: false,
  },
  {
    name: "Postwise",
    description: "AI platform to draft, schedule, and auto-publish social media posts efficiently.",
    website: "https://postwise.ai/",
    pricing: "Paid",
    tags: ["writing", "social-media", "ai", "automation"],
    featured: false,
  },
  {
    name: "RapidTextAI",
    description: "AI content generator leveraging GPT-4, Gemini, DeepSeek, and Grok for advanced article creation.",
    website: "https://app.rapidtextai.com/",
    pricing: "Paid",
    tags: ["writing", "ai", "multi-model", "articles"],
    featured: false,
  },
  {
    name: "Copysmith",
    description: "Enterprise-grade AI content creation tool for marketing, e-commerce, and brand messaging.",
    website: "https://copysmith.ai/",
    pricing: "Paid",
    tags: ["writing", "enterprise", "marketing", "ai"],
    featured: false,
  },
  {
    name: "Yomu",
    description: "AI writing assistant specifically tailored for students and academic content.",
    website: "https://www.yomu.ai/",
    pricing: "Freemium",
    tags: ["writing", "academic", "ai", "students"],
    featured: false,
  },
  {
    name: "Listomatic",
    description: "Free AI-powered generator for real estate listing descriptions, fully configurable.",
    website: "https://listomatic.app/",
    pricing: "Free",
    tags: ["writing", "real-estate", "ai", "content"],
    featured: false,
  },
  {
    name: "Quick Creator",
    description: "SEO-optimized blog platform powered by AI to generate content quickly and effectively.",
    website: "https://quickcreator.io/",
    pricing: "Paid",
    tags: ["writing", "blogs", "seo", "ai"],
    featured: false,
  },
  {
    name: "Telborg",
    description: "AI assistant for generating high-quality first drafts on climate and environmental topics.",
    website: "https://telborg.com/",
    pricing: "Paid",
    tags: ["writing", "ai", "climate", "drafting"],
    featured: false,
  },
  {
    name: "Trolly.ai",
    description: "AI-powered tool to create professional SEO articles 2x faster with content search optimization.",
    website: "https://trolly.ai/",
    pricing: "Paid",
    tags: ["writing", "seo", "ai", "articles"],
    featured: false,
  },
  {
    name: "Dittto.ai",
    description: "AI trained on top SaaS websites to help improve hero copy and web content.",
    website: "https://dittto.ai/",
    pricing: "Paid",
    tags: ["writing", "ai", "saas", "web-copy"],
    featured: false,
  },
  {
    name: "PulsePost",
    description: "AI writer that can automatically publish content directly to your website.",
    website: "https://pulsepost.io/",
    pricing: "Paid",
    tags: ["writing", "ai", "automation", "blogs"],
    featured: false,
  },
  {
    name: "Shy Editor",
    description: "Modern AI-assisted writing environment designed for all types of prose and creative content.",
    website: "https://www.shyeditor.com/",
    pricing: "Freemium",
    tags: ["writing", "ai", "editor", "creative"],
    featured: false,
  },
  {
    name: "DeepL Write",
    description: "AI tool focused on improving clarity, style, and communication in written content.",
    website: "https://www.deepl.com/write",
    pricing: "Freemium",
    tags: ["writing", "editing", "ai", "translation"],
    featured: false,
  },
  {
    name: "Headlinesai.pro",
    description: "AI-powered tool to generate optimized, catchy headlines for multiple platforms.",
    website: "https://www.headlinesai.pro/",
    pricing: "Paid",
    tags: ["writing", "ai", "headlines", "marketing"],
    featured: false,
  },
  {
    name: "GPTLocalhost",
    description: "Local Word add-in to use local LLM servers in Microsoft Word, fully offline alternative to Copilot.",
    website: "https://gptlocalhost.com/demo/",
    pricing: "Free",
    tags: ["writing", "ai", "offline", "local-LLM"],
    featured: false,
  },
]
,

  local_search: [
  {
    name: "privateGPT",
    description:
      "Run LLM-powered Q&A directly on your own documents without any internet connection, ensuring privacy and offline access to knowledge.",
    website: "https://github.com/imartinez/privateGPT",
    pricing: "Free",
    tags: ["local", "offline", "LLM", "private", "document-search", "privacy"],
    featured: true,
  },
  {
    name: "quivr",
    description:
      "A personal AI assistant that ingests all your files, allowing you to chat with your data and build a generative AI ‘second brain’ using embeddings.",
    website: "https://github.com/StanGirard/quivr",
    pricing: "Free",
    tags: ["local", "offline", "LLM", "embeddings", "document-chat", "personal-ai"],
    featured: true,
  },
]
,

  search: [
  {
    name: "Kazimir.ai",
    description:
      "A specialized AI-powered search engine focused on discovering and indexing AI-generated images across the web.",
    website: "https://kazimir.ai/",
    pricing: "Free",
    tags: ["search", "ai-images", "visual", "discovery"],
    featured: false,
  },
  {
    name: "Perplexity AI",
    description:
      "An AI-powered answer engine that combines web search with large language models to deliver cited, conversational responses.",
    website: "https://www.perplexity.ai/",
    pricing: "Freemium",
    tags: ["search", "chat", "citations", "research", "productivity"],
    featured: true,
  },
  {
    name: "Metaphor",
    description:
      "Language-model-powered search engine designed for semantic search and programmatic information retrieval.",
    website: "https://metaphor.systems/",
    pricing: "Paid",
    tags: ["search", "semantic", "api", "developers", "llm"],
    featured: false,
  },
  {
    name: "Phind",
    description:
      "Developer-focused AI search engine optimized for programming, technical questions, and code-related problem solving.",
    website: "https://phind.com/",
    pricing: "Freemium",
    tags: ["search", "developers", "coding", "technical"],
    featured: true,
  },
  {
    name: "You.com",
    description:
      "Privacy-first AI search engine offering personalized search results while keeping user data fully private.",
    website: "https://you.com/",
    pricing: "Free",
    tags: ["search", "privacy", "personalized", "ai"],
    featured: false,
  },
  {
    name: "Komo AI",
    description:
      "AI-powered search engine designed for fast, concise answers with minimal clutter and quick response times.",
    website: "https://komo.ai/",
    pricing: "Free",
    tags: ["search", "fast", "concise", "ai"],
    featured: false,
  },
  {
    name: "Telborg",
    description:
      "AI-driven search and research platform for climate science using verified data from governments and global institutions.",
    website: "https://telborg.com/",
    pricing: "Paid",
    tags: ["search", "climate", "research", "data"],
    featured: false,
  },
  {
    name: "MemFree",
    description:
      "Open-source hybrid AI search engine enabling instant answers across the web, bookmarks, notes, and documents.",
    website: "https://github.com/memfreeme/memfree",
    pricing: "Free",
    tags: ["search", "open-source", "hybrid", "personal-knowledge"],
    featured: true,
  },
  {
    name: "Refinder AI",
    description:
      "AI-powered universal search and assistant designed to help teams quickly find information across workplace tools.",
    website: "https://refinder.ai/",
    pricing: "Paid",
    tags: ["search", "work", "assistant", "productivity"],
    featured: false,
  },
  {
    name: "Agentset.ai",
    description:
      "Open-source local semantic search and RAG platform enabling private, AI-powered search over your own data.",
    website: "https://agentset.ai/",
    pricing: "Free",
    tags: ["search", "rag", "open-source", "local", "developers"],
    featured: true,
  },
]
,


  models: [
  {
    name: "OpenAI API",
    description:
      "OpenAI’s official API providing access to GPT-3.5, GPT-4, GPT-4o, and other multimodal models for text, code, vision, and reasoning tasks.",
    website: "https://openai.com/api/",
    pricing: "Paid",
    tags: ["llm", "api", "multimodal", "reasoning", "coding"],
    featured: true,
  },
  {
    name: "Gopher",
    description:
      "A 280-billion-parameter large language model developed by DeepMind, designed to study language modeling at extreme scale.",
    website:
      "https://www.deepmind.com/blog/language-modelling-at-scale-gopher-ethical-considerations-and-retrieval",
    pricing: "Research",
    tags: ["llm", "research", "deepmind", "large-scale"],
    featured: false,
  },
  {
    name: "OPT (Open Pretrained Transformers)",
    description:
      "Meta’s suite of decoder-only transformer models released to democratize access to large-scale language models, ranging up to 175B parameters.",
    website: "https://huggingface.co/facebook/opt-350m",
    pricing: "Free",
    tags: ["llm", "open-source", "meta", "transformer"],
    featured: false,
  },
  {
    name: "BLOOM",
    description:
      "A multilingual, open-source large language model trained on 46 natural languages and 13 programming languages by Hugging Face.",
    website: "https://huggingface.co/docs/transformers/model_doc/bloom",
    pricing: "Free",
    tags: ["llm", "open-source", "multilingual", "huggingface"],
    featured: true,
  },
  {
    name: "LLaMA",
    description:
      "Meta’s foundational large language model (up to 65B parameters), designed for efficient research and downstream fine-tuning.",
    website:
      "https://ai.facebook.com/blog/large-language-model-llama-meta-ai/",
    pricing: "Free",
    tags: ["llm", "open-source", "meta", "foundation-model"],
    featured: true,
  },
  {
    name: "LLaMA 2",
    description:
      "The next generation of Meta’s open-source LLaMA models, offering improved performance, safety, and commercial usability.",
    website: "https://ai.meta.com/llama/",
    pricing: "Free",
    tags: ["llm", "open-source", "meta", "commercial-use"],
    featured: true,
  },
  {
    name: "Claude 3",
    description:
      "Anthropic’s advanced language model family optimized for reasoning, coding, long-context understanding, and safe AI interactions.",
    website: "https://claude.ai/",
    pricing: "Freemium",
    tags: ["llm", "reasoning", "coding", "long-context"],
    featured: true,
  },
  {
    name: "Vicuna-13B",
    description:
      "An open-source conversational model fine-tuned from LLaMA using user-shared conversations collected from ShareGPT.",
    website: "https://lmsys.org/blog/2023-03-30-vicuna/",
    pricing: "Free",
    tags: ["llm", "open-source", "chatbot", "fine-tuned"],
    featured: false,
  },
  {
    name: "Stable Beluga",
    description:
      "A fine-tuned LLaMA-65B model focused on instruction-following and conversational quality, released by Stability AI.",
    website:
      "https://huggingface.co/stabilityai/StableBeluga1-Delta",
    pricing: "Free",
    tags: ["llm", "open-source", "stability-ai", "instruction-tuned"],
    featured: false,
  },
  {
    name: "Stable Beluga 2",
    description:
      "An improved instruction-tuned LLaMA-2-70B model by Stability AI with enhanced reasoning and chat performance.",
    website: "https://huggingface.co/stabilityai/StableBeluga2",
    pricing: "Free",
    tags: ["llm", "open-source", "stability-ai", "reasoning"],
    featured: false,
  },
  {
    name: "GPT-4o Mini",
    description:
      "A cost-efficient and fast OpenAI model designed for lightweight reasoning, chat, and automation tasks.",
    website: "https://altern.ai/ai/gpt-4o-mini",
    pricing: "Paid",
    tags: ["llm", "efficient", "openai", "low-cost"],
    featured: true,
  },
]
,
  local: [
  {
    name: "Ollama",
    description:
      "Run popular LLMs like Llama, DeepSeek, Mistral, and Gemma locally with simple commands.",
    website: "https://ollama.ai/",
    pricing: "Free",
    tags: ["local-ai", "llm", "open-source", "privacy"],
    featured: true,
  },
  {
    name: "Zylon AI",
    description:
      "Enterprise-ready private AI platform that runs fully on your own infrastructure, ensuring data sovereignty.",
    website: "https://www.zylon.ai/",
    pricing: "Paid",
    tags: ["local-ai", "enterprise", "privacy", "on-prem"],
    featured: true,
  },
  {
    name: "FastChat",
    description:
      "Open platform for training, serving, and evaluating large language model-based chat systems.",
    website: "https://github.com/lm-sys/FastChat",
    pricing: "Free",
    tags: ["local-ai", "open-source", "research", "serving"],
    featured: false,
  },
  {
    name: "PrivateGPT",
    description:
      "Production-ready private AI solution to query documents locally with zero data leaving your environment.",
    website: "https://github.com/zylon-ai/private-gpt",
    pricing: "Free",
    tags: ["local-ai", "privacy", "documents", "llm"],
    featured: true,
  },
]
,
"3d": [
  {
    name: "Meshy AI",
    description:
      "AI-powered 3D model generator for creators, enabling fast text-to-3D asset creation.",
    website: "http://meshy.ai",
    pricing: "Freemium",
    tags: ["3d", "text-to-3d", "creators", "assets"],
    featured: true,
  },
  {
    name: "Odyssey Explorer",
    description:
      "World-model generation platform for film, gaming, and immersive virtual environments.",
    website: "https://odyssey.world/introducing-explorer",
    pricing: "Paid",
    tags: ["3d", "world-models", "gaming", "film"],
    featured: true,
  },
  {
    name: "Hunyuan 3D 2.0",
    description:
      "Large-scale open-source 3D synthesis system capable of generating high-resolution textured assets.",
    website: "https://github.com/Tencent/Hunyuan3D-2",
    pricing: "Free",
    tags: ["3d", "open-source", "research", "textured-assets"],
    featured: true,
  },
  {
    name: "Stable DreamFusion",
    description:
      "PyTorch-based text-to-3D generation framework built on Stable Diffusion.",
    website: "https://github.com/ashawkey/stable-dreamfusion",
    pricing: "Free",
    tags: ["3d", "open-source", "research", "text-to-3d"],
    featured: false,
  },
]
,
writing: [
  {
    name: "GPTyper",
    description:
      "Lightweight writing assistant that provides real-time AI suggestions while typing using ChatGPT.",
    website: "https://gptype.app/",
    pricing: "Free",
    tags: ["writing", "autocomplete", "productivity"],
    featured: false,
  },
  {
    name: "Rytr",
    description:
      "AI writing tool for content generation, grammar correction, and marketing copy creation.",
    website: "https://rytr.me/",
    pricing: "Freemium",
    tags: ["writing", "marketing", "content", "grammar"],
    featured: true,
  },
  {
    name: "Jenni",
    description:
      "AI-powered research and writing workspace built for students, academics, and researchers.",
    website: "https://jenni.ai/",
    pricing: "Freemium",
    tags: ["writing", "research", "academia", "citations"],
    featured: true,
  },
]
,
photo: [
  {
    name: "Google Magic Editor",
    description:
      "AI-powered photo editor by Google that allows users to reimagine, enhance, and transform photos effortlessly.",
    website: "https://www.google.com/photos/editing/",
    pricing: "Freemium",
    tags: ["photo-editing", "generative-ai", "google", "consumer"],
    featured: true,
  },
  {
    name: "Clipdrop",
    description:
      "Fast AI image editing toolkit for background removal, relighting, upscaling, and creative visual generation.",
    website: "https://clipdrop.co/",
    pricing: "Freemium",
    tags: ["photo-editing", "design", "background-removal", "creative"],
    featured: true,
  },
  {
    name: "Runway",
    description:
      "Advanced creative platform offering image-to-image, text-to-image, and generative editing for creators.",
    website: "https://runwayml.com/",
    pricing: "Paid",
    tags: ["photo-editing", "generative-ai", "creators", "multimodal"],
    featured: true,
  },
]
,

  caller: [
  {
    name: "Bland AI",
    description:
      "Ultra-realistic AI phone calling platform capable of handling sales, support, and outbound calls with human-like voice agents.",
    website: "https://www.bland.ai/",
    pricing: "Paid",
    tags: ["voice-ai", "phone-calls", "sales", "support", "automation"],
    featured: true,
  },
  {
    name: "Poly AI",
    description:
      "Enterprise-grade conversational voice AI that resolves over 50% of customer calls while maintaining brand consistency.",
    website: "https://poly.ai/",
    pricing: "Paid",
    tags: ["voice-ai", "enterprise", "customer-support", "nlp"],
    featured: true,
  },
  {
    name: "Vapi AI",
    description:
      "Developer-focused voice AI platform to build, test, and deploy phone-based AI agents in minutes using APIs.",
    website: "https://vapi.ai/",
    pricing: "Freemium",
    tags: ["voice-ai", "developers", "api", "telephony"],
    featured: true,
  },
  {
    name: "Retell AI",
    description:
      "Voice AI platform designed to optimize call operations, automate workflows, and improve customer engagement.",
    website: "https://www.retellai.com/",
    pricing: "Paid",
    tags: ["voice-ai", "call-center", "automation", "operations"],
    featured: false,
  },
  {
    name: "Synthflow",
    description:
      "No-code solution for creating human-like AI phone calls for sales, scheduling, and customer interactions.",
    website: "https://synthflow.ai/",
    pricing: "Freemium",
    tags: ["voice-ai", "no-code", "automation", "business"],
    featured: false,
  },
  {
    name: "Curious Thing",
    description:
      "AI-powered phone agents tailored for businesses to handle inbound and outbound conversations autonomously.",
    website: "https://curiousthing.io/",
    pricing: "Paid",
    tags: ["voice-ai", "business", "call-agents"],
    featured: false,
  },
  {
    name: "Simple Phones",
    description:
      "AI phone assistant that ensures businesses never miss customer calls, messages, or inquiries.",
    website: "https://www.simplephones.ai/",
    pricing: "Freemium",
    tags: ["voice-ai", "small-business", "customer-support"],
    featured: false,
  },
]
,
  business: [
  {
    name: "IFTTT",
    description:
      "Simple automation platform connecting over 900 services to create applets that automate business tasks and smart workflows.",
    website: "https://ifttt.com/",
    pricing: "Freemium",
    tags: ["automation", "workflows", "integrations", "no-code"],
    featured: false,
  },
  {
    name: "Zapier",
    description:
      "Industry-leading no-code automation platform enabling businesses to automate workflows across thousands of apps without developers.",
    website: "https://zapier.com/",
    pricing: "Freemium",
    tags: ["automation", "workflows", "no-code", "integrations"],
    featured: true,
  },
  {
    name: "Tray AI",
    description:
      "Enterprise-grade AI and automation platform designed to securely scale complex integrations and AI-powered workflows.",
    website: "https://tray.ai/",
    pricing: "Paid",
    tags: ["automation", "enterprise", "ai", "integrations"],
    featured: true,
  },
  {
    name: "Make",
    description:
      "Visual automation platform allowing teams to design, build, and scale powerful workflows with full transparency and flexibility.",
    website: "https://www.make.com/",
    pricing: "Freemium",
    tags: ["automation", "visual-builder", "no-code", "scalable"],
    featured: true,
  },
  {
    name: "Pipedream",
    description:
      "Developer-friendly automation platform to connect APIs, AI, databases, and services with optional code-level control.",
    website: "https://pipedream.com/",
    pricing: "Freemium",
    tags: ["automation", "api", "developers", "serverless"],
    featured: false,
  },
  {
    name: "n8n",
    description:
      "Open-source, AI-native workflow automation platform built for technical teams with self-hosting and advanced customization.",
    website: "https://n8n.io/",
    pricing: "Freemium",
    tags: ["automation", "open-source", "self-hosted", "developers"],
    featured: true,
  },
  {
    name: "Relevance AI",
    description:
      "Platform for building and managing AI agent teams that perform operational, analytical, and knowledge-based business tasks.",
    website: "https://relevanceai.com/",
    pricing: "Paid",
    tags: ["ai-agents", "operations", "automation", "enterprise"],
    featured: true,
  },
  {
    name: "Workato",
    description:
      "Enterprise orchestration platform combining integrations, automation, and AI to streamline complex business processes.",
    website: "https://www.workato.com/",
    pricing: "Paid",
    tags: ["enterprise", "automation", "integrations", "ai"],
    featured: false,
  },
  {
    name: "Napkin AI",
    description:
      "Turns plain text into clear visuals and diagrams, making it easy to communicate ideas, strategies, and workflows.",
    website: "https://www.napkin.ai/",
    pricing: "Freemium",
    tags: ["visualization", "ideas", "presentations", "productivity"],
    featured: false,
  },
  {
    name: "Conversion AI (Jasper)",
    description:
      "AI-powered marketing assistant designed to generate high-converting copy for ads, emails, blogs, and campaigns.",
    website: "https://conversion.ai/",
    pricing: "Paid",
    tags: ["marketing", "copywriting", "ai", "content"],
    featured: true,
  },
  {
    name: "Daily AI",
    description:
      "Email marketing optimization platform that uses AI to improve engagement, personalization, and conversion rates.",
    website: "https://daily.ai/",
    pricing: "Paid",
    tags: ["email-marketing", "ai", "growth", "automation"],
    featured: false,
  },
  {
    name: "Bubble",
    description:
      "No-code platform to build, launch, and scale fully functional web applications without writing code.",
    website: "https://bubble.io/",
    pricing: "Freemium",
    tags: ["no-code", "web-apps", "startup", "saas"],
    featured: true,
  },
  {
    name: "ClickUp",
    description:
      "All-in-one productivity and work management platform connecting tasks, docs, goals, and integrations in one workspace.",
    website: "https://clickup.com/integrations",
    pricing: "Freemium",
    tags: ["productivity", "project-management", "collaboration"],
    featured: true,
  },
  {
    name: "Browse AI",
    description:
      "No-code data extraction tool that lets you scrape, monitor, and track data from any website in minutes.",
    website: "https://www.browse.ai/",
    pricing: "Freemium",
    tags: ["web-scraping", "data", "automation", "no-code"],
    featured: false,
  },
  {
    name: "Seona AI",
    description:
      "Free AI-powered SEO tool that helps improve website rankings through automated analysis and recommendations.",
    website: "https://seonaai.com/",
    pricing: "Free",
    tags: ["seo", "marketing", "ai", "analytics"],
    featured: false,
  },
  {
    name: "Monday Work Management",
    description:
      "Flexible work management platform that connects strategy, execution, and collaboration across teams and projects.",
    website: "https://monday.com/work-management",
    pricing: "Paid",
    tags: ["project-management", "collaboration", "business"],
    featured: true,
  },
  {
    name: "Monday Dev",
    description:
      "Agile-focused development platform for planning roadmaps, managing sprints, and delivering software faster.",
    website: "https://www.monday.com/w/dev",
    pricing: "Paid",
    tags: ["dev-tools", "agile", "sprints", "product-management"],
    featured: false,
  },
  {
    name: "Stripe",
    description:
      "Global financial infrastructure providing secure payments, subscriptions, billing, and revenue management APIs.",
    website: "https://stripe.com/",
    pricing: "Usage-based",
    tags: ["payments", "finance", "api", "saas"],
    featured: true,
  },
  {
    name: "UptimeRobot",
    description:
      "Website and service monitoring tool that alerts you instantly when your product goes down.",
    website: "https://uptimerobot.com/",
    pricing: "Freemium",
    tags: ["monitoring", "uptime", "devops", "reliability"],
    featured: false,
  },
  {
    name: "Finta",
    description:
      "Fundraising platform helping startups raise capital, manage investors, and streamline due diligence.",
    website: "https://www.trustfinta.com/",
    pricing: "Paid",
    tags: ["fundraising", "startups", "finance", "investors"],
    featured: false,
  },
]
,
  design: [
  {
    name: "Gamma",
    description:
      "AI-powered platform for creating visually stunning presentations, documents, and simple websites without any design or coding skills.",
    website: "https://gamma.app/",
    pricing: "Freemium",
    tags: ["presentations", "design", "documents", "no-code", "ai"],
    featured: true,
  },
  {
    name: "Magic Slides",
    description:
      "AI presentation generator that converts text, PDFs, videos, or URLs into polished slide decks within seconds.",
    website: "https://www.magicslides.app/",
    pricing: "Freemium",
    tags: ["presentations", "slides", "automation", "content-creation"],
    featured: false,
  },
]
,


  research: [
  {
    name: "NotebookLM",
    description:
      "Google’s AI-powered research assistant that helps analyze, summarize, and query your own documents, notes, and sources.",
    website: "https://notebooklm.google/",
    pricing: "Free",
    tags: ["research", "notes", "summarization", "documents", "ai-assistant"],
    featured: true,
  },
  {
    name: "Google Gemini Pro (Deep Research)",
    description:
      "Advanced research mode in Gemini that performs deep web exploration, synthesis, and multi-source reasoning for complex research tasks.",
    website: "https://gemini.google.com/app",
    pricing: "Paid",
    tags: ["research", "deep-research", "reasoning", "web-analysis"],
    featured: true,
  },
]
,

  agents: [
  {
    name: "Stagehand",
    description:
      "Developer-first browser automation framework built on top of Playwright, enabling fast, reliable, and agent-driven web automations with Browserbase integration.",
    website: "https://docs.stagehand.dev/",
    pricing: "Free",
    tags: ["agents", "automation", "browser", "playwright", "developers"],
    featured: true,
  },
  {
    name: "OpenAI Operator",
    description:
      "Autonomous AI agent capable of using its own browser to complete complex tasks such as form filling, navigation, and multi-step workflows.",
    website: "https://openai.com/index/introducing-operator/",
    pricing: "Paid",
    tags: ["agents", "automation", "browser", "tasks", "ai-assistant"],
    featured: true,
  },
  {
    name: "AutoGen",
    description:
      "Microsoft’s framework for building collaborative and autonomous multi-agent AI systems that can reason, communicate, and execute tasks together.",
    website: "https://github.com/microsoft/autogen",
    pricing: "Free",
    tags: ["agents", "multi-agent", "framework", "open-source", "research"],
    featured: true,
  },
  {
    name: "CAMEL",
    description:
      "Open-source framework for designing customizable AI agents and multi-agent systems focused on role-playing, coordination, and real-world applications.",
    website: "https://github.com/camel-ai/camel",
    pricing: "Free",
    tags: ["agents", "multi-agent", "open-source", "simulation", "research"],
    featured: false,
  },
  {
    name: "ChatDev",
    description:
      "Multi-agent system that simulates a virtual software company, enabling AI agents to collaborate on planning, coding, testing, and documentation.",
    website: "https://github.com/OpenBMB/ChatDev",
    pricing: "Free",
    tags: ["agents", "software-development", "multi-agent", "open-source"],
    featured: false,
  },
]
,
  "software-models": [
  {
    name: "Claude 3.7 Sonnet",
    description:
      "Hybrid reasoning model with state-of-the-art coding performance, computer-use capabilities, and a massive 200K context window ideal for large-scale software engineering tasks.",
    website: "https://www.anthropic.com/claude/sonnet",
    pricing: "Paid",
    tags: [
      "coding",
      "reasoning",
      "long-context",
      "software-engineering",
      "enterprise",
    ],
    featured: true,
  },
  {
    name: "Gemini 2.0 Flash",
    description:
      "Highly optimized model offering an excellent balance of speed, intelligence, and cost, capable of handling large codebases efficiently.",
    website: "https://deepmind.google/technologies/gemini/flash/",
    pricing: "Freemium",
    tags: [
      "coding",
      "fast",
      "large-codebase",
      "cost-efficient",
      "google",
    ],
    featured: true,
  },
  {
    name: "OpenAI o3-mini",
    description:
      "Lightweight reasoning-focused model from OpenAI that performs well on coding tasks, debugging, and algorithmic problem-solving.",
    website: "https://platform.openai.com/docs/overview",
    pricing: "Paid",
    tags: ["coding", "reasoning", "lightweight", "api"],
    featured: false,
  },
  {
    name: "Qwen 2.5 32B",
    description:
      "Large-scale open model optimized for code generation, understanding, and software development workflows.",
    website: "https://huggingface.co/Qwen/Qwen2.5-32B",
    pricing: "Free",
    tags: ["coding", "open-source", "large-model", "developers"],
    featured: true,
  },
  {
    name: "Llama 3.3 70B Instruct",
    description:
      "Meta’s large instruction-tuned model with strong coding capabilities, suitable for complex software engineering and reasoning tasks.",
    website: "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct",
    pricing: "Free",
    tags: ["coding", "open-source", "large-model", "reasoning"],
    featured: true,
  },
  {
    name: "DeepSeek R1 Distill Qwen 32B",
    description:
      "Reasoning-focused distilled model built on Qwen, designed to deliver strong coding and logical problem-solving performance efficiently.",
    website: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    pricing: "Free",
    tags: [
      "coding",
      "reasoning",
      "open-source",
      "distilled-model",
    ],
    featured: false,
  },
]
,

  
  engineering: [
  {
    name: "Google Gemini Code Assist",
    description:
      "Enterprise-grade AI coding assistant by Google that supports the entire SDLC with secure, privacy-focused generative code assistance directly inside developer workflows.",
    website: "https://codeassist.google/products/business?hl=en",
    pricing: "Freemium",
    tags: ["coding", "enterprise", "sdcl", "google", "ai-assistant"],
    featured: true,
  },
  {
    name: "GitHub Copilot",
    description:
      "AI-powered coding assistant that provides real-time code suggestions, completions, and explanations directly inside popular IDEs.",
    website: "https://github.com/features/copilot",
    pricing: "Paid",
    tags: ["coding", "autocomplete", "ide", "github", "productivity"],
    featured: true,
  },
  {
    name: "Cline Bot",
    description:
      "Collaborative AI engineering partner capable of planning, coding, refactoring, and executing complex development tasks with developer oversight.",
    website: "https://cline.bot/",
    pricing: "Freemium",
    tags: ["agentic-ai", "collaboration", "engineering", "automation"],
    featured: false,
  },
  {
    name: "Roo Code",
    description:
      "Autonomous AI coding agent that lives inside your editor, capable of understanding tasks, writing code, and iterating on solutions end-to-end.",
    website: "https://docs.roocode.com/",
    pricing: "Free",
    tags: ["agentic-ai", "open-source", "ide", "automation"],
    featured: false,
  },
  {
    name: "Cursor",
    description:
      "Modern AI-first code editor designed for pair programming with AI, offering deep code understanding, refactoring, and generation.",
    website: "https://www.cursor.com/",
    pricing: "Freemium",
    tags: ["code-editor", "ai-first", "pair-programming", "productivity"],
    featured: true,
  },
  {
    name: "Codeium Windsurf",
    description:
      "An agentic IDE built for autonomous development workflows, combining AI agents, code generation, and real-time execution.",
    website: "https://codeium.com/windsurf",
    pricing: "Freemium",
    tags: ["agentic-ide", "automation", "ai-editor", "coding"],
    featured: true,
  },
  {
    name: "Google Project IDX",
    description:
      "Cloud-based development environment with built-in Gemini AI for code generation, inline suggestions, and real-time code understanding.",
    website: "https://idx.google.com/",
    pricing: "Free",
    tags: ["cloud-ide", "google", "ai-assistant", "web-dev"],
    featured: false,
  },
  {
    name: "v0 by Vercel",
    description:
      "AI-powered UI generation tool that converts text prompts into production-ready frontend code, optimized for modern web frameworks.",
    website: "https://v0.dev/",
    pricing: "Freemium",
    tags: ["ui-generation", "frontend", "vercel", "design-to-code"],
    featured: true,
  },
  {
    name: "Lovable",
    description:
      "AI-driven full-stack engineering assistant capable of designing, building, and iterating on complete applications with minimal input.",
    website: "https://lovable.dev/",
    pricing: "Freemium",
    tags: ["full-stack", "agentic-ai", "automation", "startup"],
    featured: false,
  },
  {
    name: "Bolt",
    description:
      "End-to-end AI development platform that lets you prompt, run, edit, and deploy full-stack web and mobile applications instantly.",
    website: "https://bolt.new/",
    pricing: "Freemium",
    tags: ["full-stack", "deployment", "agentic-ai", "rapid-prototyping"],
    featured: true,
  },
  {
    name: "Softgen",
    description:
      "No-code AI web app builder that transforms natural language descriptions into fully functional full-stack applications.",
    website: "https://softgen.ai/",
    pricing: "Freemium",
    tags: ["no-code", "web-apps", "automation", "ai-builder"],
    featured: false,
  },
  {
    name: "Replit",
    description:
      "AI-powered cloud development platform that enables instant coding, collaboration, deployment, and app generation from ideas.",
    website: "https://replit.com/",
    pricing: "Freemium",
    tags: ["cloud-ide", "collaboration", "deployment", "ai-coding"],
    featured: true,
  },
  {
    name: "Devin",
    description:
      "Autonomous AI software engineer that can plan, code, debug, and deliver features while collaborating with human developers.",
    website: "https://devin.ai/",
    pricing: "Paid",
    tags: ["agentic-ai", "autonomous", "engineering", "enterprise"],
    featured: true,
  },
  {
    name: "Continue",
    description:
      "Open-source AI code assistant that lets developers connect any LLM and context for custom autocomplete and chat inside IDEs.",
    website: "https://www.continue.dev/",
    pricing: "Free",
    tags: ["open-source", "ide", "custom-models", "autocomplete"],
    featured: false,
  },
  {
    name: "Sourcegraph",
    description:
      "AI-powered code intelligence platform for searching, understanding, and refactoring large and complex codebases at scale.",
    website: "https://sourcegraph.com/",
    pricing: "Paid",
    tags: ["code-search", "enterprise", "large-codebases", "ai"],
    featured: true,
  },
]
,


  music: [
  {
    name: "Suno",
    description:
      "AI-powered music generation platform that allows anyone to create complete songs—including vocals, lyrics, and instrumentation—from simple text prompts.",
    website: "https://suno.com/",
    pricing: "Freemium",
    tags: ["music", "audio", "song-generation", "vocals", "creative"],
    featured: true,
  },
  {
    name: "MusicLM",
    description:
      "Research-based AI music generator capable of producing high-quality, original music across diverse genres and styles using natural language prompts.",
    website: "https://musiclm.com/",
    pricing: "Free",
    tags: ["music", "audio", "text-to-music", "research", "generative-ai"],
    featured: false,
  },
]
,

  audio: [
  {
    name: "NotebookLM",
    description:
      "Google-powered AI tool for turning documents into narrated audio, podcast-style conversations, and voice-driven explanations with contextual understanding.",
    website: "https://notebooklm.google/",
    pricing: "Free",
    tags: ["audio", "voiceover", "podcast", "text-to-speech", "documents"],
    featured: true,
  },
  {
    name: "MMAudio",
    description:
      "Cutting-edge AI system that generates realistic audio tracks directly from video content, enabling automatic sound effects and audio synthesis.",
    website: "https://mmaudio.net/",
    pricing: "Free",
    tags: ["audio", "video-to-audio", "sound-effects", "research", "generation"],
    featured: false,
  },
]
,
 "image-gen": [
  {
    name: "Midjourney",
    description:
      "One of the highest-quality AI image generators available, especially popular for artistic and anime-style outputs through its Niji mode.",
    website: "https://www.midjourney.com/",
    pricing: "Paid",
    tags: ["image-generation", "art", "diffusion", "anime", "creative"],
    featured: true,
  },
  {
    name: "Flux AI 1.1 Pro Ultra",
    description:
      "High-performance image generation model capable of producing ultra-high resolution images (up to 4MP) with very fast generation times.",
    website: "https://flux1.ai/features/flux1-pro-ultra",
    pricing: "Paid",
    tags: ["image-generation", "high-resolution", "fast", "professional"],
    featured: true,
  },
  {
    name: "Stable Diffusion",
    description:
      "Popular open-source image generation model that can be run locally or in the cloud, offering deep customization and control.",
    website: "https://stability.ai/news/introducing-stable-diffusion-3-5",
    pricing: "Free",
    tags: ["image-generation", "open-source", "local", "diffusion", "customizable"],
    featured: true,
  },
  {
    name: "Imagen 3",
    description:
      "Google DeepMind’s highest-quality text-to-image model, known for photorealism, prompt understanding, and image fidelity.",
    website: "https://deepmind.google/technologies/imagen-3/",
    pricing: "Paid",
    tags: ["image-generation", "google", "photorealistic", "text-to-image"],
    featured: true,
  },
  {
    name: "Janus Pro 7B",
    description:
      "Powerful local image generation model by DeepSeek, designed for developers and researchers who want full offline control.",
    website: "https://januspro.org/",
    pricing: "Free",
    tags: ["image-generation", "open-source", "local", "developers", "research"],
    featured: false,
  },
  {
    name: "Leonardo AI",
    description:
      "Creative-focused image generation platform offering tools for concept art, game assets, and design workflows.",
    website: "https://leonardo.ai/",
    pricing: "Freemium",
    tags: ["image-generation", "design", "creative", "assets", "art"],
    featured: true,
  },
  {
    name: "LensGo",
    description:
      "AI image generation platform focused on creative visuals, though performance and speed may vary depending on load.",
    website: "https://lensgo.ai/",
    pricing: "Freemium",
    tags: ["image-generation", "creative", "experimental"],
    featured: false,
  },
  {
    name: "Krea AI",
    description:
      "Modern AI image creation platform emphasizing real-time generation, style control, and creative exploration.",
    website: "https://www.krea.ai/home",
    pricing: "Freemium",
    tags: ["image-generation", "real-time", "creative", "design"],
    featured: true,
  },
  {
    name: "ImageBind by Meta",
    description:
      "Multimodal AI model that connects images, video, audio, text, depth, and sensor data, advancing cross-modal understanding.",
    website: "https://imagebind.metademolab.com/",
    pricing: "Free",
    tags: ["multimodal", "research", "meta", "image-generation", "ai-model"],
    featured: false,
  },
  {
    name: "Ideogram",
    description:
      "Free-to-use AI image generator well known for creating posters, logos, typography-rich visuals, and realistic images.",
    website: "https://ideogram.ai/",
    pricing: "Free",
    tags: ["image-generation", "logos", "posters", "typography"],
    featured: true,
  },
  {
    name: "Skybox AI by Blockade Labs",
    description:
      "Specialized AI tool for generating immersive 360° skybox environments for games, VR, and virtual worlds.",
    website: "https://www.skyboxai.net/",
    pricing: "Freemium",
    tags: ["image-generation", "3d", "skybox", "vr", "games"],
    featured: false,
  },
  {
    name: "Human Generator",
    description:
      "AI-powered tool for generating realistic human faces and portraits, useful for design, testing, and mockups.",
    website: "https://generated.photos/human-generator",
    pricing: "Paid",
    tags: ["image-generation", "faces", "human", "photorealistic"],
    featured: false,
  },
  {
    name: "Hugging Face (Text-to-Image)",
    description:
      "Collection of open-source text-to-image models hosted on Hugging Face, ideal for experimentation and research.",
    website: "https://huggingface.co/tasks/text-to-image",
    pricing: "Free",
    tags: ["image-generation", "open-source", "research", "models"],
    featured: false,
  },
]
,
  chat: [
  {
    name: "ChatGPT by OpenAI",
    description:
      "Industry-leading generative AI chatbot with strong reasoning, multimodal support, coding assistance, enterprise tools, and a powerful API ecosystem.",
    website: "https://chatgpt.com/",
    pricing: "Freemium",
    tags: ["chatbot", "reasoning", "coding", "multimodal", "enterprise", "api"],
    featured: true,
  },
  {
    name: "Google Gemini",
    description:
      "Google’s AI companion deeply integrated with the Google ecosystem, offering fast responses, strong reasoning, and productivity-focused assistance.",
    website: "https://gemini.google.com/app",
    pricing: "Freemium",
    tags: ["chatbot", "google", "reasoning", "productivity", "multimodal"],
    featured: true,
  },
  {
    name: "Grok by xAI",
    description:
      "An unfiltered, real-time AI chatbot designed for deep reasoning, coding, and visual understanding, with access to live social and web data.",
    website: "https://x.ai/grok",
    pricing: "Paid",
    tags: ["chatbot", "reasoning", "coding", "real-time", "uncensored"],
    featured: false,
  },
  {
    name: "DeepSeek",
    description:
      "Open-source focused AI chatbot offering powerful reasoning (R1), general-purpose models (V3), and developer-friendly APIs.",
    website: "https://www.deepseek.com/",
    pricing: "Free",
    tags: ["chatbot", "open-source", "reasoning", "api", "developers"],
    featured: true,
  },
  {
    name: "Claude by Anthropic",
    description:
      "Highly reliable AI assistant known for long-context understanding, safe reasoning, excellent coding performance, and enterprise-grade solutions.",
    website: "https://www.anthropic.com/",
    pricing: "Freemium",
    tags: ["chatbot", "coding", "enterprise", "long-context", "api"],
    featured: true,
  },
  {
    name: "Mistral Le Chat",
    description:
      "A fast and capable AI assistant built on Mistral models, designed for everyday tasks ranging from creative writing to technical problem-solving.",
    website: "https://mistral.ai/products/le-chat",
    pricing: "Free",
    tags: ["chatbot", "open-models", "creative", "coding", "fast"],
    featured: false,
  },
  {
    name: "Hugging Face Chat",
    description:
      "Community-driven chatbot platform allowing users to interact with multiple open-source models such as LLaMA and DeepSeek.",
    website: "https://huggingface.co/chat/",
    pricing: "Free",
    tags: ["chatbot", "open-source", "community", "models", "research"],
    featured: false,
  },
  {
    name: "T3 Chat",
    description:
      "Unified chat interface to experiment with multiple AI models including GPT-4o, Claude 3.5 Sonnet, Gemini Flash, and DeepSeek.",
    website: "https://t3.chat/chat",
    pricing: "Free",
    tags: ["chatbot", "multi-model", "comparison", "developers"],
    featured: false,
  },
  {
    name: "Groq",
    description:
      "Ultra-fast AI inference platform enabling chat with open-source models and APIs, optimized for extremely low-latency responses.",
    website: "https://groq.com/",
    pricing: "Freemium",
    tags: ["chatbot", "open-source", "api", "high-performance", "low-latency"],
    featured: true,
  },
  {
    name: "ChatGPT",
    description:
      "Conversational AI by OpenAI based on large language models, capable of reasoning, coding, writing, analysis, and multimodal interactions.",
    website: "https://chatgpt.com",
    pricing: "Freemium",
    tags: ["chatbot", "llm", "reasoning", "coding", "multimodal"],
    featured: true,
  },
  {
    name: "Bing Chat",
    description:
      "Microsoft’s AI-powered conversational assistant integrated with Bing search, providing real-time web answers and contextual assistance.",
    website: "https://www.bing.com/chat",
    pricing: "Free",
    tags: ["chatbot", "search", "microsoft", "real-time"],
    featured: false,
  },
  {
    name: "Gemini",
    description:
      "Google’s experimental AI chatbot designed for natural conversations, reasoning, and productivity across the Google ecosystem.",
    website: "https://gemini.google.com",
    pricing: "Freemium",
    tags: ["chatbot", "google", "reasoning", "productivity"],
    featured: true,
  },
  {
    name: "Character.AI",
    description:
      "Interactive AI platform that lets users create, customize, and chat with AI characters having distinct personalities.",
    website: "https://character.ai/",
    pricing: "Freemium",
    tags: ["chatbot", "roleplay", "characters", "creative"],
    featured: false,
  },
  {
    name: "ChatPDF",
    description:
      "AI-powered chatbot that allows users to upload PDFs and ask questions, summarize content, and extract insights instantly.",
    website: "https://www.chatpdf.com/",
    pricing: "Freemium",
    tags: ["chatbot", "pdf", "documents", "productivity"],
    featured: false,
  },
  {
    name: "ChatSonic",
    description:
      "AI assistant by Writesonic supporting conversational chat, content creation, and image generation with real-time data access.",
    website: "https://writesonic.com/chat",
    pricing: "Freemium",
    tags: ["chatbot", "content", "image-generation", "marketing"],
    featured: false,
  },
  {
    name: "Phind",
    description:
      "AI-powered search engine and assistant built for developers, offering coding help, web browsing, and VS Code integration.",
    website: "https://www.phind.com/",
    pricing: "Freemium",
    tags: ["chatbot", "developers", "coding", "search"],
    featured: true,
  },
  {
    name: "Tiledesk",
    description:
      "Open-source, no-code platform for building LLM-powered chatbots and deploying them across multiple communication channels.",
    website: "https://tiledesk.com/",
    pricing: "Freemium",
    tags: ["chatbot", "open-source", "no-code", "customer-support"],
    featured: false,
  },
  {
    name: "AICamp",
    description:
      "Team-focused AI assistant offering collaborative ChatGPT-like experiences tailored for workplace productivity.",
    website: "https://aicamp.so/",
    pricing: "Paid",
    tags: ["chatbot", "teams", "productivity", "enterprise"],
    featured: false,
  },
  {
    name: "Gali Chat",
    description:
      "24/7 AI-powered customer support assistant designed to help businesses automate conversations and improve engagement.",
    website: "https://www.galichat.com/",
    pricing: "Paid",
    tags: ["chatbot", "customer-support", "business", "automation"],
    featured: false,
  },
  {
    name: "DeepSeek R1",
    description:
      "Advanced AI assistant by DeepSeek optimized for reasoning, coding, and general-purpose conversational tasks.",
    website: "https://www.deepseek.com",
    pricing: "Free",
    tags: ["chatbot", "reasoning", "coding", "open-models"],
    featured: true,
  },
  {
    name: "dmwithme",
    description:
      "AI companion chatbot designed to simulate realistic emotions, personality shifts, and engaging conversational dynamics.",
    website: "https://dmwithme.com",
    pricing: "Freemium",
    tags: ["chatbot", "companion", "emotional-ai", "conversation"],
    featured: false,
  },


],
video: [
  {
    name: "Luma Labs Ray2",
    description:
      "Large-scale video generation model capable of producing highly realistic visuals with smooth, coherent motion from text, images, or video inputs.",
    website: "https://lumalabs.ai/ray",
    pricing: "Paid",
    tags: ["video", "text-to-video", "image-to-video", "realistic", "motion"],
    featured: true,
  },
  {
    name: "Kling 1.6",
    description:
      "AI creative studio for generating high-quality videos and images with strong cinematic motion and visual fidelity.",
    website: "https://klingai.com",
    pricing: "Freemium",
    tags: ["video", "creative", "image-to-video", "cinematic"],
    featured: true,
  },
  {
    name: "Google Veo 2",
    description:
      "State-of-the-art video generation model from Google DeepMind, designed for high-resolution, long-form, and cinematic video synthesis.",
    website: "https://deepmind.google/technologies/veo/veo-2/",
    pricing: "Limited",
    tags: ["video", "research", "cinematic", "text-to-video", "deepmind"],
    featured: true,
  },
  {
    name: "Viggle AI",
    description:
      "Character animation platform that enables motion transfer, character movement, and swapping using AI-powered video synthesis.",
    website: "https://www.viggle.ai/",
    pricing: "Freemium",
    tags: ["video", "character-animation", "motion-transfer", "creative"],
    featured: false,
  },
  {
    name: "HeyGen",
    description:
      "AI avatar video platform for creating studio-quality talking-head videos in over 175 languages without cameras or actors.",
    website: "https://www.heygen.com/",
    pricing: "Paid",
    tags: ["video", "avatar", "text-to-speech", "multilingual", "marketing"],
    featured: true,
  },
  {
    name: "Hailuo AI",
    description:
      "Creative AI video platform focused on fast and expressive video generation for storytelling and visual experimentation.",
    website: "https://hailuoai.video/",
    pricing: "Freemium",
    tags: ["video", "creative", "text-to-video", "experimental"],
    featured: false,
  },
  {
    name: "Stable Video Diffusion",
    description:
      "Open diffusion-based model that generates short videos from still images, built by Stability AI.",
    website: "https://stability.ai/stable-video",
    pricing: "Free",
    tags: ["video", "open-source", "diffusion", "image-to-video"],
    featured: false,
  },
  {
    name: "Runway",
    description:
      "Professional AI video creation suite supporting text-to-video, image-to-video, video editing, and 3D perspective transformations.",
    website: "https://runwayml.com/",
    pricing: "Freemium",
    tags: ["video", "editing", "text-to-video", "image-to-video", "3d"],
    featured: true,
  },
  {
    name: "Moonvalley",
    description:
      "Text-to-video platform focused on cinematic storytelling, realistic lighting, and film-style motion generation.",
    website: "https://moonvalley.ai",
    pricing: "Paid",
    tags: ["video", "cinematic", "text-to-video", "storytelling"],
    featured: false,
  },
  {
    name: "Klap",
    description:
      "AI-powered tool that automatically converts long videos into viral short-form content for TikTok, Reels, and Shorts.",
    website: "https://klap.app/",
    pricing: "Freemium",
    tags: ["video", "shorts", "repurposing", "social-media"],
    featured: false,
  },
  {
    name: "Animate Anyone",
    description:
      "Research-based image-to-video framework enabling consistent and controllable character animation from a single reference image.",
    website: "https://humanaigc.github.io/animate-anyone/",
    pricing: "Free",
    tags: ["video", "research", "character-animation", "image-to-video"],
    featured: false,
  },
  {
    name: "Akool",
    description:
      "Enterprise-grade generative AI platform for avatar creation, marketing videos, film production, training, and education.",
    website: "https://akool.com/",
    pricing: "Paid",
    tags: ["video", "avatar", "enterprise", "marketing", "education"],
    featured: true,
  },
]




};

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function badgeColorClass(kind, value) {
  // Base glass styles
  const base =
    "backdrop-blur-md border text-xs px-2 py-1 rounded-md shadow-sm transition-all";

  const glass = {
    amber: `${base} bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30`,
    indigo: `${base} bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30`,
    emerald: `${base} bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30`,
    rose: `${base} bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30`,
    slate: `${base}  bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300`,
    orange: `${base}  bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300`,
  };

  // ------ PRICING BADGES ------
  if (kind === "pricing") {
    const v = value?.toLowerCase();
    if (v?.includes("free") || v?.includes("open source")) return glass.emerald;
    if (v?.includes("paid") || v?.includes("subscription")) return glass.indigo;
    if (v?.includes("freemium") || v?.includes("trial")) return glass.amber;
    return glass.slate;
  }

  // ------ FEATURED BADGES ------
  if (kind === "featured") {
    return value ? glass.rose : glass.slate;
  }

  // ------ TAGS BADGES (use slate by default for general tags) ------
  if (kind === "tags") {
    return glass.orange;
  }

  return glass.slate;
}


/* ---------- Component ---------- */
export default function AllAisPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState("image-gen");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAi, setSelectedAi] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(true); // default to showing raw JSON in dialog
  const copyTimeoutRef = useRef(null);
  const [itemsPerRow, setItemsPerRow] = useState(2); // mobile friendly default (kept from original)
  const [compactMode, setCompactMode] = useState(false); // toggle compact card density (kept from original)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // derive current category list
  const aisByCategory = useMemo(() => {
    const out = {};
    CATEGORIES.forEach((c) => {
      const key = c.id;
      out[key] = SAMPLE_AIS[key] ?? SAMPLE_AIS.default ?? [];
    });
    return out;
  }, []);

  // combined list to filter/search
  const allAisForSelected = useMemo(() => {
    const list = aisByCategory[selectedCategory] || [];
    if (!query || query.trim() === "") return list;
    const q = query.toLowerCase();
    return list.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q) ||
        (a.tags || []).some(tag => tag.toLowerCase().includes(q)) // Search by tags too
    );
  }, [aisByCategory, selectedCategory, query]);

  function openAiDetails(ai) {
    setSelectedAi(ai);
    setDialogOpen(true);
    setCopied(false);
  }

  function copyAiJson(ai) {
    if (!ai) return showToast("info", "No AI selected to copy");
    const payload = prettyJSON(ai);
    navigator.clipboard.writeText(payload).then(
      () => {
        setCopied(true);
        showToast("success", "AI JSON copied");
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      },
      () => showToast("error", "Copy failed")
    );
  }

  function downloadAiJson(ai) {
    if (!ai) return showToast("info", "No AI selected to download");
    const blob = new Blob([prettyJSON(ai)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeName = (ai.name || "ai").replace(/\s+/g, "_").toLowerCase();
    a.download = `ai_${safeName}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Download started");
  }

  function refreshCategory() {
    const list = aisByCategory[selectedCategory] || [];
    // Only shuffle if there are items to prevent error if category is empty
    if (list.length > 0) {
        const shuffled = [...list].sort(() => Math.random() - 0.5);
        SAMPLE_AIS[selectedCategory] = shuffled;
        showToast("success", "Category refreshed (shuffled demo data)");
    } else {
        showToast("info", "No items to refresh in this category.");
    }
    // force re-render by toggling (cheap)
    setSelectedCategory((s) => s);
  }

  const surface = isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200";
  const panelBg = isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200";

  return (
    <div className={clsx("min-h-screen pb-10 p-3 sm:p-6 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <BrainCircuit className="opacity-90" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">AI Tools — Explorer</h1>
              <div className="text-xs opacity-70 hidden sm:block">Browse public AI tools by category. Click a card for details — copy or download JSON.</div>
            </div>
          </div>
        </div>

        {/* Search and controls (mobile compact) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form
            onSubmit={(e) => e.preventDefault()}
            className={clsx("flex items-center gap-2 w-full sm:w-[560px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}
            role="search"
            aria-label="Search AI tools"
          >
            <Search className="opacity-60" />
            <Input
              placeholder="Search AI by name, description, or tag"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              aria-label="Search AI tools"
            />

            {/* mobile sheet trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="ml-1 md:hidden p-2"><Menu className="cursor-pointer" /></Button>
              </SheetTrigger>

              <SheetContent side="left" className="p-2">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <LayersStackLike />
                      <div className="text-sm font-semibold">Categories</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setQuery(""); showToast("success", "Search cleared"); }}><RefreshCw /></Button>
                    </div>
                  </div>

                  <Separator />

                  <ScrollArea style={{ height: "68vh" }} className="mt-3">
                    <div className="space-y-2">
                      {CATEGORIES.map((cat) => {
                        const ActiveIcon = cat.Icon;
                        const count = (aisByCategory[cat.id] || []).length;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => { setSelectedCategory(cat.id); setSheetOpen(false); }}
                            className={clsx("w-full text-left p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 flex items-center gap-3 cursor-pointer", selectedCategory === cat.id ? "ring-1 ring-primary/40 bg-primary/5" : "")}
                          >
                            <div className={clsx("rounded-md flex items-center justify-center text-sm shrink-0", isDark ? "bg-black/30 border border-zinc-800 text-zinc-100" : "bg-white/70 border border-zinc-200 text-zinc-900")} style={{ width: 44, height: 44 }}>
                              <ActiveIcon />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium w-30 truncate">{cat.label}</div>
                              <div className="text-xs opacity-60">{count} AI Tools</div>
                            </div>
                            <div>
                              <Badge variant="outline" className="cursor-default">{count}</Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </form>
        </div>
      </header>

      {/* Categories chip bar (mobile) */}
      <div className="block sm:hidden mb-4">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 px-2 py-1">
            {CATEGORIES.slice(0, 8).map((cat) => {
              const IconComp = cat.Icon;
              const count = (aisByCategory[cat.id] || []).length;
              const isActive = selectedCategory === cat.id;

              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap cursor-pointer transition-all backdrop-blur-lg border shadow-sm",
                    isActive
                      ? "bg-primary/15 border-primary/30 text-primary-700 dark:text-primary-300"
                      : "bg-white/20 dark:bg-zinc-900/30 border-zinc-300/40 dark:border-zinc-700/40 text-zinc-800 dark:text-zinc-200 hover:bg-white/30 dark:hover:bg-zinc-900/40"
                  )}
                >
                  <IconComp className="opacity-80 w-4 h-4" />
                  <span className="font-medium truncate max-w-[120px]">
                    {cat.label}
                  </span>

                  <span
                    className={clsx(
                      "text-xs px-2 py-0.5 rounded-md border backdrop-blur-md",
                      isActive
                        ? "bg-primary/20 border-primary/30 text-primary-700 dark:text-primary-200"
                        : "bg-white/30 dark:bg-black/30 border-zinc-300/40 dark:border-zinc-700/40 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>


      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Desktop sidebar */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-3 h-fit", surface)}>
          <div className={clsx("rounded-xl border p-3", panelBg)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="opacity-80" />
                <div>
                  <div className="text-sm font-semibold">Categories</div>
                  <div className="text-xs opacity-60">Browse by use case</div>
                </div>
              </div>
              <div>
                <Button variant="ghost" size="sm" onClick={refreshCategory}><RefreshCw /></Button>
              </div>
            </div>

            <ScrollArea style={{ height: 520 }} className="m-2 ">
              <div className="space-y-2">
                {CATEGORIES.map((cat) => {
                  const IconComp = cat.Icon;
                  const count = (aisByCategory[cat.id] || []).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={clsx(
                        "w-full text-left p-3 rounded-md flex items-center gap-3 cursor-pointer transition",
                        selectedCategory === cat.id ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <div className={clsx("rounded-md flex items-center justify-center text-sm shrink-0", isDark ? "bg-black/30 border border-zinc-800 text-zinc-100" : "bg-white/70 border border-zinc-200 text-zinc-900")} style={{ width: 44, height: 44 }}>
                        <IconComp />
                      </div>

                      <div className=" min-w-0">
                        <div className="font-medium w-40 truncate">{cat.label}</div>
                        <div className="text-xs opacity-60">{count} AI Tools</div>
                      </div>

                      <Badge variant="outline" className="cursor-default">{count}</Badge>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { setSelectedCategory("image-gen"); showToast("success", "Switched to Image Generation"); }}>Popular: Image Gen</Button>
              <Button variant="ghost" className="w-full cursor-pointer" onClick={() => { setQuery(""); setSelectedCategory("image-gen"); showToast("info", "Reset filters"); }}>Reset</Button>
            </div>
          </div>
        </aside>

        {/* Center: Cards grid */}
        <section className={clsx("lg:col-span-6 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", surface)}>
            <CardHeader className={clsx("p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", panelBg)}>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  {(() => {
                    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
                    const IconComp = cat?.Icon ?? BrainCircuit;
                    return <><IconComp className="opacity-80" /> <span>{CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? "Category"}</span></>;
                  })()}
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-2 mt-1">
                  <Star className="opacity-60" />
                  <span>{allAisForSelected.length} AI Tools</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{selectedCategory}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { setQuery(""); showToast("info", "Search cleared"); }} className="cursor-pointer" title="Clear search"><X /></Button>
                <Button variant="outline" className="cursor-pointer" onClick={() => refreshCategory()}><RefreshCw /> <span className="hidden sm:inline ml-2">Refresh</span></Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 h-140 overflow-y-auto no-scrollbar ">
              {allAisForSelected.length === 0 ? (
                <div className="py-12 text-center text-sm opacity-60">No AI tools found in this category.</div>
              ) : (
                <div className={clsx("grid  gap-4 grid-cols-1 sm:grid-cols-2")}>
                  {allAisForSelected.map((ai, idx) => (
                    <motion.div
                      key={`${ai.name}_${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
                      className="rounded-2xl overflow-hidden border hover:shadow-lg transition cursor-pointer bg-transparent"
                      onClick={() => openAiDetails(ai)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") openAiDetails(ai); }}
                    >
                      <div className="p-4 flex flex-col h-full">
                        <div className="flex items-start flex-col justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <BrainCircuit className="opacity-70" />
                              <div className="text-sm font-semibold truncate">{ai.name}</div>
                            </div>
                            <div className="text-xs opacity-60 mt-2 line-clamp-3">{ai.description}</div>
                          </div>

                          <div className="ml-3 flex flex-row flex-wrap items-start  gap-2">
                            <span className={clsx("px-2 py-1 text-xs rounded-md border", badgeColorClass("pricing", ai.pricing))}>Price:{ai.pricing ?? "Unknown"}</span>
                            <span className={clsx("px-2 py-1 text-xs rounded-md border", badgeColorClass("featured", ai.featured))}>{ai.featured ? "Featured" : "Standard"}</span>
                            <span className={clsx("px-2 py-1 text-xs rounded-md border", badgeColorClass("tags", ai.tags?.[0]))}>Tag:{ai.tags?.[0] ?? "General"}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openAiDetails(ai); }} className="cursor-pointer"><List /> Details</Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); window.open(ai.website, "_blank"); }} className="cursor-pointer"><ExternalLink /> Open</Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(ai.website); showToast("success", "Website copied"); }} className="cursor-pointer"><Copy /></Button>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadAiJson(ai); }} className="cursor-pointer"><Download /></Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions & developer info */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-3 h-fit", surface)}>
          <div className={clsx("p-4 rounded-xl border space-y-3", panelBg)}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">Quick actions</div>
                <div className="text-xs opacity-60 mt-1">Exports, links & toggles</div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { setSelectedCategory("image-gen"); showToast("success", "Switched to Image Generation"); }}>Popular: Image Gen</Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { setQuery(""); setSelectedCategory("image-gen"); showToast("info", "Reset filters"); }}>Reset filters</Button>
              <Button variant="ghost" className="w-full cursor-pointer" onClick={() => setDialogOpen(true)}><List /> Open last details</Button>
            </div>

            <Separator className="my-3" />

            <div>
              <div className="text-sm font-semibold">Developer</div>
              <div className="text-xs opacity-60 mt-1">This is a static demo page — in production fetch a curated AI index and dynamic icons/counts.</div>
              <div className="mt-2 text-xs break-words">Example fetch: <code className="text-xs">/api/ai-tools?category=image-gen</code></div>
            </div>
          </div>
        </aside>
      </main>

      {/* AI Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
        <DialogContent
          className={clsx(
            "max-w-3xl w-full p-0 rounded-2xl overflow-hidden backdrop-blur-xl border",
            isDark
              ? "bg-black/60 border-zinc-800 shadow-[0_0_25px_rgba(255,255,255,0.05)]"
              : "bg-white border-zinc-200 shadow-xl"
          )}
        >
          {/* Header */}
          <div
            className={clsx(
              "px-5 py-4 border-b flex items-center gap-3",
              isDark ? "border-zinc-800 bg-black/40" : "border-zinc-200 bg-white/60"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  "p-2 rounded-xl backdrop-blur-md",
                  isDark ? "bg-zinc-900/60 border border-zinc-800" : "bg-zinc-100/50 border border-zinc-200"
                )}
              >
                <BrainCircuit className="w-5 h-5 opacity-80" />
              </div>

              <div className="flex flex-col">
                <span className="font-semibold text-lg">
                  {selectedAi?.name || "AI Tool Details"}
                </span>
                <span className="text-xs opacity-60 flex items-center gap-1">
                  <Star className="w-3 h-3 opacity-60" />
                  {selectedAi?.description || "Select an AI tool to view metadata"}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div
            className={clsx(
              "px-5 py-4 overflow-y-auto",
              isDark ? "text-zinc-300" : "text-zinc-700"
            )}
            style={{ maxHeight: "70vh" }}
          >
            {selectedAi ? (
              <>
                {/* Top Section */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="space-y-2">
                    <p className="text-sm opacity-70">{selectedAi.description}</p>

                    {/* BADGES */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-md border text-xs font-medium backdrop-blur-md",
                           badgeColorClass("pricing", selectedAi.pricing)
                        )}
                      >
                        Pricing: {selectedAi.pricing ?? "Unknown"}
                      </span>

                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-md border text-xs font-medium backdrop-blur-md",
                           badgeColorClass("featured", selectedAi.featured)
                        )}
                      >
                        {selectedAi.featured ? "Featured" : "Standard"}
                      </span>
                        {/* Display tags dynamically */}
                        {selectedAi.tags?.map((tag, tagIdx) => (
                            <span
                                key={tagIdx}
                                className={clsx(
                                    "px-2.5 py-1 rounded-md border text-xs font-medium backdrop-blur-md",
                                    badgeColorClass("tags", tag)
                                )}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex cursor-pointer items-center gap-2"
                      onClick={() => selectedAi?.website && window.open(selectedAi.website, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Website
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Metadata Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3 font-semibold text-sm">
                    <FileText className="w-4 h-4" />
                    Metadata
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Name", value: selectedAi.name },
                      { label: "Pricing Model", value: selectedAi.pricing ?? "Unknown" },
                      { label: "Featured Tool", value: selectedAi.featured ? "Yes" : "No" },
                      { label: "Category", value: CATEGORIES.find(c => c.id === selectedCategory)?.label ?? "Unknown" }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          "p-3 rounded-xl border backdrop-blur-md",
                          isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white/50 border-zinc-200"
                        )}
                      >
                        <div className="text-xs opacity-60">{item.label}</div>
                        <div className="font-medium">{item.value}</div>
                      </div>
                    ))}

                    {/* Website full width */}
                    <div
                      className={clsx(
                        "p-3 rounded-xl border sm:col-span-2 backdrop-blur-md",
                        isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white/50 border-zinc-200"
                      )}
                    >
                      <div className="text-xs opacity-60">Website URL</div>
                      <div className="text-sm break-words">{selectedAi.website}</div>
                    </div>

                    {/* Tags full width */}
                    <div
                      className={clsx(
                        "p-3 rounded-xl border sm:col-span-2 backdrop-blur-md",
                        isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white/50 border-zinc-200"
                      )}
                    >
                      <div className="text-xs opacity-60 mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedAi.tags?.map((tag, tagIdx) => (
                             <Badge
                                key={tagIdx}
                                variant="secondary"
                                className={clsx(
                                    "px-2.5 py-1 text-xs font-medium backdrop-blur-md",
                                    badgeColorClass("tags", tag)
                                )}
                              >
                                {tag}
                              </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />
              </>
            ) : (
              <div className="py-10 text-center text-sm opacity-50">
                No AI tool selected.
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter
            className={clsx(
              "px-5 py-3 border-t flex justify-between items-center backdrop-blur-xl",
              isDark ? "border-zinc-800 bg-black/40" : "border-zinc-200 bg-white/60"
            )}
          >
            <span className="text-xs opacity-60">AI Tools — Card view</span>

            <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/* ---------- Small helper: placeholder icon used in mobile sheet header ---------- */
function LayersStackLike() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80" aria-hidden>
      <rect x="3" y="6" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="7" y="2" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}