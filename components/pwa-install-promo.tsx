"use client";

import { useState, useEffect } from "react";
import { Download, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/use-pwa-install";

interface PWAInstallPromoProps {
    onContinueAnyway?: () => void;
}

export function PWAInstallPromo({ onContinueAnyway }: PWAInstallPromoProps) {
    const { isStandalone, isIOS, deferredPrompt, promptInstall } = usePWAInstall();
    const [hasHydrated, setHasHydrated] = useState(false);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    // Show if:
    // 1. Not already standalone
    // 2. We have a native prompt (Android/Chrome) OR it's iOS
    if (!hasHydrated || isStandalone) return null;

    const canPromptNatively = !!deferredPrompt;
    if (!canPromptNatively && !isIOS) return null;

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            await promptInstall();
        } else if (isIOS) {
            // Toggle a subtle visual hint instead of an alert/drawer
            setShowHint(prev => !prev);
            // Auto-hide hint after 5 seconds
            setTimeout(() => setShowHint(false), 5000);
        }
    };

    return (
        <div className="w-full relative">
            <Button
                variant="outline"
                onClick={handleInstallClick}
                className="w-full border-[var(--moss)] text-[var(--moss)] hover:bg-[var(--moss)] hover:text-white flex items-center justify-center gap-2 py-6 rounded-2xl"
            >
                <Download className="w-5 h-5" />
                <span className="font-semibold text-lg">Install App</span>
            </Button>

            {showHint && isIOS && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-50">
                    <div className="bg-[var(--moss)] text-white text-xs px-3 py-1 rounded-full whitespace-nowrap mb-1">
                        Tap Share & Add to Home Screen
                    </div>
                    <ArrowDown className="w-6 h-6 text-[var(--moss)]" />
                </div>
            )}
        </div>
    );
}
