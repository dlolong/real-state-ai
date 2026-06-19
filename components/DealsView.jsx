"use client";

import { useEffect, useMemo, useState } from "react";
import DealCard from "@/components/DealCard";
import ScorePropertyButton from "@/components/ScorePropertyButton";
import Link from "next/link";

export default function DealsView({ properties = [] }) {
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const savedView = localStorage.getItem("deals_view");

    if (savedView === "table" || savedView === "thumbnail") {
      setView(savedView);
    }
  }, []);

  const changeView = (nextView) => {
    setView(nextView);
    localStorage.setItem("deals_view", nextView);
  };

  const filteredProperties = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return properties;

    return properties.filter((property) => {
      return [
        property.address,
        property.owner_name,
        property.parcel_id,
        property.county,
        property.state,
        property.deal_grade,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [properties, search]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address, owner, APN, county..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-slate-600"
          />
        </div>

        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => changeView("table")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              view === "table"
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Table View
          </button>

          <button
            onClick={() => changeView("thumbnail")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              view === "thumbnail"
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Thumbnail View
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Showing {filteredProperties.length} of {properties.length} deals
      </div>

      {filteredProperties.length === 0 && (
        <div className="mt-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-gray-400">
          No properties found. Pull sample records first from County Detector.
        </div>
      )}

      {view === "thumbnail" && filteredProperties.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {filteredProperties.map((property) => (
            <DealCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {view === "table" && filteredProperties.length > 0 && (
        <DealsTable properties={filteredProperties} />
      )}
    </div>
  );
}

function DealsTable({ properties }) {
  const [items, setItems] = useState(properties);

  useEffect(() => {
    setItems(properties);
  }, [properties]);

  const updateScoredProperty = (updatedProperty) => {
    setItems((current) =>
      current.map((item) =>
        item.id === updatedProperty.id ? updatedProperty : item
      )
    );
  };

  return (
    <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 text-gray-400">
            <tr>
              <Th>Property</Th>
              <Th>Owner</Th>
              <Th>APN</Th>
              <Th>Values</Th>
              <Th>Score</Th>
              <Th>Grade</Th>
              <Th>Est. Profit</Th>
              <Th>Action</Th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {items.map((property) => (
              <tr
                key={property.id}
                className="hover:bg-slate-800/60 transition"
              >
                <Td>
                  <div>
                    <p className="font-semibold text-white">
                      {property.address || "No address"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {property.county}, {property.state}
                    </p>
                  </div>
                </Td>

                <Td>
                  <span className="text-gray-300">
                    {property.owner_name || "Unknown"}
                  </span>
                </Td>

                <Td>
                  <span className="text-gray-300">
                    {property.parcel_id || "—"}
                  </span>
                </Td>

                <Td>
                  <div className="space-y-1 text-xs">
                    <p>
                      <span className="text-gray-500">Assessed:</span>{" "}
                      {formatMoney(property.assessed_value)}
                    </p>
                    <p>
                      <span className="text-gray-500">Land:</span>{" "}
                      {formatMoney(property.land_value)}
                    </p>
                    <p>
                      <span className="text-gray-500">Improve:</span>{" "}
                      {formatMoney(property.improvement_value)}
                    </p>
                  </div>
                </Td>

                <Td>
                  <ScoreBadge score={property.deal_score} />
                </Td>

                <Td>
                  <GradeBadge grade={property.deal_grade} />
                </Td>

                <Td>
                  <span className="font-semibold text-green-400">
                    {formatMoney(property.estimated_profit)}
                  </span>
                </Td>

                <Td>
                    
                 <div className="min-w-32 space-y-2">
  {property?.id ? (
  <Link
    href={`/deals/${property.id}`}
    className="block text-center bg-slate-700 text-white py-2 rounded-xl text-sm hover:bg-slate-600"
  >
    View
  </Link>
) : (
  <button
    disabled
    className="block w-full bg-slate-700 text-gray-400 py-2 rounded-xl text-sm cursor-not-allowed"
  >
    Missing ID
  </button>
)}

  <ScorePropertyButton
    propertyId={property.id}
    useAI={false}
    onScored={updateScoredProperty}
  />
</div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left font-medium px-4 py-3 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="px-4 py-4 align-top whitespace-nowrap">
      {children}
    </td>
  );
}

function ScoreBadge({ score }) {
  const value = Number(score);

  if (!Number.isFinite(value)) {
    return (
      <span className="px-3 py-1 rounded-full bg-slate-700 text-gray-300 text-xs font-semibold">
        Unscored
      </span>
    );
  }

  const className =
    value >= 85
      ? "bg-green-500/20 text-green-300"
      : value >= 70
      ? "bg-blue-500/20 text-blue-300"
      : value >= 55
      ? "bg-yellow-500/20 text-yellow-300"
      : "bg-red-500/20 text-red-300";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {value}/100
    </span>
  );
}

function GradeBadge({ grade }) {
  const value = grade || "—";

  const className =
    value === "A"
      ? "bg-green-500/20 text-green-300"
      : value === "B"
      ? "bg-blue-500/20 text-blue-300"
      : value === "C"
      ? "bg-yellow-500/20 text-yellow-300"
      : value === "D"
      ? "bg-red-500/20 text-red-300"
      : "bg-slate-700 text-gray-300";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {value}
    </span>
  );
}

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return `$${number.toLocaleString()}`;
}