"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus, X, Tv } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { addSeries } from "@/lib/firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { getIdToken } from "@/lib/getIdToken";

interface AddSeriesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEBOUNCE_MS = 350;
const MAX_SUGGESTIONS = 6;

export function AddSeriesModal({ isOpen, onClose }: AddSeriesModalProps) {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [enriching, setEnriching] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced typeahead: fires TMDB series search as-you-type
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setSuggestions([]);
            setDropdownOpen(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/series/search?s=${encodeURIComponent(trimmed)}`);
                const data = await res.json();
                const hits = (data.Search ?? []).slice(0, MAX_SUGGESTIONS);
                setSuggestions(hits);
                setDropdownOpen(hits.length > 0);
                setActiveIndex(-1);
            } catch {
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelectSeries = useCallback(async (series: any) => {
        if (!user) return;
        setDropdownOpen(false);
        setQuery(series.Title);
        setSuggestions([]);
        setEnriching(true);

        try {
            const token = await getIdToken();
            const aiRes = await fetch("/api/series/enrich", {
                method: "POST",
                body: JSON.stringify({ title: series.Title, overview: series.overview || "" }),
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const aiData = await aiRes.json();

            await addSeries({
                imdbID: series.imdbID,
                userId: user.uid,
                title: series.Title,
                year: series.Year,
                poster_path: series.Poster !== "N/A" ? series.Poster : "",
                overview: series.overview || "No overview available.",
                aiPitch: aiData.pitch || "An interesting series to watch.",
                vibeTags: aiData.tags || ["Series"],
                genres: series.genres || [],
                watched: false,
                createdAt: Timestamp.now(),
            });

            handleClose();
        } catch (error: any) {
            console.error("Failed to add series", error);
            alert(`Failed to add series: ${error.message || error}`);
        } finally {
            setEnriching(false);
        }
    }, [user]);

    const handleClose = () => {
        setQuery("");
        setSuggestions([]);
        setDropdownOpen(false);
        setActiveIndex(-1);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!dropdownOpen || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            handleSelectSeries(suggestions[activeIndex]);
        } else if (e.key === "Escape") {
            setDropdownOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-16 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg" ref={containerRef}>
                {/* Input card */}
                <div className="w-full bg-[#0f1929] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3.5">
                        {loading ? (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
                        ) : (
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search for a TV series to add..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => suggestions.length > 0 && setDropdownOpen(true)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="flex-1 bg-transparent text-base text-gray-100 placeholder:text-gray-500 outline-none"
                        />
                        {query && (
                            <button
                                onClick={() => { setQuery(""); setSuggestions([]); setDropdownOpen(false); }}
                                className="text-gray-600 hover:text-gray-300 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="text-gray-600 hover:text-gray-300 transition-colors ml-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Hint text when empty */}
                    {query.trim().length === 0 && (
                        <p className="px-4 pb-4 text-xs text-gray-600">
                            Type at least 2 characters to see suggestions from TMDB.
                        </p>
                    )}
                </div>

                {/* Dropdown suggestions */}
                {dropdownOpen && suggestions.length > 0 && (
                    <div className="mt-2 w-full bg-[#0f1929] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                        {suggestions.map((series, idx) => (
                            <button
                                key={series.imdbID || idx}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectSeries(series);
                                }}
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 border-b border-white/5 last:border-0 ${idx === activeIndex ? "bg-purple-600/20" : "hover:bg-white/5"
                                    }`}
                            >
                                {/* Poster */}
                                {series.Poster && series.Poster !== "N/A" ? (
                                    <img
                                        src={series.Poster}
                                        alt={series.Title}
                                        className="w-8 h-12 object-cover rounded flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-8 h-12 bg-slate-700/60 rounded flex-shrink-0 flex items-center justify-center">
                                        <Tv className="w-3 h-3 text-gray-600" />
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-100 truncate">{series.Title}</p>
                                    <p className="text-xs text-gray-500">{series.Year}</p>
                                </div>

                                {/* Add hint */}
                                <div className="flex items-center gap-1 text-[11px] text-purple-400/70 flex-shrink-0">
                                    <Plus className="w-3.5 h-3.5" />
                                    Add
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* No results */}
                {query.trim().length >= 2 && !loading && suggestions.length === 0 && !dropdownOpen && (
                    <div className="mt-2 w-full bg-[#0f1929] border border-white/10 rounded-2xl shadow-xl px-4 py-6 text-center text-sm text-gray-500">
                        No series found for &quot;{query}&quot;
                    </div>
                )}
            </div>

            {/* AI enriching overlay */}
            {enriching && (
                <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center text-white z-[60]">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                    <h3 className="text-xl font-bold animate-pulse">Consulting the AI...</h3>
                    <p className="text-gray-400 text-sm mt-2">Generating pitch &amp; vibes</p>
                </div>
            )}
        </div>
    );
}
