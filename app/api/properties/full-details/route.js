import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchFullArcgisPropertyDetails } from "@/lib/arcgisFullDetails";

export async function POST(req) {
  try {
    const { propertyId } = await req.json();

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "propertyId is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: property, error: fetchError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const fullDetails = await fetchFullArcgisPropertyDetails(property);

    const { data: updatedProperty, error: updateError } = await supabase
      .from("properties")
      .update({
        raw_data: fullDetails.attributes,
        raw_geometry: fullDetails.geometry,
        full_details_fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", propertyId)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      property: updatedProperty,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch full property details",
      },
      { status: 500 }
    );
  }
}