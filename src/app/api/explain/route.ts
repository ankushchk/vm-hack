import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { journey } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ explanation: null, fallback: true });
  }
  try {
    const legs = journey.legs?.filter((l: any) => l.type === "train") ?? [];
    const transfer = journey.legs?.find((l: any) => l.type === "transfer")?.transfer;
    const prompt = `You are Raasta, a public-service journey companion for Indian Railways. Explain this journey in simple, warm, citizen-friendly language. Do NOT invent train times or stations. Use only the structured data provided.

Data:
- Origin: ${journey.origin?.name}
- Destination: ${journey.destination?.name}
- Trains: ${legs.map((l: any) => `${l.train.name} ${l.train.number} ${l.departure}->${l.arrival}`).join(" | ")}
- Transfer: ${transfer ? `${transfer.durationMinutes} min buffer, risk ${transfer.risk}, ${transfer.reason}` : "direct"}
- Total duration: ${journey.totalDurationMinutes} min, cost ₹${journey.totalCost}

Keep it to 6-8 sentences, plain language, no jargon. Mention changing trains only if needed.`;
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 280,
      }),
    });
    if (!resp.ok) throw new Error("openai error");
    const data = await resp.json();
    const explanation = data.choices?.[0]?.message?.content?.trim() ?? null;
    return NextResponse.json({ explanation });
  } catch (e) {
    return NextResponse.json({ explanation: null, fallback: true });
  }
}
