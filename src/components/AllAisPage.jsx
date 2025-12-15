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
  BookOpenCheck,
  Wrench,
  CpuIcon,
  ImageDown,
  PercentDiamondIcon,
  Images,
  MicVocalIcon,
  Music3,
  Megaphone,
  Sparkles,
  GraduationCap,
  MountainSnowIcon, // For General AI
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
{ id: "customerSupport", label: "Customer Support AI", Icon: Headset },
{ id: "developer", label: "Developer Tools", Icon: Wrench },
{ id: "image-models", label: "Image Models", Icon: CpuIcon },
{ id: "image-services", label: "Image Services & Tools", Icon: ImageDown },
{ id: "graphic-design", label: "Graphic Design", Icon: PercentDiamondIcon },
{ id: "image-libraries", label: "Image Libraries", Icon: Images },
{ id: "model-libraries", label: "Model Libraries", Icon: Database },
{ id: "sd-resources", label: "Stable Diffusion Resources", Icon: Layers },
{ id: "voice", label: "AI Voice & Cloning", Icon: MicVocalIcon },
{ id: "ai-music", label: "AI Music Generation", Icon: Music3 },
{ id: "marketing", label: "Marketing AI Tools", Icon: Megaphone },
{ id: "phone", label: "AI Phone Calls", Icon: Phone },
{ id: "speech", label: "Speech & Voice AI", Icon: Mic },
{ id: "other", label: "Other AI Tools", Icon: Sparkles },
{ id: "learning", label: "Learning Resources", Icon: BookOpen },
{ id: "ai_free", label: "Learn AI (Free)", Icon: GraduationCap },
{ id: "deep_learning", label: "Deep learning", Icon: MountainSnowIcon },
{ id: "nvidia", label: "NVIDIA Platform Extensions", Icon: Cpu },
{ id: "awesome", label: "Related Awesome Lists", Icon: Star },







];

/* ---------- Sample AI data ---------- */
const SAMPLE_AIS = {
  nvidia: [
  {
    name: "NVIDIA Omniverse AI Animal Explorer",
    description:
      "An Omniverse extension that enables creators to rapidly prototype and generate AI-powered 3D animal meshes.",
    website:
      "https://docs.omniverse.nvidia.com/extensions/latest/ext_animal-explorer.html#installation",
    pricing: "Free",
    tags: ["nvidia", "omniverse", "3d", "generative-ai"],
    featured: false,
  },
],

  awesome: [
  {
    name: "Altern",
    description: "A curated platform to discover and compare the best AI tools.",
    website: "https://altern.ai",
    pricing: "Free",
    tags: ["ai-tools", "directory"],
    featured: true,
  },
  {
    name: "Best of AI",
    description:
      "A Michelin-style curated list highlighting the highest-quality AI tools and products.",
    website: "https://github.com/best-of-ai/best-of-ai",
    pricing: "Free",
    tags: ["ai", "curated", "tools"],
    featured: true,
  },
  {
    name: "Awesome AI Models",
    description:
      "A curated list of top AI models and large language models used in research and production.",
    website: "https://github.com/dariubs/awesome-ai-models",
    pricing: "Free",
    tags: ["ai-models", "llms", "research"],
    featured: false,
  },
  {
    name: "Top AI Directories",
    description:
      "An extensive list of AI directories where developers can submit and discover AI tools.",
    website: "https://github.com/best-of-ai/ai-directories",
    pricing: "Free",
    tags: ["ai", "directories", "marketing"],
    featured: false,
  },
],



  "deep_learning": [
  {
    name: "Neural Networks for Machine Learning (Hinton)",
    description:
      "Legendary deep learning lectures by Geoffrey Hinton, still referenced widely despite being removed from Coursera.",
    website: "https://medium.com/kaggle-blog",
    pricing: "Free",
    tags: ["deep-learning", "neural-networks", "theory"],
    featured: false,
  },
  {
    name: "Fast.ai Courses",
    description:
      "Hands-on deep learning courses focused on practical results, with all content freely available online.",
    website: "https://www.fast.ai/",
    pricing: "Free",
    tags: ["deep-learning", "practical", "fastai"],
    featured: true,
  },
  {
    name: "Coursera Deep Learning Specialization Notes",
    description:
      "Community-maintained notes, assignments, and quizzes from the Deep Learning specialization by DeepLearning.AI.",
    website:
      "https://github.com/pratham5368/coursera-deep-learning-specialization",
    pricing: "Free",
    tags: ["deep-learning", "notes", "assignments"],
    featured: false,
  },
  {
    name: "PyTorch Learning Notes",
    description:
      "Well-organized PyTorch notes with examples, optimized for Google Colab and hands-on learning.",
    website:
      "https://github.com/pratham5368/Tecnologies-I-Learn/tree/main/31-pytorch",
    pricing: "Free",
    tags: ["pytorch", "deep-learning", "hands-on"],
    featured: false,
  },
],


  "ai_free": [
  {
    name: "Machine Learning Roadmap",
    description:
      "A structured roadmap connecting key machine learning concepts, tools, and resources from beginner to advanced levels.",
    website: "https://github.com/mrdbourke/machine-learning-roadmap",
    pricing: "Free",
    tags: ["machine-learning", "roadmap", "beginner"],
    featured: true,
  },
  {
    name: "Andrew Ng’s Machine Learning",
    description:
      "A foundational machine learning course covering supervised and unsupervised learning, widely considered a classic.",
    website: "https://www.coursera.org/learn/machine-learning",
    pricing: "Free",
    tags: ["machine-learning", "foundations", "coursera"],
    featured: true,
  },
  {
    name: "Sebastian Thrun’s Intro to Machine Learning",
    description:
      "A practical introduction to machine learning concepts that also serves as the base for Udacity’s Data Analyst path.",
    website: "https://www.udacity.com/course/intro-to-machine-learning--ud120",
    pricing: "Free",
    tags: ["machine-learning", "udacity", "practical"],
    featured: false,
  },
  {
    name: "AI & ML Roadmaps (Scaler)",
    description:
      "Curated roadmaps highlighting essential AI and ML concepts along with recommended learning paths and tools.",
    website:
      "https://www.scaler.com/blog/category/artificial-intelligence-machine-learning/",
    pricing: "Free",
    tags: ["ai", "machine-learning", "roadmap"],
    featured: false,
  },
  {
    name: "How to Learn Artificial Intelligence",
    description:
      "A step-by-step beginner-friendly guide covering programming, math, ML, deep learning, and neural networks.",
    website:
      "https://www.appliedaicourse.com/blog/how-to-learn-artificial-intelligence-ai/",
    pricing: "Free",
    tags: ["ai", "beginners", "learning-path"],
    featured: false,
  },
],


  learning: [
  {
    name: "Learn Prompting",
    description:
      "A free, open-source curriculum focused on teaching effective communication with AI systems through prompt engineering techniques.",
    website: "https://learnprompting.org/",
    pricing: "Free",
    tags: ["prompt-engineering", "llms", "beginner", "open-source"],
    featured: true,
  },
  {
    name: "Prompt Engineering Guide",
    description:
      "Comprehensive guide and curated resources covering prompt engineering patterns, techniques, and best practices.",
    website: "https://github.com/dair-ai/Prompt-Engineering-Guide",
    pricing: "Free",
    tags: ["prompt-engineering", "research", "llms", "github"],
    featured: true,
  },
  {
    name: "ChatGPT Prompt Engineering for Developers",
    description:
      "Hands-on short course by OpenAI and DeepLearning.AI covering structured prompting, system messages, and practical AI workflows.",
    website:
      "https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/",
    pricing: "Free",
    tags: ["prompt-engineering", "developers", "openai", "course"],
    featured: true,
  },
  {
    name: "OpenAI Cookbook",
    description:
      "Official collection of examples, guides, and best practices for building applications using the OpenAI API.",
    website: "https://github.com/openai/openai-cookbook",
    pricing: "Free",
    tags: ["openai", "api", "developers", "examples"],
    featured: true,
  },
  {
    name: "Robert Miles – AI Safety",
    description:
      "Educational YouTube channel explaining AI alignment, existential risks, and safety concerns in an accessible way.",
    website: "https://www.youtube.com/@RobertMilesAI",
    pricing: "Free",
    tags: ["ai-safety", "ethics", "youtube", "research"],
    featured: false,
  },
]
,
  other: [
  {
    name: "Taranify",
    description:
      "AI-powered recommendation engine that suggests Spotify playlists, Netflix shows, books, and even food based on your mood and preferences.",
    website: "https://www.taranify.com",
    pricing: "Free",
    tags: ["recommendation", "entertainment", "lifestyle"],
    featured: true,
  },
  {
    name: "Diagram",
    description:
      "AI-first design platform that introduces magical workflows for product design, UI exploration, and rapid ideation.",
    website: "https://diagram.com/",
    pricing: "Freemium",
    tags: ["design", "ui-ux", "product"],
    featured: true,
  },
  {
    name: "PromptBase",
    description:
      "Marketplace for buying and selling high-quality prompts for models like GPT, DALL·E, Midjourney, and Stable Diffusion.",
    website: "https://promptbase.com/",
    pricing: "Paid",
    tags: ["prompts", "marketplace", "creators"],
    featured: true,
  },
  {
    name: "This Image Does Not Exist",
    description:
      "Fun AI experiment that challenges users to distinguish between human-created and AI-generated images.",
    website: "https://thisimagedoesnotexist.com/",
    pricing: "Free",
    tags: ["gan", "images", "experiment"],
    featured: false,
  },
  {
    name: "Have I Been Trained?",
    description:
      "Tool that allows artists to check whether their images were used in the training of popular AI art models.",
    website: "https://haveibeentrained.com/",
    pricing: "Free",
    tags: ["ethics", "ai-training", "artists"],
    featured: true,
  },
  {
    name: "AI Dungeon",
    description:
      "AI-powered interactive storytelling and role-playing game where the narrative evolves dynamically based on your choices.",
    website: "https://aidungeon.io/",
    pricing: "Freemium",
    tags: ["gaming", "storytelling", "creative-writing"],
    featured: true,
  },
  {
    name: "Clickable",
    description:
      "Generate brand-consistent, high-converting ad creatives instantly using AI for all major marketing channels.",
    website: "https://www.clickable.so/",
    pricing: "Paid",
    tags: ["marketing", "ads", "copywriting"],
    featured: true,
  },
  {
    name: "Scale Spellbook",
    description:
      "Platform for building, evaluating, and deploying large language model applications with enterprise-grade tooling.",
    website: "https://scale.com/spellbook",
    pricing: "Paid",
    tags: ["llm", "enterprise", "evaluation"],
    featured: false,
  },
  {
    name: "Scenario",
    description:
      "Generate high-quality AI-powered game assets including characters, props, and environments.",
    website: "https://www.scenario.com/",
    pricing: "Paid",
    tags: ["gaming", "assets", "image-generation"],
    featured: true,
  },
  {
    name: "Teleprompter",
    description:
      "On-device AI assistant for meetings that listens in real time and suggests concise, charismatic talking points.",
    website: "https://github.com/danielgross/teleprompter",
    pricing: "Free",
    tags: ["meetings", "productivity", "open-source"],
    featured: false,
  },
  {
    name: "FinChat",
    description:
      "AI-powered financial assistant that answers questions about public companies, earnings, and investors.",
    website: "https://finchat.io/",
    pricing: "Freemium",
    tags: ["finance", "stocks", "research"],
    featured: true,
  },
  {
    name: "Petals",
    description:
      "Distributed system for running large AI models collaboratively, inspired by BitTorrent-style architecture.",
    website: "https://github.com/bigscience-workshop/petals",
    pricing: "Free",
    tags: ["distributed-ai", "open-source", "research"],
    featured: false,
  },
  {
    name: "Shotstack Workflows",
    description:
      "No-code automation platform for building scalable generative AI video and media workflows.",
    website: "https://shotstack.io/product/workflows/",
    pricing: "Paid",
    tags: ["video", "automation", "no-code"],
    featured: false,
  },
  {
    name: "GummySearch",
    description:
      "AI-driven Reddit research tool to discover customer pain points, sentiment, and product opportunities.",
    website: "https://gummysearch.com/",
    pricing: "Paid",
    tags: ["market-research", "reddit", "startups"],
    featured: true,
  },
  {
    name: "Taplio",
    description:
      "All-in-one AI-powered LinkedIn growth tool for content creation, scheduling, analytics, and lead generation.",
    website: "https://taplio.com/",
    pricing: "Paid",
    tags: ["linkedin", "social-media", "marketing"],
    featured: true,
  },
  {
    name: "Napkin",
    description:
      "Turns written ideas into clear visuals and diagrams, making communication fast and effective.",
    website: "https://www.napkin.ai/",
    pricing: "Freemium",
    tags: ["visuals", "communication", "diagrams"],
    featured: true,
  },
  {
    name: "Interview Solver",
    description:
      "AI copilot that helps candidates solve problems and perform better during live coding interviews.",
    website: "https://interviewsolver.com",
    pricing: "Paid",
    tags: ["interviews", "coding", "career"],
    featured: true,
  },
  {
    name: "Hyperbrowser",
    description:
      "Advanced browser infrastructure for AI agents with automation, proxy handling, captcha solving, and session recording.",
    website: "https://hyperbrowser.ai/",
    pricing: "Paid",
    tags: ["automation", "ai-agents", "infrastructure"],
    featured: true,
  },
  {
    name: "Bricks",
    description:
      "AI-native spreadsheet platform that reimagines spreadsheets with natural language intelligence.",
    website: "https://www.thebricks.com/",
    pricing: "Freemium",
    tags: ["spreadsheets", "productivity", "business"],
    featured: true,
  },
  {
    name: "MindStudio",
    description:
      "Visual no-code platform to build powerful AI agents for personal, team, and enterprise use cases.",
    website: "https://mindstudio.ai/",
    pricing: "Freemium",
    tags: ["ai-agents", "no-code", "automation"],
    featured: true,
  },
]
,

  speech: [
  {
    name: "ElevenLabs",
    description:
      "State-of-the-art AI voice generator with realistic text-to-speech and voice cloning.",
    website: "https://beta.elevenlabs.io/",
    pricing: "Freemium",
    tags: ["tts", "voice-cloning", "speech"],
    featured: true,
  },
  {
    name: "Resemble AI",
    description:
      "Advanced AI voice synthesis and cloning platform for real-time text-to-speech.",
    website: "https://www.resemble.ai/",
    pricing: "Paid",
    tags: ["voice", "tts", "cloning"],
    featured: true,
  },
  {
    name: "Play.ht",
    description:
      "AI voice generator for creating natural-sounding audio from text.",
    website: "https://play.ht/",
    pricing: "Freemium",
    tags: ["text-to-speech", "audio", "content"],
    featured: false,
  },
  {
    name: "Coqui",
    description:
      "Open-source generative AI platform for speech synthesis and voice applications.",
    website: "https://coqui.ai/",
    pricing: "Free",
    tags: ["open-source", "speech", "tts"],
    featured: false,
  },
  {
    name: "Bark",
    description:
      "Open-source transformer-based text-to-audio model supporting music, speech, and sound effects.",
    website: "https://github.com/suno-ai/bark",
    pricing: "Free",
    tags: ["open-source", "audio", "tts"],
    featured: true,
  },
  {
    name: "EKHOS AI",
    description:
      "AI-powered speech-to-text platform with real-time transcription and proofreading.",
    website: "https://ekhos.ai",
    pricing: "Paid",
    tags: ["speech-to-text", "transcription", "audio"],
    featured: false,
  },
]
,phone: [
  {
    name: "AICaller.io",
    description:
      "Automated AI calling platform for lead qualification, surveys, and data collection with API support.",
    website: "https://aicaller.io/",
    pricing: "Freemium",
    tags: ["voice-ai", "calling", "automation", "api"],
    featured: true,
  },
  {
    name: "DialLink AI Voice Agents",
    description:
      "AI voice agents for handling business calls and routine tasks via cloud phone systems.",
    website: "https://diallink.com/",
    pricing: "Paid",
    tags: ["voice-agents", "business", "calls"],
    featured: false,
  },
  {
    name: "Cald.ai",
    description:
      "AI-based inbound and outbound calling agents for sales and customer support.",
    website: "https://cald.ai",
    pricing: "Paid",
    tags: ["calling", "sales", "support"],
    featured: false,
  },
  {
    name: "Rosie",
    description:
      "AI-powered phone answering service designed for small businesses.",
    website: "https://heyrosie.com/",
    pricing: "Paid",
    tags: ["phone", "assistant", "customer-support"],
    featured: false,
  },
]
,
  marketing: [
  {
    name: "Jasper AI",
    description:
      "AI-powered marketing content platform for blogs, emails, ads, and brand-focused copy generation.",
    website: "https://www.jasper.ai/",
    pricing: "Paid",
    tags: ["marketing", "content", "copywriting", "branding"],
    featured: true,
  },
  {
    name: "Mutiny",
    description:
      "AI personalization platform that optimizes website experiences to increase B2B conversion rates.",
    website: "https://www.mutinyhq.com/",
    pricing: "Paid",
    tags: ["personalization", "conversion", "b2b", "website"],
    featured: true,
  },
  {
    name: "Clearbit",
    description:
      "Lead enrichment and data intelligence platform providing firmographic and demographic insights.",
    website: "https://clearbit.com/",
    pricing: "Paid",
    tags: ["leads", "data", "sales", "enrichment"],
    featured: true,
  },
  {
    name: "Seventh Sense",
    description:
      "AI-driven email optimization tool that predicts the best send time for higher engagement.",
    website: "https://www.theseventhsense.com/",
    pricing: "Paid",
    tags: ["email", "optimization", "engagement"],
    featured: false,
  },
  {
    name: "Smartly.io",
    description:
      "End-to-end automation platform for creating, managing, and optimizing social media advertising.",
    website: "https://www.smartly.io/",
    pricing: "Paid",
    tags: ["ads", "social-media", "automation"],
    featured: true,
  },
  {
    name: "Adzooma",
    description:
      "AI-powered PPC campaign management platform for Google, Facebook, and Microsoft Ads.",
    website: "https://www.adzooma.com/",
    pricing: "Freemium",
    tags: ["ppc", "ads", "optimization"],
    featured: false,
  },
  {
    name: "Phrasee",
    description:
      "Generates high-performing marketing copy using AI trained on brand language and tone.",
    website: "https://www.phrasee.co/",
    pricing: "Paid",
    tags: ["copywriting", "email", "branding"],
    featured: false,
  },
  {
    name: "MarketMuse",
    description:
      "AI-powered SEO and content intelligence platform for content planning and optimization.",
    website: "https://www.marketmuse.com/",
    pricing: "Freemium",
    tags: ["seo", "content", "optimization"],
    featured: true,
  },
  {
    name: "Chatfuel",
    description:
      "AI chatbot platform for automating customer engagement on Messenger and websites.",
    website: "https://www.chatfuel.com/",
    pricing: "Freemium",
    tags: ["chatbot", "customer-support", "automation"],
    featured: false,
  },
  {
    name: "LogicBalls",
    description:
      "All-in-one AI writing assistant to generate marketing, social, and business content.",
    website: "https://logicballs.com/",
    pricing: "Freemium",
    tags: ["writing", "productivity", "marketing"],
    featured: false,
  },
  {
    name: "PersonaForce",
    description:
      "Create, analyze, and chat with AI-generated buyer personas for smarter marketing decisions.",
    website: "https://personaforce.ai/",
    pricing: "Paid",
    tags: ["personas", "strategy", "b2b"],
    featured: false,
  },
  {
    name: "Keyla.AI",
    description:
      "AI-powered platform to create high-converting video ads in minutes.",
    website: "https://keyla.ai/",
    pricing: "Paid",
    tags: ["video", "ads", "creative"],
    featured: true,
  },
]
,
 "ai-music": [
  {
    name: "AIVA",
    description:
      "AI composer specializing in cinematic, orchestral, and classical music for film and games.",
    website: "https://www.aiva.ai",
    pricing: "Paid",
    tags: ["music", "composition", "cinematic"],
    featured: true,
  },
  {
    name: "Mubert",
    description:
      "Generates royalty-free music in real time, tailored to different moods and use cases.",
    website: "https://www.mubert.com",
    pricing: "Freemium",
    tags: ["music", "generative", "royalty-free"],
    featured: true,
  },
  {
    name: "Soundraw",
    description:
      "Customizable AI music generator allowing users to fine-tune mood, genre, and structure.",
    website: "https://soundraw.io",
    pricing: "Paid",
    tags: ["music", "customization", "creators"],
    featured: false,
  },
  {
    name: "Boomy",
    description:
      "Create, release, and monetize AI-generated music tracks with minimal effort.",
    website: "https://www.boomy.com",
    pricing: "Freemium",
    tags: ["music", "creation", "monetization"],
    featured: false,
  },
  {
    name: "Soundful",
    description:
      "High-quality, royalty-free AI-generated music designed for content creators and brands.",
    website: "https://www.soundful.com",
    pricing: "Paid",
    tags: ["music", "royalty-free", "branding"],
    featured: false,
  },
]
,
  voice: [
  {
    name: "ElevenLabs",
    description:
      "Industry-leading AI voice synthesis and cloning platform known for ultra-realistic voices and emotion modeling.",
    website: "https://elevenlabs.io/",
    pricing: "Freemium",
    tags: ["voice", "cloning", "tts", "emotion"],
    featured: true,
  },
  {
    name: "Descript Overdub",
    description:
      "Voice cloning tool seamlessly integrated into Descript for fast voiceovers and audio editing workflows.",
    website: "https://www.descript.com/overdub",
    pricing: "Paid",
    tags: ["voice", "editing", "content-creation"],
    featured: false,
  },
  {
    name: "Respeecher",
    description:
      "Professional-grade voice cloning widely used in film, TV, and gaming for emotion-rich performances.",
    website: "https://www.respeecher.com/",
    pricing: "Paid",
    tags: ["voice", "cloning", "entertainment", "studio"],
    featured: false,
  },
  {
    name: "Resemble AI",
    description:
      "Real-time voice synthesis and cloning platform offering extensive customization for developers and creatives.",
    website: "https://www.resemble.ai/",
    pricing: "Paid",
    tags: ["voice", "api", "real-time", "developers"],
    featured: false,
  },
  {
    name: "Murf AI",
    description:
      "User-friendly AI voiceover platform popular for ads, presentations, and marketing content.",
    website: "https://murf.ai/",
    pricing: "Freemium",
    tags: ["voice", "voiceover", "marketing"],
    featured: false,
  },
  {
    name: "Azure Neural TTS",
    description:
      "Enterprise-scale neural text-to-speech service with deep customization and cloud integration.",
    website:
      "https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/",
    pricing: "Paid",
    tags: ["voice", "enterprise", "tts", "cloud"],
    featured: false,
  },
  {
    name: "TTS WebUI",
    description:
      "Open-source generative AI application supporting 15+ text-to-speech models for voice and music.",
    website: "https://github.com/rsxdalv/tts-generation-webui",
    pricing: "Free",
    tags: ["voice", "open-source", "tts", "community"],
    featured: false,
  },
]
,

  "sd-resources": [
  {
    name: "Stable Horde",
    description:
      "Crowdsourced distributed network providing free Stable Diffusion image generation.",
    website: "https://stablehorde.net/",
    pricing: "Free",
    tags: ["stable-diffusion", "distributed", "open"],
    featured: true,
  },
  {
    name: "Public Prompts",
    description:
      "Large collection of high-quality, free prompts for Stable Diffusion and AI art generation.",
    website: "https://publicprompts.art/",
    pricing: "Free",
    tags: ["prompts", "stable-diffusion", "art"],
    featured: false,
  },
  {
    name: "Hugging Face Diffusion Models Course",
    description:
      "Hands-on Python course teaching diffusion models, training techniques, and Stable Diffusion internals.",
    website: "https://github.com/huggingface/diffusion-models-class",
    pricing: "Free",
    tags: ["education", "diffusion-models", "huggingface"],
    featured: true,
  },
]
,

  "model-libraries": [
  {
    name: "Civitai",
    description:
      "Community-driven platform for sharing Stable Diffusion models, LoRAs, checkpoints, and embeddings.",
    website: "https://civitai.com/",
    pricing: "Free",
    tags: ["models", "stable-diffusion", "community"],
    featured: true,
  },
  {
    name: "Stable Diffusion Models List",
    description:
      "Comprehensive curated list of Stable Diffusion checkpoints and resources hosted on rentry.org.",
    website: "https://rentry.org/sdmodels",
    pricing: "Free",
    tags: ["stable-diffusion", "models", "checkpoints"],
    featured: false,
  },
]
,

  "image-libraries": [
  {
    name: "Lexica",
    description:
      "Search engine for Stable Diffusion images and prompts, widely used for inspiration and prompt engineering.",
    website: "https://lexica.art/",
    pricing: "Free",
    tags: ["stable-diffusion", "prompts", "search"],
    featured: true,
  },
  {
    name: "Libraire",
    description:
      "One of the largest curated libraries of AI-generated images for creative exploration.",
    website: "https://libraire.ai/",
    pricing: "Free",
    tags: ["image-library", "ai-art", "inspiration"],
    featured: false,
  },
  {
    name: "KREA",
    description:
      "Explore millions of AI-generated images and prompts with real-time Stable Diffusion generation.",
    website: "https://www.krea.ai/",
    pricing: "Freemium",
    tags: ["stable-diffusion", "real-time", "prompts"],
    featured: true,
  },
  {
    name: "OpenArt",
    description:
      "Prompt search and AI image generation platform supporting Stable Diffusion and DALL·E.",
    website: "https://openart.ai/",
    pricing: "Freemium",
    tags: ["image-generation", "prompts", "stable-diffusion", "dalle"],
    featured: true,
  },
  {
    name: "Phygital",
    description:
      "Template-driven AI image generation and editing tool for both digital and physical designs.",
    website: "https://app.phygital.plus/",
    pricing: "Paid",
    tags: ["templates", "image-editing", "design"],
    featured: false,
  },
  {
    name: "Canva AI Image Generator",
    description:
      "Generate AI images directly inside Canva with seamless integration into design workflows.",
    website: "https://www.canva.com/ai-image-generator/",
    pricing: "Freemium",
    tags: ["design", "image-generation", "canva"],
    featured: true,
  },
]
,

  "graphic-design": [
  {
    name: "Brandmark",
    description:
      "AI-powered logo design platform that generates professional brand identities including logos, color palettes, and typography.",
    website: "https://brandmark.io/",
    pricing: "Paid",
    tags: ["logo", "branding", "design", "ai"],
    featured: true,
  },
  {
    name: "Gamma",
    description:
      "Create visually stunning presentations, documents, and webpages without manual formatting or design effort.",
    website: "https://gamma.app/",
    pricing: "Freemium",
    tags: ["presentations", "webpages", "design", "productivity"],
    featured: true,
  },
  {
    name: "Microsoft Designer",
    description:
      "AI-assisted design tool from Microsoft for creating social posts, banners, and marketing visuals instantly.",
    website: "https://designer.microsoft.com/",
    pricing: "Free",
    tags: ["design", "social-media", "marketing", "microsoft"],
    featured: false,
  },
  {
    name: "SVGStud.io",
    description:
      "AI-based SVG generation and semantic search tool for scalable vector graphics and illustrations.",
    website: "https://svgstud.io/",
    pricing: "Free",
    tags: ["svg", "vector", "illustrations", "ai"],
    featured: false,
  },
  {
    name: "Text2Infographic",
    description:
      "Turn plain text into professional infographics using AI-powered layouts and visual elements.",
    website: "https://text2infographic.com/",
    pricing: "Freemium",
    tags: ["infographics", "data-visualization", "design"],
    featured: false,
  },
  {
    name: "Seede.ai",
    description:
      "Poster and marketing creative generator that produces eye-catching designs in under a minute.",
    website: "https://seede.ai/",
    pricing: "Paid",
    tags: ["posters", "marketing", "design", "ai"],
    featured: false,
  },
  {
    name: "Magic Patterns",
    description:
      "AI-powered UI design tool that generates interface layouts with Figma export and React code support.",
    website: "https://www.magicpatterns.com/",
    pricing: "Freemium",
    tags: ["ui", "ux", "figma", "react", "design"],
    featured: true,
  },
]
,

  "image-services": [
  {
    name: "Canva",
    description:
      "All-in-one design platform with AI-powered image generation, editing, and branding tools.",
    website: "https://www.canva.com/",
    pricing: "Freemium",
    tags: ["design", "editing", "templates", "ai-tools"],
    featured: true,
  },
  {
    name: "Craiyon",
    description:
      "Formerly DALL·E mini, a lightweight AI tool that generates images from text prompts for free.",
    website: "https://www.craiyon.com/",
    pricing: "Free",
    tags: ["text-to-image", "free", "creative"],
    featured: false,
  },
  {
    name: "DreamStudio",
    description:
      "Official web interface for generating images using Stable Diffusion models by Stability AI.",
    website: "https://beta.dreamstudio.ai/",
    pricing: "Paid",
    tags: ["stable-diffusion", "official", "image-generation"],
    featured: true,
  },
  {
    name: "Artbreeder",
    description:
      "Collaborative creative platform that allows users to blend, remix, and evolve images using AI.",
    website: "https://www.artbreeder.com/",
    pricing: "Freemium",
    tags: ["creative", "collaboration", "art"],
    featured: false,
  },
  {
    name: "GauGAN2",
    description:
      "AI-powered tool for generating photorealistic images using text prompts and segmentation sketches.",
    website: "http://gaugan.org/gaugan2/",
    pricing: "Research",
    tags: ["sketch-to-image", "photorealism", "nvidia"],
    featured: false,
  },
  {
    name: "Magic Eraser",
    description:
      "Simple AI tool to remove unwanted objects from images within seconds.",
    website: "https://www.magiceraser.io/",
    pricing: "Freemium",
    tags: ["image-editing", "background-removal"],
    featured: false,
  },
  {
    name: "Playground AI",
    description:
      "Free AI-powered image creation platform for art, social media, posters, presentations, and more.",
    website: "https://playgroundai.com/",
    pricing: "Freemium",
    tags: ["design", "social-media", "image-generation"],
    featured: true,
  },
  {
    name: "PhotoRoom",
    description:
      "AI image editing app focused on background removal, product photos, and portrait enhancement.",
    website: "https://www.photoroom.com/",
    pricing: "Freemium",
    tags: ["photo-editing", "ecommerce", "background-removal"],
    featured: true,
  },
  {
    name: "Lensa",
    description:
      "Mobile-first AI photo editing app famous for personalized avatar generation using diffusion models.",
    website: "https://prisma-ai.com/lensa",
    pricing: "Paid",
    tags: ["avatars", "mobile", "photo-editing"],
    featured: true,
  },
  {
    name: "ClipDrop",
    description:
      "Professional AI-powered image editing suite by Stability AI for cleanup, relighting, and composition.",
    website: "https://clipdrop.co/",
    pricing: "Freemium",
    tags: ["editing", "stability-ai", "professional"],
    featured: true,
  },
  {
    name: "VectorArt.ai",
    description:
      "AI tool specialized in generating vector-based illustrations and scalable graphics.",
    website: "https://vectorart.ai",
    pricing: "Freemium",
    tags: ["vector", "illustration", "design"],
    featured: false,
  },
]
,
  "image-models": [
  {
    name: "DALL·E 2",
    description:
      "Text-to-image model by OpenAI capable of generating realistic images and artistic illustrations from natural language prompts.",
    website: "https://openai.com/dall-e-2/",
    pricing: "Paid",
    tags: ["image-generation", "text-to-image", "openai", "art"],
    featured: true,
  },
  {
    name: "Stable Diffusion",
    description:
      "State-of-the-art open-source text-to-image diffusion model by Stability AI, widely used for fine-tuning and custom image generation.",
    website: "https://huggingface.co/CompVis/stable-diffusion-v1-4",
    pricing: "Free",
    tags: ["open-source", "diffusion", "text-to-image", "research"],
    featured: true,
  },
  {
    name: "Midjourney",
    description:
      "High-quality proprietary image generation model known for cinematic, artistic, and highly stylized outputs.",
    website: "https://www.midjourney.com/",
    pricing: "Paid",
    tags: ["creative", "art", "diffusion", "premium"],
    featured: true,
  },
  {
    name: "Imagen",
    description:
      "Google’s advanced diffusion-based text-to-image model focused on photorealism and deep language understanding.",
    website: "https://imagen.research.google/",
    pricing: "Research",
    tags: ["google", "photorealism", "diffusion", "research"],
    featured: false,
  },
  {
    name: "Make-A-Scene",
    description:
      "Meta’s multimodal image generation model enabling creative control using text descriptions and freeform sketches.",
    website:
      "https://ai.facebook.com/blog/greater-creative-control-for-ai-image-generation/",
    pricing: "Research",
    tags: ["multimodal", "sketch-to-image", "meta", "research"],
    featured: false,
  },
  {
    name: "DragGAN",
    description:
      "Interactive GAN-based image manipulation technique allowing users to drag points to edit images realistically.",
    website: "https://github.com/XingangPan/DragGAN",
    pricing: "Free",
    tags: ["open-source", "gan", "image-editing", "research"],
    featured: false,
  },
]
,


  developer: [
  {
    name: "Ollama",
    description:
      "Run and manage large language models locally on your machine for development, experimentation, and private inference.",
    website: "https://ollama.com/",
    pricing: "Free",
    tags: ["llm", "local", "open-source", "inference", "developers"],
    featured: true,
  },
  {
    name: "Cohere",
    description:
      "Enterprise-grade NLP and LLM platform offering text generation, embeddings, classification, and multilingual support via APIs.",
    website: "https://cohere.ai/",
    pricing: "Paid",
    tags: ["nlp", "llm", "api", "enterprise"],
    featured: true,
  },
  {
    name: "LangChain",
    description:
      "Popular framework for building LLM-powered applications using chains, tools, agents, and memory.",
    website: "https://langchain.com/",
    pricing: "Free",
    tags: ["framework", "agents", "llm", "open-source"],
    featured: true,
  },
  {
    name: "LlamaIndex",
    description:
      "Data framework for connecting LLMs with external data sources like documents, APIs, and databases.",
    website: "https://www.llamaindex.ai/",
    pricing: "Freemium",
    tags: ["rag", "data", "llm", "framework"],
    featured: true,
  },
  {
    name: "Haystack",
    description:
      "Open-source framework for building production-ready NLP applications such as RAG pipelines, search, and QA systems.",
    website: "https://haystack.deepset.ai/",
    pricing: "Free",
    tags: ["nlp", "rag", "search", "open-source"],
    featured: false,
  },
  {
    name: "Langfuse",
    description:
      "Open-source LLM observability and analytics platform for tracing, debugging, and improving LLM applications.",
    website: "https://langfuse.com/",
    pricing: "Freemium",
    tags: ["llmops", "observability", "analytics", "open-source"],
    featured: true,
  },
  {
    name: "Phoenix (Arize)",
    description:
      "ML observability tool for monitoring, debugging, and fine-tuning LLM, CV, and tabular models.",
    website: "https://phoenix.arize.com/",
    pricing: "Free",
    tags: ["mlops", "observability", "llm", "open-source"],
    featured: false,
  },
  {
    name: "Portkey",
    description:
      "Full-stack LLMOps platform for managing prompts, monitoring usage, enforcing policies, and optimizing AI apps.",
    website: "https://portkey.ai/",
    pricing: "Paid",
    tags: ["llmops", "gateway", "monitoring", "api"],
    featured: true,
  },
  {
    name: "gpt4all",
    description:
      "Open-source ecosystem for running chat-oriented LLMs locally with privacy-first inference.",
    website: "https://github.com/nomic-ai/gpt4all",
    pricing: "Free",
    tags: ["open-source", "local", "chatbot", "llm"],
    featured: false,
  },
  {
    name: "LMQL",
    description:
      "Query language for LLMs that enables constrained decoding and programmatic control over generations.",
    website: "https://lmql.ai/",
    pricing: "Free",
    tags: ["llm", "query-language", "research"],
    featured: false,
  },
  {
    name: "Keploy",
    description:
      "Open-source platform that converts real user traffic into automated test cases and mocks.",
    website: "https://keploy.io/",
    pricing: "Free",
    tags: ["testing", "open-source", "devtools"],
    featured: false,
  },
  {
    name: "TensorZero",
    description:
      "Production-grade open-source framework unifying LLM gateways, observability, evaluations, and optimization.",
    website: "https://www.tensorzero.com/",
    pricing: "Free",
    tags: ["llmops", "open-source", "production"],
    featured: true,
  },
  {
    name: "Agenta",
    description:
      "Open-source LLMOps platform for prompt management, evaluation, experimentation, and monitoring.",
    website: "https://agenta.ai/",
    pricing: "Free",
    tags: ["llmops", "evaluation", "open-source"],
    featured: false,
  },
]
,


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
  {
    name: "RunwayML",
    description:
      "Advanced AI video creation suite offering text-to-video, video-to-video, precision editing, and real-time collaboration for creators and studios.",
    website: "https://runwayml.com/",
    pricing: "Paid",
    tags: ["video", "text-to-video", "editing", "creative", "studio"],
    featured: true,
  },
  {
    name: "Synthesia",
    description:
      "Create professional videos from plain text using AI avatars, widely adopted for training, onboarding, and corporate communication.",
    website: "https://www.synthesia.io/",
    pricing: "Paid",
    tags: ["video", "avatars", "text-to-video", "enterprise"],
    featured: true,
  },
  {
    name: "Rephrase AI",
    description:
      "Enterprise-grade platform for creating hyper-personalized AI videos at scale, optimized for marketing and customer engagement.",
    website: "https://www.rephrase.ai/",
    pricing: "Paid",
    tags: ["video", "personalization", "marketing", "enterprise"],
    featured: false,
  },
  {
    name: "Hour One",
    description:
      "Turn scripts into videos with lifelike virtual presenters, ideal for corporate content, learning, and product demos.",
    website: "https://hourone.ai/",
    pricing: "Paid",
    tags: ["video", "avatars", "text-to-video", "corporate"],
    featured: false,
  },
  {
    name: "D-ID",
    description:
      "Create and interact with talking avatars using images and text, enabling conversational and interactive video experiences.",
    website: "https://www.d-id.com/",
    pricing: "Freemium",
    tags: ["video", "avatars", "talking-heads", "interactive"],
    featured: true,
  },
  {
    name: "ShortVideoGen",
    description:
      "Generate short-form videos with audio using simple text prompts, optimized for social media platforms.",
    website: "https://shortgen.video/",
    pricing: "Free",
    tags: ["video", "short-form", "social-media", "text-to-video"],
    featured: false,
  },
  {
    name: "Clipwing",
    description:
      "Automatically transforms long-form videos into multiple short, engaging clips for social media distribution.",
    website: "https://clipwing.pro/",
    pricing: "Freemium",
    tags: ["video", "repurposing", "short-clips", "creators"],
    featured: false,
  },
  {
    name: "Recast Studio",
    description:
      "AI-powered podcast and video marketing assistant that converts long content into shareable highlights.",
    website: "https://recast.studio",
    pricing: "Paid",
    tags: ["video", "podcast", "marketing", "repurposing"],
    featured: false,
  },
  {
    name: "Based AI",
    description:
      "Intuitive AI-driven interface for rapid video creation, focused on simplicity and creator productivity.",
    website: "https://www.basedlabs.ai/",
    pricing: "Freemium",
    tags: ["video", "creative", "easy-to-use"],
    featured: false,
  },
  {
    name: "Kling AI",
    description:
      "AI creative studio offering high-quality image and video generation with cinematic motion capabilities.",
    website: "https://app.klingai.com/global/",
    pricing: "Freemium",
    tags: ["video", "image", "generation", "cinematic"],
    featured: true,
  },
  {
    name: "Sisif",
    description:
      "Text-to-video generator designed to quickly create visually engaging videos in seconds.",
    website: "https://sisif.ai/",
    pricing: "Freemium",
    tags: ["video", "text-to-video", "fast"],
    featured: false,
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

            <ScrollArea style={{ height: 520 }} className="p-2 ">
              <div className="space-y-2 overflow-hidden p-1 ">
                {CATEGORIES.map((cat) => {
                  const IconComp = cat.Icon;
                  const count = (aisByCategory[cat.id] || []).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={clsx(
                        "w-auto text-left p-3   rounded-md flex items-center gap-3 cursor-pointer transition",
                        selectedCategory === cat.id ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <div className={clsx("rounded-md flex items-center justify-center text-sm shrink-0", isDark ? "bg-black/30 border border-zinc-800 text-zinc-100" : "bg-white/70 border border-zinc-200 text-zinc-900")} style={{ width: 44, height: 44 }}>
                        <IconComp />
                      </div>

                      <div className=" w-40">
                        <div className="font-medium  truncate">{cat.label}</div>
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
            <CardHeader className={clsx("p-4 flex flex-wrap flex-row items-start sm:items-center justify-between gap-3", panelBg)}>
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

       
          </div>
        </aside>
      </main>

      {/* AI Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
        <DialogContent
          className={clsx(
            "max-w-3xl w-full  p-2 h-150 rounded-2xl overflow-hidden backdrop-blur-xl border",
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