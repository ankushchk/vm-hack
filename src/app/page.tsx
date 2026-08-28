"use client";
import { useState, useEffect, useMemo } from "react";
import { stations } from "@/data/stations";
import { Journey, Preference } from "@/lib/types";
import { findJourneys, formatDuration, getRecoveryOptions } from "@/lib/engine";
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
  X,
} from "lucide-react";

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
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

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
    setView("prefs");
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
            className="flex items-center gap-3"
          >
            <div className="h-[28px] px-2 bg-[#F2B705] border border-[#0F2340] grid place-items-center font-display text-[15px] tracking-[0.04em] text-[#1B3A5C] leading-none">
              RAASTA
            </div>
            <span className="hidden sm:inline font-display text-[16px] tracking-[0.08em] text-[#FAF7F0]">RAASTA</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.12em] font-mono px-2 py-1 bg-[#FAF7F0] text-[#1B3A5C] border border-[#0F2340]">PROTOTYPE — SYNTHETIC DATA</span>
          </button>
          <nav className="flex items-center gap-2 sm:gap-3 text-sm">
            <button
              onClick={() => {
                setView("landing");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hidden sm:inline-flex items-center gap-1.5 text-[#FAF7F0]/80 hover:text-white font-medium text-[13px] px-2 py-1"
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

      {/* disclosure - ticket strip */}
      <div className="bg-[#FAF7F0] border-b border-[#E8E0D1] text-[11px] font-mono tracking-wide text-[#5C6B80] text-center py-2 px-3 flex items-center justify-center gap-2">
        <Info className="w-3.5 h-3.5 shrink-0" />
        INDEPENDENT PROTOTYPE · SYNTHETIC RAILWAY DATA — NOT LIVE IRCTC · NOT AN OFFICIAL GOVERNMENT PRODUCT
      </div>

      <main className="flex-1">
        {/* LANDING */}
        {view === "landing" && (
          <div className="max-w-[1120px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-8">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-8 items-start">
              <div>
                <div className="inline-flex items-center gap-2 bg-white border border-[#E8E0D1] px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0E9F4B] animate-pulse" />
                  <span className="text-[11px] font-mono tracking-[0.12em] text-[#1B3A5C]">PUBLIC JOURNEY LAYER · INDIAN RAILWAYS</span>
                </div>
                <h1 className="font-display text-[40px] sm:text-[54px] leading-[0.9] mt-4">
                  WHERE ARE
                  <br />
                  <span className="text-[#1B3A5C] bg-[#F2B705] px-1">YOU GOING?</span>
                </h1>
                <p className="mt-4 text-[14px] leading-6 text-[#1B3A5C]/80 max-w-[520px] border-l-[3px] border-[#F2B705] pl-4">
                  Don&apos;t search for trains. <span className="font-semibold text-[#1B3A5C]">Plan your journey.</span> Tell us your destination and we&apos;ll build the simplest practical railway journey — including connections, transfer time and what to do if something changes.
                </p>

                {/* Search Card - ticket form */}
                <div className="mt-6 bg-white border border-[#E8E0D1] p-4 sm:p-4">
                  <div className="flex items-center justify-between border-b border-[#E8E0D1] pb-3 mb-4">
                    <span className="font-display text-[12px] tracking-[0.16em] text-[#1B3A5C]">JOURNEY ENQUIRY</span>
                    <span className="font-mono text-[11px] tracking-wide text-[#5C6B80]">NO LOGIN REQUIRED</span>
                  </div>
                  <div className="grid gap-3">
                    {/* From */}
                    <div className="relative">
                      <label className="font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> FROM
                      </label>
                      <button
                        onClick={() => setFromOpen((v) => !v)}
                        className="mt-1 w-full flex items-center justify-between bg-[#FAF7F0] border border-[#E8E0D1] px-3 py-3 text-left hover:bg-white transition group"
                      >
                        <div>
                          <div className="font-display text-[18px] tracking-wide leading-none">{from.toUpperCase()}</div>
                          <div className="font-mono text-[11px] text-[#5C6B80] mt-0.5">
                            {stations.find((s) => s.name === from)?.code ?? "NDLS"} · {stations.find((s) => s.name === from)?.state ?? ""}
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-[#5C6B80] group-hover:text-[#1B3A5C]" />
                      </button>
                      {fromOpen && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-[#E8E0D1] max-h-64 overflow-auto shadow-[4px_4px_0_#1B3A5C]">
                          {stations.slice(0, 30).map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setFrom(s.name);
                                setFromOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 flex justify-between items-center border-b border-[#FAF7F0] last:border-0 hover:bg-[#FAF7F0] ${from === s.name ? "bg-[#1B3A5C] text-white hover:bg-[#1B3A5C]" : "text-[#1B3A5C]"}`}
                            >
                              <span className="font-medium text-sm">{s.name}</span>
                              <span className="font-mono text-xs opacity-70">{s.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center -my-1">
                      <div className="w-7 h-7 bg-[#1B3A5C] text-[#F2B705] grid place-items-center border border-[#0F2340]">
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    {/* To */}
                    <div className="relative">
                      <label className="font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5" /> TO
                      </label>
                      <button
                        onClick={() => setToOpen((v) => !v)}
                        className="mt-1 w-full flex items-center justify-between bg-white border border-[#1B3A5C] px-3 py-3 text-left hover:bg-[#FAF7F0] transition group"
                      >
                        <div>
                          <div className="font-display text-[18px] tracking-wide leading-none">{to.toUpperCase()}</div>
                          <div className="font-mono text-[11px] text-[#5C6B80] mt-0.5">
                            {stations.find((s) => s.name === to)?.code ?? "MAO"} · {stations.find((s) => s.name === to)?.state ?? "Goa"}
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-[#5C6B80]" />
                      </button>
                      {toOpen && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-[#E8E0D1] max-h-64 overflow-auto shadow-[4px_4px_0_#1B3A5C]">
                          {stations.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setTo(s.name);
                                setToOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 flex justify-between items-center border-b border-[#FAF7F0] hover:bg-[#FAF7F0] ${to === s.name ? "bg-[#1B3A5C] text-white" : "text-[#1B3A5C]"}`}
                            >
                              <span className="font-medium text-sm">{s.name}</span>
                              <span className="font-mono text-xs opacity-70">{s.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Date */}
                    <div>
                      <label className="font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] flex items-center gap-1.5">
                        <Clock3 className="w-3.5 h-3.5" /> DATE
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 w-full bg-white border border-[#E8E0D1] px-3 py-3 font-mono text-sm outline-none focus:border-[#1B3A5C] focus:ring-1 focus:ring-[#1B3A5C]"
                      />
                      <div className="font-mono text-[11px] text-[#5C6B80] mt-1.5 flex items-center gap-1">
                        <Timer className="w-3 h-3" /> {formatDateShort(date).toUpperCase()} · {formatDate(date)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={doSearch}
                    className="mt-4 w-full bg-[#F2B705] text-[#1B3A5C] border-[2px] border-[#1B3A5C] font-display text-[15px] tracking-[0.08em] py-3 flex items-center justify-center gap-2 hover:brightness-105 transition shadow-[3px_3px_0_#1B3A5C] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    FIND MY JOURNEY <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setFrom("New Delhi");
                      setTo("Goa");
                      setDate(todayISO());
                      setPref("easy");
                      doSearch();
                    }}
                    className="mt-3 w-full text-[13px] text-[#1B3A5C] underline decoration-[#F2B705] decoration-2 underline-offset-4 hover:text-[#0F2340] py-1 flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" /> Try sample: New Delhi → Goa
                  </button>
                  <p className="font-mono text-[10px] tracking-wide text-[#5C6B80] text-center mt-2">SYNTHETIC DATA · NO PAYMENT · NO OTP</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    ["Checks interchange time", ShieldCheck],
                    ["Same-station awareness", MapPin],
                    ["Delay risk explained", Clock3],
                    ["Recovery options", Route],
                  ].map(([label, Icon]: any) => (
                    <span key={label} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E8E0D1] font-mono text-[11px] tracking-wide">
                      <Icon className="w-3 h-3" /> {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visual Journey Preview - station board */}
              <div className="lg:sticky lg:top-[68px]">
                <div className="bg-white border border-[#E8E0D1] overflow-hidden">
                  <div className="bg-[#1B3A5C] text-[#FAF7F0] px-4 py-2.5 flex items-center justify-between">
                    <span className="font-display text-[11px] tracking-[0.16em]">PREVIEW — TIMETABLE</span>
                    <span className="font-mono text-[10px] tracking-[0.12em] bg-[#F2B705] text-[#1B3A5C] px-2 py-1">LIVE PROTOTYPE</span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-baseline justify-between">
                      <div className="font-display text-[14px] tracking-wide">NEW DELHI → GOA</div>
                      <span className="font-mono text-[11px] text-[#5C6B80]">VIA MUMBAI · SYNTHETIC</span>
                    </div>

                    {/* rail timeline mini */}
                    <div className="mt-4 relative">
                      {/* vertical rail */}
                      <div className="absolute left-[16px] top-[8px] bottom-[8px] w-[3px] bg-[#1B3A5C]" />
                      {/* sleepers */}
                      <div className="absolute left-[8px] top-[8px] bottom-[8px] w-[19px] flex flex-col justify-between py-2 pointer-events-none">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="h-[2px] bg-[#1B3A5C] w-full opacity-40" />
                        ))}
                      </div>
                      <div className="space-y-4 pl-8">
                        <div className="relative flex gap-3">
                          <span className="absolute -left-[24px] top-1 w-[14px] h-[14px] rounded-full bg-[#1B3A5C] border-[3px] border-[#FAF7F0] shadow-[0_0_0_1px_#1B3A5C]" />
                          <div className="flex-1">
                            <div className="font-mono text-[11px] font-semibold text-[#1B3A5C]">10:55</div>
                            <div className="inline-block bg-[#1B3A5C] text-[#FAF7F0] font-display text-[12px] tracking-wide px-2 py-1 leading-none mt-1">NEW DELHI</div>
                            <div className="font-mono text-[11px] text-[#5C6B80] mt-1 flex items-center gap-1">
                              <TrainFront className="w-3 h-3" /> 12952 RAJDHANI · 3A
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[24px] top-1 w-[14px] h-[14px] rounded-full bg-white border-[3px] border-[#1B3A5C]" />
                          <div className="font-mono text-[11px] font-semibold text-[#1B3A5C]">06:55</div>
                          <div className="inline-block bg-white border border-[#1B3A5C] text-[#1B3A5C] font-display text-[12px] tracking-wide px-2 py-1 leading-none mt-1">
                            MUMBAI CENTRAL
                          </div>
                          <div className="mt-2 border border-[#E8E0D1] bg-[#FAF7F0] p-2.5 flex items-start gap-2">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-[#1B3A5C] mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="font-mono text-[11px] font-semibold flex items-center gap-2">
                                CHANGE · <span className="bg-[#1B3A5C] text-white px-1">2H 35M</span>
                                <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] tracking-wide text-white px-1.5 py-0.5" style={{ background: RISK_COLOR.low }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  LOW
                                </span>
                              </div>
                              <div className="font-mono text-[11px] text-[#5C6B80] mt-1">SAME STATION · 12 MIN WALK · BUFFER FOR DELAY</div>
                            </div>
                          </div>
                        </div>
                        <div className="relative flex gap-3">
                          <span className="absolute -left-[24px] top-1 w-[14px] h-[14px] rounded-full bg-[#1B3A5C] border-[3px] border-[#FAF7F0] shadow-[0_0_0_1px_#1B3A5C]" />
                          <div className="flex-1">
                            <div className="font-mono text-[11px] font-semibold text-[#1B3A5C]">09:30</div>
                            <div className="inline-block bg-[#1B3A5C] text-[#FAF7F0] font-display text-[12px] tracking-wide px-2 py-1 leading-none mt-1">MUMBAI CENTRAL</div>
                            <div className="font-mono text-[11px] text-[#5C6B80] mt-1 flex items-center gap-1">
                              <TrainFront className="w-3 h-3" /> 10104 MANDOVI · SL
                            </div>
                          </div>
                        </div>
                        <div className="relative flex gap-3">
                          <span className="absolute -left-[24px] top-1 w-[14px] h-[14px] bg-[#F2B705] border-[2px] border-[#1B3A5C] grid place-items-center">
                            <Flag className="w-2.5 h-2.5 text-[#1B3A5C]" />
                          </span>
                          <div>
                            <div className="font-mono text-[11px] font-semibold text-[#1B3A5C]">17:20</div>
                            <div className="inline-block bg-[#F2B705] border border-[#1B3A5C] text-[#1B3A5C] font-display text-[12px] tracking-wide px-2 py-1 leading-none mt-1">MADGAON · GOA</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        ["DURATION", "31H 25M"],
                        ["CHANGES", "1"],
                        ["FARE", "₹2,845"],
                      ].map(([k, v]) => (
                        <div key={k} className="border border-[#E8E0D1] bg-[#FAF7F0] p-2 text-center">
                          <div className="font-mono text-[10px] tracking-[0.12em] text-[#5C6B80]">{k}</div>
                          <div className="font-mono text-[13px] font-semibold text-[#1B3A5C] mt-0.5">{v}</div>
                        </div>
                      ))}
                    </div>
                    <p className="font-mono text-[10px] tracking-wide text-[#5C6B80] mt-3 text-center">TIMELINE IS THE VISUAL IDENTITY — PROGRESSIVE DISCLOSURE</p>
                  </div>
                </div>
                <div className="mt-2 text-center font-mono text-[11px] tracking-wide text-[#5C6B80]">BUILT WITH OPENAI AS EXPLANATION LAYER — NOT A RAILWAY DATABASE</div>
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
            <button onClick={() => setView("prefs")} className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-[#5C6B80] hover:text-[#1B3A5C] mb-3">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> PREFERENCES
            </button>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-[24px] sm:text-[28px] leading-none">WE FOUND {journeys.length} WAYS</h2>
              <span className="font-mono text-[11px] tracking-wide bg-white border border-[#E8E0D1] px-2 py-1 shrink-0">{formatDateShort(date).toUpperCase()}</span>
            </div>
            <p className="text-[13px] text-[#5C6B80] mt-1">Tap a card to see the full rail timeline and interchange details.</p>

            <div className="grid gap-4 mt-6">
              {journeys.map((j, idx) => {
                const isRecommended = idx === 0;
                const label = isRecommended ? "BEST FOR YOU" : idx === 1 ? "FASTEST" : "CHEAPEST";
                const transfer = (j.legs.find((l) => l.type === "transfer") as any)?.transfer;
                const legs = j.legs.filter((l) => l.type === "train") as any[];
                const risk = j.riskLevel;
                return (
                  <div
                    key={j.id}
                    className={`bg-white border overflow-hidden flex ${isRecommended ? "border-[#1B3A5C] shadow-[4px_4px_0_#1B3A5C]" : "border-[#E8E0D1]"} ${isRecommended ? "scale-[1.01]" : ""}`}
                  >
                    {/* left edge strip */}
                    <div className="w-[6px] shrink-0" style={{ background: RISK_COLOR[risk] ?? "#1B3A5C" }} />
                    <div className={`flex-1 ${isRecommended ? "p-5 sm:p-6" : "p-4"}`}>
                      {isRecommended && (
                        <div className="font-display text-[11px] tracking-[0.16em] bg-[#F2B705] text-[#1B3A5C] border border-[#1B3A5C] inline-block px-2 py-1 mb-3">RECOMMENDED</div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-display text-[11px] tracking-[0.14em] text-[#5C6B80]">{label}</span>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-white px-2 py-1" style={{ background: RISK_COLOR[risk] }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white" /> {RISK_LABEL[risk].toUpperCase()}
                        </span>
                      </div>
                      <div className={`font-display tracking-wide mt-2 ${isRecommended ? "text-[16px]" : "text-[14px]"}`}>
                        {j.origin.name.toUpperCase()} → {j.destination.city.toUpperCase()} <span className="font-mono font-normal text-[11px] text-[#5C6B80]">· {formatDateShort(date).toUpperCase()}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="border border-[#E8E0D1] bg-[#FAF7F0] p-2.5">
                          <div className="font-mono text-[10px] tracking-[0.12em] text-[#5C6B80] flex items-center justify-center gap-1">
                            <TrainFront className="w-3 h-3" /> TRAINS
                          </div>
                          <div className="font-mono text-[13px] font-semibold text-[#1B3A5C] mt-1">
                            {legs.length} · {j.interchangeCount} CHANGE
                          </div>
                        </div>
                        <div className="border border-[#E8E0D1] bg-[#FAF7F0] p-2.5">
                          <div className="font-mono text-[10px] tracking-[0.12em] text-[#5C6B80] flex items-center justify-center gap-1">
                            <Clock3 className="w-3 h-3" /> DURATION
                          </div>
                          <div className="font-mono text-[13px] font-semibold text-[#1B3A5C] mt-1">{formatDuration(j.totalDurationMinutes).toUpperCase()}</div>
                          <div className="font-mono text-[11px] text-[#5C6B80]">{transfer ? formatDuration(transfer.durationMinutes).toUpperCase() + " CHANGE" : "DIRECT"}</div>
                        </div>
                        <div className="border border-[#E8E0D1] bg-[#FAF7F0] p-2.5">
                          <div className="font-mono text-[10px] tracking-[0.12em] text-[#5C6B80] flex items-center justify-center gap-1">
                            <IndianRupee className="w-3 h-3" /> FARE
                          </div>
                          <div className="font-mono text-[13px] font-semibold text-[#1B3A5C] mt-1">₹{j.totalCost.toLocaleString("en-IN")}</div>
                          <div className="font-mono text-[11px] text-[#5C6B80]">AC 3-TIER</div>
                        </div>
                      </div>
                      {transfer && (
                        <div className="mt-3 border border-[#E8E0D1] bg-[#FAF7F0] p-3 flex items-start gap-2">
                          {risk === "low" ? (
                            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: RISK_COLOR.low }} />
                          ) : risk === "medium" ? (
                            <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: RISK_COLOR.medium }} />
                          ) : (
                            <OctagonAlert className="w-4 h-4 shrink-0" style={{ color: RISK_COLOR.high }} />
                          )}
                          <div className="font-mono text-[12px] leading-4">
                            <span className="font-semibold text-[#1B3A5C]">{formatDuration(transfer.durationMinutes).toUpperCase()} CONNECTION</span>
                            <span className="text-[#5C6B80]"> — {transfer.reason}</span>
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
                          VIEW JOURNEY <ChevronRight className="w-3.5 h-3.5" />
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
            <div className="mt-4 border border-[#E8E0D1] bg-white p-3 flex gap-2 font-mono text-[11px] leading-4 text-[#5C6B80]">
              <Info className="w-4 h-4 shrink-0 text-[#1B3A5C]" />
              Prototype uses synthetic train & delay data — not live availability. Fares are estimates for AC 3-tier on selected date.
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

            <div className="mt-4 bg-white border border-[#E8E0D1] p-4">
              <div className="font-display text-[11px] tracking-[0.16em] text-[#5C6B80]">JOURNEY OBJECT — PLATFORM-READY</div>
              <pre className="mt-2 font-mono text-[11px] bg-[#FAF7F0] border border-[#E8E0D1] p-3 overflow-auto leading-4">
                {JSON.stringify(
                  {
                    origin: selected.origin.name,
                    destination: selected.destination.name,
                    date: selected.date,
                    legs: selected.legs.map((l) =>
                      l.type === "train"
                        ? { mode: "rail", from: (l as any).from.name, to: (l as any).to.name, departure: (l as any).departure, arrival: (l as any).arrival }
                        : { mode: "transfer", station: getStationName((l as any).transfer.fromStationId), duration_minutes: (l as any).transfer.durationMinutes, risk: (l as any).transfer.risk }
                    ),
                  },
                  null,
                  2
                )}
              </pre>
              <p className="font-mono text-[11px] text-[#5C6B80] mt-2">FUTURE: RAIL → METRO → BUS → LAST-MILE FROM ONE OBJECT.</p>
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
              <p className="font-mono text-[10px] tracking-wide text-[#5C6B80] mt-2">MOCKED — NO REAL PAYMENT OR TRANSACTION.</p>
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

        {toast && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1B3A5C] text-white font-mono text-[12px] tracking-wide px-4 py-2 border border-[#F2B705] z-50">{toast}</div>}
      </main>

      <footer className="border-t-[3px] border-[#1B3A5C] bg-white mt-auto">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="max-w-[600px]">
              <div className="font-display text-[12px] tracking-[0.12em] text-[#1B3A5C]">PROTOTYPE INFORMATION</div>
              <p className="font-mono text-[11px] leading-4 text-[#5C6B80] mt-2">
                Raasta is an independent prototype and is not an official Indian Railways or government product. Train schedules, fares, delay information and availability shown are synthetic and used only for demonstration. No real passenger information, payment details, OTPs or government systems are used.
              </p>
              <p className="font-mono text-[11px] leading-4 text-[#5C6B80] mt-2">
                OpenAI is used as an explanation layer to convert structured journey data into simple language. The model does not invent train information. Fallback explanations are deterministic.
              </p>
            </div>
            <div className="sm:text-right font-mono text-[11px] leading-4 text-[#5C6B80]">
              <div className="font-display text-[11px] tracking-[0.12em] text-[#1B3A5C]">BUILT FOR HACKATHON</div>
              <div className="mt-1">PLAN THE JOURNEY, NOT THE TRAIN.</div>
              <div className="mt-1">SYNTHETIC DATA · MOCK BOOKING · FUTURE MOBILITY CONCEPTS</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getStationName(id: string) {
  return stations.find((s) => s.id === id)?.name ?? id;
}
