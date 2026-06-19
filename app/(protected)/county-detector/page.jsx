"use client";

import { useState } from "react";
import PullSampleRecordsButton from "@/components/PullSampleRecordsButton";

export default function CountyDetectorPage() {
  const [county, setCounty] = useState("Los Angeles County");
  const [state, setState] = useState("CA");
  const [gisUrl, setGisUrl] = useState("https://lacounty.maps.arcgis.com/");
  const [maxServices, setMaxServices] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runDiscovery = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/discover-arcgis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          county,
          state,
          gisUrl,
          maxServices: Number(maxServices),
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
    <div>
      <h1 className="text-2xl font-bold">Auto County Detector</h1>
      <p className="text-gray-400 mt-2">
        Discover ArcGIS REST services, layers, and query URLs from a county GIS URL.
      </p>

      <div className="mt-6 bg-slate-900 p-6 rounded-2xl max-w-4xl border border-slate-800">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">County</label>
            <input
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="w-full mt-1 bg-slate-800 p-3 rounded-xl outline-none"
              placeholder="Los Angeles County"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">State</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full mt-1 bg-slate-800 p-3 rounded-xl outline-none"
              placeholder="CA"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-400">County GIS URL</label>
          <input
            value={gisUrl}
            onChange={(e) => setGisUrl(e.target.value)}
            className="w-full mt-1 bg-slate-800 p-3 rounded-xl outline-none"
            placeholder="https://county.maps.arcgis.com/"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-400">Max services to scan</label>
          <input
            type="number"
            value={maxServices}
            onChange={(e) => setMaxServices(e.target.value)}
            className="w-full mt-1 bg-slate-800 p-3 rounded-xl outline-none"
          />
        </div>

        <button
          onClick={runDiscovery}
          disabled={loading}
          className="mt-5 bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-60"
        >
          {loading ? "Discovering..." : "Discover ArcGIS Endpoints"}
        </button>
      </div>

      {result && (
        <div className="mt-6 max-w-6xl">
          {!result.success && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">
              {result.error}
            </div>
          )}

          {result.success && (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <StatCard
                  label="Roots Found"
                  value={result.discovery.roots?.length || 0}
                />
                <StatCard
                  label="Services Found"
                  value={result.discovery.service_count || 0}
                />
                <StatCard
                  label="Services Saved"
                  value={result.saved.services_saved || 0}
                />
              </div>

              <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h2 className="font-bold">Discovered Services</h2>
                </div>

                <div className="divide-y divide-slate-800">
                  {result.discovery.services.map((service) => (
                    <div key={service.url} className="p-4">
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-gray-400 break-all">
                            {service.url}
                          </p>
                        </div>

                        <span className="h-fit text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                          {service.type}
                        </span>
                      </div>

                      <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-slate-950 p-3 rounded-xl">
                          Layers: {service.layer_count}
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl">
                          Tables: {service.table_count}
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl">
                          Capabilities: {service.capabilities || "N/A"}
                        </div>
                      </div>

                      {service.layers?.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {service.layers.slice(0, 5).map((layer) => (
                            <div
                              key={`${service.url}-${layer.layer_id}`}
                              className="bg-slate-800 p-3 rounded-xl"
                            >
                              <div className="flex justify-between gap-3">
                                <span className="font-medium">
                                  Layer {layer.layer_id}: {layer.layer_name}
                                </span>

                                <span className="text-xs text-gray-400">
                                  {layer.geometry_type || layer.layer_type}
                                </span>
                              </div>

                              <p className="text-xs text-gray-400 mt-2 break-all">
                                {layer.sample_query_url}
                              </p>

                              {hasValueFields(layer) && (
                                <span className="inline-block mt-2 text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                                  Possible Value Fields Found
                                </span>
                              )}

                              <PullSampleRecordsButton
                                county={county}
                                state={state}
                                serviceUrl={service.url}
                                layerId={layer.layer_id}
                                layerName={layer.layer_name}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <details className="mt-6 bg-slate-900 p-4 rounded-xl">
                <summary className="cursor-pointer font-semibold">
                  Raw JSON
                </summary>
                <pre className="mt-4 text-xs overflow-auto bg-slate-950 p-4 rounded-xl">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
      <p className="text-gray-400 text-sm">{label}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  );
}

function hasValueFields(layer) {
  const fields = layer.fields || [];

  return fields.some((field) => {
    const name = String(field.name || "").toLowerCase();
    return (
      name.includes("land") ||
      name.includes("improve") ||
      name.includes("impr") ||
      name.includes("assess") ||
      name.includes("value") ||
      name.includes("roll")
    );
  });
}