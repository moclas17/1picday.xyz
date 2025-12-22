"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { useState, useEffect } from "react";

interface NotificationButtonProps {
    userId: string;
}

export function NotificationButton({ userId }: NotificationButtonProps) {
    const { permission, isSubscribed, isSupported, loading, subscribe } = useNotifications(userId);
    const [isPending, setIsPending] = useState(false);
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    if (!hasHydrated) return null;

    if (!isSupported) {
        return (
            <Button variant="ghost" size="icon" disabled className="w-9 h-9" title="Notifications require HTTPS or localhost">
                <BellOff className="w-4 h-4 text-[var(--ash)] opacity-30" />
            </Button>
        );
    }

    const handleToggle = async () => {
        setIsPending(true);
        try {
            await subscribe();
        } finally {
            setIsPending(false);
        }
    };

    if (loading) {
        return (
            <Button variant="ghost" size="icon" disabled className="w-9 h-9">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--ash)]" />
            </Button>
        );
    }

    if (permission === "denied") {
        return (
            <Button variant="ghost" size="icon" disabled className="w-9 h-9" title="Notifications blocked in browser">
                <BellOff className="w-4 h-4 text-red-500 opacity-50" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className={`w-9 h-9 transition-colors ${isSubscribed ? 'text-[var(--moss)]' : 'text-[var(--ash)] hover:text-[var(--ink)]'}`}
            title={isSubscribed ? "Notifications enabled" : "Enable notifications"}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Bell className={`w-4 h-4 ${isSubscribed ? 'fill-current' : ''}`} />
            )}
        </Button>
    );
}
