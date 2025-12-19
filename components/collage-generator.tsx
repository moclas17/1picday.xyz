"use client"

import { useState, useRef, useEffect } from "react"
import { toBlob } from "html-to-image"
import { Share2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface Photo {
    id: string
    date: string
    s3_key: string
    url?: string // Client side resolved URL
}

interface CollageGeneratorProps {
    photos: Photo[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CollageGenerator({ photos, open, onOpenChange }: CollageGeneratorProps) {
    const [generating, setGenerating] = useState(false)
    const [layout, setLayout] = useState<"grid" | "featured" | "row" | "polaroid" | "adventure" | "mosaic">("grid")
    const canvasRef = useRef<HTMLDivElement>(null)
    const [resolvedPhotos, setResolvedPhotos] = useState<Photo[]>([])
    const [loadingUrls, setLoadingUrls] = useState(true)

    // Load URLs if not present
    useEffect(() => {
        if (!open) return

        const loadUrls = async () => {
            setLoadingUrls(true)
            const withUrls = await Promise.all(
                photos.slice(0, 10).map(async (p) => {
                    try {
                        const res = await fetch(`/api/s3/signed-read?key=${p.s3_key}`)
                        if (res.ok) {
                            const data = await res.json()
                            // Use proxy for canvas generation to avoid CORS
                            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(data.url)}`
                            return { ...p, url: proxyUrl }
                        }
                    } catch (e) { console.error(e) }
                    return p
                })
            )
            setResolvedPhotos(withUrls.filter(p => p.url))
            setLoadingUrls(false)
        }
        loadUrls()
    }, [open, photos, layout])

    const handleShare = async () => {
        if (!canvasRef.current) return
        setGenerating(true)

        try {
            const blob = await toBlob(canvasRef.current, {
                cacheBust: true,
                pixelRatio: 2, // Better quality
                style: { transform: 'scale(1)' }
            })

            if (!blob) throw new Error("Failed to generate image")

            const file = new File([blob], "1picday-recap.png", { type: "image/png" })

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: "My 1picday Recap",
                    text: "Check out my week in photos! #1picday",
                    files: [file]
                })
            } else {
                // Fallback to download
                const link = document.createElement("a")
                link.download = "1picday-recap.png"
                link.href = URL.createObjectURL(blob)
                link.click()
            }
        } catch (error) {
            console.error(error)
            alert("Could not share image. Try downloading.")
        } finally {
            setGenerating(false)
        }
    }

    const toggleLayout = () => {
        const layouts: ("grid" | "featured" | "row" | "polaroid" | "adventure" | "mosaic")[] = ["grid", "featured", "row", "polaroid", "adventure", "mosaic"]
        const next = layouts[(layouts.indexOf(layout) + 1) % layouts.length]
        setLayout(next)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--paper)] border-[var(--mist)] max-w-sm p-4 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-[var(--ink)] flex items-center gap-2">
                        < Wand2 className="w-5 h-5 text-[var(--moss)]" />
                        Magic Collage
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-[300px] flex items-center justify-center bg-[var(--mist)]/20 rounded-lg relative">
                    {loadingUrls ? (
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--stone)]" />
                    ) : (
                        <div
                            ref={canvasRef}
                            className="bg-white p-4 w-full aspect-[9/16] shadow-xl flex flex-col gap-2 overflow-hidden"
                            style={{
                                background: layout === 'adventure' ? "#fdfaf0" : "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)"
                            }}
                        >
                            {/* Layout specific content */}
                            {layout !== 'adventure' && (
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--moss)] flex items-center justify-center text-white font-bold text-xs">
                                        1
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">1picday</p>
                                        <p className="text-sm font-bold text-gray-900">Weekly Recap</p>
                                    </div>
                                </div>
                            )}

                            {/* Grid/Layout */}
                            <div className="flex-1 rounded-xl overflow-hidden relative">
                                {layout === "grid" && (
                                    <div className="grid grid-cols-2 h-full gap-1">
                                        {resolvedPhotos.slice(0, 6).map((p) => (
                                            <div key={p.id} className="relative overflow-hidden">
                                                <img src={p.url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {layout === "featured" && (
                                    <div className="grid grid-rows-3 h-full gap-1">
                                        {resolvedPhotos[0] && (
                                            <div className="row-span-2 relative overflow-hidden">
                                                <img src={resolvedPhotos[0].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-3 gap-1">
                                            {resolvedPhotos.slice(1, 4).map((p) => (
                                                <div key={p.id} className="relative overflow-hidden">
                                                    <img src={p.url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {layout === "row" && (
                                    <div className="flex flex-col h-full gap-1">
                                        {resolvedPhotos.slice(0, 5).map((p) => (
                                            <div key={p.id} className="flex-1 relative overflow-hidden">
                                                <img src={p.url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                                <div className="absolute bottom-1 left-2 text-[8px] text-white font-medium drop-shadow-md">
                                                    {new Date(p.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {layout === "polaroid" && (
                                    <div className="relative w-full h-full p-2">
                                        {resolvedPhotos.slice(0, 7).map((p, i) => {
                                            const step = 12;
                                            const rotate = (i % 2 === 0 ? -1 : 1) * (3 + (i % 3) * 2);
                                            const zIndex = i;
                                            const top = i * step + 5;
                                            const left = i % 2 === 0 ? 2 : 45;
                                            return (
                                                <div
                                                    key={p.id}
                                                    className="bg-white p-2 pb-6 shadow-md absolute w-[50%] transition-transform border border-gray-100"
                                                    style={{
                                                        transform: `rotate(${rotate}deg)`,
                                                        top: `${top}%`,
                                                        left: `${left}%`,
                                                        zIndex
                                                    }}
                                                >
                                                    <div className="aspect-square relative overflow-hidden bg-gray-100 mb-2">
                                                        <img src={p.url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                                    </div>
                                                    <p className="text-[6px] text-center text-gray-600 font-medium">
                                                        {new Date(p.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                                {layout === "adventure" && (
                                    <div className="relative w-full h-full p-4 flex flex-col items-center">
                                        {/* Background Textures (Simulated) */}
                                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-black rounded-full -mr-16 -mt-16 blur-3xl" />
                                        <div className="absolute bottom-0 left-0 w-32 h-32 opacity-10 bg-[var(--moss)] rounded-full -ml-16 -mb-16 blur-3xl" />

                                        {/* Central Diamond Focus */}
                                        {resolvedPhotos[0] && (
                                            <div
                                                className="absolute top-[25%] left-1/2 -translate-x-1/2 w-48 h-48 bg-white shadow-xl z-20 overflow-hidden"
                                                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                                            >
                                                <img src={resolvedPhotos[0].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}

                                        {/* Surrounding scattered elements */}
                                        {resolvedPhotos.slice(1, 8).map((p, i) => {
                                            const angles = [-15, 10, -5, 15, -10, 5, -20];
                                            const positions = [
                                                { top: '5%', left: '-5%' },
                                                { top: '2%', right: '-5%' },
                                                { bottom: '15%', left: '0%' },
                                                { bottom: '10%', right: '5%' },
                                                { top: '45%', left: '-10%' },
                                                { top: '50%', right: '-10%' },
                                                { bottom: '35%', left: '20%' },
                                            ];
                                            const pos = positions[i] || { top: '0%', left: '0%' };

                                            return (
                                                <div
                                                    key={p.id}
                                                    className="absolute w-24 h-24 bg-white shadow-lg overflow-hidden border border-white/50"
                                                    style={{
                                                        ...pos,
                                                        transform: `rotate(${angles[i % angles.length]}deg)`,
                                                        zIndex: i + 5
                                                    }}
                                                >
                                                    <img src={p.url} className="w-full h-full object-cover opacity-90" alt="" crossOrigin="anonymous" />
                                                </div>
                                            )
                                        })}

                                        {/* Decorative Blobs/Shapes */}
                                        <div className="absolute top-[10%] left-[10%] w-8 h-8 rounded-full border border-dashed border-[var(--ash)] opacity-30" />
                                        <div className="absolute bottom-[20%] right-[10%] w-12 h-12 rounded-full border border-[var(--moss)] opacity-10" />

                                        {/* Script Text */}
                                        <div className="absolute bottom-10 left-0 right-0 text-center px-4 z-30">
                                            <h2 className="text-2xl italic font-serif text-[#4a3b31] drop-shadow-sm" style={{ fontFamily: 'Georgia, serif' }}>
                                                Adventure of a Lifetime
                                            </h2>
                                            <p className="text-[8px] uppercase tracking-[0.2em] text-gray-400 mt-1">Week {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                )}
                                {layout === "mosaic" && (
                                    <div className="grid grid-cols-3 grid-rows-3 h-full gap-1 p-0.5 bg-white">
                                        {/* Photo 0: Tall left (Cols 1, Rows 1-2) */}
                                        {resolvedPhotos[0] && (
                                            <div className="col-start-1 col-span-1 row-start-1 row-span-2 relative overflow-hidden">
                                                <img src={resolvedPhotos[0].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        {/* Photo 1: Landscape top center (Col 2, Row 1) */}
                                        {resolvedPhotos[1] && (
                                            <div className="col-start-2 col-span-1 row-start-1 row-span-1 relative overflow-hidden">
                                                <img src={resolvedPhotos[1].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        {/* Photo 2: Square center (Col 2, Row 2) */}
                                        {resolvedPhotos[2] && (
                                            <div className="col-start-2 col-span-1 row-start-2 row-span-1 relative overflow-hidden">
                                                <img src={resolvedPhotos[2].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        {/* Photo 3: Tall right (Col 3, Rows 1-2) */}
                                        {resolvedPhotos[3] && (
                                            <div className="col-start-3 col-span-1 row-start-1 row-span-2 relative overflow-hidden">
                                                <img src={resolvedPhotos[3].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        {/* Photo 4: Wide bottom (Cols 1-2, Row 3) */}
                                        {resolvedPhotos[4] && (
                                            <div className="col-start-1 col-span-2 row-start-3 row-span-1 relative overflow-hidden">
                                                <img src={resolvedPhotos[4].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        {/* Photo 5: Small bottom right (Col 3, Row 3) */}
                                        {resolvedPhotos[5] && (
                                            <div className="col-start-3 col-span-1 row-start-3 row-span-1 relative overflow-hidden">
                                                <img src={resolvedPhotos[5].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer (Not for adventure) */}
                            {layout !== 'adventure' && (
                                <div className="mt-2 text-center">
                                    <p className="text-[10px] text-gray-400 font-medium">Generated by 1picday</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-4">
                    <Button
                        variant="outline"
                        className="flex-1 border-[var(--mist)] text-[var(--ink)]"
                        onClick={toggleLayout}
                        disabled={loadingUrls}
                    >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Layout
                    </Button>
                    <Button
                        className="flex-1 bg-[var(--moss)] text-[var(--paper)]"
                        onClick={handleShare}
                        disabled={loadingUrls || generating}
                    >
                        {generating ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Share2 className="w-4 h-4 mr-2" />
                        )}
                        Share
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
