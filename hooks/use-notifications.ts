"use client";

import { useState, useEffect } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function useNotifications(userId: string) {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supported = typeof window !== "undefined" &&
            "Notification" in window &&
            "serviceWorker" in navigator &&
            (window.isSecureContext || window.location.hostname === "localhost");

        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (e) {
            console.error("Check subscription error:", e);
        } finally {
            setLoading(false);
        }
    };

    const subscribe = async () => {
        if (!("Notification" in window)) return false;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === "granted") {
                const registration = await navigator.serviceWorker.ready;

                // Convert VAPID key to Uint8Array
                const base64 = (VAPID_PUBLIC_KEY || "").replace(/-/g, "+").replace(/_/g, "/");
                const padding = "=".repeat((4 - (base64.length % 4)) % 4);
                const fullBase64 = base64 + padding;
                const rawData = window.atob(fullBase64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: outputArray
                });

                // Send to backend
                const res = await fetch("/api/notifications/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subscription, userId })
                });

                if (res.ok) {
                    setIsSubscribed(true);
                    return true;
                }
            }
        } catch (e) {
            console.error("Subscribe error:", e);
        }
        return false;
    };

    return {
        permission,
        isSubscribed,
        isSupported,
        loading,
        subscribe
    };
}
