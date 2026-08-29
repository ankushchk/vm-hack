import { NextRequest, NextResponse } from "next/server";
import { processVoiceQuery, transcribeWithSarvam } from "@/lib/sarvam";
import { formatDuration } from "@/lib/engine";

export const dynamic = "force-dynamic";

/**
 * Helper to generate TwiML XML response for Twilio WhatsApp
 */
function createTwiMLResponse(messageText: string): NextResponse {
  const safeText = messageText
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
    <Body>${safeText}</Body>
  </Message>
</Response>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
    },
  });
}

/**
 * Format a full journey as a rich WhatsApp message
 */
function formatJourneyMessage(result: Awaited<ReturnType<typeof processVoiceQuery>>, isVoice: boolean): string {
  const best = result.journeys[0];

  let reply = `🚆 *RAASTA JOURNEY PLANNER*\n`;
  if (isVoice) {
    reply += `🎙️ _Voice note processed successfully._\n`;
  }
  reply += `━━━━━━━━━━━━━━━━━━━\n`;
  reply += `${result.responseText}\n\n`;

  if (best) {
    const isDirect = best.interchangeCount === 0;
    const legs = best.legs.filter((l) => l.type === "train") as any[];
    const transfer = (best.legs.find((l) => l.type === "transfer") as any)?.transfer;

    reply += `📍 *Route:* ${best.origin.name} (${best.origin.code}) ➔ ${best.destination.name} (${best.destination.code})\n`;
    reply += `📅 *Date:* ${result.extracted.date}\n`;
    reply += `⏱️ *Total Time:* ${formatDuration(best.totalDurationMinutes)}\n`;
    reply += `💰 *Fare (AC 3T):* ₹${best.totalCost.toLocaleString("en-IN")}\n`;
    reply += `🛡️ *Safety:* ${isDirect ? "✅ Direct Train (Zero Risk)" : `${best.riskLevel.toUpperCase()} risk (Score: ${best.safetyScore}/100)`}\n\n`;

    reply += `*🚂 Train Details:*\n`;
    legs.forEach((l: any, idx: number) => {
      reply += `\n*${idx + 1}. ${l.train.number} ${l.train.name}*\n`;
      reply += `   🟢 Dep: ${l.departure} from ${l.from.name} (${l.from.code})\n`;
      reply += `   🔴 Arr: ${l.arrival} at ${l.to.name} (${l.to.code})\n`;
      reply += `   ⏱️ Duration: ${formatDuration(l.train.durationMinutes)}\n`;
      reply += `   📊 Reliability: ${l.train.reliability}% (avg delay: ${l.train.avgDelay}min)\n`;
    });

    if (transfer) {
      reply += `\n🔄 *Connection at ${transfer.fromStationId}:*\n`;
      reply += `   Buffer: ${formatDuration(transfer.durationMinutes)}\n`;
      reply += `   ${transfer.requiresStationChange ? "⚠️ Requires station change" : "✅ Same station"}\n`;
      reply += `   _${transfer.reason}_\n`;
    }

    // Show all journey options if multiple exist
    if (result.journeys.length > 1) {
      reply += `\n─────────────────\n`;
      reply += `📋 *${result.journeys.length - 1} more option(s) found.*\n`;
      result.journeys.slice(1, 3).forEach((j, idx) => {
        const jLegs = j.legs.filter((l) => l.type === "train") as any[];
        const trainNames = jLegs.map((l: any) => l.train.name).join(" → ");
        reply += `${idx + 2}. ${trainNames} | ${formatDuration(j.totalDurationMinutes)} | ₹${j.totalCost.toLocaleString("en-IN")} | ${j.interchangeCount === 0 ? "Direct" : `${j.interchangeCount} change`}\n`;
      });
    }
  }

  reply += `\n━━━━━━━━━━━━━━━━━━━\n`;
  reply += `💡 _Reply with any route like:_\n`;
  reply += `_"Mumbai to Goa tomorrow"_\n`;
  reply += `_"Kolkata se Chennai kal"_\n`;
  reply += `_Or send a voice note!_ 🎤`;

  return reply;
}

/**
 * Show welcome / help message
 */
function getWelcomeMessage(): string {
  return `🚆 *RAASTA — JOURNEY PLANNER*
━━━━━━━━━━━━━━━━━━━

नमस्ते! 🙏 I'm Raasta Bot — your Indian Railways journey assistant.

*How to use:*
📝 Send a text message with your route:
   _"Delhi to Mumbai tomorrow"_
   _"Kolkata se Varanasi kal"_
   _"Chennai to Bangalore parso"_

🎤 Or send a *voice note* in Hindi, English, Hinglish, Tamil, or Marathi!

*I will find you:*
✅ Direct trains + connecting trains
🛡️ Safety-validated connections
⏱️ Layover buffers at junctions
💰 AC 3-Tier fare estimates
📊 Train reliability scores

*Commands:*
• Send any route query → Get journey plan
• Type *"help"* → Show this menu
• Type *"routes"* → See popular routes

━━━━━━━━━━━━━━━━━━━
_Powered by Sarvam AI 🇮🇳_`;
}

/**
 * Show popular routes
 */
function getPopularRoutes(): string {
  return `🗺️ *POPULAR ROUTES*
━━━━━━━━━━━━━━━━━━━

Try any of these routes:

1️⃣ *Delhi ↔ Mumbai* (Rajdhani / Duronto)
2️⃣ *Delhi ↔ Goa* (via Bhopal connection)
3️⃣ *Delhi ↔ Kolkata* (Rajdhani / Purushottam)
4️⃣ *Mumbai ↔ Goa* (Konkan Railway)
5️⃣ *Delhi ↔ Chennai* (Tamil Nadu Express)
6️⃣ *Delhi ↔ Bangalore* (Rajdhani)
7️⃣ *Chennai ↔ Bangalore* (Shatabdi)
8️⃣ *Bangalore ↔ Hyderabad*
9️⃣ *Delhi ↔ Jaipur* (Shatabdi)
🔟 *Delhi ↔ Ahmedabad*

*How to ask:*
_"Delhi to Goa kal"_
_"Mumbai se Chennai tomorrow"_
_"Kolkata to Varanasi parso"_

━━━━━━━━━━━━━━━━━━━
_Just type your route or send a voice note!_ 🎤`;
}

/**
 * Handle incoming Webhook from Twilio WhatsApp
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let userText = "";
    let mediaUrl = "";
    let mediaContentType = "";
    let fromNumber = "";
    let isVoice = false;

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      userText = (formData.get("Body") as string) || "";
      mediaUrl = (formData.get("MediaUrl0") as string) || "";
      mediaContentType = (formData.get("MediaContentType0") as string) || "audio/ogg";
      fromNumber = (formData.get("From") as string) || "";
    } else {
      const body = await req.json().catch(() => ({}));
      userText = body.Body || body.text || body.prompt || "";
      mediaUrl = body.MediaUrl0 || body.mediaUrl || "";
      fromNumber = body.From || body.from || "";
    }

    // 1. If user sent a voice note, transcribe with Sarvam AI
    if (mediaUrl) {
      isVoice = true;
      try {
        const fetchHeaders: HeadersInit = {};
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (accountSid && authToken) {
          fetchHeaders["Authorization"] = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
        }

        const audioRes = await fetch(mediaUrl, { headers: fetchHeaders });
        if (audioRes.ok) {
          const audioBuffer = await audioRes.arrayBuffer();
          const stt = await transcribeWithSarvam(audioBuffer, mediaContentType, "unknown");
          if (stt.text) {
            userText = stt.text;
          }
        }
      } catch (voiceErr) {
        console.error("Error downloading/transcribing Twilio voice note:", voiceErr);
      }
    }

    const trimmed = userText.trim().toLowerCase();

    // 2. Handle special commands
    if (!trimmed || trimmed === "hi" || trimmed === "hello" || trimmed === "hey" || trimmed === "help" ||
        trimmed === "start" || trimmed === "menu" || trimmed === "namaste" || trimmed === "namaskar" ||
        trimmed === "नमस्ते" || trimmed === "हेलो") {
      return createTwiMLResponse(getWelcomeMessage());
    }

    if (trimmed === "routes" || trimmed === "popular" || trimmed === "popular routes" || trimmed === "options") {
      return createTwiMLResponse(getPopularRoutes());
    }

    // 3. Process route query with Sarvam AI NLP + Raasta Engine
    const result = await processVoiceQuery(userText);

    // If extraction failed (no stations found), send helpful message
    if (!result.extracted.from || !result.extracted.to) {
      return createTwiMLResponse(result.responseText);
    }

    // 4. Format and send journey response
    const reply = formatJourneyMessage(result, isVoice);
    return createTwiMLResponse(reply);

  } catch (error: any) {
    console.error("Twilio WhatsApp Webhook Error:", error);
    return createTwiMLResponse(
      "⚠️ Sorry, we hit an error. Please try again with a clear route:\n\n_\"Delhi to Mumbai tomorrow\"_\n_\"Kolkata se Goa kal\"_"
    );
  }
}

// GET handler for browser testing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const testQuery = searchParams.get("query");

  if (!testQuery) {
    return NextResponse.json({
      status: "✅ Raasta WhatsApp Bot Active",
      usage: "Add ?query=Delhi+to+Mumbai+tomorrow to test",
      features: [
        "Natural language route parsing (Hindi, Hinglish, Tamil, English)",
        "Voice note transcription via Sarvam AI",
        "Direct & connecting train recommendations",
        "Safety-scored connections with layover buffers",
        "Special commands: help, routes",
      ],
    });
  }

  const result = await processVoiceQuery(testQuery);
  return NextResponse.json({
    status: "Raasta WhatsApp Bot Active",
    testQuery,
    extracted: result.extracted,
    responseText: result.responseText,
    journeyCount: result.journeys.length,
    bestJourney: result.journeys[0] ? {
      route: `${result.journeys[0].origin.name} → ${result.journeys[0].destination.name}`,
      duration: formatDuration(result.journeys[0].totalDurationMinutes),
      fare: `₹${result.journeys[0].totalCost}`,
      interchanges: result.journeys[0].interchangeCount,
      risk: result.journeys[0].riskLevel,
    } : null,
  });
}
