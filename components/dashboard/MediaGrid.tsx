"use client";

import { MediaItem } from "@/types";
import { MediaCard } from "./MediaCard";
import { MediaListItem } from "./MediaListItem";

interface MediaGridProps {
    items: MediaItem[];
    mediaType: "movie" | "series";
    viewMode?: "grid" | "list";
    collectionTags?: string[];
}

export function MediaGrid({ items, mediaType, viewMode = "grid", collectionTags = [] }: MediaGridProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                <p className="text-xl text-gray-500 mb-2">No {mediaType === "series" ? "series" : "movies"} found.</p>
                <p className="text-sm text-gray-600">Start by adding some to your collection.</p>
            </div>
        );
    }

    if (viewMode === "list") {
        return (
            <div className="flex flex-col gap-3">
                {items.map((item) => (
                    <MediaListItem key={item.id} item={item} mediaType={mediaType} collectionTags={collectionTags} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => (
                <MediaCard key={item.id} item={item} mediaType={mediaType} collectionTags={collectionTags} />
            ))}
        </div>
    );
}

