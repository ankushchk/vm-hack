"use client";
import { useState, useEffect, useMemo } from "react";
import { stations, getStation, getStationName } from "@/data/stations";
import { Journey, Preference } from "@/lib/types";
import { findJourneys, formatDuration, getRecoveryOptions } from "@/lib/engine";
import { StationSelector } from "@/components/StationSelector";
import {
  TrainFront,
  ArrowLeftRight,
  Clock3,
  IndianRupee,
  ShieldCheck,
  ShieldAlert,
  OctagonAlert,
  Info,
  MapPin,
  Navigation,
  Bus,
  CarFront,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Bookmark,
  Copy,
  Check,
  Search,
  Zap,
  Leaf,
  Wallet,
  Users,
  Flag,
  Timer,
  Route,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  X,
} from "lucide-react";

const CAROUSEL_SLIDES = [
  {
    id: 0,
    tag: "INTERCHANGE INTELLIGENCE",
    title: "Airport-Style Connecting Trains",
    subtitle: "Direct trains full? Connect seamlessly at major junction hubs.",
    icon: Route,
    accent: "#F2B705",
    badge: "100% PRACTICAL & LEGAL",
    desc: "When direct trains are waitlisted (WL), Raasta links two trains across major junctions (Mumbai, Bhopal, Vadodara, Nagpur) with protected connection buffers.",
    points: [
      "Finds confirmed seat combinations when direct trains are sold out",
      "Calculates safe layovers (2h to 6h) so you never miss a connection",
      "Same-station and cross-terminal options clearly marked",
    ],
    demo: {
      type: "layover",
      t1: "12952 Rajdhani (NDLS → MMCT)",
      t1Time: "16:55 → 06:55",
      layover: "2h 35m Protected Change at Mumbai Central",
      t2: "10104 Mandovi Exp (MMCT → MAO)",
      t2Time: "09:30 → 17:20",
    },
  },
  {
    id: 1,
    tag: "RISK & SAFETY ENGINE",
    title: "Buffer & Missed-Connection Scoring",
    subtitle: "Never sprint across platforms in panic.",
    icon: ShieldCheck,
    accent: "#0E9F4B",
    badge: "HISTORICAL DELAY AWARE",
    desc: "Unlike standard IRCTC timetable searches, our algorithm factors platform walking times, luggage transfer delays, and historical train delay data.",
    points: [
      "LOW RISK: > 80m buffer — plenty of margin for families & luggage",
      "MODERATE RISK: 35m - 80m buffer — viable for agile travellers",
      "HIGH RISK: < 35m buffer — flagged with caution alerts",
    ],
    demo: {
      type: "risk",
      bars: [
        { label: "LOW RISK (SAFE)", buffer: "> 80m", color: "#0E9F4B", note: "Family & luggage friendly" },
        { label: "MODERATE", buffer: "35m - 80m", color: "#D98200", note: "Tight on delayed routes" },
        { label: "HIGH RISK", buffer: "< 35m", color: "#C62828", note: "Not recommended" },
      ],
    },
  },
  {
    id: 2,
    tag: "METRO HUB INTELLIGENCE",
    title: "Same-City Cross-Station Awareness",
    subtitle: "Smart navigation between city terminals.",
    icon: MapPin,
    accent: "#1B3A5C",
    badge: "CITY TRANSIT BUFFER",
    desc: "Metros have multiple major railway stations. Raasta knows when you arrive at Mumbai Central (MMCT) and need to depart from Dadar (DDR), adding realistic road transit times.",
    points: [
      "Mumbai: MMCT ↔ Dadar ↔ CSMT ↔ Bandra Terminus",
      "Delhi: NDLS ↔ Nizamuddin (NZM) ↔ Old Delhi (DLI) ↔ Anand Vihar (ANVT)",
      "Kolkata: Howrah (HWH) ↔ Sealdah (SDAH) road transit",
    ],
    demo: {
      type: "metro",
      routes: [
        { from: "MMCT", to: "Dadar (DDR)", road: "20 min cab / local transit buffer included" },
        { from: "NDLS", to: "Nizamuddin (NZM)", road: "25 min road transit buffer included" },
      ],
    },
  },
  {
    id: 3,
    tag: "RESILIENCE & RECOVERY",
    title: "1-Click Delay Recovery Simulator",
    subtitle: "First train delayed? Instant Plan B.",
    icon: Zap,
    accent: "#E65100",
    badge: "INSTANT ALTERNATIVES",
    desc: "If your incoming train faces an unexpected delay (+35m, +70m), Raasta's delay simulator instantly recalculates your connection and presents backup trains.",
    points: [
      "Simulate delay scenarios before or during your trip",
      "Instantly discover later departing trains with viable connection buffers",
      "Travel with confidence knowing your alternative route options",
    ],
    demo: {
      type: "simulator",
      delay: "+70m delay simulated on Train 1",
      result: "2 backup trains available departing 1h 40m later",
    },
  },
];

const POPULAR_ROUTES: { from: string; to: string; label: string }[] = [
  { from: "New Delhi", to: "Howrah", label: "Delhi → Kolkata" },
  { from: "Mumbai Central", to: "Chennai Central", label: "Mumbai → Chennai" },
  { from: "New Delhi", to: "Goa", label: "Delhi → Goa" },
  { from: "Bengaluru", to: "Hyderabad", label: "Bengaluru → Hyderabad" },
  { from: "New Delhi", to: "Chennai Central", label: "Delhi → Chennai" },
  { from: "Ahmedabad", to: "Mumbai Central", label: "Ahmedabad → Mumbai" },
  { from: "Jaipur", to: "Goa", label: "Jaipur → Goa" },
  { from: "Lucknow", to: "Pune", label: "Lucknow → Pune" },
];

function parseNaturalCommand(input: string): { from?: string; to?: string; pref?: Preference; dateOffset?: number } | null {
  const lower = input.toLowerCase().trim();
  if (!lower) return null;
  // detect preference
  let pref: Preference | undefined;
  if (/(fastest|fast|jaldi|tez)/.test(lower)) pref = "fastest";
  else if (/(cheapest|cheap|sasta|kam paise)/.test(lower)) pref = "cheapest";
  else if (/(easy|comfortable|aaram|easy journey)/.test(lower)) pref = "easy";
  // date offset
  let dateOffset: number | undefined;
  if (/day after|parso/.test(lower)) dateOffset = 2;
  else if (/tomorrow|kal/.test(lower) && !/parso/.test(lower)) dateOffset = 1;
  else if (/today|aaj/.test(lower)) dateOffset = 0;
  else if (/next week|agle hafte/.test(lower)) dateOffset = 7;

  // extract from -> to pattern supports "delhi to goa", "delhi se goa", "delhi se jaipur tak", "from delhi to goa"
  const cityWords = "([a-zA-Z\\s]+?)";
  const patterns = [
    new RegExp(`${cityWords}\\s+to\\s+${cityWords}`, "i"),
    new RegExp(`${cityWords}\\s+se\\s+${cityWords}(?:\\s+tak)?`, "i"),
    new RegExp(`from\\s+${cityWords}\\s+to\\s+${cityWords}`, "i"),
  ];
  for (const pat of patterns) {
    const m = input.match(pat);
    if (m) {
      const a = m[1]?.trim().replace(/^(from|se|to)\s+/i, "").trim();
      const b = m[2]?.trim().replace(/\s+(tomorrow|today|kal|parso|fastest|cheapest|easy).*$/i, "").trim();
      if (a && b && a.length > 2 && b.length > 2) {
        return { from: capitalizeCity(a), to: capitalizeCity(b), pref, dateOffset };
      }
    }
  }
  return pref || dateOffset !== undefined ? { pref, dateOffset } : null;
}
function capitalizeCity(s: string) {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

function todayISO() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}
function formatDate(d: string) {
  try {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}
function formatDateShort(d: string) {
  try {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return d;
  }
}

const RISK_COLOR: Record<string, string> = {
  low: "#0E9F4B",
  medium: "#D98200",
  high: "#C62828",
};
const RISK_LABEL: Record<string, string> = {
  low: "Low risk",
  medium: "Moderate",
  high: "High risk",
};

export default function Home() {
  const [from, setFrom] = useState("New Delhi");
  const [to, setTo] = useState("Goa");
  const [date, setDate] = useState(todayISO());
  const [pref, setPref] = useState<Preference>("easy");
  const [extras, setExtras] = useState({ children: false, elderly: false, fewerTransfers: false });
  const [view, setView] = useState<"landing" | "prefs" | "results" | "detail" | "journey">("landing");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selected, setSelected] = useState<Journey | null>(null);
  const [saved, setSaved] = useState<Journey[]>([]);
  const [delay, setDelay] = useState<number>(0);
  const [showSaved, setShowSaved] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [explain, setExplain] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [recoverSelected, setRecoverSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [carouselSlide, setCarouselSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [commandText, setCommandText] = useState("");
  const [commandLoading, setCommandLoading] = useState(false);
  const [showWhatsAppDemo, setShowWhatsAppDemo] = useState(false);
  const [waMessages, setWaMessages] = useState<{ role: "user" | "bot"; text: string; journey?: Journey }[]>([
    { role: "bot", text: "Hi! I'm Raasta WhatsApp bot. Try: 'Delhi to Jaipur tomorrow fastest' or 'Mumbai to Goa next week cheap' — I'll build the journey instantly. No stuck builds." },
  ]);
  const [waInput, setWaInput] = useState("");

  useEffect(() => {
    if (!isAutoPlay || view !== "landing") return;
    const timer = setInterval(() => {
      setCarouselSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlay, view]);

  const handleSwapStations = () => {
    const tempFrom = from;
    setFrom(to);
    setTo(tempFrom);
  };

  const handleCommandBuild = async () => {
    if (!commandText.trim()) {
      setToast("Type a command like: Delhi to Goa tomorrow fastest");
      setTimeout(() => setToast(null), 2200);
      return;
    }
    setCommandLoading(true);
    // robust parsing with timeout & fallback - never stuck midway
    try {
      const parsed = parseNaturalCommand(commandText);
      let targetFrom = parsed?.from || from;
      let targetTo = parsed?.to || to;
      let targetPref = parsed?.pref || pref;
      let targetDate = date;
      if (parsed?.dateOffset !== undefined) {
        const d = new Date();
        d.setDate(d.getDate() + parsed.dateOffset);
        targetDate = d.toISOString().slice(0, 10);
      }
      // simulate brief building time with capped timeout to avoid stuck
      await new Promise((res, rej) => {
        const t = setTimeout(res, 700);
        setTimeout(() => rej(new Error("timeout")), 5000);
      }).catch(() => {});
      if (parsed?.from) setFrom(targetFrom);
      if (parsed?.to) setTo(targetTo);
      if (parsed?.pref) setPref(targetPref);
      if (parsed?.dateOffset !== undefined) setDate(targetDate);
      const res = findJourneys(targetFrom, targetTo, targetDate, targetPref);
      if (res.length === 0) {
        setToast(`No route found for ${targetFrom} → ${targetTo}. Try popular routes.`);
        setTimeout(() => setToast(null), 3000);
        return;
      }
      // reuse same dedup logic as find()
      const easy = findJourneys(targetFrom, targetTo, targetDate, "easy")[0];
      const fast = findJourneys(targetFrom, targetTo, targetDate, "fastest")[0];
      const cheap = findJourneys(targetFrom, targetTo, targetDate, "cheapest")[0];
      const map = new Map<string, Journey>();
      [easy, fast, cheap].forEach((j) => { if (j) map.set(j.id, j); });
      let list = Array.from(map.values());
      if (list.length < 3) {
        const fb = findJourneys(targetFrom, targetTo, targetDate, "easy");
        fb.forEach((j) => { if (!map.has(j.id)) map.set(j.id, j); });
        list = Array.from(map.values());
      }
      const ordered: Journey[] = [];
      if (easy) ordered.push(easy);
      if (fast && fast.id !== easy?.id) ordered.push(fast);
      if (cheap && cheap.id !== easy?.id && cheap.id !== fast?.id) ordered.push(cheap);
      list.forEach((j) => { if (!ordered.find((o) => o.id === j.id)) ordered.push(j); });
      setJourneys(ordered.slice(0, 3));
      setView("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setToast(`Built ${targetFrom} → ${targetTo} (${targetPref}) — ${res.length} options`);
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setToast("Command failed — try: Delhi to Goa tomorrow. Retrying...");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setCommandLoading(false);
    }
  };

  const handleWaSend = async () => {
    if (!waInput.trim()) return;
    const userText = waInput.trim();
    setWaMessages((prev) => [...prev, { role: "user", text: userText }]);
    setWaInput("");
    // simulate bot never stuck: timeout + fallback
    await new Promise((r) => setTimeout(r, 500));
    try {
      const parsed = parseNaturalCommand(userText);
      if (!parsed?.from || !parsed?.to) {
        setWaMessages((prev) => [...prev, { role: "bot", text: "I need both cities. Try: 'Delhi to Jaipur tomorrow' or 'Mumbai se Goa fastest'" }]);
        return;
      }
      let d = new Date();
      if (parsed.dateOffset !== undefined) d.setDate(d.getDate() + parsed.dateOffset);
      else d.setDate(d.getDate() + 1);
      const dateStr = d.toISOString().slice(0, 10);
      const res = findJourneys(parsed.from, parsed.to, dateStr, parsed.pref || "easy");
      if (res.length === 0) {
        setWaMessages((prev) => [...prev, { role: "bot", text: `No direct route for ${parsed.from} → ${parsed.to}. Try: Delhi to Kolkata, or Mumbai to Chennai.` }]);
        return;
      }
      const j = res[0];
      const txt = `${parsed.from} → ${parsed.to} (${parsed.pref || "easy"}) — ${j.legs.filter(l=>l.type==="train").length} trains, ${formatDuration(j.totalDurationMinutes)}, ₹${j.totalCost}. Risk: ${j.riskLevel}. Tap View to open.`;
      setWaMessages((prev) => [...prev, { role: "bot", text: txt, journey: j }]);
    } catch {
      setWaMessages((prev) => [...prev, { role: "bot", text: "Oops — build hiccup. Try again: 'Delhi to Goa tomorrow'" }]);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("raasta_saved");
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("raasta_saved", JSON.stringify(saved));
  }, [saved]);

  const doSearch = () => {
    if (!from || !to) {
      setToast("Please enter both stations");
      setTimeout(() => setToast(null), 2200);
      return;
    }
    find();
  };
  const find = () => {
    const res = findJourneys(from, to, date, pref);
    if (res.length === 0) {
      setToast("We couldn't find a practical connection for this date. Try another date.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const easy = findJourneys(from, to, date, "easy")[0];
    const fast = findJourneys(from, to, date, "fastest")[0];
    const cheap = findJourneys(from, to, date, "cheapest")[0];
    const map = new Map<string, Journey>();
    [easy, fast, cheap].forEach((j) => {
      if (j) map.set(j.id, j);
    });
    let list = Array.from(map.values());
    if (list.length < 3) {
      const fallback = findJourneys(from, to, date, "easy");
      fallback.forEach((j) => {
        if (!map.has(j.id)) map.set(j.id, j);
      });
      list = Array.from(map.values());
    }
    const ordered: Journey[] = [];
    if (easy) ordered.push(easy);
    if (fast && fast.id !== easy?.id) ordered.push(fast);
    if (cheap && cheap.id !== easy?.id && cheap.id !== fast?.id) ordered.push(cheap);
    list.forEach((j) => {
      if (!ordered.find((o) => o.id === j.id)) ordered.push(j);
    });
    setJourneys(ordered.slice(0, 3));
    setView("results");
    setDelay(0);
    setRecoverSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExplain = async (j: Journey) => {
    setExplainLoading(true);
    setExplain(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journey: j }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.explanation) {
          setExplain(data.explanation);
          setExplainLoading(false);
          return;
        }
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
    const legs = j.legs.filter((l) => l.type === "train") as any[];
    const transfer = (j.legs.find((l) => l.type === "transfer") as any)?.transfer;
    const txt = `You'll take ${legs.length} train${legs.length > 1 ? "s" : ""} and change ${j.interchangeCount === 0 ? "nowhere" : "once at " + getStationName(transfer?.fromStationId)}.\n\nYour first train (${legs[0]?.train.name} ${legs[0]?.train.number}) leaves ${legs[0]?.from.name} at ${legs[0]?.departure} and arrives at ${transfer ? getStationName(transfer.fromStationId) : legs[0]?.to.name} at ${legs[0]?.arrival}.\n\n${transfer ? `You have ${formatDuration(transfer.durationMinutes)} to change trains${transfer.requiresStationChange ? " — you'll need to travel to another station" : " — both trains use the same station, so you won't need to leave the station"}.\n\nWe consider this a ${transfer.risk}-risk connection: ${transfer.reason}\n\n` : ""}Your final train arrives in ${j.destination.city} at approximately ${legs[legs.length - 1]?.arrival}.\nTotal journey time is about ${formatDuration(j.totalDurationMinutes)}. Estimated cost ₹${j.totalCost.toLocaleString("en-IN")} (AC 3-tier).`;
    setExplain(txt);
    setExplainLoading(false);
  };

  const saveJourney = (j: Journey) => {
    if (saved.find((s) => s.id === j.id)) {
      setToast("Already saved");
    } else {
      setSaved((prev) => [...prev, j]);
      setToast("Journey saved");
    }
    setTimeout(() => setToast(null), 2000);
  };

  const recovery = selected ? getRecoveryOptions(selected, delay) : [];

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* Header - enamel board style */}
      <header className="sticky top-0 z-40 bg-[#1B3A5C] border-b-[3px] border-[#F2B705]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-[52px] flex items-center justify-between">
          <button
            onClick={() => {
              setView("landing");
              setSelected(null);
              setShowHow(false);
            }}
            className="flex items-center gap-2.5"
          >
            <div className="h-[28px] px-2 bg-[#F2B705] border border-[#0F2340] grid place-items-center font-display text-[15px] tracking-[0.04em] text-[#1B3A5C] leading-none">
              RAASTA
            </div>
            <span className="hidden sm:inline font-display text-[13px] tracking-[0.1em] text-[#FAF7F0]/80">JOURNEY PLANNER</span>
          </button>
          <nav className="flex items-center gap-2 sm:gap-3 text-sm">
            <button
              onClick={() => setShowWhatsAppDemo(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-[#075E54] hover:bg-[#20bd5a] font-display text-[13px] tracking-wide border border-[#075E54] transition shadow-sm font-bold cursor-pointer"
              title="Try WhatsApp bot demo — instant builds, never stuck"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">WHATSAPP</span> BOT
            </button>
            <button
              onClick={() => {
                setView("landing");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 text-[#FAF7F0]/80 hover:text-white font-medium text-[13px] px-2 py-1"
            >
              <Route className="w-4 h-4" /> Plan journey
            </button>
            <button
              onClick={() => setShowSaved(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F0] text-[#1B3A5C] border border-[#0F2340] text-[13px] font-medium hover:bg-white transition"
            >
              <Bookmark className="w-3.5 h-3.5" />
              SAVED
              {saved.length > 0 && (
                <span className="ml-1 bg-[#1B3A5C] text-white text-[11px] font-mono px-1.5 py-0.5 leading-none">{saved.length}</span>
              )}
            </button>
            <button onClick={() => setShowHow((v) => !v)} className="hidden md:inline text-[13px] text-[#FAF7F0]/70 hover:text-white px-2">
              How it works
            </button>
          </nav>
        </div>
        {showHow && (
          <div className="bg-[#FAF7F0] border-t border-[#E8E0D1]">
            <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-4 grid sm:grid-cols-3 gap-3 text-[13px]">
              <div className="bg-white border border-[#E8E0D1] p-3 flex gap-3">
                <Search className="w-4 h-4 text-[#1B3A5C] mt-0.5 shrink-0" />
                <div>
                  <div className="font-display text-[13px] tracking-wide">01 — Tell us where</div>
                  <p className="text-[#5C6B80] leading-4 mt-1">We build complete journeys, not just trains.</p>
                </div>
              </div>
              <div className="bg-white border border-[#E8E0D1] p-3 flex gap-3">
                <ShieldCheck className="w-4 h-4 text-[#1B3A5C] mt-0.5 shrink-0" />
                <div>
                  <div className="font-display text-[13px] tracking-wide">02 — We validate</div>
                  <p className="text-[#5C6B80] leading-4 mt-1">Transfer time, station changes and delay risk.</p>
                </div>
              </div>
              <div className="bg-white border border-[#E8E0D1] p-3 flex gap-3">
                <Navigation className="w-4 h-4 text-[#1B3A5C] mt-0.5 shrink-0" />
                <div>
                  <div className="font-display text-[13px] tracking-wide">03 — We guide you</div>
                  <p className="text-[#5C6B80] leading-4 mt-1">Next steps, interchange and recovery if delayed.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* LANDING */}
        {view === "landing" && (
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12">
            <div className="grid lg:grid-cols-[1fr_1.05fr] gap-6 lg:gap-8 items-start">
              {/* Left Column: Headline & Search Card */}
              <div>
                <div className="inline-flex items-center gap-2 bg-white border border-[#E8E0D1] px-3 py-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#0E9F4B] animate-pulse" />
                  <span className="text-[11px] font-mono tracking-[0.12em] text-[#1B3A5C]">PUBLIC JOURNEY LAYER · INDIAN RAILWAYS</span>
                </div>
                <h1 className="font-display text-[38px] sm:text-[48px] leading-[0.92] mt-3.5 text-[#1B3A5C]">
                  WHERE ARE
                  <br />
                  <span className="bg-[#F2B705] px-1 text-[#1B3A5C]">YOU GOING?</span>
                </h1>
                <p className="mt-3 text-[13px] sm:text-[14px] leading-5 text-[#1B3A5C]/80 border-l-[3px] border-[#F2B705] pl-3.5 text-left">
                  Don&apos;t search for trains. <span className="font-semibold text-[#1B3A5C]">Plan your journey.</span> Tell us your origin and destination and we&apos;ll find direct trains plus safe, validated connecting routes.
                </p>

                {/* Search Card - ticket form */}
                <div className="mt-5 bg-white border border-[#1B3A5C] p-4 sm:p-5 shadow-[4px_4px_0_#1B3A5C]">
                  <div className="flex items-center justify-between border-b border-[#E8E0D1] pb-2.5 mb-3.5">
                    <span className="font-display text-[12px] tracking-[0.16em] text-[#1B3A5C]">JOURNEY ENQUIRY</span>
                    <span className="font-mono text-[10px] tracking-wide text-[#5C6B80]">NO LOGIN REQUIRED</span>
                  </div>
                  <div className="grid gap-3">
                    {/* From Station */}
                    <StationSelector
                      label="FROM"
                      type="from"
                      value={from}
                      onChange={(stationName) => setFrom(stationName)}
                    />

                    {/* Swap Stations Button */}
                    <div className="flex justify-center -my-1 z-10">
                      <button
                        type="button"
                        onClick={handleSwapStations}
                        title="Swap Origin and Destination"
                        className="w-7 h-7 bg-[#1B3A5C] text-[#F2B705] hover:bg-[#0F2340] hover:scale-110 active:scale-95 transition-all grid place-items-center border border-[#0F2340] shadow-sm cursor-pointer"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* To Station */}
                    <StationSelector
                      label="TO"
                      type="to"
                      value={to}
                      onChange={(stationName) => setTo(stationName)}
                    />
                    {/* Date */}
                    <div>
                      <label className="font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] flex items-center gap-1.5">
                        <Clock3 className="w-3.5 h-3.5" /> DATE
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 w-full bg-white border border-[#E8E0D1] px-3 py-2.5 font-mono text-sm outline-none focus:border-[#1B3A5C] focus:ring-1 focus:ring-[#1B3A5C]"
                      />
                      <div className="font-mono text-[10px] text-[#5C6B80] mt-1 flex items-center gap-1">
                        <Timer className="w-3 h-3" /> {formatDateShort(date).toUpperCase()} · {formatDate(date)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={doSearch}
                    className="mt-4 w-full bg-[#F2B705] text-[#1B3A5C] border-[2px] border-[#1B3A5C] font-display text-[15px] tracking-[0.08em] py-3 flex items-center justify-center gap-2 hover:brightness-105 transition shadow-[3px_3px_0_#1B3A5C] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  >
                    FIND MY JOURNEY <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setFrom("New Delhi");
                      setTo("Madgaon");
                      setDate(todayISO());
                      setPref("easy");
                      find();
                    }}
                    className="mt-2.5 w-full text-[12px] text-[#1B3A5C] underline decoration-[#F2B705] decoration-2 underline-offset-4 hover:text-[#0F2340] py-1 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" /> Try sample: New Delhi → Madgaon (Goa)
                  </button>

                  <div className="mt-3 border-t border-[#E8E0D1] pt-3 space-y-2">
                    <button
                      onClick={() => setShowWhatsAppDemo(true)}
                      className="w-full bg-[#E7FFDB] hover:bg-[#d5f8c6] border border-[#25D366] text-[#075E54] font-mono text-[11px] sm:text-[12px] font-bold py-2 px-3 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#075E54] fill-current" />
                      <span>Try WhatsApp bot demo — no stuck builds</span>
                    </button>
                    <a
                      href="https://wa.me/14155238886?text=Delhi%20se%20Goa%20jana%20hai%20kal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-white hover:bg-[#FAF7F0] border border-[#E8E0D1] text-[#1B3A5C] font-mono text-[11px] py-1.5 px-3 flex items-center justify-center gap-2 transition"
                    >
                      Or send voice note on real WhatsApp (+1 415 523 8886) →
                    </a>
                  </div>
                </div>
                {/* Natural-language command bar — never stuck */}
                <div className="mt-3 bg-[#1B3A5C] border border-[#0F2340] p-3">
                  <div className="font-mono text-[10px] tracking-[0.14em] text-[#F2B705] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> CLAUDE-STYLE COMMAND — TYPE & BUILD INSTANTLY
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={commandText}
                      onChange={(e) => setCommandText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCommandBuild(); }}
                      placeholder="Try: Delhi to Jaipur tomorrow fastest"
                      className="flex-1 bg-white border border-[#E8E0D1] px-3 py-2 font-mono text-[13px] outline-none focus:border-[#F2B705] placeholder:text-[#5C6B80]/60"
                    />
                    <button onClick={handleCommandBuild} disabled={commandLoading} className="px-4 bg-[#F2B705] text-[#1B3A5C] border border-[#0F2340] font-display text-[12px] tracking-wide hover:brightness-105 disabled:opacity-60 cursor-pointer flex items-center gap-1.5">
                      {commandLoading ? "BUILDING..." : "BUILD"} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-[#FAF7F0]/60 mt-1.5">Parses Hindi/English: “Delhi se Goa kal”, “Mumbai to Chennai cheapest”. 5s timeout — never stuck midway. Fallback to form.</div>
                </div>
                {/* Popular routes — fixes “same thing every time” */}
                <div className="mt-3">
                  <div className="font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] mb-2">POPULAR — TAP TO TRY DIFFERENT:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_ROUTES.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => {
                          setFrom(r.from);
                          setTo(r.to);
                          // keep date/pref, build immediately
                          const res = findJourneys(r.from, r.to, date, pref);
                          if (res.length > 0) {
                            const easy = findJourneys(r.from, r.to, date, "easy")[0];
                            const fast = findJourneys(r.from, r.to, date, "fastest")[0];
                            const cheap = findJourneys(r.from, r.to, date, "cheapest")[0];
                            const map = new Map<string, Journey>();
                            [easy, fast, cheap].forEach((j) => { if (j) map.set(j.id, j); });
                            let list = Array.from(map.values());
                            if (list.length < 3) {
                              const fb = findJourneys(r.from, r.to, date, "easy");
                              fb.forEach((j) => { if (!map.has(j.id)) map.set(j.id, j); });
                              list = Array.from(map.values());
                            }
                            const ordered: Journey[] = [];
                            if (easy) ordered.push(easy);
                            if (fast && fast.id !== easy?.id) ordered.push(fast);
                            if (cheap && cheap.id !== easy?.id && cheap.id !== fast?.id) ordered.push(cheap);
                            list.forEach((j) => { if (!ordered.find((o) => o.id === j.id)) ordered.push(j); });
                            setJourneys(ordered.slice(0, 3));
                            setView("results");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          } else {
                            setToast(`No route yet for ${r.label}`);
                            setTimeout(() => setToast(null), 2000);
                          }
                        }}
                        className="px-2.5 py-1 bg-white border border-[#E8E0D1] font-mono text-[11px] hover:border-[#1B3A5C] hover:bg-[#FAF7F0] cursor-pointer"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: 'Why Raasta Is Better' Interactive Carousel */}
              <div
                className="bg-white border border-[#1B3A5C] shadow-[4px_4px_0_#1B3A5C] overflow-hidden flex flex-col justify-between"
                onMouseEnter={() => setIsAutoPlay(false)}
                onMouseLeave={() => setIsAutoPlay(true)}
              >
                {/* Carousel Header & Controls */}
                <div className="bg-[#1B3A5C] text-[#FAF7F0] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#F2B705]" />
                    <span className="font-display text-[11px] sm:text-[12px] tracking-[0.14em]">
                      WHY OUR TRAIN SEARCH IS BETTER
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#F2B705] tracking-widest bg-[#0F2340] px-2 py-0.5 border border-[#F2B705]/30">
                      0{carouselSlide + 1} / 04
                    </span>
                    <button
                      onClick={() => setCarouselSlide((prev) => (prev === 0 ? 3 : prev - 1))}
                      className="w-6 h-6 rounded bg-[#FAF7F0] text-[#1B3A5C] hover:bg-[#F2B705] transition grid place-items-center cursor-pointer"
                      title="Previous feature"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCarouselSlide((prev) => (prev + 1) % 4)}
                      className="w-6 h-6 rounded bg-[#FAF7F0] text-[#1B3A5C] hover:bg-[#F2B705] transition grid place-items-center cursor-pointer"
                      title="Next feature"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Slide Active Content */}
                {(() => {
                  const s = CAROUSEL_SLIDES[carouselSlide];
                  const Icon = s.icon;
                  return (
                    <div className="p-5 flex-1 flex flex-col justify-between animate-fadeIn">
                      <div>
                        {/* Slide Category Tag & Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider bg-[#1B3A5C]/10 text-[#1B3A5C] px-2 py-0.5 border border-[#1B3A5C]/20">
                            <Icon className="w-3 h-3 text-[#F2B705]" /> {s.tag}
                          </span>
                          <span className="font-mono text-[9px] tracking-wider text-[#0E9F4B] bg-[#0E9F4B]/10 border border-[#0E9F4B]/30 px-2 py-0.5 font-semibold">
                            {s.badge}
                          </span>
                        </div>

                        {/* Title & Subtitle */}
                        <h3 className="font-display text-[20px] sm:text-[22px] leading-tight mt-2.5 text-[#1B3A5C]">
                          {s.title}
                        </h3>
                        <p className="text-[13px] font-semibold text-[#5C6B80] mt-0.5">
                          {s.subtitle}
                        </p>

                        <p className="text-[13px] leading-5 text-[#1B3A5C]/80 mt-2.5 border-l-2 border-[#1B3A5C] pl-2.5">
                          {s.desc}
                        </p>

                        {/* Feature Bullet Points */}
                        <div className="mt-3.5 space-y-1.5">
                          {s.points.map((pt, i) => (
                            <div key={i} className="flex items-start gap-2 text-[12px] text-[#1B3A5C]">
                              <Check className="w-3.5 h-3.5 text-[#0E9F4B] shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Visual Box */}
                      <div className="mt-4 pt-3 border-t border-[#E8E0D1]">
                        {s.demo.type === "layover" && (
                          <div className="bg-[#FAF7F0] border border-[#E8E0D1] p-3">
                            <div className="font-mono text-[10px] text-[#5C6B80] tracking-wider mb-1.5">
                              INTERACTIVE ROUTE SIMULATION:
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                              <div className="bg-white border border-[#E8E0D1] p-2 flex-1 w-full">
                                <div className="font-mono text-[10px] text-[#5C6B80]">LEG 1</div>
                                <div className="font-mono text-[11px] font-bold text-[#1B3A5C]">{s.demo.t1}</div>
                                <div className="font-mono text-[10px] text-[#0E9F4B]">{s.demo.t1Time}</div>
                              </div>
                              <div className="px-2 py-1 bg-[#F2B705] text-[#1B3A5C] font-mono text-[10px] font-bold border border-[#1B3A5C] shrink-0">
                                ➔ 2h 35m BUFFER ➔
                              </div>
                              <div className="bg-white border border-[#E8E0D1] p-2 flex-1 w-full">
                                <div className="font-mono text-[10px] text-[#5C6B80]">LEG 2</div>
                                <div className="font-mono text-[11px] font-bold text-[#1B3A5C]">{s.demo.t2}</div>
                                <div className="font-mono text-[10px] text-[#0E9F4B]">{s.demo.t2Time}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {s.demo.type === "risk" && (
                          <div className="bg-[#FAF7F0] border border-[#E8E0D1] p-3">
                            <div className="font-mono text-[10px] text-[#5C6B80] tracking-wider mb-2">
                              SAFETY BUFFER RISK TIERS:
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {s.demo.bars?.map((b, i) => (
                                <div key={i} className="bg-white border p-2 text-center" style={{ borderColor: b.color }}>
                                  <div className="font-mono text-[10px] font-bold text-white px-1 py-0.5" style={{ background: b.color }}>
                                    {b.label}
                                  </div>
                                  <div className="font-mono text-[12px] font-bold text-[#1B3A5C] mt-1">{b.buffer}</div>
                                  <div className="font-mono text-[9px] text-[#5C6B80] mt-0.5">{b.note}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {s.demo.type === "metro" && (
                          <div className="bg-[#FAF7F0] border border-[#E8E0D1] p-3">
                            <div className="font-mono text-[10px] text-[#5C6B80] tracking-wider mb-1.5">
                              CROSS-TERMINAL ROAD INTEGRATION:
                            </div>
                            <div className="space-y-1.5">
                              {s.demo.routes?.map((r, i) => (
                                <div key={i} className="bg-white border border-[#E8E0D1] p-2 flex items-center justify-between text-[11px] font-mono">
                                  <span className="font-bold text-[#1B3A5C]">{r.from} ➔ {r.to}</span>
                                  <span className="text-[#0E9F4B] font-semibold">{r.road}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {s.demo.type === "simulator" && (
                          <div className="bg-[#FAF7F0] border border-[#E8E0D1] p-3">
                            <div className="font-mono text-[10px] text-[#5C6B80] tracking-wider mb-1.5">
                              1-CLICK DELAY RECOVERY:
                            </div>
                            <div className="bg-white border border-[#1B3A5C] p-2.5 flex items-center justify-between">
                              <div className="font-mono text-[11px] text-[#C62828] font-bold">
                                ⚠ {s.demo.delay}
                              </div>
                              <div className="font-mono text-[11px] text-[#0E9F4B] font-bold">
                                ✓ {s.demo.result}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom Navigation Dots / Tabs */}
                <div className="bg-[#FAF7F0] border-t border-[#E8E0D1] px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {CAROUSEL_SLIDES.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => setCarouselSlide(idx)}
                        className={`h-2 transition-all rounded-full cursor-pointer ${
                          carouselSlide === idx
                            ? "w-7 bg-[#1B3A5C]"
                            : "w-2 bg-[#1B3A5C]/30 hover:bg-[#1B3A5C]/60"
                        }`}
                        title={s.title}
                      />
                    ))}
                  </div>
                  <div className="font-mono text-[10px] text-[#5C6B80] flex items-center gap-1">
                    {isAutoPlay ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0E9F4B] animate-ping" /> AUTO-PLAYING
                      </span>
                    ) : (
                      <span>HOVER PAUSED</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PREFERENCES */}
        {view === "prefs" && (
          <div className="max-w-[680px] mx-auto px-4 sm:px-6 pt-6 pb-8">
            <button onClick={() => setView("landing")} className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] hover:text-[#1B3A5C] mb-4">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> BACK
            </button>
            <h2 className="font-display text-[28px] leading-none">WHAT MATTERS MOST?</h2>
            <p className="text-[13px] text-[#5C6B80] mt-2">We&apos;ll rank journeys accordingly. You can change this anytime.</p>
            <div className="grid gap-3 mt-6">
              {[
                { id: "easy", label: "EASY JOURNEY", icon: Leaf, desc: "Fewer changes and more time between trains. Best for family travel." },
                { id: "fastest", label: "FASTEST", icon: Zap, desc: "Shortest total time — tighter connections." },
                { id: "cheapest", label: "CHEAPEST", icon: Wallet, desc: "Minimize estimated cost — may be longer." },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setPref(c.id as Preference)}
                  className={`text-left border-[2px] p-4 flex gap-4 items-start transition ${pref === c.id ? "bg-white border-[#1B3A5C] shadow-[3px_3px_0_#1B3A5C]" : "bg-white border-[#E8E0D1] hover:border-[#5C6B80]"}`}
                >
                  <span className={`w-9 h-9 grid place-items-center border shrink-0 ${pref === c.id ? "bg-[#F2B705] border-[#1B3A5C] text-[#1B3A5C]" : "bg-[#FAF7F0] border-[#E8E0D1] text-[#1B3A5C]"}`}>
                    <c.icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-[14px] tracking-wide flex items-center gap-2">
                      {c.label} {pref === c.id && <span className="font-mono text-[10px] tracking-wide bg-[#1B3A5C] text-white px-1.5 py-0.5">SELECTED</span>}
                    </div>
                    <div className="text-[13px] text-[#5C6B80] mt-1 leading-4">{c.desc}</div>
                  </div>
                  <span className={`w-5 h-5 rounded-full border-[2px] grid place-items-center shrink-0 mt-0.5 ${pref === c.id ? "border-[#1B3A5C]" : "border-[#E8E0D1]"}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${pref === c.id ? "bg-[#1B3A5C]" : ""}`} />
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 bg-white border border-[#E8E0D1] p-4">
              <div className="font-display text-[12px] tracking-[0.12em]">OPTIONAL</div>
              <label className="flex items-center gap-2 text-[13px] py-1.5 mt-1">
                <input type="checkbox" checked={extras.children} onChange={(e) => setExtras({ ...extras, children: e.target.checked })} className="accent-[#1B3A5C]" /> Travelling with children
              </label>
              <label className="flex items-center gap-2 text-[13px] py-1.5">
                <input type="checkbox" checked={extras.elderly} onChange={(e) => setExtras({ ...extras, elderly: e.target.checked })} className="accent-[#1B3A5C]" /> Travelling with elderly passenger
              </label>
              <label className="flex items-center gap-2 text-[13px] py-1.5">
                <input type="checkbox" checked={extras.fewerTransfers} onChange={(e) => setExtras({ ...extras, fewerTransfers: e.target.checked })} className="accent-[#1B3A5C]" /> Prefer fewer station transfers
              </label>
              {(extras.children || extras.elderly) && <p className="font-mono text-[11px] text-[#5C6B80] mt-2">We&apos;ll favour larger buffers and simpler transfers.</p>}
            </div>
            <button onClick={find} className="mt-4 w-full bg-[#F2B705] text-[#1B3A5C] border-[2px] border-[#1B3A5C] font-display text-[14px] tracking-[0.08em] py-3 flex items-center justify-center gap-2 shadow-[3px_3px_0_#1B3A5C] hover:brightness-105">
              FIND JOURNEYS <ArrowRight className="w-4 h-4" /> {from.toUpperCase()} → {to.toUpperCase()}
            </button>
            <p className="text-center font-mono text-[11px] text-[#5C6B80] mt-2">WE&apos;LL SHOW 3 CURATED OPTIONS, NOT A GIANT LIST.</p>
          </div>
        )}

        {/* RESULTS */}
        {view === "results" && (
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-8">
            <button onClick={() => setView("landing")} className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] hover:text-[#1B3A5C] mb-3">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> CHANGE SEARCH
            </button>
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-display text-[24px] sm:text-[28px] leading-none">
                  {from.toUpperCase()} → {to.toUpperCase()}
                </h2>
                <p className="text-[13px] text-[#5C6B80] mt-1">We found {journeys.length} practical route combinations.</p>
              </div>
              <span className="font-mono text-[11px] tracking-wide bg-white border border-[#E8E0D1] px-2 py-1 shrink-0">{formatDateShort(date).toUpperCase()}</span>
            </div>

            {/* Quick Filter / Sort Pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "easy", label: "RECOMMENDED (EASY)", icon: Leaf },
                { id: "fastest", label: "FASTEST", icon: Zap },
                { id: "cheapest", label: "CHEAPEST", icon: Wallet },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => {
                    setPref(pill.id as Preference);
                    const res = findJourneys(from, to, date, pill.id as Preference);
                    if (res.length > 0) setJourneys(res);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono tracking-wide border transition ${
                    pref === pill.id
                      ? "bg-[#1B3A5C] text-white border-[#1B3A5C] shadow-[2px_2px_0_#F2B705]"
                      : "bg-white text-[#1B3A5C] border-[#E8E0D1] hover:border-[#1B3A5C]"
                  }`}
                >
                  <pill.icon className="w-3 h-3" />
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 mt-6">
              {journeys.map((j, idx) => {
                const isRecommended = idx === 0;
                const isDirect = j.interchangeCount === 0;
                const label = isRecommended ? "BEST FOR YOU" : idx === 1 ? "FASTEST" : "CHEAPEST";
                const transfer = (j.legs.find((l) => l.type === "transfer") as any)?.transfer;
                const legs = j.legs.filter((l) => l.type === "train") as any[];
                const risk = j.riskLevel;
                const departureTime = legs[0]?.departure || "--:--";
                const arrivalTime = legs[legs.length - 1]?.arrival || "--:--";
                const originCode = legs[0]?.from?.code || j.origin.code;
                const destCode = legs[legs.length - 1]?.to?.code || j.destination.code;

                return (
                  <div
                    key={j.id}
                    className={`bg-white border overflow-hidden flex flex-col sm:flex-row ${isRecommended ? "border-[#1B3A5C] shadow-[4px_4px_0_#1B3A5C]" : "border-[#E8E0D1]"} ${isRecommended ? "scale-[1.01]" : ""}`}
                  >
                    {/* left/top edge color strip */}
                    <div className="h-[4px] sm:h-auto sm:w-[6px] shrink-0" style={{ background: isDirect ? "#0E9F4B" : (RISK_COLOR[risk] ?? "#1B3A5C") }} />
                    <div className={`flex-1 ${isRecommended ? "p-4 sm:p-5" : "p-4"}`}>
                      {/* Top Sublabel & Category Tags */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#FAF7F0]">
                        <div className="flex flex-wrap items-center gap-2">
                          {isDirect ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider bg-[#0E9F4B] text-white px-2 py-0.5 shadow-sm">
                              <Sparkles className="w-3 h-3 text-[#F2B705]" /> DIRECT TRAIN · NO INTERCHANGE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider bg-[#1B3A5C] text-[#FAF7F0] px-2 py-0.5">
                              <Route className="w-3 h-3 text-[#F2B705]" /> 1 CHANGE · VIA {getStationName(transfer?.fromStationId).toUpperCase()}
                            </span>
                          )}
                          {isRecommended && (
                            <span className="font-display text-[10px] tracking-[0.14em] bg-[#F2B705] text-[#1B3A5C] border border-[#1B3A5C] px-1.5 py-0.5 font-bold">
                              RECOMMENDED
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-display text-[11px] tracking-[0.14em] text-[#5C6B80]">{label}</span>
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wide text-white px-2 py-0.5" style={{ background: isDirect ? "#0E9F4B" : RISK_COLOR[risk] }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white" /> {isDirect ? "ZERO RISK" : RISK_LABEL[risk].toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Header: Stations & Timings */}
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <div className="font-display text-[16px] sm:text-[18px] tracking-wide text-[#1B3A5C]">
                            {j.origin.name.toUpperCase()} ({originCode}) → {j.destination.name.toUpperCase()} ({destCode})
                          </div>
                          <div className="font-mono text-[12px] font-bold text-[#1B3A5C] mt-0.5 flex items-center gap-2">
                            <span>{departureTime}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#5C6B80]" />
                            <span>{arrivalTime} {legs.length > 1 || legs[0]?.dayOffset ? `(+${legs[legs.length - 1]?.dayOffset || 1} day)` : ""}</span>
                            <span className="font-normal text-[11px] text-[#5C6B80]">· {formatDateShort(date).toUpperCase()}</span>
                          </div>
                        </div>

                        {/* Prominent Price & Duration Header Callout */}
                        <div className="text-right">
                          <div className="font-display text-[18px] sm:text-[20px] text-[#1B3A5C] leading-none">
                            ₹{j.totalCost.toLocaleString("en-IN")}
                          </div>
                          <div className="font-mono text-[10px] text-[#5C6B80] mt-0.5">AC 3-TIER EST.</div>
                        </div>
                      </div>

                      {/* Train Numbers & Names Badge */}
                      <div className="mt-2.5 bg-[#FAF7F0] border border-[#E8E0D1] px-2.5 py-1.5 font-mono text-[11px] text-[#1B3A5C] flex flex-wrap items-center gap-1.5">
                        <TrainFront className="w-3.5 h-3.5 text-[#1B3A5C] shrink-0" />
                        {legs.map((l: any, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1">
                            <span className="font-bold">{l.train.number}</span> {l.train.name}
                            {i < legs.length - 1 && <span className="text-[#5C6B80] font-bold mx-1">➔</span>}
                          </span>
                        ))}
                      </div>

                      {/* 3 Metric Cards: Duration, Route/Layover, Price */}
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="border border-[#E8E0D1] bg-[#FAF7F0] p-2 sm:p-2.5">
                          <div className="font-mono text-[10px] tracking-[0.12em] text-[#5C6B80] flex items-center justify-center gap-1">
                            <Clock3 className="w-3 h-3" /> TOTAL DURATION
                          </div>
                          <div className="font-mono text-[13px] sm:text-[14px] font-bold text-[#1B3A5C] mt-1">
                            {formatDuration(j.totalDurationMinutes).toUpperCase()}
                          </div>
                          <div className="font-mono text-[10px] text-[#5C6B80]">
                            {isDirect ? "DIRECT ROUTE" : "INCL. LAYOVER"}
                          </div>
                        </div>

                        <div className="border border-[#E8E0D1] bg-[#FAF7F0] p-2 sm:p-2.5">
                          <div className="font-mono text-[10px] tracking-[0.12em] text-[#5C6B80] flex items-center justify-center gap-1">
                            <ArrowLeftRight className="w-3 h-3" /> INTERCHANGE
                          </div>
                          <div className="font-mono text-[13px] sm:text-[14px] font-bold text-[#1B3A5C] mt-1">
                            {isDirect ? "DIRECT" : "1 CHANGE"}
                          </div>
                          <div className="font-mono text-[10px] text-[#5C6B80] truncate">
                            {transfer ? `${formatDuration(transfer.durationMinutes)} @ ${getStationName(transfer.fromStationId)}` : "NO STOPS"}
                          </div>
                        </div>

                        <div className="border border-[#E8E0D1] bg-[#FAF7F0] p-2 sm:p-2.5">
                          <div className="font-mono text-[10px] tracking-[0.12em] text-[#5C6B80] flex items-center justify-center gap-1">
                            <IndianRupee className="w-3 h-3" /> TOTAL FARE
                          </div>
                          <div className="font-mono text-[13px] sm:text-[14px] font-bold text-[#1B3A5C] mt-1">
                            ₹{j.totalCost.toLocaleString("en-IN")}
                          </div>
                          <div className="font-mono text-[10px] text-[#5C6B80]">AC 3-TIER</div>
                        </div>
                      </div>

                      {transfer && (
                        <div className="mt-3 border border-[#E8E0D1] bg-[#FAF7F0] p-2.5 sm:p-3 flex items-start gap-2">
                          {risk === "low" ? (
                            <ShieldCheck className="w-4 h-4 shrink-0 text-[#0E9F4B]" />
                          ) : risk === "medium" ? (
                            <ShieldAlert className="w-4 h-4 shrink-0 text-[#D98200]" />
                          ) : (
                            <OctagonAlert className="w-4 h-4 shrink-0 text-[#C62828]" />
                          )}
                          <div className="font-mono text-[11px] sm:text-[12px] leading-4">
                            <span className="font-semibold text-[#1B3A5C]">{formatDuration(transfer.durationMinutes).toUpperCase()} LAYOVER:</span>
                            <span className="text-[#5C6B80]"> {transfer.reason}</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            setSelected(j);
                            setView("detail");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 font-display text-[13px] tracking-[0.08em] py-2.5 border-[2px] transition ${isRecommended ? "bg-[#F2B705] text-[#1B3A5C] border-[#1B3A5C] shadow-[2px_2px_0_#1B3A5C]" : "bg-white text-[#1B3A5C] border-[#1B3A5C] hover:bg-[#FAF7F0]"}`}
                        >
                          VIEW FULL TIMELINE <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => saveJourney(j)}
                          className="px-3 border border-[#E8E0D1] bg-white text-[#1B3A5C] hover:bg-[#FAF7F0] grid place-items-center"
                          aria-label="Save"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>
                      {isRecommended && j.whyNotFaster && (
                        <p className="font-mono text-[11px] text-[#5C6B80] mt-2 flex gap-1.5">
                          <Info className="w-3 h-3 shrink-0 mt-0.5" /> {j.whyNotFaster}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DETAIL */}
        {view === "detail" && selected && (
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-8">
            <button onClick={() => setView("results")} className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] hover:text-[#1B3A5C] mb-3">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> BACK TO RESULTS
            </button>
            <h2 className="font-display text-[28px] leading-none">YOUR JOURNEY TO {selected.destination.city.toUpperCase()}</h2>
            <p className="font-mono text-[12px] text-[#5C6B80] mt-1">
              {selected.origin.name.toUpperCase()} → {selected.destination.name.toUpperCase()} · {formatDate(date).toUpperCase()}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide bg-white border border-[#E8E0D1] px-2.5 py-1">
                <Clock3 className="w-3 h-3" /> {formatDuration(selected.totalDurationMinutes).toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide bg-white border border-[#E8E0D1] px-2.5 py-1">
                <ArrowLeftRight className="w-3 h-3" /> {selected.interchangeCount} INTERCHANGE
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide bg-white border border-[#E8E0D1] px-2.5 py-1">
                <IndianRupee className="w-3 h-3" /> ₹{selected.totalCost.toLocaleString("en-IN")} EST.
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] tracking-wide text-white px-2.5 py-1" style={{ background: RISK_COLOR[selected.riskLevel] }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white" /> {RISK_LABEL[selected.riskLevel].toUpperCase()}
              </span>
            </div>

            {/* Timeline - rail line */}
            <div className="mt-6 bg-white border border-[#E8E0D1] p-4 sm:p-5">
              <div className="font-display text-[11px] tracking-[0.16em] text-[#5C6B80] mb-4">TIMELINE — RAIL LINE</div>
              <div className="relative pl-10">
                {/* continuous rail */}
                <div className="absolute left-[18px] top-2 bottom-2 w-[3px] bg-[#1B3A5C]" />
                {/* sleepers */}
                <div className="absolute left-[10px] top-2 bottom-2 w-[19px] flex flex-col justify-between py-1 pointer-events-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="h-[2px] bg-[#1B3A5C] w-full opacity-30" />
                  ))}
                </div>

                <div className="space-y-1">
                  {selected.legs.map((leg, i) => {
                    if (leg.type === "train") {
                      return (
                        <div key={i} className="relative pb-4">
                          <span className="absolute -left-[28px] top-1 w-[14px] h-[14px] rounded-full bg-[#1B3A5C] border-[3px] border-[#FAF7F0] shadow-[0_0_0_1px_#1B3A5C] z-10" />
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="font-mono text-[11px] font-semibold text-[#1B3A5C]">
                                {(leg as any).departure} · DAY {(leg as any).dayOffset + 1}
                              </div>
                              <div className="mt-1 inline-block bg-[#1B3A5C] text-[#FAF7F0] font-display text-[12px] tracking-wide px-2 py-1 leading-none">
                                {(leg as any).from.name.toUpperCase()}
                              </div>
                              <div className="font-mono text-[11px] text-[#5C6B80] mt-1">
                                {(leg as any).from.code} · PLATFORM {(leg as any).train.stops.find((s: any) => s.stationId === (leg as any).from.id)?.platform ?? "—"}
                              </div>
                            </div>
                            <span className="font-mono text-[11px] bg-[#FAF7F0] border border-[#E8E0D1] px-2 py-1 inline-flex items-center gap-1 shrink-0">
                              <TrainFront className="w-3 h-3" /> {(leg as any).train.number} · {(leg as any).train.name.toUpperCase()}
                            </span>
                          </div>
                          <div className="mt-2 ml-1 border-l border-dashed border-[#E8E0D1] pl-3 py-2">
                            <div className="font-mono text-[11px] text-[#5C6B80] leading-4">
                              ON BOARD {formatDuration((leg as any).train.durationMinutes).toUpperCase()} · SL ₹{(leg as any).train.fare.sleeper} · 3A ₹{(leg as any).train.fare.ac3} ·{" "}
                              {(leg as any).train.reliability}% ON-TIME · AVG {(leg as any).train.avgDelay}M
                            </div>
                          </div>
                          <div className="flex justify-between items-start mt-2 gap-4">
                            <div>
                              <div className="font-mono text-[11px] font-semibold text-[#1B3A5C]">
                                {(leg as any).arrival} {(leg as any).dayOffset ? "· NEXT DAY" : ""}
                              </div>
                              <div className="mt-1 inline-block bg-white border border-[#1B3A5C] text-[#1B3A5C] font-display text-[12px] tracking-wide px-2 py-1 leading-none">
                                {(leg as any).to.name.toUpperCase()}
                              </div>
                              <div className="font-mono text-[11px] text-[#5C6B80] mt-1">{(leg as any).to.code}</div>
                            </div>
                            <span className="font-mono text-[10px] tracking-wide text-[#5C6B80]">{(leg as any).train.days.join(" · ")}</span>
                          </div>
                        </div>
                      );
                    } else {
                      const tr = (leg as any).transfer;
                      return (
                        <div key={i} className="relative pb-4 -ml-10 pl-10">
                          <div className="border-[1.5px] border-dashed border-[#1B3A5C]/30 bg-[#FAF7F0] p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-display text-[12px] tracking-wide inline-flex items-center gap-1.5">
                                <ArrowLeftRight className="w-3.5 h-3.5" /> CHANGE AT {getStationName(tr.fromStationId).toUpperCase()}
                              </span>
                              <span
                                className="inline-flex items-center gap-1 font-mono text-[11px] tracking-wide text-white px-2 py-1 shrink-0"
                                style={{ background: RISK_COLOR[tr.risk] ?? "#1B3A5C" }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                {RISK_LABEL[tr.risk]?.toUpperCase() ?? tr.risk.toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="bg-white border border-[#E8E0D1] p-2.5 text-center">
                                <div className="font-mono text-[10px] tracking-[0.12em] text-[#5C6B80]">YOU HAVE</div>
                                <div className="font-mono text-[18px] font-bold text-[#1B3A5C] leading-none mt-1">{formatDuration(tr.durationMinutes).toUpperCase()}</div>
                                <div className="font-mono text-[11px] text-[#5C6B80] mt-1">USABLE {formatDuration(tr.usableBuffer).toUpperCase()} AFTER WALK</div>
                              </div>
                              <div className="bg-white border border-[#E8E0D1] p-2.5">
                                <div className="font-mono text-[10px] tracking-[0.12em] text-[#5C6B80]">DO THIS</div>
                                <ol className="font-mono text-[11px] mt-1 list-decimal pl-4 space-y-0.5 leading-4">
                                  <li>Alight at {getStationName(tr.fromStationId)}</li>
                                  <li>Signs → Platform {(selected.legs[i + 1] as any)?.train?.stops?.find((s: any) => s.stationId === tr.toStationId)?.platform ?? "7"}</li>
                                  <li>Walk ~{tr.requiredWalkingMinutes} min</li>
                                  <li>Board next train</li>
                                </ol>
                              </div>
                            </div>
                            {tr.requiresStationChange ? (
                              <div className="mt-2 font-mono text-[11px] leading-4 bg-white border border-[#C62828]/30 p-2 flex gap-2">
                                <OctagonAlert className="w-3.5 h-3.5 shrink-0 text-[#C62828] mt-0.5" />
                                <span>
                                  <strong>STATION TRANSFER:</strong> {getStationName(tr.fromStationId)} → {getStationName(tr.toStationId)} · ROAD {tr.stationChangeTransferMinutes}–
                                  {tr.stationChangeTransferMinutes! + 5} MIN. {tr.reason}
                                </span>
                              </div>
                            ) : (
                              <div className="mt-2 font-mono text-[11px] text-[#5C6B80] flex gap-1.5">
                                <Check className="w-3 h-3 shrink-0 mt-0.5" /> {tr.reason}
                              </div>
                            )}
                            <details className="mt-2">
                              <summary className="cursor-pointer font-mono text-[11px] tracking-wide text-[#5C6B80] hover:text-[#1B3A5C]">HOW WE CALCULATE RISK</summary>
                              <p className="mt-1 font-mono text-[11px] leading-4 text-[#5C6B80]">
                                Usable = dep₂ − arr₁ − walk. Low ≥60m, Moderate 20–60m, High &lt;20m. + reliability ({(selected.legs[0] as any).train.reliability}% /{" "}
                                {(selected.legs[2] as any)?.train?.reliability ?? 0}% on-time) and station complexity. Station change adds penalty.
                              </p>
                            </details>
                          </div>
                        </div>
                      );
                    }
                  })}
                  <div className="relative">
                    <span className="absolute -left-[28px] -top-1 w-[16px] h-[16px] bg-[#F2B705] border-[2px] border-[#1B3A5C] grid place-items-center">
                      <Flag className="w-3 h-3 text-[#1B3A5C]" />
                    </span>
                    <div className="inline-block bg-[#F2B705] border border-[#1B3A5C] text-[#1B3A5C] font-display text-[12px] tracking-wide px-2 py-1 leading-none">
                      {selected.destination.city.toUpperCase()} — YOU&apos;VE ARRIVED
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why */}
            <div className="mt-4 bg-white border border-[#E8E0D1] p-4 sm:p-5">
              <h3 className="font-display text-[13px] tracking-[0.12em] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1B3A5C]" /> WHY WE RECOMMEND THIS
              </h3>
              <ul className="mt-3 space-y-1.5">
                {selected.reasons.map((r, idx) => (
                  <li key={idx} className="text-[13px] flex gap-2 leading-4">
                    <Check className="w-3.5 h-3.5 shrink-0 text-[#0E9F4B] mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              {selected.whyNotFaster && <p className="mt-3 font-mono text-[12px] leading-4 bg-[#FAF7F0] border border-[#E8E0D1] p-3">{selected.whyNotFaster}</p>}
              <button
                onClick={() => handleExplain(selected)}
                className="mt-3 w-full border border-[#1B3A5C] bg-[#FAF7F0] py-2.5 font-mono text-[12px] tracking-wide inline-flex items-center justify-center gap-1.5 hover:bg-white"
              >
                <Sparkles className="w-3.5 h-3.5" /> {explainLoading ? "EXPLAINING…" : "EXPLAIN THIS JOURNEY"}
              </button>
              {explain && (
                <div className="mt-3 bg-[#1B3A5C] text-[#FAF7F0] p-4 font-mono text-[12px] leading-5 whitespace-pre-wrap border-l-[4px] border-[#F2B705]">
                  {explain}
                  <div className="font-mono text-[10px] tracking-wide text-[#FAF7F0]/60 mt-2">AI uses structured journey data only — no invented times.</div>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-2">
              <button
                onClick={() => {
                  setView("journey");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full bg-[#F2B705] text-[#1B3A5C] border-[2px] border-[#1B3A5C] font-display text-[14px] tracking-[0.08em] py-3 flex items-center justify-center gap-2 shadow-[3px_3px_0_#1B3A5C] hover:brightness-105"
              >
                START JOURNEY <ArrowRight className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => saveJourney(selected)} className="border border-[#E8E0D1] bg-white py-2.5 font-mono text-[12px] tracking-wide inline-flex items-center justify-center gap-1.5 hover:bg-[#FAF7F0]">
                  <Bookmark className="w-3.5 h-3.5" /> SAVE
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(JSON.stringify(selected, null, 2));
                    setToast("Journey JSON copied");
                    setTimeout(() => setToast(null), 2000);
                  }}
                  className="border border-[#E8E0D1] bg-white py-2.5 font-mono text-[12px] tracking-wide inline-flex items-center justify-center gap-1.5 hover:bg-[#FAF7F0]"
                >
                  <Copy className="w-3.5 h-3.5" /> COPY JSON
                </button>
              </div>
            </div>

            <div className="mt-4 border border-[#E8E0D1] bg-[#FAF7F0] p-4 text-center">
              <div className="font-display text-[14px] tracking-wide">READY TO BOOK?</div>
              <p className="text-[13px] text-[#5C6B80] mt-1 leading-4">Raasta has planned your journey. Booking happens via the railway booking service.</p>
              <button
                onClick={() => {
                  setToast("Booking is mocked — no real IRCTC transaction.");
                  setTimeout(() => setToast(null), 3000);
                }}
                className="mt-3 border border-[#1B3A5C] bg-white px-5 py-2 font-mono text-[12px] tracking-wide inline-flex items-center gap-1.5 hover:bg-[#FAF7F0]"
              >
                CONTINUE TO BOOKING <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* JOURNEY MODE */}
        {view === "journey" && selected && (
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-8">
            <button onClick={() => setView("detail")} className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] hover:text-[#1B3A5C] mb-3">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> BACK TO DETAILS
            </button>

            <div className="bg-[#1B3A5C] text-[#FAF7F0] p-5 border-l-[6px] border-[#F2B705]">
              <div className="font-mono text-[11px] tracking-[0.16em] text-[#FAF7F0]/70">JOURNEY MODE</div>
              <h2 className="font-display text-[22px] leading-none mt-1">YOU&apos;RE ON YOUR WAY</h2>
              <p className="font-mono text-[12px] text-[#FAF7F0]/70 mt-1">We&apos;ll guide you step by step.</p>
            </div>

            <div className="mt-4 bg-white border border-[#E8E0D1] p-4">
              <div className="font-display text-[11px] tracking-[0.16em] text-[#5C6B80]">YOUR NEXT STEP</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="w-9 h-9 bg-[#FAF7F0] border border-[#E8E0D1] grid place-items-center shrink-0">
                  <TrainFront className="w-4 h-4 text-[#1B3A5C]" />
                </div>
                <div>
                  <div className="font-display text-[13px] tracking-wide">
                    TAKE {(selected.legs[0] as any).train.number} — {(selected.legs[0] as any).train.name.toUpperCase()}
                  </div>
                  <div className="font-mono text-[12px] text-[#5C6B80]">
                    {(selected.legs[0] as any).from.name.toUpperCase()} → {(selected.legs[0] as any).to.name.toUpperCase()} · DEP {(selected.legs[0] as any).departure}
                  </div>
                </div>
              </div>
              <div className="mt-3 border border-[#E8E0D1] bg-[#FAF7F0] p-3 font-mono text-[12px] leading-4">We&apos;ll tell you what to do when you arrive at {(selected.legs[0] as any).to.name.toUpperCase()}.</div>
            </div>

            <div className="mt-4 bg-white border border-[#E8E0D1] p-4">
              <div className="font-display text-[12px] tracking-wide">AFTER YOU ARRIVE — CHANGE TRAINS</div>
              <div className="font-mono text-[11px] text-[#5C6B80] mt-1">
                PLATFORM {(selected.legs[0] as any).train.stops.find((s: any) => s.stationId === (selected.legs[0] as any).to.id)?.platform ?? "4"} →{" "}
                {(selected.legs[2] as any)?.train?.stops.find((s: any) => s.stationId === (selected.legs[1] as any)?.transfer.toStationId)?.platform ?? "7"} · WALK ~
                {(selected.legs[1] as any).transfer.requiredWalkingMinutes} MIN
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-[12px]">CONNECTION:</span>
                <span className="font-mono text-[13px] font-semibold">{formatDuration((selected.legs[1] as any).transfer.durationMinutes).toUpperCase()}</span>
                <span
                  className="ml-auto font-mono text-[11px] tracking-wide text-white px-2 py-1 inline-flex items-center gap-1"
                  style={{ background: delay === 0 ? RISK_COLOR.low : delay < 40 ? RISK_COLOR.medium : RISK_COLOR.high }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> {delay === 0 ? "ON TRACK" : delay < 40 ? "MODERATE DELAY" : "AT RISK"}
                </span>
              </div>
              {delay > 0 && (
                <div className="mt-2 font-mono text-[12px]">
                  ORIGINAL {formatDuration((selected.legs[1] as any).transfer.durationMinutes).toUpperCase()} → NOW{" "}
                  <strong>{formatDuration(Math.max(0, (selected.legs[1] as any).transfer.durationMinutes - delay)).toUpperCase()}</strong> AFTER {delay}M DELAY
                </div>
              )}
            </div>

            <div className="mt-4 border-[1.5px] border-dashed border-[#1B3A5C]/30 bg-[#FAF7F0] p-4">
              <div className="font-display text-[11px] tracking-[0.16em] text-[#1B3A5C]">PROTOTYPE CONTROLS — DEMO ONLY</div>
              <p className="font-mono text-[11px] text-[#5C6B80] mt-1">Simulates a delay on your first train.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["Reset", 0],
                  ["35M delay", 35],
                  ["70M delay", 70],
                  ["110M delay", 110],
                ].map(([label, v]: any) => (
                  <button
                    key={label}
                    onClick={() => setDelay(v)}
                    className={`px-3 py-1.5 font-mono text-[11px] tracking-wide border ${delay === v ? "bg-[#1B3A5C] text-white border-[#1B3A5C]" : "bg-white border-[#E8E0D1] hover:border-[#1B3A5C] text-[#1B3A5C]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {delay >= 35 && (
                <div className="mt-4 bg-white border border-[#E8E0D1] p-4">
                  <div className="font-display text-[13px] tracking-wide flex gap-2 text-[#C62828]">
                    <OctagonAlert className="w-4 h-4 shrink-0" /> YOUR CONNECTION IS AT RISK
                  </div>
                  <p className="font-mono text-[12px] text-[#5C6B80] mt-1 leading-4">
                    Your first train is running approximately <strong className="text-[#1B3A5C]">{delay} minutes</strong> late.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="border border-[#E8E0D1] bg-[#FAF7F0] p-2 text-center">
                      <div className="font-mono text-[10px] tracking-[0.12em] text-[#5C6B80]">ORIGINAL</div>
                      <div className="font-mono text-[13px] font-semibold text-[#1B3A5C]">{formatDuration((selected.legs[1] as any).transfer.durationMinutes).toUpperCase()}</div>
                    </div>
                    <div className="border p-2 text-center text-white" style={{ background: delay < 40 ? RISK_COLOR.medium : RISK_COLOR.high }}>
                      <div className="font-mono text-[10px] tracking-[0.12em] opacity-80">NOW</div>
                      <div className="font-mono text-[13px] font-semibold">{formatDuration(Math.max(0, (selected.legs[1] as any).transfer.durationMinutes - delay)).toUpperCase()}</div>
                    </div>
                  </div>
                  <p className="font-mono text-[11px] text-[#5C6B80] mt-2 leading-4">Your original connection may still be possible, but we recommend a later train for recovery.</p>

                  {recovery.length > 0 ? (
                    <div className="mt-3">
                      <div className="font-display text-[12px] tracking-wide">WE FOUND A SAFER OPTION</div>
                      <div className="mt-2 space-y-2">
                        {recovery.map((r, idx) => (
                          <button
                            key={idx}
                            onClick={() => setRecoverSelected(r.journey.id)}
                            className={`w-full text-left border p-3 flex items-center justify-between ${recoverSelected === r.journey.id ? "border-[#1B3A5C] bg-[#FAF7F0]" : "border-[#E8E0D1] bg-white hover:bg-[#FAF7F0]"}`}
                          >
                            <div>
                              <div className="font-mono text-[12px] font-semibold text-[#1B3A5C]">{(r.journey.legs[2] as any).train.number} · {(r.journey.legs[2] as any).train.name.toUpperCase()}</div>
                              <div className="font-mono text-[11px] text-[#5C6B80]">DEP {(r.journey.legs[2] as any).departure} · {formatDuration(r.buffer).toUpperCase()} BUFFER</div>
                            </div>
                            <span className="font-mono text-[10px] tracking-wide bg-[#1B3A5C] text-white px-2 py-1">{idx === 0 ? "RECOMMENDED" : idx === 1 ? "Faster but risky" : "Wait longer"}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (recoverSelected) {
                              const rec = recovery.find((r) => r.journey.id === recoverSelected)?.journey;
                              if (rec) {
                                setSelected(rec);
                                setDelay(0);
                                setRecoverSelected(null);
                                setToast("Journey updated to recovery option");
                                setTimeout(() => setToast(null), 2500);
                              }
                            }
                          }}
                          className="bg-[#1B3A5C] text-white py-2.5 font-mono text-[11px] tracking-wide"
                        >
                          USE RECOVERY
                        </button>
                        <button onClick={() => setDelay(0)} className="border border-[#E8E0D1] bg-white py-2.5 font-mono text-[11px] tracking-wide">
                          KEEP PLAN
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-mono text-[12px] text-[#C62828] mt-3">No alternative same-day trains with safe buffer — consider next-day options.</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 bg-white border border-[#E8E0D1] p-4">
              <div className="font-display text-[12px] tracking-wide">YOU&apos;VE REACHED MADGAON.</div>
              <div className="font-display text-[14px] tracking-wide">CONTINUE YOUR JOURNEY</div>
              <p className="font-mono text-[11px] text-[#5C6B80]">FUTURE INTEGRATION CONCEPT — NOT LIVE APIS</p>
              <div className="mt-3 grid sm:grid-cols-3 gap-2">
                {[
                  [CarFront, "RIDE", "Mobility provider · 8–12 min to city"],
                  [Bus, "LOCAL", "Find nearby public transport"],
                  [Navigation, "NAVIGATE", "Continue to destination"],
                ].map(([Icon, label, desc]: any) => (
                  <div key={label} className="border border-[#E8E0D1] bg-[#FAF7F0] p-3">
                    <div className="font-display text-[11px] tracking-wide flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </div>
                    <div className="font-mono text-[11px] text-[#5C6B80] mt-1 leading-4">{desc}</div>
                    <button
                      onClick={() => {
                        setToast("Mock integration — concept only");
                        setTimeout(() => setToast(null), 2000);
                      }}
                      className="mt-2 font-mono text-[11px] tracking-wide underline decoration-[#F2B705] decoration-2 underline-offset-4"
                    >
                      Explore →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E8E0D1] font-mono text-[11px] tracking-wide">
                <Flag className="w-3 h-3" /> JOURNEY COMPLETE · {selected.legs.filter((l) => l.type === "train").length} TRAINS · {selected.interchangeCount} INTERCHANGE
              </div>
              <div className="mt-3 flex justify-center gap-2">
                <button onClick={() => saveJourney(selected)} className="border border-[#E8E0D1] bg-white px-5 py-2 font-mono text-[11px] tracking-wide">
                  SAVE JOURNEY
                </button>
                <button
                  onClick={() => {
                    setView("results");
                    setDelay(0);
                  }}
                  className="bg-[#1B3A5C] text-white px-5 py-2 font-mono text-[11px] tracking-wide"
                >
                  PLAN ANOTHER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved drawer */}
        {showSaved && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div onClick={() => setShowSaved(false)} className="flex-1 bg-[#1B3A5C]/40 backdrop-blur-[1px]" />
            <div className="w-full max-w-[400px] bg-[#FAF7F0] h-full overflow-auto border-l-[3px] border-[#1B3A5C]">
              <div className="sticky top-0 bg-[#1B3A5C] text-[#FAF7F0] p-4 flex items-center justify-between">
                <h3 className="font-display text-[13px] tracking-[0.12em]">SAVED JOURNEYS</h3>
                <button onClick={() => setShowSaved(false)} className="w-7 h-7 bg-[#FAF7F0] text-[#1B3A5C] grid place-items-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                {saved.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[#E8E0D1] bg-white p-6">
                    <Route className="w-6 h-6 mx-auto text-[#5C6B80]" />
                    <div className="font-display text-[13px] tracking-wide mt-2">NO SAVED JOURNEYS</div>
                    <p className="font-mono text-[12px] text-[#5C6B80] mt-1">Plan a journey and save it here.</p>
                    <button onClick={() => setShowSaved(false)} className="mt-4 bg-[#F2B705] text-[#1B3A5C] border border-[#1B3A5C] px-4 py-2 font-mono text-[11px] tracking-wide">
                      PLAN A JOURNEY
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {saved.map((j) => (
                      <div key={j.id} className="bg-white border border-[#E8E0D1] p-3">
                        <div className="font-display text-[12px] tracking-wide">
                          {j.origin.name.toUpperCase()} → {j.destination.city.toUpperCase()}
                        </div>
                        <div className="font-mono text-[11px] text-[#5C6B80] mt-1">
                          {formatDate(j.date).toUpperCase()} · {formatDuration(j.totalDurationMinutes).toUpperCase()} · ₹{j.totalCost.toLocaleString("en-IN")}
                        </div>
                        <div className="font-mono text-[11px] text-[#5C6B80]">{j.legs.filter((l) => l.type === "train").length} TRAINS · {j.interchangeCount} INTERCHANGE</div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => {
                              setSelected(j);
                              setView("detail");
                              setShowSaved(false);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="flex-1 bg-[#1B3A5C] text-white py-2 font-mono text-[11px] tracking-wide"
                          >
                            OPEN
                          </button>
                          <button onClick={() => setSaved((prev) => prev.filter((s) => s.id !== j.id))} className="px-3 border border-[#E8E0D1] bg-white font-mono text-[11px] tracking-wide">
                            REMOVE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Bot Demo Modal — interactive, never stuck */}
        {showWhatsAppDemo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowWhatsAppDemo(false)} className="absolute inset-0 bg-[#1B3A5C]/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-[420px] bg-[#E7FFDB] border-[2px] border-[#1B3A5C] shadow-[6px_6px_0_#1B3A5C] flex flex-col max-h-[85vh]">
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white grid place-items-center"><MessageCircle className="w-5 h-5 text-[#075E54] fill-current" /></div>
                  <div>
                    <div className="font-display text-[13px] tracking-wide">RAASTA WHATSAPP BOT</div>
                    <div className="font-mono text-[11px] opacity-80">+1 415 523 8886 · instant build</div>
                  </div>
                </div>
                <button onClick={() => setShowWhatsAppDemo(false)} className="w-7 h-7 bg-white text-[#075E54] grid place-items-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-auto p-3 space-y-2 bg-[#E7FFDB] min-h-[280px]">
                {waMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] px-3 py-2 font-mono text-[12px] leading-4 border ${m.role === "user" ? "bg-[#DCF8C6] border-[#075E54]/20 rounded-l-lg rounded-br-lg" : "bg-white border-[#E8E0D1] rounded-r-lg rounded-bl-lg shadow-sm"}`}>
                      <div>{m.text}</div>
                      {m.journey && (
                        <button
                          onClick={() => {
                            setSelected(m.journey!);
                            setView("detail");
                            setShowWhatsAppDemo(false);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="mt-2 w-full bg-[#1B3A5C] text-white py-1.5 font-mono text-[11px] tracking-wide"
                        >
                          VIEW JOURNEY →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white border-t border-[#E8E0D1] p-2 flex gap-2">
                <input
                  value={waInput}
                  onChange={(e) => setWaInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleWaSend(); }}
                  placeholder="Type: Delhi to Jaipur tomorrow"
                  className="flex-1 border border-[#E8E0D1] px-3 py-2 font-mono text-[13px] outline-none focus:border-[#25D366]"
                />
                <button onClick={handleWaSend} className="bg-[#25D366] text-white px-4 py-2 font-mono text-[12px] font-bold hover:bg-[#20bd5a]">SEND</button>
              </div>
              <div className="bg-[#1B3A5C] text-[#FAF7F0]/70 font-mono text-[10px] px-3 py-1.5 text-center">Built with timeout & retry — never stuck midway · Try Hinglish “Delhi se Goa kal fastest”</div>
            </div>
          </div>
        )}

        {/* Floating Real WhatsApp Action Pill */}
        <div className="fixed bottom-5 right-5 z-40">
          <a
            href="https://wa.me/14155238886?text=Delhi%20to%20Goa%20tomorrow"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#20bd5a] text-[#075E54] p-3 sm:px-4 sm:py-2.5 rounded-full shadow-[0_4px_14px_rgba(37,211,102,0.4)] flex items-center gap-2 border-2 border-white transition-all transform hover:scale-105 active:scale-95 font-bold"
            title="Chat or send voice note on WhatsApp (+1 415 523 8886)"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span className="hidden sm:inline font-mono text-xs tracking-wider">
              CHAT ON WHATSAPP
            </span>
            <span className="w-2 h-2 rounded-full bg-[#075E54] animate-ping" />
          </a>
        </div>

        {toast && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1B3A5C] text-white font-mono text-[12px] tracking-wide px-4 py-2 border border-[#F2B705] z-50">{toast}</div>}
      </main>

      <footer className="border-t-[3px] border-[#1B3A5C] bg-white mt-auto py-5">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px] text-[#5C6B80]">
          <div className="font-display text-[13px] tracking-wide text-[#1B3A5C]">RAASTA · JOURNEY PLANNER</div>
          <div>Synthetic demonstration data for Indian Railways</div>
        </div>
      </footer>
    </div>
  );
}
