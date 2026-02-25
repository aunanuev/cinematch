import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// 30 search calls per minute per IP (unauthenticated — search is a public UX feature)
const limiter = rateLimit({ interval: 60_000, limit: 30 });

// Fetch the id → name genre map from TMDB
async function fetchGenreMap(): Promise<Record<number, string>> {
    const response = await fetch(`${TMDB_BASE_URL}/genre/movie/list?language=en-US`, {
        headers: {
            Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) return {};
    const data = await response.json();
    const map: Record<number, string> = {};
    for (const g of data.genres ?? []) {
        map[g.id] = g.name;
    }
    return map;
}

export async function GET(request: NextRequest) {
    // Rate limit (no auth required — search is called before the user adds a movie)
    const rateLimitError = limiter.check(request);
    if (rateLimitError) return rateLimitError;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("s")?.trim().slice(0, 200) ?? "";

    if (!query) {
        return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    if (!TMDB_READ_ACCESS_TOKEN) {
        return NextResponse.json({ error: "TMDB API token not configured" }, { status: 500 });
    }

    try {
        // Fetch movies and genre map in parallel
        const [response, genreMap] = await Promise.all([
            fetch(
                `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`,
                {
                    headers: {
                        Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                }
            ),
            fetchGenreMap(),
        ]);

        if (!response.ok) {
            throw new Error(`TMDB responded with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return NextResponse.json({ error: "No results found" }, { status: 404 });
        }

        // Normalize TMDB results to a consistent shape used by the frontend
        const normalizedResults = data.results.map((movie: any) => ({
            imdbID: String(movie.id),
            Title: movie.title,
            Year: movie.release_date ? movie.release_date.substring(0, 4) : "N/A",
            Poster: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : "N/A",
            overview: movie.overview || "",
            genres: (movie.genre_ids ?? []).map((id: number) => genreMap[id]).filter(Boolean),
        }));

        return NextResponse.json({ Search: normalizedResults });
    } catch (error) {
        console.error("TMDB API Error in /search");
        return NextResponse.json({ error: "Failed to fetch data from TMDB" }, { status: 500 });
    }
}
