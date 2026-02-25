"use client";

import { useState, useEffect } from "react";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Plus, X, RefreshCw } from "lucide-react";
import { addMovie } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Timestamp } from "firebase/firestore";
import { getIdToken } from "@/lib/getIdToken";

interface Recommendation {
    title: string;
    year: string;
    reason: string;
}

interface SimilarMoviesModalProps {
    movie: Movie;
    onClose: () => void;
}

export function SimilarMoviesModal({ movie, onClose }: SimilarMoviesModalProps) {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [added, setAdded] = useState<Set<string>>(new Set());

    const fetchRecommendations = async () => {
        setLoading(true);
        setError("");
        setRecommendations([]);
        try {
            const token = await getIdToken();
            const res = await fetch("/api/movie/recommend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    movie: {
                        title: movie.title,
                        year: movie.year,
                        overview: movie.overview,
                        genres: movie.genres,
                    },
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to fetch recommendations");
            }
            const data = await res.json();
            setRecommendations(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on mount
    useEffect(() => {
        fetchRecommendations();
    }, []);

    const handleAdd = async (rec: Recommendation) => {
        if (!user) return;
        try {
            await addMovie({
                imdbID: `rec-${Date.now()}`,
                userId: user.uid,
                title: rec.title,
                year: rec.year,
                poster_path: "N/A",
                overview: rec.reason,
                aiPitch: rec.reason,
                vibeTags: ["Recommended"],
                genres: movie.genres?.slice(0, 1) ?? [],
                watched: false,
                createdAt: Timestamp.now(),
                rating: 0,
            });
            setAdded(prev => new Set([...prev, rec.title]));
        } catch {
            alert("Failed to add movie.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-lg">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-100 text-base leading-tight">Similar to</h2>
                            <p className="text-sm text-teal-400 font-medium leading-tight">{movie.title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {!loading && recommendations.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-white w-8 h-8"
                                onClick={fetchRecommendations}
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white w-8 h-8" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                            <p className="text-sm text-gray-400 animate-pulse">Finding similar movies...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-950/30 border border-red-900/50 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {!loading && recommendations.map((rec, i) => (
                        <div
                            key={i}
                            className="group relative bg-gray-950 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all duration-200 flex items-start gap-4"
                        >
                            {/* Rank badge */}
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-800 text-gray-400 text-xs font-bold flex items-center justify-center">
                                {i + 1}
                            </span>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="font-bold text-gray-100 text-sm leading-tight">{rec.title}</h3>
                                    <span className="text-xs text-teal-500 flex-shrink-0 font-mono">{rec.year}</span>
                                </div>
                                <p className="text-xs text-gray-400 italic mt-1 leading-relaxed">{rec.reason}</p>
                            </div>

                            <Button
                                size="sm"
                                variant="ghost"
                                className={`flex-shrink-0 h-8 px-3 text-xs transition-all ${added.has(rec.title)
                                    ? "text-teal-400 hover:text-teal-300"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                                onClick={() => handleAdd(rec)}
                                disabled={added.has(rec.title)}
                            >
                                {added.has(rec.title) ? (
                                    "Added ✓"
                                ) : (
                                    <>
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add
                                    </>
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
