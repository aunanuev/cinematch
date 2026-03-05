"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Movie } from "@/types";

interface SearchAutocompleteProps {
    movies: Movie[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
}

const MAX_SUGGESTIONS = 6;

export function SearchAutocomplete({
    movies,
    searchQuery,
    setSearchQuery,
}: SearchAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Suggestions: up to MAX_SUGGESTIONS movies matching the query
    const suggestions = searchQuery.trim().length === 0
        ? []
        : movies
            .filter((m) =>
                m.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, MAX_SUGGESTIONS);

    // Reset active row whenever suggestions change
    useEffect(() => {
        setActiveIndex(-1);
    }, [searchQuery]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelect = useCallback(
        (title: string) => {
            setSearchQuery(title);
            setOpen(false);
            inputRef.current?.blur();
        },
        [setSearchQuery]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIndex].title);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div className="px-3 py-1.5" ref={containerRef}>
            {/* Input wrapper */}
            <div className="relative flex items-center gap-2 bg-slate-800/60 border border-white/8 rounded-xl px-3 py-1.5 transition-all duration-200 focus-within:border-emerald-500/40 focus-within:bg-slate-800/80">
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search your collection..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none"
                />
                {searchQuery && (
                    <button
                        onClick={() => { setSearchQuery(""); setOpen(false); }}
                        className="text-gray-600 hover:text-gray-400 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {open && suggestions.length > 0 && (
                <div className="absolute left-3 right-3 mt-1.5 bg-[#0f1929] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {suggestions.map((movie, idx) => (
                        <button
                            key={movie.id}
                            onMouseDown={(e) => {
                                e.preventDefault(); // keep focus on input
                                handleSelect(movie.title);
                            }}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-100 ${idx === activeIndex
                                ? "bg-emerald-600/20"
                                : "hover:bg-white/5"
                                }`}
                        >
                            {/* Poster thumbnail */}
                            {movie.poster_path ? (
                                <img
                                    src={movie.poster_path}
                                    alt={movie.title}
                                    className="w-8 h-12 object-cover rounded flex-shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-12 bg-slate-700 rounded flex-shrink-0" />
                            )}

                            {/* Title + year */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-100 truncate">{movie.title}</p>
                                <p className="text-xs text-gray-500">{movie.year}</p>
                            </div>

                            {/* Status badge */}
                            <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${movie.watched
                                ? "bg-emerald-900/50 text-emerald-300"
                                : "bg-slate-700/60 text-gray-400"
                                }`}>
                                {movie.watched ? "Watched" : "Pending"}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
