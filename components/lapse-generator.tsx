"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Download, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Photo {
    id: string;
    date: string;
    s3_key: string;
    url?: string;
}

interface LapseGeneratorProps {
    photos: Photo[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    urlCache: Record<string, string>;
}

export function LapseGenerator({ photos, open, onOpenChange, urlCache }: LapseGeneratorProps) {
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [aiStory, setAiStory] = useState<{ title: string; captions: string[]; summary: string } | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Fetch AI Story when modal opens
    useEffect(() => {
        if (open && photos.length > 0 && !aiStory) {
            fetchAiStory();
        }
    }, [open, photos.length]);

    const fetchAiStory = async () => {
        try {
            const res = await fetch("/api/ai/story", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photos })
            });
            if (res.ok) {
                const data = await res.json();
                setAiStory(data);
            }
        } catch (e) {
            console.error("Failed to fetch story", e);
        }
    };

    const VIBE_MUSIC: Record<string, string> = {
        lofi: "/audio/lofi.mp3",
        uplifting: "/audio/uplifting.mp3",
        nostalgic: "/audio/nostalgic.mp3",
        energetic: "/audio/energetic.mp3"
    };

    const generateLapse = async () => {
        if (!canvasRef.current || photos.length === 0) return;

        setGenerating(true);
        setProgress(0);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = 1080;
        canvas.height = 1350;

        // 1. Audio Setup & Fix
        const vibe = (aiStory as any)?.musicVibe || "lofi";
        const audioUrl = VIBE_MUSIC[vibe] || VIBE_MUSIC.lofi;
        const audio = new Audio(audioUrl);
        audio.crossOrigin = "anonymous";
        audio.loop = true;

        // Ensure audio is loaded before starting
        await new Promise((resolve, reject) => {
            audio.oncanplaythrough = resolve;
            audio.onerror = reject;
            audio.load();
            // Timeout if it takes too long
            setTimeout(resolve, 3000);
        });

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === "suspended") {
            await audioCtx.resume();
        }

        const source = audioCtx.createMediaElementSource(audio);
        const dest = audioCtx.createMediaStreamDestination();

        // Add a gain node to ensure signal path is active
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 1.0;
        source.connect(gainNode);
        gainNode.connect(dest);
        gainNode.connect(audioCtx.destination);

        const canvasStream = canvas.captureStream(30);

        // Combine tracks specifically
        const audioTracks = dest.stream.getAudioTracks();
        const videoTracks = canvasStream.getVideoTracks();

        console.log("Audio Tracks:", audioTracks.length);
        console.log("Video Tracks:", videoTracks.length);

        const combinedStream = new MediaStream([...videoTracks, ...audioTracks]);

        // Supported format check
        const types = [
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm",
            "video/mp4"
        ];
        const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || "";
        console.log("Using mimeType:", mimeType);

        const recorder = new MediaRecorder(combinedStream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            audio.pause();
            audio.currentTime = 0;
            const blob = new Blob(chunks, { type: mimeType || "video/webm" });
            setVideoUrl(URL.createObjectURL(blob));
            setGenerating(false);
        };

        if (recorder.state === "inactive") {
            try {
                await audio.play();
                recorder.start();
            } catch (playError) {
                console.error("Audio play failed, starting without audio:", playError);
                recorder.start();
            }
        }

        const frameDuration = 1.0;
        const fps = 30;
        const framesPerPhoto = Math.floor(fps * frameDuration);
        const transitionFrames = 12;

        let prevImg: HTMLImageElement | null = null;
        let prevTransform: { x: number, y: number, scale: number } | null = null;

        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            const imgUrl = urlCache[photo.s3_key];

            if (imgUrl) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = imgUrl;

                await new Promise((resolve) => {
                    img.onload = async () => {
                        const baseScale = Math.max(canvas.width / img.width, canvas.height / img.height);

                        for (let f = 0; f < framesPerPhoto; f++) {
                            // Clear canvas
                            ctx.fillStyle = "black";
                            ctx.fillRect(0, 0, canvas.width, canvas.height);

                            // A. Photo with Ken Burns Zoom
                            const zoomProgress = f / framesPerPhoto;
                            const currentScale = baseScale * (1 + zoomProgress * 0.12);
                            const x = (canvas.width - img.width * currentScale) / 2;
                            const y = (canvas.height - img.height * currentScale) / 2;

                            ctx.globalAlpha = 1.0;
                            ctx.drawImage(img, x, y, img.width * currentScale, img.height * currentScale);

                            // B. Cross-Fade From Previous
                            if (prevImg && prevTransform && f < transitionFrames) {
                                const fadeAlpha = 1 - (f / transitionFrames);
                                ctx.globalAlpha = fadeAlpha;
                                ctx.drawImage(prevImg, prevTransform.x, prevTransform.y, prevImg.width * prevTransform.scale, prevImg.height * prevTransform.scale);
                                ctx.globalAlpha = 1.0;
                            }

                            // C. AI Narrative (Styled pod)
                            if (aiStory) {
                                ctx.fillStyle = "rgba(0,0,0,0.55)";
                                const podW = 750;
                                const podH = 160;
                                const podX = (canvas.width - podW) / 2;
                                const podY = canvas.height - 240; // Bottom position again since frame is gone

                                ctx.beginPath();
                                ctx.roundRect(podX, podY, podW, podH, 24);
                                ctx.fill();

                                ctx.fillStyle = "white";
                                ctx.font = "bold 42px Inter, system-ui, sans-serif";
                                ctx.textAlign = "center";

                                const captionIndex = Math.floor((i / photos.length) * aiStory.captions.length);
                                const text = aiStory.captions[captionIndex] || aiStory.title;

                                if (text.length > 30) {
                                    const words = text.split(' ');
                                    const mid = Math.floor(words.length / 2);
                                    ctx.fillText(words.slice(0, mid).join(' '), canvas.width / 2, podY + 65);
                                    ctx.fillText(words.slice(mid).join(' '), canvas.width / 2, podY + 115);
                                } else {
                                    ctx.fillText(text, canvas.width / 2, podY + 95);
                                }
                            }

                            // D. Clean 1picday Branding
                            ctx.fillStyle = "white";
                            ctx.font = "italic bold 32px Inter, system-ui, sans-serif";
                            ctx.textAlign = "right";
                            ctx.shadowColor = "rgba(0,0,0,0.5)";
                            ctx.shadowBlur = 10;
                            ctx.fillText("1picday.xyz", canvas.width - 60, 80);
                            ctx.shadowBlur = 0;

                            await new Promise(r => setTimeout(r, 1000 / fps));
                        }

                        prevImg = img;
                        prevTransform = {
                            x: (canvas.width - img.width * (baseScale * 1.12)) / 2,
                            y: (canvas.height - img.height * (baseScale * 1.12)) / 2,
                            scale: baseScale * 1.12
                        };
                        resolve(null);
                    };
                });
            }
            setProgress(Math.round(((i + 1) / photos.length) * 100));
        }

        recorder.stop();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[var(--paper)] border-[var(--mist)]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[var(--ink)]">
                        <Sparkles className="w-5 h-5 text-[var(--moss)]" />
                        Life Lapse AI
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-4">
                    {/* Hidden canvas for recording */}
                    <canvas ref={canvasRef} className="hidden" />

                    {videoUrl ? (
                        <div className="w-full space-y-4">
                            <video
                                src={videoUrl}
                                controls
                                className="w-full rounded-2xl shadow-lg aspect-[4/5] object-cover"
                                autoPlay
                                loop
                            />
                            <div className="bg-[var(--moss)]/10 p-4 rounded-xl space-y-1">
                                <h3 className="font-bold text-[var(--moss)]">{aiStory?.title}</h3>
                                <p className="text-sm text-[var(--stone)] italic">"{aiStory?.summary}"</p>
                            </div>
                            <Button
                                className="w-full bg-[var(--moss)] hover:bg-[var(--moss)]/90 text-white rounded-xl py-6"
                                onClick={() => {
                                    const a = document.createElement("a");
                                    a.href = videoUrl;
                                    a.download = `lifelapse-${new Date().toISOString().split('T')[0]}.webm`;
                                    a.click();
                                }}
                            >
                                <Download className="w-5 h-5 mr-2" />
                                Download Video
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-24 h-24 rounded-full bg-[var(--moss)]/10 flex items-center justify-center">
                                {generating ? (
                                    <Loader2 className="w-10 h-10 text-[var(--moss)] animate-spin" />
                                ) : (
                                    <Play className="w-10 h-10 text-[var(--moss)]" />
                                )}
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-[var(--ink)]">
                                    {generating ? "Crafting your story..." : "Ready to create?"}
                                </h3>
                                <p className="text-[var(--stone)] text-sm px-8">
                                    {generating
                                        ? `Processing frame ${progress}%`
                                        : "We'll combine your last 30 moments into a beautiful AI-powered time-lapse video."}
                                </p>
                            </div>

                            {!generating && (
                                <Button
                                    onClick={generateLapse}
                                    className="bg-[var(--moss)] hover:bg-[var(--moss)]/90 text-white rounded-xl px-12 py-6 h-auto text-lg font-bold"
                                >
                                    Start Generation
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
