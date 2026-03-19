import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimit } from "@/lib/rateLimit";
import { getAuthUser } from "@/lib/getAuthUser";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 5 AI recommendation calls per minute per IP
const limiter = rateLimit({ interval: 60_000, limit: 5 });

function sanitize(value: unknown, maxLen = 500): string {
    if (typeof value !== "string") return "";
    return value.replace(/[<>]/g, "").trim().slice(0, maxLen);
}

export async function POST(request: NextRequest) {
    // 1. Rate limit
    const rateLimitError = limiter.check(request);
    if (rateLimitError) return rateLimitError;

    // 2. Require authentication
    const user = await getAuthUser(request);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: "Gemini API Key not configured" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { movie: series, likedMovies: likedSeries } = body;

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let prompt: string;

        if (series) {
            const title = sanitize(series.title);
            const overview = sanitize(series.overview, 1000);
            const genres = Array.isArray(series.genres)
                ? series.genres.map((g: unknown) => sanitize(g)).join(", ")
                : "";

            prompt = `
You are an expert TV series curator. The user enjoyed the series "${title}" (${sanitize(String(series.year ?? ""))}).
${overview ? `Synopsis: ${overview}` : ""}
${genres ? `Genres: ${genres}` : ""}

Recommend exactly 3 real TV series that are similar in tone, style, or theme. 
They must be different from "${title}".

Respond ONLY with a valid JSON array in this exact format (no markdown):
[
  {
    "title": "Series Title",
    "year": "Year",
    "reason": "One short sentence on why it's similar"
  }
]
`;
        } else if (likedSeries && Array.isArray(likedSeries) && likedSeries.length > 0) {
            const safeSeries = likedSeries
                .slice(0, 20) // cap to prevent prompt injection via huge list
                .map((s: any) => `- ${sanitize(s.title)} (${sanitize(String(s.year ?? ""))})`)
                .join("\n");

            prompt = `
You are an expert TV series curator. Based on the user liking these series:
${safeSeries}

Recommend 3 real TV series they would probably enjoy.

Respond ONLY with a valid JSON array in this exact format (no markdown):
[
  {
    "title": "Series Title",
    "year": "Year",
    "reason": "One short sentence on why they'll like it"
  }
]
`;
        } else {
            return NextResponse.json({ error: "No series data provided" }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const recommendations = JSON.parse(cleanText);
            return NextResponse.json(recommendations);
        } catch {
            console.error("Failed to parse AI response");
            return NextResponse.json(
                { error: "AI returned an unexpected format. Please try again." },
                { status: 502 }
            );
        }

    } catch (error: any) {
        const errorMessage = error.message || error.toString();
        if (errorMessage.includes("429") || errorMessage.includes("Quota exceeded")) {
            return NextResponse.json(
                { error: "AI is currently busy. Please try again in a moment." },
                { status: 429 }
            );
        }
        console.error("Gemini API Error in /recommend");
        return NextResponse.json(
            { error: "Failed to generate recommendations. Please try again." },
            { status: 500 }
        );
    }
}
