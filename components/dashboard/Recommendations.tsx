"use client";

import { useState } from "react";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Plus, RefreshCw, X } from "lucide-react";
import { addMovie } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Timestamp } from "firebase/firestore";
import { getIdToken } from "@/lib/getIdToken";

interface Recommendation {
    title: string;
    year: string;
    reason: string;
}

interface RecommendationsProps {
    movies: Movie[];
}

export function Recommendations({ movies }: RecommendationsProps) {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGetRecommendations = async () => {
        setLoading(true);
        setError("");
        setRecommendations([]); // Clear previous

        // Filter highly rated movies (4 or 5 stars)
        const likedMovies = movies
            .filter(m => (m.rating || 0) >= 4)
            .map(m => ({ title: m.title, year: m.year }));

        if (likedMovies.length === 0) {
            setError("Rate some movies 4 or 5 stars first to get personalized picks!");
            setLoading(false);
            return;
        }

        try {
            const token = await getIdToken();
            const res = await fetch("/api/movie/recommend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ likedMovies }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to fetch recommendations");
            }

            const data = await res.json();
            setRecommendations(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to generate recommendations");
        } finally {
            setLoading(false);
        }
    };

    const handleAddRecommendation = async (rec: Recommendation) => {
        if (!user) return;
        try {
            await addMovie({
                imdbID: `rec-${Date.now()}`, // Temporary ID
                userId: user.uid,
                title: rec.title,
                year: rec.year,
                poster_path: "N/A",
                overview: rec.reason,
                aiPitch: rec.reason,
                vibeTags: ["Recommended"],
                watched: false,
                createdAt: Timestamp.now(),
                rating: 0
            });
            // Remove from list after adding
            setRecommendations(prev => prev.filter(r => r.title !== rec.title));
        } catch (e) {
            console.error("Failed to add recommendation", e);
            alert("Failed to add movie.");
        }
    };

    const handleDismiss = (title: string) => {
        setRecommendations(prev => prev.filter(r => r.title !== title));
    };

    return (
        <div className="mb-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-lg shadow-purple-900/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-100">AI Curator</h2>
                        <p className="text-xs text-gray-400">Personalized picks based on your favorites</p>
                    </div>
                </div>

                {!loading && recommendations.length === 0 && (
                    <Button
                        onClick={handleGetRecommendations}
                        className="bg-white text-black hover:bg-gray-200 transition-colors font-medium"
                    >
                        Get Picks
                    </Button>
                )}
                {!loading && recommendations.length > 0 && (
                    <Button
                        onClick={handleGetRecommendations}
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                )}
            </div>

            {error && (
                <div className="bg-red-950/30 border border-red-900/50 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="text-lg">⚠️</span> {error}
                </div>
            )}

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-gray-900/50 rounded-xl border border-gray-800 animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && recommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendations.map((rec, i) => (
                        <div key={i} className="group relative bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-5 rounded-xl hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-teal-900/10 flex flex-col justify-between overflow-hidden">
                            {/* Decorative glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-900/10 rounded-full blur-2xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-gray-100 leading-tight">{rec.title}</h3>
                                    <button
                                        onClick={() => handleDismiss(rec.title)}
                                        className="text-gray-600 hover:text-gray-400 transition-colors p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <span className="text-xs font-mono text-teal-500 mt-1 block">{rec.year}</span>
                                <p className="text-sm text-gray-400 mt-3 italic leading-relaxed">"{rec.reason}"</p>
                            </div>

                            <Button
                                size="sm"
                                className="mt-5 w-full bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700/50"
                                onClick={() => handleAddRecommendation(rec)}
                            >
                                <Plus className="w-4 h-4 mr-2 text-teal-400" />
                                Add to Watchlist
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
