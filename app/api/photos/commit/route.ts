import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session;
    const supabase = await createClient();

    const body = await request.json();
    const { key, bucket, date, mime_type } = body;

    if (!key || !bucket || !date || !mime_type) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert into DB
    const { error } = await supabase.from("daily_photos").insert({
        user_id: user.userId,
        date,
        s3_key: key,
        s3_bucket: bucket,
        mime_type: mime_type,
    });

    if (error) {
        if (error.code === '23505') { // Unique violation
            return NextResponse.json({ error: "Photo already exists for this date." }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
