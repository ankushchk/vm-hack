# RAASTA — THE PUBLIC JOURNEY LAYER FOR INDIAN RAILWAYS

## 0. YOUR ROLE

You are the lead product engineer, product designer, UX researcher, and technical architect responsible for building a polished hackathon-ready web application called **Raasta**.

You are not merely creating a UI mockup. You must build a **fully interactive, browser-based prototype** that allows a reviewer to complete the core citizen journey from beginning to end.

The product is being built for a public-service design hackathon focused on improving painful experiences on Indian public digital services.

The final prototype must be:

* Fully browser accessible
* Responsive, especially mobile-first
* Fast on slower connections
* Simple enough for users with limited digital experience
* Built around a real citizen problem
* Honest about synthetic/mock data
* Clearly not presented as an official government product
* Demonstrably useful without requiring live IRCTC access
* Built with OpenAI/Codex meaningfully involved in development and/or product functionality
* Polished enough for a hackathon finalist-level demonstration

DO NOT build a generic travel booking website.

DO NOT build an IRCTC clone.

DO NOT build an Ixigo clone.

DO NOT add random travel features simply because they are possible.

The central principle of the entire product is:

> **Don't make citizens understand the railway network. Make the railway network understandable to citizens.**

---

# 1. PRODUCT CONCEPT

## Product name

**Raasta**

## Primary tagline

> **Plan the journey, not the train.**

Alternative supporting line:

> **Tell us where you're going. We'll tell you exactly how to get there.**

## Product thesis

Indian railway systems are fundamentally organized around trains, schedules, stations, and individual tickets.

Citizens think differently.

A citizen thinks:

> "I need to get from Delhi to Goa."

They should not have to think:

> "Which train gets me halfway there?"
>
> "What train connects from that station?"
>
> "Is the connection actually possible?"
>
> "How long do I need between trains?"
>
> "Are these actually the same station?"
>
> "What happens if my first train is late?"
>
> "How do I get from the arrival station to my final destination?"

Raasta creates a simple **journey layer** over the railway network.

Instead of searching for individual trains, users search for a destination.

Raasta constructs complete journeys made up of one or more train legs and explains:

* Which trains to take
* Where to change
* How long the interchange is
* Whether the connection is safe
* Whether a station transfer is required
* Why the journey is recommended
* What happens if a train is delayed
* What the user needs to do next

The product should feel like:

> **A public-service journey companion, not a travel marketplace.**

---

# 2. THE EXACT PROBLEM WE ARE SOLVING

Do not broaden the problem.

The primary problem is:

> **Planning an Indian railway journey that requires multiple trains is unnecessarily difficult because passengers must manually discover, validate, and manage connections between trains.**

The problem includes:

1. Finding possible combinations of trains
2. Understanding interchange duration
3. Determining whether two trains use the same station
4. Accounting for walking/station transfer time
5. Understanding delay risk
6. Comparing fastest vs safest vs cheapest journeys
7. Knowing what to do when a connection becomes unsafe
8. Understanding the journey as one coherent plan rather than separate trains

This is NOT primarily a ticket-booking problem.

It is NOT primarily a train-search problem.

It is a **journey comprehension and coordination problem**.

---

# 3. THE CORE PRODUCT PRINCIPLE

Everything must follow this principle:

> **Show the user only what they need, when they need it.**

Avoid information overload.

Do not expose unnecessary railway jargon.

Do not show huge tables of trains by default.

Do not show dozens of filters.

Do not overwhelm users with technical railway terminology.

Do not copy the information density of existing railway websites.

Instead use progressive disclosure.

For example:

BEFORE JOURNEY:

Show:

* Destination
* Date
* Journey preferences
* Recommended journey
* Total duration
* Number of changes
* Price estimate
* Risk level

AFTER SELECTING JOURNEY:

Show:

* Train 1
* Arrival
* Interchange
* Train 2
* Exact transfer instructions

DURING JOURNEY:

Show:

* Current train
* Next station
* Next action
* Time remaining
* Connection status

IF DELAYED:

Show:

* Problem
* Whether the connection is at risk
* Recommended alternative
* What the passenger should do

Do not show everything at once.

---

# 4. TARGET USERS

Primary:

### User A — Regular Indian traveller

Someone who understands basic train travel but does not want to manually construct complicated itineraries.

Example:

* College student
* Working professional
* Family traveller
* Solo traveller
* Person travelling between cities for work

Secondary:

### User B — Limited digital experience

A person who can use a smartphone but struggles with:

* Complicated forms
* Railway jargon
* Large tables
* Many filters
* Multiple apps

The UI should work for them without requiring technical knowledge.

Secondary:

### User C — Family traveller

A person travelling with:

* Children
* Elderly passengers
* Multiple people

They should be able to prefer safer connections with larger buffers.

---

# 5. PRODUCT PHILOSOPHY

The product should feel fundamentally different from private travel marketplaces.

Do not optimize for:

* Ads
* Upsells
* Hotels
* Flights
* Rewards
* Travel discovery
* Affiliate sales
* Excessive recommendations

Optimize for:

* Clarity
* Reliability
* Accessibility
* Journey completion
* Reduced cognitive load
* Trust
* Actionability

A strong design statement for the product is:

> **Public digital services should not compete for your attention. They should help you complete your task.**

---

# 6. CORE USER JOURNEY

The primary demo journey should be:

## New Delhi → Goa

Use this as the canonical example.

The exact train names, timings, prices, and delay statistics should be SYNTHETIC and clearly marked as such.

Do not represent synthetic data as live railway information.

The complete flow:

```text
Landing
  ↓
Enter destination
  ↓
Select date
  ↓
Select traveller preferences
  ↓
Find journeys
  ↓
Compare:
  Safest
  Fastest
  Cheapest
  ↓
Select journey
  ↓
Understand journey
  ↓
Understand interchange
  ↓
Continue / save journey
  ↓
Journey mode
  ↓
Simulate delay
  ↓
Receive connection-risk warning
  ↓
View recommended recovery option
  ↓
Journey complete
```

The reviewer should be able to experience this without needing an account.

---

# 7. SCREEN-BY-SCREEN UX

## SCREEN 1 — LANDING

The first screen should be extremely simple.

Headline:

> **Where are you going?**

Supporting text:

> Plan your entire railway journey — including connections.

Inputs:

### From

Default:

**New Delhi**

### To

Default:

**Goa**

### Date

Default:

**30 August**

Use a simple date selector.

Primary CTA:

> **Find my journey**

Optional small secondary action:

> Try a sample journey

Do NOT show:

* Login wall
* Ads
* Hotel cards
* Promotional banners
* Train news
* Large navigation
* Unnecessary filters

The page should immediately communicate what Raasta does.

---

# 8. SCREEN 2 — PREFERENCES

After entering origin/destination/date, ask one simple question:

> **What matters most to you?**

Three large cards:

### 🧘 Easy journey

> Fewer changes and more time between trains.

### ⚡ Fastest

> Get there in the shortest possible time.

### 💰 Cheapest

> Minimize estimated journey cost.

Default to:

**Easy journey**

Allow the user to continue without complicated configuration.

Optional advanced preferences:

* Travelling with children
* Travelling with elderly passenger
* Prefer fewer station transfers

These should be secondary and not required.

---

# 9. SCREEN 3 — JOURNEY RESULTS

Headline:

> **We found 3 ways to get there**

Do NOT show a giant list.

Show three primary journey cards.

---

## CARD 1 — RECOMMENDED

Badge:

**BEST FOR YOU**

Example:

### New Delhi → Goa

🚆 2 trains
🔄 1 change
⏱ 31h 25m
💰 ₹2,845 estimated

Connection:

**2h 35m**

Risk:

### 🟢 Low connection risk

Supporting explanation:

> Same station and enough buffer for a typical delay.

CTA:

> **View journey**

---

## CARD 2 — FASTEST

### Fastest

⏱ 29h 10m

🔄 1 change

🟡 Moderate risk

Explanation:

> Faster, but the connection is tighter.

CTA:

> View journey

---

## CARD 3 — CHEAPEST

### Cheapest

💰 ₹1,980 estimated

⏱ 35h 40m

🟢 Low risk

Explanation:

> Longer journey with a larger connection buffer.

CTA:

> View journey

---

# 10. JOURNEY RANKING

The backend should rank candidate journeys based on multiple factors.

Conceptually:

```text
Journey score =
    travel time
  + number of interchanges
  + connection buffer
  + station transfer complexity
  + historical delay risk
  + estimated cost
  + user preference
```

Do not make this unnecessarily complex.

For the prototype, use deterministic scoring.

Example:

```text
Safety score:
40% connection buffer
25% historical delay reliability
20% station transfer complexity
15% number of interchanges
```

For fastest:

```text
60% total travel time
20% number of interchanges
20% connection feasibility
```

For cheapest:

```text
70% estimated fare
20% connection feasibility
10% journey time
```

The UI should never expose mathematical complexity.

Instead explain decisions in human language.

---

# 11. SIGNATURE FEATURE — CONNECTION RISK

Every interchange must have a risk assessment.

Use:

### 🟢 LOW RISK

Enough buffer and simple station transfer.

### 🟡 MODERATE RISK

Possible but requires attention.

### 🔴 HIGH RISK

Connection is technically possible but not recommended.

The risk score should consider:

* Scheduled connection time
* Estimated walking/transfer time
* Historical delay buffer
* Whether stations differ
* Station complexity
* Whether tickets are separate

Example:

> **2h 35m connection**

Then:

> 🟢 **Low risk**

> Your next train leaves from the same station and you have a comfortable transfer buffer.

---

# 12. SIGNATURE FEATURE — “WHY THIS JOURNEY?”

This is extremely important.

Every recommended journey should have a simple explanation.

Example:

## Why we recommend this

* One interchange
* Same railway station
* 2h 35m connection buffer
* Low historical delay risk
* No station-to-station transfer

Then:

> **We chose this instead of the faster option because it gives you 1h 30m more connection time.**

This demonstrates product intelligence.

Do not simply label something “Recommended.”

Explain WHY.

---

# 13. JOURNEY DETAIL SCREEN

After clicking a journey:

Headline:

> **Your journey to Goa**

Show a clean vertical timeline.

Example:

```text
10:55 AM
NEW DELHI
    │
    │ Train 1
    │
6:55 AM
MUMBAI CENTRAL
    │
    │
    │ 2h 35m
    │
    │ CHANGE TRAINS
    │
9:30 AM
MUMBAI CENTRAL
    │
    │ Train 2
    │
5:20 PM
MADGAON
```

For each leg show:

* Train name
* Departure
* Arrival
* Station
* Estimated fare
* Seat/class information only if relevant to prototype

Do not expose unnecessary information.

---

# 14. INTERCHANGE SCREEN

This is one of the most important screens.

When the user taps the interchange:

## Change trains at Mumbai Central

### You have

**2h 35m**

### Your next train

**9:30 AM**

### What you need to do

1. Get off at Mumbai Central
2. Follow signs to Platform 7
3. Walk approximately 12 minutes
4. Board your next train

### Connection status

🟢 **Comfortable**

Then:

> You have enough time even with a moderate delay.

If stations differ:

## ⚠️ Station transfer required

Example:

**Mumbai Central → Dadar**

Estimated road transfer:

**15–25 minutes**

Then the risk score automatically changes.

---

# 15. “WHAT DO I NEED TO DO NOW?”

Introduce a contextual journey mode.

Instead of showing the entire itinerary all the time, show the next action.

Example:

## Your next step

### 🚆 Take Train 12952

**New Delhi → Mumbai Central**

Departure:

**10:55 AM**

Then:

> We'll tell you what to do when you arrive.

This is the core “minimal public service” philosophy.

---

# 16. JOURNEY MODE

Once a journey is selected, allow:

> **Start journey**

Then switch to a simplified journey mode.

Example:

## You're on your way

### Next stop

**Mumbai Central**

Arrival:

**6:55 AM**

Then:

### After you arrive

**Change trains**

Platform 4 → Platform 7

Estimated walk:

**12 min**

Connection:

**2h 35m**

Status:

🟢 You're on track.

Do not create a complicated map unless necessary.

A clear timeline is more important.

---

# 17. SIGNATURE FEATURE — DELAY RECOVERY

This should be the “wow” moment in the demo.

Include a visible prototype control for demo purposes:

> **Simulate 70 min delay**

This is ONLY for demonstration.

When triggered:

Display:

# ⚠️ Your connection is at risk

Example:

> Your first train is running approximately 70 minutes late.

Original connection:

**2h 35m**

Remaining connection:

**1h 25m**

Then:

### We found a safer option

**Mumbai → Goa**

Departure:

**9:40 PM**

Connection buffer:

**2h 10m**

Risk:

🟢 Low

CTA:

> **See recovery options**

Second CTA:

> Keep current plan

The system should explain the consequence:

> Your original connection may still be possible, but we recommend the later train because it provides more recovery time.

This demonstrates that Raasta is not just a search engine.

It actively helps the passenger complete the journey.

---

# 18. RECOVERY OPTIONS

Show alternatives as a simple list.

### Recommended

🟢 9:40 PM

2h 10m buffer

Low risk

### Faster but risky

🟡 8:55 PM

1h 25m buffer

Moderate risk

### Wait longer

🟢 11:15 PM

3h 45m buffer

Very low risk

Allow the user to select one.

Then update the journey.

---

# 19. FINAL JOURNEY STATE

Once all legs are completed:

## You're there.

### Goa

Journey complete.

**2 trains · 1 interchange**

Optional:

> **Save journey**

Do not add unnecessary reviews, rewards, recommendations, hotels, etc.

The journey is complete.

---

# 20. LAST-MILE EXTENSION

This is an important extension but should NOT become the core product.

After the final train:

## You've reached Madgaon.

### Continue your journey

Show:

🚕 **Ride to destination**

🚌 **Local transport**

📍 **Navigate**

These are integration concepts.

Do not require real Uber/Rapido APIs.

Use synthetic/mock provider cards.

The point is to demonstrate that the journey can continue beyond the railway station.

---

# 21. JOURNEY API / PLATFORM EXTENSION

Build the architecture so that the journey can eventually be consumed by other services.

Concept:

```text
Raasta Journey Engine
        ↓
Standard Journey Object
        ↓
 ┌──────┼────────┐
 ↓      ↓        ↓
Rail   Metro    Mobility
              providers
```

The core journey representation should conceptually include:

```json
{
  "origin": "New Delhi",
  "destination": "Goa",
  "date": "2026-08-30",
  "legs": [
    {
      "mode": "rail",
      "from": "New Delhi",
      "to": "Mumbai Central",
      "departure": "10:55",
      "arrival": "06:55"
    },
    {
      "mode": "transfer",
      "station": "Mumbai Central",
      "duration_minutes": 155,
      "risk": "low"
    },
    {
      "mode": "rail",
      "from": "Mumbai Central",
      "to": "Madgaon",
      "departure": "09:30",
      "arrival": "17:20"
    }
  ]
}
```

Do not actually integrate with Uber, Rapido, IRCTC, or other live systems for the hackathon.

The UI can demonstrate the future concept.

The technical architecture should make clear that the journey object could eventually be handed to:

* Mobility providers
* Metro systems
* Bus systems
* Navigation systems
* Public transport applications

This addresses end-to-end thinking.

---

# 22. AI / OPENAI ROLE

OpenAI must have a meaningful role.

Do NOT add an unnecessary chatbot just because this is an OpenAI hackathon.

Use AI where it genuinely improves the experience.

Primary AI feature:

## “Explain my journey”

A user can tap:

> **Explain this journey**

The model receives structured journey data and converts it into simple language.

Example input:

```text
2 railway legs
1 interchange
2h 35m buffer
same station
low historical delay risk
31h 25m total
```

AI response:

> You'll take two trains and change once at Mumbai Central.
>
> Your first train arrives at 6:55 AM and your next train leaves at 9:30 AM, giving you 2 hours and 35 minutes to change trains.
>
> Both trains use the same station, so you won't need a road transfer.
>
> We consider this a low-risk connection.
>
> You'll arrive in Goa at approximately 5:20 PM.

The AI should NOT invent train information.

It must only explain structured data supplied by the application.

If the AI service is unavailable, provide a deterministic fallback explanation.

---

# 23. AI SAFETY / TRUST

The model must not be treated as the source of railway facts.

Architecture:

```text
Synthetic railway data
        ↓
Journey engine
        ↓
Structured journey
        ↓
OpenAI
        ↓
Human-friendly explanation
```

NOT:

```text
User question
    ↓
LLM guesses train information
```

AI is an explanation layer, not a factual railway database.

---

# 24. SYNTHETIC DATA

DO NOT access:

* Live IRCTC systems
* Private railway APIs
* Undocumented APIs
* Restricted railway systems
* Personal data
* Real user booking information

Use synthetic data.

Create a local dataset containing enough information to make the prototype feel realistic.

At minimum include:

## Stations

Around 20–30 major Indian railway stations.

Example:

* New Delhi
* Old Delhi
* Hazrat Nizamuddin
* Mumbai Central
* Dadar
* Bandra Terminus
* Ahmedabad
* Surat
* Vadodara
* Jaipur
* Kota
* Bhopal
* Nagpur
* Hyderabad
* Bengaluru
* Chennai
* Pune
* Goa / Madgaon
* Ernakulam
* Varanasi

You can add more where useful.

---

# 25. SYNTHETIC TRAIN DATA

Create approximately 50–100 synthetic train records.

Each train should have:

* Train number
* Train name
* Origin
* Destination
* Intermediate stations
* Departure times
* Arrival times
* Approximate fare
* Classes
* Synthetic historical delay percentage
* Station/platform information
* Operating days

Clearly label all of this as:

> **Prototype data**

or:

> **Synthetic railway data — not live availability**

Do not imply that the data represents actual current railway schedules.

---

# 26. SYNTHETIC DELAY DATA

Include synthetic historical reliability values.

Example:

```text
Train A
On-time: 84%
Average delay: 18 min

Train B
On-time: 61%
Average delay: 47 min
```

Use this to calculate connection risk.

Again, label it clearly:

> Synthetic reliability data for prototype demonstration.

---

# 27. ROUTING ENGINE

Treat the railway network as a graph.

Conceptually:

```text
Station = Node
Train segment = Edge
Interchange = Transfer edge
```

Generate candidate journeys:

```text
Origin
 ↓
Possible direct trains
 ↓
Possible first-leg trains
 ↓
Candidate interchange stations
 ↓
Compatible second-leg trains
 ↓
Validate connection
 ↓
Calculate risk
 ↓
Rank journeys
```

The algorithm should reject impossible connections.

For example:

If:

```text
Train A arrives 10:00
Station transfer = 20 min
Train B departs 10:15
```

Then:

```text
15 min < 20 min
```

Connection should be:

**INVALID**

If:

```text
Train A arrives 10:00
Transfer = 20 min
Buffer = 75 min
```

Then:

**VALID**

---

# 28. CONNECTION VALIDATION

Connection time must not simply be:

```text
departure2 - arrival1
```

Instead:

```text
usable_buffer =
    departure2
  - arrival1
  - minimum_transfer_time
```

Then classify:

### LOW RISK

Large buffer above required transfer time.

### MODERATE

Small additional buffer.

### HIGH RISK

Very little recovery time.

### INVALID

Insufficient time to physically make the transfer.

---

# 29. DIFFERENT STATION HANDLING

This is a major product feature.

Do not assume all stations in the same city are interchangeable.

For example:

```text
Mumbai Central
Dadar
Bandra Terminus
```

should be represented as separate stations.

If a connection requires moving between them:

```text
Rail arrival
 ↓
Station transfer
 ↓
Rail departure
```

Include:

* Estimated transfer time
* Transfer mode
* Additional risk

Example:

> ⚠️ You'll need to travel from Mumbai Central to Dadar before your next train.

This should reduce the journey's safety score.

---

# 30. JOURNEY SCORING

Create a transparent internal scoring model.

For every journey calculate:

```text
total_duration
total_cost
number_of_transfers
minimum_connection_buffer
station_transfer_count
delay_risk
```

Then produce:

```text
safety_score
speed_score
cost_score
overall_score
```

Do not show raw scores unless useful.

Translate them into human language:

* Very safe
* Low risk
* Moderate
* Tight connection
* Not recommended

---

# 31. ACCESSIBILITY

The product must work for real Indian users.

Requirements:

* Large touch targets
* Clear typography
* High contrast
* Avoid tiny text
* Avoid relying only on color
* Use icons + text for status
* Simple language
* Avoid unexplained railway abbreviations
* Responsive mobile layout
* Keyboard accessibility
* Visible focus states
* Proper semantic HTML
* Accessible labels
* Good screen-reader structure

Example:

Do NOT only show:

🟢

Show:

🟢 **Low risk**

Do NOT rely on:

`2A / 3A / SL`

without explanation.

If shown:

> **3A — AC 3-tier**

---

# 32. SLOW CONNECTION / LOW BANDWIDTH DESIGN

The product should remain useful on slow networks.

Therefore:

* Avoid giant images
* Avoid unnecessary animation
* Optimize JavaScript
* Use lightweight assets
* Avoid video backgrounds
* Avoid heavy map libraries unless absolutely necessary
* Use CSS for simple visual elements
* Minimize external dependencies
* Prefer server/local synthetic data

The core journey should load quickly.

---

# 33. MOBILE-FIRST DESIGN

The primary experience should be designed for mobile first.

The desktop interface should be a responsive enhancement.

Mobile result card:

```text
BEST FOR YOU

New Delhi
10:55 AM
   ↓
Mumbai Central
6:55 AM

2h 35m change

Mumbai Central
9:30 AM
   ↓
Madgaon
5:20 PM

31h 25m
₹2,845
🟢 Low risk

[ View journey ]
```

Avoid desktop-style dense tables on mobile.

---

# 34. VISUAL DESIGN

The visual identity should feel:

* Calm
* Trustworthy
* Modern
* Public-service oriented
* Indian
* Human
* Minimal

Do NOT make it look like:

* A flashy fintech app
* A luxury travel startup
* A generic AI SaaS dashboard
* A government portal from 2012
* A copy of IRCTC
* A copy of Ixigo

Use a restrained visual language.

Potential design direction:

* Warm off-white background
* Dark text
* One strong accent color
* Large readable typography
* Rounded but not excessively bubbly components
* Clear cards
* Timeline-based journeys
* Simple icons
* Subtle status colors

Do not over-animate.

Animation should communicate state changes only.

---

# 35. NAVIGATION

Keep navigation minimal.

Potential top navigation:

**Raasta**

* Plan journey
* Saved journeys
* How it works

No large navigation menu.

If no account exists, do not force login.

---

# 36. SAVED JOURNEY

Allow users to save a journey locally.

Use localStorage or equivalent.

Do not create real authentication.

Example:

> **Saved journeys**

### Delhi → Goa

30 August

2 trains · 1 interchange

[ Open journey ]

This makes the prototype feel complete without introducing unnecessary backend complexity.

---

# 37. MOCK BOOKING HANDOFF

Do not build actual booking.

At the end:

> **Ready to book?**

Then:

> Raasta has planned your journey. Ticket booking would happen through the appropriate railway booking service.

Button:

> **Continue to booking**

For the prototype, this can lead to an explanatory screen.

Clearly mark:

> **Booking is mocked in this prototype. No real payment or railway transaction occurs.**

Do not pretend to perform a real booking.

---

# 38. HONESTY / DISCLOSURE

Create a subtle but accessible:

### Prototype information

Use a footer or information panel:

> Raasta is an independent prototype and is not an official Indian Railways or government product.
>
> Train schedules, fares, delay information and availability shown in this prototype are synthetic and used only for demonstration.
>
> No real passenger information, payment details, OTPs or government systems are used.

This is required for trust and aligns with the hackathon rules.

Do NOT use government logos in a way that implies partnership.

---

# 39. DO NOT USE

Do not use:

* Indian Railways logo
* IRCTC branding that suggests official partnership
* Aadhaar
* PAN
* Real OTPs
* Real payment details
* Real user accounts
* Scraped passenger data
* Private APIs
* Undocumented railway APIs
* Real booking transactions

Use neutral branding.

---

# 40. BACKEND ARCHITECTURE

Use a clean architecture that could scale.

Recommended conceptual structure:

```text
Frontend
    ↓
Journey API
    ↓
Journey Service
    ↓
 ┌───────────────┐
 │ Railway Data  │
 │ Station Data  │
 │ Delay Data    │
 └───────────────┘
    ↓
Routing Engine
    ↓
Connection Risk Engine
    ↓
Journey Ranking
    ↓
Structured Journey
    ↓
AI Explanation Layer
```

Keep the implementation simple enough to finish today.

---

# 41. RECOMMENDED TECH STACK

Use the existing project stack if one already exists.

If starting from scratch, prefer:

* Next.js
* TypeScript
* React
* Tailwind CSS
* Local synthetic JSON or SQLite/Postgres if necessary
* Simple API routes/server actions
* OpenAI API for journey explanations

Avoid unnecessary infrastructure.

The goal is a polished working prototype, not a production enterprise architecture.

---

# 42. COMPONENT ARCHITECTURE

Create reusable components.

Suggested:

```text
/components
  JourneySearch
  DateSelector
  PreferenceSelector
  JourneyCard
  JourneyTimeline
  TrainLeg
  TransferCard
  RiskBadge
  WhyRecommended
  JourneySummary
  JourneyMode
  DelayAlert
  RecoveryOption
  LastMileCard
  PrototypeDisclosure
  SimpleExplanation
```

Keep logic separate from UI.

---

# 43. DATA MODELS

Create types similar to:

```typescript
type Station = {
  id: string
  name: string
  city: string
  transferComplexity: "low" | "medium" | "high"
}

type Train = {
  id: string
  number: string
  name: string
  stops: Stop[]
  estimatedFare: number
  reliability: number
}

type Stop = {
  stationId: string
  arrival: string
  departure: string
}

type Transfer = {
  stationId: string
  durationMinutes: number
  requiredWalkingMinutes: number
  requiresStationChange: boolean
  stationChange?: StationChange
}

type JourneyLeg = {
  type: "train" | "transfer"
  train?: Train
  transfer?: Transfer
}

type Journey = {
  origin: Station
  destination: Station
  legs: JourneyLeg[]
  totalDurationMinutes: number
  estimatedCost: number
  riskLevel: "low" | "medium" | "high"
  safetyScore: number
  reasons: string[]
}
```

Adapt these models to the actual implementation.

---

# 44. DEMO DATA

Create a few carefully designed scenarios.

## Scenario A — PRIMARY

Delhi → Goa

2 trains

1 interchange

Safe recommended route

This is the main demo.

## Scenario B — RISKY

Delhi → Goa

Fast route

Very tight connection

Use to demonstrate why Raasta does not blindly recommend the fastest option.

## Scenario C — DIFFERENT STATIONS

A journey requiring:

Mumbai Central → Dadar

Use to demonstrate station-transfer awareness.

## Scenario D — DELAY RECOVERY

Same Delhi → Goa journey

First train delayed

Show recovery recommendations.

The reviewer should be able to encounter these naturally.

---

# 45. THE DEMO SHOULD FEEL LIKE A REAL PRODUCT

The reviewer must not need to know:

* Which buttons are fake
* Which API is mocked
* How the data is generated

The experience should simply work.

Do not expose developer controls by default.

If demo controls are needed, place them discreetly in a:

> Prototype controls

section accessible to the presenter.

For example:

```text
Prototype controls

[ Simulate 70 min delay ]
[ Reset journey ]
```

Do not make the reviewer feel like they are using a developer dashboard.

---

# 46. ERROR STATES

Build realistic error states.

Examples:

### No journey found

> We couldn't find a practical connection for this date.

Then:

> Try:
>
> * A different date
> * A longer connection window

### Unsafe journey

> We found a route, but we don't recommend it.

Explain why.

### Invalid station transfer

> The connection is too short to safely move between stations.

### AI unavailable

Fallback to deterministic explanation.

Never let an API failure break the core demo.

---

# 47. EMPTY STATES

Create polished empty states.

Example:

> **No saved journeys yet**
>
> Plan a journey and save it here for later.

---

# 48. PERFORMANCE

The first meaningful content should appear quickly.

Optimize for:

* Mobile
* Chrome
* Slower network
* Low-end devices

Do not load unnecessary libraries.

---

# 49. PRODUCT EXTENSION — PUBLIC JOURNEY LAYER

The long-term vision should be visible but not overwhelm the MVP.

The idea:

```text
Today:
Railway journey planning

Future:
Railway
+
Metro
+
Bus
+
Last-mile mobility
```

A future journey could become:

```text
Home
 ↓
Metro
 ↓
Railway station
 ↓
Train
 ↓
Interchange
 ↓
Train
 ↓
Bus
 ↓
Destination
```

The citizen still sees:

> **Delhi → Goa**

The system handles the complexity.

---

# 50. MOBILITY INTEGRATION CONCEPT

Create a mock integration section after the final station:

> **Continue your journey**

Cards:

### Ride

> Connect to a mobility provider.

### Local transport

> Find nearby public transport.

### Navigate

> Continue to your destination.

Do not use real third-party APIs.

Do not claim integration exists.

Label:

> **Future integration concept**

This demonstrates platform thinking.

---

# 51. “WHY NOT JUST IXIGO?” — PRODUCT POSITIONING

The product must not position itself as:

> “We are better than Ixigo.”

Instead:

> **Travel marketplaces optimize discovery and booking. Raasta optimizes journey completion.**

The difference:

Traditional:

```text
Find train
↓
Choose train
↓
Book
```

Raasta:

```text
Tell us destination
↓
Construct journey
↓
Validate connection
↓
Explain risk
↓
Guide passenger
↓
Recover if disrupted
↓
Complete journey
```

The product owns the **journey**, not the transaction.

---

# 52. WHY THIS IS A PUBLIC-SERVICE PRODUCT

The product philosophy must remain:

> A citizen should not need to understand how the backend railway network works.

The railway system can be complex.

The citizen interface should not be.

The system should translate:

```text
Complex railway network
        ↓
Journey engine
        ↓
Simple citizen instructions
```

This is the heart of the product.

---

# 53. ACCESSIBILITY / SIMPLE LANGUAGE EXAMPLES

Replace:

> Minimum Connection Time

with:

> **Time you'll have to change trains**

Replace:

> Historical On-Time Percentage

with:

> **How often this train is on time**

Replace:

> Intermodal Transfer

with:

> **Change transport**

Replace:

> Station Transfer

with:

> **You'll need to travel to another station**

Replace:

> Risk Score: 82

with:

> 🟢 **Comfortable connection**

The UI should explain itself.

---

# 54. DO NOT OVERBUILD

This is extremely important.

Do NOT build:

* Hotel booking
* Flight search
* Food ordering
* Loyalty program
* Travel marketplace
* Social features
* Reviews
* Chatbot homepage
* Complex account system
* Payment system
* Real ticket booking
* Live IRCTC scraping
* Live PNR system
* Full railway management system

If a feature doesn't directly improve the core citizen journey, do not build it.

---

# 55. PRIORITY ORDER

Build in this exact order.

## P0 — MUST WORK

1. Landing/search
2. Origin/destination
3. Date
4. Journey generation
5. Journey results
6. Safest/fastest/cheapest
7. Journey details
8. Interchange explanation
9. Risk indicator
10. Journey timeline
11. Delay simulation
12. Recovery recommendation
13. Mobile responsive UI

## P1 — HIGH VALUE

14. AI journey explanation
15. Saved journeys
16. Station-transfer intelligence
17. Last-mile extension
18. Prototype disclosure
19. Error states
20. Accessibility improvements

## P2 — ONLY IF TIME REMAINS

21. More routes
22. More synthetic stations
23. More personalization
24. Better animation
25. More journey scenarios

Do not work on P2 until P0 is polished.

---

# 56. HACKATHON JUDGING OPTIMIZATION

The final build should clearly satisfy each judging criterion.

## PROBLEM

Make the problem obvious:

> Multi-train journeys force citizens to manually plan connections.

## WORKING BUILD

The reviewer can:

Search → choose → understand → start → experience delay → recover.

## USABILITY

Minimal interface.

Simple language.

Progressive disclosure.

Mobile-first.

## PRODUCT THINKING

Explain:

* Why route is recommended
* Why risk changes
* Why fastest isn't always best
* Why station transfers matter

## END-TO-END THINKING

Show:

* Railway data
* Routing engine
* Risk engine
* Journey object
* AI explanation
* Future mobility integration

## HONESTY

Clearly identify:

* Synthetic train data
* Mock availability
* Mock booking
* Mock delay data
* Future integrations

Never pretend these are live.

---

# 57. LANDING PAGE STORY

The landing page should communicate the product philosophy.

Potential copy:

## Where are you going?

### Don't search for trains. Plan your journey.

Tell us your destination and we'll build the simplest practical railway journey for you — including connections, transfer time and what to do if something changes.

CTA:

> **Plan my journey**

Small disclosure:

> Independent prototype · Uses synthetic railway data

---

# 58. VISUAL STORY OF THE JOURNEY

Use a vertical journey timeline throughout the application.

The timeline is the visual identity.

Example:

```text
● NEW DELHI
│  10:55 AM
│
│  🚆 Train 1
│
● MUMBAI CENTRAL
│  6:55 AM
│
├── 🔄 CHANGE TRAINS
│   2h 35m
│   🟢 Comfortable
│
● MUMBAI CENTRAL
│  9:30 AM
│
│  🚆 Train 2
│
● MADGAON
│  5:20 PM
│
🏁 GOA
```

Make this beautiful and easy to understand.

---

# 59. MICROCOPY

Use human language.

Good:

> **You have 2h 35m to change trains.**

Bad:

> Connection window: 155 minutes.

Good:

> **You won't need to leave the station.**

Bad:

> Same-station transfer detected.

Good:

> **Your connection is at risk.**

Bad:

> Risk threshold exceeded.

Good:

> **We recommend waiting for the later train.**

Bad:

> Alternative route score: 87.

---

# 60. FINAL PRESENTATION MODE

Add an optional clean presentation mode if useful.

The presenter should be able to quickly demonstrate:

1. Search Delhi → Goa
2. Show 3 journeys
3. Select safest
4. Show interchange
5. Start journey
6. Trigger delay
7. Show recovery
8. Explain future mobility integration

The complete interactive demo should be possible in approximately 60–90 seconds.

---

# 61. TWO-MINUTE VIDEO STRATEGY

The final product should be optimized around the hackathon's two-minute submission video.

## FIRST MINUTE — CITIZEN DEMO

### 0:00–0:10

Problem:

> “I want to travel from Delhi to Goa, but the journey requires multiple trains. Today I have to manually figure out whether those trains actually connect.”

### 0:10–0:25

Enter:

Delhi → Goa

Show:

3 journey options.

### 0:25–0:40

Select:

**Safest journey**

Show:

2 trains

1 interchange

2h 35m buffer

### 0:40–0:50

Show:

> Why we recommend this

### 0:50–1:00

Trigger:

> Train delayed

Show:

> Connection at risk

Then:

> Recommended recovery

---

# 62. SECOND MINUTE — TECHNICAL STORY

Explain:

> “Raasta treats the railway network as a graph and constructs complete journeys instead of returning individual trains.”

Then show:

```text
Synthetic railway data
        ↓
Journey engine
        ↓
Connection risk
        ↓
Journey ranking
        ↓
Simple citizen experience
```

Then:

> “OpenAI is used as an explanation layer, converting structured journey information into simple language without allowing the model to invent railway facts.”

Then:

> “The prototype uses synthetic railway data and does not access live IRCTC systems, payments, OTPs or personal information.”

Finish with:

> **“Indian Railways gives us a network of trains. Raasta turns it into a journey people can understand.”**

---

# 63. DEMO SCRIPT MUST BE SUPPORTED BY THE PRODUCT

The UI must make this demo effortless.

Provide:

* Sample journey
* Fast loading
* Predictable synthetic data
* Delay simulation
* Reset button
* No login
* No external dependencies
* No broken links
* No required API keys for core functionality

The demo should still work if the AI API is temporarily unavailable.

---

# 64. README

Create a strong README.

Include:

## What is Raasta?

Short explanation.

## Problem

Multi-train journey planning.

## Solution

Journey-level planning.

## Key features

* Journey construction
* Risk-aware connections
* Station transfer detection
* Progressive journey guidance
* Delay recovery
* AI explanation

## Architecture

Include a simple diagram.

## Data

Clearly state:

> Synthetic data only.

## OpenAI usage

Explain exactly where OpenAI is used.

## Safety

Explain:

* No live government systems
* No personal data
* No payment data
* No undocumented APIs

## Future

Explain:

* Public journey API
* Mobility integrations
* Metro/bus expansion

---

# 65. CODE QUALITY

Do not hack everything into one component.

Use:

* Clear TypeScript types
* Reusable components
* Separate data
* Separate routing logic
* Separate scoring logic
* Separate AI explanation logic
* Environment variables for API keys
* Error handling
* Loading states

Do not commit secrets.

Do not expose OpenAI API keys to the browser.

---

# 66. SECURITY

Never expose API keys in client-side code.

Use:

```text
OPENAI_API_KEY
```

server-side only.

If no API key is available:

Use a deterministic fallback explanation.

Do not make the application unusable because of AI.

---

# 67. FINAL QUALITY BAR

Before declaring the build complete, manually test:

### Search

* Delhi → Goa works
* Date selection works
* Preferences work

### Results

* Safest works
* Fastest works
* Cheapest works

### Journey

* Timeline works
* Train details work
* Transfer information works

### Risk

* Risk labels are correct
* Explanations are understandable

### Delay

* Simulation works
* Connection status updates
* Recovery options appear

### AI

* Explanation works
* AI cannot invent data
* Fallback works

### Mobile

* Search works
* Cards fit
* Timeline works
* Buttons are easy to tap

### Accessibility

* Keyboard navigation
* Focus states
* Screen-reader labels
* Color-independent status

### Honesty

* Synthetic data disclosure visible
* No government affiliation implied

### Deployment

* Production build succeeds
* No console-breaking errors
* No missing assets
* No broken routes
* No exposed secrets

---

# 68. DEFINITION OF DONE

The project is DONE only when a new reviewer can open the public URL and independently do this:

```text
Open Raasta
    ↓
Understand what it does
    ↓
Enter Delhi → Goa
    ↓
Select a preference
    ↓
See recommended journeys
    ↓
Understand why one is recommended
    ↓
Open the journey
    ↓
Understand the interchange
    ↓
Start the journey
    ↓
See next action
    ↓
Experience a simulated delay
    ↓
Understand the problem
    ↓
Choose a recovery option
    ↓
Complete the journey
```

If any of those steps require developer explanation, fix the UX.

---

# 69. IMPORTANT PRODUCT DECISION

Do NOT expand the MVP into a giant travel platform.

The product's power comes from focus.

The story is:

> **A citizen has a destination.**
>
> **The railway system has a network.**
>
> **Raasta bridges the two.**

Everything must support this.

---

# 70. FINAL PRODUCT POSITIONING

The final product should be understood in one sentence:

> **Raasta is a simple journey layer for Indian Railways that turns complicated multi-train travel into one clear, risk-aware plan.**

The deeper vision:

> **Citizens shouldn't have to understand the transport network to use it.**

The long-term platform vision:

> **One journey layer that can connect rail, metro, bus and last-mile mobility without forcing citizens to navigate each system separately.**

Build the core exceptionally well first.

Do not sacrifice the main citizen journey for future features.

---

# 71. START BUILDING NOW

Before writing significant code:

1. Inspect the existing repository.
2. Identify the current framework and structure.
3. Reuse existing infrastructure where appropriate.
4. Do not unnecessarily rewrite the project.
5. Create a concise implementation plan.
6. Build P0 features first.
7. Run the application.
8. Test the full citizen journey.
9. Fix UX issues.
10. Only then add P1 features.
11. Continuously keep the hackathon judging criteria in mind.

Do not stop at a static mockup.

Do not merely create screenshots.

Build real interactions.

The final result should feel like a **small, extremely polished public-service product**, not a collection of hackathon screens.

The guiding principle throughout implementation is:

# **PLAN THE JOURNEY, NOT THE TRAIN.**

