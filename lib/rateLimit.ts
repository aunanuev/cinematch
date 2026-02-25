import { LRUCache } from "lru-cache";
import { NextRequest, NextResponse } from "next/server";

type Options = {
    /** Max number of unique IPs to track within the window */
    uniqueTokenPerInterval?: number;
    /** Rolling window duration in milliseconds */
    interval?: number;
    /** Default max requests per window per IP */
    limit?: number;
};

/**
 * Creates a rate-limiter that tracks requests by IP address.
 *
 * Usage in an API route:
 *   const limiter = rateLimit({ interval: 60_000, limit: 5 });
 *   const rateLimitError = limiter.check(request);
 *   if (rateLimitError) return rateLimitError;
 */
export function rateLimit(options: Options = {}) {
    const {
        uniqueTokenPerInterval = 500,
        interval = 60_000,
        limit = 10,
    } = options;

    // Each IP maps to an array of request timestamps within the window
    const tokenCache = new LRUCache<string, number[]>({
        max: uniqueTokenPerInterval,
        ttl: interval,
    });

    return {
        check(req: NextRequest, overrideLimit?: number): NextResponse | null {
            // Identify caller: prefer forwarded IP header (Vercel sets this)
            const ip =
                req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
                req.headers.get("x-real-ip") ??
                "anonymous";

            const maxRequests = overrideLimit ?? limit;
            const now = Date.now();
            const windowStart = now - interval;

            // Get existing timestamps, filter to the current window
            const timestamps = (tokenCache.get(ip) ?? []).filter(
                (t) => t > windowStart
            );

            if (timestamps.length >= maxRequests) {
                const retryAfter = Math.ceil(interval / 1000);
                return NextResponse.json(
                    { error: "Too many requests. Please wait a moment and try again." },
                    {
                        status: 429,
                        headers: {
                            "Retry-After": String(retryAfter),
                            "X-RateLimit-Limit": String(maxRequests),
                            "X-RateLimit-Remaining": "0",
                            "X-RateLimit-Reset": String(Math.ceil((windowStart + interval) / 1000)),
                        },
                    }
                );
            }

            // Record this request
            timestamps.push(now);
            tokenCache.set(ip, timestamps);
            return null; // Request is allowed
        },
    };
}
