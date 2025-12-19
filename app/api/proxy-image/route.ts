
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing URL", { status: 400 });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");

        const blob = await response.blob();
        const contentType = response.headers.get("content-type") || "image/jpeg";

        return new NextResponse(blob, {
            headers: {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600"
            },
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return new NextResponse("Failed to proxy image", { status: 500 });
    }
}
