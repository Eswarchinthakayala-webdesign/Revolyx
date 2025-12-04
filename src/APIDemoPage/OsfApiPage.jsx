// src/pages/OsfInstitutionsPageWithRelations.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Search,
  University,
  ExternalLink,
  Copy,
  Download,
  Info,
  List,
  RefreshCw,
  Check,
  ImageIcon,
  Users2,
  BookOpen,
  FolderGit2,
  Link as LinkIcon,
  Globe,
  FileText,
  Calendar,
  Tag,
  Menu,
  X,
  ArrowRight,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const API_BASE = "/osf/v2"; // use Vite proxy: /osf -> https://api.osf.io

/* -------------------------
   Utility helpers
   ------------------------- */
function prettyJSON(o) {
  try { return JSON.stringify(o, null, 2); } catch { return String(o); }
}

function toProxy(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.host.includes("api.osf.io")) {
      return url.replace(/^https?:\/\/api\.osf\.io/, "/osf");
    }
  } catch {}
  return url;
}

function glassy(variant) {
  return clsx(
    "px-2 py-1 rounded-md text-xs font-medium border shadow-sm",
    variant === "blue" && "backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-30",
    variant === "neutral" && "backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
  );
}

/* Normalizers: institutions / nodes / registrations / users (for list rendering) */

function normalizeInstitutions(list) {
  if (!Array.isArray(list)) return [];
  return list.map(item => {
    const a = item?.attributes || {};
    return {
      id: item.id,
      name: a.name,
      description: a.description,
      iri: a.iri,
      ror: a.ror_iri,
      iris: a.iris || [],
      logo: a.assets?.logo || null,
      banner: a.assets?.banner || null,
      requestAccess: !!a.institutional_request_access_enabled,
      relationships: item.relationships || {},
      api_url: item?.links?.self,
      html_url: item?.links?.html,
      raw: item
    };
  }).sort((a,b)=> (a.name || "").localeCompare(b.name || ""));
}

function normalizeNodes(list) {
  if (!Array.isArray(list)) return [];
  return list.map(item => {
    const a = item?.attributes || {};
    const rel = item?.relationships || {};

    // relationship summary: expose which relationships exist + hrefs
    const relationships = Object.keys(rel || {}).reduce((acc, k) => {
      acc[k] = {
        related: !!rel[k]?.links?.related?.href,
        self: !!rel[k]?.links?.self?.href,
        href: rel[k]?.links?.related?.href || rel[k]?.links?.self?.href || null
      };
      return acc;
    }, {});

    // subjects (if any)
    const subjects = Array.isArray(a?.subjects) ? a.subjects.map(s => (typeof s === "string" ? s : s.name || s.text || s.title)).filter(Boolean) : [];

    // tags (ensure simple array)
    const tags = Array.isArray(a?.tags) ? a.tags.map(t => (typeof t === "string" ? t : t.name || t.text)).filter(Boolean) : [];

    // region id if present in relationships data
    const region = rel?.region?.data?.id || null;

    return {
      id: item.id,
      title: a.title || a.name || "Untitled",
      description: a.description || a?.abstract || "",
      type: item.type || a.type || "node",
      category: a.category || a.node_category || a.project_category || null,
      custom_citation: a.custom_citation || null,
      date_created: a.date_created || null,
      date_modified: a.date_modified || null,
      registration: !!a.registration,
      preprint: !!a.preprint,
      fork: !!a.fork,
      collection: !!a.collection,
      public: !!a.is_public || !!a.public,
      wiki_enabled: !!a.wiki_enabled,
      access_requests_enabled: !!a.access_requests_enabled,
      node_license: a.node_license || null,
      analytics_key: a.analytics_key || null,
      current_user_permissions: Array.isArray(a.current_user_permissions) ? a.current_user_permissions : [],
      subjects,
      tags,
      relationships,
      region,
      api_url: item?.links?.self || null,
      html_url: item?.links?.html || null,
      iri: item?.links?.iri || null,
      raw: item
    };
  });
}


function normalizeRegistrations(list) {
  if (!Array.isArray(list)) return [];
  return list.map(item => {
    const a = item?.attributes || {};
    const rel = item?.relationships || {};

    // simple relationships summary
    const relationships = Object.keys(rel || {}).reduce((acc, k) => {
      acc[k] = {
        related: !!rel[k]?.links?.related?.href,
        self: !!rel[k]?.links?.self?.href,
        href: rel[k]?.links?.related?.href || rel[k]?.links?.self?.href || null,
        data: rel[k]?.data || null
      };
      return acc;
    }, {});

    const subjects = Array.isArray(a?.subjects) ? a.subjects.map(s => (typeof s === "string" ? s : s?.text || s?.name || s?.title)).filter(Boolean) : [];
    const license = a?.node_license || null;

    return {
      id: item.id,
      title: a.title || a.name || "Untitled registration",
      description: a.description || a?.abstract || "",
      type: item.type || a.type || "registration",
      registration: !!a.registration,
      date_created: a.date_created || null,
      date_modified: a.date_modified || null,
      date_registered: a.date_registered || null,
      date_withdrawn: a.date_withdrawn || null,
      registration_supplement: a.registration_supplement || null,
      registration_responses: a.registration_responses || a.registered_meta || {},
      ia_url: a.ia_url || null,
      reviews_state: a.reviews_state || null,
      article_doi: a.article_doi || null,
      has_project: !!a.has_project,
      public: !!a.is_public || !!a.public,
      embargoed: !!a.embargoed,
      registered_by: rel?.registered_by?.data || null,
      registered_from: rel?.registered_from?.data || null,
      registration_schema: rel?.registration_schema?.data || null,
      provider: rel?.provider?.data || null,
      subjects,
      license,
      relationships,
      api_url: item?.links?.self || null,
      html_url: item?.links?.html || null,
      iri: item?.links?.iri || null,
      raw: item
    };
  });
}


function normalizeUsers(list) {
  if (!Array.isArray(list)) return [];
  return list.map(item => {
    const a = item?.attributes || {};
    const rel = item?.relationships || {};
    // Build a tiny summary of available relationships (counts unknown until fetched;
    // we surface which relationship keys exist).
    const relationships = Object.keys(rel || {}).reduce((acc, k) => {
      acc[k] = {
        related: !!rel[k]?.links?.related?.href,
        self: !!rel[k]?.links?.self?.href,
        href: rel[k]?.links?.related?.href || rel[k]?.links?.self?.href || null
      };
      return acc;
    }, {});

    return {
      id: item.id,
      fullname: a?.full_name || a?.given_name || a?.name || "User",
      given_name: a?.given_name || "",
      middle_names: a?.middle_names || "",
      family_name: a?.family_name || "",
      suffix: a?.suffix || "",
      date_registered: a?.date_registered || null,
      active: typeof a?.active === "boolean" ? a.active : null,
      timezone: a?.timezone || null,
      locale: a?.locale || null,
      social: a?.social || {},
      employment: Array.isArray(a?.employment) ? a.employment : [],
      education: Array.isArray(a?.education) ? a.education : [],
      // keep any affiliations if present (Nager-style attr)
      institutes: a?.affiliations || [],
      // links / images
      profile_image: item?.links?.profile_image || a?.profile_image || null,
      api_url: item?.links?.self || null,
      html_url: item?.links?.html || null,
      iri: item?.links?.iri || a?.iri || null,
      // relationships summary & raw payload
      relationships,
      raw: item
    };
  });
}


/* -------------------------
   Relationship fetcher hook (generic)
   returns {items, next, loading, error, load, loadMore}
   ------------------------- */
function useCollection(initialUrl = null) {
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(initial) {
    const url = initial || initialUrl;
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(toProxy(url));
      if (!res.ok) throw new Error(`Fetch ${res.status}`);
      const json = await res.json();
      const data = Array.isArray(json.data) ? json.data : [];
      setItems(data);
      setNext(json?.links?.next || null);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!next) return;
    setLoading(true);
    try {
      const res = await fetch(toProxy(next));
      if (!res.ok) throw new Error(`Fetch ${res.status}`);
      const json = await res.json();
      const data = Array.isArray(json.data) ? json.data : [];
      setItems(prev => [...prev, ...data]);
      setNext(json?.links?.next || null);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return { items, next, loading, error, load, loadMore, setItems, setNext };
}


/* -------------------------
   Main component
   ------------------------- */
export default function OsfInstitutionsPageWithRelations() {
  const [raw, setRaw] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const [activeTab, setActiveTab] = useState("overview"); // overview | nodes | registrations | users
  const [selectedRelatedItem, setSelectedRelatedItem] = useState(null); // preview select in center

  // relationship collection hooks
  const nodesCollection = useCollection(null);
  const regsCollection = useCollection(null);
  const usersCollection = useCollection(null);

  const suggestTimer = useRef(null);

  // dialog states and separate detail data
  const [nodeDetailOpen, setNodeDetailOpen] = useState(false);
  const [registrationDetailOpen, setRegistrationDetailOpen] = useState(false);
  const [userDetailOpen, setUserDetailOpen] = useState(false);

  const [nodeDetailData, setNodeDetailData] = useState(null);
  const [registrationDetailData, setRegistrationDetailData] = useState(null);
  const [userDetailData, setUserDetailData] = useState(null);

  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  /* initial institutions load */
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingInstitutions(true);
      try {
        const res = await fetch(`${API_BASE}/institutions/?page[size]=200`);
        const json = await res.json();
        if (!mounted) return;
        setRaw(json);
        const data = normalizeInstitutions(json?.data || []);
        setInstitutions(data);
        setSelectedInstitution(data[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoadingInstitutions(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  /* suggestions (debounced) */
  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = (query || "").trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const list = institutions
        .filter(i => (i.name || "").toLowerCase().includes(q) || (i.id || "").toLowerCase().includes(q))
        .slice(0, 12);
      setSuggestions(list);
      setShowSuggestions(list.length > 0);
    }, 180);
    return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current); };
  }, [query, institutions]);

  /* when institution changes, reset related state */
  useEffect(() => {
    setActiveTab("overview");
    setSelectedRelatedItem(null);
    // clear collection items
    nodesCollection.setItems([]);
    regsCollection.setItems([]);
    usersCollection.setItems([]);
    nodesCollection.setNext(null);
    regsCollection.setNext(null);
    usersCollection.setNext(null);
  }, [selectedInstitution]);

  /* helper to fetch a relationship collection (nodes/registrations/users) */
  async function openRelationship(kind) {
    if (!selectedInstitution) return;
    const rel = selectedInstitution.relationships?.[kind];
    const href = rel?.links?.related?.href;
    if (!href) return;
    if (kind === "nodes") {
      await nodesCollection.load(href);
      setActiveTab("nodes");
    } else if (kind === "registrations") {
      await regsCollection.load(href);
      setActiveTab("registrations");
    } else if (kind === "users") {
      await usersCollection.load(href);
      setActiveTab("users");
    }
  }

  /* load more handlers */
  async function loadMore(kind) {
    if (kind === "nodes") await nodesCollection.loadMore();
    if (kind === "registrations") await regsCollection.loadMore();
    if (kind === "users") await usersCollection.loadMore();
  }

  /* open related item: fetch full resource, then dispatch to the correct dialog/state */
  async function openRelatedItem(rawItem, kind) {
    if (!rawItem) return;
    const selfHref = rawItem?.links?.self || rawItem?.links?.self?.href;
    const apiHref = toProxy(selfHref) || toProxy(rawItem?.links?.self);
    // show loading in corresponding dialog
    try {
      if (kind === "nodes") {
        setNodeDetailData(null);
        setNodeDetailOpen(true);
      } else if (kind === "registrations") {
        setRegistrationDetailData(null);
        setRegistrationDetailOpen(true);
      } else if (kind === "users") {
        setUserDetailData(null);
        setUserDetailOpen(true);
      }

      if (apiHref) {
        const res = await fetch(apiHref);
        const json = await res.json();
        const data = json?.data || json;
        // store raw + normalized preview
        if (kind === "nodes") setNodeDetailData({ raw: data, normalized: normalizeNodes([data])[0] });
        if (kind === "registrations") setRegistrationDetailData({ raw: data, normalized: normalizeRegistrations([data])[0] });
        if (kind === "users") setUserDetailData({ raw: data, normalized: normalizeUsers([data])[0] });
      } else {
        // fallback: use provided rawItem
        if (kind === "nodes") setNodeDetailData({ raw: rawItem, normalized: normalizeNodes([rawItem])[0] });
        if (kind === "registrations") setRegistrationDetailData({ raw: rawItem, normalized: normalizeRegistrations([rawItem])[0] });
        if (kind === "users") setUserDetailData({ raw: rawItem, normalized: normalizeUsers([rawItem])[0] });
      }
    } catch (err) {
      console.error(err);
      // show what we have
      if (kind === "nodes") setNodeDetailData({ raw: rawItem, normalized: normalizeNodes([rawItem])[0] });
      if (kind === "registrations") setRegistrationDetailData({ raw: rawItem, normalized: normalizeRegistrations([rawItem])[0] });
      if (kind === "users") setUserDetailData({ raw: rawItem, normalized: normalizeUsers([rawItem])[0] });
    }
  }

  /* copy / download helpers for institution */
  function copySelectedInstitution() {
    if (!selectedInstitution) return;
    navigator.clipboard.writeText(prettyJSON(selectedInstitution.raw));
    setCopied(true);
    setTimeout(()=>setCopied(false), 1200);
  }

  function downloadSelectedInstitution() {
    if (!selectedInstitution) return;
    const blob = new Blob([prettyJSON(selectedInstitution.raw)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedInstitution.id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* UI helpers */
  const randomPicks = useMemo(()=>{
    if (!institutions?.length) return [];
    const picks = new Set();
    while (picks.size < Math.min(12, institutions.length)) picks.add(Math.floor(Math.random()*institutions.length));
    return [...picks].map(i => institutions[i]);
  }, [institutions]);

  function refreshRandomPicks() {
    setInstitutions(prev => {
      const copy = prev.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
  }

  // safe helper: get text from nested response value
function extractTextFromResponse(v) {
  if (v == null) return null;

  // common patterns observed:
  // 1) v is string -> return directly
  if (typeof v === "string") return v;

  // 2) v.value contains nested structure
  // e.g. v = { value: { question: { value: "..." }, uploader: { extra: [...] }, value: "..." } }
  if (typeof v === "object" && v.value !== undefined) {
    const inner = v.value;

    // if question text present: v.value.question.value
    if (inner?.question?.value) return inner.question.value;

    // else if inner has 'value' string
    if (typeof inner.value === "string" && inner.value.trim() !== "") return inner.value;

    // else if uploader with textual value maybe in inner.value (empty) but uploader.extra includes files
    // return indicator (files present)
    if (inner?.uploader?.extra && Array.isArray(inner.uploader.extra) && inner.uploader.extra.length > 0) {
      // build small summary of files
      const names = inner.uploader.extra.map(x => x?.data?.name || x?.selectedFileName || "file").filter(Boolean);
      return `Uploaded file(s): ${names.join(", ")}`;
    }
  }

  // 3) v is object where keys map to { value: ... } or nested strings
  if (typeof v === "object") {
    // Try to find the deepest string-ish property
    // Prioritize common fields
    const candidates = [
      v.question?.value,
      v.text,
      v.name,
      v.value,
      v?.label,
    ];
    for (const c of candidates) if (typeof c === "string" && c.trim()) return c;

    // If object contains uploader.extra (list of files), produce file summary
    if (v?.uploader?.extra && Array.isArray(v.uploader.extra) && v.uploader.extra.length) {
      const names = v.uploader.extra.map(x => x?.data?.name || x?.selectedFileName || "file").filter(Boolean);
      return `Uploaded file(s): ${names.join(", ")}`;
    }

    // fallback: stringify concise
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  // default fallback
  return String(v);
}

// small helper to extract uploader file list if present
function extractUploaderFiles(v) {
  const inner = (typeof v === "object" && v.value) ? v.value : v;
  if (!inner) return [];
  const arr = inner?.uploader?.extra || inner?.uploader || [];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => {
      // x structure may have data.name, selectedFileName, viewUrl (path)
      const name = x?.data?.name || x?.selectedFileName || x?.name || null;
      const viewUrl = x?.viewUrl || (x?.data && x.data.viewUrl) || null;
      // sometimes nodeId + sha256 provided; building preview path may require your app logic
      return { name, viewUrl, raw: x };
    })
    .filter(Boolean);
}

// ResponseItem component: label + preview + show more + file links
function ResponseItem({ label, value }) {
  const text = extractTextFromResponse(value);
  const files = extractUploaderFiles(value);
  const [open, setOpen] = React.useState(false);

  // short preview (max chars)
  const previewLimit = 220;
  const short = typeof text === "string" && text.length > previewLimit ? text.slice(0, previewLimit) + "…" : text;

  return (
    <div className="text-xs">
      <div className="text-xs opacity-60">{label}</div>

      {text ? (
        <>
          <div className="font-medium text-sm mt-1 break-words">
            {open ? text : short}
          </div>

          {typeof text === "string" && text.length > previewLimit && (
            <button
              onClick={() => setOpen(s => !s)}
              className="text-xs mt-1 text-sky-500 hover:underline cursor-pointer"
            >
              {open ? "Show less" : "Show more"}
            </button>
          )}
        </>
      ) : (
        <div className="font-medium text-sm mt-1">—</div>
      )}

      {files.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-xs opacity-70">File:</span>
              <div className="font-medium">
                {f.name || `file-${i}`}
                {/* If your backend exposes a full URL for view/download use that; open in new tab */}
                {f.viewUrl ? (
                  <a className="ml-2 text-sky-500" href={f.viewUrl} target="_blank" rel="noreferrer">Open</a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


  return (
    <div className="min-h-screen py-8 px-4 pb-10">
      <div className="max-w-8xl mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              OSF Institutions
            </h1>
            <p className="mt-1 text-sm opacity-70 max-w-2xl">
              Browse institutions and inspect related nodes, registrations and users
            </p>
          </div>

          {/* Search */}
          <div className="w-full md:w-[640px] relative">
            <div className={clsx("flex items-center gap-2 p-3 rounded-xl shadow-sm",
              "bg-white border border-zinc-200 dark:bg-black/40 dark:border-zinc-800")}>
              <Search className="opacity-60" />
              <Input
                placeholder="Search institutions by name or id (type 'IND' or 'abc-123')"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                onFocus={()=>{ if((query||"").trim()) setShowSuggestions(true); }}
                className="border-0 bg-transparent"
              />
              <Button variant="outline" onClick={()=>{ if(suggestions.length) setSelectedInstitution(suggestions[0]); }} className="cursor-pointer">
                <Search />
              </Button>

              <div className="md:hidden ml-2">
                <Sheet>
                  <SheetTrigger asChild><Button variant="ghost" className="p-2 cursor-pointer"><Menu /></Button></SheetTrigger>
                  <SheetContent side="left" className="w-full max-w-xs">
                    <SheetHeader>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Quick picks</h3>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" onClick={() => { refreshRandomPicks(); }} className="cursor-pointer mr-5"><RefreshCw /></Button>

                        </div>
                      </div>
                    </SheetHeader>
                    <div className="p-4">
                      <ScrollArea style={{height:"65vh"}}>
                        <div className="space-y-2">
                          {randomPicks.map(i => (
                            <div key={i.id} className="p-3 rounded-lg border cursor-pointer dark:hover:bg-zinc-800 hover:bg-zinc-50" onClick={()=>{ setSelectedInstitution(i); }}>
                              <div className="font-medium">{i.name}</div>
                              <div className="text-xs opacity-60">{i.id}</div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto z-50 mt-2 max-w-[640px]">
                <div className="rounded-xl shadow-2xl overflow-hidden border dark:bg-black bg-white">
                  <ScrollArea className="overflow-y-auto" style={{ maxHeight: 300 }}>
                    {suggestions.map(s => (
                      <div
                        key={s.id}
                        onClick={() => { setSelectedInstitution(s); setShowSuggestions(false); setQuery(""); }}
                        className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer border-b"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{s.name}</div>
                          <div className="text-xs opacity-60 truncate">{s.id}</div>
                        </div>
                        <Badge className={glassy("neutral")}>{s.id}</Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left quick picks */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card className="rounded-2xl dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users2 className="w-4 h-4 text-zinc-500" /> Institutions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs opacity-60">10 random picks</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { refreshRandomPicks(); }} className="cursor-pointer"><RefreshCw /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedInstitution(null)} className="cursor-pointer">Clear</Button>
                  </div>
                </div>

                <ScrollArea style={{height:"70vh"}}>
                  <div className="space-y-2">
                    {randomPicks.map(i => (
                      <div key={i.id}
                           onClick={()=>setSelectedInstitution(i)}
                           role="button"
                           tabIndex={0}
                           className={clsx(
                             "p-3 rounded-lg flex items-center justify-between cursor-pointer transition-shadow",
                             selectedInstitution?.id===i.id ? "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 shadow-sm": "hover:bg-slate-50 dark:hover:bg-zinc-900"
                           )}>
                        <div className="min-w-0">
                          <div className="font-medium ">{i.name}</div>
                          <div className="text-xs opacity-60 ">{i.id}</div>
                        </div>
                        <Badge className={glassy("neutral")}>{i.id}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="text-xs opacity-60">Source: OSF Institutions API</div>
                <div className="text-xs opacity-60">Total: {institutions.length}</div>
              </CardFooter>
            </Card>
          </aside>

          {/* Center: Institution overview + relationship tabs + lists/details */}
          <section className="lg:col-span-6">
            <Card className="rounded-2xl dark:bg-black/80 white/80">
              <CardHeader className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/80 dark:bg-zinc-800 border">
                    <University className="w-6 h-6 text-zinc-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{selectedInstitution?.name || "Select an institution"}</h2>
                    <div className="text-xs opacity-60">{selectedInstitution?.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={()=>setShowRaw(s=>!s)} className="cursor-pointer"><FileText /> {showRaw ? "Hide raw" : "Raw"}</Button>
                  <Button variant="outline" onClick={() => copySelectedInstitution()} className="cursor-pointer">{copied ? <Check /> : <Copy />} Copy</Button>
                </div>
              </CardHeader>

              <CardContent>
                {!selectedInstitution ? (
                  <div className="text-sm opacity-60 py-10 text-center">No institution selected — pick one from left or search above.</div>
                ) : (
                  <div className="space-y-6">
                    {/* Overview area */}
                    <div className="space-y-4">
                      {selectedInstitution.banner && (
                        <div className="rounded-xl overflow-hidden border dark:bg-zinc-800 bg-zinc-100 cursor-pointer" onClick={() => setImageDialogOpen(true)}>
                          <img src={toProxy(selectedInstitution.banner) || selectedInstitution.banner} className="w-full  object-cover" alt="banner" />
                        </div>
                      )}
                      <div className="flex items-start  gap-4">
                        {selectedInstitution.logo ? (
                          <img src={toProxy(selectedInstitution.logo) || selectedInstitution.logo} className="w-20 h-20 rounded-md object-cover border" alt="logo" />
                        ) : (
                          <div className="w-20 h-20 rounded-md border flex items-center justify-center bg-zinc-50 dark:bg-zinc-900"><ImageIcon /></div>
                        )}
                        <div className="flex-1">
                          <div className="prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{__html: selectedInstitution.description || "<i>No description</i>"}} />
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedInstitution.ror && <Badge className={glassy("neutral")}>ROR</Badge>}
                            {selectedInstitution.iri && <Badge className={glassy("neutral")}>IRI</Badge>}
                            {selectedInstitution.requestAccess && <Badge className={glassy("blue")}>Access Req</Badge>}
                            {selectedInstitution.iris && selectedInstitution.iris.length > 0 && <Badge className={glassy("neutral")}>{selectedInstitution.iris.length} IRIs</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Relationship action buttons */}
                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={()=>openRelationship("nodes")} className="cursor-pointer"><BookOpen /> Nodes</Button>
                      <Button variant="outline" onClick={()=>openRelationship("registrations")} className="cursor-pointer"><Globe /> Registrations</Button>
                      <Button variant="outline" onClick={()=>openRelationship("users")} className="cursor-pointer"><Users2 /> Users</Button>

                      <div className="ml-auto text-xs opacity-60">API: <a className="text-sky-500" href={selectedInstitution.api_url} target="_blank" rel="noreferrer">institution</a></div>
                    </div>

                    <Separator />

                    {/* Tabs with Select (shadcn) for compact control */}
                    <div className="flex items-center flex-wrap gap-3 mb-3">
                      <div className="flex gap-2">
                        {["overview","nodes","registrations","users"].map(tab => (
                          <button
                            key={tab}
                            onClick={()=>setActiveTab(tab)}
                            className={clsx("px-3 py-1 rounded-md text-sm cursor-pointer", activeTab===tab ? "bg-zinc-100 dark:bg-zinc-900 font-medium":"hover:bg-zinc-50 dark:hover:bg-zinc-900")}
                          >
                            {tab[0].toUpperCase()+tab.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* small Select to jump to a tab */}
                      <div className="ml-auto">
                        <Select value={activeTab} onValueChange={(v)=>setActiveTab(v)} >
                          <SelectTrigger className="w-40 cursor-pointer bg-transparent border border-zinc-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="overview">Overview</SelectItem>
                            <SelectItem value="nodes">Nodes</SelectItem>
                            <SelectItem value="registrations">Registrations</SelectItem>
                            <SelectItem value="users">Users</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tab content */}
                    <div>
                      {activeTab === "overview" && (
                        <div className="text-sm space-y-3">
                          <div><strong>Identifiers</strong></div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs opacity-60">ROR</div>
                              <div>{selectedInstitution.ror ? <a className="text-sky-500" href={selectedInstitution.ror} target="_blank" rel="noreferrer">{selectedInstitution.ror}</a> : "—"}</div>
                            </div>
                            <div>
                              <div className="text-xs opacity-60">IRI</div>
                              <div>{selectedInstitution.iri ? <a className="text-sky-500" href={selectedInstitution.iri} target="_blank" rel="noreferrer">{selectedInstitution.iri}</a> : "—"}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs opacity-60">All IRIs</div>
                            <div className="flex flex-wrap gap-2 mt-2">{(selectedInstitution.iris||[]).map(u => <Badge key={u} className={glassy("neutral")}>{u}</Badge>)}</div>
                          </div>
                        </div>
                      )}

                      {activeTab === "nodes" && (
                        <RelationshipList
                          kind="nodes"
                          collectionHook={nodesCollection}
                          normalize={normalizeNodes}
                          onOpenItem={(rawItem)=>openRelatedItem(rawItem,"nodes")}
                          loadMore={()=>loadMore("nodes")}
                        />
                      )}

                      {activeTab === "registrations" && (
                        <RelationshipList
                          kind="registrations"
                          collectionHook={regsCollection}
                          normalize={normalizeRegistrations}
                          onOpenItem={(rawItem)=>openRelatedItem(rawItem,"registrations")}
                          loadMore={()=>loadMore("registrations")}
                        />
                      )}

                      {activeTab === "users" && (
                        <RelationshipList
                          kind="users"
                          collectionHook={usersCollection}
                          normalize={normalizeUsers}
                          onOpenItem={(rawItem)=>openRelatedItem(rawItem,"users")}
                          loadMore={()=>loadMore("users")}
                        />
                      )}
                    </div>

                    {/* Selected related item details (small preview) */}
                    {selectedRelatedItem && (
                      <div className="mt-4 p-4 border rounded-xl space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm opacity-60">Selected {selectedRelatedItem.kind}</div>
                            <h3 className="font-semibold">{selectedRelatedItem.normalized?.title || selectedRelatedItem.normalized?.fullname || selectedRelatedItem.normalized?.id}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openRelatedItem(selectedRelatedItem.raw || selectedRelatedItem.normalized, selectedRelatedItem.kind)} className="cursor-pointer">Details</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <div className="text-xs opacity-60">Institution details & relationships</div>
              </CardFooter>
            </Card>
          </section>

          {/* Right: quick actions & metadata */}
          <aside className="lg:col-span-3">
            <div className="space-y-4">
              <Card className="rounded-2xl dark:bg-black/80 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Info /> Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button variant="outline" className="cursor-pointer" onClick={copySelectedInstitution}>
                    {copied ? <Check /> : <Copy />} Copy Institution JSON
                  </Button>

                  <Button variant="outline" className="cursor-pointer" onClick={downloadSelectedInstitution}>
                    <Download /> Download JSON
                  </Button>

                  <Separator />

                  <div className="text-sm opacity-70">
                    <div className="mb-2"><strong>Links</strong></div>
                    {selectedInstitution?.html_url && <div className="flex items-center gap-2"><ExternalLink /> <a className="text-sky-500" href={selectedInstitution.html_url} target="_blank" rel="noreferrer">Open on OSF</a></div>}
                    {selectedInstitution?.api_url && <div className="flex items-center gap-2 mt-2"><LinkIcon /> <a className="text-sky-500" href={selectedInstitution.api_url} target="_blank" rel="noreferrer">Open API</a></div>}
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-black/80 bg-white">
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm opacity-70">
                    Use the relationship buttons or tabs to fetch related lists. Click any related item to fetch and view full details (opens a dialog).
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-black/80 bg-white">
                <CardContent>
                  <div className="text-xs opacity-60">Raw loaded payload</div>
                  <pre className="text-xs p-3 rounded-md border bg-white/50 dark:bg-zinc-900 overflow-auto" style={{maxHeight:160}}>
                    {prettyJSON(raw)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </aside>

        </main>
      </div>

      {/* Node Detail Dialog */}
      <Dialog open={nodeDetailOpen} onOpenChange={setNodeDetailOpen}>
        <DialogContent className="max-w-4xl w-full p-3 rounded-2xl ">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{nodeDetailData?.normalized?.title || nodeDetailData?.normalized?.id || "Node Detail"}</DialogTitle>
          
            </div>
          </DialogHeader>

          <div className="p-4 overflow-y-auto h-100">
{!nodeDetailData ? (
  <div className="py-6 text-center text-sm opacity-60">Loading...</div>
) : (
  <div className="grid grid-cols-1  gap-4">
    <div className="lg:col-span-2 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg truncate">{nodeDetailData.normalized?.title}</h3>
            {/* category / type badges */}
            {nodeDetailData.normalized?.category && (
              <Badge className={glassy("neutral")}>
                <Tag className="w-3 h-3 mr-1 inline-block" /> {nodeDetailData.normalized.category}
              </Badge>
            )}
            <Badge className={glassy("neutral")}>
              {nodeDetailData.normalized?.type}
            </Badge>
            {nodeDetailData.normalized?.public ? (
              <Badge className={glassy("blue")}>Public</Badge>
            ) : (
              <Badge className={glassy("neutral")}>Private</Badge>
            )}
          </div>

          <div className="text-xs opacity-60 mt-1">
            {nodeDetailData.normalized?.html_url && (
              <a className="text-sky-500 mr-3" href={nodeDetailData.normalized.html_url} target="_blank" rel="noreferrer">
                <LinkIcon className="inline-block w-3 h-3 mr-1" /> Open on OSF
              </a>
            )}
            {nodeDetailData.normalized?.iri && (
              <a className="text-sky-500" href={nodeDetailData.normalized.iri} target="_blank" rel="noreferrer">
                IRI
              </a>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs opacity-60">Heredity</div>
          <div className="font-medium">{nodeDetailData.normalized?.collection ? "Collection" : nodeDetailData.normalized?.fork ? "Fork" : "Project"}</div>
        </div>
      </div>

      <div className="text-sm mt-2">{nodeDetailData.normalized?.description || "—"}</div>

      {/* tags & subjects */}
      <div className="mt-3 flex flex-wrap gap-2">
        {nodeDetailData.normalized?.tags?.length > 0 ? nodeDetailData.normalized.tags.map((t, i) => (
          <Badge key={i} className={glassy("neutral")}>{t}</Badge>
        )) : <div className="text-xs opacity-60">No tags</div>}

        {nodeDetailData.normalized?.subjects?.length > 0 && (
          <div className="flex items-center gap-2 ml-2 flex-wrap">
            {nodeDetailData.normalized.subjects.map((s, i) => (
              <span key={i} className="px-2 py-1 rounded-md text-xs border text-xs opacity-80">{s}</span>
            ))}
          </div>
        )}
      </div>


    </div>

    <div className="space-y-3">
      <div className="text-xs opacity-60">Metadata</div>

      <div className="space-y-2 p-3 rounded-md border bg-white/50 dark:bg-zinc-900">
        {nodeDetailData.normalized?.date_created && (
          <div>
            <div className="text-xs opacity-60">Created</div>
            <div>{new Date(nodeDetailData.normalized.date_created).toLocaleString()}</div>
          </div>
        )}

        {nodeDetailData.normalized?.date_modified && (
          <div className="mt-2">
            <div className="text-xs opacity-60">Modified</div>
            <div>{new Date(nodeDetailData.normalized.date_modified).toLocaleString()}</div>
          </div>
        )}

        <div className="mt-2">
          <div className="text-xs opacity-60">Public</div>
          <div>{nodeDetailData.normalized?.public ? "Yes" : "No"}</div>
        </div>

        {nodeDetailData.normalized?.region && (
          <div className="mt-2">
            <div className="text-xs opacity-60">Region</div>
            <div className="font-medium">{nodeDetailData.normalized.region}</div>
          </div>
        )}

        <div className="mt-2">
          <div className="text-xs opacity-60">Permissions</div>
          <div className="font-medium text-sm">{(nodeDetailData.normalized?.current_user_permissions || []).join(", ") || "—"}</div>
        </div>

        {nodeDetailData.normalized?.node_license && (
          <div className="mt-2">
            <div className="text-xs opacity-60">License</div>
            <div className="font-medium">{JSON.stringify(nodeDetailData.normalized.node_license)}</div>
          </div>
        )}

        {nodeDetailData.normalized?.api_url && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={() => window.open(nodeDetailData.normalized.api_url, "_blank")} className="cursor-pointer">
              <ExternalLink /> Open API
            </Button>
          </div>
        )}
      </div>
    </div>
  </div>
)}

          </div>

          <DialogFooter className="p-4 border-t">
            <div className="text-xs opacity-60">Loaded from OSF API</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setNodeDetailOpen(false)} className="cursor-pointer">Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Detail Dialog */}
      <Dialog open={registrationDetailOpen} onOpenChange={setRegistrationDetailOpen}>
        <DialogContent className="max-w-4xl w-full p-3 rounded-2xl overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{registrationDetailData?.normalized?.title || registrationDetailData?.normalized?.id || "Registration Detail"}</DialogTitle>
         
            </div>
          </DialogHeader>

          <div className="p-4 h-100 overflow-y-auto">
{!registrationDetailData ? (
  <div className="py-6 text-center text-sm opacity-60">Loading...</div>
) : (
  <div className="grid grid-cols-1  gap-4">
    {/* Left / main column */}
    <div className="lg:col-span-2 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg truncate">{registrationDetailData.normalized?.title}</h3>
            {registrationDetailData.normalized?.reviews_state && (
              <Badge className={glassy("neutral")}>{registrationDetailData.normalized.reviews_state}</Badge>
            )}
            {registrationDetailData.normalized?.public ? (
              <Badge className={glassy("blue")}>Public</Badge>
            ) : (
              <Badge className={glassy("neutral")}>Private</Badge>
            )}
            {registrationDetailData.normalized?.embargoed && <Badge className={glassy("neutral")}>Embargoed</Badge>}
          </div>

          <div className="text-xs opacity-60 mt-1">
            {registrationDetailData.normalized?.html_url && (
              <a className="text-sky-500 mr-3" href={registrationDetailData.normalized.html_url} target="_blank" rel="noreferrer">
                <LinkIcon className="inline-block w-3 h-3 mr-1" /> Open on OSF
              </a>
            )}
            {registrationDetailData.normalized?.ia_url && (
              <a className="text-sky-500 mr-3" href={registrationDetailData.normalized.ia_url} target="_blank" rel="noreferrer">
                <ExternalLink className="inline-block w-3 h-3 mr-1" /> Archive.org
              </a>
            )}
            {registrationDetailData.normalized?.iri && (
              <a className="text-sky-500" href={registrationDetailData.normalized.iri} target="_blank" rel="noreferrer">IRI</a>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs opacity-60">Registered</div>
          <div className="font-medium">
            {registrationDetailData.normalized?.date_registered
              ? new Date(registrationDetailData.normalized.date_registered).toLocaleString()
              : "—"}
          </div>
          <div className="text-xs opacity-60 mt-1">{registrationDetailData.normalized?.has_project ? "Has project" : "Standalone registration"}</div>
        </div>
      </div>

      <div className="text-sm mt-2">{registrationDetailData.normalized?.description || "—"}</div>

      {/* subjects / tags */}
      <div className="mt-3 flex flex-wrap gap-2">
        {registrationDetailData.normalized?.subjects?.length > 0 ? registrationDetailData.normalized.subjects.map((s, i) => (
          <Badge key={i} className={glassy("neutral")}>{s}</Badge>
        )) : <div className="text-xs opacity-60">No subjects listed</div>}
      </div>

      {/* registration responses preview (show up to 5 keys) */}
      <div className="mt-4 border rounded-md p-3 bg-white/50 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-2"><FileText /> Registration responses</div>
          <div className="text-xs opacity-60">{Object.keys(registrationDetailData.normalized?.registration_responses || {}).length} items</div>
        </div>

<div className="mt-3 text-sm space-y-3">
  {Object.entries(registrationDetailData.normalized?.registration_responses || {}).length === 0 ? (
    <div className="text-xs opacity-60">No registration response data</div>
  ) : (
    Object.entries(registrationDetailData.normalized.registration_responses).map(([k, v]) => (
      <div key={k} className="p-3 rounded-md border bg-white/50 dark:bg-zinc-900">
        <ResponseItem label={k} value={v} />
      </div>
    ))
  )}
</div>

      </div>

      {/* Raw JSON */}
      <div className="mt-4">
        <div className="text-xs opacity-60">Raw JSON</div>
        <pre className="text-xs p-3 rounded-md border overflow-auto bg-white/50 dark:bg-zinc-900" style={{ maxHeight: 300 }}>
          {prettyJSON(registrationDetailData.raw)}
        </pre>
      </div>
    </div>

    {/* Right / metadata column */}
    <div className="space-y-3">
      <div className="text-xs opacity-60">Metadata</div>

      <div className="space-y-2 p-3 rounded-md border bg-white/50 dark:bg-zinc-900">
        {registrationDetailData.normalized?.date_created && (
          <div>
            <div className="text-xs opacity-60">Created</div>
            <div>{new Date(registrationDetailData.normalized.date_created).toLocaleString()}</div>
          </div>
        )}

        {registrationDetailData.normalized?.date_modified && (
          <div className="mt-2">
            <div className="text-xs opacity-60">Modified</div>
            <div>{new Date(registrationDetailData.normalized.date_modified).toLocaleString()}</div>
          </div>
        )}

        <div className="mt-2">
          <div className="text-xs opacity-60">Type</div>
          <div>{registrationDetailData.normalized?.type}</div>
        </div>

        {registrationDetailData.normalized?.node_license && (
          <div className="mt-2">
            <div className="text-xs opacity-60">License</div>
            <div className="font-medium text-sm">{JSON.stringify(registrationDetailData.normalized.node_license)}</div>
          </div>
        )}

        {registrationDetailData.normalized?.registration_schema && (
          <div className="mt-2">
            <div className="text-xs opacity-60">Schema</div>
            <div className="font-medium">
              <a className="text-sky-500" href={`https://api.osf.io/v2/schemas/registrations/${registrationDetailData.normalized.registration_schema.id}/`} target="_blank" rel="noreferrer">
                {registrationDetailData.normalized.registration_schema.id}
              </a>
            </div>
          </div>
        )}

        {registrationDetailData.normalized?.registered_by && (
          <div className="mt-2">
            <div className="text-xs opacity-60">Registered by</div>
            <div className="font-medium">
              <a className="text-sky-500" href={`https://osf.io/${registrationDetailData.normalized.registered_by.id}/`} target="_blank" rel="noreferrer">
                {registrationDetailData.normalized.registered_by.id}
              </a>
            </div>
          </div>
        )}

        {registrationDetailData.normalized?.ia_url && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={() => window.open(registrationDetailData.normalized.ia_url, "_blank")} className="cursor-pointer">
              <ExternalLink /> View archive
            </Button>
          </div>
        )}

        {registrationDetailData.normalized?.api_url && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={() => window.open(registrationDetailData.normalized.api_url, "_blank")} className="cursor-pointer">
              <ExternalLink /> Open API
            </Button>
          </div>
        )}
      </div>
    </div>
  </div>
)}

          </div>

          <DialogFooter className="p-4 border-t">
            <div className="text-xs opacity-60">Loaded from OSF API</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setRegistrationDetailOpen(false)} className="cursor-pointer">Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
        <DialogContent className="max-w-3xl w-full p-3 rounded-2xl overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{userDetailData?.normalized?.fullname || userDetailData?.normalized?.id || "User Detail"}</DialogTitle>
 
            </div>
          </DialogHeader>

          <div className="p-4 h-100 overflow-y-auto">
{!userDetailData ? (
  <div className="py-6 text-center text-sm opacity-60">Loading...</div>
) : (
  <div className="space-y-4">
    <div className="flex items-start gap-4">
      <img
        src={userDetailData.normalized?.profile_image || userDetailData.raw?.links?.profile_image || "/images/avatar-placeholder.png"}
        alt={userDetailData.normalized?.fullname}
        className="w-20 h-20 rounded-md object-cover border"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-lg truncate">{userDetailData.normalized?.fullname}</h3>

          {/* Active badge */}
          <div>
            {userDetailData.normalized?.active === true ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Check className="w-3 h-3 mr-1" /> Active
              </span>
            ) : userDetailData.normalized?.active === false ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                Inactive
              </span>
            ) : null}
          </div>
        </div>

        <div className="text-xs opacity-60 mt-1">
          {userDetailData.normalized?.given_name && <span>{userDetailData.normalized.given_name} </span>}
          {userDetailData.normalized?.family_name && <span>{userDetailData.normalized.family_name} </span>}
          {userDetailData.normalized?.suffix && <span className="opacity-70">, {userDetailData.normalized.suffix}</span>}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {userDetailData.normalized?.timezone && <span className="px-2 py-1 rounded-md border text-xs opacity-80">{userDetailData.normalized.timezone}</span>}
          {userDetailData.normalized?.locale && <span className="px-2 py-1 rounded-md border text-xs opacity-80">{userDetailData.normalized.locale}</span>}
          {userDetailData.normalized?.iri && <a className="px-2 py-1 rounded-md border text-xs text-sky-500" href={userDetailData.normalized.iri} target="_blank" rel="noreferrer">IRI</a>}
          {userDetailData.normalized?.html_url && <a className="px-2 py-1 rounded-md border text-xs text-sky-500" href={userDetailData.normalized.html_url} target="_blank" rel="noreferrer">Profile</a>}
        </div>

        <div className="mt-3 text-sm">
          <div className="text-xs opacity-60">Registered</div>
          <div className="font-medium">
            {userDetailData.normalized?.date_registered
              ? new Date(userDetailData.normalized.date_registered).toLocaleString()
              : "—"}
          </div>
        </div>
      </div>
    </div>

    {/* Employment / Education */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <div className="text-xs opacity-60">Employment</div>
        {userDetailData.normalized?.employment?.length ? (
          <ul className="mt-2 text-sm list-disc list-inside space-y-1">
            {userDetailData.normalized.employment.map((e, i) => (
              <li key={i}>
                {typeof e === "string" ? e : (e?.role ? `${e.role} at ${e.organization || e.institution || "—"}` : JSON.stringify(e))}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 text-xs opacity-60">No employment data</div>
        )}
      </div>

      <div>
        <div className="text-xs opacity-60">Education</div>
        {userDetailData.normalized?.education?.length ? (
          <ul className="mt-2 text-sm list-disc list-inside space-y-1">
            {userDetailData.normalized.education.map((ed, i) => (
              <li key={i}>
                {typeof ed === "string" ? ed : (ed?.degree ? `${ed.degree} — ${ed.institution || "—"}` : JSON.stringify(ed))}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 text-xs opacity-60">No education data</div>
        )}
      </div>
    </div>


  </div>
)}

          </div>

          <DialogFooter className="p-4 border-t">
            <div className="text-xs opacity-60">Loaded from OSF API</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setUserDetailOpen(false)} className="cursor-pointer">Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-3xl w-full p-3 rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Image preview</DialogTitle>
          </DialogHeader>
          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selectedInstitution?.banner ? (
              <img src={toProxy(selectedInstitution.banner) || selectedInstitution.banner} alt="banner" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <div className="text-xs opacity-60">No image available</div>
            )}
          </div>
          <DialogFooter className="p-4">
            <Button variant="outline" onClick={() => setImageDialogOpen(false)} className="cursor-pointer">Close</Button>
            {selectedInstitution?.banner && <Button variant="ghost" asChild className="cursor-pointer">
              <a href={toProxy(selectedInstitution.banner) || selectedInstitution.banner} target="_blank" rel="noreferrer"><ExternalLink /></a>
            </Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------
   RelationshipList component
   props:
     - kind: "nodes"|"registrations"|"users"
     - collectionHook: useCollection return value
     - normalize: normalizer function for items
     - onOpenItem: function(rawItem, kind)
     - loadMore: fn
   ------------------------- */
function RelationshipList({ kind, collectionHook, normalize, onOpenItem, loadMore }) {
  const { items, loading, error, next } = collectionHook;
  // items are raw OSF resource objects; normalize for UI
  const normalized = normalize(items || []);

  return (
    <div>
      {loading && <div className="text-center py-4"><RefreshCw className="animate-spin mx-auto" /></div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {!loading && normalized.length === 0 && <div className="text-sm opacity-60">No items loaded. Click the relationship button to fetch.</div>}

      <div className="space-y-2 h-100 overflow-y-auto">
        {normalized.map((it) => (
          <div key={it.id}
               className="p-3 border rounded-lg flex items-center justify-between cursor-pointer dark:hover:bg-zinc-900 hover:bg-zinc-50"
               onClick={() => onOpenItem(items.find(x => x.id === it.id) || it, kind)}>
            <div className="min-w-0">
              <div className="font-medium truncate">{it.title || it.fullname || it.id}</div>
              <div className="text-xs opacity-60 truncate">{it.type || it.id}</div>
            </div>
            <div className="flex items-center gap-2">
              {it.html_url && <Button variant="ghost" size="sm" onClick={(e)=>{ e.stopPropagation(); window.open(it.html_url, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>}
              <Badge className={glassy("neutral")}>{it.id}</Badge>
            </div>
          </div>
        ))}
      </div>

      {next && (
        <div className="mt-3 text-center">
          <Button variant="outline" onClick={loadMore} className="cursor-pointer">Load more</Button>
        </div>
      )}
    </div>
  );
}
