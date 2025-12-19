import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LoginClient from "./client";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: { message?: string };
}) {
    const supabase = createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (session) {
        return redirect("/app");
    }

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
            <LoginClient message={searchParams.message} />
        </div>
    );
}
