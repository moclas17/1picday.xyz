import Stripe from "stripe";

const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_build_time_placeholder";

export const stripe = new Stripe(apiKey, {
    // @ts-ignore - version might not be in types yet if very recent
    apiVersion: '2025-12-15.clover',
    typescript: true,
});
