import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginClient from "./client";

interface PageProps {
    searchParams: Promise<{ message?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
    const session = await getSession();
    if (session) {
        redirect("/app");
    }

    const params = await searchParams;

    return (
        <div className="flex-1 flex flex-col w-full px-6 justify-center gap-2 mx-auto min-h-screen min-h-[100dvh] bg-background">
            <LoginClient message={params.message} />
        </div>
    );
}
