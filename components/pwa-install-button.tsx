"use client";

import { useState, useEffect } from "react";
import { Download, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Check if standalone
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) {
            setIsVisible(false);
            return;
        }

        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        if (ios) {
            setIsVisible(true);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
            return;
        }

        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        setDeferredPrompt(null);
        setIsVisible(false);
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
