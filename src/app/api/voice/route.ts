import { NextRequest, NextResponse } from "next/server";
import { processVoiceQuery, transcribeWithSarvam } from "@/lib/sarvam";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let textPrompt = "";
    let languageCode = "hi-IN";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const lang = formData.get("language_code") as string | null;
      if (lang) languageCode = lang;

      if (file) {
        const buffer = await file.arrayBuffer();
        const stt = await transcribeWithSarvam(buffer, file.type, languageCode);
        textPrompt = stt.text;
        languageCode = stt.language;
      }
    } else {
      const body = await req.json();
      textPrompt = body.prompt || body.text || "";
      if (body.language_code) languageCode = body.language_code;
    }

    if (!textPrompt) {
      return NextResponse.json(
        { error: "No voice or text input provided" },
        { status: 400 }
      );
    }

    const result = await processVoiceQuery(textPrompt, languageCode);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in /api/voice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process voice query" },
      { status: 500 }
    );
  }
}
