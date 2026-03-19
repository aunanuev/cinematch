"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { subscribeToMovies } from "@/lib/firebase/firestore";
import { Movie } from "@/types";
import { Header } from "@/components/layout/Header";
import { MediaGrid } from "@/components/dashboard/MediaGrid";
import { GenreSection } from "@/components/dashboard/GenreSection";
import { AddMovieFab } from "@/components/dashboard/AddMovieFab";
import { AddMovieModal } from "@/components/dashboard/AddMovieModal";
import { LayoutGrid, List, Tag } from "lucide-react";
import { SearchAutocomplete } from "@/components/dashboard/SearchAutocomplete";

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [movies, setMovies] = useState<Movie[]>([]);
    const [filter, setFilter] = useState<"all" | "watched" | "pending">("pending");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [groupByGenre, setGroupByGenre] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            const unsubscribe = subscribeToMovies(user.uid, (data) => {
                setMovies(data);
            });
            return () => unsubscribe();
        }
    }, [user]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const filteredMovies = movies.filter(movie => {
        if (filter === "watched" && !movie.watched) return false;
        if (filter === "pending" && movie.watched) return false;
        if (searchQuery && !movie.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (selectedTag && !(movie.vibeTags || []).includes(selectedTag)) return false;
        return true;
    });

    const genreMap = useMemo(() => {
        const map = new Map<string, Movie[]>();
        for (const movie of filteredMovies) {
            const primaryGenre = movie.genres && movie.genres.length > 0 ? movie.genres[0] : "Uncategorized";
            if (!map.has(primaryGenre)) map.set(primaryGenre, []);
            map.get(primaryGenre)!.push(movie);
        }
        const sorted = new Map(
            [...map.entries()].sort(([a], [b]) => {
                if (a === "Uncategorized") return 1;
                if (b === "Uncategorized") return -1;
                return a.localeCompare(b);
            })
        );
        return sorted;
    }, [filteredMovies]);

    const watchedCount = movies.filter(m => m.watched).length;
    const pendingCount = movies.filter(m => !m.watched).length;

    // Collect all unique vibe tags across the full collection for chip row
    const allVibeTags = useMemo(() => {
        const tagSet = new Set<string>();
        movies.forEach(m => (m.vibeTags || []).forEach(t => tagSet.add(t)));
        return [...tagSet].sort();
    }, [movies]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0B1220] via-[#0F172A] to-[#020617] text-gray-100 font-sans">
            {/* Ambient glows */}
            <div className="fixed top-0 left-0 w-72 h-72 bg-teal-900/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-72 h-72 bg-purple-900/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header />

                {/* Search bar — sticky below header */}
                <div className="sticky top-[88px] z-40 bg-[#0B1220]/80 backdrop-blur-md border-b border-white/5">
                    <SearchAutocomplete
                        movies={movies}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                </div>

                {/* Main content */}
                <main className="flex-1 px-3 pt-2 pb-36">

                    {/* Vibe tag chip row (C1) — only when tags exist */}
                    {allVibeTags.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none -mx-3 px-3">
                            {allVibeTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(prev => prev === tag ? null : tag)}
                                    className={`flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${selectedTag === tag
                                        ? "bg-purple-600/30 border-purple-500/60 text-purple-300"
                                        : "bg-slate-900/60 border-white/8 text-gray-500 hover:border-white/20 hover:text-gray-300"
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Collection toolbar */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-gray-200">
                            Your Collection
                            <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800">
                                {filteredMovies.length}
                            </span>
                            {(searchQuery || selectedTag) && (
                                <span className="ml-2 text-xs text-emerald-400 font-normal">
                                    {searchQuery && `"${searchQuery}"`}{searchQuery && selectedTag && " · "}{selectedTag && `#${selectedTag}`}
                                </span>
                            )}
                        </h2>

                        <div className="flex items-center gap-3">
                            {/* Genre toggle */}
                            <button
                                onClick={() => setGroupByGenre(v => !v)}
                                title="Group by Genre"
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${groupByGenre
                                    ? "bg-emerald-600/20 border-emerald-600/50 text-emerald-300"
                                    : "bg-slate-900/60 border-white/5 text-gray-500"
                                    }`}
                            >
                                <Tag className="w-3 h-3" />
                                Genre
                            </button>

                            {/* View toggle */}
                            <div className="flex items-center bg-slate-900/60 border border-white/5 rounded-lg p-0.5">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === "grid" ? "bg-emerald-600 text-white" : "text-gray-500"
                                        }`}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === "list" ? "bg-emerald-600 text-white" : "text-gray-500"
                                        }`}
                                >
                                    <List className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Empty state */}
                    {filteredMovies.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            {searchQuery || selectedTag ? (
                                <>
                                    <p className="text-lg text-gray-500 mb-1">No matches found.</p>
                                    <p className="text-sm text-gray-600">Try a different search or clear the filter.</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg text-gray-500 mb-1">No movies here.</p>
                                    <p className="text-sm text-gray-600">Tap + to add your first one.</p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Render */}
                    {filteredMovies.length > 0 && (
                        groupByGenre ? (
                            <div className="space-y-8">
                                {[...genreMap.entries()].map(([genre, genreMovies]) => (
                                    <GenreSection
                                        key={genre}
                                        genre={genre}
                                        items={genreMovies}
                                        mediaType="movie"
                                        viewMode={viewMode}
                                    />
                                ))}
                            </div>
                        ) : (
                            <MediaGrid items={filteredMovies} mediaType="movie" viewMode={viewMode} collectionTags={allVibeTags} />
                        )
                    )}
                </main>
            </div>

            {/* Bottom filter tab bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1220]/90 backdrop-blur-md border-t border-white/5 pb-safe">
                <div className="flex px-4">
                    {[
                        { key: "pending", label: "To Watch", count: pendingCount },
                        { key: "watched", label: "Watched", count: watchedCount },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => { setFilter(tab.key as typeof filter); setSearchQuery(""); setSelectedTag(null); }}
                            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-t-2 -mt-px transition-all duration-300 ${
                                filter === tab.key
                                    ? "border-emerald-400 text-emerald-400"
                                    : "border-transparent text-gray-500 active:text-gray-300"
                            }`}
                        >
                            {tab.label}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                filter === tab.key ? "bg-emerald-900/50 text-emerald-300" : "bg-gray-800/60 text-gray-500"
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
                <AddMovieFab onClick={() => setIsAddModalOpen(true)} />
            </div>

            <AddMovieModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </div>
    );
}
