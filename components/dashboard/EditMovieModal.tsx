"use client";

import { useState } from "react";
import { Movie } from "@/types";
import { X, Save, Loader2 } from "lucide-react";
import { updateMovie } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";

interface EditMovieModalProps {
    movie: Movie;
    onClose: () => void;
}

export function EditMovieModal({ movie, onClose }: EditMovieModalProps) {
    const [title, setTitle] = useState(movie.title);
    const [year, setYear] = useState(movie.year);
    const [overview, setOverview] = useState(movie.overview || "");
    const [aiPitch, setAiPitch] = useState(movie.aiPitch || "");
    const [vibeTags, setVibeTags] = useState((movie.vibeTags || []).join(", "));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        if (!title.trim()) { setError("Title is required."); return; }
        setSaving(true);
        setError("");
        try {
            await updateMovie(movie.id, {
                title: title.trim(),
                year: year.trim(),
                overview: overview.trim(),
                aiPitch: aiPitch.trim(),
                vibeTags: vibeTags.split(",").map((t) => t.trim()).filter(Boolean),
            });
            onClose();
        } catch (e) {
            console.error(e);
            setError("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full sm:max-w-lg bg-slate-900 border border-white/8 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        {movie.poster_path && movie.poster_path !== "N/A" && (
                            <img
                                src={movie.poster_path}
                                alt={movie.title}
                                className="w-9 h-12 object-cover rounded-lg flex-shrink-0 opacity-80"
                            />
                        )}
                        <div>
                            <h2 className="text-base font-bold text-white leading-tight">Edit Movie</h2>
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{movie.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-800/60 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Year</label>
                        <input
                            type="text"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            maxLength={4}
                            className="w-full bg-slate-800/60 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Overview</label>
                        <textarea
                            value={overview}
                            onChange={(e) => setOverview(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-800/60 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-colors resize-none leading-relaxed"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Pitch</label>
                        <textarea
                            value={aiPitch}
                            onChange={(e) => setAiPitch(e.target.value)}
                            rows={2}
                            placeholder="The AI-generated sell text…"
                            className="w-full bg-slate-800/60 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-colors resize-none leading-relaxed"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Vibe Tags{" "}
                            <span className="normal-case font-normal text-slate-600">(comma-separated)</span>
                        </label>
                        <input
                            type="text"
                            value={vibeTags}
                            onChange={(e) => setVibeTags(e.target.value)}
                            placeholder="Dark, Heroic, Thought-provoking"
                            className="w-full bg-slate-800/60 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-colors"
                        />
                        {vibeTags.trim() && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {vibeTags
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean)
                                    .map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-300"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 pb-6 pt-3 flex gap-2 border-t border-white/5">
                    <Button
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl shadow-lg shadow-emerald-500/30 disabled:opacity-60"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-1.5" />
                                Save
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
