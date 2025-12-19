import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const authSession = await getSession();
    if (!authSession) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = authSession;
    const supabase = await createClient();

    // Get or create customer
    const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.userId)
        .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
                userId: user.userId,
            },
        });
        customerId = customer.id;
        await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.userId);
    }

    const priceId = process.env.STRIPE_PRICE_ID_PRO!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: `${appUrl}/settings?success=1`,
        cancel_url: `${appUrl}/settings?canceled=1`,
        metadata: {
            userId: user.userId
        }
    });

    return NextResponse.json({ url: session.url });
}
