import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPresignedUploadUrl } from "@/lib/s3";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        console.error("Presign: No session found");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session;
    console.log("Presign: User authenticated", user.userId);

    try {
        const supabase = await createClient();

        // 1. Check constraints
        const today = new Date().toISOString().split("T")[0];

        // Check if uploaded today
        const { data: todayPhoto, error: todayError } = await supabase
            .from("daily_photos")
            .select("id")
            .eq("user_id", user.userId)
            .eq("date", today)
            .single();

        if (todayPhoto) {
            return NextResponse.json({ error: "You have already uploaded a photo today." }, { status: 403 });
        }

        // Check usage limits
        const { count, error: countError } = await supabase
            .from("daily_photos")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", user.userId);

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_pro")
            .eq("id", user.userId)
            .single();

        const isPro = profile?.is_pro || false;
        const photoCount = count || 0;

        if (!isPro && photoCount >= 7) {
            return NextResponse.json({ error: "Free limit reached (7 photos). Upgrade to Pro to continue.", code: "LIMIT_REACHED" }, { status: 403 });
        }

        // 2. Generate Key
        const body = await request.json();
        const contentType = body.contentType;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
            return NextResponse.json({ error: "Invalid Content-Type. Only JPEG, PNG, and WebP allow." }, { status: 400 });
        }

        const ext = contentType.split('/')[1];
        const year = new Date().getFullYear();
        const key = `${user.userId}/${year}/${today}.${ext}`;
        const bucket = process.env.AWS_S3_BUCKET!;

        // 3. Get Presigned URL
        // Standardize on octet-stream to avoid signature/preflight issues with specific image types
        const uploadContentType = "application/octet-stream";
        console.log("Presign: Generating URL for bucket", bucket, "key", key);
        const url = await getPresignedUploadUrl(bucket, key, uploadContentType);

        console.log("Presign: Success", url);

        return NextResponse.json({ url, key, bucket, date: today });
    } catch (e: any) {
        console.error("Presign API Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
