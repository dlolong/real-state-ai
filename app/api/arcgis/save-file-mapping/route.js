import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const { layerDbId, mapping } = await req.json();

    if (!layerDbId || !mapping) {
      return NextResponse.json(
        { success: false, error: "layerDbId and mapping are required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: layer, error: layerError } = await supabase
      .from("arcgis_layers")
      .select("*")
      .eq("id", layerDbId)
      .single();

    if (layerError) {
      throw new Error(layerError.message);
    }

    const { data, error } = await supabase
      .from("property_field_mappings")
      .upsert(
        {
          arcgis_layer_id: layer.id,
          county: layer.county,
          state: layer.state,
          service_url: layer.service_url,
          layer_id: layer.layer_id,
          mapping,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "service_url,layer_id",
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      mapping: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save field mapping",
      },
      { status: 500 }
    );
  }
}