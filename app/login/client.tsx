"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ImageIcon, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { magic } from "@/lib/magic"

export default function LoginClient({ message }: { message?: string }) {
    const [email, setEmail] = useState("")
    const [sent, setSent] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!magic) return

        setIsLoading(true)
        setError(null)

        try {
            const didToken = await magic.auth.loginWithMagicLink({ email })

            if (didToken) {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ didToken })
                })

                if (res.ok) {
                    setSent(true)
                    router.push('/app')
                    router.refresh()
                } else {
                    const data = await res.json()
                    throw new Error(data.error || "Login failed")
                }
            }
        } catch (e: any) {
            console.error(e)
            setError(e.message)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)]">
            <div className="p-4">
                <Link href="/" className="inline-flex items-center gap-2 text-[var(--stone)] hover:text-[var(--ink)]">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
                <div className="max-w-md w-full space-y-8">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-[var(--radius)] bg-[var(--moss)] flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-[var(--paper)]" />
                        </div>
                    </div>

                    {!sent ? (
                        <>
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-bold">Sign in to 1picday</h1>
                                <p className="text-[var(--stone)]">{"We'll send you a magic link to sign in"}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 bg-[var(--paper)] border-[var(--mist)] text-[var(--ink)]"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-red-500 text-center">{error}</p>
                                )}

                                {message && (
                                    <p className="text-sm text-[var(--moss)] text-center">{message}</p>
                                )}

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isLoading}
                                    className="w-full bg-[var(--moss)] text-[var(--paper)] hover:opacity-90"
                                >
                                    {isLoading ? "Sending..." : "Send magic link"}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--moss)] bg-opacity-20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-[var(--moss)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold">Check your email</h2>
                                <p className="text-[var(--stone)]">
                                    {"We've sent a magic link to"}
                                    <br />
                                    <span className="font-medium text-[var(--ink)]">{email}</span>
                                </p>
                                <p className="text-sm text-[var(--ash)] pt-4">Redirecting you to the app...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
