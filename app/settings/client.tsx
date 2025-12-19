"use client"

import { useState } from "react"
import { Crown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { useRouter } from "next/navigation"

interface SettingsClientProps {
    email: string
    isPro: boolean
    photoCount: number
    proSince?: string | null
}

export function SettingsClient({ email, isPro, photoCount, proSince }: SettingsClientProps) {
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const router = useRouter()

    const handleLogout = async () => {
        setLoggingOut(true)
        try {
            await fetch("/api/auth/logout", { method: "POST" })
            router.push("/login")
            router.refresh()
        } catch (error) {
            console.error("Logout failed:", error)
            setLoggingOut(false)
        }
    }

    const handleUpgrade = async () => {
        try {
            const res = await fetch("/api/stripe/create-checkout", {
                method: "POST",
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                alert("Failed to start checkout")
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <>
            <div className="min-h-screen bg-[var(--paper)] pb-20">
                <AppHeader />

                <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    <h1 className="text-2xl font-bold text-[var(--ink)]">Settings</h1>

                    {/* Account */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium text-[var(--stone)]">Account</h2>
                        <div className="bg-[var(--mist)] bg-opacity-50 rounded-[var(--radius)] p-4">
                            <p className="text-sm text-[var(--ash)]">Signed in as</p>
                            <p className="font-medium text-[var(--ink)]">{email}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium text-[var(--stone)]">Stats</h2>
                        <div className="bg-[var(--mist)] bg-opacity-50 rounded-[var(--radius)] p-4">
                            <p className="text-2xl font-bold text-[var(--ink)]">{photoCount}</p>
                            <p className="text-sm text-[var(--stone)]">Photos captured</p>
                        </div>
                    </div>

                    {/* Plan */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium text-[var(--stone)]">Plan</h2>
                        <div className="bg-[var(--mist)] bg-opacity-50 rounded-[var(--radius)] p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-[var(--ink)] flex items-center gap-2">
                                        {isPro ? (
                                            <>
                                                <Crown className="w-4 h-4 text-[var(--sun)]" />
                                                Pro Plan
                                            </>
                                        ) : (
                                            "Free Plan"
                                        )}
                                    </p>
                                    <p className="text-sm text-[var(--stone)]">
                                        {isPro ? "Unlimited daily photos" : `${Math.max(0, 7 - photoCount)} of 7 free left`}
                                    </p>
                                </div>
                            </div>

                            {!isPro && (
                                <Button
                                    onClick={handleUpgrade}
                                    className="w-full bg-[var(--sun)] text-[var(--ink)] hover:opacity-90"
                                >
                                    <Crown className="w-4 h-4 mr-2" />
                                    Upgrade to Pro
                                </Button>
                            )}

                            {isPro && proSince && (
                                <p className="text-sm text-[var(--stone)]">
                                    Pro since {new Date(proSince).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4">
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full border-[var(--mist)] text-[var(--stone)] hover:text-[var(--ink)] hover:bg-[var(--mist)] hover:bg-opacity-50 bg-transparent"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            {loggingOut ? "Signing out..." : "Sign Out"}
                        </Button>
                    </div>
                </main>

                <BottomNav active="settings" />
            </div>

            <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} />
        </>
    )
}
