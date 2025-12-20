"use client"

import { useState, useEffect } from "react"
import { Upload, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"
import { PhotoCard } from "@/components/photo-card"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { useRouter } from "next/navigation"

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
    const router = useRouter()

    const photosCount = photos.length
    const remainingFree = Math.max(0, 7 - photosCount)
    const today = new Date().toISOString().split("T")[0]
    const todayPhoto = photos.find((p) => p.date === today)

    const handleUpload = async () => {
        if (!isPro && photosCount >= 7) {
            setShowUpgrade(true)
            return
        }

        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/jpeg,image/png,image/webp"
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            if (file.size > 10 * 1024 * 1024) {
                alert("File size too large (max 10MB)")
                return
            }

            setUploading(true)

            try {
                // 1. Get presigned URL
                const presignRes = await fetch("/api/s3/presign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contentType: file.type }),
                })
                const presignData = await presignRes.json()

                if (!presignRes.ok) {
                    throw new Error(presignData.error || "Failed to get upload URL")
                }

                // 2. Upload to S3
                const uploadRes = await fetch(presignData.url, {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": file.type },
                })

                if (!uploadRes.ok) {
                    throw new Error("Failed to upload to S3")
                }

                // 3. Commit to DB
                const commitRes = await fetch("/api/photos/commit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        key: presignData.key,
                        bucket: presignData.bucket,
                        date: presignData.date,
                        mime_type: file.type,
                    }),
                })

                if (!commitRes.ok) {
                    throw new Error("Failed to save photo")
                }

                router.refresh()
            } catch (error: any) {
                alert(error.message)
            } finally {
                setUploading(false)
            }
        }
        input.click()
    }

    return (
        <>
            <div className="min-h-screen bg-[var(--paper)] pb-20">
                <AppHeader />

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
                            <div className="border-2 border-dashed border-[var(--mist)] rounded-[var(--radius)] p-12 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-[var(--mist)] flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-[var(--ash)]" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="font-medium text-[var(--ink)]">No photo yet today</p>
                                    <p className="text-sm text-[var(--stone)]">Capture your daily moment</p>
                                </div>
                                <Button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="bg-[var(--moss)] text-[var(--paper)] hover:opacity-90"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {uploading ? "Uploading..." : "Upload Photo"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <PhotoCardWithUrl photo={todayPhoto} />
                                <p className="text-sm text-center text-[var(--stone)]">{"You've captured today's moment ✓"}</p>
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    {photos.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-[var(--ink)]">Your Timeline</h2>
                            <div className="grid gap-4">
                                {photos.map((photo) => (
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
    const [url, setUrl] = useState<string | null>(() => PhotoCache.get(photo.s3_key))

    useEffect(() => {
        if (url) return

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
    }, [photo.s3_key, url])

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
