"use client";

import { useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
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

            router.refresh(); // Refresh to show new photo
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full border-2 border-dashed border-mist rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center hover:bg-mist/5 transition-colors">
            <div className="bg-paper p-3 rounded-full shadow-sm">
                {uploading ? <Loader2 className="animate-spin text-moss" /> : <UploadCloud className="text-moss" />}
            </div>
            <div>
                <h3 className="font-medium text-ink">Upload today&apos;s photo</h3>
                <p className="text-stone text-sm">One photo per day. Max 10MB.</p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <label className="cursor-pointer bg-ink text-paper px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
                Choose File
                <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </label>
        </div>
    );
}
