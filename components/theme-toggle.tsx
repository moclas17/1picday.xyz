"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

export function ModeToggle({ className }: { className?: string }) {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <button className={cn("p-2 rounded-md hover:bg-mist/20 text-ink", className)} aria-label="Toggle theme">
                <div className="w-5 h-5" />
            </button>
        )
    }

    return (
        <button
            className={cn("p-2 rounded-md hover:bg-mist/20 text-ink transition-colors", className)}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
