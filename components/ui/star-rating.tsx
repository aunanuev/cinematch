"use client";
import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    className?: string;
}

export function StarRating({ rating = 0, onRatingChange, readonly = false, className }: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const handleMouseEnter = (index: number) => {
        if (!readonly) {
            setHoverRating(index);
        }
    };

    const handleMouseLeave = () => {
        setHoverRating(0);
    };

    const handleClick = (index: number) => {
        if (!readonly && onRatingChange) {
            // If clicking the same rating, optional: clear it (toggle off) or keep it.
            // Let's just set it.
            onRatingChange(index);
        }
    };

    return (
        <div className={cn("flex gap-1", className)} onMouseLeave={handleMouseLeave}>
            {[1, 2, 3, 4, 5].map((index) => {
                const filled = index <= (hoverRating || rating);
                return (
                    <Star
                        key={index}
                        className={cn(
                            "w-5 h-5 transition-all duration-200 cursor-pointer",
                            filled ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" : "text-gray-600",
                            readonly ? "cursor-default" : "hover:scale-110"
                        )}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onClick={() => handleClick(index)}
                    />
                );
            })}
        </div>
    );
}
