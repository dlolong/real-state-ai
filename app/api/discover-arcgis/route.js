import { NextResponse } from "next/server";
import { discoverArcgisFromCountyUrl } from "@/lib/arcgisDiscover";
import { saveArcgisDiscovery } from "@/lib/saveArcgisDiscovery";

export async function POST(req) {
  try {
    const body = await req.json();

    const county = body.county?.trim();
    const state = body.state?.trim().toUpperCase();
    const gisUrl = body.gisUrl?.trim();

    if (!county || !state || !gisUrl) {
      return NextResponse.json(
        { error: "county, state, and gisUrl are required" },
        { status: 400 }
      );
    }

    const discovery = await discoverArcgisFromCountyUrl({
      county,
      state,
      gisUrl,
      maxServices: body.maxServices || 30,
    });

    const saved = await saveArcgisDiscovery({
      county,
      state,
      gisUrl,
      discovery,
    });

    return NextResponse.json({
      success: true,
      discovery,
      saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "ArcGIS discovery failed",
      },
      { status: 500 }
    );
  }
}