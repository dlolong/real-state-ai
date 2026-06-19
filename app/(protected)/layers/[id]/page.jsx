import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import LayerMappingWorkspace from "@/components/LayerMappingWorkspace";

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value || ""
  );
}

export default async function LayerDetailsPage({ params }) {
  console.log(params)
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  console.log(id)

   if (!id || id === "undefined" || id === "null") {
  // if (!id || id === "undefined" || id === "null" || !isValidUuid(id)) {
    return (
      <div className="w-full min-w-0">
        <Link href="/sources" className="text-gray-400 hover:text-white">
          ← Back to Sources
        </Link>

        <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">
          Invalid layer ID: {id || "missing"}
        </div>
      </div>
    );
  }

  const supabase = createSupabaseAdmin();

  const { data: layer, error } = await supabase
    .from("arcgis_layers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !layer) {
    return (
      <div className="w-full min-w-0">
        <Link href="/sources" className="text-gray-400 hover:text-white">
          ← Back to Sources
        </Link>

        <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">
          {error?.message || "Layer not found"}
        </div>
      </div>
    );
  }

  const { data: savedMapping } = await supabase
    .from("property_field_mappings")
    .select("*")
    .eq("service_url", layer.service_url)
    .eq("layer_id", layer.layer_id)
    .maybeSingle();

  return (
    <div className="space-y-6 w-full min-w-0">
      <Link href="/sources" className="text-gray-400 hover:text-white">
        ← Back to Sources
      </Link>

      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 min-w-0">
        <h1 className="text-2xl font-bold break-words">
          {layer.layer_name || `Layer ${layer.layer_id}`}
        </h1>

        <p className="text-gray-400 mt-1 break-words">
          {layer.county}, {layer.state}
        </p>

        <p className="text-xs text-gray-500 mt-3 break-all">
          {layer.service_url}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <Badge>{layer.geometry_type || "No geometry"}</Badge>
          <Badge>Layer ID: {layer.layer_id}</Badge>
          <Badge>{layer.layer_type || "ArcGIS Layer"}</Badge>
        </div>
      </div>

      <LayerMappingWorkspace
        layer={layer}
        savedMapping={savedMapping}
      />
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="text-xs bg-slate-800 text-gray-300 px-3 py-1 rounded-full">
      {children}
    </span>
  );
}