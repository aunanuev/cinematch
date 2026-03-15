import { NextRequest, NextResponse } from "next/server";

const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_BASE = "https://api.themoviedb.org/3";

/**
 * Detect the user's 2-letter ISO 3166-1 country code.
 *
 * Priority:
 *  1. x-vercel-ip-country  — set automatically by Vercel's edge network
 *  2. `locale` query param  — browser sends navigator.language, e.g. "es-CL" → "CL"
 *  3. Hard fallback: "CL"
 */
function detectCountry(req: NextRequest, locale: string | null): string {
    // 1. Vercel edge header
    const vercelCountry = req.headers.get("x-vercel-ip-country");
    if (vercelCountry && vercelCountry.length === 2) {
        return vercelCountry.toUpperCase();
    }

    // 2. Browser locale e.g. "es-CL", "pt-BR", "en-US"
    if (locale) {
        const parts = locale.split("-");
        if (parts.length === 2 && parts[1].length === 2) {
            return parts[1].toUpperCase();
        }
        // Some locales are just "en" — ignore, fall through
    }

    // 3. Default
    return "CL";
}

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    const type = searchParams.get("type"); // "movie" | "tv"
    const locale = searchParams.get("locale");

    if (!id) {
        return NextResponse.json({ error: "Movie/TV id is required" }, { status: 400 });
    }

    const mediaType = type === "tv" ? "tv" : "movie";
    const country = detectCountry(request, locale);

    if (!TMDB_TOKEN) {
        return NextResponse.json({ error: "TMDB token not configured" }, { status: 500 });
    }

    try {
        const res = await fetch(
            `${TMDB_BASE}/${mediaType}/${id}/watch/providers`,
            {
                headers: {
                    Authorization: `Bearer ${TMDB_TOKEN}`,
                    "Content-Type": "application/json",
                },
                // Watch provider data changes infrequently — cache for 24 hours
                next: { revalidate: 86400 },
            }
        );

        if (!res.ok) {
            throw new Error(`TMDB responded with ${res.status}`);
        }

        const data = await res.json();

        // TMDB returns results keyed by country code
        const countryData = data?.results?.[country];

        if (!countryData) {
            // Not available in the detected country
            return NextResponse.json({ providers: null, country });
        }

        return NextResponse.json({
            providers: {
                flatrate: countryData.flatrate ?? null,
                rent: countryData.rent ?? null,
                buy: countryData.buy ?? null,
                link: countryData.link ?? null,
            },
            country,
        });
    } catch (error) {
        console.error("Watch providers fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch watch providers" },
            { status: 500 }
        );
    }
}
