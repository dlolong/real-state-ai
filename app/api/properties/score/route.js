import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { scoreProperty } from "@/lib/dealScoring";
// import { generateAIDealSummary } from "@/lib/aiDealSummary";

export async function POST(req) {
  try {
    const { propertyId, useAI = false } = await req.json();

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

    const score = scoreProperty(property);

    let finalSummary = score.deal_summary;

    if (useAI) {
    //   finalSummary = await generateAIDealSummary({
    //     property,
    //     score,
    //   });
    }

    const updatePayload = {
      ...score,
      deal_summary: finalSummary,
    };

    const { data: updatedProperty, error: updateError } = await supabase
      .from("properties")
      .update(updatePayload)
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
        error: error.message || "Failed to score property",
      },
      { status: 500 }
    );
  }
}