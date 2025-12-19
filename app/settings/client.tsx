"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function SettingsClient() {
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/stripe/create-checkout", {
                method: "POST",
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Failed to start checkout");
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <div className="pt-4 border-t border-mist/20">
            <h4 className="font-medium text-ink mb-2">Upgrade to Pro</h4>
            <p className="text-sm text-stone mb-4">
                Unlock unlimited daily photos and support the development of 1picday.
            </p>
            <button
                onClick={handleUpgrade}
                disabled={loading}
                className="bg-moss text-white px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 flex items-center gap-2"
            >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Upgrade for $5/mo
            </button>
        </div>
    );
}
