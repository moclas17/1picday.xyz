import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecapClient } from "./client";

export default async function RecapPage() {
    const session = await getSession();
    if (!session) redirect("/login");
    const user = session;

    const supabase = await createClient();

    // Get last 7 photos
    const { data: photos } = await supabase
        .from("daily_photos")
        .select("*")
        .eq("user_id", user.userId)
        .order("date", { ascending: false })
        .limit(30);

    return <RecapClient photos={photos || []} userId={user.userId} />;
}
