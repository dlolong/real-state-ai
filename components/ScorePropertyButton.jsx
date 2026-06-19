"use client";

import { useState } from "react";

export default function ScorePropertyButton({
  propertyId,
  useAI = false,
  onScored,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scoreProperty = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/properties/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          useAI,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to score property");
      }

      if (onScored) {
        onScored(json.property);
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={scoreProperty}
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 rounded-xl font-medium hover:bg-blue-600 disabled:opacity-60"
      >
        {loading ? "Scoring..." : useAI ? "AI Score Deal" : "Score Deal"}
      </button>

      {error && (
        <p className="text-red-400 text-xs mt-2">
          {error}
        </p>
      )}
    </div>
  );
}