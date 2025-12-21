"use client"

import { useState, useRef, useEffect } from "react"
import { toBlob } from "html-to-image"
import { Share2, Wand2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PhotoCache } from "@/lib/photo-cache"

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
    urlCache: Record<string, string>
    onUrlResolved: (key: string, url: string) => void
}

type Layout =
    | "grid" | "featured" | "row" | "polaroid" | "adventure" | "mosaic" | "magazine" | "yearly"
    | "focus_minimal" | "focus_cinematic" | "focus_vogue" | "focus_frame"
    | "duo_vertical" | "duo_horizontal" | "duo_overlap" | "duo_inset"
    | "triple_stack" | "triple_modern" | "triple_geometric" | "triple_asymmetric"
    | "quad_classic" | "quad_split" | "quad_stair" | "quad_dynamic"

export function CollageGenerator({
    photos,
    open,
    onOpenChange,
    urlCache,
    onUrlResolved
}: CollageGeneratorProps) {
    const [generating, setGenerating] = useState(false)
    const [layout, setLayout] = useState<Layout>("grid")
    const canvasRef = useRef<HTMLDivElement>(null)
    const [loadingUrls, setLoadingUrls] = useState(false)
    const activeRequests = useRef<Set<string>>(new Set())

    const count =
        layout === 'yearly' ? 20 :
            layout.startsWith('focus_') ? 1 :
                layout.startsWith('duo_') ? 2 :
                    layout.startsWith('triple_') ? 3 :
                        layout.startsWith('quad_') ? 4 :
                            12;

    const resolvedPhotos = photos.slice(0, count)
        .map(p => {
            const url = urlCache[p.s3_key];
            if (!url) return { ...p, url: undefined };
            const proxiedUrl = url.startsWith('/api/proxy-image')
                ? url
                : `/api/proxy-image?url=${encodeURIComponent(url)}`;
            // Add cache buster for collage images to ensure fresh CORS headers for canvas
            return { ...p, url: `${proxiedUrl}&cb=${p.id}` };
        })
        .filter(p => p.url) as (Photo & { url: string })[];

    useEffect(() => {
        if (!open) return

        const currentPhotos = photos.slice(0, count);
        const toResolve = currentPhotos.filter(p => !urlCache[p.s3_key] && !activeRequests.current.has(p.s3_key));

        if (toResolve.length === 0) {
            if (activeRequests.current.size === 0) setLoadingUrls(false);
            return;
        }

        const loadUrls = async () => {
            setLoadingUrls(true)
            toResolve.forEach(p => activeRequests.current.add(p.s3_key));

            await Promise.all(
                toResolve.map(async (p) => {
                    try {
                        const persistedUrl = PhotoCache.get(p.s3_key)
                        if (persistedUrl) {
                            onUrlResolved(p.s3_key, persistedUrl)
                            return
                        }

                        const res = await fetch(`/api/s3/signed-read?key=${p.s3_key}`)
                        if (res.ok) {
                            const data = await res.json()
                            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(data.url)}`
                            PhotoCache.set(p.s3_key, proxyUrl)
                            onUrlResolved(p.s3_key, proxyUrl)
                        }
                    } catch (e) {
                        console.error(e)
                    } finally {
                        activeRequests.current.delete(p.s3_key)
                    }
                })
            )

            if (activeRequests.current.size === 0) {
                setLoadingUrls(false)
            }
        }
        loadUrls()
    }, [open, photos, layout, urlCache, onUrlResolved, count])

    const handleShare = async () => {
        if (!canvasRef.current) return
        setGenerating(true)

        try {
            const blob = await toBlob(canvasRef.current, {
                cacheBust: true,
                pixelRatio: 2,
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
        const layouts: Layout[] = [
            "grid", "featured", "row", "polaroid", "adventure", "mosaic", "magazine", "yearly",
            "focus_minimal", "focus_cinematic", "focus_vogue", "focus_frame",
            "duo_vertical", "duo_horizontal", "duo_overlap", "duo_inset",
            "triple_stack", "triple_modern", "triple_geometric", "triple_asymmetric",
            "quad_classic", "quad_split", "quad_stair", "quad_dynamic"
        ]
        const next = layouts[(layouts.indexOf(layout) + 1) % layouts.length]
        setLayout(next)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--paper)] border-[var(--mist)] max-w-sm p-4 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-[var(--ink)] flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-[var(--moss)]" />
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
                                background: layout === 'adventure' ? "#fdfaf0" :
                                    layout === 'yearly' ? "linear-gradient(to bottom, #1a2f1c, #0d1a0e)" :
                                        "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)"
                            }}
                        >
                            {/* Header (Not for adventure/magazine/yearly) */}
                            {layout !== 'adventure' && layout !== 'magazine' && layout !== 'yearly' && (
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

                            {/* Grid/Layout Content */}
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
                                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-black rounded-full -mr-16 -mt-16 blur-3xl" />
                                        <div className="absolute bottom-0 left-0 w-32 h-32 opacity-10 bg-[var(--moss)] rounded-full -ml-16 -mb-16 blur-3xl" />
                                        {resolvedPhotos[0] && (
                                            <div
                                                className="absolute top-[25%] left-1/2 -translate-x-1/2 w-48 h-48 bg-white shadow-xl z-20 overflow-hidden"
                                                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                                            >
                                                <img src={resolvedPhotos[0].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
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
                                        <div className="absolute top-[10%] left-[10%] w-8 h-8 rounded-full border border-dashed border-[var(--ash)] opacity-30" />
                                        <div className="absolute bottom-[20%] right-[10%] w-12 h-12 rounded-full border border-[var(--moss)] opacity-10" />
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
                                        {resolvedPhotos[0] && (
                                            <div className="col-start-1 col-span-1 row-start-1 row-span-2 relative overflow-hidden">
                                                <img src={resolvedPhotos[0].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        {resolvedPhotos[1] && (
                                            <div className="col-start-2 col-span-1 row-start-1 row-span-1 relative overflow-hidden">
                                                <img src={resolvedPhotos[1].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        {resolvedPhotos[2] && (
                                            <div className="col-start-2 col-span-1 row-start-2 row-span-1 relative overflow-hidden">
                                                <img src={resolvedPhotos[2].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        {resolvedPhotos[3] && (
                                            <div className="col-start-3 col-span-1 row-start-1 row-span-2 relative overflow-hidden">
                                                <img src={resolvedPhotos[3].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        {resolvedPhotos[4] && (
                                            <div className="col-start-1 col-span-2 row-start-3 row-span-1 relative overflow-hidden">
                                                <img src={resolvedPhotos[4].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                        {resolvedPhotos[5] && (
                                            <div className="col-start-3 col-span-1 row-start-3 row-span-1 relative overflow-hidden">
                                                <img src={resolvedPhotos[5].url} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {layout === "magazine" && (
                                    <div className="relative w-full h-full bg-white flex flex-col p-1 gap-1">
                                        <div className="flex-1 grid grid-cols-2 gap-1 overflow-hidden">
                                            <div className="grid grid-rows-2 gap-1">
                                                <div className="relative overflow-hidden"><img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                                <div className="relative overflow-hidden"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                            </div>
                                            <div className="grid grid-rows-2 gap-1">
                                                <div className="relative overflow-hidden"><img src={resolvedPhotos[2]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                                <div className="relative overflow-hidden"><img src={resolvedPhotos[3]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                            </div>
                                        </div>
                                        <div className="flex-[1.5] relative overflow-hidden">
                                            <div className="absolute inset-0 grid grid-cols-2 gap-1 opacity-40 grayscale-[50%]">
                                                <img src={resolvedPhotos[4]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                <img src={resolvedPhotos[5]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                            </div>
                                            <div
                                                className="absolute inset-1 bg-white shadow-2xl z-10 flex items-center justify-center p-1"
                                                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                                            >
                                                <div
                                                    className="w-full h-full overflow-hidden"
                                                    style={{ clipPath: "polygon(50% 1%, 99% 50%, 50% 99%, 1% 50%)" }}
                                                >
                                                    <img src={resolvedPhotos[6]?.url || resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                </div>
                                            </div>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/80 px-4 py-2 text-white text-center rounded-sm border border-white/20 backdrop-blur-sm scale-75">
                                                <p className="text-[10px] uppercase tracking-widest font-bold">1PicDay</p>
                                                <p className="text-[6px] opacity-60">MEMORIES • RECAP</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-1 overflow-hidden">
                                            <div className="grid grid-cols-2 gap-1">
                                                <div className="relative overflow-hidden"><img src={resolvedPhotos[7]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                                <div className="relative overflow-hidden"><img src={resolvedPhotos[8]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                            </div>
                                            <div className="grid grid-rows-2 gap-1">
                                                <div className="relative overflow-hidden"><img src={resolvedPhotos[9]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                                <div className="relative overflow-hidden"><img src={resolvedPhotos[10]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {layout === "yearly" && (
                                    <div className="relative w-full h-full bg-[#1a2f1c] flex flex-col pt-8 overflow-hidden">
                                        <div className="absolute top-6 left-0 right-0 text-center z-10">
                                            <h1 className="text-4xl font-black text-white/90 tracking-tighter drop-shadow-lg scale-y-110">
                                                {resolvedPhotos[0] ? new Date(resolvedPhotos[0].date).getFullYear() : '2024'}
                                            </h1>
                                        </div>
                                        <div className="flex-1 relative mt-4">
                                            <div className="flex h-full px-2 gap-1">
                                                <div className="flex-1 flex flex-col gap-1 -translate-y-4">
                                                    {resolvedPhotos.slice(0, 4).map((p) => (
                                                        <div key={p.id} className="aspect-[3/4] border-2 border-white/80 shadow-sm overflow-hidden">
                                                            <img src={p.url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex-1 flex flex-col gap-1 transform -rotate-6 translate-y-8">
                                                    {resolvedPhotos.slice(4, 8).map((p) => (
                                                        <div key={p.id} className="aspect-[3/4] border-2 border-white/80 shadow-sm overflow-hidden">
                                                            <img src={p.url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex-1 flex flex-col gap-1 translate-y-2">
                                                    {resolvedPhotos.slice(8, 12).map((p) => (
                                                        <div key={p.id} className="aspect-[3/4] border-2 border-white/80 shadow-sm overflow-hidden">
                                                            <img src={p.url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex-1 flex flex-col gap-1 transform rotate-6 -translate-y-4">
                                                    {resolvedPhotos.slice(12, 16).map((p) => (
                                                        <div key={p.id} className="aspect-[3/4] border-2 border-white/80 shadow-sm overflow-hidden">
                                                            <img src={p.url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex-1 flex flex-col gap-1 translate-y-12">
                                                    {resolvedPhotos.slice(16, 20).map((p) => (
                                                        <div key={p.id} className="aspect-[3/4] border-2 border-white/80 shadow-sm overflow-hidden">
                                                            <img src={p.url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-10 mix-blend-overlay"></div>
                                    </div>
                                )}

                                {/* 1 PHOTO */}
                                {layout === "focus_minimal" && resolvedPhotos[0] && (
                                    <div className="h-full flex flex-col items-center justify-center p-8 bg-neutral-50">
                                        <div className="w-full aspect-square bg-white shadow-2xl p-4 border border-neutral-200">
                                            <img src={resolvedPhotos[0].url} className="w-full h-full object-cover grayscale-[20%]" crossOrigin="anonymous" />
                                        </div>
                                        <div className="mt-8 text-center text-neutral-800 font-serif italic text-xl">
                                            {new Date(resolvedPhotos[0].date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                )}
                                {layout === "focus_cinematic" && resolvedPhotos[0] && (
                                    <div className="h-full relative bg-black flex flex-col justify-center">
                                        <div className="w-full aspect-[21/9] overflow-hidden">
                                            <img src={resolvedPhotos[0].url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                        </div>
                                        <div className="absolute inset-x-0 bottom-12 text-center">
                                            <p className="text-white/40 text-[10px] uppercase tracking-[0.5em] mb-2">CINEMATIC FRAME</p>
                                            <h2 className="text-white text-3xl font-light">MOMENT #{resolvedPhotos[0].id.slice(0, 4)}</h2>
                                        </div>
                                    </div>
                                )}
                                {layout === "focus_vogue" && resolvedPhotos[0] && (
                                    <div className="h-full relative bg-white flex flex-col">
                                        <div className="flex-1 p-2">
                                            <img src={resolvedPhotos[0].url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                        </div>
                                        <div className="absolute top-12 inset-x-0 text-center pointer-events-none">
                                            <h1 className="text-6xl font-black text-white/90 tracking-tighter mix-blend-overlay">VOGUE</h1>
                                        </div>
                                        <div className="p-4 flex justify-between items-end border-t border-neutral-100">
                                            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Limited Edition</span>
                                            <span className="text-2xl font-black italic text-neutral-900 leading-none">2025</span>
                                        </div>
                                    </div>
                                )}
                                {layout === "focus_frame" && resolvedPhotos[0] && (
                                    <div className="h-full flex items-center justify-center bg-[#f7f3f0] p-12">
                                        <div className="bg-white p-6 shadow-xl border-[12px] border-[#ebe7e4]">
                                            <img src={resolvedPhotos[0].url} className="w-64 h-80 object-cover" crossOrigin="anonymous" />
                                        </div>
                                    </div>
                                )}

                                {/* 2 PHOTOS */}
                                {layout === "duo_vertical" && (
                                    <div className="h-full flex flex-col gap-1 bg-white p-1">
                                        <div className="flex-1 relative overflow-hidden"><img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="flex-1 relative overflow-hidden"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                    </div>
                                )}
                                {layout === "duo_horizontal" && (
                                    <div className="h-full flex gap-1 bg-neutral-900 p-2">
                                        <div className="flex-1 relative rounded-sm overflow-hidden"><img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="flex-1 relative rounded-sm overflow-hidden"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                    </div>
                                )}
                                {layout === "duo_overlap" && (
                                    <div className="h-full relative bg-[#f0f0f5] p-6 overflow-hidden">
                                        <div className="w-3/4 aspect-[3/4] shadow-2xl border-4 border-white transform -rotate-6 z-10 relative"><img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="w-3/4 aspect-[3/4] shadow-2xl border-4 border-white absolute bottom-12 right-6 transform rotate-3 z-0"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                    </div>
                                )}
                                {layout === "duo_inset" && (
                                    <div className="h-full relative bg-white overflow-hidden">
                                        <img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                        <div className="absolute right-6 bottom-6 w-32 h-44 shadow-2xl border-2 border-white ring-8 ring-neutral-900 overflow-hidden transform rotate-2"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                    </div>
                                )}

                                {/* 3 PHOTOS */}
                                {layout === "triple_stack" && (
                                    <div className="h-full grid grid-rows-3 gap-1 bg-white p-1">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className="relative overflow-hidden"><img src={resolvedPhotos[i]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        ))}
                                    </div>
                                )}
                                {layout === "triple_modern" && (
                                    <div className="h-full grid grid-cols-6 grid-rows-6 gap-1 bg-neutral-950 p-1">
                                        <div className="col-span-6 row-span-4 relative overflow-hidden"><img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="col-span-3 row-span-2 relative overflow-hidden"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="col-span-3 row-span-2 relative overflow-hidden"><img src={resolvedPhotos[2]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                    </div>
                                )}
                                {layout === "triple_geometric" && (
                                    <div className="h-full grid grid-cols-2 grid-rows-2 gap-1 bg-white p-1">
                                        <div className="relative overflow-hidden"><img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="relative overflow-hidden rounded-full border-4 border-neutral-100 shadow-inner p-1"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover rounded-full" crossOrigin="anonymous" /></div>
                                        <div className="col-span-2 relative overflow-hidden"><img src={resolvedPhotos[2]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                    </div>
                                )}
                                {layout === "triple_asymmetric" && (
                                    <div className="h-full flex gap-1 p-1 bg-neutral-50">
                                        <div className="flex-[2] relative overflow-hidden"><img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className="flex-1 relative overflow-hidden"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                            <div className="flex-1 relative overflow-hidden"><img src={resolvedPhotos[2]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        </div>
                                    </div>
                                )}

                                {/* 4 PHOTOS */}
                                {layout === "quad_classic" && (
                                    <div className="h-full grid grid-cols-2 grid-rows-2 gap-2 bg-white p-4">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className="relative overflow-hidden shadow-sm border border-neutral-100 p-1"><img src={resolvedPhotos[i]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        ))}
                                    </div>
                                )}
                                {layout === "quad_split" && (
                                    <div className="h-full flex flex-col gap-1 bg-neutral-900 p-1">
                                        <div className="flex-1 flex gap-1">
                                            <div className="flex-1 relative overflow-hidden"><img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                            <div className="flex-[1.5] relative overflow-hidden"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        </div>
                                        <div className="flex-1 flex gap-1">
                                            <div className="flex-[1.5] relative overflow-hidden"><img src={resolvedPhotos[2]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                            <div className="flex-1 relative overflow-hidden"><img src={resolvedPhotos[3]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        </div>
                                    </div>
                                )}
                                {layout === "quad_stair" && (
                                    <div className="h-full relative bg-neutral-50 p-4">
                                        <div className="absolute top-8 left-8 w-40 h-56 z-10 shadow-xl border-4 border-white rotate-[-6deg]"><img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="absolute top-24 right-8 w-32 h-44 z-20 shadow-xl border-4 border-white rotate-[3deg]"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="absolute bottom-24 left-12 w-32 h-44 z-30 shadow-xl border-4 border-white rotate-[6deg]"><img src={resolvedPhotos[2]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="absolute bottom-8 right-12 w-40 h-56 z-40 shadow-xl border-4 border-white rotate-[-3deg]"><img src={resolvedPhotos[3]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                    </div>
                                )}
                                {layout === "quad_dynamic" && (
                                    <div className="h-full grid grid-cols-3 grid-rows-3 gap-1 bg-white p-1">
                                        <div className="col-span-2 row-span-2 relative overflow-hidden"><img src={resolvedPhotos[0]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="col-span-1 row-span-1 relative overflow-hidden"><img src={resolvedPhotos[1]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="col-span-1 row-span-2 relative overflow-hidden"><img src={resolvedPhotos[2]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                        <div className="col-span-2 row-span-1 relative overflow-hidden"><img src={resolvedPhotos[3]?.url} className="w-full h-full object-cover" crossOrigin="anonymous" /></div>
                                    </div>
                                )}
                            </div>

                            {/* Footer (Not for adventure/magazine/yearly) */}
                            {layout !== 'adventure' && layout !== 'magazine' && layout !== 'yearly' && (
                                <div className="mt-2 text-center text-[10px] text-neutral-400 font-medium font-mono uppercase tracking-widest">
                                    Generated by 1picday
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
