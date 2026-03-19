"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => {
                    console.log("[SW] Registered with fully automatic updates.");
                    
                    // Periodically check for updates (every 2.5 minutes)
                    setInterval(() => {
                        reg.update().catch(() => {});
                    }, 2.5 * 60 * 1000);

                    // Check for updates when coming back to the app from the background
                    document.addEventListener("visibilitychange", () => {
                        if (document.visibilityState === "visible") {
                            reg.update().catch(() => {});
                        }
                    });
                })
                .catch((err) => console.error("[SW] Registration failed:", err));

            // When the new SW takes over (because of skipWaiting), auto-refresh!
            let refreshing = false;
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (!refreshing) {
                    refreshing = true;
                    setTimeout(() => {
                        window.location.reload();
                    }, 200);
                }
            });
        }
    }, []);

    // Completely invisible, no banner rendered
    return null;
}
