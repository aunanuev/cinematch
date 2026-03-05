"use client";

import { useEffect, useRef } from "react";
import { X, Star, Check, Eye, Sparkles, BookOpen, PlayCircle, Tag } from "lucide-react";
import { Movie } from "@/types";
import { cn } from "@/lib/utils";
import { updateMovieRating, toggleMovieWatched } from "@/lib/firebase/firestore";

interface MovieDetailModalProps {
    movie: Movie;
    onClose: () => void;
    onOpenSimilar?: () => void;
    onOpenDiary?: () => void;
    onOpenTrailer?: () => void;
}

export function MovieDetailModal({
    movie,
    onClose,
    onOpenSimilar,
    onOpenDiary,
    onOpenTrailer,
}: MovieDetailModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    // Escape key closes
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleRate = async (rating: number) => {
        await updateMovieRating(movie.id, rating);
    };

    const handleToggleWatched = async () => {
        await toggleMovieWatched(movie.id, movie.watched);
    };

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            {/* Sheet — slides up from bottom on mobile, centered on desktop */}
            <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0f1929] to-[#080e1a] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">

                {/* Top bar: drag handle (mobile) + close button */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 pt-3 pb-2 bg-[#0f1929]/95 backdrop-blur-sm">
                    {/* Drag handle (mobile only) */}
                    <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto" />
                    <button
                        onClick={onClose}
                        className="ml-auto p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Hero: poster + core info */}
                <div className="flex gap-4 px-5 pt-4 pb-5">
                    {/* Poster */}
                    <div className="flex-shrink-0 w-24 rounded-xl overflow-hidden shadow-lg shadow-black/60">
                        <img
                            src={movie.poster_path !== "N/A" ? movie.poster_path : "/placeholder-poster.png"}
                            alt={movie.title}
                            className="w-full aspect-[2/3] object-cover"
                        />
                    </div>

                    {/* Title block */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                            <h2 className="text-lg font-bold text-white leading-snug line-clamp-3">{movie.title}</h2>
                            <p className="text-sm text-gray-500 mt-0.5">{movie.year}</p>

                            {/* Genre chips */}
                            {movie.genres && movie.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {movie.genres.map((g) => (
                                        <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-teal-900/50 text-teal-300 border border-teal-800/40">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Star rating */}
                        <div className="flex gap-1 mt-3">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => handleRate(s === movie.rating ? 0 : s)}
                                    className="p-0.5 touch-manipulation"
                                >
                                    <Star className={cn(
                                        "w-4 h-4 transition-transform duration-150 active:scale-125",
                                        s <= (movie.rating || 0)
                                            ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]"
                                            : "text-gray-700"
                                    )} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/5 mx-5" />

                {/* AI Pitch */}
                {movie.aiPitch && (
                    <div className="px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600 mb-1.5">AI Pitch</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{movie.aiPitch}</p>
                    </div>
                )}

                {/* Overview */}
                {movie.overview && (
                    <div className="px-5 pb-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600 mb-1.5">Overview</p>
                        <p className="text-sm text-gray-400 leading-relaxed line-clamp-4">{movie.overview}</p>
                    </div>
                )}

                {/* Vibe tags */}
                {movie.vibeTags && movie.vibeTags.length > 0 && (
                    <div className="px-5 pb-4">
                        <div className="flex flex-wrap gap-1.5">
                            {movie.vibeTags.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-purple-900/30 text-purple-300 border border-purple-800/30">
                                    <Tag className="w-2.5 h-2.5" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div className="h-px bg-white/5 mx-5" />

                {/* Action row */}
                <div className="flex gap-2 px-5 py-4">
                    {/* Watched toggle */}
                    <button
                        onClick={handleToggleWatched}
                        className={cn(
                            "flex-1 h-10 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300",
                            movie.watched
                                ? "bg-slate-800 text-gray-400 hover:bg-slate-700"
                                : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
                        )}
                    >
                        {movie.watched
                            ? <><Eye className="w-4 h-4" /> Mark Pending</>
                            : <><Check className="w-4 h-4" /> Mark Watched</>
                        }
                    </button>

                    {/* Trailer */}
                    {onOpenTrailer && (
                        <button
                            onClick={() => { onClose(); onOpenTrailer(); }}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-800/80 text-gray-400 hover:text-red-400 hover:bg-slate-700 transition-all"
                            title="Watch Trailer"
                        >
                            <PlayCircle className="w-5 h-5" />
                        </button>
                    )}

                    {/* Similar */}
                    {onOpenSimilar && (
                        <button
                            onClick={() => { onClose(); onOpenSimilar(); }}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-800/80 text-gray-400 hover:text-purple-400 hover:bg-slate-700 transition-all"
                            title="Similar movies"
                        >
                            <Sparkles className="w-5 h-5" />
                        </button>
                    )}

                    {/* Diary */}
                    {onOpenDiary && (
                        <button
                            onClick={() => { onClose(); onOpenDiary(); }}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-800/80 text-gray-400 hover:text-purple-400 hover:bg-slate-700 transition-all"
                            title="AI Diary"
                        >
                            <BookOpen className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
