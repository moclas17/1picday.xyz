import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js"; // Direct usage for admin (service role)

export async function POST(request: Request) {
    const body = await request.text();
    const signature = headers().get("stripe-signature") as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Use Service Role to bypass RLS for admin updates based on Webhook
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;
            const userId = session.metadata?.userId;
            const subscriptionId = session.subscription;

            if (userId && subscriptionId) {
                await supabase
                    .from("profiles")
                    .update({ is_pro: true, stripe_subscription_id: subscriptionId, pro_since: new Date().toISOString() })
                    .eq("id", userId);
            }
            break;
        }
        case "customer.subscription.deleted": {
            const subscription = event.data.object as any;
            const customerId = subscription.customer;

            // Find user by customer ID
            const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single();
            if (profile) {
                await supabase.from("profiles").update({ is_pro: false }).eq("id", profile.id);
            }
            break;
        }
        // Handle other events like updated/payment_failed as needed
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
