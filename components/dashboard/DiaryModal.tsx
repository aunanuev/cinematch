"use client";

import { useState } from "react";
import { Movie } from "@/types";
import { X, BookOpen, Loader2, RefreshCw } from "lucide-react";
import { getIdToken } from "@/lib/getIdToken";

interface DiaryModalProps {
    movie: Movie;
    collectionTags: string[];
    onClose: () => void;
}

export function DiaryModal({ movie, collectionTags, onClose }: DiaryModalProps) {
    const [diary, setDiary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchDiary = async () => {
        setLoading(true);
        setError("");
        try {
            const token = await getIdToken();
            const res = await fetch("/api/movie/diary", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    title: movie.title,
                    vibeTags: movie.vibeTags || [],
                    collectionTags,
                }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setDiary(data.diary);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on mount
    if (!loading && diary === null && !error) {
        fetchDiary();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full sm:max-w-md bg-slate-900 border border-white/8 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">AI Diary</h2>
                            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{movie.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Poster + Content */}
                <div className="p-5 flex gap-4">
                    {movie.poster_path && movie.poster_path !== "N/A" && (
                        <img
                            src={movie.poster_path}
                            alt={movie.title}
                            className="w-16 h-24 object-cover rounded-xl flex-shrink-0 shadow-lg"
                        />
                    )}

                    <div className="flex-1 flex flex-col justify-center min-h-[6rem]">
                        {loading && (
                            <div className="flex flex-col items-center gap-2 py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                                <p className="text-xs text-slate-500 animate-pulse">Consulting the AI curator…</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="space-y-2">
                                <p className="text-xs text-red-400">{error}</p>
                                <button
                                    onClick={fetchDiary}
                                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" /> Try again
                                </button>
                            </div>
                        )}

                        {!loading && diary && (
                            <p className="text-sm text-slate-200 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {diary}
                            </p>
                        )}
                    </div>
                </div>

                {/* Vibe tags */}
                {(movie.vibeTags || []).length > 0 && (
                    <div className="flex gap-1.5 flex-wrap px-5 pb-4">
                        {(movie.vibeTags || []).map((tag) => (
                            <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Regenerate footer */}
                {diary && !loading && (
                    <div className="px-5 pb-5 pt-0">
                        <button
                            onClick={fetchDiary}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800/60 border border-white/5 text-xs text-slate-400 hover:text-white hover:border-purple-500/30 transition-all duration-200"
                        >
                            <RefreshCw className="w-3 h-3" /> Regenerate
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
