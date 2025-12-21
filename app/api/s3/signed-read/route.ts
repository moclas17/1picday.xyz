import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedReadUrl } from "@/lib/s3";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session;

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
        return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // Security check: Ensure the key belongs to the user
    if (!key.startsWith(`users/${user.userId}/`)) {
        // Strict check: the key must start with {userId}/
        // This prevents reading other users' files even if they guess the key
        return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const bucket = process.env.AWS_S3_BUCKET!;
    const url = await getSignedReadUrl(bucket, key);

    return NextResponse.json({ url });
}
