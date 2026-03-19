"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export function ServiceWorkerRegistrar() {
    const [showUpdate, setShowUpdate] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => {
                    console.log("[SW] Registered:", reg.scope);
                    
                    // Cleanup checking if update found
                    reg.addEventListener("updatefound", () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener("statechange", () => {
                                // If installed and there's already a controller, it's an update
                                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                    setShowUpdate(true);
                                }
                            });
                        }
                    });
                })
                .catch((err) => console.error("[SW] Registration failed:", err));

            // Also detect if the new service worker took control immediately
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                setShowUpdate(true);
            });
        }
    }, []);

    const reloadPage = () => {
        // Force the page to reload which will fetch fresh assets using the new SW
        window.location.reload();
    };

    if (!showUpdate) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[100] animate-in fade-in slide-in-from-bottom-5">
            <div className="bg-zinc-800 border border-emerald-500/30 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-4 w-max max-w-[90vw]">
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">Nueva versión disponible 🚀</span>
                    <span className="text-xs text-zinc-400">Actualiza para ver los cambios.</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={reloadPage}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </button>
                    <button 
                        onClick={() => setShowUpdate(false)}
                        className="text-zinc-400 hover:text-white p-1.5 rounded-md transition-colors"
                        aria-label="Cerrar notificación"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
