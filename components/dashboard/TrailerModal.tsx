"use client";

import { useEffect, useState, useRef } from "react";
import { X, Loader2, PlayCircle } from "lucide-react";
import { Movie } from "@/types";

interface TrailerModalProps {
    movie: Movie;
    onClose: () => void;
}

export function TrailerModal({ movie, onClose }: TrailerModalProps) {
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchTrailer() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/movie/trailer?id=${movie.imdbID}`);
                if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    throw new Error(d.error || "No trailer available");
                }
                const data = await res.json();
                if (!cancelled) setTrailerKey(data.key);
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Could not load trailer");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchTrailer();
        return () => { cancelled = true; };
    }, [movie.imdbID]);

    // Escape key to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2.5">
                    <PlayCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Trailer</p>
                        <h2 className="text-base font-bold text-white leading-tight line-clamp-1">{movie.title}</h2>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video flex items-center justify-center">
                {loading && (
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                        <p className="text-sm">Loading trailer...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center gap-3 text-center px-6">
                        <PlayCircle className="w-12 h-12 text-gray-700" />
                        <p className="text-gray-400 font-medium">{error}</p>
                        <p className="text-xs text-gray-600">No trailer was found on TMDB for this movie.</p>
                    </div>
                )}

                {!loading && trailerKey && (
                    <iframe
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                        title={`${movie.title} Trailer`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* Year badge */}
            <p className="mt-3 text-xs text-gray-600">{movie.year}</p>
        </div>
    );
}
