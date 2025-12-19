"use client"

import { Crown } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const handleUpgrade = () => {
    // Mock Stripe checkout
    alert("Stripe checkout would open here!")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--paper)] border-[var(--mist)] max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[var(--sun)] bg-opacity-20 flex items-center justify-center">
              <Crown className="w-8 h-8 text-[var(--sun)]" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl text-[var(--ink)]">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-center text-[var(--stone)]">
            {"You've used all 7 free photos. Upgrade to continue your daily journey."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-[var(--mist)] bg-opacity-30 rounded-[var(--radius)] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--moss)]" />
              <p className="text-[var(--ink)]">Unlimited daily photos</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--moss)]" />
              <p className="text-[var(--ink)]">Full timeline access</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--moss)]" />
              <p className="text-[var(--ink)]">Support development</p>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-[var(--ink)]">$4.99/month</p>
            <p className="text-sm text-[var(--stone)]">Cancel anytime</p>
          </div>

          <Button
            onClick={handleUpgrade}
            className="w-full bg-[var(--sun)] text-[var(--ink)] hover:opacity-90"
            size="lg"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>

          <Button onClick={() => onOpenChange(false)} variant="ghost" className="w-full text-[var(--stone)]">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
