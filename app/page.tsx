import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const session = await getSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--paper)] text-[var(--ink)] px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-[var(--radius)] bg-[var(--moss)] flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-[var(--paper)]" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-balance">1picday</h1>
          <p className="text-lg text-[var(--stone)] text-pretty">
            One photo, every day. Build your visual story, one moment at a time.
          </p>
        </div>

        <div className="pt-4">
          <Button asChild size="lg" className="w-full bg-[var(--moss)] text-[var(--paper)] hover:opacity-90">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>

        <p className="text-sm text-[var(--ash)]">First 7 photos are free. Go Pro for unlimited daily memories.</p>
      </div>
    </div>
  );
}
