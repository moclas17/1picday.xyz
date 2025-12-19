"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginClient({ message }: { message?: string }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signIn = async () => {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/confirm`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSent(true);
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="flex flex-col gap-4 text-center animate-in fade-in zoom-in duration-300">
                <h1 className="text-2xl font-bold text-ink">Check your email</h1>
                <p className="text-stone">
                    We sent a magic link to <span className="font-medium text-ink">{email}</span>.
                </p>
                <button
                    onClick={() => setSent(false)}
                    className="text-moss hover:underline mt-4 text-sm"
                >
                    Try a different email
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-ink">1picday</h1>
                <p className="text-stone">Sign in to start your daily journal.</p>
            </div>

            <div className="flex flex-col gap-4 mt-4">
                <input
                    className={cn(
                        "rounded-md px-4 py-3 bg-mist/20 border border-transparent focus:border-moss focus:bg-paper outline-none transition-all text-ink placeholder:text-stone/50",
                        error && "border-red-500"
                    )}
                    name="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") signIn();
                    }}
                />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {message && (
                    <p className="text-stone text-sm text-center bg-mist/20 p-2 rounded">
                        {message}
                    </p>
                )}
                <button
                    onClick={signIn}
                    disabled={loading || !email}
                    className="bg-ink text-paper rounded-md px-4 py-3 font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
                >
                    {loading && <Loader2 className="animate-spin" size={18} />}
                    Send Magic Link
                </button>
            </div>
        </div>
    );
}
