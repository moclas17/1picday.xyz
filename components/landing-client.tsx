"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PWAInstallPromo } from "@/components/pwa-install-promo";

interface LandingClientProps {
    showGetStarted: boolean;
}

export function LandingClient({ showGetStarted }: LandingClientProps) {
    const router = useRouter();

    if (!showGetStarted) return null;

    return (
        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
            <Button
                size="lg"
                onClick={() => router.push("/login")}
                className="w-full bg-[var(--moss)] text-[var(--paper)] hover:opacity-90 text-lg font-semibold py-6 h-auto"
            >
                Start today
                <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <PWAInstallPromo />

            <Button
                variant="outline"
                size="lg"
                className="w-full border-[var(--mist)] text-[var(--ink)] hover:bg-[var(--mist)] hover:bg-opacity-20 text-lg font-semibold py-6 h-auto"
                onClick={() => {
                    const el = document.getElementById('how-it-works');
                    el?.scrollIntoView({ behavior: 'smooth' });
                }}
            >
                See how it works
            </Button>
        </div>
    );
}
