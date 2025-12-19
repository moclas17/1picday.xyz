import { getSession, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./client";

export default async function SettingsPage() {
    const session = await getSession();
    if (!session) redirect("/login");
    const user = session;

    const supabase = await createClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.userId)
        .single();

    const { count } = await supabase
        .from("daily_photos")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.userId);

    return (
        <SettingsClient
            email={user.email || ""}
            isPro={profile?.is_pro || false}
            photoCount={count || 0}
            proSince={profile?.pro_since}
        />
    );
}
