import { createSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { didToken } = await request.json();
        const userId = await createSession(didToken);
        return NextResponse.json({ success: true, userId });
    } catch (error: any) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
