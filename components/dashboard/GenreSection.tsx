"use client";

import { useState } from "react";
import { Movie } from "@/types";
import { MovieGrid } from "./MovieGrid";
import { ChevronDown, ChevronRight } from "lucide-react";

interface GenreSectionProps {
    genre: string;
    movies: Movie[];
    viewMode: "grid" | "list";
}

export function GenreSection({ genre, movies, viewMode }: GenreSectionProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="space-y-3">
            {/* Section header */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center gap-3 w-full group"
            >
                <span className="text-gray-400 transition-transform duration-200 group-hover:text-gray-200">
                    {isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                </span>

                <h3 className="text-base font-bold text-gray-200 group-hover:text-white transition-colors">
                    {genre}
                </h3>

                <span className="text-xs font-medium text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800">
                    {movies.length}
                </span>

                {/* Divider line */}
                <div className="flex-1 h-px bg-gray-800/60 group-hover:bg-gray-700/60 transition-colors" />
            </button>

            {/* Collapsible content */}
            {isOpen && (
                <div className="pl-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <MovieGrid movies={movies} viewMode={viewMode} />
                </div>
            )}
        </div>
    );
}
