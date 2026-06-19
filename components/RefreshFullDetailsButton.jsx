"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshFullDetailsButton({ propertyId }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const refreshDetails = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/properties/full-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ propertyId }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to refresh details");
      }

      setMessage("Full county details refreshed.");
      router.refresh();
    } catch (err) {
      setMessage(err.message);
    }

    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={refreshDetails}
        disabled={loading}
        className="bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-60"
      >
        {loading ? "Fetching..." : "Refresh Full County Details"}
      </button>

      {message && (
        <p className="text-sm text-gray-400 mt-2">
          {message}
        </p>
      )}
    </div>
  );
}