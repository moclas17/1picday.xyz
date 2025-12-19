"use client"

import { useState, useEffect } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"
import Image from "next/image"
import { Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CollageGenerator } from "@/components/collage-generator"

interface Photo {
    id: string
    date: string
    s3_key: string
    note?: string | null
    url?: string
}

interface RecapClientProps {
    photos: Photo[]
}

export function RecapClient({ photos }: RecapClientProps) {
    const [showCollage, setShowCollage] = useState(false)

    return (
        <div className="min-h-screen bg-[var(--paper)] pb-20">
            <AppHeader />

            <main className="max-w-2xl mx-auto px-4 pt-20 pb-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--ink)]">Your Week</h1>
                        <p className="text-[var(--stone)]">Last 7 moments captured</p>
                    </div>
                    {photos.length > 2 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCollage(true)}
                            className="text-[var(--moss)] border-[var(--moss)] hover:bg-[var(--moss)] hover:text-white"
                        >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Magic Collage
                        </Button>
                    )}
                </div>

                {photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1 rounded-[var(--radius)] overflow-hidden">
                        {photos.map((photo, index) => (
                            <PhotoThumbnail
                                key={photo.id}
                                photo={photo}
                                isFirst={index === 0}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-[var(--mist)] rounded-[var(--radius)] p-12 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[var(--mist)] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--ash)]">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                        </div>
                        <p className="text-[var(--stone)]">No photos in your recap yet</p>
                    </div>
                )}
            </main>

            <BottomNav active="recap" />

            <CollageGenerator
                photos={photos}
                open={showCollage}
                onOpenChange={setShowCollage}
            />
        </div>
    )
}

function PhotoThumbnail({ photo, isFirst }: { photo: Photo; isFirst: boolean }) {
    const [url, setUrl] = useState<string | null>(null)

    useEffect(() => {
        const fetchUrl = async () => {
            const res = await fetch(`/api/s3/signed-read?key=${photo.s3_key}`)
            if (res.ok) {
                const data = await res.json()
                setUrl(data.url)
            }
        }
        fetchUrl()
    }, [photo.s3_key])

    const dayName = new Date(photo.date).toLocaleDateString('en-US', { weekday: 'short' })

    if (!url) {
        return (
            <div className={`relative aspect-square bg-[var(--mist)] animate-pulse ${isFirst ? 'col-span-2 row-span-2' : ''}`} />
        )
    }

    return (
        <div className={`relative aspect-square bg-[var(--mist)] overflow-hidden ${isFirst ? 'col-span-2 row-span-2' : ''}`}>
            <Image
                src={url}
                alt={`Photo from ${photo.date}`}
                fill
                className="object-cover"
                unoptimized
            />
            <div className="absolute bottom-1 left-1 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">
                {dayName}
            </div>
        </div>
    )
}
