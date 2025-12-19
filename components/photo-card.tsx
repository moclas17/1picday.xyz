"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface Photo {
    id: string;
    date: string;
    s3_key: string;
    note?: string | null;
}

export function PhotoCard({ photo }: { photo: Photo }) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        // Check if we have a presigned URL already or fetch it?
        // The API is api/s3/signed-read?key=...
        const fetchUrl = async () => {
            const res = await fetch(`/api/s3/signed-read?key=${photo.s3_key}`);
            if (res.ok) {
                const data = await res.json();
                setSrc(data.url);
            }
        }
        fetchUrl();
    }, [photo.s3_key]);

    if (!src) return <div className="w-full aspect-[4/5] bg-mist/20 animate-pulse rounded-md" />;

    return (
        <div className="flex flex-col gap-2">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-mist/10">
                <Image
                    src={src}
                    alt={`Photo for ${photo.date}`}
                    fill
                    className="object-cover transition-transform hover:scale-105 duration-500"
                    unoptimized
                />
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-ink">{photo.date}</span>
                {photo.note && <span className="text-xs text-stone">{photo.note}</span>}
            </div>
        </div>
    );
}
