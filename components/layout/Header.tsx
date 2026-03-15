"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Film, Tv } from "lucide-react";

export function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const navLinks = [
        { href: "/movies", label: "Movies", icon: Film, activeText: "text-emerald-400", activeBorder: "border-emerald-400" },
        { href: "/series", label: "Series", icon: Tv, activeText: "text-purple-400", activeBorder: "border-purple-400" },
    ];

    return (
        <header className="sticky top-0 z-50 bg-[#070d1a]/95 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 h-11 border-b border-white/5">
                <Link href="/movies" className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-teal-600 rounded-md flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">C</span>
                    </div>
                    <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        CineMatch
                    </span>
                </Link>
                {user && (
                    <div className="flex items-center gap-1.5">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName || "User"} className="w-6 h-6 rounded-full border border-white/15" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-gray-400" />
                            </div>
                        )}
                        <span className="hidden sm:inline text-xs text-gray-500 max-w-[100px] truncate">{user.displayName}</span>
                        <Button variant="ghost" size="icon" onClick={logout} className="w-6 h-6 text-gray-600 hover:text-white">
                            <LogOut className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </div>
            <div className="flex border-b border-white/5">
                {navLinks.map(({ href, label, icon: Icon, activeText, activeBorder }) => {
                    const isActive = pathname.startsWith(href);
                    return (
                        <Link key={href} href={href} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border-b-2 transition-all duration-200 ${isActive ? `${activeText} ${activeBorder}` : "border-transparent text-gray-600 hover:text-gray-300"}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </header>
    );
}