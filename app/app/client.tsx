"use client"

import { useState, useEffect } from "react"
import { Upload, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"
import { PhotoCard } from "@/components/photo-card"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { useRouter } from "next/navigation"
import { formatDateLocal, parseDateLocal } from "@/lib/utils"
import { UploadSection } from "@/components/upload-section"

interface Photo {
    id: string
    date: string
    s3_key: string
    note?: string | null
}

interface AppClientProps {
    initialPhotos: Photo[]
    isPro: boolean
    userId: string
}

export function AppClient({ initialPhotos, isPro, userId }: AppClientProps) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [hasHydrated, setHasHydrated] = useState(false)
    const [today, setToday] = useState("")
    const router = useRouter()

    useEffect(() => {
        setHasHydrated(true)
        setToday(formatDateLocal())
    }, [])

    const photosCount = photos.length
    const remainingFree = Math.max(0, 7 - photosCount)
    // Use the potentially server-mismatched 'today' only after hydration
    const todayPhoto = hasHydrated ? photos.find((p) => p.date === today) : null

    // We use the centralized UploadSection now

    if (!hasHydrated) {
        // Return a stable initial state for SSR and first render
        return (
            <div className="min-h-screen bg-[var(--paper)] pb-20">
                <AppHeader />
                <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-32 bg-[var(--mist)] rounded" />
                        <div className="aspect-square bg-[var(--mist)] rounded-2xl" />
                    </div>
                </main>
                <BottomNav active="home" />
            </div>
        )
    }

    return (
        <>
            <div className="min-h-screen bg-[var(--paper)] pb-20">
                <AppHeader userId={userId} />

                <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    {/* Today's photo section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[var(--ink)]">Today</h2>
                            {!isPro && (
                                <span className="text-sm text-[var(--ash)]">
                                    {remainingFree > 0 ? `${remainingFree} of 7 free left` : "Free limit reached"}
                                </span>
                            )}
                        </div>

                        {!todayPhoto ? (
                            <UploadSection />
                        ) : (
                            <div className="space-y-4">
                                <PhotoCardWithUrl photo={todayPhoto} />
                                <p className="text-sm text-center text-[var(--stone)]">{"You've captured today's moment ✓"}</p>
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    {photos.filter(p => p.date !== today).length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-[var(--ink)]">Your Timeline</h2>
                            <div className="grid gap-4">
                                {photos
                                    .filter((photo) => photo.date !== today)
                                    .map((photo) => (
                                        <PhotoCardWithUrl key={photo.id} photo={photo} />
                                    ))}
                            </div>
                        </div>
                    )}
                </main>

                <BottomNav active="home" />
            </div>

            <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} />
        </>
    )
}

import { PhotoCache } from "@/lib/photo-cache"

function PhotoCardWithUrl({ photo }: { photo: Photo }) {
    const [url, setUrl] = useState<string | null>(null)

    useEffect(() => {
        // Safe to check cache after hydration
        const cached = PhotoCache.get(photo.s3_key)
        if (cached) {
            setUrl(cached)
            return
        }

        const fetchUrl = async () => {
            const res = await fetch(`/api/s3/signed-read?key=${photo.s3_key}`)
            if (res.ok) {
                const data = await res.json()
                const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(data.url)}`
                PhotoCache.set(photo.s3_key, proxyUrl)
                setUrl(proxyUrl)
            }
        }
        fetchUrl()
    }, [photo.s3_key])

    if (!url) {
        return (
            <div className="bg-[var(--mist)] bg-opacity-30 rounded-[var(--radius)] overflow-hidden">
                <div className="aspect-square bg-[var(--mist)] animate-pulse" />
                <div className="p-4 space-y-2">
                    <div className="h-4 w-32 bg-[var(--mist)] rounded animate-pulse" />
                </div>
            </div>
        )
    }

    return (
        <PhotoCard photo={{ id: photo.id, date: photo.date, url, note: photo.note || undefined }} />
    )
}
