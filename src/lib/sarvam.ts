import { searchStations, getStation, getStationByName } from "@/data/stations";
import { findJourneys, formatDuration } from "@/lib/engine";
import { Journey } from "@/lib/types";

export interface VoiceQueryResponse {
  transcription: string;
  detectedLanguage: string;
  extracted: {
    from: string;
    fromCode: string;
    to: string;
    toCode: string;
    date: string;
    pref: "easy" | "fastest" | "cheapest";
  };
  responseText: string;
  responseAudioBase64?: string;
  journeys: Journey[];
}

/**
 * Parses relative dates from natural language (Hindi, Hinglish, English)
 */
function parseSpokenDate(text: string): string {
  const lower = text.toLowerCase();
  const today = new Date();

  // Day-of-week matching (English)
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < dayNames.length; i++) {
    if (lower.includes(dayNames[i]) || lower.includes(`next ${dayNames[i]}`)) {
      const currentDay = today.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      today.setDate(today.getDate() + diff);
      return today.toISOString().slice(0, 10);
    }
  }

  // Hindi day-of-week
  const hindiDays: Record<string, number> = {
    "somvaar": 1, "somvar": 1, "सोमवार": 1,
    "mangalvaar": 2, "mangalvar": 2, "मंगलवार": 2,
    "budhvaar": 3, "budhvar": 3, "बुधवार": 3,
    "guruvaar": 4, "guruvar": 4, "गुरुवार": 4,
    "shukravaar": 5, "shukravar": 5, "शुक्रवार": 5,
    "shanivaar": 6, "shanivar": 6, "शनिवार": 6,
    "ravivaar": 0, "ravivar": 0, "रविवार": 0,
  };
  for (const [word, dayIdx] of Object.entries(hindiDays)) {
    if (lower.includes(word)) {
      const currentDay = today.getDay();
      let diff = dayIdx - currentDay;
      if (diff <= 0) diff += 7;
      today.setDate(today.getDate() + diff);
      return today.toISOString().slice(0, 10);
    }
  }

  if (lower.includes("parso") || lower.includes("day after tomorrow") || lower.includes("পরশু")) {
    today.setDate(today.getDate() + 2);
  } else if (lower.includes("kal") || lower.includes("tomorrow") || lower.includes("কাল") || lower.includes("நாளை") || lower.includes("उद्या")) {
    today.setDate(today.getDate() + 1);
  } else if (lower.includes("aaj") || lower.includes("today") || lower.includes("आज") || lower.includes("இன்று")) {
    // today — no change
  } else {
    // Default to tomorrow for railway queries
    today.setDate(today.getDate() + 1);
  }

  return today.toISOString().slice(0, 10);
}

/**
 * Comprehensive city/station alias mapping for Indian railways.
 * Maps spoken/colloquial names → canonical station names used in our data.
 */
const CITY_ALIASES: Record<string, string> = {
  // Delhi
  delhi: "New Delhi", dilli: "New Delhi", ndls: "New Delhi", "new delhi": "New Delhi",
  "नई दिल्ली": "New Delhi", "दिल्ली": "New Delhi",
  // Mumbai
  mumbai: "Mumbai Central", bombay: "Mumbai Central", bombai: "Mumbai Central",
  mmct: "Mumbai Central", "मुंबई": "Mumbai Central", "बॉम्बे": "Mumbai Central",
  "bandra": "Bandra Terminus", bdts: "Bandra Terminus",
  "dadar": "Dadar", ddr: "Dadar",
  "cst": "Mumbai CSMT", csmt: "Mumbai CSMT", "vt": "Mumbai CSMT",
  // Goa
  goa: "Madgaon", madgaon: "Madgaon", mao: "Madgaon",
  "गोवा": "Madgaon", "मडगांव": "Madgaon",
  // Chennai
  chennai: "Chennai Central", madras: "Chennai Central", mas: "Chennai Central",
  "चेन्नई": "Chennai Central", "மதராஸ்": "Chennai Central", "சென்னை": "Chennai Central",
  // Kolkata
  kolkata: "Howrah Junction", calcutta: "Howrah Junction",
  howrah: "Howrah Junction", hwh: "Howrah Junction",
  "कोलकाता": "Howrah Junction", "हावड़ा": "Howrah Junction", "কলকাতা": "Howrah Junction",
  // Bangalore
  bengaluru: "Bangalore City", bangalore: "Bangalore City", sbc: "Bangalore City",
  "बैंगलोर": "Bangalore City", "बेंगलुरु": "Bangalore City", "பெங்களூர்": "Bangalore City",
  // Pune
  pune: "Pune Junction", "पुणे": "Pune Junction",
  // Bhopal
  bhopal: "Bhopal Junction", bpl: "Bhopal Junction", "भोपाल": "Bhopal Junction",
  // Jaipur
  jaipur: "Jaipur Junction", jp: "Jaipur Junction", "जयपुर": "Jaipur Junction",
  // Varanasi
  varanasi: "Varanasi Junction", banaras: "Varanasi Junction", kashi: "Varanasi Junction",
  bsb: "Varanasi Junction", "वाराणसी": "Varanasi Junction", "बनारस": "Varanasi Junction", "काशी": "Varanasi Junction",
  // Patna
  patna: "Patna Junction", "पटना": "Patna Junction",
  // Lucknow
  lucknow: "Lucknow Charbagh", "लखनऊ": "Lucknow Charbagh",
  // Ahmedabad
  ahmedabad: "Ahmedabad Junction", adi: "Ahmedabad Junction", "अहमदाबाद": "Ahmedabad Junction",
  // Hyderabad
  hyderabad: "Hyderabad Deccan", hyb: "Hyderabad Deccan", "हैदराबाद": "Hyderabad Deccan",
  // Chandigarh
  chandigarh: "Chandigarh Junction", cdg: "Chandigarh Junction", "चंडीगढ़": "Chandigarh Junction",
  // Amritsar
  amritsar: "Amritsar Junction", asr: "Amritsar Junction", "अमृतसर": "Amritsar Junction",
  // Agra
  agra: "Agra Cantt", "आगरा": "Agra Cantt",
  // Kota
  kota: "Kota Junction", "कोटा": "Kota Junction",
  // Guwahati
  guwahati: "Guwahati", ghy: "Guwahati", "गुवाहाटी": "Guwahati",
  // Puri
  puri: "Puri", "पुरी": "Puri",
  // Surat
  surat: "Surat", st: "Surat", "सूरत": "Surat",
  // Nagpur
  nagpur: "Nagpur Junction", ngp: "Nagpur Junction", "नागपुर": "Nagpur Junction",
  // Hatia / Ranchi
  ranchi: "Hatia", hatia: "Hatia", hte: "Hatia", "रांची": "Hatia",
  // Ernakulam / Kochi
  kochi: "Ernakulam Junction", ernakulam: "Ernakulam Junction", ers: "Ernakulam Junction",
  "कोच्चि": "Ernakulam Junction", "எர்ணாகுளம்": "Ernakulam Junction",
  // Thiruvananthapuram
  trivandrum: "Thiruvananthapuram Central", thiruvananthapuram: "Thiruvananthapuram Central",
  // Rameswaram
  rameswaram: "Rameswaram", "रामेश्वरम": "Rameswaram",
  // Indore
  indore: "Indore Junction", "इंदौर": "Indore Junction",
};

/**
 * Identifies Origin and Destination stations from multilingual text.
 * Properly parses "X se/from Y" patterns and fallbacks to word-by-word matching.
 */
function extractStationsFromText(text: string): { from: string; fromCode: string; to: string; toCode: string } {
  const lower = text.toLowerCase().trim();

  // Resolve alias → canonical station name
  function resolveAlias(raw: string): string | null {
    const cleaned = raw.trim().toLowerCase();
    // Direct alias match
    if (CITY_ALIASES[cleaned]) return CITY_ALIASES[cleaned];
    // Check each alias as a substring of the raw text
    for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
      if (cleaned.includes(alias) && alias.length >= 3) return canonical;
    }
    // Try searchStations as final fallback
    const results = searchStations(raw.trim(), 1);
    if (results.length > 0) return results[0].name;
    return null;
  }

  // Pattern: "from X to Y" or "X to Y" or "X se Y" (Hindi/Hinglish/Bengali/Tamil/Marathi)
  const patterns = [
    /(?:from\s+)(.+?)(?:\s+to\s+)(.+?)(?:\s+(?:kal|aaj|parso|tomorrow|today|on|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday|ko|jana|jao|jayenge|pohochna|$))/i,
    /(?:from\s+)(.+?)(?:\s+to\s+)(.+)/i,
    /(.+?)(?:\s+se\s+)(.+?)(?:\s+(?:kal|aaj|parso|tomorrow|today|on|next|ko|jana|jao|jayenge|pohochna|$))/i,
    /(.+?)(?:\s+se\s+)(.+)/i,
    /(.+?)(?:\s+to\s+)(.+?)(?:\s+(?:kal|aaj|parso|tomorrow|today|on|next|ko|jana|jao|jayenge|pohochna|$))/i,
    /(.+?)(?:\s+to\s+)(.+)/i,
    // Hindi: "से" delimiter
    /(.+?)(?:\s*से\s+)(.+?)(?:\s+(?:जाना|है|kal|aaj|parso|tomorrow|today|को|$))/i,
    /(.+?)(?:\s*से\s+)(.+)/i,
    // Tamil: "இருந்து" / "க்கு"
    /(.+?)(?:இருந்து)(.+?)(?:க்கு|$)/i,
    // Bengali: "থেকে"
    /(.+?)(?:থেকে)(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      const rawFrom = match[1].trim();
      const rawTo = match[2].trim();

      const resolvedFrom = resolveAlias(rawFrom);
      const resolvedTo = resolveAlias(rawTo);

      if (resolvedFrom && resolvedTo && resolvedFrom !== resolvedTo) {
        const fromSt = getStationByName(resolvedFrom);
        const toSt = getStationByName(resolvedTo);
        return {
          from: fromSt.name,
          fromCode: fromSt.code,
          to: toSt.name,
          toCode: toSt.code,
        };
      }
    }
  }

  // Fallback: scan word-by-word for known city/station names
  const detected: string[] = [];
  // Sort aliases by length descending so longer multi-word names match first
  const sortedAliases = Object.entries(CITY_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, canonical] of sortedAliases) {
    if (alias.length >= 3 && lower.includes(alias)) {
      if (!detected.includes(canonical)) {
        detected.push(canonical);
      }
    }
    if (detected.length >= 2) break;
  }

  if (detected.length >= 2) {
    const fromSt = getStationByName(detected[0]);
    const toSt = getStationByName(detected[1]);
    return { from: fromSt.name, fromCode: fromSt.code, to: toSt.name, toCode: toSt.code };
  }

  if (detected.length === 1) {
    // Only one station found — can't determine route
    const st = getStationByName(detected[0]);
    return {
      from: st.name,
      fromCode: st.code,
      to: "",
      toCode: "",
    };
  }

  // Nothing detected
  return { from: "", fromCode: "", to: "", toCode: "" };
}

/**
 * Transcribe Audio using Sarvam AI Saaras API (or offline fallback)
 */
export async function transcribeWithSarvam(
  audioBuffer: ArrayBuffer | Uint8Array,
  mimeType: string = "audio/webm",
  languageCode: string = "unknown"
): Promise<{ text: string; language: string }> {
  const apiKey = process.env.SARVAM_API_KEY;

  if (apiKey) {
    try {
      const formData = new FormData();
      const blob = new Blob([audioBuffer as any], { type: mimeType });
      formData.append("file", blob, "audio.webm");
      formData.append("model", "saaras:v1");
      if (languageCode !== "unknown") {
        formData.append("language_code", languageCode);
      }

      const res = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
          "api-subscription-key": apiKey,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return {
          text: data.transcript || "",
          language: data.language_code || "hi-IN",
        };
      }
    } catch (e) {
      console.warn("Sarvam AI STT error, falling back to heuristic parsing:", e);
    }
  }

  // No API key or API failed — return empty so the caller uses the raw text
  return {
    text: "",
    language: "unknown",
  };
}

/**
 * Text-to-Speech using Sarvam AI Bulbul API
 */
export async function synthesizeWithSarvam(
  text: string,
  targetLanguage: string = "hi-IN"
): Promise<string | undefined> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return undefined;

  try {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        inputs: [text.slice(0, 500)],
        target_language_code: targetLanguage,
        speaker: "meera",
        pitch: 0,
        pace: 1.05,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v1",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.audios?.[0]; // Base64 audio string
    }
  } catch (e) {
    console.warn("Sarvam AI TTS error:", e);
  }
  return undefined;
}

/**
 * Detect if the user is speaking Hindi/Hinglish so we respond in Hindi
 */
function detectHindi(text: string): boolean {
  const lower = text.toLowerCase();
  const hindiIndicators = [
    "mujhe", "jana", "batao", "chahiye", "karo", "train", "se ",
    "hai", "hain", "koi", "wali", "wala", "sasta", "tez", "jaldi",
    "मुझे", "जाना", "बताओ", "चाहिए", "से", "है", "कोई",
    // Devanagari range presence
  ];
  if (/[\u0900-\u097F]/.test(text)) return true;
  return hindiIndicators.some((w) => lower.includes(w));
}

/**
 * End-to-end Voice & NLP Pipeline for Indian Railways
 */
export async function processVoiceQuery(
  rawText: string,
  lang: string = "hi-IN"
): Promise<VoiceQueryResponse> {
  const extracted = extractStationsFromText(rawText);
  const date = parseSpokenDate(rawText);

  let pref: "easy" | "fastest" | "cheapest" = "easy";
  const lower = rawText.toLowerCase();
  if (lower.includes("fast") || lower.includes("jaldi") || lower.includes("tez") || lower.includes("விரைவு") || lower.includes("rajdhani") || lower.includes("duronto")) {
    pref = "fastest";
  } else if (lower.includes("cheap") || lower.includes("sasta") || lower.includes("kam paise") || lower.includes("மலிவு") || lower.includes("sleeper") || lower.includes("general")) {
    pref = "cheapest";
  }

  // If we couldn't extract both stations, return helpful error
  if (!extracted.from || !extracted.to) {
    const missing = !extracted.from && !extracted.to ? "origin and destination" : !extracted.to ? "destination" : "origin";
    const isHindi = detectHindi(rawText);

    return {
      transcription: rawText,
      detectedLanguage: lang,
      extracted: { ...extracted, date, pref },
      responseText: isHindi
        ? `क्षमा करें, मुझे आपकी ${missing === "origin and destination" ? "शुरुआत और मंजिल" : missing === "destination" ? "मंजिल" : "शुरुआत"} स्टेशन समझ नहीं आया। कृपया इस तरह बताएं:\n\n"Delhi se Mumbai kal"\n"Chennai to Goa tomorrow"\n"Kolkata se Varanasi parso"`
        : `Sorry, I couldn't identify the ${missing} station from your message. Please try like:\n\n"Delhi to Mumbai tomorrow"\n"Chennai se Goa kal"\n"Kolkata to Varanasi parso"`,
      journeys: [],
    };
  }

  const journeys = findJourneys(extracted.from, extracted.to, date, pref);
  const best = journeys[0];
  const isHindi = detectHindi(rawText);

  // Natural language summary
  let responseText = "";
  if (best) {
    const isDirect = best.interchangeCount === 0;
    const transfer = (best.legs.find((l) => l.type === "transfer") as any)?.transfer;
    const duration = formatDuration(best.totalDurationMinutes);

    if (isHindi) {
      if (isDirect) {
        responseText = `✅ ${extracted.from} से ${extracted.to} के लिए सीधी ट्रेन मिली! कुल समय ${duration}, किराया ₹${best.totalCost.toLocaleString("en-IN")} (AC 3-Tier)।`;
      } else {
        const junctionName = transfer?.fromStationId ? getStation(transfer.fromStationId)?.name : "जंक्शन";
        responseText = `✅ ${extracted.from} से ${extracted.to} — ${junctionName} पर 1 सुरक्षित चेंज के साथ सबसे बढ़िया कनेक्शन मिला। कुल समय ${duration}।`;
      }
    } else {
      if (isDirect) {
        responseText = `✅ Found a direct train from ${extracted.from} to ${extracted.to}! Total ${duration}, fare ₹${best.totalCost.toLocaleString("en-IN")} (AC 3-Tier).`;
      } else {
        const junctionName = transfer?.fromStationId ? getStation(transfer.fromStationId)?.name : "junction";
        responseText = `✅ Found a safe connection from ${extracted.from} to ${extracted.to} with 1 protected transfer at ${junctionName}. Total duration ${duration}.`;
      }
    }
  } else {
    responseText = isHindi
      ? `❌ ${extracted.from} से ${extracted.to} के लिए ${date} को कोई ट्रेन नहीं मिली। कृपया कोई और तारीख आज़माएं।`
      : `❌ No practical route found from ${extracted.from} to ${extracted.to} on ${date}. Please try a different date.`;
  }

  // Attempt Sarvam TTS
  const audioBase64 = await synthesizeWithSarvam(responseText, lang);

  return {
    transcription: rawText,
    detectedLanguage: lang,
    extracted: {
      ...extracted,
      date,
      pref,
    },
    responseText,
    responseAudioBase64: audioBase64,
    journeys,
  };
}
