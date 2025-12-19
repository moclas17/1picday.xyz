import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { redirect } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import SettingsClient from "./client";

export default async function SettingsPage({
    searchParams
}: {
    searchParams: { success?: string; canceled?: string }
}) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    const isPro = profile?.is_pro || false;

    // Count photos for context
    const { count } = await supabase
        .from("daily_photos")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 w-full max-w-2xl mx-auto p-6 flex flex-col gap-8">
                <h1 className="text-2xl font-bold text-ink">Settings</h1>

                {searchParams.success && (
                    <div className="bg-moss/20 text-moss px-4 py-3 rounded-md flex items-center gap-2">
                        <Check size={18} />
                        <span>Subscription successful! You are now a Pro member.</span>
                    </div>
                )}

                <div className="bg-paper border border-mist rounded-xl p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-center pb-4 border-b border-mist/20">
                        <div>
                            <h3 className="font-medium text-ink">Account</h3>
                            <p className="text-stone text-sm">{profile?.email}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h3 className="font-medium text-ink">Subscription Plan</h3>
                        <div className="flex items-center gap-2">
                            <span className={isPro ? "text-moss font-bold" : "text-stone"}>
                                {isPro ? "Pro Plan" : "Free Plan"}
                            </span>
                            {!isPro && <span className="text-xs bg-mist/30 px-2 py-1 rounded text-stone">Limited to 7 photos</span>}
                        </div>
                        <p className="text-sm text-stone mt-1">
                            You have uploaded <span className="text-ink font-medium">{count || 0}</span> photos.
                        </p>
                    </div>

                    {!isPro && (
                        <SettingsClient />
                    )}

                    {isPro && (
                        <div className="bg-mist/10 p-4 rounded-md text-sm text-stone">
                            You have unlimited uploads. Thank you for supporting 1picday!
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
