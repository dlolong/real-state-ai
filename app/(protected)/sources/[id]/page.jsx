import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

function isValidUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
        value || ""
    );
}

function hasPossibleValueFields(layer) {
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

function hasPossibleParcelFields(layer) {
    const fields = layer.fields || [];

    return fields.some((field) => {
        const name = String(field.name || "").toLowerCase();

        return (
            name.includes("apn") ||
            name.includes("ain") ||
            name.includes("parcel") ||
            name.includes("pin")
        );
    });
}

export default async function SourceDetailsPage({ params }) {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || id === "undefined" || id === "null") {
        return (
            <div className="w-full min-w-0">
                <Link href="/sources" className="text-gray-400 hover:text-white">
                    ← Back to Sources
                </Link>

                <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">
                    Missing source ID. Go back to Data Sources and click View Layers again.
                </div>
            </div>
        );
    }

    const supabase = createSupabaseAdmin();

    const { data: source, error: sourceError } = await supabase
        .from("county_sources")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (sourceError || !source) {
        return (
            <div className="w-full min-w-0">
                <Link href="/sources" className="text-gray-400 hover:text-white">
                    ← Back to Sources
                </Link>

                <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">
                    {sourceError?.message || "Source not found"}
                </div>
            </div>
        );
    }


    const { data: services } = await supabase
        .from("arcgis_services")
        .select("*")
        .eq("county_source_id", source.id)
        .order("service_name", { ascending: true });

    const serviceUrls = (services || []).map((service) => service.service_url);

    let layers = [];

    if (serviceUrls.length > 0) {
        const { data } = await supabase
            .from("arcgis_layers")
            .select(`
    id,
    county,
    state,
    service_url,
    layer_id,
    layer_name,
    layer_type,
    geometry_type,
    fields,
    metadata
  `)
            .in("service_url", serviceUrls)
            .order("layer_name", { ascending: true });

        layers = data || [];
    }

    const valueLayers = layers.filter(hasPossibleValueFields);
    const parcelLayers = layers.filter(hasPossibleParcelFields);

    return (
        <div className="space-y-6 w-full min-w-0">
            <Link href="/sources" className="text-gray-400 hover:text-white">
                ← Back to Sources
            </Link>

            <div className='mt-6'>
                <h1 className="text-2xl font-bold break-words">
                    {source.county}, {source.state}
                </h1>

                <p className="text-gray-400 mt-1 break-all">
                    {source.gis_url || "No GIS URL"}
                </p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Stat label="Services" value={services?.length || 0} />
                <Stat label="Layers" value={layers.length} />
                <Stat label="Parcel Layers" value={parcelLayers.length} />
                <Stat label="Value Layers" value={valueLayers.length} />
            </div>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-w-0">
                <div className="p-5 border-b border-slate-800">
                    <h2 className="font-bold text-lg">Discovered Layers</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Look for layers with parcel fields and value fields.
                    </p>
                </div>

                <div className="divide-y divide-slate-800">
                    {layers.map((layer) => (
                        <div key={layer.id} className="p-5 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 min-w-0">
                                <div className="min-w-0">
                                    <h3 className="font-semibold break-words">
                                        {layer.layer_name || `Layer ${layer.layer_id}`}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 break-all">
  DB Layer ID: {layer.id || "Missing"}
</p>

                                    <p className="text-xs text-gray-500 mt-1 break-all">
                                        {layer.service_url}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {hasPossibleParcelFields(layer) && (
                                            <Badge color="blue">Possible Parcel Fields</Badge>
                                        )}

                                        {hasPossibleValueFields(layer) && (
                                            <Badge color="green">Possible Value Fields</Badge>
                                        )}

                                        <Badge>
                                            {layer.geometry_type || layer.layer_type || "Layer"}
                                        </Badge>
                                    </div>
                                </div>

                               {layer?.id ? (
  <Link
    href={`/layers/${layer.id}`}
    className="shrink-0 bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 text-center"
  >
    Open Layer
  </Link>
) : (
  <div className="shrink-0">
    <button
      disabled
      className="bg-slate-800 text-gray-500 px-4 py-2 rounded-xl cursor-not-allowed"
    >
      Missing Layer ID
    </button>

    <p className="text-xs text-red-400 mt-2">
      Layer row has no ID.
    </p>
  </div>
)}
                            </div>
                        </div>
                    ))}
                </div>

                {layers.length === 0 && (
                    <div className="p-6 text-gray-400">
                        No layers found. Run County Detector again for this county.
                    </div>
                )}
            </section>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl min-w-0">
            <p className="text-gray-400 text-sm">{label}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
    );
}

function Badge({ children, color = "slate" }) {
    const styles =
        color === "green"
            ? "bg-green-500/20 text-green-300"
            : color === "blue"
                ? "bg-blue-500/20 text-blue-300"
                : "bg-slate-700 text-gray-300";

    return (
        <span className={`text-xs px-3 py-1 rounded-full ${styles}`}>
            {children}
        </span>
    );
}