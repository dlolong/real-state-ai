import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { mapArcgisAttributesWithCustomMapping } from "@/lib/customPropertyMapper";

function cleanUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

async function fetchRecords(serviceUrl, layerId, limit = 100) {
  const queryUrl = `${cleanUrl(serviceUrl)}/${layerId}/query`;

  const params = new URLSearchParams({
    where: "1=1",
    outFields: "*",
    returnGeometry: "false",
    resultRecordCount: String(limit),
    f: "json",
  });

  const res = await fetch(`${queryUrl}?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`ArcGIS import request failed: ${res.status}`);
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message || "ArcGIS returned an error");
  }

  return json.features || [];
}

export async function POST(req) {
  const supabase = createSupabaseAdmin();

  try {
    const { layerDbId, limit = 100 } = await req.json();

    if (!layerDbId) {
      return NextResponse.json(
        { success: false, error: "layerDbId is required" },
        { status: 400 }
      );
    }

    const { data: layer, error: layerError } = await supabase
      .from("arcgis_layers")
      .select("*")
      .eq("id", layerDbId)
      .single();

    if (layerError) {
      throw new Error(layerError.message);
    }

    const { data: savedMapping } = await supabase
      .from("property_field_mappings")
      .select("*")
      .eq("service_url", layer.service_url)
      .eq("layer_id", layer.layer_id)
      .maybeSingle();

    const features = await fetchRecords(
      layer.service_url,
      layer.layer_id,
      Math.min(Number(limit), 500)
    );

    const mappedRows = features
      .map((feature, index) =>
        mapArcgisAttributesWithCustomMapping({
          attributes: feature.attributes || {},
          mapping: savedMapping?.mapping || {},
          county: layer.county,
          state: layer.state,
          serviceUrl: layer.service_url,
          layerId: layer.layer_id,
          index,
        })
      )
      .filter((row) => row.parcel_id || row.address || row.owner_name);

    let inserted = 0;

    if (mappedRows.length > 0) {
      const { data, error } = await supabase
        .from("properties")
        .upsert(mappedRows, {
          onConflict: "source_record_key",
        })
        .select();

      if (error) {
        throw new Error(error.message);
      }

      inserted = data.length;
    }

    await supabase.from("import_runs").insert([
      {
        county: layer.county,
        state: layer.state,
        service_url: layer.service_url,
        layer_id: layer.layer_id,
        status: "success",
        pulled: features.length,
        inserted,
        message: `Imported ${inserted} records from ${layer.layer_name}`,
      },
    ]);

    return NextResponse.json({
      success: true,
      pulled: features.length,
      inserted,
      layer,
      mapping: savedMapping?.mapping || {},
    });
  } catch (error) {
    await supabase.from("import_runs").insert([
      {
        county: "Unknown",
        state: "Unknown",
        status: "failed",
        pulled: 0,
        inserted: 0,
        message: error.message,
      },
    ]);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to re-import layer",
      },
      { status: 500 }
    );
  }
}