"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddMovieFabProps {
    onClick: () => void;
}

export function AddMovieFab({ onClick }: AddMovieFabProps) {
    return (
        <Button
            onClick={onClick}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 hover:scale-110 transition-all duration-300 z-40 flex items-center justify-center p-0"
        >
            <Plus className="w-8 h-8 text-white" />
        </Button>
    );
}
