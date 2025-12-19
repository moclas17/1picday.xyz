"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Photo {
    id: string;
    date: string;
    s3_key: string;
    note?: string | null;
}

export function RecapGrid({ photos }: { photos: Photo[] }) {
    return (
        <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
            {photos.map((photo, index) => (
                <PhotoThumbnail key={photo.id} photo={photo} isFirst={index === 0} />
            ))}
        </div>
    );
}

function PhotoThumbnail({ photo, isFirst }: { photo: Photo; isFirst: boolean }) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        const fetchUrl = async () => {
            const res = await fetch(`/api/s3/signed-read?key=${photo.s3_key}`);
            if (res.ok) {
                const data = await res.json();
                setSrc(data.url);
            }
        };
        fetchUrl();
    }, [photo.s3_key]);

    const dayName = new Date(photo.date).toLocaleDateString('en-US', { weekday: 'short' });

    if (!src) {
        return (
            <div className={`relative aspect-square bg-muted animate-pulse ${isFirst ? 'col-span-2 row-span-2' : ''}`} />
        );
    }

    return (
        <div className={`relative aspect-square bg-muted overflow-hidden ${isFirst ? 'col-span-2 row-span-2' : ''}`}>
            <Image
                src={src}
                alt={`Photo from ${photo.date}`}
                fill
                className="object-cover"
                unoptimized
            />
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-xs font-medium">
                {dayName}
            </div>
        </div>
    );
}
