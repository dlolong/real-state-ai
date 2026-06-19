import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

function cleanUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

async function fetchLayerMetadata(serviceUrl, layerId) {
  const res = await fetch(`${cleanUrl(serviceUrl)}/${layerId}?f=json`);

  if (!res.ok) {
    throw new Error(`Layer metadata request failed: ${res.status}`);
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message || "ArcGIS layer metadata error");
  }

  return json;
}

async function fetchSampleRecords(serviceUrl, layerId, limit = 10) {
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
    throw new Error(`ArcGIS sample request failed: ${res.status}`);
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message || "ArcGIS query error");
  }

  return json.features || [];
}

export async function POST(req) {
  try {
    const body = await req.json();

    const supabase = createSupabaseAdmin();

    let layer = null;

    if (body.layerDbId) {
      const { data, error } = await supabase
        .from("arcgis_layers")
        .select("*")
        .eq("id", body.layerDbId)
        .single();

      if (error) throw new Error(error.message);

      layer = data;
    } else {
      layer = {
        service_url: body.serviceUrl,
        layer_id: body.layerId,
      };
    }

    if (!layer?.service_url || layer?.layer_id === null) {
      return NextResponse.json(
        { success: false, error: "Missing service_url or layer_id" },
        { status: 400 }
      );
    }

    const limit = Math.min(Number(body.limit || 10), 50);

    const metadata = await fetchLayerMetadata(layer.service_url, layer.layer_id);
    const features = await fetchSampleRecords(
      layer.service_url,
      layer.layer_id,
      limit
    );

    return NextResponse.json({
      success: true,
      layer,
      metadata,
      fields: metadata.fields || [],
      records: features.map((feature) => feature.attributes || {}),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to pull layer sample",
      },
      { status: 500 }
    );
  }
}