"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const signup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "investor",
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created. Check your email to confirm your account.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">Create account</h1>
        <p className="text-gray-400 mt-2">
          Start finding off-market real estate deals.
        </p>

        <form onSubmit={signup} className="mt-8 space-y-4">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-white"
            required
          />

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
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-green-400">{message}</p>
        )}

        <p className="text-sm text-gray-400 mt-6 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-white font-medium">
            Login
          </a>
        </p>
      </div>
    </main>
  );
}