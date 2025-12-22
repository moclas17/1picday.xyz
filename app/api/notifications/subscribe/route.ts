import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { subscription, userId } = await req.json();

        if (!subscription || !userId) {
            return NextResponse.json({ error: "Missing subscription or userId" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("push_subscriptions")
            .upsert({
                user_id: userId,
                subscription: subscription,
            }, {
                onConflict: 'user_id'
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Subscription error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
