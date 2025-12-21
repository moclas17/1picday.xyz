"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="w-10 h-10" />
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="rounded-full p-2 transition-colors hover:opacity-80"
      style={{
        backgroundColor: "transparent",
        border: `1px solid var(--mist)`,
      }}
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5" style={{ color: "var(--ink)" }} />
      ) : (
        <Sun className="w-5 h-5" style={{ color: "var(--ink)" }} />
      )}
    </button>
  )
}
