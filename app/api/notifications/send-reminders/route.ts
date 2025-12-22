import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webpush from "@/lib/web-push";
import { formatDateLocal } from "@/lib/utils";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        // 1. Check current hour (10 AM - 8 PM local time)
        // Since this runs on server, we should ideally know the user's timezone, 
        // but for now we'll use a standard offset or assume server/local parity for the PoC.
        const now = new Date();
        const hour = now.getHours();

        if (hour < 10 || hour > 20) {
            return NextResponse.json({ message: "Outside notification hours (10 AM - 8 PM)" });
        }

        const today = formatDateLocal(now);

        // 2. Find all users with push subscriptions
        const { data: subscriptions, error: subError } = await supabaseAdmin
            .from("push_subscriptions")
            .select("*, profile:user_id(id)");

        if (subError) throw subError;
        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: "No subscriptions found" });
        }

        // 3. For each user, check if they uploaded today
        const results = [];
        for (const sub of subscriptions) {
            const { count, error: photoError } = await supabaseAdmin
                .from("daily_photos")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", sub.user_id)
                .eq("date", today);

            if (photoError) continue;

            if (count === 0) {
                // 4. Send notification if no photo
                try {
                    await webpush.sendNotification(
                        sub.subscription,
                        JSON.stringify({
                            title: "Don't forget 1picday! 📸",
                            body: "Capture your daily moment before the day ends.",
                            url: "/app"
                        })
                    );
                    results.push({ user_id: sub.user_id, status: "sent" });
                } catch (pushError: any) {
                    console.error(`Failed to send to ${sub.user_id}:`, pushError);
                    if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                        // Clean up expired subscriptions
                        await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
                    }
                    results.push({ user_id: sub.user_id, status: "failed", error: pushError.message });
                }
            } else {
                results.push({ user_id: sub.user_id, status: "skipped (already uploaded)" });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("Send reminders error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
