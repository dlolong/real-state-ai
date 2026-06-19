"use client";

import { useState } from "react";
import ScorePropertyButton from "@/components/ScorePropertyButton";
import Link from "next/link";

export default function DealCard({ property }) {
  const [item, setItem] = useState(property);

  const score = item?.deal_score || 0;
  const grade = item?.deal_grade || "—";

  const gradeClass =
    grade === "A"
      ? "bg-green-500/20 text-green-300"
      : grade === "B"
      ? "bg-blue-500/20 text-blue-300"
      : grade === "C"
      ? "bg-yellow-500/20 text-yellow-300"
      : grade === "D"
      ? "bg-red-500/20 text-red-300"
      : "bg-slate-700 text-gray-300";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-bold text-lg">
            {item?.address || "No address"}
          </h3>

          <p className="text-sm text-gray-400">
            {item?.county}, {item?.state}
          </p>

          {item?.parcel_id && (
            <p className="text-xs text-gray-500 mt-1">
              APN: {item.parcel_id}
            </p>
          )}
        </div>

        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${gradeClass}`}>
          {grade} · {score}/100
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat
          label="Owner"
          value={item?.owner_name || "Unknown"}
        />

        <Stat
          label="Assessed"
          value={formatMoney(item?.assessed_value)}
        />

        <Stat
          label="Land"
          value={formatMoney(item?.land_value)}
        />

        <Stat
          label="Improvement"
          value={formatMoney(item?.improvement_value)}
        />

        <Stat
          label="Est. Profit"
          value={formatMoney(item?.estimated_profit)}
          highlight
        />

        <Stat
          label="Motivation"
          value={item?.motivation_score ? `${item.motivation_score}/100` : "—"}
        />
      </div>

      {item?.deal_summary && (
        <div className="mt-4 p-3 bg-slate-800 rounded-xl text-xs text-gray-300 leading-relaxed">
          🧠 {item.deal_summary}
        </div>
      )}

     {item?.id ? (
  <Link
    href={`/deals/${item.id}`}
    className="block w-full text-center bg-white text-black py-2 rounded-xl font-medium hover:bg-gray-200"
  >
    View Details
  </Link>
) : (
  <button
    disabled
    className="w-full bg-slate-700 text-gray-400 py-2 rounded-xl cursor-not-allowed"
  >
    Missing ID
  </button>
)}

      <div className="mt-5">
        <ScorePropertyButton
          propertyId={item.id}
          useAI={false}
          onScored={setItem}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className="bg-slate-800 p-3 rounded-xl">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`font-semibold truncate ${highlight ? "text-green-400" : "text-white"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return `$${number.toLocaleString()}`;
}