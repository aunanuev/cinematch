"use client";

import { useState } from "react";
import { MediaItem } from "@/types";
import { Check, Trash2, Eye, Sparkles, Star, BookOpen, PlayCircle } from "lucide-react";
import { deleteMovie, toggleMovieWatched, updateMovieRating, deleteSeries, toggleSeriesWatched, updateSeriesRating } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";
import { SimilarMediaModal } from "./SimilarMediaModal";

import { DiaryModal } from "./DiaryModal";
import { TrailerModal } from "./TrailerModal";
import { MediaDetailModal } from "./MediaDetailModal";

interface MediaCardProps {
    item: MediaItem;
    mediaType: "movie" | "series";
    collectionTags?: string[];
}

export function MediaCard({ item, mediaType, collectionTags = [] }: MediaCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [similarOpen, setSimilarOpen] = useState(false);

    const [diaryOpen, setDiaryOpen] = useState(false);
    const [trailerOpen, setTrailerOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);

    const handleToggleWatched = async () => {
        if (mediaType === "series") await toggleSeriesWatched(item.id, item.watched);
        else await toggleMovieWatched(item.id, item.watched);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDelete(true);
    };

    const handleConfirmDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleting(true);
        try {
            await deleteMovie(item.id);
        } catch (error) {
            console.error("Failed to delete movie", error);
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const handleCancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDelete(false);
    };

    return (
        <>
            <div className={cn(
                "rounded-2xl overflow-hidden bg-slate-900/70 backdrop-blur-md border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex flex-col transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/30 hover:brightness-110 active:scale-[0.98]",
                item.watched && "opacity-60"
            )}>
                {/* Poster — tap to open detail */}
                <div
                    className="relative aspect-[2/3] w-full overflow-hidden cursor-pointer"
                    onClick={() => setDetailOpen(true)}
                >
                    <img
                        src={item.poster_path !== "N/A" ? item.poster_path : "/placeholder-poster.png"}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Tap hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <span className="text-[10px] font-semibold text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                            View details
                        </span>
                    </div>

                    {/* Watched badge */}
                    {item.watched && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            WATCHED
                        </div>
                    )}

                    {/* Top-right actions */}
                    <div className="absolute top-2 right-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {confirmDelete ? (
                            <div className="flex gap-1">
                                <button onClick={handleCancelDelete} className="bg-gray-800/90 text-gray-300 text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm">
                                    ✕
                                </button>
                                <button onClick={handleConfirmDelete} disabled={deleting} className="bg-red-600/90 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm">
                                    {deleting ? "..." : "Del"}
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-1">
                                <button
                                    onClick={handleDeleteClick}
                                    className="w-7 h-7 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center text-gray-400 active:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="p-2 flex flex-col justify-between gap-1.5 flex-1">
                    {/* Title */}
                    <h3 className="font-bold text-white text-xs leading-snug line-clamp-2">
                        {item.title}
                    </h3>
                    <span className="text-[10px] text-gray-500">{item.year}</span>

                    {/* Stars */}
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} onClick={() => updateMovieRating(item.id, s)} className="p-0.5 touch-manipulation">
                                <Star className={cn(
                                    "w-3.5 h-3.5 transition-transform duration-200 active:scale-125",
                                    s <= (item.rating || 0)
                                        ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]"
                                        : "text-gray-700"
                                )} />
                            </button>
                        ))}
                    </div>

                    {/* Action row */}
                    <div className="flex gap-1 mt-auto pt-1">
                        <button
                            onClick={handleToggleWatched}
                            className={cn(
                                "flex-1 h-7 rounded-2xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all duration-300",
                                item.watched
                                    ? "bg-slate-800 text-gray-400 hover:bg-slate-700 active:bg-slate-700"
                                    : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:bg-emerald-400 active:bg-emerald-400"
                            )}
                        >
                            {item.watched ? <><Eye className="w-3 h-3" />Unwatched</> : <><Check className="w-3 h-3" />Watched</>}
                        </button>
                        <button
                            onClick={() => setSimilarOpen(true)}
                            className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800/80 text-gray-500 active:bg-purple-900/30 active:text-purple-400 transition-colors"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setDiaryOpen(true)}
                            className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800/80 text-gray-500 active:bg-purple-900/30 active:text-purple-400 transition-colors"
                            title="AI Diary"
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setTrailerOpen(true)}
                            className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800/80 text-gray-500 active:bg-red-900/30 active:text-red-400 transition-colors"
                            title="Watch Trailer"
                        >
                            <PlayCircle className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {similarOpen && (
                <SimilarMediaModal movie={item} mediaType={mediaType} onClose={() => setSimilarOpen(false)} />
            )}

            {diaryOpen && (
                <DiaryModal movie={item} mediaType={mediaType} collectionTags={collectionTags} onClose={() => setDiaryOpen(false)} />
            )}
            {trailerOpen && (
                <TrailerModal movie={item} mediaType={mediaType} onClose={() => setTrailerOpen(false)} />
            )}
            {detailOpen && (
                <MediaDetailModal
                    movie={item}
                    mediaType={mediaType}
                    onClose={() => setDetailOpen(false)}
                    onOpenSimilar={() => setSimilarOpen(true)}
                    onOpenDiary={() => setDiaryOpen(true)}
                    onOpenTrailer={() => setTrailerOpen(true)}
                />
            )}
        </>
    );
}
