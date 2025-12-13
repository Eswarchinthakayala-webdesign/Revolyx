// src/pages/CalculatorsPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Layers,
  Sparkles,
  Loader2,
  Copy,
  Download,
  Zap,
  Settings,
  Calendar as CalendarIcon,
  X,
  CalendarCheck,
  CalendarRange,
  CalendarDays,
  Hourglass,
  Timer,
  Sigma,
  Percent,
  Calculator,
  Hash,
  DivideCircle,
  BarChart3,
  Ruler,
  Wallet,
  Receipt,
  DollarSign,
  AlertCircle,
   TrendingUp,
   Merge,
   Link2,
   CreditCard,
   Tag,
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { toast } from "sonner";
import { format } from "date-fns";


// This page follows the same layout / theme as your UnitMeasurementTools page.
// Reference: UnitMeasurementTools.jsx. :contentReference[oaicite:1]{index=1}

const TOOLS = [
  "AdSense Calculator",
  "Age Calculator",
  "Percentage Calculator",
  "Average Calculator",
  "Confidence Interval Calculator",
  "Sales Tax Calculator",
  "Margin Calculator",
  "Probability Calculator",
  "PayPal Fee Calculator",
  "Discount Calculator",
  "CPM Calculator",
  "Loan Calculator",
  "GST Calculator",
];

function fmtMoney(n) {
  if (n === "" || n == null || Number.isNaN(Number(n))) return "—";
  return Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(n));
}
function fmtNumber(n, digits = 2) {
  if (n === "" || n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(digits);
}

function formatDisplay(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}



function toISODateUTC(date) {
  if (!date) return "";
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )).toISOString().slice(0, 10);
}

 function DatePickerBlock({ label, value, setValue, showClear, showToday }) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  const [inputText, setInputText] = React.useState(
    selectedDate ? formatDisplay(selectedDate) : ""
  );

  React.useEffect(() => {
    setInputText(selectedDate ? formatDisplay(selectedDate) : "");
  }, [value]);

  const handleInputChange = (e) => {
    const txt = e.target.value;
    setInputText(txt);

    const parsed = new Date(txt);
    if (!isNaN(parsed.getTime())) {
      setValue(toISODateUTC(parsed));   // <-- FIX HERE
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium">{label}</Label>

      <div className="relative flex items-center gap-2">
        <Input
          value={inputText}
          placeholder="January 26, 2025"
          className="bg-white/60 dark:bg-zinc-900/60 pr-10"
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 size-7"
            >
              <CalendarIcon className="w-4 h-4 opacity-70" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (!d) return;
                setValue(toISODateUTC(d));  // <-- FIX HERE
                setOpen(false);
              }}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        {showClear && (
          <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => { setValue(""); setInputText(""); }}>
            Clear
          </Button>
        )}

        {showToday && (
          <Button
            className="cursor-pointer" variant="outline"
            size="sm"
            onClick={() => setValue(toISODateUTC(new Date()))}
          >
            Today
          </Button>
        )}
      </div>
    </div>
  );
}


  const ToolControls = React.memo(function ToolControls({ 
  selectedTool,

  adsPageImpressions, setAdsPageImpressions,
  adsCTR, setAdsCTR,
  adsCPC, setAdsCPC,

  dob, setDob,
  todayDate, setTodayDate,

  percentMode, setPercentMode,
  percentA, setPercentA,
  percentB, setPercentB,

  avgInput, setAvgInput,

  ciMean, setCiMean,
  ciStd, setCiStd,
  ciN, setCiN,
  ciZ, setCiZ,

  taxMode, setTaxMode,
  taxAmount, setTaxAmount,
  taxRate, setTaxRate,

  marginCost, setMarginCost,
  marginPrice, setMarginPrice,

  probA, setProbA,
  probB, setProbB,
  probMode, setProbMode,

  ppAmount, setPpAmount,
  ppPercent, setPpPercent,
  ppFixed, setPpFixed,

  discOriginal, setDiscOriginal,
  discPercent, setDiscPercent,

  cpmImpressions, setCpmImpressions,
  cpmRevenue, setCpmRevenue,

  loanAmount, setLoanAmount,
  loanAnnualRate, setLoanAnnualRate,
  loanTermYears, setLoanTermYears,

  gstMode, setGstMode,
  gstAmount, setGstAmount,
  gstRate, setGstRate, }) {
  switch (selectedTool) {
      case "AdSense Calculator":
        return (
<div className="space-y-3 min-h-[260px]">
  <Label className="text-xs">Page Impressions</Label>
  <Input
   
    value={adsPageImpressions}
    onChange={(e) => setAdsPageImpressions(e.target.value)}
  />

  <Label className="text-xs">Click Through Rate (CTR) %</Label>
  <Input
   
    value={adsCTR}
    onChange={(e) => setAdsCTR(e.target.value)}
  />

  <Label className="text-xs">Cost Per Click (CPC)</Label>
  <Input

    value={adsCPC}
    onChange={(e) => setAdsCPC(e.target.value)}
  />

  <Separator />
  <div className="text-xs opacity-70">
    Preview of earnings (estimates)
  </div>
</div>

        );

      case "Age Calculator":
        return (
            <div className="space-y-6">
            {/* DOB PICKER */}
            <DatePickerBlock
                label="Select your Date of birth"
                value={dob}
                setValue={setDob}
                showClear
            />

            {/* TODAY PICKER */}
            <DatePickerBlock
                label="Today's date"
                value={todayDate}
                setValue={setTodayDate}
                showToday
            />

            <Separator />

            <div className="text-xs opacity-70">
                Results show years / months / days and totals
            </div>
            </div>

        );

      case "Percentage Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Mode</Label>
            <Select value={percentMode} onValueChange={setPercentMode}>
              <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="of">X% of Y</SelectItem>
                <SelectItem className="cursor-pointer" value="percent-of">What percent is X of Y</SelectItem>
              </SelectContent>
            </Select>
            <Label className="text-xs">Value A</Label>
            <Input value={percentA} onChange={(e) => setPercentA(e.target.value)} />
            <Label className="text-xs">Value B</Label>
            <Input value={percentB} onChange={(e) => setPercentB(e.target.value)} />
          </div>
        );

      case "Average Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Enter numbers separated by commas</Label>
            <Textarea value={avgInput} onChange={(e) => setAvgInput(e.target.value)} className="min-h-[120px]" />
            <div className="text-xs opacity-70">Example: 10, 20, 30, 40</div>
          </div>
        );

      case "Confidence Interval Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Sample mean</Label>
            <Input value={ciMean} onChange={(e) => setCiMean(e.target.value)} />
            <Label className="text-xs">Std. deviation (σ or s)</Label>
            <Input value={ciStd} onChange={(e) => setCiStd(e.target.value)} />
            <Label className="text-xs">Sample size (n)</Label>
            <Input value={ciN} onChange={(e) => setCiN(e.target.value)} />
            <Label className="text-xs">Z-value (e.g. 1.96 for 95%)</Label>
            <Input value={ciZ} onChange={(e) => setCiZ(e.target.value)} />
          </div>
        );

      case "Sales Tax Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Mode</Label>
            <Select value={taxMode} onValueChange={setTaxMode}>
              <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="exclusive">Tax Exclusive (net + tax)</SelectItem>
                <SelectItem className="cursor-pointer" value="inclusive">Tax Inclusive (gross contains tax)</SelectItem>
              </SelectContent>
            </Select>
            <Label className="text-xs">Amount</Label>
            <Input value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            <Label className="text-xs">Sales Tax Rate (%)</Label>
            <Input value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
          </div>
        );

      case "Margin Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Cost</Label>
            <Input value={marginCost} onChange={(e) => setMarginCost(e.target.value)} />
            <Label className="text-xs">Price</Label>
            <Input value={marginPrice} onChange={(e) => setMarginPrice(e.target.value)} />
          </div>
        );

      case "Probability Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Probability A (0-1)</Label>
            <Input value={probA} onChange={(e) => setProbA(e.target.value)} />
            <Label className="text-xs">Probability B (0-1)</Label>
            <Input value={probB} onChange={(e) => setProbB(e.target.value)} />
            <Label className="text-xs">Mode</Label>
            <Select value={probMode} onValueChange={setProbMode}>
              <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="independent">Independent events</SelectItem>
                <SelectItem className="cursor-pointer" value="mutually-exclusive">Mutually exclusive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "PayPal Fee Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Amount</Label>
            <Input value={ppAmount} onChange={(e) => setPpAmount(e.target.value)} />
            <Label className="text-xs">Percent fee (%)</Label>
            <Input value={ppPercent} onChange={(e) => setPpPercent(e.target.value)} />
            <Label className="text-xs">Fixed fee</Label>
            <Input value={ppFixed} onChange={(e) => setPpFixed(e.target.value)} />
            <div className="text-xs opacity-70">Common PayPal default is 2.9% + $0.30</div>
          </div>
        );

      case "Discount Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Original Price</Label>
            <Input value={discOriginal} onChange={(e) => setDiscOriginal(e.target.value)} />
            <Label className="text-xs">Discount %</Label>
            <Input value={discPercent} onChange={(e) => setDiscPercent(e.target.value)} />
          </div>
        );

      case "CPM Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Impressions</Label>
            <Input value={cpmImpressions} onChange={(e) => setCpmImpressions(e.target.value)} />
            <Label className="text-xs">Revenue on those impressions</Label>
            <Input value={cpmRevenue} onChange={(e) => setCpmRevenue(e.target.value)} />
          </div>
        );

      case "Loan Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Loan Amount</Label>
            <Input value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
            <Label className="text-xs">Annual Interest Rate (%)</Label>
            <Input value={loanAnnualRate} onChange={(e) => setLoanAnnualRate(e.target.value)} />
            <Label className="text-xs">Term (years)</Label>
            <Input value={loanTermYears} onChange={(e) => setLoanTermYears(e.target.value)} />
          </div>
        );

      case "GST Calculator":
        return (
          <div className="space-y-3">
            <Label className="text-xs">Mode</Label>
            <Select value={gstMode} onValueChange={setGstMode}>
              <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="exclusive">GST Exclusive</SelectItem>
                <SelectItem className="cursor-pointer" value="inclusive">GST Inclusive</SelectItem>
              </SelectContent>
            </Select>
            <Label className="text-xs">Amount</Label>
            <Input value={gstAmount} onChange={(e) => setGstAmount(e.target.value)} />
            <Label className="text-xs">GST Rate (%)</Label>
            <Input value={gstRate} onChange={(e) => setGstRate(e.target.value)} />
          </div>
        );

      default:
        return <div className="text-sm opacity-70">Select a tool from the left</div>;
    }
   
  
});



export default function CalculatorsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // URL / initial tool
  const defaultTool = "AdSense Calculator";
  const [selectedTool, setSelectedTool] = useState(() => {
    try {
      if (typeof window === "undefined") return defaultTool;
      const p = new URLSearchParams(window.location.search);
      const t = p.get("tool");
      return t && TOOLS.includes(t) ? t : defaultTool;
    } catch {
      return defaultTool;
    }
  });

  // shared UI / debug
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);



  // sync tool -> url
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const p = new URLSearchParams(window.location.search);
      p.set("tool", selectedTool);
      const newUrl = `${window.location.pathname}?${p.toString()}`;
      window.history.replaceState(null, "", newUrl);
    } catch {}
  }, [selectedTool]);

  // ---------- AdSense Calculator state ----------
const [adsPageImpressions, setAdsPageImpressions] = useState("1200");
const [adsCTR, setAdsCTR] = useState("12.5");
const [adsCPC, setAdsCPC] = useState("3.3");

const adsResults = useMemo(() => {
  const impressions = parseFloat(adsPageImpressions) || 0;
  const ctr = (parseFloat(adsCTR) || 0) / 100;
  const cpc = parseFloat(adsCPC) || 0;

  const clicks = Math.round(impressions * ctr);
  const dailyEarnings = clicks * cpc;

  return {
    dailyEarnings,
    monthlyEarnings: dailyEarnings * 30,
    yearlyEarnings: dailyEarnings * 365,
    dailyClicks: clicks,
    monthlyClicks: clicks * 30,
    yearlyClicks: clicks * 365,
  };
}, [adsPageImpressions, adsCTR, adsCPC]);



  // ---------- Age Calculator ----------
  // I used native <input type="date"> to keep the file drop-in friendly.
  const [dob, setDob] = useState(() => {
    // default to today
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [todayDate, setTodayDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const ageResults = useMemo(() => {
    try {
      const start = new Date(dob);
      const end = new Date(todayDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
        return null;
      }
      // compute years, months, days
      let y = end.getFullYear() - start.getFullYear();
      let m = end.getMonth() - start.getMonth();
      let d = end.getDate() - start.getDate();
      if (d < 0) {
        m -= 1;
        const prev = new Date(end.getFullYear(), end.getMonth(), 0);
        d += prev.getDate();
      }
      if (m < 0) {
        y -= 1;
        m += 12;
      }
      const totalMonths = (y * 12) + m;
      const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.floor(totalDays / 7);
      return {
        years: y,
        months: m,
        days: d,
        totalMonths,
        totalWeeks,
        totalDays,
      };
    } catch {
      return null;
    }
  }, [dob, todayDate]);

  // ---------- Percentage Calculator ----------
  // modes: "of" (what is X% of Y) vs "percent-of" (what percent is X of Y)
  const [percentMode, setPercentMode] = useState("of");
  const [percentA, setPercentA] = useState(12.5); // percent or numerator
  const [percentB, setPercentB] = useState(200);  // base or denominator

  const percentResult = useMemo(() => {
    const a = Number(percentA), b = Number(percentB);
    if (percentMode === "of") {
      // a% of b = (a/100)*b
      return Number.isFinite(a) && Number.isFinite(b) ? (a / 100) * b : NaN;
    } else {
      // "what percent is a of b" -> (a/b)*100
      return Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? (a / b) * 100 : NaN;
    }
  }, [percentMode, percentA, percentB]);

  // ---------- Average Calculator ----------
  const [avgInput, setAvgInput] = useState("10,20,30"); // comma separated
  const avgResult = useMemo(() => {
    if (!avgInput) return null;
    try {
      const arr = avgInput.split(",").map(s => Number(s.trim())).filter(v => !Number.isNaN(v));
      if (arr.length === 0) return null;
      const sum = arr.reduce((a,b) => a+b, 0);
      const avg = sum / arr.length;
      return { count: arr.length, sum, avg };
    } catch {
      return null;
    }
  }, [avgInput]);

  // ---------- Confidence Interval Calculator (Normal approx) ----------
  // simple z-based CI for mean with known sigma (or estimated using sample sd)
  const [ciMean, setCiMean] = useState(50);
  const [ciStd, setCiStd] = useState(10);
  const [ciN, setCiN] = useState(30);
  const [ciZ, setCiZ] = useState(1.96); // 95% z

  const ciResult = useMemo(() => {
    const mean = Number(ciMean), sd = Number(ciStd), n = Number(ciN), z = Number(ciZ);
    if (![mean, sd, n, z].every(Number.isFinite) || n <= 0) return null;
    const se = sd / Math.sqrt(n);
    const lower = mean - z * se;
    const upper = mean + z * se;
    return { lower, upper, se };
  }, [ciMean, ciStd, ciN, ciZ]);

  // ---------- Sales Tax Calculator ----------
  const [taxMode, setTaxMode] = useState("exclusive"); // exclusive | inclusive
  const [taxAmount, setTaxAmount] = useState(100);
  const [taxRate, setTaxRate] = useState(6.5);

  const salesTaxResult = useMemo(() => {
    const amount = Number(taxAmount);
    const rate = Number(taxRate) / 100;
    if (!Number.isFinite(amount) || !Number.isFinite(rate)) return null;
    if (taxMode === "exclusive") {
      const tax = amount * rate;
      const gross = amount + tax;
      return { net: amount, tax, gross };
    } else {
      // inclusive: gross provided; net = gross / (1+rate), tax = gross - net
      const gross = amount;
      const net = gross / (1 + rate);
      const tax = gross - net;
      return { net, tax, gross };
    }
  }, [taxMode, taxAmount, taxRate]);

  // ---------- Margin Calculator ----------
  const [marginCost, setMarginCost] = useState(70);
  const [marginPrice, setMarginPrice] = useState(100);
  const marginResult = useMemo(() => {
    const cost = Number(marginCost), price = Number(marginPrice);
    if (!Number.isFinite(cost) || !Number.isFinite(price) || price === 0) return null;
    const margin = ((price - cost) / price) * 100;
    const markup = ((price - cost) / cost) * 100;
    return { margin, markup, profit: price - cost };
  }, [marginCost, marginPrice]);

  // ---------- Probability Calculator ----------
  // simple independent-event AND/OR calculator and combinations nCr
  const [probA, setProbA] = useState(0.5);
  const [probB, setProbB] = useState(0.3);
  const [probMode, setProbMode] = useState("independent"); // independent | mutually-exclusive
  const probResult = useMemo(() => {
    const a = Number(probA), b = Number(probB);
    if (![a,b].every(Number.isFinite)) return null;
    const andProb = probMode === "independent" ? a * b : 0;
    const orProb = probMode === "independent" ? a + b - a*b : a + b;
    return { andProb, orProb };
  }, [probA, probB, probMode]);

  // nCr helper
  const nCr = (n, r) => {
    n = Math.floor(n); r = Math.floor(r);
    if (r < 0 || r > n) return 0;
    let num = 1, den = 1;
    for (let i = 1; i <= r; i++) {
      num *= (n - (r - i));
      den *= i;
    }
    return num / den;
  };

  // ---------- PayPal Fee Calculator ----------
  const [ppAmount, setPpAmount] = useState(100);
  const [ppPercent, setPpPercent] = useState(2.9);
  const [ppFixed, setPpFixed] = useState(0.30);
  const ppResult = useMemo(() => {
    const amt = Number(ppAmount), pct = Number(ppPercent)/100, fix = Number(ppFixed);
    if (![amt,pct,fix].every(Number.isFinite)) return null;
    const fee = amt * pct + fix;
    const net = amt - fee;
    return { fee, net };
  }, [ppAmount, ppPercent, ppFixed]);

  // ---------- Discount Calculator ----------
  const [discOriginal, setDiscOriginal] = useState(100);
  const [discPercent, setDiscPercent] = useState(20);
  const discResult = useMemo(() => {
    const orig = Number(discOriginal), pct = Number(discPercent)/100;
    if (!Number.isFinite(orig) || !Number.isFinite(pct)) return null;
    const discount = orig * pct;
    const finalPrice = orig - discount;
    return { discount, finalPrice };
  }, [discOriginal, discPercent]);

  // ---------- CPM Calculator ----------
  const [cpmImpressions, setCpmImpressions] = useState(1000);
  const [cpmRevenue, setCpmRevenue] = useState(5); // revenue per these impressions
  const cpmResult = useMemo(() => {
    const impressions = Number(cpmImpressions), rev = Number(cpmRevenue);
    if (!Number.isFinite(impressions) || impressions === 0 || !Number.isFinite(rev)) return null;
    const rpm = (rev / impressions) * 1000; // revenue per 1000 impressions
    return { rpm };
  }, [cpmImpressions, cpmRevenue]);

  // ---------- Loan Calculator (annuity) ----------
  const [loanAmount, setLoanAmount] = useState(10000);
  const [loanAnnualRate, setLoanAnnualRate] = useState(7.5);
  const [loanTermYears, setLoanTermYears] = useState(5);
  const loanResult = useMemo(() => {
    const P = Number(loanAmount);
    const annual = Number(loanAnnualRate)/100;
    const n = Number(loanTermYears)*12;
    if (![P, annual, n].every(Number.isFinite) || n <= 0) return null;
    const monthlyRate = annual / 12;
    const factor = Math.pow(1+monthlyRate, n);
    const monthly = (P * monthlyRate * factor) / (factor - 1);
    const total = monthly * n;
    const interest = total - P;
    return { monthly, total, interest };
  }, [loanAmount, loanAnnualRate, loanTermYears]);

  // ---------- GST Calculator ----------
  const [gstMode, setGstMode] = useState("exclusive"); // exclusive | inclusive
  const [gstAmount, setGstAmount] = useState(100);
  const [gstRate, setGstRate] = useState(18); // percent
  const gstResult = useMemo(() => {
    const a = Number(gstAmount), r = Number(gstRate)/100;
    if (!Number.isFinite(a) || !Number.isFinite(r)) return null;
    if (gstMode === "exclusive") {
      const tax = a * r;
      const gross = a + tax;
      return { net: a, tax, gross };
    } else {
      const gross = a;
      const net = gross / (1 + r);
      const tax = gross - net;
      return { net, tax, gross };
    }
  }, [gstMode, gstAmount, gstRate]);

  // ------------- Utility actions -------------
  const handleCopy = useCallback((text) => {
    try {
      navigator.clipboard.writeText(text || "");
      showToast("success", "Copied");
    } catch {
      showToast("error", "Copy failed");
    }
  }, []);

  const handleDownload = useCallback((filename = "calc-output.txt", content = "") => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Downloaded");
  }, []);

  
  // ---------- Render per-tool controls & preview ----------

  const ACCENTS = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

const StatRow = ({ icon, label, value, accent = "emerald", noBorder }) => (
  <div
    className={`
      flex items-center justify-between gap-3 py-3
      ${noBorder ? "" : "border-b border-zinc-200/30 dark:border-zinc-700/40"}
    `}
  >
    {/* Left */}
    <div className="flex items-center gap-3">
      <div
        className={`p-2 rounded-md ${ACCENTS[accent]} backdrop-blur-md`}
      >
        {icon}
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>

    {/* Right */}
    <div className="text-base font-semibold text-right whitespace-nowrap">
      {value}
    </div>
  </div>
);

const StatCard = ({
  icon,
  title,
  value,
  description,
  accent = "emerald",
}) => (
  <div
    className="
      rounded-xl border p-4
      bg-white/70 dark:bg-zinc-900/70
      shadow-lg backdrop-blur-md
      border-zinc-200/30 dark:border-zinc-700/40
    "
  >
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-2 rounded-lg ${ACCENTS[accent]}`}>
        {icon}
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {title}
      </span>
    </div>

    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
      {value}
    </div>

    {description && (
      <div className="mt-1 text-xs text-muted-foreground">
        {description}
      </div>
    )}
  </div>
);




  function ToolPreview() {
    switch (selectedTool) {
      case "AdSense Calculator":
        return (
            <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                {/* DAILY */}
                <div className="rounded-xl border p-4 bg-white/60 dark:bg-zinc-900/60 
                    shadow-sm flex flex-col gap-1 hover:shadow-md ">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs opacity-70">Daily</span>
                </div>
                <div className="text-lg font-semibold">{fmtMoney(adsResults.dailyEarnings)}</div>
                <div className="text-xs opacity-70">{adsResults.dailyClicks} clicks</div>
                </div>

                {/* MONTHLY */}
                <div className="rounded-xl border p-4 bg-white/60 dark:bg-zinc-900/60 
                    shadow-sm flex flex-col gap-1 hover:shadow-md ">
                <div className="flex items-center gap-2">
                    <CalendarRange className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs opacity-70">Monthly</span>
                </div>
                <div className="text-lg font-semibold">{fmtMoney(adsResults.monthlyEarnings)}</div>
                <div className="text-xs opacity-70">{adsResults.monthlyClicks} clicks</div>
                </div>

                {/* YEARLY */}
                <div className="rounded-xl border p-4 bg-white/60 dark:bg-zinc-900/60 
                    shadow-sm flex flex-col gap-1 hover:shadow-md">
                <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs opacity-70">Yearly</span>
                </div>
                <div className="text-lg font-semibold">{fmtMoney(adsResults.yearlyEarnings)}</div>
                <div className="text-xs opacity-70">{adsResults.yearlyClicks} clicks</div>
                </div>

            </div>
            </div>

        );

      case "Age Calculator":
        return ageResults ? (

            <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="w-4 h-4 text-emerald-500" />
                Your Current Age
            </div>

            {/* Main Card */}
            <div
                className="
                rounded-xl border
                bg-white/70 dark:bg-zinc-900/70
                backdrop-blur-md
                p-4 sm:p-5
                shadow-lg
                border-zinc-200/30 dark:border-zinc-700/40
                "
            >
                {/* Primary Age Display */}
                <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Hourglass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div className="text-base sm:text-lg font-semibold">
                    {ageResults.years}{" "}
                    <span className="opacity-70 font-medium">years</span>,{" "}
                    {ageResults.months}{" "}
                    <span className="opacity-70 font-medium">months</span> &{" "}
                    {ageResults.days}{" "}
                    <span className="opacity-70 font-medium">days</span>
                </div>
                </div>

                {/* Stats Grid */}
                <div className=" ">
                <StatRow
                    icon={<CalendarIcon className="w-4 h-4" />}
                    label="Total Months"
                    value={`${ageResults.totalMonths} months`}
                    accent="emerald"
                />
                <StatRow
                    icon={<Timer className="w-4 h-4" />}
                    label="Total Weeks"
                    value={`${ageResults.totalWeeks} weeks`}
                    accent="blue"
                />
                <StatRow
                    icon={<Sigma className="w-4 h-4" />}
                    label="Total Days"
                    value={`${ageResults.totalDays} days`}
                    accent="amber"
                />
                </div>
            </div>
            </div>

        ) : (
          <div className="text-sm opacity-70">Invalid dates — ensure DOB is not after today's date.</div>
        );

      case "Percentage Calculator":
        return (

            <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm font-medium">
                <Calculator className="w-4 h-4 text-emerald-500" />
                Calculation Result
            </div>

            {/* Result Card */}
            <div
                className="
                rounded-xl border
                bg-white/70 dark:bg-zinc-900/70
                backdrop-blur-md
                p-4 sm:p-5
                shadow-lg
                border-zinc-200/30 dark:border-zinc-700/40
                "
            >
                <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Percent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>

                {/* Text */}
                <div className="flex flex-col">
                    <span className="text-xs opacity-70">
                    {percentMode === "of" ? "Result" : "Percent (%)"}
                    </span>

                    <span className="text-lg sm:text-xl font-semibold tracking-tight">
                    {fmtNumber(percentResult, 2)}
                    {percentMode === "of" ? "" : "%"}
                    </span>
                </div>
                </div>
            </div>
            </div>

        );

      case "Average Calculator":
        return avgResult ? (
  <div className="space-y-3">
    <div
      className="
        rounded-xl border
        bg-white/70 dark:bg-zinc-900/70
        backdrop-blur-md
        p-4 sm:p-5
        shadow-lg
        border-zinc-200/30 dark:border-zinc-700/40
      "
    >
      {/* Grid Stats */}
      <div className=" gap-3">
        <StatRow
          icon={<Hash className="w-4 h-4 " />}
          label="Count"
          value={avgResult.count}
          accent="emerald"
        />

        <StatRow
          icon={<Sigma className="w-4 h-4 " />}
          label="Sum"
          value={fmtNumber(avgResult.sum, 2)}
          accent="blue"
        />

        <StatRow
          icon={<DivideCircle className="w-4 h-4 " />}
          label="Average"
          value={fmtNumber(avgResult.avg, 2)}
          accent="amber"
        />
      </div>
    </div>
  </div>
) : (
  <div className="text-sm opacity-70">
    Enter numbers separated by commas
  </div>
)

      case "Confidence Interval Calculator":
        return ciResult ? (
        <div className="space-y-4">
            <div
            className="
                rounded-xl border border-zinc-200/20 dark:border-zinc-700/40
                bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md
                shadow-lg p-4
            "
            >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold">Statistical Result</span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard Error */}
                <div className="rounded-lg border border-zinc-200/20 dark:border-zinc-700/40 p-3 bg-zinc-100/40 dark:bg-zinc-800/40">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Sigma className="w-3.5 h-3.5" />
                    Standard Error
                </div>
                <div className="text-lg font-semibold">
                    {fmtNumber(ciResult.se, 4)}
                </div>
                </div>

                {/* Confidence Interval */}
                <div className="rounded-lg border border-zinc-200/20 dark:border-zinc-700/40 p-3 bg-zinc-100/40 dark:bg-zinc-800/40">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Ruler className="w-3.5 h-3.5" />
                    Confidence Interval
                </div>
                <div className="text-lg font-semibold">
                    {fmtNumber(ciResult.lower, 4)}
                    <span className="mx-2 opacity-60">—</span>
                    {fmtNumber(ciResult.upper, 4)}
                </div>
                </div>
            </div>
            </div>
        </div>
        ) : (
        <div
            className="
            flex items-center gap-2
            text-sm text-muted-foreground
            bg-zinc-100/40 dark:bg-zinc-900/40
            border border-zinc-200/20 dark:border-zinc-700/40
            rounded-lg p-3
            "
        >
            <Info className="w-4 h-4" />
            Provide mean, standard deviation, and sample size to calculate the interval.
        </div>
        );


      case "Sales Tax Calculator":

            return salesTaxResult ? (
            <div className="space-y-3">
                <div
                className="
                    rounded-xl border
                    bg-white/70 dark:bg-zinc-900/70
                    backdrop-blur-md
                    p-4
                    grid grid-cols-1  gap-4
                    shadow-lg
                    border-zinc-200/30 dark:border-zinc-700/40
                "
                >
         

            

             <div className="space-y-1">
                <StatRow
                    icon={<Wallet className="w-4 h-4" />}
                    label="Net Amount (excluding tax)"
                    value={fmtMoney(salesTaxResult.net)}
                    accent="emerald"
                />

                <StatRow
                    icon={<Percent className="w-4 h-4" />}
                    label={`Tax (${taxRate}%)`}
                    value={fmtMoney(salesTaxResult.tax)}
                    accent="amber"
                />

                <StatRow
                    icon={<Receipt className="w-4 h-4" />}
                    label="Gross Amount (including tax)"
                    value={fmtMoney(salesTaxResult.gross)}
                    accent="blue"
                    noBorder
                />
                </div>
                </div>
            </div>
            ) : null;


      case "Margin Calculator":
        return marginResult ? (
        <div className="space-y-4">
            <div
            className="
                rounded-xl border p-4
                bg-white/70 dark:bg-zinc-900/70
                border-zinc-200/30 dark:border-zinc-700/40
                shadow-lg backdrop-blur-md
            "
            >
            <div className="grid grid-cols-1  gap-4">



<div className="space-y-1">
  <StatRow
    icon={<DollarSign className="w-5 h-5" />}
    label="Gross Profit"
    value={fmtNumber(marginResult.profit, 2)}
    accent="emerald"
  />

  <StatRow
    icon={<Percent className="w-5 h-5" />}
    label="Margin"
    value={`${fmtNumber(marginResult.margin, 2)}%`}
    accent="blue"
  />

  <StatRow
    icon={<TrendingUp className="w-5 h-5" />}
    label="Markup"
    value={`${fmtNumber(marginResult.markup, 2)}%`}
    accent="violet"
    noBorder
  />
</div>


            </div>
            </div>
        </div>
        ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            Enter cost and price to calculate margins
        </div>
        );


      case "Probability Calculator":
        return probResult ? (
            <div className="space-y-3">
             
        <div className="grid grid-cols-1  gap-4">
        <StatCard
            icon={<Link2 className="w-4 h-4" />}
            title="P(A ∩ B)"
            value={fmtNumber(probResult.andProb, 4)}
            description="Probability of both events occurring"
            accent="blue"
        />

        <StatCard
            icon={<Merge className="w-4 h-4" />}
            title="P(A ∪ B)"
            value={fmtNumber(probResult.orProb, 4)}
            description="Probability of either event occurring"
            accent="emerald"
        />
        </div>
 
            </div>
        ) : null;


        case "PayPal Fee Calculator":
        return ppResult ? (
            <div className="space-y-3">
            <div className="rounded-xl border p-4 bg-white/60 dark:bg-zinc-900/60 shadow-md">
                <div className="  gap-4">


                <div className="space-y-1">
                <StatRow
                    icon={<CreditCard className="w-4 h-4" />}
                    label="PayPal Fee"
                    value={fmtMoney(ppResult.fee)}
                    accent="amber"
                />

                <StatRow
                    icon={<Wallet className="w-4 h-4" />}
                    label="Net to Seller"
                    value={fmtMoney(ppResult.net)}
                    accent="emerald"
                    noBorder
                />
                </div>

                </div>
            </div>
            </div>
        ) : null;


        case "Discount Calculator":
        return discResult ? (
            <div className="space-y-3">
            <div className="rounded-xl border p-4 bg-white/60 dark:bg-zinc-900/60 shadow-md">
                <div className=" gap-4">
                {/* Discount */}
        

<div className="space-y-1">
  <StatRow
    icon={<Percent className="w-4 h-4" />}
    label="Discount Amount"
    value={fmtMoney(discResult.discount)}
    accent="amber"
  />

  <StatRow
    icon={<Tag className="w-4 h-4" />}
    label="Final Price"
    value={fmtMoney(discResult.finalPrice)}
    accent="emerald"
    noBorder
  />
</div>

                </div>
            </div>
            </div>
        ) : null;


        case "CPM Calculator":
        return cpmResult ? (
            <div className="space-y-3">
            <div className="rounded-xl border p-4 bg-white/60 dark:bg-zinc-900/60 shadow-md">
                <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                    <div className="text-xs text-muted-foreground">
                    RPM (Revenue per 1,000 impressions)
                    </div>
                    <div className="text-lg font-semibold">
                    {fmtMoney(cpmResult.rpm)}
                    </div>
                </div>
                </div>
            </div>
            </div>
        ) : null;


        case "Loan Calculator":
        return loanResult ? (
            <div className="space-y-3">
            <div className="rounded-xl  border p-5 bg-white/70 dark:bg-zinc-900/70 shadow-lg">
                <StatRow
                icon={<CreditCard className="w-4 h-4 text-emerald-400" />}
                label="Monthly Payment"
                value={fmtMoney(loanResult.monthly)}
                accent="emerald"
                />

                <StatRow
                icon={<Wallet className="w-4 h-4 text-blue-400 " />}
                label="Total Payment"
                value={fmtMoney(loanResult.total)}
                accent="blue"
                />

                <StatRow
                icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
                label="Total Interest"
                value={fmtMoney(loanResult.interest)}
                accent="amber"
                noBorder
                />
            </div>
            </div>
        ) : null;


    case "GST Calculator":
        return gstResult ? (
            <div className="space-y-3">
            <div className="rounded-xl  border p-5 bg-white/70 dark:bg-zinc-900/70 shadow-lg">
                <StatRow
                icon={<Receipt className="w-4 h-4" />}
                label="Net Amount"
                value={fmtMoney(gstResult.net)}
                accent="emerald"
                />

                <StatRow
                icon={<Percent className="w-4 h-4" />}
                label={`GST (${gstRate}%)`}
                value={fmtMoney(gstResult.tax)}
                accent="violet"
                />

                <StatRow
                icon={<Calculator className="w-4 h-4" />}
                label="Gross Amount"
                value={fmtMoney(gstResult.gross)}
                accent="blue"
                noBorder
                />
            </div>
            </div>
        ) : null;


      default:
        return <div className="text-sm opacity-70">No preview</div>;
    }
  }

  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
              Online Calculators
            </h1>
            <p className="text-sm text-muted-foreground mt-1">A suite of client-side calculators — Ads, Age, Finance, Probability and more</p>
          </div>

        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tools</span>
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">Calculators</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select Tool</Label>
                <Select value={selectedTool} onValueChange={setSelectedTool}>
                  <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TOOLS.map((t) => <SelectItem className="cursor-pointer" key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Separator />

                <ToolControls
                    selectedTool={selectedTool}

                    adsPageImpressions={adsPageImpressions}
                    setAdsPageImpressions={setAdsPageImpressions}
                    adsCTR={adsCTR}
                    setAdsCTR={setAdsCTR}
                    adsCPC={adsCPC}
                    setAdsCPC={setAdsCPC}

                    dob={dob}
                    setDob={setDob}
                    todayDate={todayDate}
                    setTodayDate={setTodayDate}

                    percentMode={percentMode}
                    setPercentMode={setPercentMode}
                    percentA={percentA}
                    setPercentA={setPercentA}
                    percentB={percentB}
                    setPercentB={setPercentB}

                    avgInput={avgInput}
                    setAvgInput={setAvgInput}

                    ciMean={ciMean}
                    setCiMean={setCiMean}
                    ciStd={ciStd}
                    setCiStd={setCiStd}
                    ciN={ciN}
                    setCiN={setCiN}
                    ciZ={ciZ}
                    setCiZ={setCiZ}

                    taxMode={taxMode}
                    setTaxMode={setTaxMode}
                    taxAmount={taxAmount}
                    setTaxAmount={setTaxAmount}
                    taxRate={taxRate}
                    setTaxRate={setTaxRate}

                    marginCost={marginCost}
                    setMarginCost={setMarginCost}
                    marginPrice={marginPrice}
                    setMarginPrice={setMarginPrice}

                    probA={probA}
                    setProbA={setProbA}
                    probB={probB}
                    setProbB={setProbB}
                    probMode={probMode}
                    setProbMode={setProbMode}

                    ppAmount={ppAmount}
                    setPpAmount={setPpAmount}
                    ppPercent={ppPercent}
                    setPpPercent={setPpPercent}
                    ppFixed={ppFixed}
                    setPpFixed={setPpFixed}

                    discOriginal={discOriginal}
                    setDiscOriginal={setDiscOriginal}
                    discPercent={discPercent}
                    setDiscPercent={setDiscPercent}

                    cpmImpressions={cpmImpressions}
                    setCpmImpressions={setCpmImpressions}
                    cpmRevenue={cpmRevenue}
                    setCpmRevenue={setCpmRevenue}

                    loanAmount={loanAmount}
                    setLoanAmount={setLoanAmount}
                    loanAnnualRate={loanAnnualRate}
                    setLoanAnnualRate={setLoanAnnualRate}
                    loanTermYears={loanTermYears}
                    setLoanTermYears={setLoanTermYears}

                    gstMode={gstMode}
                    setGstMode={setGstMode}
                    gstAmount={gstAmount}
                    setGstAmount={setGstAmount}
                    gstRate={gstRate}
                    setGstRate={setGstRate}
                    />



                <Separator />

                <div className="flex gap-2 mt-3">
                  <Button className="flex-1" onClick={() => {
                    // trigger small highlight / scroll
                    setLoading(true);
                    setTimeout(() => { setLoading(false); resultRef.current?.scrollIntoView({ behavior: "smooth" }); }, 400);
                  }}>
                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />} Calculate
                  </Button>
                  <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(""); setDialogOpen(false); }}>Reset</Button>
                </div>

                <div className="text-xs opacity-70 mt-2">All calculators are client-side and update instantly. Use the Download/Copy actions to export results.</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* center preview */}
        <main className="lg:col-span-6 space-y-4">
          <Card className="shadow-md dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedTool}</CardTitle>
                <div className="text-xs text-muted-foreground">Interactive preview</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => handleCopy(document?.getSelection()?.toString() || "")}><Copy className="w-4 h-4" /></Button>
                <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => handleDownload(`calc-${selectedTool.replace(/\s+/g,"-")}.txt`, JSON.stringify({ tool: selectedTool, timestamp: Date.now() }, null, 2))}><Download className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-950/50 min-h-[220px]" ref={resultRef}>
                <ToolPreview />
              </div>

            </CardContent>
          </Card>

          {/* For AdSense example table */}
          {selectedTool === "AdSense Calculator" && (
            <Card className="shadow-sm dark:bg-black/80 bg-white/80">
              <CardHeader><CardTitle>AdSense Sample Table</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left">Periods</th>
                        <th className="text-right">Earnings</th>
                        <th className="text-right">Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2">Daily</td>
                        <td className="py-2 text-right">{fmtMoney(adsResults.dailyEarnings)}</td>
                        <td className="py-2 text-right">{adsResults.dailyClicks}</td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-2">Monthly</td>
                        <td className="py-2 text-right">{fmtMoney(adsResults.monthlyEarnings)}</td>
                        <td className="py-2 text-right">{adsResults.monthlyClicks}</td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-2">Yearly</td>
                        <td className="py-2 text-right">{fmtMoney(adsResults.yearlyEarnings)}</td>
                        <td className="py-2 text-right">{adsResults.yearlyClicks}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        {/* right debug / quick actions */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 space-y-4">
            <Card className="shadow-md dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Details & Quick Actions</span>
                  <Settings className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-70">Selected</span>
                    <span className="font-medium">{selectedTool}</span>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCopy(JSON.stringify({ selectedTool }, null, 2))}>Copy state</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload("calculators-state.json", JSON.stringify({ selectedTool, timestamp: Date.now() }, null, 2))}>Export state</Button>
                
                  </div>
                  <Separator />
                 
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md dark:bg-black/80 bg-white/80">
              <CardHeader><CardTitle>Sample Inputs</CardTitle></CardHeader>
              <CardContent>
                <div className="text-xs">
                  <div className="mb-2">AdSense sample: Impressions 1200, CTR 12.5%, CPC 3.3</div>
                  <div className="mb-2">Age sample: set DOB and Today's date (both date inputs)</div>
                  <div className="mb-2">Tax example: Amount 100, Rate 6.5%</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Online Calculators — Notes</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              This page contains multiple client-side calculators implemented with the same theme, components and layout as your unit converters page. All calculations are done in the browser.
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
