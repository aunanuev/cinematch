import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimit } from "@/lib/rateLimit";
import { getAuthUser } from "@/lib/getAuthUser";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 5 diary calls per minute per IP
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
        const title = sanitize(body.title);

        if (!title) {
            return NextResponse.json({ error: "Movie title is required" }, { status: 400 });
        }

        // Sanitize array fields — limit count to prevent large prompts
        const vibeTags: string[] = Array.isArray(body.vibeTags)
            ? body.vibeTags.slice(0, 10).map((t: unknown) => sanitize(t, 50))
            : [];

        const collectionTags: string[] = Array.isArray(body.collectionTags)
            ? body.collectionTags.slice(0, 10).map((t: unknown) => sanitize(t, 50))
            : [];

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const tagsLine = vibeTags.length
            ? `This movie has been tagged as: ${vibeTags.join(", ")}.`
            : "";
        const collectionLine = collectionTags.length
            ? `The viewer tends to enjoy films with these vibes: ${collectionTags.join(", ")}.`
            : "";

        const prompt = `
You are a witty, enthusiastic personal cinema curator writing to a friend.
Write a 2-3 sentence "why YOU would love this" diary entry for the movie "${title}".
${tagsLine}
${collectionLine}
Make it personal, specific to the film's atmosphere, and end with a punchy one-liner.
Reply with plain text only — no titles, no markdown, no quotes around the response.
    `.trim();

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const diary = response.text().trim();

        return NextResponse.json({ diary });

    } catch (error: any) {
        const msg = error.message || error.toString();
        if (msg.includes("429") || msg.includes("Quota exceeded")) {
            return NextResponse.json(
                { error: "AI is busy right now. Try again in a moment." },
                { status: 429 }
            );
        }
        console.error("Diary API error");
        return NextResponse.json({ error: "Failed to generate diary entry." }, { status: 500 });
    }
}
