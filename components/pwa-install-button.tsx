"use client";

import { useState, useEffect } from "react";

import { Download, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "./pwa-provider";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";

export function PWAInstallButton() {
    const { deferredPrompt, isStandalone, isIOS, promptInstall } = usePWA();
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isStandalone) {
            setIsVisible(false);
            return;
        }

        if (isIOS || deferredPrompt) {
            setIsVisible(true);
        }
    }, [isStandalone, isIOS, deferredPrompt]);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
            return;
        }

        if (!deferredPrompt) return;
        await promptInstall();
    };

    if (!isVisible) return null;

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleInstallClick}
                className="text-[var(--stone)] hover:text-[var(--ink)] hover:bg-[var(--mist)] hover:bg-opacity-50"
                title="Install App"
            >
                <Download className="w-5 h-5" />
                <span className="sr-only">Install App</span>
            </Button>

            <Drawer open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
                <DrawerContent className="bg-[var(--paper)] border-[var(--mist)]">
                    <DrawerHeader>
                        <DrawerTitle className="text-[var(--ink)]">Install 1picday</DrawerTitle>
                        <DrawerDescription className="text-[var(--stone)]">
                            Add this app to your home screen for the best experience.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-[var(--mist)] p-2 rounded-lg">
                                <Share className="w-6 h-6 text-[var(--moss)]" />
                            </div>
                            <p className="text-[var(--ink)]">1. Tap the <span className="font-bold">Share</span> button in your browser menu.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-[var(--mist)] p-2 rounded-lg">
                                <PlusSquare className="w-6 h-6 text-[var(--moss)]" />
                            </div>
                            <p className="text-[var(--ink)]">2. Scroll down and tap <span className="font-bold">Add to Home Screen</span>.</p>
                        </div>
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline" className="border-[var(--mist)] text-[var(--stone)]">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}
