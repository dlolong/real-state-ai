import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export default async function SourcesPage() {
    const supabase = createSupabaseAdmin();

    const { data: sources, error } = await supabase
  .from("county_sources")
  .select(`
    id,
    county,
    state,
    assessor_url,
    recorder_url,
    gis_url,
    open_data_url,
    platform,
    api_type,
    scraping_method,
    confidence_score,
    notes,
    created_at
  `)
  .order("created_at", { ascending: false });

    if (error) {
        return (
            <div className="w-full min-w-0">
                <h1 className="text-2xl font-bold">Data Sources</h1>
                <p className="text-red-400 mt-4 break-words">{error.message}</p>
            </div>
        );
    }

    const sourceRows = [];

    for (const source of sources || []) {
        let serviceCount = 0;

        if (source.id) {
            const { count } = await supabase
                .from("arcgis_services")
                .select("*", { count: "exact", head: true })
                .eq("county_source_id", source.id);

            serviceCount = count || 0;
        }

        sourceRows.push({
            ...source,
            service_count: serviceCount,
        });
    }

    return (
        <div className="w-full min-w-0">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold">Data Sources</h1>
                    <p className="text-gray-400 mt-1 break-words">
                        Counties and GIS sources discovered by your County Detector.
                    </p>
                </div>

                <Link
                    href="/county-detector"
                    className="shrink-0 bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-200 text-center"
                >
                    Discover New County
                </Link>
            </div>

            <div className="mt-6 grid gap-4">
                {sourceRows.map((source, index) => (
                    <SourceCard
                        key={source.id || `${source.county}-${source.state}-${index}`}
                        source={source}
                    />
                ))}
            </div>

            {sourceRows.length === 0 && (
                <div className="mt-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-gray-400">
                    No sources yet. Use County Detector first.
                </div>
            )}
        </div>
    );
}

function SourceCard({ source }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 min-w-0">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold break-words">
                            {source.county}, {source.state}
                        </h2>

                        <Badge>{source.platform || "Unknown"}</Badge>
                        <Badge>{source.confidence_score || 0}% Confidence</Badge>
                    </div>

                    <p className="text-xs text-gray-500 mt-2 break-all">
                        Source ID: {source.id || "Missing ID"}
                    </p>

                    <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <InfoBox label="GIS URL" value={source.gis_url || "No GIS URL"} />
                        <InfoBox label="Services" value={source.service_count} />
                        <InfoBox label="API Type" value={source.api_type || "—"} />
                        <InfoBox label="Method" value={source.scraping_method || "—"} />
                    </div>

                    {source.notes && (
                        <div className="mt-3 bg-slate-800/70 rounded-xl p-3 min-w-0">
                            <p className="text-xs text-gray-400">Notes</p>
                            <p className="text-sm text-gray-300 mt-1 break-words">
                                {source.notes}
                            </p>
                        </div>
                    )}
                </div>

                {source?.id ? (
                    <Link
                        href={`/sources/${source.id}`}
                        className="shrink-0 bg-slate-700 text-white px-4 py-2 rounded-xl hover:bg-slate-600 text-center"
                    >
                        View Layers
                    </Link>
                ) : (
                    <div className="shrink-0">
                        <button
                            disabled
                            className="bg-slate-800 text-gray-500 px-4 py-2 rounded-xl cursor-not-allowed"
                        >
                            Missing Source ID
                        </button>

                        <p className="text-xs text-red-400 mt-2">
                            This source row has no ID.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoBox({ label, value }) {
    return (
        <div className="bg-slate-800/70 rounded-xl p-3 min-w-0">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-medium text-white mt-1 break-words whitespace-normal">
                {value || "—"}
            </p>
        </div>
    );
}

function Badge({ children }) {
    return (
        <span className="text-xs bg-slate-800 text-gray-300 px-3 py-1 rounded-full break-words">
            {children}
        </span>
    );
}