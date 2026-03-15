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

interface MediaListItemProps {
    item: MediaItem;
    mediaType: "movie" | "series";
    collectionTags?: string[];
}

export function MediaListItem({ item, mediaType, collectionTags = [] }: MediaListItemProps) {
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
            if (mediaType === "series") await deleteSeries(item.id);
            else await deleteMovie(item.id);
        } catch (error) {
            console.error("Failed to delete", error);
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const handleCancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDelete(false);
    };

    const handleRate = async (rating: number) => {
        if (mediaType === "series") await updateSeriesRating(item.id, rating);
        else await updateMovieRating(item.id, rating);
    };

    return (
        <>
            <div
                className={cn(
                    "flex gap-3 p-3 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-[1.01] hover:border-emerald-500/30 hover:brightness-110 active:scale-[0.98] cursor-pointer",
                    item.watched && "opacity-60"
                )}
                onClick={() => setDetailOpen(true)}
            >
                {/* Poster */}
                <div className="relative flex-shrink-0 w-16 h-24 rounded-xl overflow-hidden shadow-lg">
                    <img
                        src={item.poster_path !== "N/A" ? item.poster_path : "/placeholder-poster.png"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                    />
                    {item.watched && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                            <Check className="w-5 h-5 text-green-400" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    {/* Top row: title + year */}
                    <div>
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 flex-1">
                                {item.title}
                            </h3>
                            <span className="text-xs text-gray-500 flex-shrink-0 mt-0.5">{item.year}</span>
                        </div>

                        {/* Genre tags */}
                        {item.genres && item.genres.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                                {item.genres.slice(0, 2).map((g, i) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-900/50 text-teal-300 border border-teal-800/40">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Overview */}
                        {(item.overview || item.aiPitch) && (
                            <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                                {item.overview || item.aiPitch}
                            </p>
                        )}
                    </div>

                    {/* Bottom row: stars + actions */}
                    <div className="flex flex-col gap-1.5 mt-2">
                        {/* Stars + icon buttons row */}
                        <div className="flex items-center justify-between">
                            {/* Star rating */}
                            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button key={s} onClick={() => handleRate(s)} className="p-0.5 touch-manipulation">
                                        <Star className={cn(
                                            "w-3.5 h-3.5 transition-transform duration-200 active:scale-125",
                                            s <= (item.rating || 0)
                                                ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]"
                                                : "text-gray-700"
                                        )} />
                                    </button>
                                ))}
                            </div>

                            {/* Icon action buttons */}
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {confirmDelete ? (
                                    <>
                                        <button
                                            onClick={handleCancelDelete}
                                            disabled={deleting}
                                            className="text-[11px] text-gray-400 px-2 py-1 rounded-lg bg-gray-800 active:bg-gray-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleConfirmDelete}
                                            disabled={deleting}
                                            className="text-[11px] text-red-400 px-2 py-1 rounded-lg bg-red-900/20 active:bg-red-900/40"
                                        >
                                            {deleting ? "..." : "Delete"}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setSimilarOpen(true)}
                                            className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800/80 text-gray-500 active:bg-purple-900/30 active:text-purple-400 transition-colors"
                                            title="Similar movies"
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

                                        <button
                                            onClick={handleDeleteClick}
                                            className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-800/80 text-gray-500 active:bg-red-900/30 active:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Watched button — full width below */}
                        {!confirmDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleToggleWatched(); }}
                                className={cn(
                                    "w-full h-7 flex items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition-all duration-300",
                                    item.watched
                                        ? "bg-slate-800 text-gray-400 hover:bg-slate-700 active:bg-slate-700"
                                        : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:bg-emerald-400 active:bg-emerald-400"
                                )}
                            >
                                {item.watched ? (
                                    <><Eye className="w-3 h-3" /> Pending</>
                                ) : (
                                    <><Check className="w-3 h-3" /> Watched</>
                                )}
                            </button>
                        )}
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
