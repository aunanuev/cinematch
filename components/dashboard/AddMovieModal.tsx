"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, X } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { addMovie } from "@/lib/firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { getIdToken } from "@/lib/getIdToken";

interface AddMovieModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddMovieModal({ isOpen, onClose }: AddMovieModalProps) {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [enriching, setEnriching] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/movie/search?s=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.Search) {
                setResults(data.Search);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMovie = async (movie: any) => {
        if (!user) return;
        setEnriching(true);

        try {
            // 1. TMDB search results already include the full overview — pass it to AI.
            const token = await getIdToken();
            const aiRes = await fetch("/api/movie/enrich", {
                method: "POST",
                body: JSON.stringify({ title: movie.Title, overview: movie.overview || "" }),
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const aiData = await aiRes.json();

            // 2. Save to Firestore
            await addMovie({
                imdbID: movie.imdbID,
                userId: user.uid,
                title: movie.Title,
                year: movie.Year,
                poster_path: movie.Poster !== "N/A" ? movie.Poster : "",
                overview: movie.overview || "No overview available.",
                aiPitch: aiData.pitch || "An interesting movie to watch.",
                vibeTags: aiData.tags || ["Movie"],
                genres: movie.genres || [],
                watched: false,
                createdAt: Timestamp.now()
            });

            onClose();
            setQuery("");
            setResults([]);
        } catch (error: any) {
            console.error("Failed to add movie", error);
            alert(`Failed to add movie: ${error.message || error}`);
        } finally {
            setEnriching(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="Search for a movie..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="border-none bg-transparent focus-visible:ring-0 text-lg p-0 h-auto placeholder:text-gray-500"
                        autoFocus
                    />
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="overflow-y-auto p-4 space-y-2 flex-1 scrollbar-thin scrollbar-thumb-gray-800">
                    {loading && (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                        </div>
                    )}

                    {!loading && results.length === 0 && query && (
                        <div className="text-center text-gray-500 p-8">
                            No results found for "{query}"
                        </div>
                    )}

                    {results.map((movie) => (
                        <div
                            key={movie.imdbID}
                            className="flex gap-4 p-3 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors group"
                            onClick={() => handleSelectMovie(movie)}
                        >
                            <img
                                src={movie.Poster !== "N/A" ? movie.Poster : "/placeholder.png"}
                                alt={movie.Title}
                                className="w-16 h-24 object-cover rounded shadow-md group-hover:scale-105 transition-transform"
                            />
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-100">{movie.Title}</h3>
                                <p className="text-gray-400">{movie.Year}</p>
                                <div className="mt-2 flex items-center gap-2 text-xs text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-4 h-4" />
                                    Add to Collection
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {enriching && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white z-50">
                        <Loader2 className="w-12 h-12 animate-spin text-teal-500 mb-4" />
                        <h3 className="text-xl font-bold animate-pulse">Consulting the AI...</h3>
                        <p className="text-gray-400 text-sm mt-2">Generating pitch & vibes</p>
                    </div>
                )}
            </div>
        </div>
    );
}
