"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function ProtectedLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
      <div className="h-dvh flex items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-dvh bg-slate-950 text-white overflow-hidden">
      {/* MOBILE SIDEBAR OVERLAY */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileSidebarOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-slate-900">
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex h-full overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:block h-full shrink-0">
          <Sidebar />
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
          {/* MOBILE TOP BAR */}
          <header className="md:hidden h-16 shrink-0 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="text-center">
              <h1 className="font-bold leading-none">DealAI</h1>
              <p className="text-xs text-gray-500 mt-1">Real Estate OS</p>
            </div>

            <div className="h-10 w-10" />
          </header>

          {/* SCROLLABLE CONTENT ONLY */}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}