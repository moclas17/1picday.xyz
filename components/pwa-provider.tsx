"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PWAContextType {
    deferredPrompt: any;
    isStandalone: boolean;
    isIOS: boolean;
    promptInstall: () => Promise<boolean>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Standalone detection
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone;
        setIsStandalone(!!standalone);

        // iOS detection
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        const handler = (e: any) => {
            console.log("PWA: beforeinstallprompt event captured");
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const promptInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA: User response to install prompt: ${outcome}`);
            setDeferredPrompt(null);
            return outcome === 'accepted';
        }
        return false;
    };

    return (
        <PWAContext.Provider value={{ deferredPrompt, isStandalone, isIOS, promptInstall }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error("usePWA must be used within a PWAProvider");
    }
    return context;
}
