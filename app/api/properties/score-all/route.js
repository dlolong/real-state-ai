import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { scoreProperty } from "@/lib/dealScoring";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit || 50), 200);

    const supabase = createSupabaseAdmin();

    const { data: properties, error: fetchError } = await supabase
      .from("properties")
      .select("*")
      .is("deal_score", null)
      .limit(limit);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    let updated = 0;

    for (const property of properties) {
      const score = scoreProperty(property);

      const { error: updateError } = await supabase
        .from("properties")
        .update(score)
        .eq("id", property.id);

      if (!updateError) {
        updated += 1;
      }
    }

    return NextResponse.json({
      success: true,
      scanned: properties.length,
      updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to score properties",
      },
      { status: 500 }
    );
  }
}