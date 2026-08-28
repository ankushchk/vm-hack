# Raasta — Plan the journey, not the train.

> **A simple journey layer for Indian Railways that turns complicated multi-train travel into one clear, risk-aware plan.**

Raasta helps citizens plan complete railway journeys that require multiple trains — without having to manually discover, validate and manage connections.

**Live prototype:** `npm run dev` → http://localhost:3000  
**Spec:** see `SPEC.md` (71-section hackathon brief)

---

## Problem

> Planning an Indian railway journey that requires multiple trains is unnecessarily difficult because passengers must manually discover, validate, and manage connections.

Citizens think "I need to get from Delhi to Goa" — not "which train gets me halfway there, is the connection possible, how long between trains, same station?"

## Solution

Raasta constructs **complete journeys** (one or more train legs + interchange) and explains:
- which trains to take, where to change, how long you have, whether connection is safe, whether station transfer is required, what to do if delayed, and what to do next.

Core principle: **Show only what you need, when you need it** (progressive disclosure). Timeline is the visual identity.

---

## Key Features

- **Journey construction** — graph-based routing (Station = node, train segment = edge, transfer = edge)
- **Risk-aware connections** — Low / Moderate / High based on usable buffer = `departure₂ − arrival₁ − walking_time`, station complexity, historical reliability
- **Station-transfer intelligence** — Mumbai Central ↔ Dadar ↔ Bandra treated as separate stations with road-transfer time (15–25m) and risk penalty
- **Why recommended** — human explanation of trade-offs ("we chose this instead of faster because +1h30m buffer")
- **Progressive journey guidance** — Next step → Interchange → Last-mile
- **Delay recovery (wow moment)** — Simulate 35/70/110m delay → connection at risk banner → safer later trains ranked
- **AI explanation** — OpenAI as *explanation layer* (structured journey → simple language), deterministic fallback, never invents railway facts
- **Saved journeys** (localStorage), mock booking handoff, last-mile future integration cards
- **Mobile-first, accessible, fast** — no heavy maps, CSS-only visuals, high contrast, keyboard focus, icons + text

## Demo Flow (60–90 sec)

```
Landing (Delhi → Goa, 30 Aug) → Preferences (Easy/Fastest/Cheapest)
→ Find journeys → 3 cards (Recommended / Fastest / Cheapest)
→ View journey → Timeline + interchange + Why recommended + Explain journey
→ Start journey → Next step → Simulate 70m delay → Connection at risk → Recovery options → Last-mile → Complete
```

## Tech

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Synthetic data: `src/data/stations.ts` (30 stations), `src/data/trains.ts` (~40 trains), synthetic delay/reliability
- Routing: `src/lib/engine.ts` (`findJourneys`, risk engine, ranking)
- Types: `src/lib/types.ts`
- API: `src/app/api/explain/route.ts` (server-only `OPENAI_API_KEY`)
- Components inlined in `src/app/page.tsx` for prototype polish (JourneySearch, PreferenceSelector, JourneyCard, Timeline, TransferCard, RiskBadge, DelayAlert, etc.)

### Architecture

```
Synthetic data → Journey Engine → Connection Risk Engine → Ranking
      ↓ structured Journey object → AI Explanation (OpenAI, fallback)
      ↓ UI (progressive disclosure, timeline) → localStorage saved → Journey API concept
```

### Data Honesty

All train schedules, fares, delay stats are **synthetic and labelled**:
> *Independent prototype · Uses synthetic railway data — not live IRCTC availability · Not an official government product*

No government logos, no Aadhaar/PAN/OTP/payment, no live scraping, no personal data.

## AI Usage

`POST /api/explain` receives structured journey JSON and returns plain-language summary. If `OPENAI_API_KEY` missing, fallback deterministic string is used. No client-side key exposure. Model never generates railway facts.

## Getting Started

```bash
npm install
npm run dev   # http://localhost:3000
npm run build # production build
```

Optional: `OPENAI_API_KEY` in `.env.local` for AI explanations.

## Project Structure

```
src/
  app/page.tsx        # full SPA (landing → prefs → results → detail → journey mode)
  app/api/explain/route.ts
  lib/types.ts
  lib/engine.ts       # routing + risk + recovery
  data/stations.ts
  data/trains.ts
public/
SPEC.md               # original 71-section brief
```

## Future

One journey layer connecting rail + metro + bus + last-mile mobility — citizen still sees "Delhi → Goa", system handles complexity.

## License

Prototype for hackathon — not for production railway operations.
