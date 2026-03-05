import { NextRequest, NextResponse } from "next/server";

const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const tmdbId = searchParams.get("id");

    if (!tmdbId) {
        return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    }

    if (!TMDB_READ_ACCESS_TOKEN) {
        return NextResponse.json({ error: "TMDB token not configured" }, { status: 500 });
    }

    try {
        const res = await fetch(
            `${TMDB_BASE_URL}/movie/${tmdbId}/videos?language=en-US`,
            {
                headers: {
                    Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                // Cache for 1 hour — trailers don't change often
                next: { revalidate: 3600 },
            }
        );

        if (!res.ok) {
            throw new Error(`TMDB responded with ${res.status}`);
        }

        const data = await res.json();

        // Prefer official trailers, fall back to any trailer/teaser on YouTube
        const videos: any[] = data.results ?? [];
        const trailer =
            videos.find(
                (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
            ) ??
            videos.find(
                (v) => v.site === "YouTube" && v.type === "Trailer"
            ) ??
            videos.find(
                (v) => v.site === "YouTube" && v.type === "Teaser"
            ) ??
            videos.find((v) => v.site === "YouTube");

        if (!trailer) {
            return NextResponse.json({ error: "No trailer found" }, { status: 404 });
        }

        return NextResponse.json({ key: trailer.key, name: trailer.name });
    } catch (error) {
        console.error("Trailer fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch trailer" }, { status: 500 });
    }
}
