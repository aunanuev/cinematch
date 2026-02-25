"use client";

import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";

export function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">C</span>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        CineMatch
                    </span>
                </Link>

                {user && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || "User"}
                                    className="w-8 h-8 rounded-full border border-gray-700"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                            )}
                            <span className="hidden md:inline">{user.displayName}</span>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="text-gray-400 hover:text-white"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
}
