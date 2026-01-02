"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Database,
  FileJson,
  FileSpreadsheet,
  FileText,
  Copy,
  Download,
  CheckSquare,
  RefreshCw,
  Settings2
} from "lucide-react";

import MDEditor from "@uiw/react-md-editor";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTheme } from "../components/theme-provider";

/* ----------------------- MOCK DATA POOLS ----------------------- */

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
  "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
  "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",

  // ➕ added names
  "Andrew", "Emily", "Joshua", "Michelle", "Ryan", "Amanda", "Brandon", "Melissa", "Justin", "Stephanie",
  "Kevin", "Rebecca", "Brian", "Laura", "Eric", "Hannah", "Jason", "Rachel", "Aaron", "Megan",
  "Adam", "Olivia", "Sean", "Natalie", "Kyle", "Victoria", "Ethan", "Samantha", "Dylan", "Claire"
];


const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",

  // ➕ added last names
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reed"
];


const DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "company.net",
  "tech.io",

  // ➕ added domains
  "example.com",
  "mail.com",
  "proton.me",
  "icloud.com",
  "fastmail.com",
  "zoho.com",
  "hey.com",
  "gmx.com",
  "yandex.com",
  "aol.com",

  "corp.com",
  "enterprise.io",
  "startup.dev",
  "digital.co",
  "software.ai",
  "cloudhub.net",
  "datatech.org",
  "devmail.io",
  "appstack.com",
  "productlabs.io",

  "consulting.co",
  "businessmail.com",
  "workplace.io",
  "teammail.dev",
  "opscloud.net",
  "analytics.ai",
  "growthlabs.io",
  "fintechhub.com",
  "saasmail.io",
  "platform.tech"
];

const COMPANIES = [
  "Acme Corp",
  "Globex",
  "Soylent Corp",
  "Initech",
  "Umbrella Corp",
  "Stark Industries",
  "Wayne Enterprises",
  "Cyberdyne Systems",
  "Massive Dynamic",

  // ➕ added companies
  "NovaTech Solutions",
  "BluePeak Systems",
  "QuantumSoft",
  "Apex Innovations",
  "CloudNest",
  "Vertex Labs",
  "Ironclad Technologies",
  "NextGen Dynamics",
  "BrightWave Analytics",
  "Skyline Systems",
  "CoreLogic Labs",
  "Nimbus Networks",
  "PulseTech",
  "Zenith Works",
  "DataForge",
  "Orion Technologies",
  "Helix Solutions",
  "FusionPoint",
  "Redwood Digital",
  "Atlas Software",
  "LunarTech",
  "Catalyst Systems",
  "ElevateX",
  "Stratos AI",
  "OmniStack",
  "VectorSoft",
  "PixelBridge",
  "Infinity Labs",
  "Echo Systems",
  "Hyperion Group"
];

const JOBS = [
  "Software Engineer",
  "Product Manager",
  "HR Specialist",
  "Data Analyst",
  "Designer",
  "Marketing Lead",
  "Sales Representative",
  "Chief Technology Officer",
  "Chief Executive Officer",

  // ➕ added roles
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "QA Engineer",
  "Machine Learning Engineer",
  "AI Researcher",
  "Cloud Architect",
  "Security Engineer",
  "Mobile App Developer",
  "UI/UX Designer",
  "Technical Writer",
  "Product Owner",
  "Scrum Master",
  "Business Analyst",
  "Customer Success Manager",
  "Growth Manager",
  "Digital Marketing Specialist",
  "SEO Strategist",
  "Content Strategist",
  "Solutions Architect",
  "Data Engineer",
  "Analytics Manager",
  "Engineering Manager",
  "VP of Engineering",
  "Director of Technology",
  "Operations Manager",
  "IT Administrator",
  "Platform Engineer"
];

const CITIES = [
  "New York", "London", "Tokyo", "Paris", "Berlin", "Sydney", "Toronto", "Mumbai", "Dubai", "Singapore",

  // ➕ added cities
  "San Francisco", "Los Angeles", "Chicago", "Seattle", "Boston",
  "Austin", "Denver", "Vancouver", "Montreal", "Calgary",
  "Amsterdam", "Madrid", "Barcelona", "Rome", "Milan",
  "Zurich", "Vienna", "Stockholm", "Oslo", "Copenhagen",
  "Seoul", "Hong Kong", "Bangkok", "Kuala Lumpur", "Jakarta",
  "São Paulo", "Buenos Aires", "Mexico City", "Lima", "Santiago"
];

const STREETS = [
  "Main St", "Broadway", "Park Ave", "Oak Ln", "Maple Dr",
  "Cedar Rd", "Pine St", "Elm St", "Washington Ave",

  // ➕ added streets
  "Market St", "Highland Ave", "Sunset Blvd", "Lexington Ave", "Madison Ave",
  "Riverside Dr", "Lakeview Rd", "Hillcrest Ave", "Meadow Ln", "Forest Dr",
  "Chestnut St", "Willow Rd", "Spruce St", "Birch Ave", "Sycamore Ln",
  "Kingsway", "Queens Rd", "Victoria St", "Regent St", "Baker St",
  "Canal St", "Union Ave", "Franklin St", "Jefferson Blvd", "Monroe St",
  "College Ave", "Railroad St", "Church St", "Mill Rd", "Harbor Dr"
];


/* ----------------------- CONFIG ----------------------- */

const FIELDS = [
  { key: "id", label: "ID (Auto-increment)" },
  { key: "name", label: "Full Name" },
  { key: "email", label: "Email Address" },
  { key: "phone", label: "Phone Number" },
  { key: "address", label: "Address" },
  { key: "company", label: "Company Name" },
  { key: "job", label: "Job Title" },
  { key: "created_at", label: "Created Date" },
];

const FORMATS = [
  { value: "json", label: "JSON", icon: FileJson },
  { value: "csv", label: "CSV", icon: FileSpreadsheet },
  { value: "sql", label: "SQL", icon: Database },
];

/* ----------------------- GENERATOR LOGIC ----------------------- */

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomPhone() {
  return `+1-${Math.floor(Math.random() * 800 + 200)}-${Math.floor(Math.random() * 800 + 200)}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function generateUniqueData(count, fields) {
  const data = [];
  const usedNames = new Set();
  
  for (let i = 0; i < count; i++) {
    const row = {};
    
    // 1. Generate Unique Name
    let firstName = randomItem(FIRST_NAMES);
    let lastName = randomItem(LAST_NAMES);
    let fullName = `${firstName} ${lastName}`;
    
    // Simple collision avoidance for names
    let attempts = 0;
    while (usedNames.has(fullName) && attempts < 50) {
      firstName = randomItem(FIRST_NAMES);
      lastName = randomItem(LAST_NAMES);
      fullName = `${firstName} ${lastName}`;
      attempts++;
    }
    // Fallback if we run out of combinations (rare for small datasets)
    if (usedNames.has(fullName)) {
      fullName = `${fullName} ${i + 1}`;
    }
    usedNames.add(fullName);

    // 2. Populate Fields
    if (fields.includes("id")) row.id = i + 1;
    if (fields.includes("name")) row.name = fullName;
    if (fields.includes("email")) row.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomItem(DOMAINS)}`;
    if (fields.includes("phone")) row.phone = generateRandomPhone();
    if (fields.includes("address")) row.address = `${Math.floor(Math.random() * 999) + 1} ${randomItem(STREETS)}, ${randomItem(CITIES)}`;
    if (fields.includes("company")) row.company = randomItem(COMPANIES);
    if (fields.includes("job")) row.job = randomItem(JOBS);
    if (fields.includes("created_at")) row.created_at = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString();

    data.push(row);
  }
  return data;
}

/* ----------------------- FORMATTERS ----------------------- */

function toJSON(data) {
  return JSON.stringify(data, null, 2);
}

function toCSV(data) {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((r) => 
    Object.values(r).map(val => `"${val}"`).join(",") // Wrap values in quotes for CSV safety
  );
  return [headers, ...rows].join("\n");
}

function toSQL(data, tableName = "dummy_users") {
  if (data.length === 0) return "";
  const keys = Object.keys(data[0]);
  
  // 1. Generate CREATE TABLE
  const createTable = [
    `DROP TABLE IF EXISTS ${tableName};`,
    `CREATE TABLE ${tableName} (`,
    ...keys.map((k, index) => {
      let type = "VARCHAR(255)";
      if (k === "id") type = "INT PRIMARY KEY";
      if (k === "created_at") type = "TIMESTAMP";
      const comma = index < keys.length - 1 ? "," : "";
      return `  ${k} ${type}${comma}`;
    }),
    `);`
  ].join("\n");

  // 2. Generate INSERTS
  const inserts = data.map((row) => {
    const values = keys.map((k) => {
      const val = row[k];
      if (typeof val === "number") return val;
      // Escape single quotes for SQL safety (e.g., O'Connor -> O''Connor)
      return `'${String(val).replace(/'/g, "''")}'`;
    }).join(", ");
    
    return `INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${values});`;
  }).join("\n");

  return `${createTable}\n\n${inserts}`;
}

/* ----------------------- PAGE COMPONENT ----------------------- */

export default function DummyDataGeneratorPage() {
  const [format, setFormat] = useState("json");
  const [rows, setRows] = useState(10);
  const [tableName, setTableName] = useState("users");
  const [selectedFields, setSelectedFields] = useState(FIELDS.map((f) => f.key));
  const [generatedData, setGeneratedData] = useState([]);

   const {theme}=useTheme()
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Regenerate data only when config changes
  useEffect(() => {
    setGeneratedData(generateUniqueData(rows, selectedFields));
  }, [rows, selectedFields]);

  // Compute output string
  const output = useMemo(() => {
    if (!generatedData.length) return "";
    if (format === "json") return toJSON(generatedData);
    if (format === "csv") return toCSV(generatedData);
    if (format === "sql") return toSQL(generatedData, tableName);
    return "";
  }, [generatedData, format, tableName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dummy_data_${new Date().getTime()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started");
  };

  const handleRefresh = () => {
    setGeneratedData(generateUniqueData(rows, selectedFields));
    toast.info("Data regenerated");
  };

  return (
    <div className="max-w-8xl mx-auto px-4 py-8 space-y-6 font-sans">
{/* HEADER */}
<header
  className="
    flex  gap-4
    flex-row md:items-center md:justify-between

  "
>
  {/* Left: Title */}
  <div className="flex items-start gap-3">


    <div>
      <h1
        className="
          text-xl sm:text-2xl md:text-3xl
          font-semibold tracking-tight
          text-zinc-900 dark:text-zinc-100
        "
      >
        Dummy Data Generator
      </h1>
      <p
        className="
          mt-1 max-w-xl
          text-sm sm:text-base
          text-zinc-500 dark:text-zinc-500
        "
      >
        Generate realistic, unique test data for your applications.
      </p>
    </div>
  </div>

  {/* Right: Actions */}
  <div className="flex items-center gap-2 sm:gap-3">
    <Button
      variant="outline"
      onClick={handleRefresh}
      className="
        rounded-full
        border-zinc-300 dark:border-zinc-700
        text-zinc-700 dark:text-zinc-200
        hover:bg-zinc-100 dark:hover:bg-zinc-800
      "
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      <span className="hidden sm:inline">Regenerate</span>
      <span className="sm:hidden">Refresh</span>
    </Button>
  </div>
</header>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR CONFIGURATION */}
<aside className="lg:col-span-3 w-full">
  <Card className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-sm">
    
    {/* Header */}
    <CardHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 backdrop-blur">
      <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
        <Settings2 className="h-4 w-4 text-zinc-500" />
        Configuration
      </CardTitle>
    </CardHeader>

    <CardContent className="pt-6 space-y-7">

      {/* Output Format */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Output Format
        </label>

        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger className="cursor-pointer bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
            <SelectValue />
          </SelectTrigger>

          <SelectContent className="dark:bg-zinc-950 dark:border-zinc-800">
            {FORMATS.map((f) => (
              <SelectItem className="cursor-pointer" key={f.value} value={f.value}>
                <div className="flex items-center gap-2 text-sm">
                  <f.icon className="h-4 w-4 text-zinc-500" />
                  {f.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Records
          </label>
          <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200">
            {rows}
          </span>
        </div>

        <Slider
          value={[rows]}
          min={1}
          max={1000}
          step={1}
          onValueChange={(v) => setRows(v[0])}
          className="w-full cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">
          <span>1</span>
          <span>1000</span>
        </div>
      </div>

      {/* SQL Table Name */}
      {format === "sql" && (
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Table Name
          </label>
          <Input
            value={tableName}
            onChange={(e) =>
              setTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
            }
            placeholder="users"
            className="rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
          />
        </div>
      )}

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      {/* Field Selection */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Included Fields
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {FIELDS.map((f) => (
            <label
              key={f.key}
              htmlFor={f.key}
              className="
                flex items-center gap-3
                rounded-xl border border-zinc-200 dark:border-zinc-800
                bg-zinc-50 dark:bg-zinc-950
                px-3 py-2.5
                cursor-pointer
                transition-colors
                hover:bg-white dark:hover:bg-zinc-900
              "
            >
              <Checkbox
                id={f.key}
                checked={selectedFields.includes(f.key)}
                onCheckedChange={(checked) =>
                  setSelectedFields((prev) =>
                    checked
                      ? [...prev, f.key]
                      : prev.filter((x) => x !== f.key)
                  )
                }
              />
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {f.label}
              </span>
            </label>
          ))}
        </div>
      </div>

    </CardContent>
  </Card>
</aside>


        {/* OUTPUT PREVIEW */}
        <main className="lg:col-span-9 h-full">
<Card
  className="
    h-full flex flex-col
    border border-zinc-200 dark:border-zinc-800
    bg-white dark:bg-zinc-950
    rounded-2xl
    shadow-sm
    overflow-hidden
  "
>
  {/* ===== Header ===== */}
  <CardHeader
    className="
      flex flex-col sm:flex-row
      items-start sm:items-center
      justify-between gap-3
      px-4 py-3
      border-b border-zinc-200 dark:border-zinc-800
      bg-zinc-50 dark:bg-zinc-900/60
      backdrop-blur
    "
  >
    {/* Title */}
    <div className="flex items-center gap-3">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Preview
      </h3>

      <Badge
        variant="secondary"
        className="
          font-mono text-[10px] tracking-wider
          bg-zinc-100 dark:bg-zinc-800
          text-zinc-700 dark:text-zinc-300
        "
      >
        {format.toUpperCase()}
      </Badge>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1.5 w-full sm:w-auto">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCopy}
        className="
          h-8 px-3
          text-zinc-600 dark:text-zinc-400
          hover:text-zinc-900 dark:hover:text-zinc-100
        "
      >
        <Copy className="w-4 h-4 mr-1.5" />
        Copy
      </Button>

      <Button
        size="sm"
        onClick={handleDownload}
        className="
          h-8 px-3
          bg-zinc-900 text-white
          hover:bg-zinc-800
          dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200
        "
      >
        <Download className="w-4 h-4 mr-1.5" />
        Download
      </Button>
    </div>
  </CardHeader>

  {/* ===== Content ===== */}
  <CardContent
    className="
      relative flex-1 p-0
      min-h-[280px] sm:min-h-[360px] lg:min-h-[480px]
    
      text-zinc-100
    "
  >
    <div className="absolute inset-0 overflow-auto custom-scrollbar">
          <div data-color-mode={isDark ? "dark" : "light"}
                    className="prose prose-invert sm:max-w-5xl sm:mx-auto dark:bg-[#0a0a0a] bg-white text-neutral-200  ">
                        <div className="wmde-markdown-var"> </div>
                             <MDEditor.Markdown
          source={`\`\`\`${format}\n${output}\n\`\`\``}
          style={{
            backgroundColor: "transparent",
            fontSize: "13px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            lineHeight: 1.6,
          }}
        />
        </div>

    </div>

    {/* Subtle Focus Ring */}
    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
  </CardContent>
</Card>

        </main>

      </div>
    </div>
  );
}