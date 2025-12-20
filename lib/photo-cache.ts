"use client"

const CACHE_KEY = "1picday_photo_cache"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

interface CacheEntry {
    url: string
    timestamp: number
}

export const PhotoCache = {
    get: (s3Key: string): string | null => {
        if (typeof window === "undefined") return null

        try {
            const cacheRaw = localStorage.getItem(CACHE_KEY)
            if (!cacheRaw) return null

            const cache: Record<string, CacheEntry> = JSON.parse(cacheRaw)
            const entry = cache[s3Key]

            if (!entry) return null

            // Check if expired
            if (Date.now() - entry.timestamp > CACHE_TTL) {
                PhotoCache.remove(s3Key)
                return null
            }

            return entry.url
        } catch (e) {
            console.error("Cache read error", e)
            return null
        }
    },

    set: (s3Key: string, url: string) => {
        if (typeof window === "undefined") return

        try {
            const cacheRaw = localStorage.getItem(CACHE_KEY)
            const cache: Record<string, CacheEntry> = cacheRaw ? JSON.parse(cacheRaw) : {}

            // Clean up old entries while we're at it (to keep localStorage small)
            const now = Date.now()
            const cleanedCache: Record<string, CacheEntry> = {}

            Object.entries(cache).forEach(([key, entry]) => {
                if (now - entry.timestamp <= CACHE_TTL) {
                    cleanedCache[key] = entry
                }
            })

            cleanedCache[s3Key] = {
                url,
                timestamp: now
            }

            localStorage.setItem(CACHE_KEY, JSON.stringify(cleanedCache))
        } catch (e) {
            console.error("Cache write error", e)
        }
    },

    remove: (s3Key: string) => {
        if (typeof window === "undefined") return
        try {
            const cacheRaw = localStorage.getItem(CACHE_KEY)
            if (!cacheRaw) return
            const cache: Record<string, CacheEntry> = JSON.parse(cacheRaw)
            delete cache[s3Key]
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
        } catch (e) { /* ignore */ }
    }
}
