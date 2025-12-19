import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppClient } from "./client";

export default async function AppPage() {
    const session = await getSession();
    if (!session) redirect("/login");
    const user = session;

    const supabase = await createClient();

    // Fetch photos
    const { data: photos } = await supabase
        .from("daily_photos")
        .select("*")
        .eq("user_id", user.userId)
        .order("date", { ascending: false });

    // Check if pro
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.userId)
        .single();

    const isPro = profile?.is_pro || false;

    return <AppClient initialPhotos={photos || []} isPro={isPro} userId={user.userId} />;
}
