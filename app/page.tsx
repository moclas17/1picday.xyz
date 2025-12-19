import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/app");
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-ink">1picday</h1>
      <p className="text-xl text-stone max-w-md">
        A private journal to capture your life, one photo a day.
      </p>

      <div className="flex gap-4 mt-4">
        <Link
          href="/login"
          className="bg-ink text-paper px-6 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>
      </div>

      <footer className="absolute bottom-6 text-sm text-stone">
        Simple. Private. Yours.
      </footer>
    </div>
  );
}
