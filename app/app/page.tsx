import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { UploadSection } from "@/components/upload-section";
import { PhotoCard } from "@/components/photo-card";
import { redirect } from "next/navigation";

export default async function AppPage() {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch photos
    const { data: photos } = await supabase
        .from("daily_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

    const today = new Date().toISOString().split("T")[0];
    const hasUploadedToday = photos?.some((p) => p.date === today);

    // Check limits just for UI hint (optional, simpler to just show upload if not done)
    // Logic: If not uploaded today, show upload section.
    // Note: The upload component will handle the "limit reached" error gracefully if triggered.

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 w-full max-w-2xl mx-auto p-6 flex flex-col gap-8">

                {/* Today's Action */}
                {!hasUploadedToday ? (
                    <section className="animate-in slide-in-from-bottom-4 duration-500">
                        <UploadSection />
                    </section>
                ) : (
                    <div className="p-4 bg-moss/10 text-moss rounded-md text-center">
                        You&apos;ve uploaded your photo for today. Come back tomorrow!
                    </div>
                )}

                {/* Timeline */}
                <section className="flex flex-col gap-6">
                    <h2 className="text-lg font-semibold text-ink">Your Timeline</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {photos?.map((photo) => (
                            <PhotoCard key={photo.id} photo={photo} />
                        ))}
                        {photos?.length === 0 && (
                            <p className="text-stone col-span-2 text-center py-10">No photos yet.</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
