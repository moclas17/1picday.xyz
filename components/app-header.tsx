import { ImageIcon } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { PWAInstallButton } from "./pwa-install-button"

export function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--paper)] border-b border-[var(--mist)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[var(--moss)] flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-[var(--paper)]" />
          </div>
          <span className="font-bold text-[var(--ink)]">1picday</span>
        </div>
        <div className="flex items-center gap-1">
          <PWAInstallButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
