"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function WaitlistForm() {
    const [email, setEmail] = useState("")
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (email) {
            setSubmitted(true)
        }
    }

    if (submitted) {
        return (
            <div className="text-[#5f7a6a] font-medium p-4 bg-[#5f7a6a]/10 rounded-2xl border border-[#5f7a6a]/20">
                You're on the list. We'll email you when it's ready.
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 max-w-md mx-auto">
            <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-black/40 border border-[#1a211b] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#5f7a6a] transition-colors text-white"
            />
            <select className="bg-black/40 border border-[#1a211b] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#5f7a6a] appearance-none cursor-pointer text-white">
                <option value="US">🇺🇸 United States</option>
                <option value="MX">🇲🇽 Mexico</option>
                <option value="ES">🇪🇸 Spain</option>
            </select>
            <Button type="submit" className="bg-[#5f7a6a] text-white rounded-2xl px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity h-auto">
                Join
            </Button>
        </form>
    )
}
