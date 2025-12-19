"use client";

import { useState } from "react";
import { Loader2, Camera } from "lucide-react";
import { useRouter } from "next/navigation";

export function UploadSection() {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError("File size too large (max 10MB).");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // 1. Get Presigned URL
            const presignRes = await fetch("/api/s3/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contentType: file.type }),
            });

            const presignData = await presignRes.json();

            if (!presignRes.ok) {
                throw new Error(presignData.error || "Failed to get upload URL");
            }

            const { url, key, bucket, date } = presignData;

            // 2. Upload to S3
            const uploadRes = await fetch(url, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            if (!uploadRes.ok) {
                throw new Error("Failed to upload image to storage.");
            }

            // 3. Commit to DB
            const commitRes = await fetch("/api/photos/commit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key,
                    bucket,
                    date,
                    mime_type: file.type,
                }),
            });

            if (!commitRes.ok) {
                throw new Error("Failed to save photo record.");
            }

            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full">
            <label className="block w-full cursor-pointer">
                <div className="relative group w-full aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-4 transition-all hover:bg-muted/50 hover:border-accent overflow-hidden">
                    <input
                        type="file"
                        className="sr-only"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center animate-pulse">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Uploading your moment...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 group-hover:scale-105 transition-transform">
                            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center shadow-lg">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-foreground">Capture today&apos;s moment</p>
                                <p className="text-xs text-muted-foreground mt-1">Tap to upload a photo</p>
                            </div>
                        </div>
                    )}
                </div>
            </label>

            {error && (
                <div className="mt-3 p-3 bg-destructive/10 text-destructive text-sm rounded-xl text-center font-medium animate-in slide-in-from-top-2">
                    {error}
                </div>
            )}
        </div>
    );
}
