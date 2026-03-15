"use client";

import { useEffect, useState } from "react";
import { Tv2, ShoppingCart, MonitorPlay, ExternalLink } from "lucide-react";
import type { WatchProvider, WatchProvidersData } from "@/types";

const TMDB_LOGO_BASE = "https://image.tmdb.org/t/p/w45";

interface WatchProvidersProps {
    tmdbId: string;
    type?: "movie" | "tv";
}

interface ApiResponse {
    providers: WatchProvidersData | null;
    country: string;
}

function ProviderLogo({ provider }: { provider: WatchProvider }) {
    return (
        <div
            title={provider.provider_name}
            className="flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-white/10 shadow-sm"
        >
            <img
                src={`${TMDB_LOGO_BASE}${provider.logo_path}`}
                alt={provider.provider_name}
                className="w-full h-full object-cover"
                loading="lazy"
            />
        </div>
    );
}

function ProviderRow({
    icon,
    label,
    providers,
}: {
    icon: React.ReactNode;
    label: string;
    providers: WatchProvider[];
}) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="flex-shrink-0 mt-0.5 text-gray-500">{icon}</div>
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1.5">
                    {label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {providers.map((p) => (
                        <ProviderLogo key={p.provider_id} provider={p} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function WatchProviders({ tmdbId, type = "movie" }: WatchProvidersProps) {
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Confirm we're on the client before doing anything
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!tmdbId) return;

        let cancelled = false;
        setLoading(true);
        setError(false);
        setData(null);

        // Send the browser locale as fallback country hint
        const locale = typeof navigator !== "undefined" ? navigator.language : "";
        const params = new URLSearchParams({ id: tmdbId, type, locale });

        fetch(`/api/movie/providers?${params.toString()}`)
            .then((res) => {
                if (!res.ok) throw new Error("API error");
                return res.json() as Promise<ApiResponse>;
            })
            .then((json) => {
                if (!cancelled) setData(json);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [tmdbId, type]);

    // Fail silently on error — don't pollute the modal with error states
    if (!mounted) return null;
    if (error) return null;

    if (loading) {
        return (
            <div className="px-5 pb-4">
                <div className="h-px bg-white/5 mb-4" />
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-20 h-3 rounded bg-white/5 animate-pulse" />
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-9 h-9 rounded-lg bg-white/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const hasAny =
        data?.providers &&
        (
            (data.providers.flatrate && data.providers.flatrate.length > 0) ||
            (data.providers.rent && data.providers.rent.length > 0) ||
            (data.providers.buy && data.providers.buy.length > 0)
        );

    return (
        <div className="px-5 pb-4">
            <div className="h-px bg-white/5 mb-4" />

            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">
                    Where to Watch
                    {data?.country && (
                        <span className="ml-1.5 text-gray-700">· {data.country}</span>
                    )}
                </p>
                {hasAny && data?.providers?.link && (
                    <a
                        href={data.providers.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-teal-400 transition-colors"
                    >
                        JustWatch
                        <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                )}
            </div>

            {/* Not available */}
            {!hasAny && (
                <p className="text-xs text-gray-600 italic">
                    Not available in your country
                </p>
            )}

            {/* Provider rows */}
            {hasAny && (
                <div className="space-y-3">
                    {data!.providers!.flatrate && data!.providers!.flatrate.length > 0 && (
                        <ProviderRow
                            icon={<Tv2 className="w-3.5 h-3.5" />}
                            label="Streaming"
                            providers={data!.providers!.flatrate}
                        />
                    )}
                    {data!.providers!.rent && data!.providers!.rent.length > 0 && (
                        <ProviderRow
                            icon={<MonitorPlay className="w-3.5 h-3.5" />}
                            label="Rent"
                            providers={data!.providers!.rent}
                        />
                    )}
                    {data!.providers!.buy && data!.providers!.buy.length > 0 && (
                        <ProviderRow
                            icon={<ShoppingCart className="w-3.5 h-3.5" />}
                            label="Buy"
                            providers={data!.providers!.buy}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
