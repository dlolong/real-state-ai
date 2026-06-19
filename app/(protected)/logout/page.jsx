"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppLogo from "@/components/AppLogo";

export default function LogoutPage() {
    const router = useRouter();
    const [message, setMessage] = useState("Signing you out...");

    useEffect(() => {
        const logout = async () => {
            try {
                await supabase.auth.signOut();

                setMessage("You have been signed out.");

                setTimeout(() => {
                    router.replace("/login");
                }, 500);
            } catch (error) {
                setMessage("Logout failed. Please try again.");
            }
        };

        logout();
    }, [router]);

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-sm">
                <div className="flex justify-center mb-6">
                    <AppLogo href="/" imageClassName="h-12 w-auto" />
                </div>

                <h1 className="text-2xl font-bold mt-4">Logout</h1>

                <p className="text-gray-400 mt-2">
                    {message}
                </p>
            </div>
        </main>
    );
}