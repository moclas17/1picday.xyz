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
        const { searchParams } = new URL(req.url);
        const force = searchParams.get("force") === "true";

        // 1. Check current hour (10 AM - 8 PM local time)
        const now = new Date();
        const hour = now.getHours();

        console.log(`Notifications Check: Server Time: ${now.toISOString()}, Local Hour: ${hour}, Force: ${force}`);

        // Limit range: 10:00 AM to 7:59 PM (inclusive of 10, up to but not including 20)
        // If the user wants 8 PM included, it should be hour < 21.
        // User said "10am a 8pm", so we'll allow hours 10 through 19.
        if (!force && (hour < 10 || hour >= 20)) {
            return NextResponse.json({
                message: "Outside notification hours (10 AM - 8 PM)",
                server_hour: hour,
                server_time: now.toISOString(),
                tip: "Use ?force=true to test outside these hours"
            });
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
