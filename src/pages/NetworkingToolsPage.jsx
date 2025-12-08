// src/pages/NetworkingToolsPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Copy,
  Download,
  Zap,
  Layers,
  Settings,
  Server,
  Activity,
  AlertCircle,
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
import MDEditor from "@uiw/react-md-editor";

/**
 NetworkingToolsPage (real-backed)
 - Tools wired to backend endpoints for real network operations:
   /api/ping, /api/port-check, /api/dns, /api/reverse-dns, /api/oui, /api/dns/publish (optional)
 - Client-side: IP subnet math, CIDR converter, URL parser/builder, duplicate IP finder, topology visualizer
*/

// Tools enum
const TOOLS = {
  IP_SUBNET: "ip_subnet",
  CIDR_CONVERTER: "cidr_converter",
  DNS_GEN: "dns_generator",
  MAC_LOOKUP: "mac_lookup",
  URL_PARSER: "url_parser",
  PING_REAL: "ping_real",
  REVERSE_DNS: "reverse_dns",
  PORT_CHECK: "port_check",
  DUPLICATE_IP: "duplicate_ip",
  TOPOLOGY: "topology",
};

// IP helpers
function ipToInt(ip) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error("Invalid octet");
    return n;
  });
  return ((nums[0] << 24) >>> 0) + (nums[1] << 16) + (nums[2] << 8) + nums[3];
}
function intToIp(n) {
  if (n == null || isNaN(n)) return "";
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
}
function cidrToMaskInt(cidr) {
  if (cidr < 0 || cidr > 32) return 0;
  return cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
}
function cidrToMask(cidr) {
  return intToIp(cidrToMaskInt(cidr));
}
function maskToCidr(mask) {
  const i = ipToInt(mask);
  if (i == null) return null;
  let count = 0;
  for (let b = 31; b >= 0; b--) {
    if ((i >> b) & 1) count++;
    else break;
  }
  return count;
}
const uid = () => Math.random().toString(36).slice(2, 9);

// Simple ping graph (SVG)
function PingGraph({ values = [] }) {
  const width = 540;
  const height = 140;
  const padding = 12;
  const maxVal = Math.max(1, ...values);
  const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : width - padding * 2;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width={width} height={height} rx="8" fill="transparent" />
      {values.map((v, i) => {
        const x = padding + i * stepX;
        const y = height - padding - (v / maxVal) * (height - padding * 2);
        return <circle key={i} cx={x} cy={y} r={3} fill="#10b981" />;
      })}
      {values.length > 1 && (
        <path
          d={values
            .map((v, i) => {
              const x = padding + i * stepX;
              const y = height - padding - (v / maxVal) * (height - padding * 2);
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ")}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      <text x={padding} y={height - 2} fontSize={10} fill="#94a3b8">
        0 ms
      </text>
      <text x={width - padding - 30} y={padding + 8} fontSize={10} fill="#94a3b8" textAnchor="end">
        {Math.ceil(maxVal)} ms
      </text>
    </svg>
  );
}

export default function NetworkingToolsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // tool state
  const [selectedTool, setSelectedTool] = useState(TOOLS.IP_SUBNET);
  const [dialogOpen, setDialogOpen] = useState(false);

  // shared UI
  const [resultText, setResultText] = useState("");
  const [loading, setLoading] = useState(false);

  // IP Subnet
  const [ipInput, setIpInput] = useState("192.168.1.10");
  const [maskOrCidr, setMaskOrCidr] = useState("/24");
  const [subnetResult, setSubnetResult] = useState(null);

  // CIDR converter
  const [cidrInput, setCidrInput] = useState("24");
  const [maskInput, setMaskInput] = useState("255.255.255.0");

  // DNS generator (local compose) - publishing will call backend
  const [dnsType, setDnsType] = useState("A");
  const [dnsName, setDnsName] = useState("www.example.com");
  const [dnsValue, setDnsValue] = useState("198.51.100.10");
  const [dnsRecords, setDnsRecords] = useState([]);

  // MAC lookup (calls backend /api/oui)
  const [macInput, setMacInput] = useState("00:1A:2B:AA:BB:CC");
  const [macLookupResult, setMacLookupResult] = useState(null);

  // URL parser/builder
  const [urlInput, setUrlInput] = useState("https://example.com:8080/path?foo=bar#frag");
  const [urlParsed, setUrlParsed] = useState(null);
  const [builderScheme, setBuilderScheme] = useState("https");
  const [builderHost, setBuilderHost] = useState("example.com");
  const [builderPort, setBuilderPort] = useState("");
  const [builderPath, setBuilderPath] = useState("/");
  const [builderQuery, setBuilderQuery] = useState("a=1&b=2");
  const [builderHash, setBuilderHash] = useState("");

  // Ping (real backend)
  const [pingHost, setPingHost] = useState("example.com");
  const [pingCount, setPingCount] = useState(6);
  const [pingValues, setPingValues] = useState([]);

  // Reverse DNS
  const [reverseIp, setReverseIp] = useState("198.51.100.10");
  const [reverseResult, setReverseResult] = useState(null);

  // Port check
  const [portHost, setPortHost] = useState("192.168.1.1");
  const [portList, setPortList] = useState("22,80,443,8080");
  const [portResults, setPortResults] = useState([]);

  // Duplicate IP finder
  const [ipListText, setIpListText] = useState("192.168.1.1\n192.168.1.2\n192.168.1.1\n10.0.0.1\n10.0.0.1");
  const [duplicateResults, setDuplicateResults] = useState([]);

  // Topology (client-side visualizer)
  const [nodes, setNodes] = useState([
    { id: "n1", label: "Router", x: 80, y: 80 },
    { id: "n2", label: "Switch", x: 280, y: 80 },
    { id: "n3", label: "Server", x: 280, y: 200 },
  ]);
  const [edges, setEdges] = useState([{ id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n2", target: "n3" }]);
  const topologyRef = useRef(null);

  // --- URL param sync for ?tool=...
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tool");
      if (t && Object.values(TOOLS).includes(t) && t !== selectedTool) setSelectedTool(t);
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const pathname = window.location.pathname;
      const search = new URLSearchParams(window.location.search);
      if (selectedTool) search.set("tool", selectedTool);
      else search.delete("tool");
      const newUrl = `${pathname}${search.toString() ? `?${search.toString()}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    } catch (err) {}
  }, [selectedTool]);

  // ----------------- Implementations (call real backend endpoints) -----------------

  const calculateSubnet = useCallback(() => {
    try {
      setLoading(true);
      setSubnetResult(null);

      let cidr = null;
      if (maskOrCidr.startsWith("/")) {
        cidr = Number(maskOrCidr.slice(1));
      } else {
        cidr = maskToCidr(maskOrCidr);
      }
      if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) throw new Error("Invalid CIDR or mask");

      const ipInt = ipToInt(ipInput);
      if (ipInt == null) throw new Error("Invalid IP address");

      const maskInt = cidrToMaskInt(cidr);
      const networkInt = ipInt & maskInt;
      const broadcastInt = networkInt | (~maskInt >>> 0);
      const firstHost = cidr === 32 ? networkInt : networkInt + 1;
      const lastHost = cidr === 32 || cidr === 31 ? broadcastInt : broadcastInt - 1;
      const totalHosts = cidr === 32 ? 1 : cidr === 31 ? 2 : Math.max(0, (2 << (31 - cidr)) - 2);
      const usableHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : totalHosts;
      const wildcardInt = (~maskInt) >>> 0;

      const res = {
        ip: ipInput,
        cidr,
        netmask: intToIp(maskInt),
        network: intToIp(networkInt),
        broadcast: intToIp(broadcastInt),
        firstHost: intToIp(firstHost),
        lastHost: intToIp(lastHost),
        totalHosts,
        usableHosts,
        wildcard: intToIp(wildcardInt),
      };
      setSubnetResult(res);
      setResultText(JSON.stringify(res, null, 2));
    } catch (err) {
      showToast("error", err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [ipInput, maskOrCidr]);

  const convertCidrToMask = useCallback(() => {
    try {
      const c = Number(cidrInput);
      if (!Number.isInteger(c) || c < 0 || c > 32) throw new Error("Invalid CIDR");
      setMaskInput(cidrToMask(c));
    } catch (err) {
      showToast("error", err.message || String(err));
    }
  }, [cidrInput]);

  const convertMaskToCidr = useCallback(() => {
    try {
      const c = maskToCidr(maskInput);
      if (c == null) throw new Error("Invalid mask");
      setCidrInput(String(c));
    } catch (err) {
      showToast("error", err.message || String(err));
    }
  }, [maskInput]);

  // DNS record composer (client-side). Optionally publish via backend
  const addDnsRecord = useCallback(() => {
    if (!dnsName.trim() || !dnsValue.trim()) return showToast("error", "Name and value required");
    const rec = { id: uid(), type: dnsType, name: dnsName.trim(), value: dnsValue.trim() };
    setDnsRecords((s) => [rec, ...s]);
    setDnsValue("");
    setResultText(`Added DNS ${dnsType} ${dnsName} -> ${dnsValue}`);
  }, [dnsName, dnsValue, dnsType]);

  const publishDnsRecord = useCallback(async (record) => {
    // Example server endpoint: POST /api/dns/publish with JSON { record: { name,type,value } }
    try {
      setLoading(true);
      const resp = await fetch("/api/dns/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Publish failed: ${resp.status} ${txt}`);
      }
      const json = await resp.json();
      showToast("success", `Published: ${record.name} (${record.type})`);
      setResultText(JSON.stringify(json, null, 2));
    } catch (err) {
      showToast("error", err.message || "Publish failed");
      setResultText(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }, []);

  // MAC lookup: backend /api/oui?mac=00:1A:2B
  const lookupMac = useCallback(async () => {
    try {
      setLoading(true);
      const mac = macInput.trim().toUpperCase().replace(/-/g, ":");
      const parts = mac.split(":");
      if (parts.length < 3) throw new Error("Invalid MAC");
      const prefix = parts.slice(0, 3).join(":");
      const resp = await fetch(`/api/oui?mac=${encodeURIComponent(prefix)}`);
      if (!resp.ok) {
        // fallback: response might be 404 or server error
        const txt = await resp.text();
        throw new Error(txt || `OUI lookup failed ${resp.status}`);
      }
      const json = await resp.json();
      setMacLookupResult({ mac, oui: json.oui || prefix, vendor: json.vendor || "Unknown" });
      setResultText(JSON.stringify(json, null, 2));
    } catch (err) {
      showToast("error", err.message || String(err));
      setMacLookupResult(null);
    } finally {
      setLoading(false);
    }
  }, [macInput]);

  // URL parse & build (client)
  const parseUrl = useCallback(() => {
    try {
      const url = new URL(urlInput.trim());
      setUrlParsed({
        href: url.href,
        protocol: url.protocol.replace(":", ""),
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
      });
      setResultText(`Parsed ${url.href}`);
    } catch (err) {
      showToast("error", "Invalid URL");
      setUrlParsed(null);
    }
  }, [urlInput]);

  const buildUrl = useCallback(() => {
    try {
      const portPart = builderPort ? `:${builderPort}` : "";
      const query = builderQuery ? `?${builderQuery.replace(/^\?/, "")}` : "";
      const hash = builderHash ? `#${builderHash.replace(/^#/, "")}` : "";
      const href = `${builderScheme}://${builderHost}${portPart}${builderPath}${query}${hash}`;
      setUrlInput(href);
      setUrlParsed({
        href,
        protocol: builderScheme,
        hostname: builderHost,
        port: builderPort,
        pathname: builderPath,
        search: query,
        hash,
      });
      setResultText(`Built ${href}`);
    } catch (err) {
      showToast("error", err.message || String(err));
    }
  }, [builderScheme, builderHost, builderPort, builderPath, builderQuery, builderHash]);

  // Real Ping -> POST /api/ping { host, count } -> { values: [...] }
  const runPing = useCallback(async () => {
    try {
      setLoading(true);
      setPingValues([]);
      setResultText("");
      const resp = await fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: pingHost, count: pingCount }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `Ping failed ${resp.status}`);
      }
      const json = await resp.json();
      if (!Array.isArray(json.values)) throw new Error("Invalid response from ping endpoint");
      setPingValues(json.values);
      setResultText(`Ping to ${pingHost}: [${json.values.join(", ")}]`);
    } catch (err) {
      showToast("error", err.message || String(err));
      setPingValues([]);
    } finally {
      setLoading(false);
    }
  }, [pingHost, pingCount]);

  // Reverse DNS -> GET /api/reverse-dns?ip=...
  const runReverseDns = useCallback(async () => {
    try {
      setLoading(true);
      setReverseResult(null);
      setResultText("");
      const resp = await fetch(`/api/reverse-dns?ip=${encodeURIComponent(reverseIp)}`);
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `Reverse DNS failed ${resp.status}`);
      }
      const json = await resp.json();
      setReverseResult(json);
      setResultText(JSON.stringify(json, null, 2));
    } catch (err) {
      showToast("error", err.message || String(err));
      setReverseResult(null);
    } finally {
      setLoading(false);
    }
  }, [reverseIp]);

  // Port check -> POST /api/port-check { host, ports: [..] } -> { results: [ {port, open} ] }
  const runPortCheck = useCallback(async () => {
    try {
      setLoading(true);
      setPortResults([]);
      setResultText("");
      const ports = portList.split(/[, ]+/).map((p) => Number(p.trim())).filter(Boolean);
      if (!ports.length) throw new Error("No ports provided");
      const resp = await fetch("/api/port-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: portHost, ports }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `Port check failed ${resp.status}`);
      }
      const json = await resp.json();
      if (!Array.isArray(json.results)) throw new Error("Invalid response from port-check");
      setPortResults(json.results);
      setResultText(JSON.stringify(json.results, null, 2));
    } catch (err) {
      showToast("error", err.message || String(err));
      setPortResults([]);
    } finally {
      setLoading(false);
    }
  }, [portHost, portList]);

  // Duplicate finder (client)
  const findDuplicates = useCallback(() => {
    const lines = ipListText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const map = {};
    for (const l of lines) map[l] = (map[l] || 0) + 1;
    const duplicates = Object.entries(map).filter(([, c]) => c > 1).map(([ip, count]) => ({ ip, count }));
    setDuplicateResults(duplicates);
    setResultText(`Found ${duplicates.length} duplicates`);
    if (!duplicates.length) showToast("success", "No duplicates");
  }, [ipListText]);

  // Topology helpers (client)
  const addTopologyNode = useCallback(() => {
    const n = { id: `n${uid()}`, label: `Node ${nodes.length + 1}`, x: 60 + Math.random() * 360, y: 60 + Math.random() * 260 };
    setNodes((s) => [...s, n]);
  }, [nodes.length]);

  const addTopologyEdge = useCallback((sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const e = { id: `e${uid()}`, source: sourceId, target: targetId };
    setEdges((s) => [...s, e]);
  }, []);

  const exportTopologySVG = useCallback(() => {
    if (!topologyRef.current) return showToast("error", "No topology to export");
    const node = topologyRef.current;
    const svg = node.querySelector("svg");
    if (!svg) return showToast("error", "Topology is not renderable as SVG");
    const svgText = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `topology-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Exported SVG");
  }, []);

  // DNS resolve (query authoritative via backend DoH)
  const runDnsQuery = useCallback(async (name, type = "A") => {
    try {
      setLoading(true);
      setResultText("");
      const resp = await fetch(`/api/dns?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`);
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `DNS query failed ${resp.status}`);
      }
      const json = await resp.json();
      setResultText(JSON.stringify(json, null, 2));
      return json;
    } catch (err) {
      showToast("error", err.message || String(err));
      setResultText(String(err?.message || err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Render UI ---
  const dnsTextPreview = dnsRecords.map((r) => `${r.name}\tIN\t${r.type}\t${r.value}`).join("\n");

  const toolLabel = useMemo(() => {
    switch (selectedTool) {
      case TOOLS.IP_SUBNET: return "IP Subnet Calculator";
      case TOOLS.CIDR_CONVERTER: return "CIDR ↔ Netmask Converter";
      case TOOLS.DNS_GEN: return "DNS Record Generator";
      case TOOLS.MAC_LOOKUP: return "MAC Address Lookup";
      case TOOLS.URL_PARSER: return "URL Parser & Builder";
      case TOOLS.PING_REAL: return "Ping (real via backend)";
      case TOOLS.REVERSE_DNS: return "Reverse DNS (real via backend)";
      case TOOLS.PORT_CHECK: return "Port Availability (real via backend)";
      case TOOLS.DUPLICATE_IP: return "Duplicate IP Finder";
      case TOOLS.TOPOLOGY: return "Network Topology Visualizer";
      default: return "Networking Tool";
    }
  }, [selectedTool]);

  return (
    <div className="min-h-screen max-w-7xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Layers className="w-6 h-6 text-emerald-600" /> Networking Tools
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real network utilities — backend required for active network ops (ping, DNS, port checks).</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-3 bg-gray-50 dark:bg-zinc-900 px-3 py-2 rounded-lg border">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500">Mode</span>
              <span className="text-xs font-medium">Real / Backend-powered</span>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            <Zap className="w-4 h-4 mr-2" /> Integration notes
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tools</span>
                <Badge>{selectedTool === TOOLS.TOPOLOGY ? "Visualizer" : "Network"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select tool</Label>
                <Select value={selectedTool} onValueChange={(v) => setSelectedTool(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TOOLS.IP_SUBNET}>IP Subnet Calculator</SelectItem>
                    <SelectItem value={TOOLS.CIDR_CONVERTER}>CIDR ↔ Netmask Converter</SelectItem>
                    <SelectItem value={TOOLS.DNS_GEN}>DNS Record Generator</SelectItem>
                    <Separator />
                    <SelectItem value={TOOLS.MAC_LOOKUP}>MAC Address Lookup (backend)</SelectItem>
                    <SelectItem value={TOOLS.URL_PARSER}>URL Parser & Builder</SelectItem>
                    <SelectItem value={TOOLS.PING_REAL}>Ping (backend)</SelectItem>
                    <SelectItem value={TOOLS.REVERSE_DNS}>Reverse DNS (backend)</SelectItem>
                    <SelectItem value={TOOLS.PORT_CHECK}>Port Availability (backend)</SelectItem>
                    <Separator />
                    <SelectItem value={TOOLS.DUPLICATE_IP}>Duplicate IP Finder</SelectItem>
                    <SelectItem value={TOOLS.TOPOLOGY}>Topology Visualizer</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                {/* Dynamic inputs */}
                {selectedTool === TOOLS.IP_SUBNET && (
                  <>
                    <Label className="text-xs">IP address</Label>
                    <Input value={ipInput} onChange={(e) => setIpInput(e.target.value)} />
                    <Label className="text-xs mt-2">Netmask or CIDR</Label>
                    <Input value={maskOrCidr} onChange={(e) => setMaskOrCidr(e.target.value)} placeholder="/24 or 255.255.255.0" />
                    <div className="flex gap-2 mt-3">
                      <Button onClick={calculateSubnet} className="flex-1">Calculate</Button>
                      <Button variant="outline" onClick={() => { setSubnetResult(null); setResultText(""); }}>Clear</Button>
                    </div>
                  </>
                )}

                {selectedTool === TOOLS.CIDR_CONVERTER && (
                  <>
                    <Label className="text-xs">CIDR</Label>
                    <Input value={cidrInput} onChange={(e) => setCidrInput(e.target.value)} />
                    <div className="flex gap-2 mt-2">
                      <Button onClick={convertCidrToMask}>To Netmask</Button>
                      <Button variant="outline" onClick={() => { setCidrInput(""); setMaskInput(""); }}>Clear</Button>
                    </div>
                    <Label className="text-xs mt-3">Netmask</Label>
                    <Input value={maskInput} onChange={(e) => setMaskInput(e.target.value)} />
                    <div className="flex gap-2 mt-2">
                      <Button onClick={convertMaskToCidr}>To CIDR</Button>
                    </div>
                  </>
                )}

                {selectedTool === TOOLS.DNS_GEN && (
                  <>
                    <Label className="text-xs">Record type</Label>
                    <Select value={dnsType} onValueChange={setDnsType}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="CNAME">CNAME</SelectItem>
                        <SelectItem value="TXT">TXT</SelectItem>
                      </SelectContent>
                    </Select>

                    <Label className="text-xs mt-2">Name</Label>
                    <Input value={dnsName} onChange={(e) => setDnsName(e.target.value)} />
                    <Label className="text-xs mt-2">Value</Label>
                    <Input value={dnsValue} onChange={(e) => setDnsValue(e.target.value)} />
                    <div className="flex gap-2 mt-3">
                      <Button onClick={addDnsRecord}>Add</Button>
                      <Button variant="outline" onClick={() => setDnsRecords([])}>Clear</Button>
                    </div>

                    <div className="text-xs mt-2">To publish DNS records programmatically, implement a server endpoint (e.g., /api/dns/publish) that calls your DNS provider (Cloudflare, Route53).</div>
                  </>
                )}

                {selectedTool === TOOLS.MAC_LOOKUP && (
                  <>
                    <Label className="text-xs">MAC address (lookup OUI)</Label>
                    <Input value={macInput} onChange={(e) => setMacInput(e.target.value)} />
                    <div className="flex gap-2 mt-2">
                      <Button onClick={lookupMac}>Lookup</Button>
                      <Button variant="outline" onClick={() => { setMacInput(""); setMacLookupResult(null); setResultText(""); }}>Clear</Button>
                    </div>
                    <div className="text-xs mt-2">This performs a backend OUI lookup. Implement /api/oui to query IANA OUI database or a cached copy.</div>
                  </>
                )}

                {selectedTool === TOOLS.URL_PARSER && (
                  <>
                    <Label className="text-xs">URL to parse</Label>
                    <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                    <div className="flex gap-2 mt-2">
                      <Button onClick={parseUrl}>Parse</Button>
                      <Button variant="outline" onClick={() => { setUrlInput(""); setUrlParsed(null); }}>Clear</Button>
                    </div>

                    <Separator />

                    <Label className="text-xs">URL Builder</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={builderScheme} onValueChange={setBuilderScheme}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="https">https</SelectItem><SelectItem value="http">http</SelectItem></SelectContent></Select>
                      <Input value={builderHost} onChange={(e) => setBuilderHost(e.target.value)} />
                      <Input placeholder="port" value={builderPort} onChange={(e) => setBuilderPort(e.target.value)} />
                      <Input placeholder="path" value={builderPath} onChange={(e) => setBuilderPath(e.target.value)} />
                      <Input placeholder="query" value={builderQuery} onChange={(e) => setBuilderQuery(e.target.value)} />
                      <Input placeholder="hash" value={builderHash} onChange={(e) => setBuilderHash(e.target.value)} />
                    </div>
                    <div className="flex gap-2 mt-2"><Button onClick={buildUrl}>Build</Button></div>
                  </>
                )}

                {selectedTool === TOOLS.PING_REAL && (
                  <>
                    <Label className="text-xs">Host</Label>
                    <Input value={pingHost} onChange={(e) => setPingHost(e.target.value)} />
                    <Label className="text-xs mt-2">Count</Label>
                    <Input type="number" value={pingCount} onChange={(e) => setPingCount(Number(e.target.value || 1))} />
                    <div className="flex gap-2 mt-2">
                      <Button onClick={runPing}>Run Ping</Button>
                      <Button variant="outline" onClick={() => { setPingValues([]); setResultText(""); }}>Clear</Button>
                    </div>
                    <div className="text-xs mt-2">Server must implement /api/ping to execute ICMP/TTL-based pings and return timings.</div>
                  </>
                )}

                {selectedTool === TOOLS.REVERSE_DNS && (
                  <>
                    <Label className="text-xs">IP to reverse lookup</Label>
                    <Input value={reverseIp} onChange={(e) => setReverseIp(e.target.value)} />
                    <div className="flex gap-2 mt-2"><Button onClick={runReverseDns}>Lookup</Button><Button variant="outline" onClick={() => { setReverseResult(null); setResultText(""); }}>Clear</Button></div>
                    <div className="text-xs mt-2">Server-side DNS-over-HTTPS (DoH) recommended for reliability.</div>
                  </>
                )}

                {selectedTool === TOOLS.PORT_CHECK && (
                  <>
                    <Label className="text-xs">Host</Label>
                    <Input value={portHost} onChange={(e) => setPortHost(e.target.value)} />
                    <Label className="text-xs mt-2">Ports (comma separated)</Label>
                    <Input value={portList} onChange={(e) => setPortList(e.target.value)} />
                    <div className="flex gap-2 mt-2"><Button onClick={runPortCheck}>Check Ports</Button><Button variant="outline" onClick={() => { setPortResults([]); setResultText(""); }}>Clear</Button></div>
                    <div className="text-xs mt-2">Server must attempt TCP connects and return results. Protect this endpoint properly (auth & rate limit).</div>
                  </>
                )}

                {selectedTool === TOOLS.DUPLICATE_IP && (
                  <>
                    <Label className="text-xs">Paste IPs (one per line)</Label>
                    <Textarea value={ipListText} onChange={(e) => setIpListText(e.target.value)} className="min-h-[120px]" />
                    <div className="flex gap-2 mt-2"><Button onClick={findDuplicates}>Find duplicates</Button><Button variant="outline" onClick={() => { setIpListText(""); setDuplicateResults([]); }}>Clear</Button></div>
                  </>
                )}

                {selectedTool === TOOLS.TOPOLOGY && (
                  <>
                    <Label className="text-xs">Topology editor</Label>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={addTopologyNode}>Add node</Button>
                      <Button onClick={() => addTopologyEdge(nodes[nodes.length - 1]?.id, nodes[0]?.id)}>Connect last → first</Button>
                      <Button variant="outline" onClick={() => { setNodes([]); setEdges([]); }}>Clear</Button>
                    </div>
                    <div className="text-xs mt-2">Drag nodes in the preview to reposition; export SVG for diagrams.</div>
                  </>
                )}

                <Separator />

                <div className="text-xs text-muted-foreground">Results appear in the center panel. Real operations require a backend — see integration notes.</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: results */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedTool === TOOLS.PING_REAL ? <Activity className="w-4 h-4" /> : <Server className="w-4 h-4" />} {toolLabel}
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1">Backend-powered network tools where needed; local computation when possible.</div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(resultText || ""); showToast("success", "Copied result"); }}><Copy className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  const blob = new Blob([resultText || ""], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `net-result-${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}><Download className="w-4 h-4" /></Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-900/50 min-h-[260px]">
                {/* IP Subnet */}
                {selectedTool === TOOLS.IP_SUBNET && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Input</div>
                        <div className="font-mono text-sm mt-1">{ipInput} {maskOrCidr}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Calculated</div>
                        <div className="font-medium mt-1">{subnetResult ? `${subnetResult.network}/${subnetResult.cidr}` : "—"}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    {subnetResult ? (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Network</strong><div className="text-xs mt-1">{subnetResult.network}</div></div>
                        <div><strong>Broadcast</strong><div className="text-xs mt-1">{subnetResult.broadcast}</div></div>
                        <div><strong>Netmask</strong><div className="text-xs mt-1">{subnetResult.netmask}</div></div>
                        <div><strong>Wildcard</strong><div className="text-xs mt-1">{subnetResult.wildcard}</div></div>
                        <div><strong>First host</strong><div className="text-xs mt-1">{subnetResult.firstHost}</div></div>
                        <div><strong>Last host</strong><div className="text-xs mt-1">{subnetResult.lastHost}</div></div>
                        <div><strong>Usable hosts</strong><div className="text-xs mt-1">{subnetResult.usableHosts}</div></div>
                        <div><strong>Total (incl.)</strong><div className="text-xs mt-1">{subnetResult.totalHosts}</div></div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Click Calculate to compute subnet details.</div>
                    )}
                  </>
                )}

                {/* CIDR */}
                {selectedTool === TOOLS.CIDR_CONVERTER && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">CIDR</div>
                        <div className="font-mono mt-1">{cidrInput}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Netmask</div>
                        <div className="font-mono mt-1">{maskInput}</div>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="text-sm">Conversions run client-side and are exact bitwise conversions.</div>
                  </>
                )}

                {/* DNS generator */}
                {selectedTool === TOOLS.DNS_GEN && (
                  <>
                    <div className="text-sm mb-2">Compose DNS records and optionally publish via a server-side provider integration.</div>
                    <div className="rounded p-3 bg-white/60 dark:bg-zinc-900/60">
                      <pre className="whitespace-pre-wrap text-sm">{dnsTextPreview || "No records yet"}</pre>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => { navigator.clipboard.writeText(dnsTextPreview || ""); showToast("success", "Copied DNS snippet"); }}>Copy</Button>
                      <Button variant="outline" onClick={() => setDnsRecords([])}>Clear</Button>
                      <Button onClick={() => {
                        if (!dnsRecords.length) return showToast("error", "No records to publish");
                        // publish first record as example
                        publishDnsRecord(dnsRecords[0]);
                      }} variant="secondary">Publish (example)</Button>
                    </div>
                  </>
                )}

                {/* MAC lookup */}
                {selectedTool === TOOLS.MAC_LOOKUP && (
                  <>
                    <div className="text-sm mb-2">OUI lookup via backend (recommended). Server should serve /api/oui?mac=00:1A:2B</div>
                    <div className="rounded p-3 bg-white/60 dark:bg-zinc-900/60">
                      {macLookupResult ? (
                        <div className="text-sm">
                          <div><strong>MAC</strong> {macLookupResult.mac}</div>
                          <div className="mt-1"><strong>OUI</strong> {macLookupResult.oui}</div>
                          <div className="mt-1"><strong>Vendor</strong> {macLookupResult.vendor}</div>
                        </div>
                      ) : <div className="text-sm text-muted-foreground">Lookup a MAC to see vendor</div>}
                    </div>
                  </>
                )}

                {/* URL parser */}
                {selectedTool === TOOLS.URL_PARSER && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Input URL</div>
                        <div className="font-mono mt-1">{urlInput}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Preview</div>
                        <div className="mt-1 text-sm">{urlParsed ? <a href={urlParsed.href} target="_blank" rel="noreferrer">{urlParsed.href}</a> : "—"}</div>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    {urlParsed ? (
                      <div className="text-sm">
                        <div><strong>Scheme</strong> {urlParsed.protocol}</div>
                        <div><strong>Host</strong> {urlParsed.hostname}</div>
                        <div><strong>Port</strong> {urlParsed.port || "—"}</div>
                        <div><strong>Path</strong> {urlParsed.pathname}</div>
                        <div><strong>Query</strong> {urlParsed.search || "—"}</div>
                        <div><strong>Hash</strong> {urlParsed.hash || "—"}</div>
                      </div>
                    ) : <div className="text-sm text-muted-foreground">Parsed components appear here.</div>}
                  </>
                )}

                {/* Ping (real) */}
                {selectedTool === TOOLS.PING_REAL && (
                  <>
                    <div className="text-sm">Server-side ping; results below.</div>
                    <div className="mt-3">{pingValues.length ? <PingGraph values={pingValues} /> : <div className="text-sm text-muted-foreground">No ping results yet</div>}</div>
                    {pingValues.length > 0 && (
                      <div className="mt-3 text-sm">
                        <div><strong>Min:</strong> {Math.min(...pingValues)} ms</div>
                        <div><strong>Max:</strong> {Math.max(...pingValues)} ms</div>
                        <div><strong>Avg:</strong> {Math.round(pingValues.reduce((a,b)=>a+b,0)/pingValues.length)} ms</div>
                      </div>
                    )}
                  </>
                )}

                {/* Reverse DNS */}
                {selectedTool === TOOLS.REVERSE_DNS && (
                  <>
                    <div className="text-sm">Real reverse DNS via backend DoH query.</div>
                    <div className="mt-3">
                      {reverseResult ? (
                        <div className="text-sm">
                          <div><strong>IP</strong> {reverseResult.ip}</div>
                          <div className="mt-1"><strong>PTR</strong> {reverseResult.ptr || "—"}</div>
                        </div>
                      ) : <div className="text-sm text-muted-foreground">No result yet</div>}
                    </div>
                  </>
                )}

                {/* Port check */}
                {selectedTool === TOOLS.PORT_CHECK && (
                  <>
                    <div className="text-sm">Real port check via backend TCP connect. The server must be secured and rate-limited.</div>
                    <div className="mt-3">
                      {portResults.length ? (
                        <div className="grid grid-cols-2 gap-2">
                          {portResults.map((r) => (
                            <div key={r.port} className="flex items-center justify-between border rounded p-2">
                              <div>
                                <div className="font-mono">{r.port}</div>
                                <div className="text-xs text-muted-foreground">{r.service || "-"}</div>
                              </div>
                              <div className={clsx("px-2 py-1 rounded text-xs font-medium", r.open ? "bg-emerald-100 text-emerald-800" : "bg-rose-50 text-rose-700")}>
                                {r.open ? "open" : "closed"}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-sm text-muted-foreground">No results — run check to query backend</div>}
                    </div>
                  </>
                )}

                {/* Duplicate IP */}
                {selectedTool === TOOLS.DUPLICATE_IP && (
                  <>
                    <div className="text-sm">Paste IPs to find duplicates.</div>
                    <div className="mt-3">
                      {duplicateResults.length ? (
                        <div className="text-sm">
                          <div><strong>Duplicates</strong></div>
                          <ul className="list-disc ml-5 mt-2">
                            {duplicateResults.map((d) => <li key={d.ip}>{d.ip} — {d.count} times</li>)}
                          </ul>
                        </div>
                      ) : <div className="text-sm text-muted-foreground">No duplicates found</div>}
                    </div>
                  </>
                )}

                {/* Topology */}
                {selectedTool === TOOLS.TOPOLOGY && (
                  <>
                    <div className="text-sm mb-2">Interactive topology. Export as SVG for documentation.</div>
                    <div ref={topologyRef} className="rounded border p-3 bg-white/60 dark:bg-zinc-900/60" style={{ minHeight: 240 }}>
                      <TopologyCanvas nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} />
                    </div>
                    <div className="flex gap-2 mt-3"><Button onClick={exportTopologySVG}>Export SVG</Button><Button variant="outline" onClick={() => { setNodes([]); setEdges([]); }}>Clear</Button></div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Right column: details & quick actions */}
        <aside className="lg:col-span-3">
          <div className="space-y-4 sticky top-24">
            <Card className="shadow-sm">
              <CardHeader><CardTitle>Result & Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Result</div>
                    <div className="mt-2 rounded p-2 bg-white/60 dark:bg-zinc-900/60 font-mono text-sm overflow-auto max-h-52">{resultText || <span className="text-muted-foreground">No result yet</span>}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { navigator.clipboard.writeText(resultText || ""); showToast("success", "Copied"); }}><Copy className="w-4 h-4" /> Copy</Button>
                    <Button size="sm" variant="outline" onClick={() => { const b = new Blob([resultText || ""], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `net-result-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(u); }}><Download className="w-4 h-4" /> Save</Button>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">Notes</div>
                  <ul className="list-disc ml-5 text-xs">
                    <li>Active network ops (ping, port checks, reverse DNS) are executed on the backend. This page calls server endpoints and presents results.</li>
                    <li>Protect server endpoints: require authentication, rate-limit, and validate inputs to avoid abuse.</li>
                    <li>DNS publishing requires provider API credentials server-side (Cloudflare, AWS Route53, etc.).</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle>Utilities</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setResultText(""); showToast("success", "Cleared"); }}>Clear result</Button>
                  <Button size="sm" variant="ghost" onClick={() => window.print()}>Print</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Integration notes</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              This page expects backend endpoints to perform network actions that browsers cannot (ICMP, TCP connect, DoH). Example server endpoints you should implement:
            </p>
            <ul className="list-disc ml-5 mt-2 text-sm">
              <li><code>POST /api/ping</code> — body: <code>{'{ host,count }'}</code>, returns <code>{'{ values: number[] }'}</code></li>
              <li><code>POST /api/port-check</code> — body: <code>{'{ host, ports: number[] }'}</code>, returns <code>{'{ results: [{port,open}] }'}</code></li>
              <li><code>GET /api/dns?name=...&type=...</code> — resolves via DoH and returns parsed answers</li>
              <li><code>GET /api/reverse-dns?ip=...</code> — PTR lookup</li>
              <li><code>GET /api/oui?mac=00:1A:2B</code> — return vendor info</li>
            </ul>
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

/** TopologyCanvas component (interactive, client-side) */
function TopologyCanvas({ nodes = [], edges = [], setNodes, setEdges }) {
  const [dragging, setDragging] = useState(null);
  const svgRef = useRef(null);

  const onMouseDown = (e, node) => {
    e.preventDefault();
    setDragging({ id: node.id, offsetX: e.clientX - node.x, offsetY: e.clientY - node.y });
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const { id, offsetX, offsetY } = dragging;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const onMouseUp = () => setDragging(null);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  const width = 560;
  const height = 320;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-[320px] bg-transparent">
      {edges.map((e) => {
        const s = nodes.find((n) => n.id === e.source);
        const t = nodes.find((n) => n.id === e.target);
        if (!s || !t) return null;
        return <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" />;
      })}

      {nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x}, ${n.y})`} style={{ cursor: "grab" }}>
          <circle r={28} cx={0} cy={0} fill="#0ea5a0" opacity={0.12} />
          <rect x={-40} y={-22} width={80} height={44} rx={8} fill="#0b1220" opacity={0.9} />
          <text x={0} y={4} fontSize="11" fill="#fff" textAnchor="middle">{n.label}</text>
          <rect x={-40} y={-28} width={80} height={56} fill="transparent" onMouseDown={(e) => onMouseDown(e, n)} />
        </g>
      ))}
    </svg>
  );
}
