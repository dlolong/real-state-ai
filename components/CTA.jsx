"use client";

import { useState } from "react";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!email) return;

    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
        setEmail("");
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  return (
    <section className="bg-white text-black py-20 px-4 text-center">
      <h2 className="text-3xl font-bold">
        Get Early Access Before Everyone Else
      </h2>

      <p className="mt-4 text-gray-600">
        Limited access while we expand county coverage.
      </p>

      <div className="mt-8 flex justify-center">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Enter your email"
          className="px-4 py-3 rounded-l-xl border border-gray-300 w-64"
        />

        <button
          onClick={submit}
          disabled={loading}
          className="bg-black text-white px-6 py-3 rounded-r-xl hover:bg-gray-800"
        >
          {loading ? "Saving..." : "Join Waitlist"}
        </button>
      </div>

      {success && (
        <p className="mt-4 text-green-600 font-medium">
          You’re on the list 🚀
        </p>
      )}
    </section>
  );
}