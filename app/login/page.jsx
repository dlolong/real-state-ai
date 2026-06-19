"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppLogo from "@/components/AppLogo";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <AppLogo href="/" imageClassName="h-12 w-auto" />
        </div>

        <h1 className="text-3xl font-bold">Welcome back</h1>

        <p className="text-gray-400 mt-2">
          Login to your real estate AI dashboard.
        </p>

        <form onSubmit={login} className="mt-8 space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email address"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-white"
            required
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-white"
            required
          />

          <button
            disabled={loading}
            className="w-full bg-white text-black rounded-xl py-3 font-semibold hover:bg-gray-200 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-red-400">{message}</p>
        )}

        <p className="text-sm text-gray-400 mt-6 text-center">
          No account yet?{" "}
          <a href="/signup" className="text-white font-medium">
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}