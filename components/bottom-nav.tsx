"use client"

import Link from "next/link"
import { Home, Grid3x3, Settings } from "lucide-react"

interface BottomNavProps {
  active: "home" | "recap" | "settings"
}

export function BottomNav({ active }: BottomNavProps) {
  const navItems = [
    { name: "home", label: "Home", icon: Home, href: "/app" },
    { name: "recap", label: "Recap", icon: Grid3x3, href: "/recap" },
    { name: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--paper)] border-t border-[var(--mist)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.name
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${isActive ? "text-[var(--moss)]" : "text-[var(--ash)] hover:text-[var(--stone)]"
                }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
