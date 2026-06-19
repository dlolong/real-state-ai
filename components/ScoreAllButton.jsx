"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ScoreAllButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const scoreAll = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/properties/score-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 100,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to score all");
      }

      setMessage(`Scored ${json.updated} properties.`);
      router.refresh();
    } catch (err) {
      setMessage(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="text-right">
      <button
        onClick={scoreAll}
        disabled={loading}
        className="bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-60"
      >
        {loading ? "Scoring..." : "Score Imported Deals"}
      </button>

      {message && (
        <p className="text-xs text-gray-400 mt-2">
          {message}
        </p>
      )}
    </div>
  );
}