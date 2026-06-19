import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { mapArcgisAttributesToProperty } from "@/lib/propertyFieldMapper";

function cleanUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

async function pullArcgisRecords({ serviceUrl, layerId, limit = 10 }) {
  const queryUrl = `${cleanUrl(serviceUrl)}/${layerId}/query`;

  const params = new URLSearchParams({
    where: "1=1",
    outFields: "*",
    returnGeometry: "false",
    resultRecordCount: String(limit),
    f: "json",
  });

  const res = await fetch(`${queryUrl}?${params.toString()}`, {
    headers: {
      "User-Agent": "DealAI Sample Importer/1.0",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`ArcGIS request failed with status ${res.status}`);
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message || "ArcGIS returned an error");
  }

  return json.features || [];
}

export async function POST(req) {
  try {
    const body = await req.json();

    const county = body.county?.trim();
    const state = body.state?.trim().toUpperCase();
    const serviceUrl = body.serviceUrl?.trim();
    const layerId = body.layerId;
    const limit = Number(body.limit || 10);

    if (!county || !state || !serviceUrl || layerId === undefined) {
      return NextResponse.json(
        {
          error: "county, state, serviceUrl, and layerId are required",
        },
        { status: 400 }
      );
    }

    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const features = await pullArcgisRecords({
      serviceUrl,
      layerId,
      limit: safeLimit,
    });

    const mappedRows = features
      .map((feature, index) =>
        mapArcgisAttributesToProperty({
          attributes: feature.attributes || {},
          county,
          state,
          serviceUrl,
          layerId,
          index,
        })
      )
      .filter((row) => row.parcel_id || row.address || row.owner_name);

    if (mappedRows.length === 0) {
      return NextResponse.json({
        success: true,
        pulled: features.length,
        inserted: 0,
        message:
          "Records were pulled, but no parcel/address/owner fields were detected.",
        sample_raw_record: features[0]?.attributes || null,
      });
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("properties")
      .upsert(mappedRows, {
        onConflict: "source_record_key",
      })
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      pulled: features.length,
      inserted: data.length,
      mapped_fields: {
        parcel_id: mappedRows.filter((r) => r.parcel_id).length,
        address: mappedRows.filter((r) => r.address).length,
        owner_name: mappedRows.filter((r) => r.owner_name).length,
        land_value: mappedRows.filter((r) => r.land_value !== null).length,
        improvement_value: mappedRows.filter(
          (r) => r.improvement_value !== null
        ).length,
      },
      sample_mapped_record: data[0] || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to pull sample records",
      },
      { status: 500 }
    );
  }
}