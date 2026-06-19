"use client";

import { useState } from "react";

export default function PullSampleRecordsButton({
  county,
  state,
  serviceUrl,
  layerId,
  layerName,
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const pullSampleRecords = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/arcgis/pull-sample-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          county,
          state,
          serviceUrl,
          layerId,
          limit: 10,
        }),
      });

      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({
        success: false,
        error: err.message,
      });
    }

    setLoading(false);
  };

  return (
    <div className="mt-3">
      <button
        onClick={pullSampleRecords}
        disabled={loading}
        className="bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 disabled:opacity-60"
      >
        {loading ? "Pulling..." : "Pull Sample Records"}
      </button>

      {result && (
        <div
          className={`mt-3 rounded-xl p-3 text-xs ${
            result.success
              ? "bg-green-500/10 text-green-300 border border-green-500/20"
              : "bg-red-500/10 text-red-300 border border-red-500/20"
          }`}
        >
          {result.success ? (
            <div>
              <p>
                Imported {result.inserted} of {result.pulled} records from{" "}
                <span className="font-semibold">{layerName}</span>.
              </p>

              {result.mapped_fields && (
                <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                  <span>APN: {result.mapped_fields.parcel_id}</span>
                  <span>Address: {result.mapped_fields.address}</span>
                  <span>Owner: {result.mapped_fields.owner_name}</span>
                  <span>Land: {result.mapped_fields.land_value}</span>
                  <span>
                    Improvement: {result.mapped_fields.improvement_value}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}