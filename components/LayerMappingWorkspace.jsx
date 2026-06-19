"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const APP_FIELDS = [
  {
    key: "parcel_id",
    label: "APN / Parcel ID",
  },
  {
    key: "address",
    label: "Situs / Property Address",
  },
  {
    key: "owner_name",
    label: "Owner Name",
  },
  {
    key: "mailing_address",
    label: "Mailing Address",
  },
  {
    key: "land_value",
    label: "Land Value",
  },
  {
    key: "improvement_value",
    label: "Improvement Value",
  },
  {
    key: "assessed_value",
    label: "Assessed / Total Value",
  },
  {
    key: "tax_status",
    label: "Tax Status",
  },
  {
    key: "source_object_id",
    label: "Object ID",
  },
];

export default function LayerMappingWorkspace({
  layer,
  savedMapping,
}) {
  const router = useRouter();

  const [loadingSample, setLoadingSample] = useState(false);
  const [sample, setSample] = useState(null);
  const [mapping, setMapping] = useState(savedMapping?.mapping || {});
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  const fields = useMemo(() => {
    const metadataFields = sample?.fields || [];
    const recordKeys = Object.keys(sample?.records?.[0] || {});

    const names = [
      ...metadataFields.map((field) => field.name),
      ...recordKeys,
    ].filter(Boolean);

    return [...new Set(names)].sort();
  }, [sample]);

  useEffect(() => {
    loadSample();
  }, []);

  const loadSample = async () => {
    setLoadingSample(true);
    setMessage("");

    try {
      const res = await fetch("/api/arcgis/layer-sample", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layerDbId: layer.id,
          limit: 10,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to load sample");
      }

      setSample(json);
    } catch (err) {
      setMessage(err.message);
    }

    setLoadingSample(false);
  };

  const saveMapping = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/arcgis/save-field-mapping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layerDbId: layer.id,
          mapping,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to save mapping");
      }

      setMessage("Field mapping saved.");
    } catch (err) {
      setMessage(err.message);
    }

    setSaving(false);
  };

  const reimportLayer = async () => {
    setImporting(true);
    setMessage("");

    try {
      const res = await fetch("/api/arcgis/reimport-layer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layerDbId: layer.id,
          limit: 100,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to re-import layer");
      }

      setMessage(`Imported ${json.inserted} of ${json.pulled} records.`);
      router.refresh();
    } catch (err) {
      setMessage(err.message);
    }

    setImporting(false);
  };

  const updateMapping = (appField, sourceField) => {
    setMapping((current) => ({
      ...current,
      [appField]: sourceField || "",
    }));
  };

  const firstRecord = sample?.records?.[0] || {};

  return (
    <div className="space-y-6">
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-bold text-lg">Layer Actions</h2>

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={loadSample}
            disabled={loadingSample}
            className="bg-slate-700 text-white px-4 py-2 rounded-xl hover:bg-slate-600 disabled:opacity-60"
          >
            {loadingSample ? "Loading..." : "Refresh Sample"}
          </button>

          <button
            onClick={saveMapping}
            disabled={saving}
            className="bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Field Mapping"}
          </button>

          <button
            onClick={reimportLayer}
            disabled={importing}
            className="bg-green-500 text-black px-4 py-2 rounded-xl font-semibold hover:bg-green-400 disabled:opacity-60"
          >
            {importing ? "Importing..." : "Re-import 100 Records"}
          </button>
        </div>

        {message && (
          <p className="text-sm text-gray-400 mt-4">
            {message}
          </p>
        )}
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-bold text-lg">Field Mapping</h2>
          <p className="text-gray-400 text-sm mt-1">
            Map county fields into your SaaS property fields.
          </p>
        </div>

        <div className="p-5 grid md:grid-cols-2 gap-4">
          {APP_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="text-sm text-gray-400">
                {field.label}
              </label>

              <select
                value={mapping[field.key] || ""}
                onChange={(e) => updateMapping(field.key, e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none"
              >
                <option value="">Not mapped</option>

                {fields.map((sourceField) => (
                  <option key={sourceField} value={sourceField}>
                    {sourceField}
                  </option>
                ))}
              </select>

              {mapping[field.key] && (
                <p className="text-xs text-gray-500 mt-1">
                  Sample:{" "}
                  {String(firstRecord[mapping[field.key]] ?? "No value")}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-bold text-lg">Sample Records</h2>
          <p className="text-gray-400 text-sm mt-1">
            Preview raw records from this ArcGIS layer.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-950 text-gray-400">
              <tr>
                {fields.slice(0, 12).map((field) => (
                  <th key={field} className="text-left px-3 py-3 whitespace-nowrap">
                    {field}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {(sample?.records || []).map((record, index) => (
                <tr key={index}>
                  {fields.slice(0, 12).map((field) => (
                    <td key={field} className="px-3 py-3 whitespace-nowrap">
                      {String(record[field] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!sample?.records?.length && (
          <div className="p-5 text-gray-400">
            {loadingSample ? "Loading sample records..." : "No sample records loaded."}
          </div>
        )}
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-bold text-lg">All Available Fields</h2>
        </div>

        <div className="p-5 flex flex-wrap gap-2">
          {fields.map((field) => (
            <span
              key={field}
              className="bg-slate-800 text-gray-300 text-xs px-3 py-1 rounded-full"
            >
              {field}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}