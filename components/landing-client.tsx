"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, Share, PlusSquare, ArrowRight } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";

interface LandingClientProps {
    showGetStarted: boolean;
}

export function LandingClient({ showGetStarted }: LandingClientProps) {
    const router = useRouter();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showInstallDrawer, setShowInstallDrawer] = useState(false);

    useEffect(() => {
        // Check if standalone
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(!!standalone);

        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleStartClick = async () => {
        // If already in PWA mode, just go to login
        if (isStandalone) {
            router.push("/login");
            return;
        }

        // If not standalone, try to prompt install
        if (isIOS) {
            setShowInstallDrawer(true);
            return;
        }

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredPrompt(null);
            // Optionally redirect anyway after prompt
            router.push("/login");
        } else {
            // No prompt available (maybe already installed elsewhere or browser doesn't support)
            // Or just proceed to login
            router.push("/login");
        }
    };

    if (!showGetStarted) return null;

    return (
        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
            <Button
                size="lg"
                onClick={handleStartClick}
                className="w-full bg-[var(--moss)] text-[var(--paper)] hover:opacity-90 text-lg font-semibold py-6 h-auto"
            >
                Start today
                <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <Button
                variant="outline"
                size="lg"
                className="w-full border-[var(--mist)] text-[var(--ink)] hover:bg-[var(--mist)] hover:bg-opacity-20 text-lg font-semibold py-6 h-auto"
            >
                See how it works
            </Button>

            <Drawer open={showInstallDrawer} onOpenChange={setShowInstallDrawer}>
                <DrawerContent className="bg-[var(--paper)] border-[var(--mist)] p-6">
                    <DrawerHeader className="p-0 mb-6">
                        <DrawerTitle className="text-2xl font-bold text-[var(--ink)] mb-2">Install 1picday</DrawerTitle>
                        <DrawerDescription className="text-[var(--stone)] text-pretty">
                            Add this app to your home screen for the best experience. It takes just a few seconds!
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="space-y-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-[var(--mist)] p-3 rounded-xl">
                                <Share className="w-6 h-6 text-[var(--moss)]" />
                            </div>
                            <p className="text-[var(--ink)] font-medium">1. Tap the <span className="font-bold underline">Share</span> button in your browser menu.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-[var(--mist)] p-3 rounded-xl">
                                <PlusSquare className="w-6 h-6 text-[var(--moss)]" />
                            </div>
                            <p className="text-[var(--ink)] font-medium">2. Scroll down and tap <span className="font-bold underline">Add to Home Screen</span>.</p>
                        </div>
                    </div>
                    <DrawerFooter className="p-0">
                        <Button
                            className="w-full bg-[var(--moss)] text-[var(--paper)] py-6"
                            onClick={() => router.push("/login")}
                        >
                            Continue anyway
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="ghost" className="text-[var(--stone)] py-4">Wait, not yet</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
