"use client";

import { useState, useEffect } from "react";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/use-pwa-install";

interface PWAInstallPromoProps {
    onContinueAnyway?: () => void;
}

export function PWAInstallPromo({ onContinueAnyway }: PWAInstallPromoProps) {
    const { isStandalone, deferredPrompt, promptInstall } = usePWAInstall();
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    // Only show if we have a native prompt available and we're not already standalone
    // AND we have hydrated on the client.
    if (!hasHydrated || isStandalone || !deferredPrompt) return null;

    const handleInstallClick = async () => {
        const success = await promptInstall();
        if (success && onContinueAnyway) {
            onContinueAnyway();
        }
    };

    return (
        <div className="w-full">
            <Button
                variant="outline"
                onClick={handleInstallClick}
                className="w-full border-[var(--moss)] text-[var(--moss)] hover:bg-[var(--moss)] hover:text-white flex items-center justify-center gap-2 py-6 rounded-2xl"
            >
                <Download className="w-5 h-5" />
                <span className="font-semibold text-lg">Install App</span>
            </Button>
        </div>
    );
}
