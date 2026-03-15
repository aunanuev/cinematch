import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimit } from "@/lib/rateLimit";
import { getAuthUser } from "@/lib/getAuthUser";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const limiter = rateLimit({ interval: 60_000, limit: 10 });

function sanitize(value: unknown, maxLen = 500): string {
    if (typeof value !== "string") return "";
    return value.replace(/[<>]/g, "").trim().slice(0, maxLen);
}

export async function POST(request: NextRequest) {
    const rateLimitError = limiter.check(request);
    if (rateLimitError) return rateLimitError;

    const user = await getAuthUser(request);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: "Gemini API Key not configured" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const title = sanitize(body.title);
        const overview = sanitize(body.overview, 1000);

        if (!title) {
            return NextResponse.json({ error: "Series title is required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
      Actúa como un crítico de TV experto y curador personal. Para la serie '${title}' con la sinopsis '${overview}', genera un JSON válido con exactamente dos campos:
      
      1. "pitch": Una frase persuasiva y emocionante de máximo 30 palabras sobre por qué vale la pena verla hoy.
      2. "tags": Un array de 3 a 5 palabras clave cortas (máximo 2 palabras cada una) que describan la atmósfera (Vibe) de la serie (ej: 'Tensa', 'Onírica', 'Distópica', 'Feel-good').

      Responde ÚNICAMENTE con el objeto JSON. No incluyas markdown (jq) ni texto adicional.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const jsonResponse = JSON.parse(cleanText);
            return NextResponse.json(jsonResponse);
        } catch {
            console.error("Failed to parse Gemini response in series /enrich");
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

    } catch (error: any) {
        const errorMessage = error.message || error.toString();
        if (errorMessage.includes("429") || errorMessage.includes("Quota exceeded")) {
            return NextResponse.json(
                { error: "AI is busy. Rate limit exceeded." },
                { status: 429 }
            );
        }
        console.error("Gemini API Error in series /enrich");
        return NextResponse.json({ error: "Failed to enrich series data." }, { status: 500 });
    }
}
