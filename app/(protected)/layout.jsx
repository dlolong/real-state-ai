"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function ProtectedLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white overflow-hidden flex">
      {/* Sidebar does not scroll with content */}
      <div className="h-screen shrink-0">
        <Sidebar />
      </div>

      {/* Only this area scrolls */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}