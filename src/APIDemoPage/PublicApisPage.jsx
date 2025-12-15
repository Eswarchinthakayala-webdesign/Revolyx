// src/pages/PublicApisPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  PawPrint,
  Film,
  ShieldAlert,
  Palette,
  Lock,
  Boxes,
  BookOpen,
  Building2,
  Calendar,
  Cloud,
  Coins,
  Banknote,
  CheckCheck,
  Code2,
  BookText,
  FileText,
  Mail,
  Clapperboard,
  Leaf,
  CalendarCheck,
  Wallet,
  UtensilsCrossed,
  Gamepad2,
  MapPin,
  Gavel,
  HeartPulse,
  Briefcase,
  BrainCircuit,
  Music2,
  Newspaper,
  Database,
  Github,
  FileCheck2,
  SmilePlus,
  Phone,
  Camera,
  Terminal,
  FlaskConical,
  Shield,
  ShoppingCart,
  Users,
  Dumbbell,
  TestTube,
  AlignLeft,
  LocateFixed,
  Car,
  Link,
  CarFront,
  Video,
  CloudSun,
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
  Star,Cpu
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
  { id: "animals", label: "Animals", Icon: PawPrint },
  { id: "anime", label: "Anime", Icon: Film },
  { id: "anti-malware", label: "Anti-Malware", Icon: ShieldAlert },
  { id: "art-design", label: "Art & Design", Icon: Palette },
  { id: "auth", label: "Authentication & Authorization", Icon: Lock },
  { id: "blockchain", label: "Blockchain", Icon: Boxes },
  { id: "books", label: "Books", Icon: BookOpen },
  { id: "business", label: "Business", Icon: Building2 },
  { id: "calendar", label: "Calendar", Icon: Calendar },
  { id: "cloud-storage", label: "Cloud Storage & File Sharing", Icon: Cloud },
  {id:"continuousIntegration",label:"Continuous Integration",Icon:Cpu},
  { id: "crypto", label: "Cryptocurrency", Icon: Coins },
  { id: "currency", label: "Currency Exchange", Icon: Banknote },
  { id: "validation", label: "Data Validation", Icon: CheckCheck },
  { id: "development", label: "Development", Icon: Code2 },
  { id: "dictionaries", label: "Dictionaries", Icon: BookText },
  { id: "documents", label: "Documents & Productivity", Icon: FileText },
  { id: "email", label: "Email", Icon: Mail },
  { id: "entertainment", label: "Entertainment", Icon: Clapperboard },
  { id: "environment", label: "Environment", Icon: Leaf },
  { id: "events", label: "Events", Icon: CalendarCheck },
  { id: "finance", label: "Finance", Icon: Wallet },
  { id: "food", label: "Food & Drink", Icon: UtensilsCrossed },
  { id: "games", label: "Games & Comics", Icon: Gamepad2 },
  { id: "geocoding", label: "Geocoding", Icon: MapPin },
  { id: "government", label: "Government", Icon: Gavel },
  { id: "health", label: "Health", Icon: HeartPulse },
  { id: "jobs", label: "Jobs", Icon: Briefcase },
  { id: "ml", label: "Machine Learning", Icon: BrainCircuit },
  { id: "music", label: "Music", Icon: Music2 },
  { id: "news", label: "News", Icon: Newspaper },
  { id: "open-data", label: "Open Data", Icon: Database },
  { id: "open-source", label: "Open Source Projects", Icon: Github },
  { id: "patent", label: "Patent", Icon: FileCheck2 },
  { id: "personality", label: "Personality", Icon: SmilePlus },
  { id: "phone", label: "Phone", Icon: Phone },
  { id: "photography", label: "Photography", Icon: Camera },
  { id: "programming", label: "Programming", Icon: Terminal },
  { id: "science", label: "Science & Math", Icon: FlaskConical },
  { id: "security", label: "Security", Icon: Shield },
  { id: "shopping", label: "Shopping", Icon: ShoppingCart },
  { id: "social", label: "Social", Icon: Users },
  { id: "sports", label: "Sports & Fitness", Icon: Dumbbell },
  { id: "test-data", label: "Test Data", Icon: TestTube },
  { id: "text-analysis", label: "Text Analysis", Icon: AlignLeft },
  { id: "tracking", label: "Tracking", Icon: LocateFixed },
  { id: "transportation", label: "Transportation", Icon: Car },
  { id: "url-shorteners", label: "URL Shorteners", Icon: Link },
  { id: "vehicle", label: "Vehicle", Icon: CarFront },
  { id: "video", label: "Video", Icon: Video },
  { id: "weather", label: "Weather", Icon: CloudSun }
];

/* ---------- Sample API data (trimmed; include Animals full example) ---------- */
const SAMPLE_APIS = {
 animals : [
  { name: "AdoptAPet", description: "Resource to help get pets adopted", auth: "apiKey", https: true, cors: "yes", link: "https://www.adoptapet.com/public/apis/pet_list.html" },
  { name: "Axolotl", description: "Collection of axolotl pictures and facts", auth: "No", https: true, cors: "no", link: "https://theaxolotlapi.netlify.app/" },
  { name: "Cat Facts", description: "Daily cat facts", auth: "No", https: true, cors: "no", link: "https://alexwohlbruck.github.io/cat-facts/" },
  { name: "Cataas", description: "Cat as a service (cats pictures and gifs)", auth: "No", https: true, cors: "no", link: "https://cataas.com/" },
  { name: "Cats", description: "Pictures of cats (TheCatAPI)", auth: "apiKey", https: true, cors: "no", link: "https://docs.thecatapi.com/" },
  { name: "Dog Facts (dukengn)", description: "Random dog facts", auth: "No", https: true, cors: "yes", link: "https://dukengn.github.io/Dog-facts-API/" },
  { name: "Dog Facts (kinduff)", description: "Random facts of Dogs", auth: "No", https: true, cors: "yes", link: "https://kinduff.github.io/dog-api/" },
  { name: "Dogs", description: "Pictures / data based on the Stanford Dogs Dataset", auth: "No", https: true, cors: "yes", link: "https://dog.ceo/dog-api/" },
  { name: "eBird", description: "Retrieve recent or notable birding observations within a region", auth: "apiKey", https: true, cors: "no", link: "https://documenter.getpostman.com/view/664302/S1ENwy59" },
  { name: "FishWatch", description: "Information and pictures about individual fish species", auth: "No", https: true, cors: "yes", link: "https://www.fishwatch.gov/developers" },
  { name: "HTTP Cat", description: "Cat images for every HTTP status code", auth: "No", https: true, cors: "yes", link: "https://http.cat/" },
  { name: "HTTP Dog", description: "Dog images for every HTTP response status code", auth: "No", https: true, cors: "yes", link: "https://http.dog/" },
  { name: "IUCN Red List", description: "IUCN Red List of Threatened Species data", auth: "apiKey", https: false, cors: "no", link: "http://apiv3.iucnredlist.org/api/v3/docs" },
  { name: "MeowFacts", description: "Random cat facts", auth: "No", https: true, cors: "no", link: "https://github.com/wh-iterabb-it/meowfacts" },
  { name: "Movebank", description: "Movement & migration data of animals (tracking, ecology)", auth: "No", https: true, cors: "yes", link: "https://github.com/movebank/movebank-api-doc" },
  { name: "Petfinder", description: "Pet adoption and shelter data", auth: "apiKey", https: true, cors: "yes", link: "https://www.petfinder.com/developers/" },
  { name: "PlaceBear", description: "Placeholder bear pictures", auth: "No", https: true, cors: "yes", link: "https://placebear.com/" },
  { name: "PlaceDog", description: "Placeholder dog pictures", auth: "No", https: true, cors: "yes", link: "https://place.dog" },
  { name: "PlaceKitten", description: "Placeholder kitten / cat pictures", auth: "No", https: true, cors: "yes", link: "https://placekitten.com/" },
  { name: "RandomDog", description: "Random pictures of dogs", auth: "No", https: true, cors: "yes", link: "https://random.dog/woof.json" },
  { name: "RandomDuck", description: "Random pictures of ducks", auth: "No", https: true, cors: "no", link: "https://random-d.uk/api" },
  { name: "RandomFox", description: "Random pictures of foxes", auth: "No", https: true, cors: "no", link: "https://randomfox.ca/floof/" },
  { name: "RescueGroups", description: "Adoption / rescue group pet data & search", auth: "No", https: true, cors: "unknown", link: "https://userguide.rescuegroups.org/display/APIDG/API+Developers+Guide+Home" },
  { name: "Shibe.Online", description: "Random pictures of Shiba Inu, cats or birds", auth: "No", https: true, cors: "yes", link: "http://shibe.online/" },
  { name: "The Dog", description: "Public API with dog images / data (thedogapi.com)", auth: "apiKey", https: true, cors: "no", link: "https://thedogapi.com/" },
  { name: "xeno-canto", description: "Bird recordings & audio data", auth: "No", https: true, cors: "unknown", link: "https://xeno-canto.org/explore/api" },
  { name: "Zoo Animals", description: "Facts and pictures of zoo animals", auth: "No", https: true, cors: "yes", link: "https://zoo-animal-api.herokuapp.com/" },
  // ✅ New / 2024–2025 additions
  { name: "Animals API (api-ninjas)", description: "Scientific facts about thousands of animal species", auth: "apiKey", https: true, cors: "unknown", link: "https://api.api-ninjas.com/v1/animals" },
  { name: "WoRMS (World Register of Marine Species)", description: "Marine species taxonomy & data", auth: "No", https: true, cors: "unknown", link: "https://www.marinespecies.org/rest/" }
],
anime:[
  { name: "AniAPI", description: "Anime discovery, streaming & sync with trackers", auth: "OAuth", https: true, cors: "yes", link: "https://aniapi.com/docs/" },
  { name: "AniDB", description: "Anime database", auth: "apiKey", https: false, cors: "unknown", link: "https://wiki.anidb.net/HTTP_API_Definition" },
  { name: "AniList", description: "Anime discovery & tracking (GraphQL)", auth: "OAuth", https: true, cors: "unknown", link: "https://github.com/AniList/ApiV2-GraphQL-Docs" },
  { name: "AnimeChan", description: "Anime quotes (10,000+)", auth: "No", https: true, cors: "no", link: "https://github.com/RocktimSaikia/anime-chan" },
  { name: "AnimeFacts", description: "Anime facts (100+)", auth: "No", https: true, cors: "yes", link: "https://chandan-02.github.io/anime-facts-rest-api/" },
  { name: "AnimeNewsNetwork", description: "Anime industry news", auth: "No", https: true, cors: "yes", link: "https://www.animenewsnetwork.com/encyclopedia/api.php" },
  { name: "Catboy", description: "Anime / Neko images & GIFs", auth: "No", https: true, cors: "yes", link: "https://catboys.com/api" },
  { name: "Danbooru Anime", description: "Large repository of anime art & images", auth: "apiKey", https: true, cors: "yes", link: "https://danbooru.donmai.us/wiki_pages/help:api" },
  { name: "Jikan", description: "Unofficial MyAnimeList REST API", auth: "No", https: true, cors: "yes", link: "https://jikan.moe" },
  { name: "Kitsu", description: "Anime discovery & catalog platform", auth: "OAuth", https: true, cors: "yes", link: "https://kitsu.docs.apiary.io/" },
  { name: "MangaDex", description: "Manga database & community", auth: "apiKey", https: true, cors: "unknown", link: "https://api.mangadex.org/docs.html" },
  { name: "Mangapi", description: "Manga translation / page translation API", auth: "apiKey", https: true, cors: "unknown", link: "https://rapidapi.com/pierre.carcellermeunier/api/mangapi3/" },
  { name: "MyAnimeList", description: "Official Anime & Manga database & community", auth: "OAuth", https: true, cors: "unknown", link: "https://myanimelist.net/" },
  { name: "NekosBest", description: "Anime / Neko images & role-playing GIFs", auth: "No", https: true, cors: "yes", link: "https://docs.nekos.best" },
  { name: "Nekosia API", description: "Random anime / cute images API", auth: "No", https: true, cors: "yes", link: "https://github.com/public-apis/anime#nekosia-api" },
  { name: "Studio Ghibli API", description: "Resources/data from Studio Ghibli films", auth: "No", https: true, cors: "yes", link: "https://ghibliapi.herokuapp.com" },
  { name: "Trace Moe", description: "Reverse-image API: find anime by screenshot", auth: "No", https: true, cors: "no", link: "https://soruly.github.io/trace.moe-api/#/" },
  { name: "Waifu.im", description: "Waifu / anime images archive (4000+ images, tags)", auth: "No", https: true, cors: "yes", link: "https://waifu.im/docs" },
  { name: "Waifu.pics", description: "Anime image sharing platform (pics / gifs)", auth: "No", https: true, cors: "no", link: "https://waifu.pics/docs" }
],
 "anti-malware" : [
  { name: "AbuseIPDB", description: "IP / domain / URL reputation — blacklist & abuse reports", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.abuseipdb.com/" },
  { name: "AlienVault OTX", description: "Threat-intelligence feed: IP / domain / URL reputation & threat data", auth: "apiKey", https: true, cors: "unknown", link: "https://otx.alienvault.com/api" },
  { name: "CAPEsandbox", description: "Malware execution & dynamic analysis sandbox via API", auth: "apiKey", https: true, cors: "unknown", link: "https://capev2.readthedocs.io/en/latest/usage/api.html" },
  { name: "Google Safe Browsing", description: "URL / domain checking against Google's blacklist of malicious sites", auth: "apiKey", https: true, cors: "unknown", link: "https://developers.google.com/safe-browsing/" },
  { name: "MalDatabase", description: "Malware datasets & threat intelligence feeds", auth: "apiKey", https: true, cors: "unknown", link: "https://maldatabase.com/api-doc.html" },
  { name: "MalShare", description: "Malware archive / repository — retrieve samples & metadata", auth: "apiKey", https: true, cors: "no", link: "https://malshare.com/doc.php" },
  { name: "MalwareBazaar", description: "Share and retrieve malware samples / threat data via API", auth: "apiKey", https: true, cors: "unknown", link: "https://bazaar.abuse.ch/api/" },
  { name: "Metacert", description: "URL / domain link-flagging & reputation checking", auth: "apiKey", https: true, cors: "unknown", link: "https://metacert.com/" },
  { name: "NoPhishy", description: "Link phishing check API (via RapidAPI)", auth: "apiKey", https: true, cors: "yes", link: "https://rapidapi.com/Amiichu/api/exerra-phishing-check/" },
  { name: "Phisherman", description: "IP / domain / URL reputation & phishing-URL detection", auth: "apiKey", https: true, cors: "unknown", link: "https://phisherman.gg/" },
  { name: "Scanii", description: "REST API for scanning files/documents for malware or threats", auth: "apiKey", https: true, cors: "yes", link: "https://docs.scanii.com/" },
  { name: "URLhaus", description: "Download or query bulk lists of known malicious URLs / malware URLs", auth: "No", https: true, cors: "yes", link: "https://urlhaus-api.abuse.ch/" },
  { name: "URLScan.io", description: "Scan and analyze URLs for malicious content / identify threats", auth: "apiKey", https: true, cors: "unknown", link: "https://urlscan.io/about-api/" },
  { name: "VirusTotal", description: "File / URL / Domain / IP analysis using 70+ antivirus engines and threat data", auth: "apiKey", https: true, cors: "unknown", link: "https://www.virustotal.com/en/documentation/public-api/" },
  { name: "Web of Trust (WOT)", description: "IP / domain / URL reputation & safety rating", auth: "apiKey", https: true, cors: "unknown", link: "https://support.mywot.com/hc/en-us/sections/360004477734-API-" },
  // Additional / less common or newer ones (2024–2025) — may need manual verification
  { name: "FishFish", description: "Community-driven cybersecurity / anti-malware API (volunteer-based reputation data)", auth: "No", https: true, cors: "unknown", link: "https://publicapi.dev/category/anti-malware" },
  { name: "phish.directory", description: "Phishing URL & domain listing API (community-driven)", auth: "No", https: true, cors: "unknown", link: "https://publicapi.dev/category/anti-malware" }
],

 "art-design" : [
  { name: "Améthyste", description: "Generate images for Discord users", auth: "apiKey", https: true, cors: "unknown", link: "https://api.amethyste.moe/" },
  { name: "Art Institute of Chicago", description: "Art", auth: "No", https: true, cors: "yes", link: "https://api.artic.edu/docs/" },
  { name: "Colormind", description: "Color scheme generator", auth: "No", https: false, cors: "unknown", link: "http://colormind.io/api-access/" },
  { name: "ColourLovers", description: "Patterns, palettes and images", auth: "No", https: false, cors: "unknown", link: "http://www.colourlovers.com/api" },
  { name: "Cooper Hewitt", description: "Smithsonian Design Museum", auth: "apiKey", https: true, cors: "unknown", link: "https://collection.cooperhewitt.org/api" },
  { name: "Dribbble", description: "Designers & creatives showcase", auth: "OAuth", https: true, cors: "unknown", link: "https://developer.dribbble.com" },
  { name: "EmojiHub", description: "Get emojis by categories and groups", auth: "No", https: true, cors: "yes", link: "https://github.com/cheatsnake/emojihub" },
  { name: "Europeana", description: "European Museum / Galleries content", auth: "apiKey", https: true, cors: "unknown", link: "https://pro.europeana.eu/resources/apis/search" },
  { name: "Harvard Art Museums", description: "Art", auth: "apiKey", https: false, cors: "unknown", link: "https://github.com/harvardartmuseums/api-docs" },
  { name: "Icon Horse", description: "Easy favicon lookup", auth: "No", https: true, cors: "yes", link: "https://icon.horse" },
  { name: "Iconfinder", description: "Full icon library", auth: "apiKey", https: true, cors: "unknown", link: "https://developer.iconfinder.com" },
  { name: "Icons8", description: "Free icons search API", auth: "No", https: true, cors: "unknown", link: "https://img.icons8.com/" },
  { name: "Lordicon", description: "Animated icons", auth: "No", https: true, cors: "yes", link: "https://lordicon.com/" },
  { name: "Metropolitan Museum of Art", description: "Met Museum collection", auth: "No", https: true, cors: "no", link: "https://metmuseum.github.io/" },
  { name: "Noun Project", description: "Icon search", auth: "OAuth", https: false, cors: "unknown", link: "http://api.thenounproject.com/index.html" },
  { name: "PHP-Noise", description: "Noise background image generator", auth: "No", https: true, cors: "yes", link: "https://php-noise.com/" },
  { name: "Pixel Encounter", description: "SVG icon generator", auth: "No", https: true, cors: "no", link: "https://pixelencounter.com/api" },
  { name: "Rijksmuseum", description: "RijksMuseum Data", auth: "apiKey", https: true, cors: "unknown", link: "https://data.rijksmuseum.nl/object-metadata/api/" },
  { name: "Word Cloud", description: "Generate word clouds", auth: "apiKey", https: true, cors: "unknown", link: "https://wordcloudapi.com/" },
  { name: "xColors", description: "Generate / convert color palettes", auth: "No", https: true, cors: "yes", link: "https://x-colors.herokuapp.com/" },

  // ⭐ Newly added 2024–2025 APIs
  { name: "OpenArt AI", description: "AI image & design search / prompts reference", auth: "apiKey", https: true, cors: "yes", link: "https://openart.ai/api" },
  { name: "Huemint", description: "Machine-learning color palette generation", auth: "No", https: true, cors: "unknown", link: "https://huemint.com/api/" },
  { name: "SVGRepo", description: "Free SVG icons + shapes + illustrations", auth: "No", https: true, cors: "yes", link: "https://www.svgrepo.com/api/" },
  { name: "Google Fonts API", description: "Retrieve fonts & metadata programmatically", auth: "No", https: true, cors: "yes", link: "https://developers.google.com/fonts/docs/developer_api" },
  { name: "OpenPecha", description: "Tibetan art manuscripts / pecha dataset", auth: "No", https: true, cors: "unknown", link: "https://github.com/OpenPecha/openpecha-api" },
  { name: "RunwayML Assets API", description: "Creative ML / video / design asset search", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.runwayml.com/" },
  { name: "DeepAI Text-to-Image", description: "Free AI Image Generation API", auth: "apiKey", https: true, cors: "yes", link: "https://deepai.org/machine-learning-model/text2img" },
  { name: "ClipDrop (Stability AI)", description: "Image cleanup / relight / replace background / upscale", auth: "apiKey", https: true, cors: "yes", link: "https://clipdrop.co/apis" },
  { name: "OnePalette", description: "Generate palettes from text input", auth: "No", https: true, cors: "yes", link: "https://onepalette.app/api" },
  { name: "ColourSpaces", description: "Color conversions + LAB/XYZ tools", auth: "No", https: true, cors: "yes", link: "https://colour-spaces.com/api" }
],
"auth" : [
  {
    name: "Auth0",
    description: "Easy to implement, adaptable authentication and authorization platform",
    auth: "apiKey",
    https: true,
    cors: "yes",
    link: "https://auth0.com"
  },
  {
    name: "GetOTP",
    description: "Implement OTP flow quickly",
    auth: "apiKey",
    https: true,
    cors: "no",
    link: "https://otp.dev/en/docs/"
  },
  {
    name: "Micro User Service",
    description: "User management and authentication",
    auth: "apiKey",
    https: true,
    cors: "no",
    link: "https://m3o.com/user"
  },
  {
    name: "MojoAuth",
    description: "Secure and modern passwordless authentication platform",
    auth: "apiKey",
    https: true,
    cors: "yes",
    link: "https://mojoauth.com"
  },
  {
    name: "SAWO Labs",
    description: "Passwordless authentication for mobile & web apps",
    auth: "apiKey",
    https: true,
    cors: "yes",
    link: "https://sawolabs.com"
  },
  {
    name: "Stytch",
    description: "User infrastructure for modern authentication flows",
    auth: "apiKey",
    https: true,
    cors: "no",
    link: "https://stytch.com/"
  },
  {
    name: "Warrant",
    description: "APIs for authorization and access control",
    auth: "apiKey",
    https: true,
    cors: "yes",
    link: "https://warrant.dev/"
  },

  // ⭐ NEW & Updated APIs (2024–2025)
  {
    name: "SuperTokens",
    description: "Open-source authentication with secure session management",
    auth: "No",
    https: true,
    cors: "yes",
    link: "https://supertokens.com"
  },
  {
    name: "Clerk",
    description: "Authentication and user management for React/Next.js apps",
    auth: "apiKey",
    https: true,
    cors: "yes",
    link: "https://clerk.com"
  },
  {
    name: "Descope",
    description: "Passwordless and MFA authentication platform",
    auth: "apiKey",
    https: true,
    cors: "yes",
    link: "https://descope.com"
  },
  {
    name: "Ory",
    description: "Open-source identity and access management (IAM)",
    auth: "No",
    https: true,
    cors: "yes",
    link: "https://www.ory.sh"
  },
  {
    name: "Zitadel",
    description: "Identity infrastructure for applications and SaaS",
    auth: "No",
    https: true,
    cors: "yes",
    link: "https://zitadel.com"
  },
  {
    name: "FusionAuth",
    description: "Complete auth and user management platform for modern apps",
    auth: "apiKey",
    https: true,
    cors: "yes",
    link: "https://fusionauth.io"
  },
  {
    name: "Firebase Auth",
    description: "Firebase authentication for web & mobile apps",
    auth: "apiKey",
    https: true,
    cors: "yes",
    link: "https://firebase.google.com/products/auth"
  },
  {
    name: "AWS Cognito",
    description: "Amazon service for access control and identity management",
    auth: "apiKey",
    https: true,
    cors: "yes",
    link: "https://aws.amazon.com/cognito/"
  },
  {
    name: "Azure AD B2C",
    description: "Identity management for apps using Azure Active Directory B2C",
    auth: "apiKey",
    https: true,
    cors: "yes",
    link: "https://learn.microsoft.com/azure/active-directory-b2c/"
  }
],
"blockchain": [
  { name: "Bitquery", description: "Onchain GraphQL APIs & DEX APIs", auth: "apiKey", https: true, cors: "yes", link: "https://graphql.bitquery.io/ide" },
  { name: "Chainlink", description: "Build hybrid smart contracts with Chainlink", auth: "No", https: true, cors: "unknown", link: "https://chain.link/developer-resources" },
  { name: "Chainpoint", description: "Global network for anchoring data to the Bitcoin blockchain", auth: "No", https: true, cors: "unknown", link: "https://tierion.com/chainpoint/" },
  { name: "Covalent", description: "Multi-blockchain data aggregator platform", auth: "apiKey", https: true, cors: "unknown", link: "https://www.covalenthq.com/docs/api/" },
  { name: "Etherscan", description: "Ethereum explorer API", auth: "apiKey", https: true, cors: "yes", link: "https://etherscan.io/apis" },
  { name: "Helium", description: "Global network of hotspots creating long-range wireless coverage", auth: "No", https: true, cors: "unknown", link: "https://docs.helium.com/api/blockchain/introduction/" },
  { name: "Nownodes", description: "Blockchain-as-a-service solution providing high-quality node connection via API", auth: "apiKey", https: true, cors: "unknown", link: "https://nownodes.io/" },
  { name: "Steem", description: "Blockchain-based blogging and social media platform", auth: "No", https: false, cors: "no", link: "https://developers.steem.io/" },
  { name: "The Graph", description: "Indexing protocol for querying networks like Ethereum with GraphQL", auth: "apiKey", https: true, cors: "unknown", link: "https://thegraph.com" },
  { name: "Walltime", description: "Retrieve Walltime's cryptocurrency market info", auth: "No", https: true, cors: "unknown", link: "https://walltime.info/api.html" },
  { name: "Watchdata", description: "Provides reliable API access to Ethereum blockchain", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.watchdata.io" },

  // ✅ New / 2025 additions
  { name: "Moralis", description: "Unified API for Ethereum, Solana, and other blockchains", auth: "apiKey", https: true, cors: "yes", link: "https://docs.moralis.io/" },
  { name: "Alchemy", description: "Blockchain development platform providing node infrastructure and enhanced APIs", auth: "apiKey", https: true, cors: "yes", link: "https://docs.alchemy.com/alchemy/" },
  { name: "QuickNode", description: "High-performance blockchain node infrastructure with multi-chain API", auth: "apiKey", https: true, cors: "yes", link: "https://www.quicknode.com/docs" },
  { name: "Infura", description: "Ethereum and IPFS API access for dApps", auth: "apiKey", https: true, cors: "yes", link: "https://infura.io/docs" },
  { name: "Celo", description: "APIs for Celo blockchain to interact with smart contracts and wallets", auth: "apiKey", https: true, cors: "yes", link: "https://docs.celo.org/" },
  { name: "Solana API", description: "RPC and REST APIs to interact with the Solana blockchain", auth: "No", https: true, cors: "yes", link: "https://docs.solana.com/developing/clients/jsonrpc-api" },
  { name: "Binance Smart Chain API", description: "Access BSC blockchain data, transactions, and smart contracts", auth: "apiKey", https: true, cors: "yes", link: "https://docs.bscscan.com/" },
  { name: "Bitcoin RPC", description: "Direct Bitcoin node JSON-RPC API", auth: "No", https: true, cors: "no", link: "https://developer.bitcoin.org/reference/rpc/index.html" }
],
"books": [
  { name: "A Bíblia Digital", description: "Do not worry about managing the multiple versions of the Bible", auth: "apiKey", https: true, cors: "no", link: "https://www.abibliadigital.com.br/en" },
  { name: "Bhagavad Gita (api-docs.in)", description: "Open Source Shrimad Bhagavad Gita API including 21+ authors translation in Sanskrit/English/Hindi", auth: "apiKey", https: true, cors: "yes", link: "https://docs.bhagavadgitaapi.in" },
  { name: "Bhagavad Gita (bhagavadgita.io)", description: "Bhagavad Gita text", auth: "OAuth", https: true, cors: "yes", link: "https://bhagavadgita.io/api" },
  { name: "Bhagavad Gita Telugu", description: "Bhagavad Gita API in Telugu and Odia languages", auth: "No", https: true, cors: "yes", link: "https://gita-api.vercel.app" },
  { name: "Bible-api", description: "Free Bible API with multiple languages", auth: "No", https: true, cors: "yes", link: "https://bible-api.com/" },
  { name: "British National Bibliography", description: "Books metadata", auth: "No", https: false, cors: "unknown", link: "http://bnb.data.bl.uk/" },
  { name: "Crossref Metadata Search", description: "Books & articles metadata", auth: "No", https: true, cors: "unknown", link: "https://github.com/CrossRef/rest-api-doc" },
  { name: "Ganjoor", description: "Classic Persian poetry works including access to related manuscripts, recitations and music tracks", auth: "OAuth", https: true, cors: "yes", link: "https://api.ganjoor.net" },
  { name: "Google Books", description: "Books search, metadata and cover images", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.google.com/books/" },
  { name: "GurbaniNow", description: "Fast and accurate Gurbani RESTful API", auth: "No", https: true, cors: "unknown", link: "https://github.com/GurbaniNow/api" },
  { name: "Gutendex", description: "Web API for fetching data from Project Gutenberg Books Library", auth: "No", https: true, cors: "unknown", link: "https://gutendex.com/" },
  { name: "Open Library", description: "Books, book covers and related data", auth: "No", https: true, cors: "no", link: "https://openlibrary.org/developers/api" },
  { name: "Penguin Publishing", description: "Books, book covers and related data", auth: "No", https: true, cors: "yes", link: "http://www.penguinrandomhouse.biz/webservices/rest/" },
  { name: "PoetryDB", description: "Get instant data from a vast poetry collection", auth: "No", https: true, cors: "yes", link: "https://github.com/thundercomb/poetrydb#readme" },
  { name: "Quran", description: "RESTful Quran API with multiple languages", auth: "No", https: true, cors: "yes", link: "https://quran.api-docs.io/" },
  { name: "Quran Cloud", description: "RESTful Quran API to retrieve an Ayah, Surah, Juz or entire Quran", auth: "No", https: true, cors: "yes", link: "https://alquran.cloud/api" },
  { name: "Quran-api", description: "Free Quran API with 90+ languages and 400+ translations", auth: "No", https: true, cors: "yes", link: "https://github.com/fawazahmed0/quran-api#readme" },
  { name: "Rig Veda", description: "Gods and poets, categories, verse meters, mandal and sukta numbers", auth: "No", https: true, cors: "unknown", link: "https://aninditabasu.github.io/indica/html/rv.html" },
  { name: "The Bible", description: "Everything you need from the Bible in one discoverable place", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.api.bible" },
  { name: "Thirukkural", description: "1330 Thirukkural poems and explanations in Tamil and English", auth: "No", https: true, cors: "yes", link: "https://api-thirukkural.web.app/" },
  { name: "Vedic Society", description: "Descriptions of nouns (names, places, animals, things) from Vedic literature", auth: "No", https: true, cors: "unknown", link: "https://aninditabasu.github.io/indica/html/vs.html" },
  { name: "Wizard World", description: "Information from the Harry Potter universe", auth: "No", https: true, cors: "yes", link: "https://wizard-world-api.herokuapp.com/swagger/index.html" },
  { name: "Wolne Lektury", description: "Information about e-books available on the Wolne Lektury website", auth: "No", https: true, cors: "unknown", link: "https://wolnelektury.pl/api/" },
  // ✅ New / 2024–2025 additions
  { name: "OpenBD", description: "Open Book Data API (Japanese books) with metadata and cover images", auth: "No", https: true, cors: "yes", link: "https://openbd.jp/" },
  { name: "Literature DB API", description: "Access data for contemporary and classic books and authors", auth: "No", https: true, cors: "unknown", link: "https://literaturedb.org/api" },
  { name: "Google Books New API", description: "Updated Google Books API with advanced search & metadata", auth: "OAuth", https: true, cors: "yes", link: "https://developers.google.com/books/docs/v1/getting_started" }
],

  "business": [
    { name: "Apache Superset", description: "API to manage your BI dashboards and data sources on Superset", auth: "apiKey", https: true, cors: "yes", link: "https://superset.apache.org/docs/api" },
    { name: "Charity Search", description: "Non-profit charity data", auth: "apiKey", https: false, cors: "unknown", link: "http://charityapi.orghunter.com/" },
    { name: "Clearbit Logo", description: "Search for company logos and embed them in your projects", auth: "apiKey", https: true, cors: "unknown", link: "https://clearbit.com/docs#logo-api" },
    { name: "Domainsdb.info", description: "Registered domain names search", auth: "No", https: true, cors: "no", link: "https://domainsdb.info/" },
    { name: "Freelancer", description: "Hire freelancers to get work done", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.freelancer.com" },
    { name: "Gmail", description: "Flexible, RESTful access to the user's inbox", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.google.com/gmail/api/" },
    { name: "Google Analytics", description: "Collect, configure and analyze your data to reach the right audience", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.google.com/analytics/" },
    { name: "Instatus", description: "Post to and update maintenance and incidents on your status page", auth: "apiKey", https: true, cors: "unknown", link: "https://instatus.com/help/api" },
    { name: "Mailchimp", description: "Send marketing campaigns and transactional mails", auth: "apiKey", https: true, cors: "unknown", link: "https://mailchimp.com/developer/" },
    { name: "Mailjet", description: "Marketing email can be sent and mail templates made in MJML or HTML can be sent using API", auth: "apiKey", https: true, cors: "unknown", link: "https://www.mailjet.com/" },
    { name: "MarkerAPI", description: "Trademark Search", auth: "No", https: false, cors: "unknown", link: "https://markerapi.com" },
    { name: "ORB Intelligence", description: "Company lookup", auth: "apiKey", https: true, cors: "unknown", link: "https://api.orb-intelligence.com/docs/" },
    { name: "Redash", description: "Access your queries and dashboards on Redash", auth: "apiKey", https: true, cors: "yes", link: "https://redash.io/help/user-guide/integrations-and-api/api" },
    { name: "Smartsheet", description: "Programmatically access Smartsheet data and account information", auth: "OAuth", https: true, cors: "no", link: "https://smartsheet.redoc.ly/" },
    { name: "Square", description: "Take payments, manage refunds, and help customers checkout online", auth: "OAuth", https: true, cors: "unknown", link: "https://developer.squareup.com/reference/square" },
    { name: "SwiftKanban", description: "Kanban software to visualize work and increase organizational throughput", auth: "apiKey", https: true, cors: "unknown", link: "https://www.digite.com/knowledge-base/swiftkanban/article/api-for-swift-kanban-web-services/#restapi" },
    { name: "Tenders in Hungary", description: "Get data for procurements in Hungary in JSON format", auth: "No", https: true, cors: "unknown", link: "https://tenders.guru/hu/api" },
    { name: "Tenders in Poland", description: "Get data for procurements in Poland in JSON format", auth: "No", https: true, cors: "unknown", link: "https://tenders.guru/pl/api" },
    { name: "Tenders in Romania", description: "Get data for procurements in Romania in JSON format", auth: "No", https: true, cors: "unknown", link: "https://tenders.guru/ro/api" },
    { name: "Tenders in Spain", description: "Get data for procurements in Spain in JSON format", auth: "No", https: true, cors: "unknown", link: "https://tenders.guru/es/api" },
    { name: "Tenders in Ukraine", description: "Get data for procurements in Ukraine in JSON format", auth: "No", https: true, cors: "unknown", link: "https://tenders.guru/ua/api" },
    { name: "Tomba email finder", description: "Email Finder for B2B sales and email marketing and email verifier", auth: "apiKey", https: true, cors: "yes", link: "https://tomba.io/api" },
    { name: "Trello", description: "Boards, lists and cards to help you organize and prioritize your projects", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.trello.com/" },
    // 🔹 New 2025 additions
    { name: "Apollo GraphQL", description: "GraphQL management platform for business APIs", auth: "apiKey", https: true, cors: "unknown", link: "https://www.apollographql.com/docs/apollo-server/api/" },
    { name: "HubSpot CRM", description: "Manage CRM, contacts, and marketing data", auth: "apiKey", https: true, cors: "unknown", link: "https://developers.hubspot.com/docs/api/overview" },
    { name: "QuickBooks Online", description: "Accounting and financial operations API", auth: "OAuth", https: true, cors: "unknown", link: "https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/account" },
    { name: "Zoho CRM", description: "CRM platform for managing sales and contacts", auth: "OAuth", https: true, cors: "unknown", link: "https://www.zoho.com/crm/developer/docs/api/" }
  ],
  "calendar": [
  { name: "Public Holidays (AbstractAPI)", description: "Data on national, regional, and religious holidays via API", auth: "apiKey", https: true, cors: "yes", link: "https://www.abstractapi.com/holidays-api" },
  { name: "Calendarific", description: "Worldwide holidays", auth: "apiKey", https: true, cors: "unknown", link: "https://calendarific.com/" },
  { name: "Checkiday - National Holiday API", description: "Over 5,000 holidays with detailed descriptions. Trusted by top companies", auth: "apiKey", https: true, cors: "unknown", link: "https://apilayer.com/marketplace/checkiday-api" },
  { name: "Church Calendar", description: "Catholic liturgical calendar", auth: "No", https: false, cors: "unknown", link: "http://calapi.inadiutorium.cz/" },
  { name: "Czech Namedays Calendar", description: "Lookup for a name and returns nameday date", auth: "No", https: false, cors: "unknown", link: "https://svatky.adresa.info" },
  { name: "Festivo Public Holidays", description: "Fastest and advanced public holiday and observance service", auth: "apiKey", https: true, cors: "yes", link: "https://docs.getfestivo.com/docs/products/public-holidays-api/intro" },
  { name: "Google Calendar", description: "Display, create, and modify Google calendar events", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.google.com/google-apps/calendar/" },
  { name: "Hebrew Calendar (Hebcal)", description: "Convert between Gregorian and Hebrew, fetch Shabbat and holiday times", auth: "No", https: false, cors: "unknown", link: "https://www.hebcal.com/home/developer-apis" },
  { name: "Holidays (HolidayAPI)", description: "Historical and upcoming holiday data", auth: "apiKey", https: true, cors: "unknown", link: "https://holidayapi.com/" },
  { name: "LectServe", description: "Protestant liturgical calendar", auth: "No", https: false, cors: "unknown", link: "http://www.lectserve.com" },
  { name: "Nager.Date", description: "Public holidays for more than 90 countries", auth: "No", https: true, cors: "no", link: "https://date.nager.at" },
  { name: "Namedays Calendar (Abalin)", description: "Provides namedays for multiple countries", auth: "No", https: true, cors: "yes", link: "https://nameday.abalin.net" },
  { name: "Non-Working Days (ICSDB)", description: "Database of ICS files for non-working days", auth: "No", https: true, cors: "unknown", link: "https://github.com/gadael/icsdb" },
  { name: "Non-Working Days Russia/CIS/USA", description: "Check working, non-working, or short days", auth: "No", https: true, cors: "yes", link: "https://isdayoff.ru" },
  { name: "Russian Calendar", description: "Check if a date is a Russian holiday or not", auth: "No", https: true, cors: "no", link: "https://github.com/egno/work-calendar" },
  { name: "UK Bank Holidays", description: "Bank holidays in England and Wales, Scotland, and Northern Ireland", auth: "No", https: true, cors: "unknown", link: "https://www.gov.uk/bank-holidays.json" },

  // ✅ New / updated 2025 additions
  { name: "Calendarific API v2", description: "Updated worldwide public and religious holidays API", auth: "apiKey", https: true, cors: "yes", link: "https://calendarific.com/" },
  { name: "Timezonedb Calendar", description: "Time and date calculations including holidays per timezone", auth: "apiKey", https: true, cors: "yes", link: "https://timezonedb.com/api" },
  { name: "Date.nager.at API v2", description: "Updated public holidays API with REST endpoints and regional info", auth: "No", https: true, cors: "yes", link: "https://date.nager.at/Api" },
  { name: "HolidayAPI.com Free Plan", description: "Updated free tier API for public holidays and observances", auth: "apiKey", https: true, cors: "yes", link: "https://holidayapi.com/" }
],
"cloud-storage": [
  { name: "AnonFiles", description: "Upload and share your files anonymously", auth: "No", https: true, cors: "unknown", link: "https://anonfiles.com/docs/api" },
  { name: "BayFiles", description: "Upload and share your files", auth: "No", https: true, cors: "unknown", link: "https://bayfiles.com/docs/api" },
  { name: "Box", description: "File Sharing and Storage", auth: "OAuth", https: true, cors: "unknown", link: "https://developer.box.com/" },
  { name: "ddownload", description: "File Sharing and Storage", auth: "apiKey", https: true, cors: "unknown", link: "https://ddownload.com/api" },
  { name: "Dropbox", description: "File Sharing and Storage", auth: "OAuth", https: true, cors: "unknown", link: "https://www.dropbox.com/developers" },
  { name: "File.io", description: "Super simple file sharing, convenient, anonymous and secure", auth: "No", https: true, cors: "unknown", link: "https://www.file.io" },
  { name: "Filestack", description: "Filestack File Uploader & File Upload API", auth: "apiKey", https: true, cors: "unknown", link: "https://www.filestack.com" },
  { name: "GoFile", description: "Unlimited size file uploads for free", auth: "apiKey", https: true, cors: "unknown", link: "https://gofile.io/api" },
  { name: "Google Drive", description: "File Sharing and Storage", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.google.com/drive/" },
  { name: "Gyazo", description: "Save & Share screen captures instantly", auth: "apiKey", https: true, cors: "unknown", link: "https://gyazo.com/api/docs" },
  { name: "Imgbb", description: "Simple and quick private image sharing", auth: "apiKey", https: true, cors: "unknown", link: "https://api.imgbb.com/" },
  { name: "OneDrive", description: "File Sharing and Storage", auth: "OAuth", https: true, cors: "unknown", link: "https://developer.microsoft.com/onedrive" },
  { name: "Pantry", description: "Free JSON storage for small projects", auth: "No", https: true, cors: "yes", link: "https://getpantry.cloud/" },
  { name: "Pastebin", description: "Plain Text Storage", auth: "apiKey", https: true, cors: "unknown", link: "https://pastebin.com/doc_api" },
  { name: "Pinata", description: "IPFS Pinning Services API", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.pinata.cloud/" },
  { name: "Quip", description: "File Sharing and Storage for groups", auth: "apiKey", https: true, cors: "yes", link: "https://quip.com/dev/automation/documentation" },
  { name: "Storj", description: "Decentralized Open-Source Cloud Storage", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.storj.io/dcs/" },
  { name: "The Null Pointer", description: "No-bullshit file hosting and URL shortening service", auth: "No", https: true, cors: "unknown", link: "https://0x0.st" },
  { name: "Web3 Storage", description: "File Sharing and Storage for Free with 1TB Space", auth: "apiKey", https: true, cors: "yes", link: "https://web3.storage/" },
  // New / updated 2025 additions
  { name: "Filebin", description: "Temporary file storage and sharing", auth: "No", https: true, cors: "yes", link: "https://filebin.net/docs" },
  { name: "Transfer.sh", description: "Simple file sharing API for small files", auth: "No", https: true, cors: "yes", link: "https://transfer.sh/" },
  { name: "Internxt", description: "Decentralized cloud storage API", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.internxt.com/" },
  { name: "Filestash", description: "Self-hosted file manager with API access", auth: "apiKey", https: true, cors: "unknown", link: "https://www.filestash.app/docs/" },
  { name: "CloudConvert", description: "File conversion & storage API", auth: "apiKey", https: true, cors: "unknown", link: "https://cloudconvert.com/api/v2" }
],
 continuousIntegration : [
  { name: "Azure DevOps Health", description: "Resource health helps you diagnose and get support when an Azure issue impacts your resources", auth: "apiKey", https: false, cors: "no", link: "https://docs.microsoft.com/en-us/rest/api/resourcehealth" },
  { name: "Bitrise", description: "Build tool and processes integrations to create efficient development pipelines", auth: "apiKey", https: true, cors: "unknown", link: "https://api-docs.bitrise.io/" },
  { name: "Buddy", description: "The fastest continuous integration and continuous delivery platform", auth: "OAuth", https: true, cors: "unknown", link: "https://buddy.works/docs/api/getting-started/overview" },
  { name: "CircleCI", description: "Automate the software development process using continuous integration and continuous delivery", auth: "apiKey", https: true, cors: "unknown", link: "https://circleci.com/docs/api/v1-reference/" },
  { name: "Codeship", description: "Codeship is a Continuous Integration Platform in the cloud", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.cloudbees.com/docs/cloudbees-codeship/latest/api-overview/" },
  { name: "Travis CI", description: "Sync your GitHub projects with Travis CI to test your code in minutes", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.travis-ci.com/api/" },

  // ✅ New / Updated 2025 APIs
  { name: "GitHub Actions", description: "Automate workflows directly from your GitHub repository", auth: "OAuth / token", https: true, cors: "yes", link: "https://docs.github.com/en/rest/actions" },
  { name: "GitLab CI", description: "GitLab Continuous Integration & Delivery API", auth: "OAuth / token", https: true, cors: "yes", link: "https://docs.gitlab.com/ee/api/README.html" },
  { name: "AppVeyor", description: "Continuous Integration service for Windows, Linux and macOS projects", auth: "apiKey", https: true, cors: "unknown", link: "https://www.appveyor.com/docs/api/" },
  { name: "Semaphore CI", description: "High-performance Continuous Integration & Delivery platform", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.semaphoreci.com/api/" },
  { name: "Drone CI", description: "Modern Continuous Integration platform built on container technology", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.drone.io/api/" }
],
"crypto": [
  { name: "0x", description: "API for querying token and pool stats across various liquidity pools", auth: "No", https: true, cors: "Yes", link: "https://0x.org/api" },
  { name: "1inch", description: "API for querying decentralized exchange", auth: "No", https: true, cors: "Unknown", link: "https://1inch.io/api/" },
  { name: "Alchemy Ethereum", description: "Ethereum Node-as-a-Service Provider", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.alchemy.com/alchemy/" },
  { name: "apilayer coinlayer", description: "Real-time Crypto Currency Exchange Rates", auth: "apiKey", https: true, cors: "Unknown", link: "https://coinlayer.com" },
  { name: "Binance", description: "Exchange for Trading Cryptocurrencies based in China", auth: "apiKey", https: true, cors: "Unknown", link: "https://github.com/binance/binance-spot-api-docs" },
  { name: "Bitcambio", description: "Get the list of all traded assets in the exchange", auth: "No", https: true, cors: "Unknown", link: "https://nova.bitcambio.com.br/api/v3/docs#a-public" },
  { name: "BitcoinAverage", description: "Digital Asset Price Data for the blockchain industry", auth: "apiKey", https: true, cors: "Unknown", link: "https://apiv2.bitcoinaverage.com/" },
  { name: "BitcoinCharts", description: "Financial and Technical Data related to the Bitcoin Network", auth: "No", https: true, cors: "Unknown", link: "https://bitcoincharts.com/about/exchanges/" },
  { name: "Bitfinex", description: "Cryptocurrency Trading Platform", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.bitfinex.com/docs" },
  { name: "Bitmex", description: "Real-Time Cryptocurrency derivatives trading platform based in Hong Kong", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.bitmex.com/app/apiOverview" },
  { name: "Bittrex", description: "Next Generation Crypto Trading Platform", auth: "apiKey", https: true, cors: "Unknown", link: "https://bittrex.github.io/api/v3" },
  { name: "Block", description: "Bitcoin Payment, Wallet & Transaction Data", auth: "apiKey", https: true, cors: "Unknown", link: "https://block.io/docs/basic" },
  { name: "Blockchain", description: "Bitcoin Payment, Wallet & Transaction Data", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.blockchain.com/api" },
  { name: "blockfrost Cardano", description: "Interaction with the Cardano mainnet and several testnets", auth: "apiKey", https: true, cors: "Unknown", link: "https://blockfrost.io/" },
  { name: "Brave NewCoin", description: "Real-time and historic crypto data from more than 200+ exchanges", auth: "apiKey", https: true, cors: "Unknown", link: "https://bravenewcoin.com/developers" },
  { name: "BtcTurk", description: "Real-time cryptocurrency data, graphs and API that allows buy & sell", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.btcturk.com/" },
  { name: "Bybit", description: "Cryptocurrency data feed and algorithmic trading", auth: "apiKey", https: true, cors: "Unknown", link: "https://bybit-exchange.github.io/docs/linear/#t-introduction" },
  { name: "CoinAPI", description: "All Currency Exchanges integrate under a single API", auth: "apiKey", https: true, cors: "No", link: "https://docs.coinapi.io/" },
  { name: "Coinbase", description: "Bitcoin, Bitcoin Cash, Litecoin and Ethereum Prices", auth: "apiKey", https: true, cors: "Unknown", link: "https://developers.coinbase.com" },
  { name: "Coinbase Pro", description: "Cryptocurrency Trading Platform", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.pro.coinbase.com/#api" },
  { name: "CoinCap", description: "Real time Cryptocurrency prices through a RESTful API", auth: "No", https: true, cors: "Unknown", link: "https://docs.coincap.io/" },
  { name: "CoinDCX", description: "Cryptocurrency Trading Platform", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.coindcx.com/" },
  { name: "CoinDesk", description: "CoinDesk's Bitcoin Price Index (BPI) in multiple currencies", auth: "No", https: true, cors: "Unknown", link: "https://old.coindesk.com/coindesk-api/" },
  { name: "CoinGecko", description: "Cryptocurrency Price, Market, and Developer/Social Data", auth: "No", https: true, cors: "Yes", link: "http://www.coingecko.com/api" },
  { name: "Coinigy", description: "Interacting with Coinigy Accounts and Exchange Directly", auth: "apiKey", https: true, cors: "Unknown", link: "https://coinigy.docs.apiary.io" },
  { name: "Coinlib", description: "Crypto Currency Prices", auth: "apiKey", https: true, cors: "Unknown", link: "https://coinlib.io/apidocs" },
  { name: "Coinlore", description: "Cryptocurrencies prices, volume and more", auth: "No", https: true, cors: "Unknown", link: "https://www.coinlore.com/cryptocurrency-data-api" },
  { name: "CoinMarketCap", description: "Cryptocurrencies Prices", auth: "apiKey", https: true, cors: "Unknown", link: "https://coinmarketcap.com/api/" },
  { name: "Coinpaprika", description: "Cryptocurrencies prices, volume and more", auth: "No", https: true, cors: "Yes", link: "https://api.coinpaprika.com" },
  { name: "CoinRanking", description: "Live Cryptocurrency data", auth: "apiKey", https: true, cors: "Unknown", link: "https://developers.coinranking.com/api/documentation" },
  { name: "Coinremitter", description: "Cryptocurrencies Payment & Prices", auth: "apiKey", https: true, cors: "Unknown", link: "https://coinremitter.com/docs" },
  { name: "CoinStats", description: "Crypto Tracker", auth: "No", https: true, cors: "Unknown", link: "https://documenter.getpostman.com/view/5734027/RzZ6Hzr3?version=latest" },
  { name: "CryptAPI", description: "Cryptocurrency Payment Processor", auth: "No", https: true, cors: "Unknown", link: "https://docs.cryptapi.io/" },
  { name: "CryptingUp", description: "Cryptocurrency data", auth: "No", https: true, cors: "Unknown", link: "https://www.cryptingup.com/apidoc/#introduction" },
  { name: "CryptoCompare", description: "Cryptocurrencies Comparison", auth: "No", https: true, cors: "Unknown", link: "https://www.cryptocompare.com/api#" },
  { name: "CryptoMarket", description: "Cryptocurrencies Trading platform", auth: "apiKey", https: true, cors: "Yes", link: "https://api.exchange.cryptomkt.com/" },
  { name: "Cryptonator", description: "Cryptocurrencies Exchange Rates", auth: "No", https: true, cors: "Unknown", link: "https://www.cryptonator.com/api/" },
  { name: "dYdX", description: "Decentralized cryptocurrency exchange", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.dydx.exchange/" },
  { name: "Ethplorer", description: "Ethereum tokens, balances, addresses, history of transactions, contracts, and custom structures", auth: "apiKey", https: true, cors: "Unknown", link: "https://github.com/EverexIO/Ethplorer/wiki/Ethplorer-API" },
  { name: "EXMO", description: "Cryptocurrencies exchange based in UK", auth: "apiKey", https: true, cors: "Unknown", link: "https://documenter.getpostman.com/view/10287440/SzYXWKPi" },
  { name: "FTX", description: "Complete REST, websocket, and FTX APIs to suit algorithmic trading needs", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.ftx.com/" },
  { name: "Gateio", description: "API provides spot, margin and futures trading operations", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.gate.io/api2" },
  { name: "Gemini", description: "Cryptocurrencies Exchange", auth: "No", https: true, cors: "Unknown", link: "https://docs.gemini.com/rest/" },
  { name: "Hirak Exchange Rates", description: "Exchange rates between 162 currency & 300 crypto currency updated every 5 min, no limits", auth: "apiKey", https: true, cors: "Unknown", link: "https://rates.hirak.site/" },
  { name: "Huobi", description: "Seychelles based cryptocurrency exchange", auth: "apiKey", https: true, cors: "Unknown", link: "https://huobiapi.github.io/docs/spot/v1/en/" },
  { name: "icy.tools", description: "GraphQL based NFT API", auth: "apiKey", https: true, cors: "Unknown", link: "https://developers.icy.tools/" },
  { name: "Indodax", description: "Trade your Bitcoin and other assets with rupiah", auth: "apiKey", https: true, cors: "Unknown", link: "https://github.com/btcid/indodax-official-api-docs" },
  { name: "INFURA Ethereum", description: "Interaction with the Ethereum mainnet and several testnets", auth: "apiKey", https: true, cors: "Yes", link: "https://infura.io/product/ethereum" },
  { name: "Kraken", description: "Cryptocurrencies Exchange", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.kraken.com/rest/" },
  { name: "KuCoin", description: "Cryptocurrency Trading Platform", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.kucoin.com/" },
  { name: "Localbitcoins", description: "P2P platform to buy and sell Bitcoins", auth: "No", https: true, cors: "Unknown", link: "https://localbitcoins.com/api-docs/" },
  { name: "Mempool", description: "Bitcoin API Service focusing on the transaction fee", auth: "No", https: true, cors: "No", link: "https://mempool.space/api" },
  { name: "MercadoBitcoin", description: "Brazilian Cryptocurrency Information", auth: "No", https: true, cors: "Unknown", link: "https://www.mercadobitcoin.com.br/api-doc/" },
  { name: "Messari", description: "Provides API endpoints for thousands of crypto assets", auth: "No", https: true, cors: "Unknown", link: "https://messari.io/api" },
  { name: "Nexchange", description: "Automated cryptocurrency exchange service", auth: "No", https: false, cors: "Yes", link: "https://nexchange2.docs.apiary.io/" },
  { name: "Nomics", description: "Historical and realtime cryptocurrency prices and market data", auth: "apiKey", https: true, cors: "Yes", link: "https://nomics.com/docs/" },
  { name: "NovaDax", description: "NovaDAX API to access all market data, trading management endpoints", auth: "apiKey", https: true, cors: "Unknown", link: "https://doc.novadax.com/en-US/#introduction" },
  { name: "OKEx", description: "Cryptocurrency exchange based in Seychelles", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.okex.com/docs/" },
  { name: "Poloniex", description: "US based digital asset exchange", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.poloniex.com" },
  { name: "Solana JSON RPC", description: "Provides various endpoints to interact with the Solana Blockchain", auth: "No", https: true, cors: "Unknown", link: "https://docs.solana.com/developing/clients/jsonrpc-api" },
  { name: "Technical Analysis", description: "Cryptocurrency prices and technical analysis", auth: "apiKey", https: true, cors: "No", link: "https://technical-analysis-api.com" },
  { name: "VALR", description: "Cryptocurrency Exchange based in South Africa", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.valr.com/" },
  { name: "WorldCoinIndex", description: "Cryptocurrencies Prices", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.worldcoinindex.com/apiservice" },
  { name: "ZMOK", description: "Ethereum JSON RPC API and Web3 provider", auth: "No", https: true, cors: "Unknown", link: "https://zmok.io" },
  // ✅ New 2024–2025 additions
  { name: "Messari Market", description: "Updated market data API for thousands of crypto assets", auth: "apiKey", https: true, cors: "Unknown", link: "https://messari.io/api/docs" },
  { name: "Glassnode", description: "On-chain and market data for cryptocurrencies", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.glassnode.com/" },
  { name: "Santiment", description: "Crypto market and on-chain data API", auth: "apiKey", https: true, cors: "Yes", link: "https://api.santiment.net/" },
  { name: "TheGraph", description: "Query blockchain data using GraphQL", auth: "No", https: true, cors: "Yes", link: "https://thegraph.com/en/docs/" },
  { name: "Kaiko", description: "Crypto market data and historical OHLC", auth: "apiKey", https: true, cors: "Yes", link: "https://www.kaiko.com/" }
],
"currency": [
  { name: "1Forge", description: "Forex currency market data", auth: "apiKey", https: true, cors: "unknown", link: "https://1forge.com/forex-data-api/api-documentation" },
  { name: "Amdoren", description: "Free currency API with over 150 currencies", auth: "apiKey", https: true, cors: "unknown", link: "https://www.amdoren.com/currency-api/" },
  { name: "apilayer fixer.io", description: "Exchange rates and currency conversion", auth: "apiKey", https: false, cors: "unknown", link: "https://fixer.io" },
  { name: "Bank of Russia", description: "Exchange rates and currency conversion", auth: "No", https: true, cors: "unknown", link: "https://www.cbr.ru/development/SXML/" },
  { name: "Currency-api", description: "Free Currency Exchange Rates API with 150+ Currencies & No Rate Limits", auth: "No", https: true, cors: "yes", link: "https://github.com/fawazahmed0/currency-api#readme" },
  { name: "CurrencyFreaks", description: "Provides current and historical currency exchange rates with free plan 1K requests/month", auth: "apiKey", https: true, cors: "yes", link: "https://currencyfreaks.com/" },
  { name: "Currencylayer", description: "Exchange rates and currency conversion", auth: "apiKey", https: true, cors: "unknown", link: "https://currencylayer.com/documentation" },
  { name: "CurrencyScoop", description: "Real-time and historical currency rates JSON API", auth: "apiKey", https: true, cors: "yes", link: "https://currencyscoop.com/api-documentation" },
  { name: "Czech National Bank", description: "A collection of exchange rates", auth: "No", https: true, cors: "unknown", link: "https://www.cnb.cz/cs/financni_trhy/devizovy_trh/kurzy_devizoveho_trhu/denni_kurz.xml" },
  { name: "Economia.Awesome", description: "Portuguese free currency prices and conversion with no rate limits", auth: "No", https: true, cors: "unknown", link: "https://docs.awesomeapi.com.br/api-de-moedas" },
  { name: "ExchangeRate-API", description: "Free currency conversion", auth: "apiKey", https: true, cors: "yes", link: "https://www.exchangerate-api.com" },
  { name: "Exchangerate.host", description: "Free foreign exchange & crypto rates API", auth: "No", https: true, cors: "unknown", link: "https://exchangerate.host" },
  { name: "Exchangeratesapi.io", description: "Exchange rates with currency conversion", auth: "apiKey", https: true, cors: "yes", link: "https://exchangeratesapi.io" },
  { name: "Frankfurter", description: "Exchange rates, currency conversion and time series", auth: "No", https: true, cors: "yes", link: "https://www.frankfurter.app/docs" },
  { name: "FreeForexAPI", description: "Real-time foreign exchange rates for major currency pairs", auth: "No", https: true, cors: "no", link: "https://freeforexapi.com/Home/Api" },
  { name: "National Bank of Poland", description: "A collection of currency exchange rates (data in XML and JSON)", auth: "No", https: true, cors: "yes", link: "http://api.nbp.pl/en.html" },
  { name: "VATComply.com", description: "Exchange rates, geolocation and VAT number validation", auth: "No", https: true, cors: "yes", link: "https://www.vatcomply.com/documentation" },
  // ✅ New / 2025 additions
  { name: "CoinGecko Exchange Rates", description: "Cryptocurrency and fiat exchange rates with free API", auth: "No", https: true, cors: "yes", link: "https://www.coingecko.com/en/api" },
  { name: "Open Exchange Rates", description: "Live and historical currency exchange rates and conversion", auth: "apiKey", https: true, cors: "yes", link: "https://openexchangerates.org/" },
  { name: "X-Rates API", description: "Provides daily currency exchange rates and historical data", auth: "No", https: true, cors: "unknown", link: "https://www.x-rates.com/" },
  { name: "CurrencyAPI.com", description: "Real-time and historical exchange rates for over 160 currencies", auth: "apiKey", https: true, cors: "yes", link: "https://www.currencyapi.com/docs/" }
],
"validation": [
  { name: "Lob.com", description: "US Address Verification", auth: "apiKey", https: true, cors: "unknown", link: "https://lob.com/" },
  { name: "Postman Echo", description: "Test API server to receive and return value from HTTP method", auth: "No", https: true, cors: "unknown", link: "https://www.postman-echo.com" },
  { name: "PurgoMalum", description: "Content validator against profanity & obscenity", auth: "No", https: false, cors: "unknown", link: "http://www.purgomalum.com" },
  { name: "US Autocomplete", description: "Enter address data quickly with real-time address suggestions", auth: "apiKey", https: true, cors: "yes", link: "https://www.smarty.com/docs/cloud/us-autocomplete-pro-api" },
  { name: "US Extract", description: "Extract postal addresses from any text including emails", auth: "apiKey", https: true, cors: "yes", link: "https://www.smarty.com/products/apis/us-extract-api" },
  { name: "US Street Address", description: "Validate and append data for any US postal address", auth: "apiKey", https: true, cors: "yes", link: "https://www.smarty.com/docs/cloud/us-street-api" },
  { name: "vatlayer", description: "VAT number validation", auth: "apiKey", https: true, cors: "unknown", link: "https://vatlayer.com/documentation" },
  // New / 2025 updates
  { name: "Email Validator API", description: "Validate email addresses in real-time", auth: "apiKey", https: true, cors: "yes", link: "https://emailvalidationapi.com/" },
  { name: "AbstractAPI Email Verification", description: "Check if emails are valid, disposable, or role-based", auth: "apiKey", https: true, cors: "yes", link: "https://www.abstractapi.com/email-verification-validation-api" },
  { name: "AddressValidator.net", description: "International address validation and autocomplete", auth: "apiKey", https: true, cors: "yes", link: "https://www.address-validator.net/api" },
  { name: "Byteplant Email Validator", description: "Email validation including MX lookup and syntax check", auth: "apiKey", https: true, cors: "unknown", link: "https://www.email-validator.net/" },
  { name: "Regex101", description: "Online regex tester and pattern validation", auth: "No", https: true, cors: "yes", link: "https://regex101.com/" },
  { name: "NumVerify", description: "Phone number validation and carrier lookup", auth: "apiKey", https: true, cors: "yes", link: "https://numverify.com/" }
],
"development": [
  { name: "24 Pull Requests", description: "Project to promote open source collaboration during December", auth: "No", https: true, cors: "Yes", link: "https://24pullrequests.com/api" },
  { name: "Screenshot", description: "Take programmatic screenshots of web pages from any website", auth: "apiKey", https: true, cors: "Yes", link: "https://www.abstractapi.com/website-screenshot-api" },
  { name: "Agify.io", description: "Estimates the age from a first name", auth: "No", https: true, cors: "Yes", link: "https://agify.io" },
  { name: "API Grátis", description: "Multiples services and public APIs", auth: "No", https: true, cors: "Unknown", link: "https://apigratis.com.br/" },
  { name: "ApicAgent", description: "Extract device details from user‑agent string", auth: "No", https: true, cors: "Yes", link: "https://www.apicagent.com" },
  { name: "ApiFlash", description: "Chrome‑based screenshot API for developers", auth: "apiKey", https: true, cors: "Unknown", link: "https://apiflash.com/" },
  { name: "apilayer userstack", description: "Secure User-Agent String Lookup JSON API", auth: "OAuth", https: true, cors: "Unknown", link: "https://userstack.com/" },
  { name: "APIs.guru", description: "Wikipedia for Web APIs, OpenAPI/Swagger specs for public APIs", auth: "No", https: true, cors: "Unknown", link: "https://apis.guru/api-doc/" },
  { name: "Azure DevOps", description: "REST API for Azure DevOps services", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.microsoft.com/en-us/rest/api/azure/devops" },
  { name: "Base", description: "Building quick backends", auth: "apiKey", https: true, cors: "Yes", link: "https://www.base-api.io/" },
  { name: "Beeceptor", description: "Build a mock REST API endpoint in seconds", auth: "No", https: true, cors: "Yes", link: "https://beeceptor.com/" },
  { name: "Bitbucket", description: "Bitbucket API", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.atlassian.com/bitbucket/api/2/reference/" },
  { name: "Blague.xyz", description: "French jokes API (largest FR jokes API)", auth: "apiKey", https: true, cors: "Yes", link: "https://blague.xyz/" },
  { name: "Blitapp", description: "Schedule screenshots of web pages and sync them to your cloud", auth: "apiKey", https: true, cors: "Unknown", link: "https://blitapp.com/api/" },
  { name: "Blynk-Cloud", description: "Control IoT devices via Blynk IoT Cloud", auth: "apiKey", https: false, cors: "Unknown", link: "https://blynkapi.docs.apiary.io/#" },
  { name: "Bored", description: "Find random activities to fight boredom", auth: "No", https: true, cors: "Unknown", link: "https://www.boredapi.com/" },
  { name: "Brainshop.ai", description: "Make a free AI brain (chatbot API)", auth: "apiKey", https: true, cors: "Yes", link: "https://brainshop.ai/" },
  { name: "Browshot", description: "Make screenshots of web pages in any screen size/device", auth: "apiKey", https: true, cors: "Yes", link: "https://browshot.com/api/documentation" },
  { name: "CDNJS", description: "Library info on CDNJS", auth: "No", https: true, cors: "Unknown", link: "https://api.cdnjs.com/libraries/jquery" },
  { name: "Changelogs.md", description: "Structured changelog metadata from open source projects", auth: "No", https: true, cors: "Unknown", link: "https://changelogs.md" },
  { name: "Ciprand", description: "Secure random string generator", auth: "No", https: true, cors: "No", link: "https://github.com/polarspetroll/ciprand" },
  { name: "Cloudflare Trace", description: "Get IP address, timestamp, user agent, country code, TLS/SSL version & more", auth: "No", https: true, cors: "Yes", link: "https://github.com/fawazahmed0/cloudflare-trace-api" },
  { name: "Codex", description: "Online compiler for various languages", auth: "No", https: true, cors: "Unknown", link: "https://github.com/Jaagrav/CodeX" },
  { name: "Contentful Images", description: "API to retrieve and transform images (Contentful)", auth: "apiKey", https: true, cors: "Yes", link: "https://www.contentful.com/developers/docs/references/images-api/" },
  { name: "CORS Proxy", description: "Proxy to bypass CORS restrictions", auth: "No", https: true, cors: "Yes", link: "https://github.com/burhanuday/cors-proxy" },
  { name: "CountAPI", description: "Free counting service to track page hits/events", auth: "No", https: true, cors: "Yes", link: "https://countapi.xyz" },
  { name: "Databricks", description: "API to manage Databricks account, clusters, notebooks, jobs & workspaces", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.databricks.com/dev-tools/api/latest/index.html" },
  { name: "DigitalOcean Status", description: "Status of all DigitalOcean services", auth: "No", https: true, cors: "Unknown", link: "https://status.digitalocean.com/api" },
  { name: "Docker Hub", description: "Interact with Docker Hub", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.docker.com/docker-hub/api/latest/" },
  { name: "DomainDb Info", description: "Domain name search to find all domains containing particular words/phrases/etc", auth: "No", https: true, cors: "Unknown", link: "https://api.domainsdb.info/" },
  { name: "ExtendsClass JSON Storage", description: "Simple JSON store API", auth: "No", https: true, cors: "Yes", link: "https://extendsclass.com/json-storage.html" },
  { name: "GeekFlare", description: "Testing and monitoring services for websites", auth: "apiKey", https: true, cors: "Unknown", link: "https://apidocs.geekflare.com/docs/geekflare-api" },
  { name: "Genderize.io", description: "Estimates gender from a first name", auth: "No", https: true, cors: "Yes", link: "https://genderize.io" },
  { name: "GETPing", description: "Trigger an email notification with a simple GET request", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.getping.info" },
  { name: "Ghost", description: "Get published content into your website, app or other media", auth: "apiKey", https: true, cors: "Yes", link: "https://ghost.org/" },
  { name: "GitHub", description: "Programmatic access to GitHub repositories, users, and more", auth: "OAuth", https: true, cors: "Yes", link: "https://docs.github.com/en/free-pro-team@latest/rest" },
  { name: "Gitlab", description: "Automate GitLab interaction programmatically", auth: "OAuth", https: true, cors: "Unknown", link: "https://docs.gitlab.com/ee/api/" },
  { name: "Gitter", description: "Chat for Developers", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.gitter.im/docs/welcome" },
  { name: "Glitterly", description: "Image generation API", auth: "apiKey", https: true, cors: "Yes", link: "https://developers.glitterly.app" },
  { name: "Google Docs", description: "API to read, write, and format Google Docs documents", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.google.com/docs/api/reference/rest" },
  { name: "Google Firebase", description: "Google's mobile application development platform", auth: "apiKey", https: true, cors: "Yes", link: "https://firebase.google.com/docs" },
  { name: "Google Fonts", description: "Metadata for all font families served by Google Fonts", auth: "apiKey", https: true, cors: "Unknown", link: "https://developers.google.com/fonts/docs/developer_api" },
  { name: "Google Keep", description: "API to read, write, and format Google Keep notes", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.google.com/keep/api/reference/rest" },
  { name: "Google Sheets", description: "API to read, write, and format Google Sheets data", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.google.com/sheets/api/reference/rest" },
  { name: "Google Slides", description: "API to read, write, and format Google Slides presentations", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.google.com/slides/api/reference/rest" },
  { name: "Gorest", description: "Online REST API for testing and prototyping", auth: "OAuth", https: true, cors: "Unknown", link: "https://gorest.co.in/" },
  { name: "Hasura", description: "GraphQL/REST API engine with built‑in authorization", auth: "apiKey", https: true, cors: "Yes", link: "https://hasura.io/opensource/" },
  { name: "Heroku", description: "REST API to manage apps, add-ons etc. on Heroku", auth: "OAuth", https: true, cors: "Yes", link: "https://devcenter.heroku.com/articles/platform-api-reference/" },
  { name: "host-t.com", description: "Basic DNS query via HTTP GET request", auth: "No", https: true, cors: "No", link: "https://host-t.com" },
  { name: "Host.io", description: "Domains data API for developers", auth: "apiKey", https: true, cors: "Yes", link: "https://host.io" },
  { name: "HTTP2.Pro", description: "Test endpoints for HTTP/2 protocol support", auth: "No", https: true, cors: "Unknown", link: "https://http2.pro/doc/api" },
  { name: "Httpbin", description: "Simple HTTP request & response service", auth: "No", https: true, cors: "Yes", link: "https://httpbin.org/" },
  { name: "Httpbin Cloudflare", description: "HTTP request & response service with HTTP/3 support by Cloudflare", auth: "No", https: true, cors: "Yes", link: "https://cloudflare-quic.com/b/" },
  { name: "Hunter", description: "Domain search, professional email finder & email verifier", auth: "apiKey", https: true, cors: "Unknown", link: "https://hunter.io/api" },
  { name: "IBM Text to Speech", description: "Convert text to speech", auth: "apiKey", https: true, cors: "Yes", link: "https://cloud.ibm.com/docs/text-to-speech/getting-started.html" },
  { name: "Icanhazepoch", description: "Get current epoch time", auth: "No", https: true, cors: "Yes", link: "https://icanhazepoch.com/" },
  { name: "Icanhazip", description: "Simple IP address API", auth: "No", https: true, cors: "Yes", link: "https://major.io/icanhazip-com-faq/" },
  { name: "Image-Charts", description: "Generate charts, QR codes and graph images", auth: "No", https: true, cors: "Yes", link: "https://documentation.image-charts.com/" },
  { name: "import.io", description: "Retrieve structured data from a website or RSS feed", auth: "apiKey", https: true, cors: "Unknown", link: "http://api.docs.import.io/" },
  { name: "ip-fast.com", description: "IP address, country and city lookup", auth: "No", https: true, cors: "Yes", link: "https://ip-fast.com/docs/" },
  { name: "IP2WHOIS Information Lookup", description: "WHOIS domain name lookup API", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.ip2whois.com/" },
  { name: "ipfind.io", description: "Geographic location & info for an IP address or domain", auth: "apiKey", https: true, cors: "Yes", link: "https://ipfind.io" },
  { name: "IPify", description: "Simple public IP address API", auth: "No", https: true, cors: "Unknown", link: "https://www.ipify.org/" },
  { name: "IPinfo", description: "IP address information API", auth: "No", https: true, cors: "Unknown", link: "https://ipinfo.io/developers" },
  { name: "jsDelivr", description: "Package info and download stats on jsDelivr CDN", auth: "No", https: true, cors: "Yes", link: "https://github.com/jsdelivr/data.jsdelivr.com" },
  { name: "JSON 2 JSONP", description: "Convert JSON to JSONP (on‑the‑fly) for cross-domain requests", auth: "No", https: true, cors: "Unknown", link: "https://json2jsonp.com/" },
  { name: "JSONbin.io", description: "Free JSON storage service for small scale apps/websites", auth: "apiKey", https: true, cors: "Yes", link: "https://jsonbin.io" },
  { name: "Kroki", description: "Create diagrams from textual descriptions", auth: "No", https: true, cors: "Yes", link: "https://kroki.io" },
  { name: "License‑API", description: "Unofficial REST API for choosealicense.com", auth: "No", https: true, cors: "No", link: "https://github.com/cmccandless/license-api/blob/master/README.md" },
  { name: "Logs.to", description: "Generate logs via API", auth: "apiKey", https: true, cors: "Unknown", link: "https://logs.to/" },
  { name: "Lua Decompiler", description: "Online Lua 5.1 decompiler service", auth: "No", https: true, cors: "Yes", link: "https://lua-decompiler.ferib.dev/" },
  { name: "MAC address vendor lookup", description: "Retrieve vendor & details for a given MAC or OUI", auth: "apiKey", https: true, cors: "Yes", link: "https://macaddress.io/api" },
  { name: "Micro DB", description: "Simple database service via API", auth: "apiKey", https: true, cors: "Unknown", link: "https://m3o.com/db" },
  { name: "MicroENV", description: "Fake REST API for developers", auth: "No", https: true, cors: "Unknown", link: "https://microenv.com/" },
  { name: "Mocky", description: "Mock user-defined test JSON REST endpoints", auth: "No", https: true, cors: "Yes", link: "https://designer.mocky.io/" },
  { name: "MY IP", description: "Get IP address and related info", auth: "No", https: true, cors: "Unknown", link: "https://www.myip.com/api-docs/" },
  { name: "Nationalize.io", description: "Estimate the nationality from a first name", auth: "No", https: true, cors: "Yes", link: "https://nationalize.io" },
  { name: "Netlify", description: "Hosting & programmable web service API", auth: "OAuth", https: true, cors: "Unknown", link: "https://docs.netlify.com/api/get-started/" },
  { name: "NetworkCalc", description: "Network calculators: subnets, DNS, binary & security tools", auth: "No", https: true, cors: "Yes", link: "https://networkcalc.com/api/docs" },
  { name: "npm Registry", description: "Query information about Node.js libraries programmatically", auth: "No", https: true, cors: "Unknown", link: "https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md" },
  { name: "OneSignal", description: "Push notifications, Email, SMS & In-App messaging service API", auth: "apiKey", https: true, cors: "Unknown", link: "https://documentation.onesignal.com/docs/onesignal-api" },
  { name: "Open Page Rank", description: "API for calculating and comparing website metrics using PageRank algorithm", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.domcop.com/openpagerank/" },
  { name: "OpenAPIHub", description: "All-in-one API platform / directory", auth: "X-Mashape-Key", https: true, cors: "Unknown", link: "https://hub.openapihub.com/" },
  { name: "OpenGraphr", description: "Simple API to retrieve OpenGraph data from a URL", auth: "apiKey", https: true, cors: "Unknown", link: "https://opengraphr.com/docs/1.0/overview" },
  { name: "oyyi", description: "API for fake data, image/video conversion, optimization, PDF optimization and thumbnail generation", auth: "No", https: true, cors: "Yes", link: "https://oyyi.xyz/docs/1.0" },
  { name: "PageCDN", description: "Public API for JS, CSS and font libraries on PageCDN", auth: "apiKey", https: true, cors: "Yes", link: "https://pagecdn.com/docs/public-api" },
  { name: "Postman", description: "Tool for testing APIs", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.postman.com/postman/workspace/postman-public-workspace/documentation/12959542-c8142d51-e97c-46b6-bd77-52bb66712c9a" },
  { name: "ProxyCrawl", description: "Web scraping & anti‑captcha service (proxies)", auth: "apiKey", https: true, cors: "Unknown", link: "https://proxycrawl.com" },
  { name: "ProxyKingdom", description: "Rotating proxy API", auth: "apiKey", https: true, cors: "Yes", link: "https://proxykingdom.com" },
  { name: "Pusher Beams", description: "Push notifications for Android & iOS", auth: "apiKey", https: true, cors: "Unknown", link: "https://pusher.com/beams" },
  { name: "QR code (qrtag)", description: "Generate QR codes and URL shortener", auth: "No", https: true, cors: "Yes", link: "https://www.qrtag.net/api/" },
  { name: "QR code (goqr)", description: "Generate and decode QR code graphics", auth: "No", https: true, cors: "Unknown", link: "http://goqr.me/api/" },
  { name: "Qrcode Monkey", description: "Generate custom QR codes with logo", auth: "No", https: true, cors: "Unknown", link: "https://www.qrcode-monkey.com/qr-code-api-with-logo/" },
  { name: "QuickChart", description: "Generate chart and graph images", auth: "No", https: true, cors: "Yes", link: "https://quickchart.io/" },
  { name: "Random Stuff", description: "API for AI responses, jokes, memes and more", auth: "apiKey", https: true, cors: "Yes", link: "https://api-docs.pgamerx.com/" },
  { name: "Rejax", description: "Reverse AJAX service to notify clients", auth: "apiKey", https: true, cors: "No", link: "https://rejax.io/" },
  { name: "ReqRes", description: "A hosted REST‑API ready to respond to your AJAX requests (for testing)", auth: "No", https: true, cors: "Unknown", link: "https://reqres.in/" },
  { name: "RSS feed to JSON", description: "Returns RSS feed in JSON format via feed URL", auth: "No", https: true, cors: "Yes", link: "https://rss-to-json-serverless-api.vercel.app" },
  { name: "SavePage.io", description: "Free RESTful API to screenshot any website", auth: "apiKey", https: true, cors: "Yes", link: "https://www.savepage.io" },
  { name: "ScrapeNinja", description: "Scraping API with Chrome fingerprint and residential proxies", auth: "apiKey", https: true, cors: "Unknown", link: "https://scrapeninja.net" },
  { name: "ScraperApi", description: "Scalable web scrapers API", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.scraperapi.com" },
  { name: "scraperBox", description: "Undetectable web scraping API", auth: "apiKey", https: true, cors: "Yes", link: "https://scraperbox.com/" },
  { name: "scrapestack", description: "Real-time proxy & web scraping REST API", auth: "apiKey", https: true, cors: "Unknown", link: "https://scrapestack.com/" },
  { name: "ScrapingAnt", description: "Headless Chrome scraping with JS rendering API", auth: "apiKey", https: true, cors: "Unknown", link: "https://scrapingant.com" },
  { name: "ScrapingDog", description: "Proxy API for web scraping", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.scrapingdog.com/" },
  { name: "ScreenshotAPI.net", description: "Create pixel‑perfect website screenshots", auth: "apiKey", https: true, cors: "Yes", link: "https://screenshotapi.net/" },
  { name: "Serialif Color", description: "Color conversion, grayscale, contrast and text color generation", auth: "No", https: true, cors: "No", link: "https://color.serialif.com/" },
  { name: "serpstack", description: "Real-time & accurate Google search results via API", auth: "apiKey", https: true, cors: "Yes", link: "https://serpstack.com/" },
  { name: "Sheetsu", description: "Easy Google Sheets integration API", auth: "apiKey", https: true, cors: "Unknown", link: "https://sheetsu.com/" },
  { name: "SHOUTCLOUD", description: "ALL-CAPS text as a service", auth: "No", https: false, cors: "Unknown", link: "http://shoutcloud.io/" },
  { name: "Sonar", description: "DNS enumeration API", auth: "No", https: true, cors: "Yes", link: "https://github.com/Cgboal/SonarSearch" },
  { name: "SonarQube", description: "REST APIs to detect bugs, code smells & security vulnerabilities", auth: "OAuth", https: true, cors: "Unknown", link: "https://sonarcloud.io/web_api" },
  { name: "StackExchange", description: "Q&A forum API for developers", auth: "OAuth", https: true, cors: "Unknown", link: "https://api.stackexchange.com/" },
  { name: "Statically", description: "Free CDN and API for developers", auth: "No", https: true, cors: "Yes", link: "https://statically.io/" },
  { name: "Supportivekoala", description: "Autogenerate images with templates via API", auth: "apiKey", https: true, cors: "Yes", link: "https://developers.supportivekoala.com/" },
  { name: "Tyk", description: "API and service management platform API", auth: "apiKey", https: true, cors: "Yes", link: "https://tyk.io/open-source/" },
  { name: "Wandbox", description: "Online code compiler supporting 35+ languages", auth: "No", https: true, cors: "Unknown", link: "https://github.com/melpon/wandbox/blob/master/kennel2/API.rst" },
  { name: "WebScraping.AI", description: "Web scraping API with built‑in proxies and JS rendering", auth: "apiKey", https: true, cors: "Yes", link: "https://webscraping.ai/" },
  { name: "ZenRows", description: "Web scraping API that bypasses anti-bot solutions, offers JS rendering and rotating proxies", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.zenrows.com/" }
],
"dictionaries": [
  { name: "Chinese Character Web", description: "Chinese character definitions and pronunciations", auth: "No", https: false, cors: "no", link: "http://ccdb.hemiola.com/" },
  { name: "Chinese Text Project", description: "Online open-access digital library for pre-modern Chinese texts", auth: "No", https: true, cors: "unknown", link: "https://ctext.org/tools/api" },
  { name: "Collins", description: "Bilingual Dictionary and Thesaurus Data", auth: "apiKey", https: true, cors: "unknown", link: "https://api.collinsdictionary.com/api/v1/documentation/html/" },
  { name: "Free Dictionary", description: "Definitions, phonetics, pronunciations, parts of speech, examples, synonyms", auth: "No", https: true, cors: "unknown", link: "https://dictionaryapi.dev/" },
  { name: "Indonesia Dictionary", description: "Indonesia dictionary with many words", auth: "No", https: true, cors: "unknown", link: "https://new-kbbi-api.herokuapp.com/" },
  { name: "Lingua Robot", description: "Word definitions, pronunciations, synonyms, antonyms, and other info", auth: "apiKey", https: true, cors: "yes", link: "https://www.linguarobot.io" },
  { name: "Merriam-Webster", description: "Dictionary and Thesaurus Data", auth: "apiKey", https: true, cors: "unknown", link: "https://dictionaryapi.com/" },
  { name: "OwlBot", description: "Definitions with example sentences and photos if available", auth: "apiKey", https: true, cors: "yes", link: "https://owlbot.info/" },
  { name: "Oxford", description: "Dictionary Data", auth: "apiKey", https: true, cors: "no", link: "https://developer.oxforddictionaries.com/" },
  { name: "Synonyms", description: "Synonyms, thesaurus and antonyms for any given word", auth: "apiKey", https: true, cors: "unknown", link: "https://www.synonyms.com/synonyms_api.php" },
  { name: "Wiktionary", description: "Collaborative dictionary data", auth: "No", https: true, cors: "yes", link: "https://en.wiktionary.org/w/api.php" },
  { name: "Wordnik", description: "Dictionary Data", auth: "apiKey", https: true, cors: "unknown", link: "https://developer.wordnik.com" },
  { name: "Words API", description: "Definitions and synonyms for more than 150,000 words", auth: "apiKey", https: true, cors: "unknown", link: "https://www.wordsapi.com/docs/" },
  // New / Updated 2025 APIs
  { name: "Datamuse API", description: "Word-finding query engine: rhymes, synonyms, definitions, related words", auth: "No", https: true, cors: "yes", link: "https://www.datamuse.com/api/" },
  { name: "Vocabulary API", description: "English word definitions, synonyms, antonyms, example sentences", auth: "apiKey", https: true, cors: "unknown", link: "https://www.vocabularyapi.com/" },
  { name: "Lexicala API", description: "Professional dictionary data for multiple languages", auth: "apiKey", https: true, cors: "unknown", link: "https://www.lexicala.com/developers/" }
],
"documents": [
  { name: "Airtable", description: "Integrate with Airtable", auth: "apiKey", https: true, cors: "unknown", link: "https://airtable.com/api" },
  { name: "Api2Convert", description: "Online File Conversion API", auth: "apiKey", https: true, cors: "unknown", link: "https://www.api2convert.com/" },
  { name: "apilayer pdflayer", description: "HTML/URL to PDF", auth: "apiKey", https: true, cors: "unknown", link: "https://pdflayer.com" },
  { name: "Asana", description: "Programmatic access to all data in your Asana system", auth: "apiKey", https: true, cors: "yes", link: "https://developers.asana.com/docs" },
  { name: "ClickUp", description: "Cloud-based project management tool for boosting productivity", auth: "OAuth", https: true, cors: "unknown", link: "https://clickup.com/api" },
  { name: "Clockify", description: "REST-based API to push/pull time tracking data", auth: "apiKey", https: true, cors: "unknown", link: "https://clockify.me/developers-api" },
  { name: "CloudConvert", description: "Online file converter for audio, video, document, ebook, archive, image, spreadsheet, presentation", auth: "apiKey", https: true, cors: "unknown", link: "https://cloudconvert.com/api/v2" },
  { name: "Cloudmersive Document and Data Conversion", description: "HTML/URL to PDF/PNG, Office documents to PDF, image conversion", auth: "apiKey", https: true, cors: "yes", link: "https://cloudmersive.com/convert-api" },
  { name: "Code::Stats", description: "Automatic time tracking for programmers", auth: "apiKey", https: true, cors: "no", link: "https://codestats.net/api-docs" },
  { name: "CraftMyPDF", description: "Generate PDF documents from templates", auth: "apiKey", https: true, cors: "no", link: "https://craftmypdf.com" },
  { name: "Flowdash", description: "Automate business workflows", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.flowdash.com/docs/api-introduction" },
  { name: "Html2PDF", description: "HTML/URL to PDF conversion", auth: "apiKey", https: true, cors: "unknown", link: "https://html2pdf.app/" },
  { name: "iLovePDF", description: "Convert, merge, split, extract text and add page numbers for PDFs", auth: "apiKey", https: true, cors: "yes", link: "https://developer.ilovepdf.com/" },
  { name: "JIRA", description: "Issue tracking and agile project management", auth: "OAuth", https: true, cors: "unknown", link: "https://developer.atlassian.com/server/jira/platform/rest-apis/" },
  { name: "Mattermost", description: "Open source platform for developer collaboration", auth: "OAuth", https: true, cors: "unknown", link: "https://api.mattermost.com/" },
  { name: "Mercury", description: "Web parser for content extraction", auth: "apiKey", https: true, cors: "unknown", link: "https://mercury.postlight.com/web-parser/" },
  { name: "Monday", description: "Programmatically access and update data inside a monday.com account", auth: "apiKey", https: true, cors: "unknown", link: "https://api.developer.monday.com/docs" },
  { name: "Notion", description: "Integrate with Notion", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.notion.com/docs/getting-started" },
  { name: "PandaDoc", description: "DocGen and eSignatures API", auth: "apiKey", https: true, cors: "no", link: "https://developers.pandadoc.com" },
  { name: "Pocket", description: "Bookmarking service", auth: "OAuth", https: true, cors: "unknown", link: "https://getpocket.com/developer/" },
  { name: "Podio", description: "File sharing and productivity platform", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.podio.com" },
  { name: "PrexView", description: "Convert XML/JSON data to PDF, HTML or Image", auth: "apiKey", https: true, cors: "unknown", link: "https://prexview.com" },
  { name: "Restpack", description: "Screenshot, HTML to PDF, and content extraction APIs", auth: "apiKey", https: true, cors: "unknown", link: "https://restpack.io/" },
  { name: "Todoist", description: "Todo Lists and task management", auth: "OAuth", https: true, cors: "unknown", link: "https://developer.todoist.com" },
  { name: "Smart Image Enhancement API", description: "Upscale and enhance images using AI super-resolution", auth: "apiKey", https: true, cors: "unknown", link: "https://apilayer.com/marketplace/image_enhancement-api" },
  { name: "Vector Express v2.0", description: "Free vector file converting API", auth: "No", https: true, cors: "no", link: "https://vector.express" },
  { name: "WakaTime", description: "Automated time tracking and leaderboards for programmers", auth: "No", https: true, cors: "unknown", link: "https://wakatime.com/developers" },
  { name: "Zube", description: "Full stack project management platform", auth: "OAuth", https: true, cors: "unknown", link: "https://zube.io/docs/api" },
  // ✅ New / Updated 2025 additions
  { name: "PDF.co", description: "PDF tools API for parsing, splitting, merging, and generating PDFs", auth: "apiKey", https: true, cors: "yes", link: "https://apidocs.pdf.co/" },
  { name: "DocuSign", description: "eSignature and document workflow automation", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.docusign.com/docs/esign-rest-api/" },
  { name: "Sheety", description: "Turn Google Sheets into a REST API", auth: "apiKey", https: true, cors: "yes", link: "https://sheety.co/docs" },
  { name: "Cloudmersive OCR", description: "Optical Character Recognition API for documents and images", auth: "apiKey", https: true, cors: "yes", link: "https://cloudmersive.com/ocr-api" },
  { name: "ConvertAPI", description: "File conversion API for PDF, Office, images, and documents", auth: "apiKey", https: true, cors: "yes", link: "https://www.convertapi.com/doc" }
],
"email": [
  { name: "apilayer mailboxlayer", description: "Email address validation", auth: "apiKey", https: true, cors: "unknown", link: "https://mailboxlayer.com" },
  { name: "Email Validation (AbstractAPI)", description: "Validate email addresses for deliverability and spam", auth: "apiKey", https: true, cors: "yes", link: "https://www.abstractapi.com/email-verification-validation-api" },
  { name: "Cloudmersive Validate", description: "Validate email addresses, phone numbers, VAT numbers and domain names", auth: "apiKey", https: true, cors: "yes", link: "https://cloudmersive.com/validate-api" },
  { name: "Disify", description: "Validate and detect disposable and temporary email addresses", auth: "No", https: true, cors: "yes", link: "https://www.disify.com/" },
  { name: "DropMail", description: "GraphQL API for creating and managing ephemeral e-mail inboxes", auth: "No", https: true, cors: "unknown", link: "https://dropmail.me/api/#live-demo" },
  { name: "EVA", description: "Validate email addresses", auth: "No", https: true, cors: "yes", link: "https://eva.pingutil.com/" },
  { name: "Guerrilla Mail", description: "Disposable temporary Email addresses", auth: "No", https: true, cors: "unknown", link: "https://www.guerrillamail.com/GuerrillaMailAPI.html" },
  { name: "ImprovMX", description: "API for free email forwarding service", auth: "apiKey", https: true, cors: "unknown", link: "https://improvmx.com/api" },
  { name: "Kickbox", description: "Email verification API", auth: "No", https: true, cors: "yes", link: "https://open.kickbox.com/" },
  { name: "mail.gw", description: "10 Minute Mail", auth: "No", https: true, cors: "yes", link: "https://docs.mail.gw" },
  { name: "mail.tm", description: "Temporary Email Service", auth: "No", https: true, cors: "yes", link: "https://docs.mail.tm" },
  { name: "MailboxValidator", description: "Validate email address to improve deliverability", auth: "apiKey", https: true, cors: "unknown", link: "https://www.mailboxvalidator.com/api-email-free" },
  { name: "MailCheck.ai", description: "Prevent users from signing up with temporary email addresses", auth: "No", https: true, cors: "unknown", link: "https://www.mailcheck.ai/#documentation" },
  { name: "Mailtrap", description: "Safe testing of emails from development and staging environments", auth: "apiKey", https: true, cors: "unknown", link: "https://mailtrap.docs.apiary.io/#" },
  { name: "Sendgrid", description: "Cloud-based SMTP provider for sending emails", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.sendgrid.com/api-reference/" },
  { name: "Sendinblue", description: "Marketing & transactional email/SMS service", auth: "apiKey", https: true, cors: "unknown", link: "https://developers.sendinblue.com/docs" },
  { name: "Verifier", description: "Verifies that a given email is real", auth: "apiKey", https: true, cors: "yes", link: "https://verifier.meetchopra.com/docs#/" },

  // ✅ New / Updated (2025)
  { name: "ZeroBounce", description: "Email validation and scoring to improve deliverability", auth: "apiKey", https: true, cors: "yes", link: "https://www.zerobounce.net/docs" },
  { name: "MailboxLayer Free API", description: "Email verification with free tier support", auth: "apiKey", https: true, cors: "yes", link: "https://mailboxlayer.com/documentation" },
  { name: "NeverBounce", description: "Email verification API to reduce bounce rates", auth: "apiKey", https: true, cors: "yes", link: "https://developers.neverbounce.com/" },
  { name: "Hunter Email Verifier", description: "Verify the deliverability of email addresses", auth: "apiKey", https: true, cors: "yes", link: "https://hunter.io/api/email-verifier" },
  { name: "Mailboxlayer Real-time API", description: "Check email syntax, domain, MX records and disposable emails", auth: "apiKey", https: true, cors: "yes", link: "https://mailboxlayer.com/documentation" }
],
"entertainment": [
  { name: "chucknorris.io", description: "JSON API for hand curated Chuck Norris jokes", auth: "No", https: true, cors: "unknown", link: "https://api.chucknorris.io" },
  { name: "Corporate Buzz Words", description: "REST API for Corporate Buzz Words", auth: "No", https: true, cors: "yes", link: "https://github.com/sameerkumar18/corporate-bs-generator-api" },
  { name: "Excuser", description: "Get random excuses for various situations", auth: "No", https: true, cors: "unknown", link: "https://excuser.herokuapp.com/" },
  { name: "Fun Fact", description: "Randomly select and return a fact from the FFA database", auth: "No", https: true, cors: "yes", link: "https://api.aakhilv.me" },
  { name: "Imgflip", description: "Gets an array of popular memes", auth: "No", https: true, cors: "unknown", link: "https://imgflip.com/api" },
  { name: "Meme Maker", description: "REST API for creating your own meme", auth: "No", https: true, cors: "unknown", link: "https://mememaker.github.io/API/" },
  { name: "NaMoMemes", description: "Memes on Narendra Modi", auth: "No", https: true, cors: "unknown", link: "https://github.com/theIYD/NaMoMemes" },
  { name: "Random Useless Facts", description: "Get useless, but true facts", auth: "No", https: true, cors: "unknown", link: "https://uselessfacts.jsph.pl/" },
  { name: "Techy", description: "JSON and Plaintext API for tech-savvy sounding phrases", auth: "No", https: true, cors: "unknown", link: "https://techy-api.vercel.app/" },
  { name: "Yo Momma Jokes", description: "REST API for Yo Momma Jokes", auth: "No", https: true, cors: "unknown", link: "https://github.com/beanboi7/yomomma-apiv2" },

  // ✅ 2025 / newer APIs
  { name: "JokeAPI", description: "Multi-category joke API including programming, misc, and pun jokes", auth: "No", https: true, cors: "yes", link: "https://v2.jokeapi.dev/" },
  { name: "Dad Jokes", description: "Random dad jokes API", auth: "No", https: true, cors: "yes", link: "https://icanhazdadjoke.com/api" },
  { name: "Advice Slip JSON API", description: "Random advice API", auth: "No", https: true, cors: "yes", link: "https://api.adviceslip.com/" },
  { name: "Ron Swanson Quotes", description: "Random Ron Swanson quotes", auth: "No", https: true, cors: "yes", link: "https://ron-swanson-quotes.herokuapp.com/v2/quotes" },
  { name: "Kanye Rest", description: "Random Kanye West quotes", auth: "No", https: true, cors: "yes", link: "https://api.kanye.rest/" },
  { name: "Meme API", description: "Collection of memes from Reddit", auth: "No", https: true, cors: "yes", link: "https://meme-api.com/gimme" }
],
"environment": [
  { name: "BreezoMeter Pollen", description: "Daily forecast pollen conditions data for a specific location", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.breezometer.com/api-documentation/pollen-api/v2/" },
  { name: "Carbon Interface", description: "API to calculate carbon (CO2) emissions estimates for common CO2-emitting activities", auth: "apiKey", https: true, cors: "yes", link: "https://docs.carboninterface.com/" },
  { name: "Climatiq", description: "Calculate the environmental footprint created by a broad range of emission-generating activities", auth: "apiKey", https: true, cors: "yes", link: "https://docs.climatiq.io" },
  { name: "Cloverly", description: "API calculates the impact of common carbon-intensive activities in real time", auth: "apiKey", https: true, cors: "unknown", link: "https://www.cloverly.com/carbon-offset-documentation" },
  { name: "CO2 Offset", description: "API calculates and validates the carbon footprint", auth: "No", https: true, cors: "unknown", link: "https://co2offset.io/api.html" },
  { name: "Danish Data Service Energi", description: "Open energy data from Energinet to society", auth: "No", https: true, cors: "unknown", link: "https://www.energidataservice.dk/" },
  { name: "GrünstromIndex", description: "Green Power Index for Germany (Grünstromindex/GSI)", auth: "No", https: false, cors: "yes", link: "https://gruenstromindex.de/" },
  { name: "IQAir", description: "Air quality and weather data", auth: "apiKey", https: true, cors: "unknown", link: "https://www.iqair.com/air-pollution-data-api" },
  { name: "Luchtmeetnet", description: "Predicted and actual air quality components for The Netherlands (RIVM)", auth: "No", https: true, cors: "unknown", link: "https://api-docs.luchtmeetnet.nl/" },
  { name: "National Grid ESO", description: "Open data from Great Britain’s Electricity System Operator", auth: "No", https: true, cors: "unknown", link: "https://data.nationalgrideso.com/" },
  { name: "OpenAQ", description: "Open air quality data", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.openaq.org/" },
  { name: "PM2.5 Open Data Portal", description: "Open low-cost PM2.5 sensor data", auth: "No", https: true, cors: "unknown", link: "https://pm25.lass-net.org/#apis" },
  { name: "PM25.in", description: "Air quality of China", auth: "apiKey", https: false, cors: "unknown", link: "http://www.pm25.in/api_doc" },
  { name: "PVWatts", description: "Energy production photovoltaic (PV) energy systems", auth: "apiKey", https: true, cors: "unknown", link: "https://developer.nrel.gov/docs/solar/pvwatts/v6/" },
  { name: "Srp Energy", description: "Hourly usage energy report for Srp customers", auth: "apiKey", https: true, cors: "no", link: "https://srpenergy-api-client-python.readthedocs.io/en/latest/api.html" },
  { name: "UK Carbon Intensity", description: "The Official Carbon Intensity API for Great Britain developed by National Grid", auth: "No", https: true, cors: "unknown", link: "https://carbon-intensity.github.io/api-definitions/#carbon-intensity-api-v1-0-0" },
  { name: "Website Carbon", description: "API to estimate the carbon footprint of loading web pages", auth: "No", https: true, cors: "unknown", link: "https://api.websitecarbon.com/" },
  // ✅ New / 2024–2025 additions
  { name: "Open Meteo", description: "Free weather, air quality, and environmental data API with no API key required", auth: "No", https: true, cors: "yes", link: "https://open-meteo.com/" },
  { name: "Weatherbit Air Quality", description: "Real-time and historical air quality data API", auth: "apiKey", https: true, cors: "yes", link: "https://www.weatherbit.io/api/air-quality" },
  { name: "ClimaCell / Tomorrow.io", description: "Weather, air quality and climate impact API", auth: "apiKey", https: true, cors: "yes", link: "https://www.tomorrow.io/weather-api/" },
  { name: "EPA AirNow", description: "Air quality data for the United States", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.airnowapi.org/" },
  { name: "OpenWeather Air Pollution", description: "Air pollution data from OpenWeather API", auth: "apiKey", https: true, cors: "yes", link: "https://openweathermap.org/api/air-pollution" }
],

"events":[
  { name: "Eventbrite", description: "Find events (platform / ticketing)", auth: "OAuth", https: true, cors: "unknown", link: "https://www.eventbrite.com/platform/api/" },
  { name: "SeatGeek", description: "Search events, venues, and performers", auth: "apiKey", https: true, cors: "unknown", link: "https://platform.seatgeek.com/" },
  { name: "Ticketmaster", description: "Search concerts, sports & entertainment events / venues", auth: "apiKey", https: true, cors: "unknown", link: "http://developer.ticketmaster.com/products-and-docs/apis/getting-started/" },
  { name: "Google Calendar", description: "Calendar management / event scheduling API", auth: "OAuth", https: true, cors: "unknown", link: "https://developers.google.com/calendar" },
  { name: "Billetto", description: "Events and ticket management platform API", auth: "OAuth", https: true, cors: "unknown", link: "https://support.billetto.com/hc/articles/360020747740" }
],
finance : [
  { name: "VAT Validation", description: "Validate VAT numbers and calculate VAT rates", auth: "apiKey", https: true, cors: "yes", link: "https://www.abstractapi.com/vat-validation-rates-api" },
  { name: "Aletheia", description: "Insider trading data, earnings call analysis, financial statements, and more", auth: "apiKey", https: true, cors: "yes", link: "https://aletheiaapi.com/" },
  { name: "Alpaca", description: "Realtime and historical market data on all US equities and ETFs", auth: "apiKey", https: true, cors: "yes", link: "https://alpaca.markets/docs/api-documentation/api-v2/market-data/alpaca-data-api-v2/" },
  { name: "Alpha Vantage", description: "Realtime and historical stock data", auth: "apiKey", https: true, cors: "unknown", link: "https://www.alphavantage.co/" },
  { name: "apilayer marketstack", description: "Real-Time, Intraday & Historical Market Data API", auth: "apiKey", https: true, cors: "unknown", link: "https://marketstack.com/" },
  { name: "Banco do Brasil", description: "All Banco do Brasil financial transaction APIs", auth: "OAuth", https: true, cors: "yes", link: "https://developers.bb.com.br/home" },
  { name: "Bank Data API", description: "Instant IBAN and SWIFT number validation across the globe", auth: "apiKey", https: true, cors: "unknown", link: "https://apilayer.com/marketplace/bank_data-api" },
  { name: "Billplz", description: "Payment platform", auth: "apiKey", https: true, cors: "unknown", link: "https://www.billplz.com/api" },
  { name: "Binlist", description: "Public access to a database of IIN/BIN information", auth: "No", https: true, cors: "unknown", link: "https://binlist.net/" },
  { name: "Boleto.Cloud", description: "API to generate boletos in Brazil", auth: "apiKey", https: true, cors: "unknown", link: "https://boleto.cloud/" },
  { name: "Citi", description: "All Citigroup account and statement data APIs", auth: "apiKey", https: true, cors: "unknown", link: "https://sandbox.developerhub.citi.com/api-catalog-list" },
  { name: "Econdb", description: "Global macroeconomic data", auth: "No", https: true, cors: "yes", link: "https://www.econdb.com/api/" },
  { name: "Fed Treasury", description: "U.S. Department of the Treasury Data", auth: "No", https: true, cors: "unknown", link: "https://fiscaldata.treasury.gov/api-documentation/" },
  { name: "Finage", description: "Stock, currency, cryptocurrency, indices, and ETFs real-time & historical data provider", auth: "apiKey", https: true, cors: "unknown", link: "https://finage.co.uk" },
  { name: "Financial Modeling Prep", description: "Realtime and historical stock data", auth: "apiKey", https: true, cors: "unknown", link: "https://site.financialmodelingprep.com/developer/docs" },
  { name: "Finnhub", description: "Real-Time RESTful APIs and Websocket for Stocks, Currencies, and Crypto", auth: "apiKey", https: true, cors: "unknown", link: "https://finnhub.io/docs/api" },
  { name: "FRED", description: "Economic data from the Federal Reserve Bank of St. Louis", auth: "apiKey", https: true, cors: "yes", link: "https://fred.stlouisfed.org/docs/api/fred/" },
  { name: "Front Accounting APIs", description: "Front accounting is multilingual and multicurrency software for small businesses", auth: "OAuth", https: true, cors: "yes", link: "https://frontaccounting.com/fawiki/index.php?n=Devel.SimpleAPIModule" },
  { name: "Hotstoks", description: "Stock market data powered by SQL", auth: "apiKey", https: true, cors: "yes", link: "https://hotstoks.com?utm_source=public-apis" },
  { name: "IEX Cloud", description: "Realtime & Historical Stock and Market Data", auth: "apiKey", https: true, cors: "yes", link: "https://iexcloud.io/docs/api/" },
  { name: "IG", description: "Spreadbetting and CFD Market Data", auth: "apiKey", https: true, cors: "unknown", link: "https://labs.ig.com/gettingstarted" },
  { name: "Indian Mutual Fund", description: "Get complete history of India Mutual Funds Data", auth: "No", https: true, cors: "unknown", link: "https://www.mfapi.in/" },
  { name: "Intrinio", description: "A wide selection of financial data feeds", auth: "apiKey", https: true, cors: "unknown", link: "https://intrinio.com/" },
  { name: "Klarna", description: "Klarna payment and shopping service", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.klarna.com/klarna-payments/api/payments-api/" },
  { name: "MercadoPago", description: "Mercado Pago API reference", auth: "apiKey", https: true, cors: "unknown", link: "https://www.mercadopago.com.br/developers/es/reference" },
  { name: "Mono", description: "Connect with users’ bank accounts and access transaction data in Africa", auth: "apiKey", https: true, cors: "unknown", link: "https://mono.co/" },
  { name: "Moov", description: "The Moov API makes it simple for platforms to send, receive, and store money", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.moov.io/api/" },
  { name: "Nordigen", description: "Connect to bank accounts using official bank APIs and get raw transaction data", auth: "apiKey", https: true, cors: "unknown", link: "https://nordigen.com/en/account_information_documenation/integration/quickstart_guide/" },
  { name: "OpenFIGI", description: "Equity, index, futures, options symbology from Bloomberg LP", auth: "apiKey", https: true, cors: "yes", link: "https://www.openfigi.com/api" },
  { name: "Plaid", description: "Connect with user's bank accounts and access transaction data", auth: "apiKey", https: true, cors: "unknown", link: "https://www.plaid.com/docs" },
  { name: "Polygon", description: "Historical stock market data", auth: "apiKey", https: true, cors: "unknown", link: "https://polygon.io/" },
  { name: "Portfolio Optimizer", description: "Portfolio analysis and optimization", auth: "No", https: true, cors: "yes", link: "https://portfoliooptimizer.io/" },
  { name: "Razorpay IFSC", description: "Indian Financial Systems Code (Bank Branch Codes)", auth: "No", https: true, cors: "unknown", link: "https://razorpay.com/docs/" },
  { name: "Real Time Finance", description: "Websocket API to access realtime stock data", auth: "apiKey", https: false, cors: "unknown", link: "https://github.com/Real-time-finance/finance-websocket-API/" },
  { name: "SEC EDGAR Data", description: "API to access annual reports of public US companies", auth: "No", https: true, cors: "yes", link: "https://www.sec.gov/edgar/sec-api-documentation" },
  { name: "SmartAPI", description: "Gain access to set of SmartAPI and create end-to-end broking services", auth: "apiKey", https: true, cors: "unknown", link: "https://smartapi.angelbroking.com/" },
  { name: "StockData", description: "Real-Time, Intraday & Historical Market Data, News and Sentiment API", auth: "apiKey", https: true, cors: "yes", link: "https://www.StockData.org" },
  { name: "Styvio", description: "Realtime and historical stock data and current stock sentiment", auth: "apiKey", https: true, cors: "unknown", link: "https://www.Styvio.com" },
  { name: "Tax Data API", description: "Instant VAT number and tax validation across the globe", auth: "apiKey", https: true, cors: "unknown", link: "https://apilayer.com/marketplace/tax_data-api" },
  { name: "Tradier", description: "US equity/option market data (delayed, intraday, historical)", auth: "OAuth", https: true, cors: "yes", link: "https://developer.tradier.com" },
  { name: "Twelve Data", description: "Stock market data (real-time & historical)", auth: "apiKey", https: true, cors: "unknown", link: "https://twelvedata.com/" },
  { name: "WallstreetBets", description: "WallstreetBets Stock Comments Sentiment Analysis", auth: "No", https: true, cors: "unknown", link: "https://dashboard.nbshare.io/apps/reddit/api/" },
  { name: "Yahoo Finance", description: "Real time low latency Yahoo Finance API for stock market, crypto currencies, and currency exchange", auth: "apiKey", https: true, cors: "yes", link: "https://www.yahoofinanceapi.com/" },
  { name: "YNAB", description: "Budgeting & Planning", auth: "OAuth", https: true, cors: "yes", link: "https://api.youneedabudget.com/" },
  { name: "Zoho Books", description: "Online accounting software, built for your business", auth: "OAuth", https: true, cors: "unknown", link: "https://www.zoho.com/books/api/v3/" }
],

"food": [
  { name: "BaconMockup", description: "Resizable bacon placeholder images", auth: "No", https: true, cors: "yes", link: "https://baconmockup.com/" },
  { name: "Chomp", description: "Data about various grocery products and foods", auth: "apiKey", https: true, cors: "unknown", link: "https://chompthis.com/api/" },
  { name: "Coffee", description: "Random pictures of coffee", auth: "No", https: true, cors: "unknown", link: "https://coffee.alexflipnote.dev/" },
  { name: "Edamam Nutrition", description: "Nutrition Analysis", auth: "apiKey", https: true, cors: "unknown", link: "https://developer.edamam.com/edamam-docs-nutrition-api" },
  { name: "Edamam Recipes", description: "Recipe Search", auth: "apiKey", https: true, cors: "unknown", link: "https://developer.edamam.com/edamam-docs-recipe-api" },
  { name: "Foodish", description: "Random pictures of food dishes", auth: "No", https: true, cors: "yes", link: "https://github.com/surhud004/Foodish#readme" },
  { name: "Fruityvice", description: "Data about all kinds of fruit", auth: "No", https: true, cors: "unknown", link: "https://www.fruityvice.com" },
  { name: "Kroger", description: "Supermarket Data", auth: "apiKey", https: true, cors: "unknown", link: "https://developer.kroger.com/reference" },
  { name: "LCBO", description: "Alcohol store data in Canada", auth: "apiKey", https: true, cors: "unknown", link: "https://lcboapi.com/" },
  { name: "Open Brewery DB", description: "Breweries, Cideries and Craft Beer Bottle Shops", auth: "No", https: true, cors: "yes", link: "https://www.openbrewerydb.org" },
  { name: "Open Food Facts", description: "Food Products Database", auth: "No", https: true, cors: "unknown", link: "https://world.openfoodfacts.org/data" },
  { name: "PunkAPI", description: "Brewdog Beer Recipes", auth: "No", https: true, cors: "unknown", link: "https://punkapi.com/" },
  { name: "Rustybeer", description: "Beer brewing tools", auth: "No", https: true, cors: "no", link: "https://rustybeer.herokuapp.com/" },
  { name: "Spoonacular", description: "Recipes, Food Products, and Meal Planning", auth: "apiKey", https: true, cors: "unknown", link: "https://spoonacular.com/food-api" },
  { name: "Systembolaget", description: "Government-owned liquor store in Sweden", auth: "apiKey", https: true, cors: "unknown", link: "https://api-portal.systembolaget.se" },
  { name: "TacoFancy", description: "Community-driven taco database", auth: "No", https: false, cors: "unknown", link: "https://github.com/evz/tacofancy-api" },
  { name: "Tasty", description: "API to query data about recipe, plan, ingredients", auth: "apiKey", https: true, cors: "unknown", link: "https://rapidapi.com/apidojo/api/tasty/" },
  { name: "The Report of the Week", description: "Food & Drink Reviews", auth: "No", https: true, cors: "unknown", link: "https://github.com/andyklimczak/TheReportOfTheWeek-API" },
  { name: "TheCocktailDB", description: "Cocktail Recipes", auth: "apiKey", https: true, cors: "yes", link: "https://www.thecocktaildb.com/api.php" },
  { name: "TheMealDB", description: "Meal Recipes", auth: "apiKey", https: true, cors: "yes", link: "https://www.themealdb.com/api.php" },
  { name: "Untappd", description: "Social beer sharing", auth: "OAuth", https: true, cors: "unknown", link: "https://untappd.com/api/docs" },
  { name: "What's on the menu?", description: "NYPL human-transcribed historical menu collection", auth: "apiKey", https: false, cors: "unknown", link: "http://nypl.github.io/menus-api/" },
  { name: "WhiskyHunter", description: "Past online whisky auctions statistical data", auth: "No", https: true, cors: "unknown", link: "https://whiskyhunter.net/api/" },
  { name: "Zestful", description: "Parse recipe ingredients", auth: "apiKey", https: true, cors: "yes", link: "https://zestfuldata.com/" },
  // ✅ New / 2024–2025 additions
  { name: "Tasty API (RAPIDAPI update)", description: "Updated community recipe & ingredients API", auth: "apiKey", https: true, cors: "unknown", link: "https://rapidapi.com/apidojo/api/tasty/" },
  { name: "Food Data Central", description: "USDA food nutrient & product database", auth: "apiKey", https: true, cors: "yes", link: "https://fdc.nal.usda.gov/api-guide.html" },
  { name: "Meal Planner API", description: "Meal planning, nutrition and grocery planning API", auth: "apiKey", https: true, cors: "unknown", link: "https://www.themealdb.com/api.php" },
  { name: "Cocktail Recipes API", description: "Extended cocktails database", auth: "No", https: true, cors: "yes", link: "https://www.thecocktaildb.com/api.php" }
],
"games": [
  { name: "Age of Empires II", description: "Get information about Age of Empires II resources", auth: "No", https: true, cors: "No", link: "https://age-of-empires-2-api.herokuapp.com" },
  { name: "AmiiboAPI", description: "Nintendo Amiibo Information", auth: "No", https: true, cors: "Yes", link: "https://amiiboapi.com/" },
  { name: "Animal Crossing: New Horizons", description: "API for critters, fossils, art, music, furniture and villagers", auth: "No", https: true, cors: "Unknown", link: "http://acnhapi.com/" },
  { name: "Autochess VNG", description: "Rest Api for Autochess VNG", auth: "No", https: true, cors: "Yes", link: "https://github.com/didadadida93/autochess-vng-api" },
  { name: "Barter.VG", description: "Provides information about Game, DLC, Bundles, Giveaways, Trading", auth: "No", https: true, cors: "Yes", link: "https://github.com/bartervg/barter.vg/wiki" },
  { name: "Battle.net", description: "Diablo III, Hearthstone, StarCraft II and World of Warcraft game data APIs", auth: "OAuth", https: true, cors: "Yes", link: "https://develop.battle.net/documentation/guides/getting-started" },
  { name: "Board Game Geek", description: "Board games, RPG and videogames", auth: "No", https: true, cors: "No", link: "https://boardgamegeek.com/wiki/page/BGG_XML_API2" },
  { name: "Brawl Stars", description: "Brawl Stars Game Information", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.brawlstars.com" },
  { name: "Bugsnax", description: "Get information about Bugsnax", auth: "No", https: true, cors: "Yes", link: "https://www.bugsnaxapi.com/" },
  { name: "CheapShark", description: "Steam/PC Game Prices and Deals", auth: "No", https: true, cors: "Yes", link: "https://www.cheapshark.com/api" },
  { name: "Chess.com", description: "Chess.com read-only REST API", auth: "No", https: true, cors: "Unknown", link: "https://www.chess.com/news/view/published-data-api" },
  { name: "Chuck Norris Database", description: "Jokes", auth: "No", https: false, cors: "Unknown", link: "http://www.icndb.com/api/" },
  { name: "Clash of Clans", description: "Clash of Clans Game Information", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.clashofclans.com" },
  { name: "Clash Royale", description: "Clash Royale Game Information", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.clashroyale.com" },
  { name: "Comic Vine", description: "Comics", auth: "No", https: true, cors: "Unknown", link: "https://comicvine.gamespot.com/api/documentation" },
  { name: "Crafatar", description: "API for Minecraft skins and faces", auth: "No", https: true, cors: "Yes", link: "https://crafatar.com" },
  { name: "Cross Universe", description: "Cross Universe Card Data", auth: "No", https: true, cors: "Yes", link: "https://crossuniverse.psychpsyo.com/apiDocs.html" },
  { name: "Deck of Cards", description: "Deck of Cards", auth: "No", https: false, cors: "Unknown", link: "http://deckofcardsapi.com/" },
  { name: "Destiny The Game", description: "Bungie Platform API", auth: "apiKey", https: true, cors: "Unknown", link: "https://bungie-net.github.io/multi/index.html" },
  { name: "Digimon Information", description: "Provides information about digimon creatures", auth: "No", https: true, cors: "Unknown", link: "https://digimon-api.vercel.app/" },
  { name: "Digimon TCG", description: "Search for Digimon cards in digimoncard.io", auth: "No", https: true, cors: "Unknown", link: "https://documenter.getpostman.com/view/14059948/TzecB4fH" },
  { name: "Disney", description: "Information of Disney characters", auth: "No", https: true, cors: "Yes", link: "https://disneyapi.dev" },
  { name: "Dota 2", description: "Provides information about Player stats , Match stats, Rankings for Dota 2", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.opendota.com/" },
  { name: "Dungeons and Dragons", description: "Reference for 5th edition spells, classes, monsters, and more", auth: "No", https: false, cors: "No", link: "https://www.dnd5eapi.co/docs/" },
  { name: "Dungeons and Dragons (Alternate)", description: "Includes all monsters and spells from the SRD as well as a search API", auth: "No", https: true, cors: "Yes", link: "https://open5e.com/" },
  { name: "Eve Online", description: "Third-Party Developer Documentation", auth: "OAuth", https: true, cors: "Unknown", link: "https://esi.evetech.net/ui" },
  { name: "FFXIV Collect", description: "Final Fantasy XIV data on collectables", auth: "No", https: true, cors: "Yes", link: "https://ffxivcollect.com/" },
  { name: "FIFA Ultimate Team", description: "FIFA Ultimate Team items API", auth: "No", https: true, cors: "Unknown", link: "https://www.easports.com/fifa/ultimate-team/api/fut/item" },
  { name: "Final Fantasy XIV", description: "Final Fantasy XIV Game data API", auth: "No", https: true, cors: "Yes", link: "https://xivapi.com/" },
  { name: "Fortnite", description: "Fortnite Stats", auth: "apiKey", https: true, cors: "Unknown", link: "https://fortnitetracker.com/site-api" },
  { name: "Forza", description: "Show random image of car from Forza", auth: "No", https: true, cors: "Unknown", link: "https://docs.forza-api.tk" },
  { name: "FreeToGame", description: "Free-To-Play Games Database", auth: "No", https: true, cors: "Yes", link: "https://www.freetogame.com/api-doc" },
  { name: "Fun Facts", description: "Random Fun Facts", auth: "No", https: true, cors: "Yes", link: "https://asli-fun-fact-api.herokuapp.com/" },
  { name: "FunTranslations", description: "Translate Text into funny languages", auth: "No", https: true, cors: "Yes", link: "https://api.funtranslations.com/" },
  { name: "GamerPower", description: "Game Giveaways Tracker", auth: "No", https: true, cors: "Yes", link: "https://www.gamerpower.com/api-read" },
  { name: "GDBrowser", description: "Easy way to use the Geometry Dash Servers", auth: "No", https: true, cors: "Unknown", link: "https://gdbrowser.com/api" },
  { name: "Geek-Jokes", description: "Fetch a random geeky/programming related joke", auth: "No", https: true, cors: "Yes", link: "https://github.com/sameerkumar18/geek-joke-api" },
  { name: "Genshin Impact", description: "Genshin Impact game data", auth: "No", https: true, cors: "Yes", link: "https://genshin.dev" },
  { name: "Giant Bomb", description: "Video Games", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.giantbomb.com/api/documentation" },
  { name: "GraphQL Pokemon", description: "GraphQL powered Pokemon API. Supports generations 1 through 8", auth: "No", https: true, cors: "Yes", link: "https://github.com/favware/graphql-pokemon" },
  { name: "Guild Wars 2", description: "Guild Wars 2 Game Information", auth: "apiKey", https: true, cors: "Unknown", link: "https://wiki.guildwars2.com/wiki/API:Main" },
  { name: "GW2Spidy", description: "GW2Spidy API, Items data on the Guild Wars 2 Trade Market", auth: "No", https: true, cors: "Unknown", link: "https://github.com/rubensayshi/gw2spidy/wiki" },
  { name: "Halo", description: "Halo 5 and Halo Wars 2 Information", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.haloapi.com/" },
  { name: "Hearthstone", description: "Hearthstone Cards Information", auth: "X-Mashape-Key", https: true, cors: "Unknown", link: "http://hearthstoneapi.com/" },
  { name: "Humble Bundle", description: "Humble Bundle's current bundles", auth: "apiKey", https: true, cors: "Unknown", link: "https://rapidapi.com/Ziggoto/api/humble-bundle" },
  { name: "Humor", description: "Humor, Jokes, and Memes", auth: "apiKey", https: true, cors: "Unknown", link: "https://humorapi.com" },
  { name: "Hypixel", description: "Hypixel player stats", auth: "apiKey", https: true, cors: "Unknown", link: "https://api.hypixel.net/" },
  { name: "Hyrule Compendium", description: "Data on all interactive items from The Legend of Zelda: BOTW", auth: "No", https: true, cors: "Unknown", link: "https://github.com/gadhagod/Hyrule-Compendium-API" },
  { name: "Hytale", description: "Hytale blog posts and jobs", auth: "No", https: true, cors: "Unknown", link: "https://hytale-api.com/" },
  { name: "IGDB.com", description: "Video Game Database", auth: "apiKey", https: true, cors: "Unknown", link: "https://api-docs.igdb.com" },
  { name: "JokeAPI", description: "Programming, Miscellaneous and Dark Jokes", auth: "No", https: true, cors: "Yes", link: "https://sv443.net/jokeapi/v2/" },
  { name: "Jokes One", description: "Joke of the day and large category of jokes accessible via REST API", auth: "apiKey", https: true, cors: "Yes", link: "https://jokes.one/api/joke/" },
  { name: "Jservice", description: "Jeopardy Question Database", auth: "No", https: false, cors: "Unknown", link: "http://jservice.io" },
  { name: "Lichess", description: "Access to all data of users, games, puzzles and etc on Lichess", auth: "OAuth", https: true, cors: "Unknown", link: "https://lichess.org/api" },
  { name: "Magic The Gathering", description: "Magic The Gathering Game Information", auth: "No", https: false, cors: "Unknown", link: "http://magicthegathering.io/" },
  { name: "Mario Kart Tour", description: "API for Drivers, Karts, Gliders and Courses", auth: "OAuth", https: true, cors: "Unknown", link: "https://mario-kart-tour-api.herokuapp.com/" },
  { name: "Marvel", description: "Marvel Comics", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.marvel.com" },
  { name: "Minecraft Server Status", description: "API to get Information about a Minecraft Server", auth: "No", https: true, cors: "No", link: "https://api.mcsrvstat.us" },
  { name: "MMO Games", description: "MMO Games Database, News and Giveaways", auth: "No", https: true, cors: "No", link: "https://www.mmobomb.com/api" },
  { name: "mod.io", description: "Cross Platform Mod API", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.mod.io" },
  { name: "Mojang", description: "Mojang / Minecraft API", auth: "apiKey", https: true, cors: "Unknown", link: "https://wiki.vg/Mojang_API" },
  { name: "Monster Hunter World", description: "Monster Hunter World data", auth: "No", https: true, cors: "Yes", link: "https://docs.mhw-db.com/" },
  { name: "Open Trivia", description: "Trivia Questions", auth: "No", https: true, cors: "Unknown", link: "https://opentdb.com/api_config.php" },
  { name: "PandaScore", description: "E-sports games and results", auth: "apiKey", https: true, cors: "Unknown", link: "https://developers.pandascore.co/" },
  { name: "Path of Exile", description: "Path of Exile Game Information", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.pathofexile.com/developer/docs" },
  { name: "PlayerDB", description: "Query Minecraft, Steam and XBox Accounts", auth: "No", https: true, cors: "Unknown", link: "https://playerdb.co/" },
  { name: "Pokéapi", description: "Pokémon Information", auth: "No", https: true, cors: "Unknown", link: "https://pokeapi.co" },
  { name: "PokéAPI (GraphQL)", description: "The Unofficial GraphQL for PokeAPI", auth: "No", https: true, cors: "Yes", link: "https://github.com/mazipan/graphql-pokeapi" },
  { name: "Pokémon TCG", description: "Pokémon TCG Information", auth: "No", https: true, cors: "Unknown", link: "https://pokemontcg.io" },
  { name: "Psychonauts", description: "Psychonauts World Characters Information and PSI Powers", auth: "No", https: true, cors: "Yes", link: "https://psychonauts-api.netlify.app/" },
  { name: "PUBG", description: "Access in-game PUBG data", auth: "apiKey", https: true, cors: "Yes", link: "https://developer.pubg.com/" },
  { name: "Puyo Nexus", description: "Puyo Puyo information from Puyo Nexus Wiki", auth: "No", https: true, cors: "Yes", link: "https://github.com/deltadex7/puyodb-api-deno" },
  { name: "quizapi.io", description: "Access to various kind of quiz questions", auth: "apiKey", https: true, cors: "Yes", link: "https://quizapi.io/" },
  { name: "Raider", description: "Provides detailed character and guild rankings for Raiding and Mythic+ content in World of Warcraft", auth: "No", https: true, cors: "Unknown", link: "https://raider.io/api" },
  { name: "RAWG.io", description: "500,000+ games for 50 platforms including mobiles", auth: "apiKey", https: true, cors: "Unknown", link: "https://rawg.io/apidocs" },
  { name: "Rick and Morty", description: "All the Rick and Morty information, including images", auth: "No", https: true, cors: "Yes", link: "https://rickandmortyapi.com" },
  { name: "Riot Games", description: "League of Legends Game Information", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.riotgames.com/" },
  { name: "RPS 101", description: "Rock, Paper, Scissors with 101 objects", auth: "No", https: true, cors: "Yes", link: "https://rps101.pythonanywhere.com/api" },
  { name: "RuneScape", description: "RuneScape and OSRS RPGs information", auth: "No", https: true, cors: "No", link: "https://runescape.wiki/w/Application_programming_interface" },
  { name: "Sakura CardCaptor", description: "Sakura CardCaptor Cards Information", auth: "No", https: true, cors: "Unknown", link: "https://github.com/JessVel/sakura-card-captor-api" },
  { name: "Scryfall", description: "Magic: The Gathering database", auth: "No", https: true, cors: "Yes", link: "https://scryfall.com/docs/api" },
  { name: "SpaceTradersAPI", description: "A playable inter-galactic space trading MMOAPI", auth: "OAuth", https: true, cors: "Yes", link: "https://spacetraders.io?rel=pub-apis" },
  { name: "Steam", description: "Steam Web API documentation", auth: "apiKey", https: true, cors: "No", link: "https://steamapi.xpaw.me/" },
  { name: "Steam (Internal)", description: "Internal Steam Web API documentation", auth: "No", https: true, cors: "No", link: "https://github.com/Revadike/InternalSteamWebAPI/wiki" },
  { name: "SuperHeroes", description: "All SuperHeroes and Villains data from all universes under a single API", auth: "apiKey", https: true, cors: "Unknown", link: "https://superheroapi.com" },
  { name: "TCGdex", description: "Multi languages Pokémon TCG Information", auth: "No", https: true, cors: "Yes", link: "https://www.tcgdex.net/docs" },
  { name: "Tebex", description: "Tebex API for information about game purchases", auth: "X-Mashape-Key", https: true, cors: "No", link: "https://docs.tebex.io/plugin/" },
  { name: "TETR.IO", description: "TETR.IO Tetra Channel API", auth: "No", https: true, cors: "Unknown", link: "https://tetr.io/about/api/" },
  { name: "Tronald Dump", description: "The dumbest things Donald Trump has ever said", auth: "No", https: true, cors: "Unknown", link: "https://www.tronalddump.io/" },
  { name: "Universalis", description: "Final Fantasy XIV market board data", auth: "No", https: true, cors: "Yes", link: "https://universalis.app/docs/index.html" },
  { name: "Valorant (non-official)", description: "An extensive API containing data of most Valorant in-game items, assets and more", auth: "No", https: true, cors: "Unknown", link: "https://valorant-api.com" },
  { name: "Warface (non-official)", description: "Official API proxy with better data structure and more features", auth: "No", https: true, cors: "No", link: "https://api.wfstats.cf" },
  { name: "Wargaming.net", description: "Wargaming.net info and stats", auth: "apiKey", https: true, cors: "No", link: "https://developers.wargaming.net/" },
  { name: "When is next MCU film", description: "Upcoming MCU film information", auth: "No", https: true, cors: "Unknown", link: "https://github.com/DiljotSG/MCU-Countdown/blob/develop/docs/API.md" },
  { name: "xkcd", description: "Retrieve xkcd comics as JSON", auth: "No", https: true, cors: "No", link: "https://xkcd.com/json.html" },
  { name: "Yu-Gi-Oh!", description: "Yu-Gi-Oh! TCG Information", auth: "No", https: true, cors: "Unknown", link: "https://db.ygoprodeck.com/api-guide/" },
  { name: "Atlas Academy", description: "Data API for Fate/Grand Order game (characters, items, quests...)", auth: "No", https: true, cors: "Yes", link: "https://api.atlasacademy.io/docs" },
  { name: "Humor API", description: "Humor, memes, jokes API (useful for game chat, bots)", auth: "apiKey", https: true, cors: "Unknown", link: "https://humorapi.com" },
  { name: "MMC‑Games (MMO Games)", description: "MMO Games Database, news and giveaways", auth: "No", https: true, cors: "Yes", link: "https://www.freeapisforyou.in/api/mmo-games" }
],
"geocoding": [
  { name: "IP Geolocation", description: "Geolocate website visitors from their IPs", auth: "apiKey", https: true, cors: "yes", link: "https://www.abstractapi.com/ip-geolocation-api" },
  { name: "Actinia Grass GIS", description: "Actinia is an open source REST API for geographical data that uses GRASS GIS", auth: "apiKey", https: true, cors: "unknown", link: "https://actinia.mundialis.de/api_docs/" },
  { name: "administrative-divisons-db", description: "Get all administrative divisions of a country", auth: "No", https: true, cors: "yes", link: "https://github.com/kamikazechaser/administrative-divisions-db" },
  { name: "adresse.data.gouv.fr", description: "Address database of France, geocoding and reverse", auth: "No", https: true, cors: "unknown", link: "https://adresse.data.gouv.fr" },
  { name: "Airtel IP", description: "IP Geolocation API. Collecting data from multiple sources", auth: "No", https: true, cors: "unknown", link: "https://sys.airtel.lv/ip2country/1.1.1.1/?full=true" },
  { name: "Apiip", description: "Get location information by IP address", auth: "apiKey", https: true, cors: "yes", link: "https://apiip.net/" },
  { name: "apilayer ipstack", description: "Locate and identify website visitors by IP address", auth: "apiKey", https: true, cors: "unknown", link: "https://ipstack.com/" },
  { name: "Battuta", description: "A (country/region/city) in-cascade location API", auth: "apiKey", https: false, cors: "unknown", link: "http://battuta.medunes.net" },
  { name: "BigDataCloud", description: "Provides fast and accurate IP geolocation APIs along with security checks and confidence area", auth: "apiKey", https: true, cors: "unknown", link: "https://www.bigdatacloud.com/ip-geolocation-apis" },
  { name: "Bing Maps", description: "Create/customize digital maps based on Bing Maps data", auth: "apiKey", https: true, cors: "unknown", link: "https://www.microsoft.com/maps/" },
  { name: "bng2latlong", description: "Convert British OSGB36 easting and northing (British National Grid) to WGS84 latitude and longitude", auth: "No", https: true, cors: "yes", link: "https://www.getthedata.com/bng2latlong" },
  { name: "Cartes.io", description: "Create maps and markers for anything", auth: "No", https: true, cors: "unknown", link: "https://github.com/M-Media-Group/Cartes.io/wiki/API" },
  { name: "Cep.la", description: "Brazil RESTful API to find information about streets, zip codes, neighborhoods, cities and states", auth: "No", https: false, cors: "unknown", link: "http://cep.la/" },
  { name: "CitySDK", description: "Open APIs for select European cities", auth: "No", https: true, cors: "unknown", link: "http://www.citysdk.eu/citysdk-toolkit/" },
  { name: "Country", description: "Get your visitor's country from their IP", auth: "No", https: true, cors: "yes", link: "http://country.is/" },
  { name: "CountryStateCity", description: "World countries, states, regions, provinces, cities & towns in JSON, SQL, XML, YAML, & CSV format", auth: "apiKey", https: true, cors: "yes", link: "https://countrystatecity.in/" },
  { name: "Ducks Unlimited", description: "API explorer that gives a query URL with a JSON response of locations and cities", auth: "No", https: true, cors: "no", link: "https://gis.ducks.org/datasets/du-university-chapters/api" },
  { name: "GeoApi", description: "French geographical data", auth: "No", https: true, cors: "unknown", link: "https://api.gouv.fr/api/geoapi.html" },
  { name: "Geoapify", description: "Forward and reverse geocoding, address autocomplete", auth: "apiKey", https: true, cors: "yes", link: "https://www.geoapify.com/api/geocoding-api/" },
  { name: "Geocod.io", description: "Address geocoding / reverse geocoding in bulk", auth: "apiKey", https: true, cors: "unknown", link: "https://www.geocod.io/" },
  { name: "Geocode.xyz", description: "Provides worldwide forward/reverse geocoding, batch geocoding and geoparsing", auth: "No", https: true, cors: "unknown", link: "https://geocode.xyz/api" },
  { name: "Geocodify.com", description: "Worldwide geocoding, geoparsing and autocomplete for addresses", auth: "apiKey", https: true, cors: "yes", link: "https://geocodify.com/" },
  { name: "GeoDataSource", description: "Geocoding of city name by using latitude and longitude coordinates", auth: "apiKey", https: true, cors: "unknown", link: "https://www.geodatasource.com/web-service" },
  { name: "GeoDB Cities", description: "Get global city, region, and country data", auth: "apiKey", https: true, cors: "unknown", link: "http://geodb-cities-api.wirefreethought.com/" },
  { name: "GeographQL", description: "A Country, State, and City GraphQL API", auth: "No", https: true, cors: "yes", link: "https://geographql.netlify.app" },
  { name: "GeoJS", description: "IP geolocation with ChatOps integration", auth: "No", https: true, cors: "yes", link: "https://www.geojs.io/" },
  { name: "Geokeo", description: "Geokeo geocoding service with 2500 free API requests daily", auth: "No", https: true, cors: "yes", link: "https://geokeo.com" },
  { name: "GeoNames", description: "Place names and other geographical data", auth: "No", https: false, cors: "unknown", link: "http://www.geonames.org/export/web-services.html" },
  { name: "geoPlugin", description: "IP geolocation and currency conversion", auth: "No", https: true, cors: "yes", link: "https://www.geoplugin.com" },
  { name: "Google Earth Engine", description: "A cloud-based platform for planetary-scale environmental data analysis", auth: "apiKey", https: true, cors: "unknown", link: "https://developers.google.com/earth-engine/" },
  { name: "Google Maps", description: "Create/customize digital maps based on Google Maps data", auth: "apiKey", https: true, cors: "unknown", link: "https://developers.google.com/maps/" },
  { name: "HelloSalut", description: "Get hello translation following user language", auth: "No", https: true, cors: "unknown", link: "https://fourtonfish.com/project/hellosalut-api/" },
  { name: "HERE Maps", description: "Create/customize digital maps based on HERE Maps data", auth: "apiKey", https: true, cors: "unknown", link: "https://developer.here.com" },
  { name: "ipapi.co", description: "Find IP address location information", auth: "No", https: true, cors: "yes", link: "https://ipapi.co/api/#introduction" },
  { name: "ipgeolocation.io", description: "IP Geolocation API with free plan 30k requests/month", auth: "apiKey", https: true, cors: "yes", link: "https://ipgeolocation.io/" },
  { name: "LocationIQ", description: "Provides forward/reverse geocoding and batch geocoding", auth: "apiKey", https: true, cors: "yes", link: "https://locationiq.org/docs/" },
  { name: "Mapbox", description: "Create/customize beautiful digital maps", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.mapbox.com/" },
  { name: "MapQuest", description: "Access tools and resources to map the world", auth: "apiKey", https: true, cors: "no", link: "https://developer.mapquest.com/" },
  { name: "Nominatim", description: "Provides worldwide forward / reverse geocoding", auth: "No", https: true, cors: "yes", link: "https://nominatim.org/release-docs/latest/api/Overview/" },
  { name: "OpenCage", description: "Forward and reverse geocoding using open data", auth: "apiKey", https: true, cors: "yes", link: "https://opencagedata.com/" },
  { name: "OpenStreetMap", description: "Navigation, geolocation and geographical data", auth: "OAuth", https: false, cors: "unknown", link: "http://wiki.openstreetmap.org/wiki/API" },
  { name: "positionstack", description: "Forward & Reverse Batch Geocoding REST API", auth: "apiKey", https: true, cors: "unknown", link: "https://positionstack.com/" },
  { name: "Postcodes.io", description: "Postcode lookup & Geolocation for the UK", auth: "No", https: true, cors: "yes", link: "https://postcodes.io" },
  { name: "REST Countries", description: "Get information about countries via a RESTful API", auth: "No", https: true, cors: "yes", link: "https://restcountries.com" },
  { name: "TomTom", description: "Maps, Directions, Places and Traffic APIs", auth: "apiKey", https: true, cors: "yes", link: "https://developer.tomtom.com/" },
  { name: "US ZipCode", description: "Validate and append data for any US ZipCode", auth: "apiKey", https: true, cors: "yes", link: "https://www.smarty.com/docs/cloud/us-zipcode-api" },
  { name: "ViaCep", description: "Brazil RESTful zip codes API", auth: "No", https: true, cors: "unknown", link: "https://viacep.com.br/" },
  { name: "What3Words", description: "Three words as rememberable and unique coordinates worldwide", auth: "apiKey", https: true, cors: "unknown", link: "https://what3words.com/" },
  { name: "Yandex.Maps Geocoder", description: "Use geocoding to get an object's coordinates from its address", auth: "apiKey", https: true, cors: "unknown", link: "https://yandex.com/dev/maps/geocoder" },
  { name: "Zippopotam.us", description: "Get information about place such as country, city, state, etc", auth: "No", https: false, cors: "unknown", link: "http://www.zippopotam.us" },
  { name: "Ziptastic", description: "Get the country, state, and city of any US zip-code", auth: "No", https: true, cors: "unknown", link: "https://ziptasticapi.com/" }
],
// add or replace this key inside SAMPLE_APIS
government: [
  { name: "Bank Negara Malaysia Open Data", description: "Malaysia Central Bank Open Data", auth: "No", https: true, cors: "Unknown", link: "https://apikijangportal.bnm.gov.my/" },
  { name: "BCLaws", description: "Access to the laws of British Columbia", auth: "No", https: false, cors: "Unknown", link: "https://www.bclaws.gov.bc.ca/civix/template/complete/api/index.html" },
  { name: "BrasilAPI", description: "Community driven API for Brazil Public Data", auth: "No", https: true, cors: "Yes", link: "https://brasilapi.com.br/" },
  { name: "Brazil Central Bank Open Data", description: "Brazil Central Bank Open Data", auth: "No", https: true, cors: "Unknown", link: "https://dadosabertos.bcb.gov.br/" },
  { name: "Brazil Receita WS", description: "Consult companies by CNPJ for Brazilian companies", auth: "No", https: true, cors: "Unknown", link: "https://www.receitaws.com.br/" },
  { name: "Brazilian Chamber of Deputies Open Data", description: "Provides legislative information in APIs (XML/JSON) and downloadable files", auth: "No", https: true, cors: "No", link: "https://dadosabertos.camara.leg.br/swagger/api.html" },
  { name: "Census.gov", description: "The US Census Bureau APIs and datasets (demographics, business, etc.)", auth: "No", https: true, cors: "Unknown", link: "https://www.census.gov/data/developers/data-sets.html" },
  { name: "City of Berlin Open Data", description: "Berlin (DE) City Open Data portal", auth: "No", https: true, cors: "Unknown", link: "https://daten.berlin.de/" },
  { name: "City of Gdańsk Open Data", description: "Gdańsk (PL) City Open Data (CKAN)", auth: "No", https: true, cors: "Unknown", link: "https://ckan.multimediagdansk.pl/en" },
  { name: "City of Gdynia Open Data", description: "Gdynia (PL) City Open Data", auth: "No", https: false, cors: "Unknown", link: "http://otwartedane.gdynia.pl/en/api_doc.html" },
  { name: "City of Helsinki Open Data (HRI)", description: "Helsinki (FI) City Open Data portal (HRI)", auth: "No", https: true, cors: "Unknown", link: "https://hri.fi/en_gb/" },
  { name: "City of Lviv Open Data", description: "Lviv (UA) City Open Data portal", auth: "No", https: true, cors: "Unknown", link: "https://opendata.city-adm.lviv.ua/" },
  { name: "City of Nantes Open Data", description: "Nantes (FR) Open Data portal", auth: "apiKey", https: true, cors: "Unknown", link: "https://data.nantesmetropole.fr/pages/home/" },
  { name: "City of New York Open Data", description: "New York (US) City Open Data", auth: "No", https: true, cors: "Unknown", link: "https://opendata.cityofnewyork.us/" },
  { name: "City of Prague Open Data", description: "Prague (CZ) City Open Data", auth: "No", https: false, cors: "Unknown", link: "http://opendata.praha.eu/en" },
  { name: "City of Toronto Open Data", description: "Toronto (CA) City Open Data", auth: "No", https: true, cors: "Yes", link: "https://open.toronto.ca/" },
  { name: "Code.gov", description: "Platform for open source projects & code sharing for the U.S. federal government", auth: "apiKey", https: true, cors: "Unknown", link: "https://code.gov" },
  { name: "Colorado Information Marketplace", description: "Colorado State Government Open Data portal", auth: "No", https: true, cors: "Unknown", link: "https://data.colorado.gov/" },
  { name: "Data USA", description: "US public datasets surfaced via Data USA APIs", auth: "No", https: true, cors: "Unknown", link: "https://datausa.io/about/api/" },
  { name: "Data.gov (USA)", description: "US Government Data portal (api.data.gov)", auth: "apiKey", https: true, cors: "Unknown", link: "https://api.data.gov/" },
  { name: "data.parliament.uk", description: "UK Parliament live datasets (petitions, bills, MP data, etc.)", auth: "No", https: false, cors: "Unknown", link: "https://explore.data.parliament.uk/?learnmore=Members" },
  { name: "Deutscher Bundestag DIP", description: "DIP API for Bundestag entities (activities, persons, material)", auth: "apiKey", https: true, cors: "Unknown", link: "https://dip.bundestag.de/documents/informationsblatt_zur_dip_api_v01.pdf" },
  { name: "District of Columbia Open Data", description: "D.C. government public datasets (crime, GIS, financial, etc.)", auth: "No", https: true, cors: "Unknown", link: "http://opendata.dc.gov/pages/using-apis" },
  { name: "EPA Developer Resources", description: "US Environmental Protection Agency web services and datasets", auth: "No", https: true, cors: "Unknown", link: "https://www.epa.gov/developers/data-data-products#apis" },
  { name: "FBI Wanted API", description: "Access FBI Wanted program information", auth: "No", https: true, cors: "Unknown", link: "https://www.fbi.gov/wanted/api" },
  { name: "FEC API", description: "US Federal Election Commission campaign finance data", auth: "apiKey", https: true, cors: "Unknown", link: "https://api.open.fec.gov/developers/" },
  { name: "Federal Register API", description: "Daily Journal of the United States Government (FederalRegister)", auth: "No", https: true, cors: "Unknown", link: "https://www.federalregister.gov/reader-aids/developer-resources/rest-api" },
  { name: "Food Standards Agency Open Data", description: "UK food hygiene rating open data API", auth: "No", https: false, cors: "Unknown", link: "http://ratings.food.gov.uk/open-data/en-GB" },
  { name: "Gazette Data (UK)", description: "UK Gazette official public record data", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.thegazette.co.uk/data" },
  { name: "GunPolicy.org API", description: "International firearm injury prevention and policy data", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.gunpolicy.org/api" },
  { name: "INEI (Peru) Microdata", description: "Peruvian statistical open microdata", auth: "No", https: false, cors: "Unknown", link: "http://iinei.inei.gob.pe/microdatos/" },
  { name: "Interpol Red Notices API", description: "Search and access Interpol Red Notices", auth: "No", https: true, cors: "Unknown", link: "https://interpol.api.bund.dev/" },
  { name: "Istanbul (İBB) Open Data", description: "İstanbul Metropolitan Municipality open data portal", auth: "No", https: true, cors: "Unknown", link: "https://data.ibb.gov.tr" },
  { name: "National Park Service (NPS) API", description: "US National Park Service data (parks, alerts, events)", auth: "apiKey", https: true, cors: "Yes", link: "https://www.nps.gov/subjects/developer/" },
  { name: "Open Government ACT (Australia)", description: "Australian Capital Territory open data", auth: "No", https: true, cors: "Unknown", link: "https://www.data.act.gov.au/" },
  { name: "Open Government Argentina", description: "Argentina government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://datos.gob.ar/" },
  { name: "Data.gov.au (Australia)", description: "Australian Government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://www.data.gov.au/" },
  { name: "Open Government Austria", description: "Austria government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://www.data.gv.at/" },
  { name: "Open Government Belgium", description: "Belgium government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://data.gov.be/" },
  { name: "Open Government Canada", description: "Canadian government open data portal", auth: "No", https: false, cors: "Unknown", link: "http://open.canada.ca/en" },
  { name: "Open Government Colombia", description: "Colombia government open data portal", auth: "No", https: false, cors: "Unknown", link: "https://www.dane.gov.co/" },
  { name: "Open Government Cyprus", description: "Cyprus government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://data.gov.cy/?language=en" },
  { name: "Open Government Czech Republic", description: "Czech Republic open data portal", auth: "No", https: true, cors: "Unknown", link: "https://data.gov.cz/english/" },
  { name: "Open Government Denmark", description: "Denmark open data portal", auth: "No", https: true, cors: "Unknown", link: "https://www.opendata.dk/" },
  { name: "Open Government Estonia", description: "Estonia open data portal (API instructions)", auth: "apiKey", https: true, cors: "Unknown", link: "https://avaandmed.eesti.ee/instructions/opendata-dataset-api" },
  { name: "Open Government Finland", description: "Finland open data portal", auth: "No", https: true, cors: "Unknown", link: "https://www.avoindata.fi/en" },
  { name: "Open Government France (data.gouv.fr)", description: "French government open data portal", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.data.gouv.fr/" },
  { name: "Open Government Germany", description: "Germany government open data catalog (govdata)", auth: "No", https: true, cors: "Unknown", link: "https://www.govdata.de/daten/-/details/govdata-metadatenkatalog" },
  { name: "Open Government Greece", description: "Greece government open data portal", auth: "OAuth", https: true, cors: "Unknown", link: "https://data.gov.gr/" },
  { name: "Open Government India", description: "India government open data portal", auth: "apiKey", https: true, cors: "Unknown", link: "https://data.gov.in/" },
  { name: "Open Government Ireland", description: "Ireland open data portal and developer resources", auth: "No", https: true, cors: "Unknown", link: "https://data.gov.ie/pages/developers" },
  { name: "Open Government Italy", description: "Italy government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://www.dati.gov.it/" },
  { name: "Open Government Korea", description: "Korea open data portal (data.go.kr)", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.data.go.kr/" },
  { name: "Open Government Lithuania", description: "Lithuania open data API", auth: "No", https: true, cors: "Unknown", link: "https://data.gov.lt/public/api/1" },
  { name: "Open Government Luxembourg", description: "Luxembourg open data portal", auth: "apiKey", https: true, cors: "Unknown", link: "https://data.public.lu" },
  { name: "Open Government Mexico (INEGI)", description: "Mexican Statistical Government open data (INEGI)", auth: "No", https: true, cors: "Unknown", link: "https://www.inegi.org.mx/datos/" },
  { name: "Open Government Mexico (datos.gob.mx)", description: "Mexico government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://datos.gob.mx/" },
  { name: "Open Government Netherlands", description: "Netherlands open data portal and API guidance", auth: "No", https: true, cors: "Unknown", link: "https://data.overheid.nl/en/ondersteuning/data-publiceren/api" },
  { name: "Open Government New South Wales", description: "New South Wales (Australia) government open data (api.nsw.gov.au)", auth: "apiKey", https: true, cors: "Unknown", link: "https://api.nsw.gov.au/" },
  { name: "Open Government New Zealand", description: "New Zealand open data portal", auth: "No", https: true, cors: "Unknown", link: "https://www.data.govt.nz/" },
  { name: "Open Government Norway", description: "Norway data services portal", auth: "No", https: true, cors: "Yes", link: "https://data.norge.no/dataservices" },
  { name: "Open Government Peru", description: "Peru government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://www.datosabiertos.gob.pe/" },
  { name: "Open Government Poland", description: "Poland open data portal", auth: "No", https: true, cors: "Yes", link: "https://dane.gov.pl/en" },
  { name: "Open Government Portugal", description: "Portugal open data portal api (dados.gov.pt)", auth: "No", https: true, cors: "Yes", link: "https://dados.gov.pt/en/docapi/" },
  { name: "Open Government Queensland (Australia)", description: "Queensland Government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://www.data.qld.gov.au/" },
  { name: "Open Government Romania", description: "Romania open data portal", auth: "No", https: false, cors: "Unknown", link: "http://data.gov.ro/" },
  { name: "Open Government Saudi Arabia", description: "Saudi Arabia open data portal", auth: "No", https: true, cors: "Unknown", link: "https://data.gov.sa" },
  { name: "Open Government Singapore", description: "Singapore open data developer portal", auth: "No", https: true, cors: "Unknown", link: "https://data.gov.sg/developer" },
  { name: "Open Government Slovakia", description: "Slovakia open data portal", auth: "No", https: true, cors: "Unknown", link: "https://data.gov.sk/en/" },
  { name: "Open Government Slovenia", description: "Slovenia open data portal", auth: "No", https: true, cors: "No", link: "https://podatki.gov.si/" },
  { name: "Open Government South Australia", description: "South Australian Government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://data.sa.gov.au/" },
  { name: "Open Government Spain", description: "Spain government open data portal (datos.gob.es)", auth: "No", https: true, cors: "Unknown", link: "https://datos.gob.es/en" },
  { name: "Open Government Sweden", description: "Sweden statistical database API", auth: "No", https: true, cors: "Unknown", link: "https://www.dataportal.se/en/dataservice/91_29789/api-for-the-statistical-database" },
  { name: "Open Government Switzerland", description: "Open data handbook for Switzerland and API guidance", auth: "No", https: true, cors: "Unknown", link: "https://handbook.opendata.swiss/de/content/nutzen/api-nutzen.html" },
  { name: "Open Government Taiwan", description: "Taiwan open data portal", auth: "No", https: true, cors: "Unknown", link: "https://data.gov.tw/" },
  { name: "Open Government Thailand", description: "Thailand open data portal", auth: "apiKey", https: true, cors: "Unknown", link: "https://data.go.th/" },
  { name: "Open Government UK", description: "UK government open data portal (data.gov.uk)", auth: "No", https: true, cors: "Unknown", link: "https://data.gov.uk/" },
  { name: "Open Government USA (data.gov)", description: "United States Government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://www.data.gov/" },
  { name: "Open Government Victoria (Australia)", description: "Victoria State Government open data portal", auth: "No", https: true, cors: "Unknown", link: "https://www.data.vic.gov.au/" },
  { name: "Open Government Western Australia", description: "Western Australia open data portal", auth: "No", https: true, cors: "Unknown", link: "https://data.wa.gov.au/" },
  { name: "PRC Exam Schedule (Unofficial)", description: "Unofficial Philippine Professional Regulation Commission's exam schedule API", auth: "No", https: true, cors: "Yes", link: "https://api.whenisthenextboardexam.com/docs/" },
  { name: "Represent (Open North)", description: "Find Canadian government representatives", auth: "No", https: true, cors: "Unknown", link: "https://represent.opennorth.ca/" },
  { name: "UK Companies House", description: "UK Companies House developer API for company data", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.company-information.service.gov.uk/" },
  { name: "US Presidential Election Data (TogaTech)", description: "Basic candidate data and live electoral vote counts for top two US parties", auth: "No", https: true, cors: "No", link: "https://uselection.togatech.org/api/" },
  { name: "USA.gov Developer", description: "Authoritative information on U.S. programs, events and services", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.usa.gov/developer" },
  { name: "USAspending.gov", description: "US federal spending and awards data API", auth: "No", https: true, cors: "Unknown", link: "https://api.usaspending.gov/" },

  // new / added ones
  { name: "World Bank APIs", description: "World Bank open data APIs (global development data)", auth: "No", https: true, cors: "Unknown", link: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation" },
  { name: "EU Open Data Portal", description: "European Union Open Data Portal (datasets across EU institutions)", auth: "No", https: true, cors: "Unknown", link: "https://data.europa.eu/en" }
],

  "health": [
    {
      "name": "CMS.gov",
      "description": "Access to the data from the CMS - provider & Medicare datasets",
      "auth": "apiKey",
      "https": true,
      "cors": "unknown",
      "link": "https://data.cms.gov/provider-data/",
      "status": "active"
    },
    {
      "name": "Coronavirus (Pipedream/third-party)",
      "description": "HTTP API for latest Wuhan / coronavirus data (third-party Pipedream endpoint)",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://pipedream.com/@pravin/http-api-for-latest-wuhan-coronavirus-data-2019-ncov-p_G6CLVM/readme",
      "status": "third-party/varies"
    },
    {
      "name": "Coronavirus in the UK (UK Govt)",
      "description": "UK Government coronavirus data API — cases & deaths by region (developer guide)",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://coronavirus.data.gov.uk/details/developers-guide",
      "status": "active"
    },
    {
      "name": "Covid Tracking Project",
      "description": "US COVID-19 tracking project (state-level data) — archived",
      "auth": "No",
      "https": true,
      "cors": "no",
      "link": "https://covidtracking.com/data/api/version-2",
      "status": "inactive (data collection ended Mar 7, 2021; archive available)"
    },
    {
      "name": "Covid-19 (covid19api.com)",
      "description": "COVID-19 spread, infection and recovery API (note: service discontinued May 15, 2023)",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://covid19api.com/",
      "status": "discontinued (May 15, 2023)"
    },
    {
      "name": "Covid-19 (M-Media-Group)",
      "description": "Covid-19 cases, deaths and recovery per country (M-Media-Group)",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://github.com/M-Media-Group/Covid-19-API",
      "status": "active (community-maintained)"
    },
    {
      "name": "Covid-19 Datenhub (Germany)",
      "description": "Maps, datasets and applications for COVID-19 (German Datenhub resources)",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://npgeo-corona-npgeo-de.hub.arcgis.com",
      "status": "active"
    },
    {
      "name": "Covid-19 Government Response (Oxford)",
      "description": "Government measures tracker to fight against the Covid-19 pandemic (OxCGRT)",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://covidtracker.bsg.ox.ac.uk",
      "status": "active"
    },
    {
      "name": "Covid-19 India (data.covid19india.org)",
      "description": "India — state/districtwise COVID-19 statistics and vaccination data",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://data.covid19india.org/",
      "status": "community / may vary"
    },
    {
      "name": "Covid-19 JHU CSSE (unofficial)",
      "description": "Open-source API to explore COVID-19 cases based on JHU CSSE data",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://nuttaphat.com/covid19-api/",
      "status": "active (third-party wrappers)"
    },
    {
      "name": "Covid-19 Live Data (mathdroid)",
      "description": "Global and countrywise COVID-19 daily summary (mathdroid wrapper)",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://github.com/mathdroid/covid-19-api",
      "status": "active (community)"
    },
    {
      "name": "Covid-19 Philippines (Simperfy)",
      "description": "Unofficial Philippines COVID-19 API (DOH data collection)",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://github.com/Simperfy/Covid-19-API-Philippines-DOH",
      "status": "community / active"
    },
    {
      "name": "COVID-19 Tracker Canada",
      "description": "Canada — COVID-19 data endpoints and docs",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://api.covid19tracker.ca/docs/1.0/overview",
      "status": "active"
    },
    {
      "name": "COVID-19 Tracker Sri Lanka (HPB)",
      "description": "Sri Lanka — COVID-19 situation and API documentation",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://www.hpb.health.gov.lk/en/api-documentation",
      "status": "active"
    },
    {
      "name": "COVID-ID (Indonesia)",
      "description": "Indonesian government COVID data per province (public JSON)",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://data.covid19.go.id/public/api/prov.json",
      "status": "active (government)"
    },
    {
      "name": "Dataflow Kit COVID-19",
      "description": "COVID-19 live statistics (Dataflow Kit)",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://covid-19.dataflowkit.com",
      "status": "active (third-party)"
    },
    {
      "name": "FoodData Central",
      "description": "National Nutrient Database for Standard Reference (USDA FoodData Central)",
      "auth": "apiKey",
      "https": true,
      "cors": "unknown",
      "link": "https://fdc.nal.usda.gov/",
      "status": "active"
    },
    {
      "name": "Healthcare.gov",
      "description": "Educational content & developer resources about the US Health Insurance Marketplace",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://www.healthcare.gov/developers/",
      "status": "active"
    },
    {
      "name": "Humanitarian Data Exchange (HDX)",
      "description": "Open platform for sharing humanitarian datasets (HDX)",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://data.humdata.org/",
      "status": "active"
    },
    {
      "name": "Infermedica",
      "description": "NLP-based symptom checker & triage API for health diagnosis from text",
      "auth": "apiKey",
      "https": true,
      "cors": "yes",
      "link": "https://developer.infermedica.com/docs/",
      "status": "active (commercial)"
    },
    {
      "name": "LAPIS (cov-spectrum)",
      "description": "SARS-CoV-2 genomic sequences & public data",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://cov-spectrum.ethz.ch/public",
      "status": "active"
    },
    {
      "name": "Lexigram",
      "description": "NLP that extracts clinical concepts from text and provides access to clinical ontology",
      "auth": "apiKey",
      "https": true,
      "cors": "unknown",
      "link": "https://docs.lexigram.io/",
      "status": "active (commercial)"
    },
    {
      "name": "Makeup",
      "description": "Makeup product information (public makeup API)",
      "auth": "No",
      "https": false,
      "cors": "unknown",
      "link": "http://makeup-api.herokuapp.com/",
      "status": "active (public)"
    },
    {
      "name": "MyVaccination (Malaysia)",
      "description": "Vaccination data for Malaysia",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://documenter.getpostman.com/view/16605343/Tzm8GG7u",
      "status": "active"
    },
    {
      "name": "NPPES (NPI Registry)",
      "description": "National Plan & Provider Enumeration System — US healthcare provider registry API",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://npiregistry.cms.hhs.gov/registry/help-api",
      "status": "active"
    },
    {
      "name": "Nutritionix",
      "description": "Verified nutrition database & APIs",
      "auth": "apiKey",
      "https": true,
      "cors": "unknown",
      "link": "https://developer.nutritionix.com/",
      "status": "active (v2)"
    },
    {
      "name": "Open Data NHS Scotland",
      "description": "Medical reference data & public health statistics from Public Health Scotland",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://www.opendata.nhs.scot",
      "status": "active"
    },
    {
      "name": "Open Disease (disease.sh)",
      "description": "Open disease API — current cases and related datasets (disease.sh)",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://disease.sh/",
      "status": "active"
    },
    {
      "name": "openFDA",
      "description": "Public FDA data about drugs, devices and foods (openFDA)",
      "auth": "apiKey",
      "https": true,
      "cors": "unknown",
      "link": "https://open.fda.gov",
      "status": "active"
    },
    {
      "name": "Orion Health",
      "description": "Medical platform for building healthcare applications (Orion Health developer)",
      "auth": "OAuth",
      "https": true,
      "cors": "unknown",
      "link": "https://developer.orionhealth.io/",
      "status": "active (commercial)"
    },
    {
      "name": "Quarantine",
      "description": "Coronavirus API providing free COVID-19 live updates",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://quarantine.country/coronavirus/api/",
      "status": "active"
    },

    /* Additional / newer widely-used COVID / health datasets added */
    {
      "name": "Our World in Data (OWID) - COVID-19",
      "description": "OWID consolidated COVID-19 datasets (global cases, tests, vaccinations) — downloadable JSON/CSV and API endpoints",
      "auth": "No",
      "https": true,
      "cors": "yes",
      "link": "https://ourworldindata.org/coronavirus",
      "status": "active (recommended for global aggregates)"
    },
    {
      "name": "WHO Athena / GHO APIs",
      "description": "World Health Organization data endpoints & Athena query interface (GHO / datasets)",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://www.who.int/data/gho/info/gho-odata-api",
      "status": "active (official WHO datasets)"
    },
    {
      "name": "COVID-19 Data Portal (EBI / COVID-19 Data Portal)",
      "description": "API & portal for genomics and research datasets related to COVID-19 (EBI/INSDC)",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://www.covid19dataportal.org/api-documentation",
      "status": "active (research datasets)"
    },
    {
      "name": "COVID-19 REST API for India (rootnet.in)",
      "description": "India — REST API for COVID-19 statistics sourced from Ministry of Health and other official sources",
      "auth": "No",
      "https": true,
      "cors": "unknown",
      "link": "https://api.rootnet.in/",
      "status": "active"
    }
  ],
  // add / replace this entry inside SAMPLE_APIS
jobs: [
  { name: "Adzuna", description: "Job board aggregator", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.adzuna.com/overview" },
  { name: "Arbeitnow", description: "API for Job board aggregator in Europe / Remote", auth: "No", https: true, cors: "Yes", link: "https://documenter.getpostman.com/view/18545278/UVJbJdKh" },
  { name: "Arbeitsamt", description: 'API for the "Arbeitsamt" (German job board aggregator)', auth: "OAuth", https: true, cors: "Unknown", link: "https://jobsuche.api.bund.dev/" },
  { name: "Careerjet", description: "Job search engine", auth: "apiKey", https: false, cors: "Unknown", link: "https://www.careerjet.com/partners/api/" },
  { name: "DevITjobs UK", description: "Jobs with GraphQL (DevITjobs UK feed)", auth: "No", https: true, cors: "Yes", link: "https://devitjobs.uk/job_feed.xml" },
  { name: "Findwork", description: "Job board", auth: "apiKey", https: true, cors: "Unknown", link: "https://findwork.dev/developers/" },
  { name: "GraphQL Jobs", description: "Jobs with GraphQL", auth: "No", https: true, cors: "Yes", link: "https://graphql.jobs/docs/api/" },
  { name: "Jobs2Careers", description: "Job aggregator", auth: "apiKey", https: true, cors: "Unknown", link: "http://api.jobs2careers.com/api/spec.pdf" },
  { name: "Jooble", description: "Job search engine", auth: "apiKey", https: true, cors: "Unknown", link: "https://jooble.org/api/about" },
  { name: "Juju", description: "Job search engine", auth: "apiKey", https: false, cors: "Unknown", link: "http://www.juju.com/publisher/spec/" },
  { name: "Open Skills", description: "Job titles, skills and related jobs data", auth: "No", https: false, cors: "Unknown", link: "https://github.com/workforce-data-initiative/skills-api/wiki/API-Overview" },
  { name: "Reed", description: "Job board aggregator", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.reed.co.uk/developers" },
  { name: "The Muse", description: "Job board and company profiles", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.themuse.com/developers/api/v2" },
  { name: "Upwork", description: "Freelance job board and management system", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.upwork.com/" },
  { name: "USAJOBS", description: "US government job board", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.usajobs.gov/" },
  { name: "WhatJobs", description: "Job search engine", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.whatjobs.com/affiliates" },
  { name: "ZipRecruiter", description: "Job search app and website", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.ziprecruiter.com/publishers" },

  // Added commonly-used / public job APIs
  { name: "Remotive", description: "Remote job listings (Remotive public jobs API)", auth: "No", https: true, cors: "Yes", link: "https://remotive.com/api/remote-jobs" },
  { name: "RemoteOK", description: "RemoteOK public jobs API (remote jobs aggregator)", auth: "No", https: true, cors: "Yes", link: "https://remoteok.com/api" },
  { name: "Workable", description: "Workable jobs and applicant tracking API (teams and postings)", auth: "apiKey", https: true, cors: "Unknown", link: "https://workable.readme.io/docs" }
],
// add this to your SAMPLE_APIS object
ml: [
  { name: "AI For Thai", description: "Free various Thai AI API (text, NLP, language tools)", auth: "apiKey", https: true, cors: "Yes", link: "https://aiforthai.in.th/index.php", updated: "2025-11-26" },
  { name: "Clarifai", description: "Computer vision (image/video understanding, custom models)", auth: "OAuth", https: true, cors: "Unknown", link: "https://docs.clarifai.com/api-guide/api-overview", updated: "2025-11-26" },
  { name: "Cloudmersive", description: "Image captioning, face recognition, NSFW classification", auth: "apiKey", https: true, cors: "Yes", link: "https://www.cloudmersive.com/image-recognition-and-processing-api", updated: "2025-11-26" },
  { name: "Deepcode", description: "AI for code review and suggestions", auth: "No", https: true, cors: "Unknown", link: "https://www.deepcode.ai", updated: "2025-11-26" },
  { name: "Dialogflow", description: "Natural language understanding and conversational agents (Google Dialogflow)", auth: "apiKey", https: true, cors: "Unknown", link: "https://cloud.google.com/dialogflow/docs/", updated: "2025-11-26" },
  { name: "EXUDE-API", description: "Text preprocessing: stopword filtering, stemming utilities", auth: "No", https: true, cors: "Yes", link: "http://uttesh.com/exude-api/", updated: "2025-11-26" },
  { name: "Hirak FaceAPI", description: "Face detection, recognition with age/gender estimation (no quota limits)", auth: "apiKey", https: true, cors: "Unknown", link: "https://faceapi.hirak.site/", updated: "2025-11-26" },
  { name: "Imagga", description: "Image recognition: tagging, visual search, moderation", auth: "apiKey", https: true, cors: "Unknown", link: "https://imagga.com/", updated: "2025-11-26" },
  { name: "Inferdo", description: "Computer vision services (facial detection, labeling, moderation) via RapidAPI", auth: "apiKey", https: true, cors: "Unknown", link: "https://rapidapi.com/user/inferdo", updated: "2025-11-26" },
  { name: "IPS Online", description: "Face & license-plate anonymization", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.identity.ps/docs", updated: "2025-11-26" },
  { name: "Irisnet", description: "Realtime content moderation API that blocks or blurs unwanted images", auth: "apiKey", https: true, cors: "Yes", link: "https://irisnet.de/api/", updated: "2025-11-26" },
  { name: "Keen IO", description: "Event data analytics (tracking + insights)", auth: "apiKey", https: true, cors: "Unknown", link: "https://keen.io/", updated: "2025-11-26" },
  { name: "Machinetutors", description: "AI solutions: image/video classification, NSFW, NLP, search", auth: "apiKey", https: true, cors: "Yes", link: "https://www.machinetutors.com/portfolio/MT_api.html", updated: "2025-11-26" },
  { name: "MessengerX.io", description: "API for building ML-based chat apps (monetizable)", auth: "apiKey", https: true, cors: "Yes", link: "https://messengerx.rtfd.io", updated: "2025-11-26" },
  { name: "NLP Cloud", description: "NLP (spaCy & transformer based) for NER, sentiment, summarization", auth: "apiKey", https: true, cors: "Unknown", link: "https://nlpcloud.io", updated: "2025-11-26" },
  { name: "OpenVisionAPI", description: "Open-source computer vision API built on community models", auth: "No", https: true, cors: "Yes", link: "https://openvisionapi.com", updated: "2025-11-26" },
  { name: "Perspective", description: "Toxicity scoring for text (model that estimates toxicity probability)", auth: "apiKey", https: true, cors: "Unknown", link: "https://perspectiveapi.com", updated: "2025-11-26" },
  { name: "Roboflow Universe", description: "Pre-trained and community computer-vision models & datasets", auth: "apiKey", https: true, cors: "Yes", link: "https://universe.roboflow.com", updated: "2025-11-26" },
  { name: "SkyBiometry", description: "Face detection, recognition, face grouping", auth: "apiKey", https: true, cors: "Unknown", link: "https://skybiometry.com/documentation/", updated: "2025-11-26" },
  { name: "Time Door", description: "Time series analysis API", auth: "apiKey", https: true, cors: "Yes", link: "https://timedoor.io", updated: "2025-11-26" },
  { name: "Unplugg", description: "Forecasting API for time-series data", auth: "apiKey", https: true, cors: "Unknown", link: "https://unplu.gg/test_api.html", updated: "2025-11-26" },
  { name: "WolframAlpha", description: "Algorithmic & knowledge-intelligence answers (math, data, facts)", auth: "apiKey", https: true, cors: "Unknown", link: "https://products.wolframalpha.com/api/", updated: "2025-11-26" },

  // commonly-used / widely-available ML platform APIs (added)
  { name: "Hugging Face Inference API", description: "Model inference (text, audio, image) hosted models & spaces", auth: "apiKey", https: true, cors: "Unknown", link: "https://huggingface.co/docs/api-inference", updated: "2025-11-26" },
  { name: "OpenAI API", description: "Large language models, embeddings, vision & multimodal (Chat, completions, images)", auth: "apiKey", https: true, cors: "Unknown", link: "https://platform.openai.com/docs/api-reference", updated: "2025-11-26" },
  { name: "Google Vertex AI", description: "Managed ML platform for training and serving models (Google Cloud)", auth: "OAuth / apiKey", https: true, cors: "Unknown", link: "https://cloud.google.com/vertex-ai/docs", updated: "2025-11-26" },
  { name: "AWS SageMaker (endpoints)", description: "Model hosting & inference endpoints on AWS SageMaker", auth: "IAM / apiKey", https: true, cors: "Unknown", link: "https://docs.aws.amazon.com/sagemaker/latest/dg/endpoint-deployment.html", updated: "2025-11-26" },
  { name: "Azure Cognitive Services", description: "Vision, Speech, Language and Decision cognitive APIs from Microsoft", auth: "apiKey", https: true, cors: "Unknown", link: "https://learn.microsoft.com/azure/cognitive-services/", updated: "2025-11-26" }
],
// Add / replace this key inside SAMPLE_APIS
music: [
  { name: "7digital", description: "API of music store 7digital", auth: "OAuth", https: true, cors: "Unknown", link: "https://docs.7digital.com/reference", updated: "2025-11-26" },
  { name: "AI Mastering", description: "Automated music mastering service (AI Mastering)", auth: "apiKey", https: true, cors: "Yes", link: "https://aimastering.com/api_docs/", updated: "2025-11-26" },
  { name: "Audiomack", description: "Streaming music hub (Audiomack) data API", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.audiomack.com/data-api/docs", updated: "2025-11-26" },
  { name: "Bandcamp", description: "Bandcamp developer API", auth: "OAuth", https: true, cors: "Unknown", link: "https://bandcamp.com/developer", updated: "2025-11-26" },
  { name: "Bandsintown", description: "Music events & artist touring data (Bandsintown)", auth: "No", https: true, cors: "Unknown", link: "https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0", updated: "2025-11-26" },
  { name: "Deezer", description: "Deezer music platform API", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.deezer.com/api", updated: "2025-11-26" },
  { name: "Discogs", description: "Discogs database & marketplace API", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.discogs.com/developers/", updated: "2025-11-26" },
  { name: "Freesound", description: "Sound samples & effects API (Freesound)", auth: "apiKey", https: true, cors: "Unknown", link: "https://freesound.org/docs/api/", updated: "2025-11-26" },
  { name: "Gaana (unofficial)", description: "Unofficial Gaana API (community projects)", auth: "No", https: true, cors: "Unknown", link: "https://github.com/cyberboysumanjay/GaanaAPI", updated: "2025-11-26" },
  { name: "Genius", description: "Crowdsourced lyrics and music knowledge (Genius)", auth: "OAuth", https: true, cors: "Unknown", link: "https://docs.genius.com/", updated: "2025-11-26" },
  { name: "Genrenator", description: "Music genre generator (fun/random)", auth: "No", https: true, cors: "Unknown", link: "https://binaryjazz.us/genrenator-api/", updated: "2025-11-26" },
  { name: "iTunes Search", description: "iTunes / Apple Search API (search the iTunes Store)", auth: "No", https: true, cors: "Unknown", link: "https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/", updated: "2025-11-26" },
  { name: "Jamendo", description: "Jamendo music API (streaming & metadata)", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.jamendo.com/v3.0/docs", updated: "2025-11-26" },
  { name: "JioSaavn (unofficial)", description: "Community-driven JioSaavn API wrappers", auth: "No", https: true, cors: "Unknown", link: "https://github.com/cyberboysumanjay/JioSaavnAPI", updated: "2025-11-26" },
  { name: "KKBOX", description: "KKBOX platform API (libraries, charts, playlists)", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.kkbox.com", updated: "2025-11-26" },
  { name: "KSoft.Si Lyrics", description: "Lyrics lookup API (KSoft.Si)", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.ksoft.si/api/lyrics-api", updated: "2025-11-26" },
  { name: "LastFm", description: "Last.fm music metadata & scrobbling API", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.last.fm/api", updated: "2025-11-26" },
  { name: "Lyrics.ovh", description: "Simple lyrics retrieval API (lyrics.ovh)", auth: "No", https: true, cors: "Unknown", link: "https://lyricsovh.docs.apiary.io", updated: "2025-11-26" },
  { name: "Mixcloud", description: "Mixcloud API for uploads, shows & user data", auth: "OAuth", https: true, cors: "Yes", link: "https://www.mixcloud.com/developers/", updated: "2025-11-26" },
  { name: "MusicBrainz", description: "MusicBrainz open music encyclopedia API", auth: "No", https: true, cors: "Unknown", link: "https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2", updated: "2025-11-26" },
  { name: "Musixmatch", description: "Musixmatch lyrics & music data", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.musixmatch.com/", updated: "2025-11-26" },
  { name: "Napster", description: "Napster music catalog & streaming API", auth: "apiKey", https: true, cors: "Yes", link: "https://developer.napster.com/api/v2.2", updated: "2025-11-26" },
  { name: "Openwhyd", description: "Curated playlists aggregator (Openwhyd)", auth: "No", https: true, cors: "No", link: "https://openwhyd.github.io/openwhyd/API", updated: "2025-11-26" },
  { name: "Phishin", description: "Archive API for Phish live audio recordings", auth: "apiKey", https: true, cors: "No", link: "https://phish.in/api-docs", updated: "2025-11-26" },
  { name: "Radio Browser", description: "Community-driven list of internet radio stations", auth: "No", https: true, cors: "Yes", link: "https://api.radio-browser.info/", updated: "2025-11-26" },
  { name: "Songkick", description: "Songkick events & concerts API", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.songkick.com/developer/", updated: "2025-11-26" },
  { name: "Songlink / Odesli", description: "Universal links for songs across platforms (Odesli)", auth: "apiKey", https: true, cors: "Yes", link: "https://www.odesli.co/docs", updated: "2025-11-26" },
  { name: "Songsterr", description: "Guitar, bass & drum tabs and chords (Songsterr)", auth: "No", https: true, cors: "Unknown", link: "https://www.songsterr.com/a/wa/api/", updated: "2025-11-26" },
  { name: "SoundCloud", description: "SoundCloud API for track & user management", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.soundcloud.com/docs/api/guide", updated: "2025-11-26" },
  { name: "Spotify", description: "Spotify Web API: catalog, playlists, recommendations", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.spotify.com/documentation/web-api/", updated: "2025-11-26" },
  { name: "TasteDive", description: "TasteDive similar-artist & recommendation API", auth: "apiKey", https: true, cors: "Unknown", link: "https://tastedive.com/read/api", updated: "2025-11-26" },
  { name: "TheAudioDB", description: "TheAudioDB music metadata and artwork", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.theaudiodb.com/api_guide.php", updated: "2025-11-26" },
  { name: "Vagalume", description: "Vagalume lyrics & music knowledge (Brazil)", auth: "apiKey", https: true, cors: "Unknown", link: "https://api.vagalume.com.br/docs/", updated: "2025-11-26" },

  // Common / widely-used music-related APIs added
  { name: "Apple Music", description: "Apple Music API (catalog, user playback via MusicKit)", auth: "MusicKit / developer tokens (JWT)", https: true, cors: "Unknown", link: "https://developer.apple.com/documentation/applemusicapi", updated: "2025-11-26" },
  { name: "YouTube Data API", description: "YouTube Data API v3 (useful for music videos, metadata & search)", auth: "apiKey / OAuth", https: true, cors: "Unknown", link: "https://developers.google.com/youtube/v3", updated: "2025-11-26" }
],
// add / merge this into your SAMPLE_APIS object
news: [
  { name: "apilayer mediastack", description: "Free, simple REST API for live news & blog articles (global coverage, historical & real-time)", auth: "apiKey", https: true, cors: "Unknown", link: "https://mediastack.com/" },
  { name: "Associated Press", description: "AP Developer APIs: search for news, multimedia and metadata from Associated Press", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.ap.org/" },
  { name: "Chronicling America", description: "Historic US newspapers from the Library of Congress (search & page access)", auth: "No", https: false, cors: "Unknown", link: "http://chroniclingamerica.loc.gov/about/api/" },
  { name: "Currents", description: "Latest news published across news sources, blogs and forums (search & headlines)", auth: "apiKey", https: true, cors: "Yes", link: "https://currentsapi.services/" },
  { name: "Feedbin", description: "RSS reader API (Feedbin project)", auth: "OAuth", https: true, cors: "Unknown", link: "https://github.com/feedbin/feedbin-api" },
  { name: "GNews", description: "Search news from many sources (GNews API / Google News-based results)", auth: "apiKey", https: true, cors: "Yes", link: "https://gnews.io/" },
  { name: "Graphs for Coronavirus", description: "Country-level and worldwide graphs for Coronavirus (daily updates)", auth: "No", https: true, cors: "Yes", link: "https://corona.dnsforfamily.com/api.txt" },
  { name: "Inshorts News (unofficial)", description: "Inshorts news content (community-maintained API wrappers)", auth: "No", https: true, cors: "Unknown", link: "https://github.com/cyberboysumanjay/Inshorts-News-API" },
  { name: "MarketAux", description: "Live stock market news with tagged tickers, sentiment and stats (financial news)", auth: "apiKey", https: true, cors: "Yes", link: "https://www.marketaux.com/" },
  { name: "New York Times", description: "NYTimes developer APIs for articles, search, and metadata", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.nytimes.com/" },
  { name: "News (NewsAPI)", description: "Headlines and article search across many news sources and blogs", auth: "apiKey", https: true, cors: "Unknown", link: "https://newsapi.org/" },
  { name: "NewsData", description: "News data API for live-breaking news and headlines from multiple sources", auth: "apiKey", https: true, cors: "Unknown", link: "https://newsdata.io/docs" },
  { name: "NewsX (RapidAPI)", description: "Breaking news with ML-powered summaries (hosted on RapidAPI)", auth: "apiKey", https: true, cors: "Unknown", link: "https://rapidapi.com/machaao-inc-machaao-inc-default/api/newsx/" },
  { name: "NPR One (NPR)", description: "NPR developer APIs and personalized listening experience", auth: "OAuth", https: true, cors: "Unknown", link: "http://dev.npr.org/api/" },
  { name: "Spaceflight News", description: "Spaceflight-related news (space industry headlines and articles)", auth: "No", https: true, cors: "Yes", link: "https://spaceflightnewsapi.net" },
  { name: "The Guardian Open Platform", description: "Access content produced by The Guardian, categorized by section & tags", auth: "apiKey", https: true, cors: "Unknown", link: "http://open-platform.theguardian.com/" },
  { name: "The Old Reader", description: "RSS reader API (TheOldReader)", auth: "apiKey", https: true, cors: "Unknown", link: "https://github.com/theoldreader/api" },
  { name: "TheNews", description: "Aggregated headlines, top stories and live news JSON API", auth: "apiKey", https: true, cors: "Yes", link: "https://www.thenewsapi.com/" },
  { name: "Trove", description: "Digitised Australian newspapers and library content (National Library of Australia)", auth: "apiKey", https: true, cors: "Unknown", link: "https://trove.nla.gov.au/about/create-something/using-api" },

  // Additional popular / aggregator news APIs you may find useful:
  { name: "ContextualWeb (News)", description: "ContextualWeb News & Search API — web and news search results", auth: "apiKey", https: true, cors: "Unknown", link: "https://rapidapi.com/contextualwebsearch/api/websearch" },
  { name: "Event Registry", description: "Event Registry news & event detection platform (global news aggregation & analytics)", auth: "apiKey", https: true, cors: "Unknown", link: "https://eventregistry.org/documentation" }
],
"open-data": [
  { name: "18F", description: "Unofficial US Federal Government API Development", auth: "No", https: false, cors: "unknown", link: "http://18f.github.io/API-All-the-X/" },
  { name: "API Setu", description: "Indian Government open APIs for KYC, business, education & employment", auth: "No", https: true, cors: "yes", link: "https://www.apisetu.gov.in/" },
  { name: "Archive.org", description: "The Internet Archive datasets", auth: "No", https: true, cors: "no", link: "https://archive.readme.io/docs" },
  { name: "Black History Facts", description: "Large black history fact database", auth: "apiKey", https: true, cors: "yes", link: "https://www.blackhistoryapi.io/docs" },
  { name: "BotsArchive", description: "Details about Telegram bots", auth: "No", https: true, cors: "unknown", link: "https://botsarchive.com/docs.html" },
  { name: "Callook.info", description: "United States ham radio callsigns", auth: "No", https: true, cors: "unknown", link: "https://callook.info" },
  { name: "CARTO", description: "Location Information Prediction / GIS Analysis", auth: "apiKey", https: true, cors: "unknown", link: "https://carto.com/" },
  { name: "CollegeScoreCard", description: "US higher education institutions data", auth: "No", https: true, cors: "unknown", link: "https://collegescorecard.ed.gov/data/" },
  { name: "Enigma Public", description: "Large collection of public data", auth: "apiKey", https: true, cors: "yes", link: "https://developers.enigma.com/docs" },
  { name: "French Address Search", description: "French Government address search API", auth: "No", https: true, cors: "unknown", link: "https://geo.api.gouv.fr/adresse" },
  { name: "GENESIS", description: "Federal Statistical Office Germany data", auth: "OAuth", https: true, cors: "unknown", link: "https://www.destatis.de/EN/Service/OpenData/api-webservice.html" },
  { name: "Joshua Project", description: "People groups of the world API", auth: "apiKey", https: true, cors: "unknown", link: "https://api.joshuaproject.net/" },
  { name: "Kaggle", description: "Datasets, notebooks and competition platform", auth: "apiKey", https: true, cors: "unknown", link: "https://www.kaggle.com/docs/api" },
  { name: "LinkPreview", description: "Extract title/description/preview from any URL", auth: "apiKey", https: true, cors: "yes", link: "https://www.linkpreview.net" },
  { name: "Lowy Asia Power Index", description: "Geopolitical power ranking of Asian countries", auth: "No", https: true, cors: "unknown", link: "https://github.com/0x0is1/lowy-index-api-docs" },
  { name: "Microlink.io", description: "Extract structured data from any webpage", auth: "No", https: true, cors: "yes", link: "https://microlink.io" },
  { name: "Nasdaq Data Link", description: "Stock market and economic financial datasets", auth: "apiKey", https: true, cors: "unknown", link: "https://docs.data.nasdaq.com/" },
  { name: "Nobel Prize", description: "Data about Nobel prizes and events", auth: "No", https: true, cors: "yes", link: "https://www.nobelprize.org/about/developer-zone-2/" },
  { name: "Open Data Minneapolis", description: "GIS and non-GIS data for Minneapolis", auth: "No", https: true, cors: "no", link: "https://opendata.minneapolismn.gov/" },
  { name: "openAFRICA", description: "African open datasets repository", auth: "No", https: true, cors: "unknown", link: "https://africaopendata.org/" },
  { name: "OpenCorporates", description: "Corporate entities & directors worldwide", auth: "apiKey", https: true, cors: "unknown", link: "http://api.opencorporates.com/documentation/API-Reference" },
  { name: "OpenSanctions", description: "Sanctions & political exposure dataset", auth: "No", https: true, cors: "yes", link: "https://www.opensanctions.org/docs/api/" },
  { name: "PeakMetrics", description: "News articles and public datasets", auth: "apiKey", https: true, cors: "unknown", link: "https://rapidapi.com/peakmetrics-peakmetrics-default/api/peakmetrics-news" },
  { name: "Recreation.gov RIDB", description: "Recreational areas & museum dataset (US)", auth: "apiKey", https: true, cors: "unknown", link: "https://ridb.recreation.gov/" },
  { name: "Scoop.it", description: "Content curation service", auth: "apiKey", https: false, cors: "unknown", link: "http://www.scoop.it/dev" },
  { name: "Socrata", description: "Global government open open-data APIs", auth: "OAuth", https: true, cors: "yes", link: "https://dev.socrata.com/" },
  { name: "Teleport", description: "Quality-of-life information for world cities", auth: "No", https: true, cors: "unknown", link: "https://developers.teleport.org/" },
  { name: "Umeå Open Data", description: "City open data for Umeå (Sweden)", auth: "No", https: true, cors: "yes", link: "https://opendata.umea.se/api/" },
  { name: "Universities List", description: "Universities names, domains and countries", auth: "No", https: true, cors: "unknown", link: "https://github.com/Hipo/university-domains-list" },
  { name: "University of Oslo", description: "Courses & resources at UiO", auth: "No", https: true, cors: "unknown", link: "https://data.uio.no/" },
  { name: "UPC Database", description: "Global product barcode database", auth: "apiKey", https: true, cors: "unknown", link: "https://upcdatabase.org/api" },
  { name: "Urban Observatory", description: "Real-time urban datasets (UK)", auth: "No", https: false, cors: "no", link: "https://urbanobservatory.ac.uk" },
  { name: "Wikidata", description: "Collaborative semantic knowledge base", auth: "OAuth", https: true, cors: "unknown", link: "https://www.wikidata.org/w/api.php?action=help" },
  { name: "Wikipedia", description: "Mediawiki encyclopedia API", auth: "No", https: true, cors: "unknown", link: "https://www.mediawiki.org/wiki/API:Main_page" },
  { name: "Yelp", description: "Find local businesses and reviews", auth: "OAuth", https: true, cors: "unknown", link: "https://www.yelp.com/developers/documentation/v3" },

  // ⬇️ NEW & 2024-2025 OPEN DATA ADDITIONS
  { name: "Google Dataset Search", description: "Search global open public datasets", auth: "No", https: true, cors: "unknown", link: "https://datasetsearch.research.google.com/" },
  { name: "World Bank Open Data", description: "Economic development datasets", auth: "No", https: true, cors: "yes", link: "https://api.worldbank.org/" },
  { name: "EU Open Data Portal", description: "European Union public datasets", auth: "No", https: true, cors: "unknown", link: "https://data.europa.eu/en/api" },
  { name: "OpenWeather Climate Archive", description: "Global climate & historical weather data", auth: "apiKey", https: true, cors: "yes", link: "https://openweather.co.uk/climate" },
  { name: "Global Health Observatory (WHO)", description: "Public health statistics by WHO", auth: "No", https: true, cors: "unknown", link: "https://ghoapi.azureedge.net/" },
  { name: "UN Data Explorer", description: "United Nations datasets", auth: "No", https: true, cors: "unknown", link: "https://data.un.org/" }
],
/* Personality category — use in SAMPLE_APIS.personality */
personality: [
  { name: "Advice Slip", description: "Generate random advice slips", auth: "No", https: true, cors: "Unknown", link: "http://api.adviceslip.com/" },
  { name: "Biriyani As A Service", description: "Biriyani images placeholder", auth: "No", https: true, cors: "No", link: "https://biriyani.anoram.com/" },
  { name: "Dev.to", description: "Access Forem articles, users and other resources via API", auth: "apiKey", https: true, cors: "Unknown", link: "https://developers.forem.com/api" },
  { name: "Dictum", description: "Access to a collection of inspiring expressions", auth: "No", https: true, cors: "Unknown", link: "https://github.com/fisenkodv/dictum" },
  { name: "FavQs", description: "Collect, discover and share your favorite quotes", auth: "apiKey", https: true, cors: "Unknown", link: "https://favqs.com/api" },
  { name: "FOAAS", description: "Fuck Off As A Service (funny/NSFW responses)", auth: "No", https: false, cors: "Unknown", link: "http://www.foaas.com/" },
  { name: "Forismatic", description: "Inspirational quotes", auth: "No", https: false, cors: "Unknown", link: "http://forismatic.com/en/api/" },
  { name: "icanhazdadjoke", description: "Largest selection of dad jokes", auth: "No", https: true, cors: "Unknown", link: "https://icanhazdadjoke.com/api" },
  { name: "Inspiration (GoProgram)", description: "Motivational and inspirational quotes", auth: "No", https: true, cors: "Yes", link: "https://inspiration.goprogram.ai/docs/" },
  { name: "kanye.rest", description: "Random Kanye West quotes", auth: "No", https: true, cors: "Yes", link: "https://kanye.rest" },
  { name: "kimiquotes", description: "Team radio and interview quotes by Kimi Räikkönen", auth: "No", https: true, cors: "Yes", link: "https://kimiquotes.herokuapp.com/doc" },
  { name: "Medium (API)", description: "Medium platform API for posts and users", auth: "OAuth", https: true, cors: "Unknown", link: "https://github.com/Medium/medium-api-docs" },
  { name: "Programming Quotes", description: "Programming quotes API for open source projects", auth: "No", https: true, cors: "Unknown", link: "https://github.com/skolakoda/programming-quotes-api" },
  { name: "Quotable", description: "Free, open source quotations API", auth: "No", https: true, cors: "Unknown", link: "https://github.com/lukePeavey/quotable" },
  { name: "Quote Garden", description: "REST API for more than 5000 famous quotes", auth: "No", https: true, cors: "Unknown", link: "https://pprathameshmore.github.io/QuoteGarden/" },
  { name: "quoteclear", description: "James Clear quotes from the 3-2-1 Newsletter", auth: "No", https: true, cors: "Yes", link: "https://quoteclear.web.app/" },
  { name: "Quotes on Design", description: "Quotes about design and creativity", auth: "No", https: true, cors: "Unknown", link: "https://quotesondesign.com/api/" },
  { name: "Stoicism Quote", description: "Quotes about Stoicism", auth: "No", https: true, cors: "Unknown", link: "https://github.com/tlcheah2/stoic-quote-lambda-public-api" },
  { name: "They Said So", description: "Commercial quotes API trusted by brands", auth: "No", https: true, cors: "Unknown", link: "https://theysaidso.com/api/" },
  { name: "Traitify", description: "Assess, collect and analyze personality", auth: "No", https: true, cors: "Unknown", link: "https://app.traitify.com/developer" },
  { name: "Udemy (Instructor)", description: "API for instructors on Udemy", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.udemy.com/developers/instructor/" },
  { name: "Vadivelu HTTP Codes", description: "On-demand HTTP codes with images (fun)", auth: "No", https: true, cors: "No", link: "https://vadivelu.anoram.com/" },
  { name: "Zen Quotes", description: "Large collection of Zen quotes for inspiration", auth: "No", https: true, cors: "Yes", link: "https://zenquotes.io/" },

  /* Additional helpful / commonly-used endpoints I added */
  { name: "Type.fit Quotes", description: "Large free JSON collection of quotes (simple public endpoint)", auth: "No", https: true, cors: "Yes", link: "https://type.fit/api/quotes" },
  { name: "They Said So (Random Quote endpoint)", description: "Random quote endpoints from TheySaidSo", auth: "No", https: true, cors: "Unknown", link: "https://quotes.rest/" }
],
// add / replace this entry inside SAMPLE_APIS
patent: [
  {
    name: "EPO - Open Patent Services (OPS)",
    description: "European Patent Office Open Patent Services (bibliographic, legal status, full-text and images).",
    auth: "OAuth",
    https: true,
    cors: "unknown",
    link: "https://developers.epo.org/" // OPS entry / docs
  },
  {
    name: "PatentsView",
    description: "US patent data API for exploring and visualizing trends across the US innovation landscape.",
    auth: "No",
    https: true,
    cors: "unknown",
    link: "https://patentsview.org/apis/" // PatentsView docs / API endpoints
  },
  {
    name: "TIPO Open Data (Taiwan IP Office)",
    description: "TIPO open data / patent APIs (Taiwan Intellectual Property Office).",
    auth: "apiKey",
    https: true,
    cors: "unknown",
    link: "https://cloud.tipo.gov.tw/S220/opdata" // TIPO open data / API portal
  },
  {
    name: "USPTO - Open Data / Patent APIs",
    description: "US Patent and Trademark Office Open Data APIs and catalog (patents, file wrappers, assignments, etc.).",
    auth: "No",
    https: true,
    cors: "unknown",
    link: "https://developer.uspto.gov/api-catalog" // USPTO API catalog / endpoints
  },

  // additional popular patent APIs / indexes
  {
    name: "Lens.org API",
    description: "Lens API for searching and retrieving scholarly works and patent records (token-based access).",
    auth: "token",
    https: true,
    cors: "unknown",
    link: "https://docs.api.lens.org/" // Lens API docs
  },
  {
    name: "WIPO PATENTSCOPE (search portal)",
    description: "WIPO PATENTSCOPE database (international PCT applications and participating national collections).",
    auth: "No",
    https: true,
    cors: "unknown",
    link: "https://patentscope.wipo.int/" // PATENTSCOPE portal / search
  }
],
  // add / update this key in SAMPLE_APIS
  phone: [
    {
      name: "AbstractAPI Phone Validation",
      description: "Global phone number validation, formatting, carrier and line-type detection (AbstractAPI).",
      auth: "apiKey",
      https: true,
      cors: "yes",
      link: "https://www.abstractapi.com/api/phone-validation-api"
    },
    {
      name: "apilayer / Numverify",
      description: "Phone number validation & lookup (carrier, location, line type) from apilayer / Numverify.",
      auth: "apiKey",
      https: true,
      cors: "unknown",
      link: "https://numverify.com"
    },
    {
      name: "Cloudmersive Phone Validation",
      description: "Phone number validation and standardization API (Cloudmersive Validate).",
      auth: "apiKey",
      https: true,
      cors: "yes",
      link: "https://cloudmersive.com/phone-number-validation-API"
    },
    {
      name: "Phone Specifications (MobileSpecs) / azharimm",
      description: "Phone specifications REST API — device/phone model specs, search and latest endpoints (community project).",
      auth: "No",
      https: true,
      cors: "yes",
      link: "https://github.com/azharimm/phone-specs-api"
    },
    {
      name: "Veriphone",
      description: "Phone number validation, formatting and carrier lookup (Veriphone.io).",
      auth: "apiKey",
      https: true,
      cors: "yes",
      link: "https://veriphone.io"
    },
    {
      name: "NumlookupAPI",
      description: "Worldwide phone number lookup & validation (carrier, line type, location).",
      auth: "apiKey",
      https: true,
      cors: "yes",
      link: "https://numlookupapi.com"
    },
    {
      name: "Twilio Lookup",
      description: "Twilio Lookup API — validation, formatting, carrier and caller name; enterprise-grade phone intelligence.",
      auth: "apiKey / Account SID & Auth Token",
      https: true,
      cors: "no",
      link: "https://www.twilio.com/docs/lookup"
    },
    {
      name: "Proweblook Phone Checker",
      description: "Phone number validator endpoint for quick validation and formatting.",
      auth: "apiKey",
      https: true,
      cors: "unknown",
      link: "https://api.proweblook.com/phone-number-validator"
    }
  ],
// add / replace this key inside your SAMPLE_APIS object
"open-source": [
  { name: "Countly", description: "Countly web analytics", auth: "No", https: false, cors: "Unknown", link: "https://api.count.ly/reference" },
  { name: "Creative Commons Catalog", description: "Search among openly licensed and public domain works (CC Catalog)", auth: "OAuth", https: true, cors: "Yes", link: "https://api.creativecommons.engineering/" },
  { name: "Datamuse", description: "Word-finding query engine (lexical search)", auth: "No", https: true, cors: "Unknown", link: "https://www.datamuse.com/api/" },
  { name: "Drupal.org", description: "Drupal.org developer APIs (documentation & API index)", auth: "No", https: true, cors: "Unknown", link: "https://www.drupal.org/developing/api" },
  { name: "Evil Insult Generator", description: "Generate (fun) insults as text/JSON/XML", auth: "No", https: true, cors: "Yes", link: "https://evilinsult.com/api" },
  { name: "GitHub Contribution Chart Generator", description: "Create an image of your GitHub contributions", auth: "No", https: true, cors: "Yes", link: "https://github-contributions.vercel.app" },
  { name: "GitHub ReadMe Stats", description: "Dynamically-generated GitHub profile stats for READMEs", auth: "No", https: true, cors: "Yes", link: "https://github-readme-stats.vercel.app" },
  { name: "Metabase", description: "Open source business intelligence server (self-hosted Metabase API)", auth: "No", https: true, cors: "Yes", link: "https://www.metabase.com/docs/latest/api" },
  { name: "Shields", description: "Concise, consistent, legible badges (SVG/raster)", auth: "No", https: true, cors: "Unknown", link: "https://shields.io/" },

  // — additional, commonly used open-source project APIs I added:
  { name: "Open Library", description: "Open Library APIs for books/authors/subjects (Internet Archive)", auth: "No", https: true, cors: "Unknown", link: "https://openlibrary.org/developers/api" },
  { name: "Stack Exchange", description: "Stack Exchange network API (Stack Overflow, etc.) — OAuth for auth", auth: "OAuth", https: true, cors: "Unknown", link: "https://api.stackexchange.com/" },
  { name: "Gitea", description: "Gitea self-hosted Git service API (token/basic auth)", auth: "Token / Basic", https: true, cors: "Unknown", link: "https://docs.gitea.com/api/" }
]
,
  "photography": [
    { name: "apilayer screenshotlayer", description: "URL-to-image / website screenshot API", auth: "No", https: true, cors: "Unknown", link: "https://screenshotlayer.com" },
    { name: "APITemplate.io", description: "Dynamically generate images and PDFs from templates with a simple API", auth: "apiKey", https: true, cors: "Yes", link: "https://apitemplate.io" },
    { name: "Bruzu", description: "Image generation via query string (generate images dynamically)", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.bruzu.com" },
    { name: "CheetahO", description: "Photo optimization, resize and image compression API", auth: "apiKey", https: true, cors: "Unknown", link: "https://cheetaho.com/docs/getting-started/" },
    { name: "Dagpi", description: "Image manipulation and processing API", auth: "apiKey", https: true, cors: "Unknown", link: "https://dagpi.xyz" },
    { name: "Duply", description: "Generate, edit, scale and manage images and videos via templates", auth: "apiKey", https: true, cors: "Yes", link: "https://duply.co/docs#getting-started-api" },
    { name: "DynaPictures", description: "Generate hundreds of personalized images using templates", auth: "apiKey", https: true, cors: "Yes", link: "https://dynapictures.com/docs/" },
    { name: "Flickr", description: "Flickr Services API (photos, search, accounts)", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.flickr.com/services/api/" },
    { name: "Getty Images", description: "Access Getty Images collections and search", auth: "OAuth", https: true, cors: "Unknown", link: "http://developers.gettyimages.com/en/" },
    { name: "Gfycat", description: "GIF & short video hosting API", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.gfycat.com/api/" },
    { name: "Giphy", description: "Search and retrieve GIFs", auth: "apiKey", https: true, cors: "Unknown", link: "https://developers.giphy.com/docs/" },
    { name: "Google Photos", description: "Integrate Google Photos with your apps (media library, uploads)", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.google.com/photos" },
    { name: "Image Upload (apilayer)", description: "Image optimisation & upload endpoints (apilayer marketplace)", auth: "apiKey", https: true, cors: "Unknown", link: "https://apilayer.com/marketplace/image_upload-api" },
    { name: "Imgur", description: "Image hosting & API (upload, albums, comments)", auth: "OAuth", https: true, cors: "Unknown", link: "https://apidocs.imgur.com/" },
    { name: "Imsea", description: "Free image search (simple image search endpoint)", auth: "No", https: true, cors: "Unknown", link: "https://imsea.herokuapp.com/" },
    { name: "Lorem Picsum", description: "Random images (placeholder images, Unsplash-based)", auth: "No", https: true, cors: "Unknown", link: "https://picsum.photos/" },
    { name: "ObjectCut", description: "Image background removal API", auth: "apiKey", https: true, cors: "Yes", link: "https://objectcut.com/" },
    { name: "Pexels", description: "Free stock photos and videos (search & curated collections)", auth: "apiKey", https: true, cors: "Yes", link: "https://www.pexels.com/api/" },
    { name: "PhotoRoom", description: "Background removal and photo editing APIs", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.photoroom.com/api/" },
    { name: "Pixabay", description: "Free images & videos API (search, categories)", auth: "apiKey", https: true, cors: "Unknown", link: "https://pixabay.com/api/docs/" },
    { name: "PlaceKeanu", description: "Resizable Keanu Reeves placeholder images", auth: "No", https: true, cors: "Unknown", link: "https://placekeanu.com/" },
    { name: "Readme typing SVG", description: "Customizable typing/deleting text SVG generator", auth: "No", https: true, cors: "Unknown", link: "https://github.com/DenverCoder1/readme-typing-svg" },
    { name: "Remove.bg", description: "Image background removal API", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.remove.bg/api" },
    { name: "ReSmush.it", description: "Image optimization service (legacy public API)", auth: "No", https: false, cors: "Unknown", link: "https://resmush.it/api" },
    { name: "Shutterstock", description: "Stock photos & videos API", auth: "OAuth", https: true, cors: "Unknown", link: "https://api-reference.shutterstock.com/" },
    { name: "Sirv", description: "Image management (optimization, manipulation, hosting)", auth: "apiKey", https: true, cors: "Unknown", link: "https://apidocs.sirv.com/" },
    { name: "Unsplash", description: "Unsplash photography API (search, download, collections)", auth: "OAuth", https: true, cors: "Unknown", link: "https://unsplash.com/developers" },
    { name: "Wallhaven", description: "Wallpaper search API", auth: "apiKey", https: true, cors: "Unknown", link: "https://wallhaven.cc/help/api" },
    { name: "Webdam", description: "Digital asset management / REST API (By EasyDITA / Webdam docs)", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.damsuccess.com/hc/en-us/articles/202134055-REST-API" },

    // Added/up-to-date widely-used image/media APIs (newer / popular choices)
    { name: "Cloudinary", description: "Comprehensive image & video upload, transform and delivery platform (rich transformations, AI & CDN)", auth: "apiKey", https: true, cors: "Yes", link: "https://cloudinary.com/documentation" },
    { name: "Filestack", description: "File upload API + transformations and delivery (uploader widget & processing)", auth: "apiKey", https: true, cors: "Yes", link: "https://www.filestack.com/docs/" },
    { name: "Imgix", description: "Real-time image processing & optimization via dynamic URLs (CDN delivery)", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.imgix.com/" },
    { name: "Cloudimage (Scaleflex)", description: "Media optimization, resizing & CDN for images and video", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.cloudimage.io/" }
  ],
  // add / replace this key inside your SAMPLE_APIS object
"programming": [
  {
    name: "Codeforces",
    description: "Get access to Codeforces public data (contests, problems, users, submissions).",
    auth: "apiKey (for private methods)",
    https: true,
    cors: "Unknown",
    link: "https://codeforces.com/apiHelp"
  },
  {
    name: "Hackerearth",
    description: "Compile and run code in several languages, recruiter/tests endpoints (HackerEarth API V4).",
    auth: "apiKey / client_secret",
    https: true,
    cors: "Unknown",
    link: "https://www.hackerearth.com/docs/wiki/developers/v4/"
  },
  {
    name: "Judge0 CE",
    description: "Robust open-source online code execution system (compile/run/submissions endpoints).",
    auth: "apiKey (optional public usage; self-host capable)",
    https: true,
    cors: "Unknown",
    link: "https://ce.judge0.com/"
  },
  {
    name: "KONTESTS",
    description: "Aggregated data on upcoming & ongoing competitive programming contests (Codeforces, CodeChef, etc.).",
    auth: "No",
    https: true,
    cors: "No",
    link: "https://kontests.net/api"
  },
  {
    name: "Mintlify",
    description: "Documentation platform — REST API to programmatically interact with docs, trigger updates and embed experiences.",
    auth: "apiKey",
    https: true,
    cors: "Unknown",
    link: "https://docs.mintlify.com"
  },

  // Additional commonly-used code-execution / programming APIs
  {
    name: "Piston",
    description: "Lightweight, open-source execution engine API for running code in many languages (self-host or hosted endpoints).",
    auth: "No (public demo) / optional token for hosted instances",
    https: true,
    cors: "Unknown",
    link: "https://github.com/engineer-man/piston"
  }
]
,
"science": [
  { name: "arcsecond.io", description: "Multiple astronomy data sources", auth: "No", https: true, cors: "Unknown", link: "https://api.arcsecond.io/" },
  { name: "arXiv", description: "Research-sharing platform: physics, mathematics, quantitative finance, economics", auth: "No", https: true, cors: "Unknown", link: "https://export.arxiv.org/api/query" },
  { name: "CORE", description: "Access the world's Open Access research papers", auth: "apiKey", https: true, cors: "Unknown", link: "https://core.ac.uk/services#api" },
  { name: "GBIF", description: "Global Biodiversity Information Facility", auth: "No", https: true, cors: "Yes", link: "https://api.gbif.org/v1/" },
  { name: "iDigBio", description: "Museum specimens search API", auth: "No", https: true, cors: "Unknown", link: "https://api.idigbio.org/" },
  { name: "inspirehep.net", description: "High Energy Physics information system", auth: "No", https: true, cors: "Unknown", link: "https://inspirehep.net/api" },
  { name: "isEven", description: "Check if a number is even (simple math utility)", auth: "No", https: true, cors: "Unknown", link: "https://isevenapi.xyz/api/iseven/[number]" },
  { name: "ISRO Spacecraft Info", description: "Information about ISRO spacecrafts", auth: "No", https: true, cors: "No", link: "https://isro.vercel.app/api/spacecrafts" },
  { name: "ITIS", description: "Integrated Taxonomic Information System API", auth: "No", https: true, cors: "Unknown", link: "https://www.itis.gov/ITISWebService/jsonservice/ITISService.json" },
  { name: "Launch Library 2", description: "Spaceflight launches and events database", auth: "No", https: true, cors: "Yes", link: "https://llapi.thespacedevs.com/2.2.0" },
  { name: "MPDS", description: "Materials science experimental data platform", auth: "apiKey", https: true, cors: "No", link: "https://mpds.io" },
  { name: "Minor Planet Center (Asterank)", description: "Asteroid and minor planet data", auth: "No", https: false, cors: "Unknown", link: "http://www.asterank.com/api" },
  { name: "NASA", description: "NASA data — imagery, astronomy, Earth, etc.", auth: "No", https: true, cors: "No", link: "https://api.nasa.gov" },
  { name: "NASA ADS", description: "NASA Astrophysics Data System", auth: "OAuth", https: true, cors: "Yes", link: "https://ui.adsabs.harvard.edu/help/api/api-docs.html" },
  { name: "Newton", description: "Symbolic and arithmetic math calculator API", auth: "No", https: true, cors: "No", link: "https://newton.now.sh/api/v2" },
  { name: "NoctuaSky API", description: "NoctuaSky astronomical data API", auth: "No", https: true, cors: "Unknown", link: "https://api.noctuasky.com/api/v1/swaggerdoc/" },
  { name: "Numbers Tools", description: "Number-of-the-day, random numbers, number facts, math utilities", auth: "apiKey", https: true, cors: "No", link: "https://math.tools/api/numbers/" },
  { name: "NumbersAPI", description: "Facts about numbers (trivia)", auth: "No", https: false, cors: "No", link: "http://numbersapi.com" },
  { name: "Ocean Facts", description: "Oceanography facts and data", auth: "No", https: true, cors: "Unknown", link: "https://oceanfacts.herokuapp.com/" },
  { name: "Open Notify", description: "ISS location and astronaut data API", auth: "No", https: false, cors: "No", link: "http://open-notify.org/Open-Notify-API/" },
  { name: "OSF", description: "Open Science Framework — study designs, datasets, manuscripts", auth: "No", https: true, cors: "Unknown", link: "https://api.osf.io/v2" },
  { name: "PurpleAir", description: "Real-time air quality monitoring data", auth: "No", https: true, cors: "Unknown", link: "https://www.purpleair.com/json" },
  { name: "RemoteCalc", description: "Remote calc: parse base64 encoded math expressions and return JSON result", auth: "No", https: true, cors: "Yes", link: "https://remotecalc.example.com/api" },
  { name: "SHARE (OSF)", description: "Free, open dataset about research & scholarly activities", auth: "No", https: true, cors: "No", link: "https://share.osf.io/api/v2/" },
  { name: "SpaceX REST API", description: "SpaceX company, launches, vehicles, launchpads data (REST)", auth: "No", https: true, cors: "No", link: "https://api.spacexdata.com/v4" },
  { name: "SpaceX GraphQL API", description: "SpaceX data via GraphQL (ships, launches, company, etc.)", auth: "No", https: true, cors: "Unknown", link: "https://api.spacex.land/graphql/" },
  { name: "Sunrise-Sunset", description: "Sunrise and sunset times for given lat/lon", auth: "No", https: true, cors: "No", link: "https://api.sunrise-sunset.org/json" },
  { name: "Time Adder API", description: "Add times given in array — time manipulation utility", auth: "No", https: true, cors: "No", link: "https://time-adder.example.com/api" },
  { name: "TLE API", description: "Satellite information (TLE data)", auth: "No", https: true, cors: "No", link: "https://tle.ivanstanojevic.me/api" },
  { name: "USGS Earthquake API", description: "Earthquake hazard & real-time earthquake data", auth: "No", https: true, cors: "No", link: "https://earthquake.usgs.gov/fdsnws/event/1/query" },
  { name: "USGS Water Services", description: "Water quality & level info for rivers and lakes", auth: "No", https: true, cors: "No", link: "https://waterservices.usgs.gov/" },
  { name: "World Bank", description: "World Bank public data API", auth: "No", https: true, cors: "No", link: "https://api.worldbank.org/v2" },
  { name: "xMath", description: "Random mathematical expressions API", auth: "No", https: true, cors: "Yes", link: "https://x-math.herokuapp.com/api" },

  // — additional example science/math-related public APIs
  { name: "Open Meteo", description: "Free weather / climate & forecast API (open weather data)", auth: "No", https: true, cors: "Yes", link: "https://api.open-meteo.com/v1" },
  { name: "Open-Meteo (Historical)", description: "Historical weather/climate data via Open-Meteo", auth: "No", https: true, cors: "Yes", link: "https://archive-api.open-meteo.com/v1" }
]
,
"security": [
  { name: "Application Environment Verification (AEV)", description: "Android library and API to verify device safety, detect rooted devices and other risks", auth: "apiKey", https: true, cors: "Yes", link: "https://github.com/fingerprintjs/aev" },
  { name: "BinaryEdge", description: "Access to BinaryEdge scanning platform", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.binaryedge.io/api-v2.html" },
  { name: "BitWarden", description: "Open-source password manager API", auth: "OAuth", https: true, cors: "Unknown", link: "https://bitwarden.com/help/api/" },
  { name: "Botd", description: "Browser library API for bot detection (FingerprintJS Botd)", auth: "apiKey", https: true, cors: "Yes", link: "https://github.com/fingerprintjs/botd" },
  { name: "Bugcrowd", description: "Bugcrowd API for managing and tracking security issues", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.bugcrowd.com/api/getting-started/" },
  { name: "Censys", description: "Search engine for Internet-connected hosts & devices", auth: "apiKey", https: true, cors: "No", link: "https://search.censys.io/api" },
  { name: "Classify API", description: "Encrypting & decrypting text messages", auth: "No", https: true, cors: "Yes", link: "https://classify-web.herokuapp.com/#/api" },
  { name: "Complete Criminal Checks", description: "Provides data of offenders from US States & Puerto Rico", auth: "apiKey", https: true, cors: "Yes", link: "https://completecriminalchecks.com/Developers" },
  { name: "CRXcavator", description: "Chrome extension risk scoring API", auth: "apiKey", https: true, cors: "Unknown", link: "https://crxcavator.io/apidocs" },
  { name: "Dehash.lt", description: "Hash decryption (MD5/SHA1/SHA256/SHA512 etc.) API", auth: "No", https: true, cors: "Unknown", link: "https://github.com/Dehash-lt/api" },
  { name: "EmailRep", description: "Email address threat & risk prediction API", auth: "No", https: true, cors: "Unknown", link: "https://docs.emailrep.io/" },
  { name: "Escape API", description: "API for escaping different kinds of queries", auth: "No", https: true, cors: "No", link: "https://github.com/polarspetroll/EscapeAPI" },
  { name: "FilterLists", description: "Lists of filters for ad-blockers and firewalls", auth: "No", https: true, cors: "Unknown", link: "https://filterlists.com" },
  { name: "FingerprintJS Pro", description: "Fraud detection API offering accurate browser fingerprinting", auth: "apiKey", https: true, cors: "Yes", link: "https://dev.fingerprintjs.com/docs" },
  { name: "FraudLabs Pro", description: "Order screening / fraud detection API", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.fraudlabspro.com/developer/api/screen-order" },
  { name: "FullHunt", description: "Searchable attack surface database API (internet-wide)", auth: "apiKey", https: true, cors: "Unknown", link: "https://api-docs.fullhunt.io/#introduction" },
  { name: "GitGuardian", description: "Scan code/files for secrets (API keys, credentials)", auth: "apiKey", https: true, cors: "No", link: "https://api.gitguardian.com/doc" },
  { name: "GreyNoise", description: "Query IP threat intelligence dataset", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.greynoise.io/reference/get_v3-community-ip" },
  { name: "HackerOne", description: "Bug-bounty & security disclosure platform API", auth: "apiKey", https: true, cors: "Unknown", link: "https://api.hackerone.com/" },
  { name: "Hashable", description: "REST API for cryptographic functions & methods", auth: "No", https: true, cors: "Yes", link: "https://hashable.space/pages/api/" },
  { name: "HaveIBeenPwned", description: "Check if email/password appears in public data-breaches", auth: "apiKey", https: true, cors: "Unknown", link: "https://haveibeenpwned.com/API/v3" },
  { name: "Intelligence X", description: "OSINT & threat intelligence via Intelligence X API", auth: "apiKey", https: true, cors: "Unknown", link: "https://github.com/IntelligenceX/SDK/blob/master/Intelligence%20X%20API.pdf" },
  { name: "LoginRadius", description: "Managed user authentication service API", auth: "apiKey", https: true, cors: "Yes", link: "https://www.loginradius.com/docs/" },
  { name: "MSRC (Microsoft Security Response Center)", description: "Interfaces for Microsoft Security Response Center", auth: "No", https: true, cors: "Unknown", link: "https://msrc.microsoft.com/report/developer" },
  { name: "Mozilla HTTP Observatory", description: "HTTP security scanner (Mozilla http-scanner API)", auth: "No", https: true, cors: "Unknown", link: "https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md" },
  { name: "Mozilla TLS Observatory", description: "TLS security scanner (Mozilla TLS observatory API)", auth: "No", https: true, cors: "Unknown", link: "https://github.com/mozilla/tls-observatory#api-endpoints" },
  { name: "NVD (National Vulnerability Database)", description: "U.S. National Vulnerability Database JSON feeds", auth: "No", https: true, cors: "Unknown", link: "https://nvd.nist.gov/vuln/Data-Feeds/JSON-feed-changelog" },
  { name: "Passwordinator", description: "Generate random passwords of varying complexity", auth: "No", https: true, cors: "Yes", link: "https://github.com/fawazsullia/password-generator/" },
  { name: "PhishStats", description: "Phishing database API", auth: "No", https: true, cors: "Unknown", link: "https://phishstats.info/" },
  { name: "Privacy.com", description: "Generate merchant-specific / one-time credit card numbers", auth: "apiKey", https: true, cors: "Unknown", link: "https://privacy.com/developer/docs" },
  { name: "Pulsedive", description: "Real-time threat intelligence data API", auth: "apiKey", https: true, cors: "Unknown", link: "https://pulsedive.com/api/" },
  { name: "SecurityTrails", description: "Domain & IP data: WHOIS, DNS history etc.", auth: "apiKey", https: true, cors: "Unknown", link: "https://securitytrails.com/corp/apidocs" },
  { name: "Shodan", description: "Internet-connected devices & host search engine API", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.shodan.io/" },
  { name: "Spyse", description: "Attack surface management & Internet asset data API", auth: "apiKey", https: true, cors: "Unknown", link: "https://spyse-dev.readme.io/reference/quick-start" },
  { name: "Threat Jammer", description: "Risk scoring API from curated threat intelligence data", auth: "apiKey", https: true, cors: "Unknown", link: "https://threatjammer.com/docs/index" },
  { name: "UK Police", description: "UK Police data API", auth: "No", https: true, cors: "Unknown", link: "https://data.police.uk/docs/" },
  { name: "Virushee", description: "File/data scanning API", auth: "No", https: true, cors: "Yes", link: "https://api.virushee.com/" },
  { name: "VulDB", description: "Vulnerability database API (search & scanning)", auth: "apiKey", https: true, cors: "Unknown", link: "https://vuldb.com/?doc.api" }
]
,
// Add / replace this key inside your SAMPLE_APIS object
"shopping": [
  { name: "Best Buy", description: "Products, Buying Options, Categories, Recommendations, Stores and Commerce", auth: "apiKey", https: true, cors: "Unknown", link: "https://bestbuyapis.github.io/api-documentation/#overview" },
  { name: "Digi-Key", description: "Retrieve price and inventory of electronic components as well as place orders", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.digikey.com/en/resources/api-solutions" },
  { name: "Dummy Products", description: "Fetch dummy e-commerce products JSON data with placeholder images", auth: "apiKey", https: true, cors: "Yes", link: "https://dummyproducts-api.herokuapp.com/" },
  { name: "eBay", description: "Sell and Buy on eBay", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.ebay.com/" },
  { name: "Etsy", description: "Manage shop and interact with listings", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.etsy.com/developers/documentation/getting_started/api_basics" },
  { name: "Flipkart Marketplace", description: "Product listing management, Order Fulfilment in the Flipkart Marketplace", auth: "OAuth", https: true, cors: "Yes", link: "https://seller.flipkart.com/api-docs/FMSAPI.html" },
  { name: "Lazada", description: "Retrieve product ratings and seller performance metrics", auth: "apiKey", https: true, cors: "Unknown", link: "https://open.lazada.com/doc/doc.htm" },
  { name: "Mercadolibre", description: "Manage sales, ads, products, services and Shops", auth: "apiKey", https: true, cors: "Unknown", link: "https://developers.mercadolibre.cl/es_ar/api-docs-es" },
  { name: "Octopart", description: "Electronic part data for manufacturing, design, and sourcing", auth: "apiKey", https: true, cors: "Unknown", link: "https://octopart.com/api/v4/reference" },
  { name: "OLX Poland", description: "Integrate with local sites by posting, managing adverts and communicating with OLX users", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.olx.pl/api/doc#section/" },
  { name: "Rappi", description: "Manage orders from Rappi's app", auth: "OAuth", https: true, cors: "Unknown", link: "https://dev-portal.rappi.com/" },
  { name: "Shopee", description: "Official API for integration of various services from Shopee", auth: "apiKey", https: true, cors: "Unknown", link: "https://open.shopee.com/documents?version=1" },
  { name: "Tokopedia", description: "Official API for integration of various services from Tokopedia", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.tokopedia.com/openapi/guide/#/" },
  { name: "WooCommerce", description: "WooCommerce REST APIs to create, read, update, and delete data on WordPress websites in JSON format", auth: "apiKey", https: true, cors: "Yes", link: "https://woocommerce.github.io/woocommerce-rest-api-docs/" },

  // Additional/up-to-date e-commerce APIs
  { name: "Shopify", description: "Shopify Store API to manage products, orders, and customers", auth: "OAuth / API key", https: true, cors: "Unknown", link: "https://shopify.dev/docs/admin-api" },
  { name: "BigCommerce", description: "BigCommerce API for products, orders, and store management", auth: "OAuth / API key", https: true, cors: "Unknown", link: "https://developer.bigcommerce.com/api-reference" },
  { name: "Magento", description: "Magento REST APIs to manage catalog, orders, and customers", auth: "OAuth / Token", https: true, cors: "Unknown", link: "https://developer.adobe.com/commerce/webapi/rest/" }
]
,
"social": [
  { name: "4chan", description: "Simple image-based bulletin board dedicated to a variety of topics", auth: "No", https: true, cors: "Yes", link: "https://github.com/4chan/4chan-API" },
  { name: "Ayrshare", description: "Social media APIs to post, get analytics, and manage multiple users' social media accounts", auth: "apiKey", https: true, cors: "Yes", link: "https://www.ayrshare.com" },
  { name: "aztro", description: "Daily horoscope info for yesterday, today, and tomorrow", auth: "No", https: true, cors: "Unknown", link: "https://aztro.sameerkumar.website/" },
  { name: "Blogger", description: "View and update Blogger content via APIs", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.google.com/blogger/" },
  { name: "Cisco Spark", description: "Team Collaboration Software API", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.ciscospark.com" },
  { name: "Dangerous Discord Database", description: "Database of malicious Discord accounts", auth: "apiKey", https: true, cors: "Unknown", link: "https://discord.riverside.rocks/docs/index.php" },
  { name: "Discord", description: "Bots and integrations for Discord platform", auth: "OAuth", https: true, cors: "Unknown", link: "https://discord.com/developers/docs/intro" },
  { name: "Disqus", description: "Communicate with Disqus data", auth: "OAuth", https: true, cors: "Unknown", link: "https://disqus.com/api/docs/auth/" },
  { name: "Doge-Meme", description: "Top meme posts from r/dogecoin which include 'Meme' flair", auth: "No", https: true, cors: "Yes", link: "https://api.doge-meme.lol/docs" },
  { name: "Facebook", description: "Facebook Login, Share, Social Plugins, Analytics and more", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.facebook.com/" },
  { name: "Foursquare", description: "Foursquare users and places API (check-ins, photos, tips, events)", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.foursquare.com/" },
  { name: "FOAAS (Fuck Off as a Service)", description: "Generate humorous insults or messages", auth: "No", https: true, cors: "Unknown", link: "https://www.foaas.com" },
  { name: "Full Contact", description: "Get Social Media profiles and contact information", auth: "OAuth", https: true, cors: "Unknown", link: "https://docs.fullcontact.com/" },
  { name: "HackerNews", description: "Social news for CS and entrepreneurship", auth: "No", https: true, cors: "Unknown", link: "https://github.com/HackerNews/API" },
  { name: "Hashnode", description: "A blogging platform built for developers", auth: "No", https: true, cors: "Unknown", link: "https://hashnode.com" },
  { name: "Instagram", description: "Instagram Login, Share, Social Plugins and more", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.instagram.com/developer/" },
  { name: "Kakao", description: "Kakao Login, Share on KakaoTalk, Social Plugins and more", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.kakao.com/" },
  { name: "Lanyard", description: "Retrieve Discord presence via REST API or WebSocket", auth: "No", https: true, cors: "Yes", link: "https://github.com/Phineas/lanyard" },
  { name: "Line", description: "Line Login, Share, Social Plugins and more", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.line.biz/" },
  { name: "LinkedIn", description: "Foundation for digital integrations with LinkedIn", auth: "OAuth", https: true, cors: "Unknown", link: "https://docs.microsoft.com/en-us/linkedin/?context=linkedin/context" },
  { name: "Meetup.com", description: "Data about Meetups from Meetup.com", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.meetup.com/api/guide" },
  { name: "Microsoft Graph", description: "Access data in Microsoft 365 and Enterprise Mobility", auth: "OAuth", https: true, cors: "Unknown", link: "https://docs.microsoft.com/en-us/graph/api/overview" },
  { name: "NAVER", description: "NAVER Login, Share, Social Plugins and more", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.naver.com/main/" },
  { name: "Open Collective", description: "Get Open Collective data", auth: "No", https: true, cors: "Unknown", link: "https://docs.opencollective.com/help/developers/api" },
  { name: "Pinterest", description: "World's catalog of ideas", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.pinterest.com/" },
  { name: "Product Hunt", description: "The best new products in tech", auth: "OAuth", https: true, cors: "Unknown", link: "https://api.producthunt.com/v2/docs" },
  { name: "Reddit", description: "Homepage of the internet", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.reddit.com/dev/api" },
  { name: "Revolt", description: "Revolt open source Discord alternative", auth: "apiKey", https: true, cors: "Unknown", link: "https://developers.revolt.chat/api/" },
  { name: "Saidit", description: "Open source Reddit clone", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.saidit.net/dev/api" },
  { name: "Slack", description: "Team Instant Messaging API", auth: "OAuth", https: true, cors: "Unknown", link: "https://api.slack.com/" },
  { name: "TamTam", description: "Bot API to interact with TamTam", auth: "apiKey", https: true, cors: "Unknown", link: "https://dev.tamtam.chat/" },
  { name: "Telegram Bot", description: "Simplified HTTP API for Telegram bots", auth: "apiKey", https: true, cors: "Unknown", link: "https://core.telegram.org/bots/api" },
  { name: "Telegram MTProto", description: "Read/write Telegram data via MTProto", auth: "OAuth", https: true, cors: "Unknown", link: "https://core.telegram.org/api#getting-started" },
  { name: "Telegraph", description: "Create attractive blogs easily to share", auth: "apiKey", https: true, cors: "Unknown", link: "https://telegra.ph/api" },
  { name: "TikTok", description: "Fetches user info and user's video posts on TikTok platform", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.tiktok.com/doc/login-kit-web" },
  { name: "Trash Nothing", description: "Freecycling community with thousands of free items posted daily", auth: "OAuth", https: true, cors: "Yes", link: "https://trashnothing.com/developer" },
  { name: "Tumblr", description: "Read and write Tumblr Data", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.tumblr.com/docs/en/api/v2" },
  { name: "Twitch", description: "Game Streaming API", auth: "OAuth", https: true, cors: "Unknown", link: "https://dev.twitch.tv/docs" },
  { name: "Twitter", description: "Read and write Twitter data", auth: "OAuth", https: true, cors: "No", link: "https://developer.twitter.com/en/docs" },
  { name: "vk", description: "Read and write VK data", auth: "OAuth", https: true, cors: "Unknown", link: "https://vk.com/dev/sites" }
]
,
"sports": [
  { name: "API-FOOTBALL", description: "Get information about Football Leagues & Cups", auth: "apiKey", https: true, cors: "Yes", link: "https://www.api-football.com/documentation-v3" },
  { name: "ApiMedic", description: "Medical symptom checker API primarily for patients", auth: "apiKey", https: true, cors: "Unknown", link: "https://apimedic.com/" },
  { name: "balldontlie", description: "Access stats data from the NBA", auth: "No", https: true, cors: "Yes", link: "https://www.balldontlie.io" },
  { name: "Canadian Football League (CFL)", description: "Official JSON API providing real-time league, team and player statistics", auth: "apiKey", https: true, cors: "No", link: "http://api.cfl.ca/" },
  { name: "City Bikes", description: "City Bikes around the world", auth: "No", https: true, cors: "Unknown", link: "https://api.citybik.es/v2/" },
  { name: "Cloudbet", description: "Real-time sports odds and betting API", auth: "apiKey", https: true, cors: "Yes", link: "https://www.cloudbet.com/api/" },
  { name: "CollegeFootballData.com", description: "Detailed American college football statistics and results", auth: "apiKey", https: true, cors: "Unknown", link: "https://collegefootballdata.com" },
  { name: "Ergast F1", description: "F1 data from the beginning of the world championships in 1950", auth: "No", https: true, cors: "Unknown", link: "http://ergast.com/mrd/" },
  { name: "Fitbit", description: "Fitbit Information", auth: "OAuth", https: true, cors: "Unknown", link: "https://dev.fitbit.com/" },
  { name: "Football", description: "Open source football API to get squads’ stats, best scorers and more", auth: "X-Mashape-Key", https: true, cors: "Unknown", link: "https://rapidapi.com/GiulianoCrescimbeni/api/football98/" },
  { name: "Football (Soccer) Videos", description: "Embed codes for goals and highlights from major leagues", auth: "No", https: true, cors: "Yes", link: "https://www.scorebat.com/video-api/" },
  { name: "Football Standings", description: "Display football standings (EPL, La Liga, Serie A) based on ESPN data", auth: "No", https: true, cors: "Yes", link: "https://github.com/azharimm/football-standings-api" },
  { name: "Football-Data", description: "Football data including matches info, players, teams, and competitions", auth: "X-Mashape-Key", https: true, cors: "Unknown", link: "https://www.football-data.org" },
  { name: "JCDecaux Bike", description: "JCDecaux's self-service bicycles", auth: "apiKey", https: true, cors: "Unknown", link: "https://developer.jcdecaux.com/" },
  { name: "MLB Records and Stats", description: "Current and historical MLB statistics", auth: "No", https: false, cors: "Unknown", link: "https://appac.github.io/mlb-data-api-docs/" },
  { name: "NBA Data", description: "All NBA Stats, Games, Livescore, Standings, Statistics", auth: "apiKey", https: true, cors: "Unknown", link: "https://rapidapi.com/api-sports/api/api-nba/" },
  { name: "NBA Stats", description: "Current and historical NBA Statistics", auth: "No", https: true, cors: "Unknown", link: "https://any-api.com/nba_com/nba_com/docs/API_Description" },
  { name: "NHL Records and Stats", description: "NHL historical data and statistics", auth: "No", https: true, cors: "Unknown", link: "https://gitlab.com/dword4/nhlapi" },
  { name: "Oddsmagnet", description: "Odds history from multiple UK bookmakers", auth: "No", https: true, cors: "Yes", link: "https://data.oddsmagnet.com" },
  { name: "OpenLigaDB", description: "Crowd sourced sports league results", auth: "No", https: true, cors: "Yes", link: "https://www.openligadb.de" },
  { name: "Premier League Standings", description: "Current Premier League Standings and Statistics", auth: "apiKey", https: true, cors: "Unknown", link: "https://rapidapi.com/heisenbug/api/premier-league-live-scores/" },
  { name: "Sport Data", description: "Sports data from all over the world", auth: "apiKey", https: true, cors: "Unknown", link: "https://sportdataapi.com" },
  { name: "Sport List & Data", description: "List of and resources related to sports", auth: "No", https: true, cors: "Yes", link: "https://developers.decathlon.com/products/sports" },
  { name: "Sport Places", description: "Crowd-source sports places around the world", auth: "No", https: true, cors: "No", link: "https://developers.decathlon.com/products/sport-places" },
  { name: "Sport Vision", description: "Identify sport, brands and gear in an image and image sports captioning", auth: "apiKey", https: true, cors: "Yes", link: "https://developers.decathlon.com/products/sport-vision" },
  { name: "Sportmonks Cricket", description: "Live cricket score, player statistics and fantasy API", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.sportmonks.com/cricket/" },
  { name: "Sportmonks Football", description: "Football scores/schedule, news API, tv channels, stats, history, display standings", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.sportmonks.com/football/" },
  { name: "Squiggle", description: "Fixtures, results and predictions for Australian Football League matches", auth: "No", https: true, cors: "Yes", link: "https://api.squiggle.com.au" },
  { name: "Strava", description: "Connect with athletes, activities and more", auth: "OAuth", https: true, cors: "Unknown", link: "https://strava.github.io/api/" },
  { name: "SuredBits", description: "Query sports data, including teams, players, games, scores and statistics", auth: "No", https: false, cors: "No", link: "https://suredbits.com/api/" },
  { name: "TheSportsDB", description: "Crowd-sourced sports data and artwork", auth: "apiKey", https: true, cors: "Yes", link: "https://www.thesportsdb.com/api.php" },
  { name: "Tredict", description: "Get and set activities, health data and more", auth: "OAuth", https: true, cors: "Unknown", link: "https://www.tredict.com/blog/oauth_docs/" },
  { name: "Wger", description: "Workout manager data as exercises, muscles or equipment", auth: "apiKey", https: true, cors: "Unknown", link: "https://wger.de/en/software/api" },
    { name: "API‑SPORTS", description: "Comprehensive global sports data (soccer, basketball, MMA, AFL, etc.) — competitions, live scores, odds, historical data", auth: "apiKey", https: true, cors: "Yes", link: "https://api-sports.io/" },
  { name: "Sport Data API", description: "Global sports data: leagues, teams, fixtures, scores, players for many sports", auth: "apiKey", https: true, cors: "Unknown", link: "https://app.sportdataapi.com/api/v1/" }

]
,
"test-data": [
  { name: "Bacon Ipsum", description: "A Meatier Lorem Ipsum Generator", auth: "No", https: true, cors: "Unknown", link: "https://baconipsum.com/json-api/" },
  { name: "Dicebear Avatars", description: "Generate random pixel-art avatars", auth: "No", https: true, cors: "No", link: "https://avatars.dicebear.com/" },
  { name: "English Random Words", description: "Generate English Random Words with Pronunciation", auth: "No", https: true, cors: "No", link: "https://random-words-api.vercel.app/word" },
  { name: "FakeJSON", description: "Service to generate test and fake data", auth: "apiKey", https: true, cors: "Yes", link: "https://fakejson.com" },
  { name: "FakerAPI", description: "APIs collection to get fake data", auth: "No", https: true, cors: "Yes", link: "https://fakerapi.it/en" },
  { name: "FakeStoreAPI", description: "Fake store REST API for your e-commerce or shopping website prototype", auth: "No", https: true, cors: "Unknown", link: "https://fakestoreapi.com/" },
  { name: "GeneradorDNI", description: "Data generator API for profiles, vehicles, banks, and cards", auth: "apiKey", https: true, cors: "Unknown", link: "https://api.generadordni.es" },
  { name: "ItsThisForThat", description: "Generate Random startup ideas", auth: "No", https: true, cors: "No", link: "https://itsthisforthat.com/api.php" },
  { name: "JSONPlaceholder", description: "Fake data for testing and prototyping", auth: "No", https: false, cors: "Unknown", link: "http://jsonplaceholder.typicode.com/" },
  { name: "Loripsum", description: "The 'lorem ipsum' generator that doesn't suck", auth: "No", https: false, cors: "Unknown", link: "http://loripsum.net/" },
  { name: "Mailsac", description: "Disposable email API for testing", auth: "apiKey", https: true, cors: "Unknown", link: "https://mailsac.com/docs/api" },
  { name: "Metaphorsum", description: "Generate demo paragraphs giving number of words and sentences", auth: "No", https: false, cors: "Unknown", link: "http://metaphorpsum.com/" },
  { name: "Mockaroo", description: "Generate fake data in JSON, CSV, TXT, SQL, XML formats", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.mockaroo.com/docs" },
  { name: "QuickMocker", description: "API mocking tool to generate contextual, fake or random data", auth: "No", https: true, cors: "Yes", link: "https://quickmocker.com" },
  { name: "Random Data", description: "Random data generator", auth: "No", https: true, cors: "Unknown", link: "https://random-data-api.com" },
  { name: "Randommer", description: "Random data generator", auth: "apiKey", https: true, cors: "Yes", link: "https://randommer.io/randommer-api" },
  { name: "RandomUser", description: "Generates and lists user data", auth: "No", https: true, cors: "Unknown", link: "https://randomuser.me" },
  { name: "RoboHash", description: "Generate random robot/alien avatars", auth: "No", https: true, cors: "Unknown", link: "https://robohash.org/" },
  { name: "Spanish Random Names", description: "Generate Spanish names (with gender) randomly", auth: "No", https: true, cors: "Unknown", link: "https://random-names-api.herokuapp.com/public" },
  { name: "Spanish Random Words", description: "Generate Spanish words randomly", auth: "No", https: true, cors: "Unknown", link: "https://palabras-aleatorias-public-api.herokuapp.com" },
  { name: "This Person Does Not Exist", description: "Generates real-life faces of people who do not exist", auth: "No", https: true, cors: "Unknown", link: "https://thispersondoesnotexist.com" },
  { name: "Toolcarton", description: "Generate random testimonial data", auth: "No", https: true, cors: "Unknown", link: "https://testimonialapi.toolcarton.com/" },
  { name: "UUID Generator", description: "Generate UUIDs", auth: "No", https: true, cors: "No", link: "https://www.uuidtools.com/docs" },
  { name: "What The Commit", description: "Random commit message generator", auth: "No", https: false, cors: "Yes", link: "http://whatthecommit.com/index.txt" },
  { name: "Yes No", description: "Generate yes or no randomly", auth: "No", https: true, cors: "Unknown", link: "https://yesno.wtf/api" },

  // --- additional popular test/fake-data APIs added ---
  { name: "RandomFox", description: "Random fox images", auth: "No", https: true, cors: "Yes", link: "https://randomfox.ca/floof/" },
  { name: "RandomDog", description: "Random dog images", auth: "No", https: true, cors: "Yes", link: "https://dog.ceo/api/breeds/image/random" },
  { name: "API Ninjas - Random Data", description: "Various random/fake data endpoints", auth: "apiKey", https: true, cors: "Yes", link: "https://api.api-ninjas.com/v1/random" },
  { name: "RandomCat", description: "Random cat images", auth: "No", https: true, cors: "Yes", link: "https://aws.random.cat/meow" }
]
,
"text-analysis": [
  { name: "Code Detection API", description: "Detect, label, format and enrich the code in your app or in your data pipeline", auth: "OAuth", https: true, cors: "Unknown", link: "https://codedetectionapi.runtime.dev" },
  { name: "apilayer languagelayer", description: "Language Detection JSON API supporting 173 languages", auth: "OAuth", https: true, cors: "Unknown", link: "https://languagelayer.com/" },
  { name: "Aylien Text Analysis", description: "A collection of information retrieval and natural language APIs", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.aylien.com/textapi/#getting-started" },
  { name: "Cloudmersive Natural Language Processing", description: "Natural language processing and text analysis", auth: "apiKey", https: true, cors: "Yes", link: "https://www.cloudmersive.com/nlp-api" },
  { name: "Detect Language", description: "Detects text language", auth: "apiKey", https: true, cors: "Unknown", link: "https://detectlanguage.com/" },
  { name: "ELI", description: "Natural Language Processing Tools for Thai Language", auth: "apiKey", https: true, cors: "Unknown", link: "https://nlp.insightera.co.th/docs/v1.0" },
  { name: "Google Cloud Natural Language", description: "Natural language understanding technology, including sentiment, entity and syntax analysis", auth: "apiKey", https: true, cors: "Unknown", link: "https://cloud.google.com/natural-language/docs/" },
  { name: "Hirak OCR", description: "Image to text - text recognition from image in 100+ languages, accurate, unlimited requests", auth: "apiKey", https: true, cors: "Unknown", link: "https://ocr.hirak.site/" },
  { name: "Hirak Translation", description: "Translate between 21 of most used languages, accurate, unlimited requests", auth: "apiKey", https: true, cors: "Unknown", link: "https://translate.hirak.site/" },
  { name: "Lecto Translation", description: "Translation API with free tier and reasonable prices", auth: "apiKey", https: true, cors: "Yes", link: "https://rapidapi.com/lecto-lecto-default/api/lecto-translation/" },
  { name: "LibreTranslate", description: "Translation tool with 17 available languages", auth: "No", https: true, cors: "Unknown", link: "https://libretranslate.com/docs" },
  { name: "Semantria", description: "Text Analytics with sentiment analysis, categorization & named entity extraction", auth: "OAuth", https: true, cors: "Unknown", link: "https://semantria.readme.io/docs" },
  { name: "Sentiment Analysis", description: "Multilingual sentiment analysis of texts from different sources", auth: "apiKey", https: true, cors: "Yes", link: "https://www.meaningcloud.com/developer/sentiment-analysis" },
  { name: "Tisane", description: "Text Analytics with focus on detection of abusive content and law enforcement applications", auth: "OAuth", https: true, cors: "Yes", link: "https://tisane.ai/" },
  { name: "Watson Natural Language Understanding", description: "Natural language processing for advanced text analysis", auth: "OAuth", https: true, cors: "Unknown", link: "https://cloud.ibm.com/apidocs/natural-language-understanding/natural-language-understanding" },

  // Newly added / recent popular APIs
  { name: "Hugging Face Inference API", description: "Perform NLP tasks like text classification, summarization, and question answering", auth: "apiKey", https: true, cors: "Yes", link: "https://huggingface.co/docs/api-inference/index" },
  { name: "OpenAI GPT API", description: "Generate text, perform summarization, classification, and semantic search using GPT models", auth: "apiKey", https: true, cors: "Yes", link: "https://platform.openai.com/docs/api-reference" },
  { name: "MeaningCloud Topics API", description: "Extract and categorize topics from text", auth: "apiKey", https: true, cors: "Yes", link: "https://www.meaningcloud.com/developer/topics-extraction/doc/2.0" },
  { name: "DeepAI Text Analysis API", description: "Provides sentiment, keyword extraction, and summarization for text", auth: "apiKey", https: true, cors: "Yes", link: "https://deepai.org/machine-learning-model/text-analysis" }
]
,
"tracking": [
  { name: "Aftership", description: "API to update, manage and track shipment efficiently", auth: "apiKey", https: true, cors: "Yes", link: "https://developers.aftership.com/reference/quick-start" },
  { name: "Correios", description: "Integration to provide information and prepare shipments using Correio's services", auth: "apiKey", https: true, cors: "Unknown", link: "https://cws.correios.com.br/ajuda" },
  { name: "Pixela", description: "API for recording and tracking habits or effort, routines", auth: "X-Mashape-Key", https: true, cors: "Yes", link: "https://pixe.la" },
  { name: "PostalPinCode", description: "API for getting Pincode details in India", auth: "No", https: true, cors: "Unknown", link: "http://www.postalpincode.in/Api-Details" },
  { name: "Postmon", description: "Query Brazilian ZIP codes and orders easily, quickly and free", auth: "No", https: false, cors: "Unknown", link: "http://postmon.com.br" },
  { name: "PostNord", description: "Provides information about parcels in transport for Sweden and Denmark", auth: "apiKey", https: false, cors: "Unknown", link: "https://developer.postnord.com/api" },
  { name: "UPS", description: "Shipment and Address information", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.ups.com/upsdeveloperkit" },
  { name: "WeCanTrack", description: "Automatically place subids in affiliate links to attribute affiliate conversions to click data", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.wecantrack.com" },
  { name: "WhatPulse", description: "Small application that measures your keyboard/mouse usage", auth: "No", https: true, cors: "Unknown", link: "https://developer.whatpulse.org/#web-api" },

  // — latest / additional tracking APIs
  { name: "EasyPost", description: "Shipping API for creating labels, verifying addresses, tracking packages", auth: "apiKey", https: true, cors: "Yes", link: "https://www.easypost.com/docs/api" },
  { name: "Shippo", description: "Multi-carrier shipping API for label creation, tracking, and address verification", auth: "apiKey", https: true, cors: "Yes", link: "https://goshippo.com/docs/" },
  { name: "17track", description: "Global parcel tracking API supporting multiple carriers", auth: "apiKey", https: true, cors: "Yes", link: "https://developer.17track.net/docs" },
  { name: "AfterShip Track", description: "Advanced package tracking with status notifications", auth: "apiKey", https: true, cors: "Yes", link: "https://www.aftership.com/docs/api/4/overview" }
]
,
// Add / replace this in your SAMPLE_APIS object:
"transportation": [
  { name: "ADS-B Exchange", description: "Access real-time and historical data of airborne aircraft", auth: "No", https: true, cors: "Unknown", link: "https://www.adsbexchange.com/data/" },
  { name: "airportsapi", description: "Get name and website URL for airports by ICAO code", auth: "No", https: true, cors: "Unknown", link: "https://airport-web.appspot.com/api/docs/" },
  { name: "AIS Hub", description: "Real-time AIS tracking data for marine & inland vessels", auth: "apiKey", https: false, cors: "Unknown", link: "http://www.aishub.net/api" },
  { name: "Amadeus for Developers", description: "Travel search / flight & trip data (limited usage)", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.amadeus.com/self-service" },
  { name: "aviationstack (apilayer)", description: "Real-time flight status & global aviation data", auth: "OAuth", https: true, cors: "Unknown", link: "https://aviationstack.com/" },
  { name: "AviationAPI", description: "FAA aeronautical charts, airport info, weather, publications", auth: "No", https: true, cors: "No", link: "https://docs.aviationapi.com" },
  { name: "AZ511 (ADOT Traffic)", description: "Traffic data from ADOT (Arizona)", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.az511.com/developers/doc" },
  { name: "Bay Area Rapid Transit (BART)", description: "Stations and predicted arrivals (BART)", auth: "apiKey", https: false, cors: "Unknown", link: "http://api.bart.gov" },
  { name: "BC Ferries API", description: "Ferry sailing times and capacities for BC Ferries", auth: "No", https: true, cors: "Yes", link: "https://www.bcferriesapi.ca" },
  { name: "BIC‑Boxtech Container Data", description: "Container technical detail for global container fleet", auth: "OAuth", https: true, cors: "Unknown", link: "https://docs.bic-boxtech.org/" },
  { name: "BlaBlaCar", description: "Search car‑sharing trips", auth: "apiKey", https: true, cors: "Unknown", link: "https://dev.blablacar.com" },
  { name: "MBTA Transit (Boston)", description: "Stations and predicted arrivals for MBTA", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.mbta.com/developers/v3-api" },
  { name: "TransitLand / Community Transit", description: "Public transit aggregation API", auth: "No", https: true, cors: "Unknown", link: "https://www.transit.land/documentation/datastore/api-endpoints.html" },
  { name: "Compare Flight Prices API", description: "Compare flight prices across platforms (via RapidAPI)", auth: "apiKey", https: true, cors: "Unknown", link: "https://rapidapi.com/obryan-software-obryan-software-default/api/compare-flight-prices/" },
  { name: "CTS Strasbourg Real-time API", description: "Real-time transport data for CTS (Strasbourg)", auth: "apiKey", https: true, cors: "Yes", link: "https://api.cts-strasbourg.eu/" },
  { name: "Grab (Delivery / Ride)", description: "Track deliveries, ride fares, payments and loyalty (Grab)", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.grab.com/docs/" },
  { name: "GraphHopper Routing API", description: "A-to-B routing with turn-by-turn instructions", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.graphhopper.com/" },
  { name: "Navitia", description: "Open API for public transit journey planning, schedules, isochrones", auth: "apiKey", https: true, cors: "Unknown", link: "https://doc.navitia.io/" },
  { name: "Open Charge Map", description: "Global public registry of electric vehicle charging locations", auth: "apiKey", https: true, cors: "Yes", link: "https://openchargemap.org/site/develop/api" },
  { name: "OpenSky Network", description: "Free real‑time ADS‑B aviation data", auth: "No", https: true, cors: "Unknown", link: "https://opensky-network.org/apidoc/index.html" },
  { name: "SNCF / French Railway API", description: "Public API for French rail transport (SNCF)", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.digital.sncf.com/startup/api" },
  { name: "Tankerkoenig", description: "German realtime gas/diesel fuel prices", auth: "apiKey", https: true, cors: "Yes", link: "https://creativecommons.tankerkoenig.de/swagger/" },
  { name: "transport.rest", description: "Community-maintained public transport API (global)", auth: "No", https: true, cors: "Yes", link: "https://transport.rest" },
  { name: "Uber (Rides & Pricing)", description: "Ride requests and price estimations (Uber)", auth: "OAuth", https: true, cors: "Yes", link: "https://developer.uber.com/products" },

  // — additional / newer / complementary APIs:
  { name: "OpenStreetMap API", description: "Global open map data (read/write) from OpenStreetMap", auth: "OAuth (for write)", https: true, cors: "Unknown", link: "https://api.openstreetmap.org/" },
  { name: "Overpass API", description: "Read-only API for querying OpenStreetMap map data (custom queries)", auth: "No", https: true, cors: "Yes", link: "https://overpass-api.de/api/interpreter" }
]
,
"url-shorteners": [
  { name: "1pt", description: "A simple URL shortener", auth: "No", https: true, cors: "Yes", link: "https://github.com/1pt-co/api/blob/main/README.md" },
  { name: "Bitly", description: "URL shortener and link management", auth: "OAuth", https: true, cors: "Unknown", link: "http://dev.bitly.com/get_started.html" },
  { name: "CleanURI", description: "URL shortener service", auth: "No", https: true, cors: "Yes", link: "https://cleanuri.com/docs" },
  { name: "ClickMeter", description: "Monitor, compare and optimize your marketing links", auth: "apiKey", https: true, cors: "Unknown", link: "https://support.clickmeter.com/hc/en-us/categories/201474986" },
  { name: "Clico", description: "URL shortener service", auth: "apiKey", https: true, cors: "Unknown", link: "https://cli.com/swagger-ui/index.html?configUrl=/v3/api-docs/swagger-config" },
  { name: "Cutt.ly", description: "URL shortener service", auth: "apiKey", https: true, cors: "Unknown", link: "https://cutt.ly/api-documentation/cuttly-links-api" },
  { name: "Drivet URL Shortener", description: "Shorten a long URL easily and fast", auth: "No", https: true, cors: "Unknown", link: "https://wiki.drivet.xyz/en/url-shortener/add-links" },
  { name: "Free Url Shortener", description: "Free URL Shortener offers a powerful API to interact with other sites", auth: "No", https: true, cors: "Unknown", link: "https://ulvis.net/developer.html" },
  { name: "Git.io", description: "Git.io URL shortener", auth: "No", https: true, cors: "Unknown", link: "https://github.blog/2011-11-10-git-io-github-url-shortener/" },
  { name: "GoTiny", description: "A lightweight URL shortener, focused on ease-of-use for the developer and end-user", auth: "No", https: true, cors: "Yes", link: "https://github.com/robvanbakel/gotiny-api" },
  { name: "Kutt", description: "Free modern URL Shortener", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.kutt.it/" },
  { name: "Mgnet.me", description: "Torrent URL shorten API", auth: "No", https: true, cors: "No", link: "http://mgnet.me/api.html" },
  { name: "owo", description: "A simple link obfuscator/shortener", auth: "No", https: true, cors: "Unknown", link: "https://owo.vc/api" },
  { name: "Rebrandly", description: "Custom URL shortener for sharing branded links", auth: "apiKey", https: true, cors: "Unknown", link: "https://developers.rebrandly.com/v1/docs" },
  { name: "Short Link", description: "Short URLs support so many domains", auth: "No", https: true, cors: "Unknown", link: "https://github.com/FayasNoushad/Short-Link-API" },
  { name: "Shrtcode", description: "URL Shortener with multiple domains", auth: "No", https: true, cors: "Yes", link: "https://shrtco.de/docs" },
  { name: "Shrtlnk", description: "Simple and efficient short link creation", auth: "apiKey", https: true, cors: "Yes", link: "https://shrtlnk.dev/developer" },
  { name: "TinyURL", description: "Shorten long URLs", auth: "apiKey", https: true, cors: "No", link: "https://tinyurl.com/app/dev" },
  { name: "UrlBae", description: "Simple and efficient short link creation", auth: "apiKey", https: true, cors: "Yes", link: "https://urlbae.com/developers" },

  // New/Latest additions
  { name: "is.gd", description: "Simple URL shortener with basic API", auth: "No", https: true, cors: "Yes", link: "https://is.gd/developers.php" },
  { name: "v.gd", description: "Alternative to is.gd shortener API", auth: "No", https: true, cors: "Yes", link: "https://v.gd/developers.php" },
  { name: "Tiny.cc", description: "Tiny.cc URL shortening API", auth: "apiKey", https: true, cors: "Yes", link: "https://tiny.cc/api-docs" },
  { name: "Short.io", description: "Short.io API for branded and custom domains", auth: "apiKey", https: true, cors: "Yes", link: "https://developers.short.io/docs" }
]
,
"vehicle": [
  {
    name: "Brazilian Vehicles and Prices",
    description: "Vehicles information from Fundação Instituto de Pesquisas Econômicas - Fipe",
    auth: "No",
    https: true,
    cors: "No",
    link: "https://deividfortuna.github.io/fipe/"
  },
  {
    name: "Helipaddy sites",
    description: "Helicopter and passenger drone landing site directory, Helipaddy data and much more",
    auth: "apiKey",
    https: true,
    cors: "Unknown",
    link: "https://helipaddy.com/api/"
  },
  {
    name: "Kelley Blue Book",
    description: "Vehicle info, pricing, configuration, plus much more",
    auth: "apiKey",
    https: true,
    cors: "No",
    link: "http://developer.kbb.com/#!/data/1-Default"
  },
  {
    name: "Mercedes-Benz API",
    description: "Telematics data, remotely access vehicle functions, car configurator, locate service dealers",
    auth: "apiKey",
    https: true,
    cors: "No",
    link: "https://developer.mercedes-benz.com/apis"
  },
  {
    name: "NHTSA Vehicle API",
    description: "NHTSA Product Information Catalog and Vehicle Listing",
    auth: "No",
    https: true,
    cors: "Unknown",
    link: "https://vpic.nhtsa.dot.gov/api/"
  },
  {
    name: "Smartcar",
    description: "Lock and unlock vehicles and get data like odometer reading and location. Works on most new cars",
    auth: "OAuth",
    https: true,
    cors: "Yes",
    link: "https://smartcar.com/docs/"
  },

  // Additional / modern vehicle APIs
  {
    name: "Vehicle API (CarQuery)",
    description: "Access vehicle make, model, and trim information worldwide",
    auth: "No",
    https: true,
    cors: "Yes",
    link: "https://www.carqueryapi.com/"
  },
  {
    name: "EV Database",
    description: "Electric vehicle specs, ranges, and pricing data",
    auth: "No",
    https: true,
    cors: "Yes",
    link: "https://ev-database.org/api"
  },
  {
    name: "CarMD",
    description: "Vehicle diagnostics API to retrieve check engine light codes and repair information",
    auth: "apiKey",
    https: true,
    cors: "Unknown",
    link: "https://www.carmd.com/developers/"
  },
  {
    name: "VIN Decoder API",
    description: "Decode Vehicle Identification Numbers (VIN) to get detailed vehicle info",
    auth: "No",
    https: true,
    cors: "Yes",
    link: "https://vpic.nhtsa.dot.gov/api/"
  }
]
,
"video": [
  { name: "An API of Ice And Fire", description: "Game Of Thrones API", auth: "No", https: true, cors: "Unknown", link: "https://anapioficeandfire.com/" },
  { name: "Bob's Burgers", description: "Bob's Burgers API", auth: "No", https: true, cors: "Yes", link: "https://bobs-burgers-api-ui.herokuapp.com" },
  { name: "Breaking Bad", description: "Breaking Bad API", auth: "No", https: true, cors: "Unknown", link: "https://breakingbadapi.com/documentation" },
  { name: "Breaking Bad Quotes", description: "Some Breaking Bad quotes", auth: "No", https: true, cors: "Unknown", link: "https://github.com/shevabam/breaking-bad-quotes" },
  { name: "Catalogopolis", description: "Doctor Who API", auth: "No", https: true, cors: "Unknown", link: "https://api.catalogopolis.xyz/docs/" },
  { name: "Catch The Show", description: "REST API for next-episode.net", auth: "No", https: true, cors: "Unknown", link: "https://catchtheshow.herokuapp.com/api/documentation" },
  { name: "Czech Television", description: "TV programme of Czech TV", auth: "No", https: false, cors: "Unknown", link: "http://www.ceskatelevize.cz/xml/tv-program/" },
  { name: "Dailymotion", description: "Dailymotion Developer API", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.dailymotion.com/" },
  { name: "Dune", description: "Book, character, movie & quotes JSON data", auth: "No", https: true, cors: "Yes", link: "https://github.com/ywalia01/dune-api" },
  { name: "Final Space", description: "Final Space API", auth: "No", https: true, cors: "Yes", link: "https://finalspaceapi.com/docs/" },
  { name: "Game of Thrones Quotes", description: "Some Game of Thrones quotes", auth: "No", https: true, cors: "Unknown", link: "https://gameofthronesquotes.xyz/" },
  { name: "Harry Potter Characters", description: "Harry Potter Characters Data with imagery", auth: "No", https: true, cors: "Unknown", link: "https://hp-api.herokuapp.com/" },
  { name: "IMDb-API", description: "API for receiving movie, serial and cast information", auth: "apiKey", https: true, cors: "Unknown", link: "https://imdb-api.com/" },
  { name: "IMDbOT", description: "Unofficial IMDb Movie / Series Information", auth: "No", https: true, cors: "Yes", link: "https://github.com/SpEcHiDe/IMDbOT" },
  { name: "JSON2Video", description: "Create/edit videos programmatically: watermarks, resizing, slideshows, voice-over, text animations", auth: "apiKey", https: true, cors: "No", link: "https://json2video.com" },
  { name: "Lucifer Quotes", description: "Returns Lucifer quotes", auth: "No", https: true, cors: "Unknown", link: "https://github.com/shadowoff09/lucifer-quotes" },
  { name: "MCU Countdown", description: "Countdown to next MCU Film", auth: "No", https: true, cors: "Yes", link: "https://github.com/DiljotSG/MCU-Countdown" },
  { name: "Motivational Quotes", description: "Random Motivational Quotes", auth: "No", https: true, cors: "Unknown", link: "https://nodejs-quoteapp.herokuapp.com/" },
  { name: "Movie Quote", description: "Random Movie and Series Quotes", auth: "No", https: true, cors: "Yes", link: "https://github.com/F4R4N/movie-quote/" },
  { name: "Open Movie Database", description: "Movie information", auth: "apiKey", https: true, cors: "Unknown", link: "http://www.omdbapi.com/" },
  { name: "Owen Wilson Wow", description: "API for actor Owen Wilson's 'wow' exclamations in movies", auth: "No", https: true, cors: "Yes", link: "https://owen-wilson-wow-api.herokuapp.com" },
  { name: "Ron Swanson Quotes", description: "Television quotes", auth: "No", https: true, cors: "Unknown", link: "https://github.com/jamesseanwright/ron-swanson-quotes#ron-swanson-quotes-api" },
  { name: "Simkl", description: "Movie, TV and Anime data", auth: "apiKey", https: true, cors: "Unknown", link: "https://simkl.docs.apiary.io" },
  { name: "STAPI", description: "Information on all things Star Trek", auth: "No", https: false, cors: "No", link: "http://stapi.co" },
  { name: "Stranger Things Quotes", description: "Returns Stranger Things quotes", auth: "No", https: true, cors: "Unknown", link: "https://github.com/shadowoff09/strangerthings-quotes" },
  { name: "Stream", description: "Czech internet television, films, series and online videos for free", auth: "No", https: true, cors: "No", link: "https://api.stream.cz/graphiql" },
  { name: "Stromberg Quotes", description: "Returns Stromberg quotes and more", auth: "No", https: true, cors: "Unknown", link: "https://www.stromberg-api.de/" },
  { name: "SWAPI", description: "All the Star Wars data you've ever wanted", auth: "No", https: true, cors: "Yes", link: "https://swapi.dev/" },
  { name: "SWAPI (Tech)", description: "All things Star Wars", auth: "No", https: true, cors: "Yes", link: "https://swapi.tech" },
  { name: "SWAPI GraphQL", description: "Star Wars GraphQL API", auth: "No", https: true, cors: "Unknown", link: "https://graphql.org/swapi-graphql" },
  { name: "The Lord of the Rings", description: "The Lord of the Rings API", auth: "apiKey", https: true, cors: "Unknown", link: "https://the-one-api.dev/" },
  { name: "The Vampire Diaries", description: "TV Show Data", auth: "apiKey", https: true, cors: "Yes", link: "https://vampire-diaries-api.netlify.app/" },
  { name: "ThronesApi", description: "Game Of Thrones Characters Data with imagery", auth: "No", https: true, cors: "Unknown", link: "https://thronesapi.com/" },
  { name: "TMDb", description: "Community-based movie data", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.themoviedb.org/documentation/api" },
  { name: "TrailerAddict", description: "Easily embed trailers from TrailerAddict", auth: "apiKey", https: false, cors: "Unknown", link: "https://www.traileraddict.com/trailerapi" },
  { name: "Trakt", description: "Movie and TV Data", auth: "apiKey", https: true, cors: "Yes", link: "https://trakt.docs.apiary.io/" },
  { name: "TVDB", description: "Television data", auth: "apiKey", https: true, cors: "Unknown", link: "https://thetvdb.com/api-information" },
  { name: "TVMaze", description: "TV Show Data", auth: "No", https: false, cors: "Unknown", link: "http://www.tvmaze.com/api" },
  { name: "uNoGS", description: "Unofficial Netflix Online Global Search", auth: "apiKey", https: true, cors: "Yes", link: "https://rapidapi.com/unogs/api/unogsng" },
  { name: "Vimeo", description: "Vimeo Developer API", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.vimeo.com/" },
  { name: "Watchmode", description: "API for streaming availability of movies & shows", auth: "apiKey", https: true, cors: "Unknown", link: "https://api.watchmode.com/" },
  { name: "Web Series Quotes Generator", description: "API generates various Web Series Quote Images", auth: "No", https: true, cors: "Yes", link: "https://github.com/yogeshwaran01/web-series-quotes" },
  { name: "YouTube", description: "Add YouTube functionality to your sites and apps", auth: "OAuth", https: true, cors: "Unknown", link: "https://developers.google.com/youtube/" }
]
,
"weather": [
  { name: "7Timer!", description: "Weather, especially for Astroweather", auth: "No", https: false, cors: "Unknown", link: "http://www.7timer.info/doc.php?lang=en" },
  { name: "AccuWeather", description: "Weather and forecast data", auth: "apiKey", https: false, cors: "Unknown", link: "https://developer.accuweather.com/apis" },
  { name: "Aemet", description: "Weather and forecast data from Spain", auth: "apiKey", https: true, cors: "Unknown", link: "https://opendata.aemet.es/centrodedescargas/inicio" },
  { name: "apilayer weatherstack", description: "Real-Time & Historical World Weather Data API", auth: "apiKey", https: true, cors: "Unknown", link: "https://weatherstack.com/" },
  { name: "APIXU", description: "Weather API", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.apixu.com/doc/request.aspx" },
  { name: "AQICN", description: "Air Quality Index Data for over 1000 cities", auth: "apiKey", https: true, cors: "Unknown", link: "https://aqicn.org/api/" },
  { name: "AviationWeather", description: "NOAA aviation weather forecasts and observations", auth: "No", https: true, cors: "Unknown", link: "https://www.aviationweather.gov/dataserver" },
  { name: "ColorfulClouds", description: "Weather API by Caiyun Open Platform", auth: "apiKey", https: true, cors: "Yes", link: "https://open.caiyunapp.com/ColorfulClouds_Weather_API" },
  { name: "Euskalmet", description: "Meteorological data of the Basque Country", auth: "apiKey", https: true, cors: "Unknown", link: "https://opendata.euskadi.eus/api-euskalmet/-/api-de-euskalmet/" },
  { name: "Foreca", description: "Weather forecasts", auth: "OAuth", https: true, cors: "Unknown", link: "https://developer.foreca.com" },
  { name: "HG Weather", description: "Weather forecast data for cities in Brazil", auth: "apiKey", https: true, cors: "Yes", link: "https://hgbrasil.com/status/weather" },
  { name: "Hong Kong Observatory", description: "Weather, earthquake, and climate data", auth: "No", https: true, cors: "Unknown", link: "https://www.hko.gov.hk/en/abouthko/opendata_intro.htm" },
  { name: "MetaWeather", description: "Weather API", auth: "No", https: true, cors: "No", link: "https://www.metaweather.com/api/" },
  { name: "Meteorologisk Institutt", description: "Weather and climate data", auth: "User-Agent", https: true, cors: "Unknown", link: "https://api.met.no/weatherapi/documentation" },
  { name: "Micro Weather", description: "Real time weather forecasts and historic data", auth: "apiKey", https: true, cors: "Unknown", link: "https://m3o.com/weather/api" },
  { name: "ODWeather", description: "Weather and weather webcams", auth: "No", https: false, cors: "Unknown", link: "http://api.oceandrivers.com/static/docs.html" },
  { name: "Oikolab", description: "70+ years of global, hourly historical and forecast weather data from NOAA and ECMWF", auth: "apiKey", https: true, cors: "Yes", link: "https://docs.oikolab.com" },
  { name: "Open-Meteo", description: "Global weather forecast API for non-commercial use", auth: "No", https: true, cors: "Yes", link: "https://open-meteo.com/" },
  { name: "openSenseMap", description: "Data from personal weather stations called senseBoxes", auth: "No", https: true, cors: "Yes", link: "https://api.opensensemap.org/" },
  { name: "OpenUV", description: "Real-time UV Index Forecast", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.openuv.io" },
  { name: "OpenWeatherMap", description: "Weather", auth: "apiKey", https: true, cors: "Unknown", link: "https://openweathermap.org/api" },
  { name: "QWeather", description: "Location-based weather data", auth: "apiKey", https: true, cors: "Yes", link: "https://dev.qweather.com/en/" },
  { name: "RainViewer", description: "Radar data collected from different websites", auth: "No", https: true, cors: "Unknown", link: "https://www.rainviewer.com/api.html" },
  { name: "Storm Glass", description: "Global marine weather from multiple sources", auth: "apiKey", https: true, cors: "Yes", link: "https://stormglass.io/" },
  { name: "Tomorrow", description: "Weather API powered by proprietary technology", auth: "apiKey", https: true, cors: "Unknown", link: "https://docs.tomorrow.io" },
  { name: "US Weather", description: "US National Weather Service", auth: "No", https: true, cors: "Yes", link: "https://www.weather.gov/documentation/services-web-api" },
  { name: "Visual Crossing", description: "Global historical and weather forecast data", auth: "apiKey", https: true, cors: "Yes", link: "https://www.visualcrossing.com/weather-api" },
  { name: "weather-api", description: "RESTful free API to check the weather", auth: "No", https: true, cors: "No", link: "https://github.com/robertoduessmann/weather-api" },
  { name: "WeatherAPI", description: "Weather API with astronomy and geolocation data", auth: "apiKey", https: true, cors: "Yes", link: "https://www.weatherapi.com/" },
  { name: "Weatherbit", description: "Weather API", auth: "apiKey", https: true, cors: "Unknown", link: "https://www.weatherbit.io/api" },
  { name: "Yandex.Weather", description: "Assess weather condition in specific locations", auth: "apiKey", https: true, cors: "No", link: "https://yandex.com/dev/weather/" },

  // Latest / additional weather APIs
  { name: "Weatherstack Free", description: "Updated free weather API", auth: "apiKey", https: true, cors: "Yes", link: "https://weatherstack.com/documentation" },
  { name: "ClimaCell / Tomorrow.io", description: "Global hyper-local weather forecasts", auth: "apiKey", https: true, cors: "Yes", link: "https://www.tomorrow.io/weather-api/" },
  { name: "OpenWeather OneCall", description: "Advanced weather and forecast data from OpenWeather", auth: "apiKey", https: true, cors: "Yes", link: "https://openweathermap.org/api/one-call-api" }
]
,
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
    slate: `${base} bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30`,
  };

  // ------ AUTH BADGES ------
  if (kind === "auth") {
    if (!value || value.toLowerCase() === "no") return glass.amber;
    if (value.toLowerCase().includes("api") || value.toLowerCase().includes("key"))
      return glass.indigo;
    if (value.toLowerCase().includes("oauth") || value.toLowerCase().includes("token"))
      return glass.emerald;
    return glass.slate;
  }

  // ------ HTTPS BADGES ------
  if (kind === "https") {
    return value ? glass.emerald : glass.rose;
  }

  // ------ CORS BADGES ------
  if (kind === "cors") {
    const v = value?.toLowerCase();
    if (!value) return glass.slate;
    if (v === "yes") return glass.emerald;
    if (v === "no") return glass.rose;
    return glass.amber;
  }

  return glass.slate;
}


/* ---------- Component ---------- */
export default function PublicApisPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState("animals");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(true); // default to showing raw JSON in dialog
  const copyTimeoutRef = useRef(null);
  const [itemsPerRow, setItemsPerRow] = useState(2); // mobile friendly default
  const [compactMode, setCompactMode] = useState(false); // toggle compact card density

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // derive current category list
  const apisByCategory = useMemo(() => {
    const out = {};
    CATEGORIES.forEach((c) => {
      const key = c.id;
      out[key] = SAMPLE_APIS[key] ?? SAMPLE_APIS.default ?? [];
    });
    return out;
  }, []);

  // combined list to filter/search
  const allApisForSelected = useMemo(() => {
    const list = apisByCategory[selectedCategory] || [];
    if (!query || query.trim() === "") return list;
    const q = query.toLowerCase();
    return list.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q)
    );
  }, [apisByCategory, selectedCategory, query]);

  function openApiDetails(api) {
    setSelectedApi(api);
    setDialogOpen(true);
    setCopied(false);
  }

  function copyApiJson(api) {
    if (!api) return showToast("info", "No API selected to copy");
    const payload = prettyJSON(api);
    navigator.clipboard.writeText(payload).then(
      () => {
        setCopied(true);
        showToast("success", "API JSON copied");
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      },
      () => showToast("error", "Copy failed")
    );
  }

  function downloadApiJson(api) {
    if (!api) return showToast("info", "No API selected to download");
    const blob = new Blob([prettyJSON(api)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeName = (api.name || "api").replace(/\s+/g, "_").toLowerCase();
    a.download = `api_${safeName}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Download started");
  }

  function refreshCategory() {
    const list = apisByCategory[selectedCategory] || [];
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    SAMPLE_APIS[selectedCategory] = shuffled;
    showToast("success", "Category refreshed");
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
            <Database className="opacity-90" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Public APIs — Explorer</h1>
              <div className="text-xs opacity-70 hidden sm:block">Browse public APIs by category. Click a card for details — copy or download JSON.</div>
            </div>
          </div>
        </div>

        {/* Search and controls (mobile compact) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form
            onSubmit={(e) => e.preventDefault()}
            className={clsx("flex items-center gap-2 w-full sm:w-[560px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}
            role="search"
            aria-label="Search APIs"
          >
            <Search className="opacity-60" />
            <Input
              placeholder="Search APIs by name or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              aria-label="Search APIs"
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
                        const count = (apisByCategory[cat.id] || []).length;
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
                              <div className="text-xs opacity-60">{count} APIs</div>
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
      {CATEGORIES.slice(0, 16).map((cat) => {
        const IconComp = cat.Icon;
        const count = (apisByCategory[cat.id] || []).length;
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
                <Database className="opacity-80" />
                <div>
                  <div className="text-sm font-semibold">Categories</div>
                  <div className="text-xs opacity-60">Browse by topic</div>
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
                  const count = (apisByCategory[cat.id] || []).length;
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
                        <div className="text-xs opacity-60">{count} APIs</div>
                      </div>

                      <Badge variant="outline" className="cursor-default">{count}</Badge>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { setSelectedCategory("animals"); showToast("success", "Switched to Animals"); }}>Popular: Animals</Button>
              <Button variant="ghost" className="w-full cursor-pointer" onClick={() => { setQuery(""); setSelectedCategory("animals"); showToast("info", "Reset filters"); }}>Reset</Button>
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
                    const IconComp = cat?.Icon ?? Database;
                    return <><IconComp className="opacity-80" /> <span>{CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? "Category"}</span></>;
                  })()}
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-2 mt-1">
                  <Star className="opacity-60" />
                  <span>{allApisForSelected.length} APIs</span>
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
              {allApisForSelected.length === 0 ? (
                <div className="py-12 text-center text-sm opacity-60">No APIs found in this category.</div>
              ) : (
                <div className={clsx("grid  gap-4 grid-cols-1 sm:grid-cols-2")}>
                  {allApisForSelected.map((api, idx) => (
                    <motion.div
                      key={`${api.name}_${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
                      className="rounded-2xl overflow-hidden border hover:shadow-lg transition cursor-pointer bg-transparent"
                      onClick={() => openApiDetails(api)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") openApiDetails(api); }}
                    >
                      <div className="p-4 flex flex-col h-full">
                        <div className="flex items-start flex-col justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Database className="opacity-70" />
                              <div className="text-sm font-semibold truncate">{api.name}</div>
                            </div>
                            <div className="text-xs opacity-60 mt-2 line-clamp-3">{api.description}</div>
                          </div>

                          <div className="ml-3 flex flex-row items-start justify-between gap-2">
                            <span className={clsx("px-2 py-1 text-xs rounded-md border", badgeColorClass("auth", api.auth))}>Auth:{api.auth ?? "No auth"}</span>
                            <span className={clsx("px-2 py-1 text-xs rounded-md border", badgeColorClass("https", api.https))}>{api.https ? "HTTPS" : "HTTP"}</span>
                            <span className={clsx("px-2 py-1 text-xs rounded-md border", badgeColorClass("cors", api.cors))}>CORS:{api.cors ?? "Unknown"}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openApiDetails(api); }} className="cursor-pointer"><List /> Details</Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); window.open(api.link, "_blank"); }} className="cursor-pointer"><ExternalLink /> Open</Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(api.link); showToast("success", "Endpoint copied"); }} className="cursor-pointer"><Copy /></Button>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadApiJson(api); }} className="cursor-pointer"><Download /></Button>
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
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { setSelectedCategory("animals"); showToast("success", "Switched to Animals"); }}>Popular: Animals</Button>
              <Button variant="outline" className="w-full cursor-pointer" onClick={() => { setQuery(""); setSelectedCategory("animals"); showToast("info", "Reset filters"); }}>Reset filters</Button>
              <Button variant="ghost" className="w-full cursor-pointer" onClick={() => setDialogOpen(true)}><List /> Open last details</Button>
            </div>

            <Separator className="my-3" />

            <div>
              <div className="text-sm font-semibold">Developer</div>
              <div className="text-xs opacity-60 mt-1">This is a static demo page — in production fetch a curated API index and dynamic icons/counts.</div>
              <div className="mt-2 text-xs break-words">Example fetch: <code className="text-xs">/api/public-apis?category=animals</code></div>
            </div>
          </div>
        </aside>
      </main>

      {/* API Detail Dialog */}
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
          <Database className="w-5 h-5 opacity-80" />
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-lg">
            {selectedApi?.name || "API Details"}
          </span>
          <span className="text-xs opacity-60 flex items-center gap-1">
            <Star className="w-3 h-3 opacity-60" />
            {selectedApi?.description || "Select an API to view metadata"}
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
      {selectedApi ? (
        <>
          {/* Top Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="space-y-2">
              <p className="text-sm opacity-70">{selectedApi.description}</p>

              {/* BADGES */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={clsx(
                    "px-2.5 py-1 rounded-md border text-xs font-medium backdrop-blur-md",
                    "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                  )}
                >
                  Auth: {selectedApi.auth ?? "No"}
                </span>

                <span
                  className={clsx(
                    "px-2.5 py-1 rounded-md border text-xs font-medium backdrop-blur-md",
                    selectedApi.https
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  )}
                >
                  HTTPS: {selectedApi.https ? "Yes" : "No"}
                </span>

                <span
                  className={clsx(
                    "px-2.5 py-1 rounded-md border text-xs font-medium backdrop-blur-md",
                    "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  )}
                >
                  CORS: {selectedApi.cors ?? "Unknown"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
             

              <Button
                variant="outline"
                className="flex cursor-pointer items-center gap-2"
                onClick={() => selectedApi?.link && window.open(selectedApi.link, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                Open
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
                { label: "Name", value: selectedApi.name },
                { label: "Auth", value: selectedApi.auth ?? "No" },
                { label: "HTTPS", value: selectedApi.https ? "Yes" : "No" },
                { label: "CORS", value: selectedApi.cors ?? "Unknown" }
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

              {/* Endpoint full width */}
              <div
                className={clsx(
                  "p-3 rounded-xl border sm:col-span-2 backdrop-blur-md",
                  isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white/50 border-zinc-200"
                )}
              >
                <div className="text-xs opacity-60">Endpoint</div>
                <div className="text-sm break-words">{selectedApi.link}</div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />
        </>
      ) : (
        <div className="py-10 text-center text-sm opacity-50">
          No API selected.
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
      <span className="text-xs opacity-60">Public APIs — Card view</span>

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
