"use client";
import { useState, useEffect, useMemo } from "react";
import { stations } from "@/data/stations";
import { Journey, Preference } from "@/lib/types";
import { findJourneys, formatDuration, getRecoveryOptions } from "@/lib/engine";

// --- helpers ---
function todayISO() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}
function formatDate(d: string) {
  try {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
  } catch {
    return d;
  }
}

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

  // load saved
  useEffect(() => {
    try {
      const raw = localStorage.getItem("raasta_saved");
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("raasta_saved", JSON.stringify(saved));
  }, [saved]);

  const fromStations = useMemo(() => stations.filter(s => s.city !== "Goa"), []);
  const toStations = useMemo(() => stations.filter(s => s.city === "Goa" || ["MAO","VSG","PUNE","MMCT","ERS","SBC","MAS","HYB"].includes(s.id)), []);

  // search action
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
    // reorder for display: keep 3, but label correctly
    // Our engine already sorts by pref, but for UI we show Recommended = easy best, Fastest = quickest, Cheapest = cheapest
    // So generate all three variants and pick
    const easy = findJourneys(from, to, date, "easy")[0];
    const fast = findJourneys(from, to, date, "fastest")[0];
    const cheap = findJourneys(from, to, date, "cheapest")[0];
    // de-dupe by id
    const map = new Map<string, Journey>();
    [easy, fast, cheap].forEach(j => { if (j) map.set(j.id, j); });
    let list = Array.from(map.values());
    // if same journey appears multiple times, expand with generic fallback (use same but tweak)
    if (list.length < 3) {
      const fallback = findJourneys(from, to, date, "easy");
      fallback.forEach(j => { if (!map.has(j.id)) map.set(j.id, j); });
      list = Array.from(map.values());
    }
    // Ensure order: recommended first (easy), fastest second, cheapest third
    const ordered: Journey[] = [];
    if (easy) ordered.push(easy);
    if (fast && fast.id !== easy?.id) ordered.push(fast);
    if (cheap && cheap.id !== easy?.id && cheap.id !== fast?.id) ordered.push(cheap);
    // if still <3, pad with remaining
    list.forEach(j => { if (!ordered.find(o=>o.id===j.id)) ordered.push(j); });
    setJourneys(ordered.slice(0,3));
    setView("results");
    setDelay(0);
    setRecoverSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExplain = async (j: Journey) => {
    setExplainLoading(true);
    setExplain(null);
    // Try API if available, else deterministic fallback
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
    // Fallback deterministic
    await new Promise(r => setTimeout(r, 600));
    const legs = j.legs.filter(l => l.type === "train") as any[];
    const transfer = (j.legs.find(l => l.type==="transfer") as any)?.transfer;
    const txt = `You'll take ${legs.length} train${legs.length>1?'s':''} and change ${j.interchangeCount===0?'nowhere':'once at '+transfer?.fromStationId }.\n\nYour first train (${legs[0]?.train.name} ${legs[0]?.train.number}) leaves ${legs[0]?.from.name} at ${legs[0]?.departure} and arrives at ${transfer ? getStationName(transfer.fromStationId) : legs[0]?.to.name} at ${legs[0]?.arrival}.\n\n${transfer ? `You have ${formatDuration(transfer.durationMinutes)} to change trains${transfer.requiresStationChange ? ' — you\'ll need to travel to another station' : " — both trains use the same station, so you won't need to leave the station"}.\n\nWe consider this a ${transfer.risk}-risk connection: ${transfer.reason}\n\n` : ""}Your final train arrives in ${j.destination.city} at approximately ${legs[legs.length-1]?.arrival}.\nTotal journey time is about ${formatDuration(j.totalDurationMinutes)}. Estimated cost ₹${j.totalCost.toLocaleString("en-IN")} (AC 3-tier).`;
    setExplain(txt);
    setExplainLoading(false);
  };

  const saveJourney = (j: Journey) => {
    if (saved.find(s => s.id === j.id)) {
      setToast("Already saved");
    } else {
      setSaved(prev => [...prev, j]);
      setToast("Journey saved");
    }
    setTimeout(()=>setToast(null),2000);
  };

  const recovery = selected ? getRecoveryOptions(selected, delay) : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FFFBF5]/90 backdrop-blur border-b border-[#F0E6D8]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between">
          <button onClick={() => { setView("landing"); setSelected(null); setShowHow(false); }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white grid place-items-center font-bold text-sm">R</div>
            <span className="font-semibold tracking-tight text-[17px]">Raasta</span>
            <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-[#FFF4E6] border border-[#F0E6D8] text-[#8A5A1A] ml-1">Prototype</span>
          </button>
          <nav className="flex items-center gap-1 sm:gap-5 text-sm">
            <button onClick={() => { setView("landing"); window.scrollTo({top:0, behavior:"smooth"})}} className="hidden sm:inline hover:underline underline-offset-4">Plan journey</button>
            <button onClick={()=>setShowSaved(true)} className="relative px-3 py-1.5 rounded-full border border-[#E5DDD3] bg-white hover:bg-[#FFF4E6] transition text-sm font-medium">
              Saved journeys {saved.length>0 && <span className="ml-1 bg-[#1A1A1A] text-white text-[11px] px-1.5 py-0.5 rounded-full">{saved.length}</span>}
            </button>
            <button onClick={()=>setShowHow(v=>!v)} className="hidden sm:inline text-sm text-[#6B7280] hover:text-black">How it works</button>
          </nav>
        </div>
        {showHow && (
          <div className="border-t border-[#F0E6D8] bg-white">
            <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-5 grid sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-[#FFFBF5] rounded-xl p-4 border border-[#F0E6D8]">
                <div className="font-semibold mb-1">1. Tell us where you're going</div>
                <p className="text-[#6B7280]">We build complete journeys, not just trains.</p>
              </div>
              <div className="bg-[#FFFBF5] rounded-xl p-4 border border-[#F0E6D8]">
                <div className="font-semibold mb-1">2. We validate connections</div>
                <p className="text-[#6B7280]">We check transfer time, station changes and delay risk.</p>
              </div>
              <div className="bg-[#FFFBF5] rounded-xl p-4 border border-[#F0E6D8]">
                <div className="font-semibold mb-1">3. We guide you through</div>
                <p className="text-[#6B7280]">Next steps, interchange instructions and recovery if delayed.</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* disclosure bar */}
      <div className="bg-[#1A1A1A] text-[#FFEEC7] text-[12px] text-center py-1.5 px-3">
        Independent prototype · Uses synthetic railway data — not live IRCTC availability · Not an official government product
      </div>

      <main className="flex-1">
        {/* LANDING */}
        {view==="landing" && (
          <div className="max-w-[1120px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-10">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-[#F0E6D8] text-[#6B7280] mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Public journey layer for Indian Railways
                </div>
                <h1 className="text-[32px] sm:text-[42px] font-bold tracking-tight leading-[1.05]">
                  Where are <span className="text-[#E85D04]">you going?</span>
                </h1>
                <p className="mt-3 text-[15px] sm:text-[16px] leading-6 text-[#4B5563] max-w-[560px]">
                  Don&apos;t search for trains. <span className="font-medium text-black">Plan your journey.</span> Tell us your destination and we&apos;ll build the simplest practical railway journey for you — including connections, transfer time and what to do if something changes.
                </p>

                {/* Search Card */}
                <div className="mt-6 bg-white rounded-[20px] border border-[#F0E6D8] shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4 sm:p-5">
                  <div className="grid gap-3">
                    {/* From */}
                    <div className="relative">
                      <label className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">From</label>
                      <button onClick={()=>setFromOpen(v=>!v)} className="mt-1 w-full flex items-center justify-between rounded-xl border border-[#E5DDD3] bg-[#FFFBF5] px-4 py-3 text-left hover:bg-white transition">
                        <div>
                          <div className="font-semibold">{from}</div>
                          <div className="text-xs text-[#6B7280]">{stations.find(s=>s.name===from)?.code ?? "NDLS"} · {stations.find(s=>s.name===from)?.state ?? ""}</div>
                        </div>
                        <span className="text-[#9CA3AF]">▾</span>
                      </button>
                      {fromOpen && (
                        <div className="absolute z-20 mt-2 w-full bg-white border border-[#E5DDD3] rounded-xl shadow-xl max-h-64 overflow-auto">
                          {stations.slice(0,30).map(s=>(
                            <button key={s.id} onClick={()=>{setFrom(s.name); setFromOpen(false)}} className={`w-full text-left px-4 py-2.5 hover:bg-[#FFF4E6] flex justify-between items-center ${from===s.name?'bg-[#FFF4E6] font-semibold':''}`}>
                              <span>{s.name}</span><span className="text-xs text-[#9CA3AF]">{s.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center -my-1">
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white grid place-items-center text-sm">⇅</div>
                    </div>
                    {/* To */}
                    <div className="relative">
                      <label className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">To</label>
                      <button onClick={()=>setToOpen(v=>!v)} className="mt-1 w-full flex items-center justify-between rounded-xl border border-[#E5DDD3] bg-white px-4 py-3 text-left hover:bg-[#FFFBF5] transition">
                        <div>
                          <div className="font-semibold">{to}</div>
                          <div className="text-xs text-[#6B7280]">{stations.find(s=>s.name===to)?.code ?? "MAO"} · {stations.find(s=>s.name===to)?.state ?? "Goa"}</div>
                        </div>
                        <span className="text-[#9CA3AF]">▾</span>
                      </button>
                      {toOpen && (
                        <div className="absolute z-20 mt-2 w-full bg-white border border-[#E5DDD3] rounded-xl shadow-xl max-h-64 overflow-auto">
                          {stations.map(s=>(
                            <button key={s.id} onClick={()=>{setTo(s.name); setToOpen(false)}} className={`w-full text-left px-4 py-2.5 hover:bg-[#FFF4E6] flex justify-between items-center ${to===s.name?'bg-[#FFF4E6] font-semibold':''}`}>
                              <span>{s.name}</span><span className="text-xs text-[#9CA3AF]">{s.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Date */}
                    <div>
                      <label className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">Date</label>
                      <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-[#E5DDD3] bg-white px-4 py-3 outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/20" />
                      <div className="text-xs text-[#6B7280] mt-1">Showing date: <span className="font-medium text-black">{formatDate(date)}</span></div>
                    </div>
                  </div>
                  <button onClick={doSearch} className="mt-4 w-full rounded-full bg-[#E85D04] hover:bg-[#D45300] text-white font-semibold py-3.5 transition shadow-[0_6px_20px_rgba(232,93,4,0.35)]">
                    Find my journey →
                  </button>
                  <button onClick={()=>{setFrom("New Delhi"); setTo("Goa"); setDate(todayISO()); setPref("easy"); doSearch()}} className="mt-2 w-full text-sm text-[#6B7280] hover:text-black py-2">
                    Try a sample journey — New Delhi → Goa
                  </button>
                  <p className="text-[11px] text-[#9CA3AF] text-center mt-2">No login required · Synthetic data · No payment</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#F0E6D8]">✓ Checks interchange time</span>
                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#F0E6D8]">✓ Same-station awareness</span>
                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#F0E6D8]">✓ Delay risk explained</span>
                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#F0E6D8]">✓ Recovery options</span>
                </div>
              </div>

              {/* Visual Journey Preview */}
              <div className="lg:sticky lg:top-[80px]">
                <div className="bg-white rounded-[20px] border border-[#F0E6D8] overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-[#F0E6D8] flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-widest text-[#9CA3AF] uppercase">Preview</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">● Live prototype</span>
                  </div>
                  <div className="p-5">
                    <div className="text-sm font-semibold">New Delhi → Goa</div>
                    <div className="text-xs text-[#6B7280] mb-4">Via Mumbai · Example synthetic journey</div>
                    {/* mini timeline */}
                    <div className="relative pl-6 border-l-2 border-dashed border-[#F0E6D8] space-y-5">
                      <div className="relative">
                        <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-[#1A1A1A] border-2 border-white shadow" />
                        <div className="text-xs text-[#9CA3AF]">10:55 AM</div>
                        <div className="font-semibold text-sm">New Delhi</div>
                        <div className="text-xs inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full bg-[#FFF4E6] border border-[#F0E6D8]">🚆 12952 Rajdhani · 3A</div>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-white border-2 border-[#1A1A1A]" />
                        <div className="text-xs text-[#9CA3AF]">06:55 AM</div>
                        <div className="font-semibold text-sm">Mumbai Central</div>
                        <div className="mt-2 rounded-xl bg-[#F8FAF8] border border-[#E5EEE5] p-3">
                          <div className="text-xs font-semibold flex items-center gap-1.5">🔄 Change trains · <span className="text-emerald-700">2h 35m</span> <span className="ml-auto px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px]">● Low risk</span></div>
                          <div className="text-xs text-[#6B7280] mt-1">Same station · 12 min walk · Enough buffer for delay</div>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-[#1A1A1A] border-2 border-white shadow" />
                        <div className="text-xs text-[#9CA3AF]">09:30 AM</div>
                        <div className="font-semibold text-sm">Mumbai Central</div>
                        <div className="text-xs inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full bg-[#FFF4E6] border border-[#F0E6D8]">🚆 10104 Mandovi · SL</div>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-[#E85D04] grid place-items-center text-white text-[10px]">🏁</span>
                        <div className="text-xs text-[#9CA3AF]">05:20 PM</div>
                        <div className="font-semibold text-sm">Madgaon, Goa</div>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-[#FFFBF5] border border-[#F0E6D8] p-2.5">
                        <div className="text-xs text-[#9CA3AF]">Duration</div><div className="font-semibold text-sm">31h 25m</div>
                      </div>
                      <div className="rounded-xl bg-[#FFFBF5] border border-[#F0E6D8] p-2.5">
                        <div className="text-xs text-[#9CA3AF]">Changes</div><div className="font-semibold text-sm">1</div>
                      </div>
                      <div className="rounded-xl bg-[#FFFBF5] border border-[#F0E6D8] p-2.5">
                        <div className="text-xs text-[#9CA3AF]">Est. fare</div><div className="font-semibold text-sm">₹2,845</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-3 text-center">Timeline is the visual identity — progressive disclosure, not tables.</p>
                  </div>
                </div>
                <div className="mt-3 text-center text-xs text-[#9CA3AF]">Built with OpenAI as explanation layer — not as railway database</div>
              </div>
            </div>
          </div>
        )}

        {/* PREFERENCES */}
        {view==="prefs" && (
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-8 pb-10">
            <button onClick={()=>setView("landing")} className="text-sm text-[#6B7280] hover:text-black mb-4">← Back</button>
            <h2 className="text-[28px] font-bold tracking-tight">What matters most to you?</h2>
            <p className="text-sm text-[#6B7280] mt-1">We&apos;ll rank journeys accordingly. You can change this anytime.</p>
            <div className="grid gap-3 mt-6">
              <button onClick={()=>setPref("easy")} className={`text-left rounded-2xl border-2 p-4 flex gap-4 items-start transition ${pref==="easy" ? "border-[#1A1A1A] bg-white shadow-sm" : "border-[#F0E6D8] bg-white hover:border-[#E5DDD3]"}`}>
                <span className="text-2xl">🧘</span>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">Easy journey {pref==="easy" && <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A1A1A] text-white">Selected</span>}</div>
                  <div className="text-sm text-[#6B7280]">Fewer changes and more time between trains. Best if you&apos;re travelling with family.</div>
                </div>
                <span className={`w-5 h-5 rounded-full border-2 grid place-items-center ${pref==="easy"?"border-[#1A1A1A]":"border-[#E5DDD3]"}`}><span className={`w-2.5 h-2.5 rounded-full ${pref==="easy"?"bg-[#1A1A1A]":""}`} /></span>
              </button>
              <button onClick={()=>setPref("fastest")} className={`text-left rounded-2xl border-2 p-4 flex gap-4 items-start transition ${pref==="fastest" ? "border-[#1A1A1A] bg-white shadow-sm" : "border-[#F0E6D8] bg-white hover:border-[#E5DDD3]"}`}>
                <span className="text-2xl">⚡</span>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">Fastest {pref==="fastest" && <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A1A1A] text-white">Selected</span>}</div>
                  <div className="text-sm text-[#6B7280]">Get there in the shortest possible time — tighter connections.</div>
                </div>
                <span className={`w-5 h-5 rounded-full border-2 grid place-items-center ${pref==="fastest"?"border-[#1A1A1A]":"border-[#E5DDD3]"}`}><span className={`w-2.5 h-2.5 rounded-full ${pref==="fastest"?"bg-[#1A1A1A]":""}`} /></span>
              </button>
              <button onClick={()=>setPref("cheapest")} className={`text-left rounded-2xl border-2 p-4 flex gap-4 items-start transition ${pref==="cheapest" ? "border-[#1A1A1A] bg-white shadow-sm" : "border-[#F0E6D8] bg-white hover:border-[#E5DDD3]"}`}>
                <span className="text-2xl">💰</span>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">Cheapest {pref==="cheapest" && <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A1A1A] text-white">Selected</span>}</div>
                  <div className="text-sm text-[#6B7280]">Minimize estimated journey cost — may be longer.</div>
                </div>
                <span className={`w-5 h-5 rounded-full border-2 grid place-items-center ${pref==="cheapest"?"border-[#1A1A1A]":"border-[#E5DDD3]"}`}><span className={`w-2.5 h-2.5 rounded-full ${pref==="cheapest"?"bg-[#1A1A1A]":""}`} /></span>
              </button>
            </div>
            <div className="mt-6 rounded-2xl bg-white border border-[#F0E6D8] p-4">
              <div className="text-sm font-semibold mb-2">Optional</div>
              <label className="flex items-center gap-2 text-sm py-1.5"><input type="checkbox" checked={extras.children} onChange={e=>setExtras({...extras, children:e.target.checked})} className="rounded" /> Travelling with children</label>
              <label className="flex items-center gap-2 text-sm py-1.5"><input type="checkbox" checked={extras.elderly} onChange={e=>setExtras({...extras, elderly:e.target.checked})} className="rounded" /> Travelling with elderly passenger</label>
              <label className="flex items-center gap-2 text-sm py-1.5"><input type="checkbox" checked={extras.fewerTransfers} onChange={e=>setExtras({...extras, fewerTransfers:e.target.checked})} className="rounded" /> Prefer fewer station transfers</label>
              {(extras.children || extras.elderly) && <p className="text-xs text-[#9CA3AF] mt-2">We&apos;ll favour larger buffers and simpler station transfers.</p>}
            </div>
            <button onClick={find} className="mt-6 w-full rounded-full bg-[#1A1A1A] text-white font-semibold py-3.5 hover:bg-black transition">
              Find journeys → {from} → {to}
            </button>
            <p className="text-center text-xs text-[#9CA3AF] mt-2">We&apos;ll show 3 curated options, not a giant list.</p>
          </div>
        )}

        {/* RESULTS */}
        {view==="results" && (
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-10">
            <button onClick={()=>setView("prefs")} className="text-sm text-[#6B7280] hover:text-black mb-3">← Preferences</button>
            <div className="flex items-baseline justify-between">
              <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight">We found {journeys.length} ways to get there</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-white border border-[#F0E6D8] text-[#6B7280]">{formatDate(date)}</span>
            </div>
            <p className="text-sm text-[#6B7280] mt-1">Tap a card to see the full timeline and interchange details.</p>

            <div className="grid gap-4 mt-6">
              {journeys.map((j, idx) => {
                const isRecommended = idx===0;
                const label = isRecommended ? "Best for you" : idx===1 ? "Fastest" : "Cheapest";
                const transfer = (j.legs.find(l=>l.type==="transfer") as any)?.transfer;
                const legs = j.legs.filter(l=>l.type==="train") as any[];
                return (
                  <div key={j.id} className={`rounded-[20px] border bg-white overflow-hidden ${isRecommended?"border-[#1A1A1A] shadow-[0_8px_24px_rgba(0,0,0,0.08)]":"border-[#F0E6D8]"}`}>
                    {isRecommended && <div className="bg-[#1A1A1A] text-white text-xs font-semibold tracking-widest px-4 py-1.5">BEST FOR YOU</div>}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-widest text-[#9CA3AF] uppercase">{label}</span>
                        <RiskBadge risk={j.riskLevel} />
                      </div>
                      <div className="mt-2 font-semibold">{j.origin.name} → {j.destination.city} <span className="text-[#9CA3AF] font-normal text-sm">· {formatDate(date)}</span></div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="rounded-xl bg-[#FFFBF5] border border-[#F0E6D8] p-2.5"><div className="text-[11px] text-[#9CA3AF]">Trains</div><div className="font-semibold">🚆 {legs.length} trains</div><div className="text-xs text-[#6B7280]">{j.interchangeCount} change</div></div>
                        <div className="rounded-xl bg-[#FFFBF5] border border-[#F0E6D8] p-2.5"><div className="text-[11px] text-[#9CA3AF]">Duration</div><div className="font-semibold">⏱ {formatDuration(j.totalDurationMinutes)}</div><div className="text-xs text-[#6B7280]">{transfer?formatDuration(transfer.durationMinutes)+" change":"Direct"}</div></div>
                        <div className="rounded-xl bg-[#FFFBF5] border border-[#F0E6D8] p-2.5"><div className="text-[11px] text-[#9CA3AF]">Est. fare</div><div className="font-semibold">₹{j.totalCost.toLocaleString("en-IN")}</div><div className="text-xs text-[#6B7280]">AC 3-tier</div></div>
                      </div>
                      {transfer && (
                        <div className="mt-3 rounded-xl bg-[#F8FAF8] border border-[#E5EEE5] p-3 flex items-start gap-2">
                          <span className="mt-0.5">
                            {j.riskLevel==="low" ? "🟢" : j.riskLevel==="medium" ? "🟡" : "🔴"}
                          </span>
                          <div className="text-sm">
                            <span className="font-medium">{formatDuration(transfer.durationMinutes)} connection</span>
                            <span className="text-[#6B7280]"> — {transfer.reason}</span>
                          </div>
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button onClick={()=>{setSelected(j); setView("detail"); window.scrollTo({top:0, behavior:"smooth"})}} className={`flex-1 rounded-full py-3 font-semibold text-sm transition ${isRecommended?"bg-[#E85D04] text-white hover:bg-[#D45300]":"bg-white border border-[#E5DDD3] hover:bg-[#FFFBF5]"}`}>
                          {isRecommended ? "View journey" : "View journey"}
                        </button>
                        <button onClick={()=>saveJourney(j)} className="px-4 rounded-full border border-[#E5DDD3] bg-white text-sm hover:bg-[#FFFBF5]">Save</button>
                      </div>
                      {isRecommended && j.whyNotFaster && (
                        <p className="text-xs text-[#6B7280] mt-2 text-center">💡 {j.whyNotFaster}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 rounded-xl bg-[#FFF4E6] border border-[#F0E6D8] p-3 text-xs text-[#7A5A2A] flex gap-2">
              <span>ℹ️</span><span> Prototype uses synthetic train & delay data — not live availability. Fares are estimates for AC 3-tier on selected date.</span>
            </div>
          </div>
        )}

        {/* DETAIL */}
        {view==="detail" && selected && (
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-10">
            <button onClick={()=>setView("results")} className="text-sm text-[#6B7280] hover:text-black mb-3">← Back to results</button>
            <h2 className="text-[26px] font-bold tracking-tight">Your journey to {selected.destination.city}</h2>
            <p className="text-sm text-[#6B7280]">{selected.origin.name} → {selected.destination.name} · {formatDate(date)}</p>

            {/* Pill stats */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-white border border-[#F0E6D8]">⏱ {formatDuration(selected.totalDurationMinutes)}</span>
              <span className="px-3 py-1.5 rounded-full bg-white border border-[#F0E6D8]">🔄 {selected.interchangeCount} interchange</span>
              <span className="px-3 py-1.5 rounded-full bg-white border border-[#F0E6D8]">₹{selected.totalCost.toLocaleString("en-IN")} est.</span>
              <RiskBadge risk={selected.riskLevel} />
            </div>

            {/* Timeline */}
            <div className="mt-6 bg-white rounded-[20px] border border-[#F0E6D8] p-4 sm:p-6">
              <div className="text-xs font-semibold tracking-widest text-[#9CA3AF] uppercase mb-4">Timeline</div>
              <div className="relative pl-6 border-l-2 border-[#E5DDD3]">
                {selected.legs.map((leg, i) => {
                  if (leg.type==="train") {
                    return (
                      <div key={i} className="relative pb-6">
                        <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-[#1A1A1A] border-2 border-white shadow" />
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs text-[#9CA3AF]">{leg.departure} · Day { (leg as any).dayOffset + 1}</div>
                            <div className="font-semibold">{(leg as any).from.name}</div>
                            <div className="text-xs text-[#6B7280]">{(leg as any).from.code} · Platform {(leg as any).train.stops.find((s:any)=>s.stationId===(leg as any).from.id)?.platform ?? "—"}</div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-[#FFF4E6] border border-[#F0E6D8]">🚆 {(leg as any).train.number} · {(leg as any).train.name}</span>
                        </div>
                        <div className="mt-2 ml-1 border-l-2 border-dotted border-[#E5DDD3] pl-4 py-2">
                          <div className="text-xs text-[#6B7280]">On board for {formatDuration((leg as any).train.durationMinutes)} · Sleeper ₹{(leg as any).train.fare.sleeper} · 3A ₹{(leg as any).train.fare.ac3} · { (leg as any).train.reliability}% on-time · avg delay {(leg as any).train.avgDelay}m</div>
                        </div>
                        <div className="flex justify-between items-start mt-2">
                          <div>
                            <div className="text-xs text-[#9CA3AF]">{leg.arrival} · {(leg as any).dayOffset ? "Next day" : ""}</div>
                            <div className="font-semibold">{(leg as any).to.name}</div>
                            <div className="text-xs text-[#6B7280]">{(leg as any).to.code}</div>
                          </div>
                          <span className="text-xs text-[#9CA3AF]">{(leg as any).train.days.join(" · ")}</span>
                        </div>
                      </div>
                    );
                  } else {
                    const tr = (leg as any).transfer;
                    return (
                      <div key={i} className="relative pb-6 -ml-6 pl-6">
                        <div className="rounded-xl border-2 border-dashed border-[#E5DDD3] bg-[#FFFBF5] p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">🔄 Change trains at {getStationName(tr.fromStationId)}</span>
                            <RiskBadge risk={tr.risk} />
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-white rounded-lg border border-[#F0E6D8] p-2.5 text-center">
                              <div className="text-xs text-[#9CA3AF]">You have</div>
                              <div className="font-bold text-lg">{formatDuration(tr.durationMinutes)}</div>
                              <div className="text-xs text-[#6B7280]">Usable {formatDuration(tr.usableBuffer)} after walk</div>
                            </div>
                            <div className="bg-white rounded-lg border border-[#F0E6D8] p-2.5">
                              <div className="text-xs text-[#9CA3AF]">What you need to do</div>
                              <ol className="text-xs mt-1 list-decimal pl-4 space-y-0.5">
                                <li>Get off at {getStationName(tr.fromStationId)}</li>
                                <li>Follow signs to Platform {(selected.legs[i+1] as any)?.train?.stops?.find((s:any)=>s.stationId===tr.toStationId)?.platform ?? "7"}</li>
                                <li>Walk ~{tr.requiredWalkingMinutes} min</li>
                                <li>Board your next train</li>
                              </ol>
                            </div>
                          </div>
                          {tr.requiresStationChange ? (
                            <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2 flex gap-2">
                              <span>⚠️</span><span><strong>Station transfer required:</strong> {getStationName(tr.fromStationId)} → {getStationName(tr.toStationId)} · Road transfer {tr.stationChangeTransferMinutes}–{tr.stationChangeTransferMinutes!+5} min. {tr.reason}</span>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-[#6B7280]">✅ {tr.reason}</div>
                          )}
                          <details className="mt-2 text-xs">
                            <summary className="cursor-pointer text-[#6B7280] hover:text-black">How we calculate risk</summary>
                            <p className="mt-1 text-[#6B7280]">Usable buffer = departure₂ − arrival₁ − walking time. Low ≥60m, Moderate 20–60m, High &lt;20m. + reliability ({(selected.legs[0] as any).train.reliability}% / {(selected.legs[2] as any)?.train?.reliability ?? 0}% on-time) and station complexity. Station change adds penalty.</p>
                          </details>
                        </div>
                      </div>
                    );
                  }
                })}
                <div className="relative">
                  <span className="absolute -left-[29px] -top-1 w-4 h-4 rounded-full bg-[#E85D04] grid place-items-center text-white text-[10px]">🏁</span>
                  <div className="font-semibold">{selected.destination.city}</div>
                  <div className="text-xs text-[#6B7280]">You&apos;ve arrived.</div>
                </div>
              </div>
            </div>

            {/* Why recommended */}
            <div className="mt-4 bg-white rounded-2xl border border-[#F0E6D8] p-4 sm:p-5">
              <h3 className="font-semibold flex items-center gap-2">💡 Why we recommend this</h3>
              <ul className="mt-2 space-y-1.5">
                {selected.reasons.map((r, i)=>(
                  <li key={i} className="text-sm flex gap-2"><span className="text-emerald-600">✓</span><span>{r}</span></li>
                ))}
              </ul>
              {selected.whyNotFaster && <p className="mt-3 text-sm bg-[#FFFBF5] border border-[#F0E6D8] rounded-xl p-3">💬 {selected.whyNotFaster}</p>}
              <button onClick={()=>handleExplain(selected)} className="mt-3 w-full rounded-full border border-[#E5DDD3] bg-[#FFFBF5] py-2.5 text-sm font-medium hover:bg-white">
                {explainLoading ? "Explaining…" : "✨ Explain this journey"}
              </button>
              {explain && (
                <div className="mt-3 rounded-xl bg-[#1A1A1A] text-white p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {explain}
                  <div className="text-[11px] text-[#9CA3AF] mt-2">AI explanation uses structured journey data only — no invented train times.</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 grid gap-3">
              <button onClick={()=>{setView("journey"); window.scrollTo({top:0, behavior:"smooth"})}} className="w-full rounded-full bg-[#1A1A1A] text-white font-semibold py-3.5 hover:bg-black">Start journey →</button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={()=>saveJourney(selected)} className="rounded-full border border-[#E5DDD3] bg-white py-3 text-sm font-medium hover:bg-[#FFFBF5]">Save journey</button>
                <button onClick={()=>{navigator.clipboard?.writeText(JSON.stringify(selected, null, 2)); setToast("Journey JSON copied"); setTimeout(()=>setToast(null),2000)}} className="rounded-full border border-[#E5DDD3] bg-white py-3 text-sm font-medium hover:bg-[#FFFBF5]">Copy journey JSON</button>
              </div>
            </div>

            {/* Journey API preview */}
            <div className="mt-4 rounded-2xl bg-white border border-[#F0E6D8] p-4">
              <div className="text-xs font-semibold tracking-widest text-[#9CA3AF] uppercase">Journey object — platform-ready</div>
              <pre className="mt-2 text-xs bg-[#FFFBF5] border border-[#F0E6D8] rounded-xl p-3 overflow-auto">{JSON.stringify({origin:selected.origin.name, destination:selected.destination.name, date:selected.date, legs:selected.legs.map(l=> l.type==="train"?{mode:"rail", from:(l as any).from.name, to:(l as any).to.name, departure:(l as any).departure, arrival:(l as any).arrival}:{mode:"transfer", station:getStationName((l as any).transfer.fromStationId), duration_minutes:(l as any).transfer.durationMinutes, risk:(l as any).transfer.risk})}, null, 2)}</pre>
              <p className="text-xs text-[#9CA3AF] mt-2">Future: rail → metro → bus → last-mile from one journey object.</p>
            </div>

            {/* Mock booking */}
            <div className="mt-4 rounded-2xl bg-[#FFF4E6] border border-[#F0E6D8] p-4 text-center">
              <div className="font-semibold">Ready to book?</div>
              <p className="text-sm text-[#6B7280] mt-1">Raasta has planned your journey. Ticket booking would happen through the appropriate railway booking service.</p>
              <button onClick={()=>{setToast("Booking is mocked — no real IRCTC transaction."); setTimeout(()=>setToast(null),3000)}} className="mt-3 rounded-full bg-white border border-[#E5DDD3] px-5 py-2.5 text-sm font-medium hover:bg-[#FFFBF5]">Continue to booking →</button>
              <p className="text-[11px] text-[#9CA3AF] mt-2">Booking is mocked in this prototype. No real payment or railway transaction occurs.</p>
            </div>
          </div>
        )}

        {/* JOURNEY MODE */}
        {view==="journey" && selected && (
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-10">
            <button onClick={()=>setView("detail")} className="text-sm text-[#6B7280] hover:text-black mb-3">← Back to details</button>

            <div className="rounded-2xl bg-[#1A1A1A] text-white p-5">
              <div className="text-xs tracking-widest text-[#9CA3AF] uppercase">Journey mode</div>
              <h2 className="text-xl font-bold mt-1">You&apos;re on your way</h2>
              <p className="text-sm text-[#9CA3AF]">We&apos;ll guide you step by step.</p>
            </div>

            {/* Next step */}
            <div className="mt-4 bg-white rounded-2xl border border-[#F0E6D8] p-4">
              <div className="text-xs font-semibold tracking-widest text-[#9CA3AF] uppercase">Your next step</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF4E6] border border-[#F0E6D8] grid place-items-center">🚆</div>
                <div>
                  <div className="font-semibold">Take {(selected.legs[0] as any).train.number} — {(selected.legs[0] as any).train.name}</div>
                  <div className="text-sm text-[#6B7280]">{(selected.legs[0] as any).from.name} → {(selected.legs[0] as any).to.name} · Dep {(selected.legs[0] as any).departure}</div>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-[#FFFBF5] border border-[#F0E6D8] p-3 text-sm">
                We&apos;ll tell you what to do when you arrive at { (selected.legs[0] as any).to.name}.
              </div>
            </div>

            {/* Journey progress */}
            <div className="mt-4 bg-white rounded-2xl border border-[#F0E6D8] p-4">
              <div className="font-semibold text-sm">After you arrive — Change trains</div>
              <div className="text-xs text-[#6B7280]">Platform {(selected.legs[0] as any).train.stops.find((s:any)=>s.stationId===(selected.legs[0] as any).to.id)?.platform ?? "4"} → {(selected.legs[2] as any)?.train?.stops.find((s:any)=>s.stationId===(selected.legs[1] as any)?.transfer.toStationId)?.platform ?? "7"} · Walk ~{(selected.legs[1] as any).transfer.requiredWalkingMinutes} min</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm">Connection:</span>
                <span className="font-semibold">{formatDuration((selected.legs[1] as any).transfer.durationMinutes)}</span>
                <span className={`ml-auto text-xs px-2 py-1 rounded-full border ${delay===0?"bg-emerald-50 border-emerald-200 text-emerald-700" : delay < 40 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  {delay===0 ? "🟢 You're on track" : delay < 40 ? "🟡 Moderate delay" : "🔴 Connection at risk"}
                </span>
              </div>
              {delay>0 && (
                <div className="mt-2 text-sm">
                  Original buffer: {formatDuration((selected.legs[1] as any).transfer.durationMinutes)} → now <strong>{formatDuration(Math.max(0,(selected.legs[1] as any).transfer.durationMinutes - delay))}</strong> after {delay} min delay
                </div>
              )}
            </div>

            {/* Delay simulation */}
            <div className="mt-4 rounded-2xl border-2 border-dashed border-[#E85D04]/30 bg-[#FFF4E6] p-4">
              <div className="text-xs font-semibold tracking-widest text-[#E85D04] uppercase">Prototype controls</div>
              <p className="text-xs text-[#7A5A2A] mt-1">Demo only — simulates a delay on your first train.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={()=>setDelay(0)} className={`px-4 py-2 rounded-full text-sm font-medium border ${delay===0?"bg-[#1A1A1A] text-white border-[#1A1A1A]":"bg-white border-[#E5DDD3] hover:bg-white"}`}>Reset</button>
                <button onClick={()=>setDelay(35)} className={`px-4 py-2 rounded-full text-sm font-medium border ${delay===35?"bg-[#E85D04] text-white border-[#E85D04]":"bg-white border-[#E5DDD3]"}`}>Simulate 35m delay</button>
                <button onClick={()=>setDelay(70)} className={`px-4 py-2 rounded-full text-sm font-medium border ${delay===70?"bg-[#E85D04] text-white border-[#E85D04]":"bg-white border-[#E5DDD3]"}`}>Simulate 70m delay</button>
                <button onClick={()=>setDelay(110)} className={`px-4 py-2 rounded-full text-sm font-medium border ${delay===110?"bg-[#E85D04] text-white border-[#E85D04]":"bg-white border-[#E5DDD3]"}`}>Simulate 110m delay</button>
              </div>

              {delay >= 35 && (
                <div className="mt-4 rounded-xl bg-white border border-amber-200 p-4">
                  <div className="font-semibold text-amber-800 flex gap-2">⚠️ Your connection is at risk</div>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Your first train is running approximately <strong>{delay} minutes</strong> late.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-[#FFFBF5] border border-[#F0E6D8] p-2 text-center">
                      <div className="text-xs text-[#9CA3AF]">Original</div>
                      <div className="font-semibold">{formatDuration((selected.legs[1] as any).transfer.durationMinutes)}</div>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-center">
                      <div className="text-xs text-[#9CA3AF]">Now</div>
                      <div className="font-semibold">{formatDuration(Math.max(0,(selected.legs[1] as any).transfer.durationMinutes - delay))}</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-2">Your original connection may still be possible, but we recommend a later train for recovery time.</p>

                  {recovery.length>0 ? (
                    <div className="mt-3">
                      <div className="font-semibold text-sm">We found a safer option</div>
                      <div className="mt-2 space-y-2">
                        {recovery.map((r, idx)=>(
                          <button key={idx} onClick={()=>setRecoverSelected(r.journey.id)} className={`w-full text-left rounded-xl border p-3 flex items-center justify-between ${recoverSelected===r.journey.id?"border-[#1A1A1A] bg-[#FFFBF5]":"border-[#F0E6D8] bg-white hover:bg-[#FFFBF5]"}`}>
                            <div>
                              <div className="font-semibold text-sm">{(r.journey.legs[2] as any).train.number} · {(r.journey.legs[2] as any).train.name}</div>
                              <div className="text-xs text-[#6B7280]">Dep {(r.journey.legs[2] as any).departure} · {formatDuration(r.buffer)} buffer · 🟢 {r.risk}</div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-[#1A1A1A] text-white">{idx===0 ? "Recommended" : idx===1 ? "Faster but risky" : "Wait longer"}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button onClick={()=>{if(recoverSelected){ const rec = recovery.find(r=>r.journey.id===recoverSelected)?.journey; if(rec){ setSelected(rec); setDelay(0); setRecoverSelected(null); setToast("Journey updated to recovery option"); setTimeout(()=>setToast(null),2500);} }}} className="rounded-full bg-[#1A1A1A] text-white py-2.5 text-sm font-medium">Use recovery option</button>
                        <button onClick={()=>setDelay(0)} className="rounded-full border border-[#E5DDD3] bg-white py-2.5 text-sm font-medium">Keep current plan</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 mt-3">No alternative same-day trains with safe buffer — consider next-day options or different date.</p>
                  )}
                </div>
              )}
            </div>

            {/* Last mile */}
            <div className="mt-4 bg-white rounded-2xl border border-[#F0E6D8] p-4">
              <div className="text-sm font-semibold">You&apos;ve reached Madgaon.</div>
              <div className="text-sm font-bold">Continue your journey</div>
              <p className="text-xs text-[#9CA3AF]">Future integration concept — not live APIs</p>
              <div className="mt-3 grid sm:grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#F0E6D8] p-3">
                  <div className="text-sm font-semibold">🚕 Ride</div><div className="text-xs text-[#6B7280]">Connect to mobility provider · 8–12 min to city</div><button onClick={()=>setToast("Mock ride integration — concept only")} className="mt-2 text-xs font-medium text-[#E85D04]">Explore →</button>
                </div>
                <div className="rounded-xl border border-[#F0E6D8] p-3">
                  <div className="text-sm font-semibold">🚌 Local transport</div><div className="text-xs text-[#6B7280]">Find nearby public transport</div><button onClick={()=>setToast("Mock bus integration — concept only")} className="mt-2 text-xs font-medium text-[#E85D04]">Explore →</button>
                </div>
                <div className="rounded-xl border border-[#F0E6D8] p-3">
                  <div className="text-sm font-semibold">📍 Navigate</div><div className="text-xs text-[#6B7280]">Continue to your destination</div><button onClick={()=>setToast("Mock navigation — concept only")} className="mt-2 text-xs font-medium text-[#E85D04]">Navigate →</button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">🏁 Journey complete · {selected.legs.filter(l=>l.type==="train").length} trains · {selected.interchangeCount} interchange</div>
              <div className="mt-3 flex justify-center gap-2">
                <button onClick={()=>saveJourney(selected)} className="rounded-full border border-[#E5DDD3] bg-white px-5 py-2 text-sm">Save journey</button>
                <button onClick={()=>{setView("results"); setDelay(0)}} className="rounded-full bg-[#1A1A1A] text-white px-5 py-2 text-sm">Plan another</button>
              </div>
            </div>
          </div>
        )}

        {/* Saved journeys drawer */}
        {showSaved && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div onClick={()=>setShowSaved(false)} className="flex-1 bg-black/30 backdrop-blur-sm" />
            <div className="w-full max-w-[420px] bg-[#FFFBF5] h-full overflow-auto border-l border-[#F0E6D8] shadow-2xl">
              <div className="sticky top-0 bg-[#FFFBF5] border-b border-[#F0E6D8] p-4 flex items-center justify-between">
                <h3 className="font-semibold">Saved journeys</h3>
                <button onClick={()=>setShowSaved(false)} className="w-8 h-8 rounded-full bg-white border border-[#E5DDD3] grid place-items-center">✕</button>
              </div>
              <div className="p-4">
                {saved.length===0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">🗺️</div>
                    <div className="font-semibold">No saved journeys yet</div>
                    <p className="text-sm text-[#6B7280] mt-1">Plan a journey and save it here for later.</p>
                    <button onClick={()=>setShowSaved(false)} className="mt-4 rounded-full bg-[#1A1A1A] text-white px-5 py-2 text-sm">Plan a journey</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {saved.map(j=>(
                      <div key={j.id} className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                        <div className="font-semibold text-sm">{j.origin.name} → {j.destination.city}</div>
                        <div className="text-xs text-[#6B7280]">{formatDate(j.date)} · {formatDuration(j.totalDurationMinutes)} · ₹{j.totalCost.toLocaleString("en-IN")}</div>
                        <div className="text-xs mt-1">{j.legs.filter(l=>l.type==="train").length} trains · {j.interchangeCount} interchange · {j.riskLevel} risk</div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={()=>{setSelected(j); setView("detail"); setShowSaved(false); window.scrollTo({top:0, behavior:"smooth"})}} className="flex-1 rounded-full bg-[#1A1A1A] text-white py-2 text-sm">Open</button>
                          <button onClick={()=>setSaved(prev=>prev.filter(s=>s.id!==j.id))} className="px-4 rounded-full border border-[#E5DDD3] bg-white text-sm">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-sm px-4 py-2.5 rounded-full shadow-xl z-50">
            {toast}
          </div>
        )}
      </main>

      <footer className="border-t border-[#F0E6D8] bg-white mt-auto">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between text-xs text-[#6B7280]">
            <div className="max-w-[620px]">
              <div className="font-semibold text-[#1A1A1A]">Prototype information</div>
              <p className="mt-1">Raasta is an independent prototype and is not an official Indian Railways or government product. Train schedules, fares, delay information and availability shown are synthetic and used only for demonstration. No real passenger information, payment details, OTPs or government systems are used.</p>
              <p className="mt-2">OpenAI is used as an explanation layer to convert structured journey data into simple language. The model does not invent train information. Fallback explanations are deterministic.</p>
            </div>
            <div className="sm:text-right">
              <div className="font-medium text-[#1A1A1A]">Built for hackathon</div>
              <div>Plan the journey, not the train.</div>
              <div className="mt-1">Synthetic data · Mock booking · Future mobility concepts</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    low: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    medium: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
    high: { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500" },
  };
  const m = map[risk] ?? map.low;
  const label = risk === "low" ? "Low risk" : risk === "medium" ? "Moderate risk" : risk === "high" ? "High risk" : risk;
  return <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${m.bg} ${m.text} font-medium`}><span className={`w-2 h-2 rounded-full ${m.dot}`} /> {label}</span>;
}
function getStationName(id: string) {
  return stations.find(s=>s.id===id)?.name ?? id;
}
