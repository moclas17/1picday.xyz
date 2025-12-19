"use client";

import Link from "next/link";
import { ModeToggle } from "./theme-toggle";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
    const pathname = usePathname();

    const links = [
        { href: "/app", label: "Today" },
        { href: "/recap", label: "Recap" },
        { href: "/settings", label: "Settings" },
    ];

    return (
        <header className="flex h-16 w-full items-center justify-between px-6 border-b border-mist/20">
            <div className="flex items-center gap-6">
                <Link href="/app" className="text-xl font-bold tracking-tight text-ink">
                    1picday
                </Link>
                <nav className="hidden md:flex items-center gap-4">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-ink",
                                pathname === link.href ? "text-ink" : "text-stone"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="flex items-center gap-4">
                <ModeToggle />
            </div>
        </header>
    );
}
