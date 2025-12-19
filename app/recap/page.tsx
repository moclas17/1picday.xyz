import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { PhotoCard } from "@/components/photo-card";
import { redirect } from "next/navigation";

export default async function RecapPage() {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch last 7 photos
    const { data: photos } = await supabase
        .from("daily_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(7);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 w-full max-w-4xl mx-auto p-6 flex flex-col gap-8">
                <h1 className="text-2xl font-bold text-ink">Last 7 Days</h1>

                {(!photos || photos.length === 0) ? (
                    <div className="text-stone">No photos found. Start uploading!</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map((photo) => (
                            <PhotoCard key={photo.id} photo={photo} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
