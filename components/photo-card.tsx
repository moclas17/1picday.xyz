"use client"
import { parseDateLocal } from "@/lib/utils"

interface PhotoCardProps {
  photo: {
    id: string
    date: string
    url: string
    note?: string
  }
}

export function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <div className="bg-[var(--mist)] bg-opacity-30 rounded-[var(--radius)] overflow-hidden">
      <div className="aspect-square relative bg-[var(--mist)]">
        <img
          src={photo.url || "/placeholder.svg"}
          alt={`Photo from ${photo.date}`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 space-y-2">
        <p className="text-sm font-medium text-[var(--stone)]">
          {parseDateLocal(photo.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {photo.note && <p className="text-[var(--ink)]">{photo.note}</p>}
      </div>
    </div>
  )
}
