import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const platformRules = [
  {
    name: "ArcGIS REST",
    keywords: ["arcgis/rest/services", "FeatureServer", "MapServer"],
    method: "API",
  },
  {
    name: "Socrata Open Data",
    keywords: ["data.", "dev.socrata.com", "/resource/"],
    method: "API",
  },
  {
    name: "qPublic / Beacon",
    keywords: ["qpublic", "beacon.schneidercorp", "schneidercorp"],
    method: "Portal scrape or manual integration",
  },
  {
    name: "Tyler Technologies",
    keywords: ["tylertech", "property access"],
    method: "Portal scrape or vendor API",
  },
];

function detectPlatform(urls) {
  const combined = urls.filter(Boolean).join(" ").toLowerCase();

  for (const rule of platformRules) {
    const matched = rule.keywords.some((keyword) =>
      combined.includes(keyword.toLowerCase())
    );

    if (matched) {
      return {
        platform: rule.name,
        scraping_method: rule.method,
      };
    }
  }

  return {
    platform: "Unknown / Custom County Portal",
    scraping_method: "Use Playwright first, then inspect Network tab for APIs",
  };
}

export async function POST(req) {
  try {
    const { county, state, urls = [] } = await req.json();

    if (!county || !state) {
      return NextResponse.json(
        { error: "County and state are required" },
        { status: 400 }
      );
    }

    const detected = detectPlatform(urls);

    const source = {
      county,
      state,
      assessor_url: urls.find((u) => u.includes("assessor")) || null,
      recorder_url: urls.find((u) => u.includes("recorder")) || null,
      gis_url:
        urls.find((u) => u.includes("arcgis")) ||
        urls.find((u) => u.includes("gis")) ||
        null,
      open_data_url:
        urls.find((u) => u.includes("socrata")) ||
        urls.find((u) => u.includes("data.")) ||
        null,
      platform: detected.platform,
      api_type: detected.scraping_method === "API" ? detected.platform : null,
      scraping_method: detected.scraping_method,
      confidence_score: urls.length > 0 ? 70 : 30,
      notes: "Auto-detected from submitted county source URLs.",
    };

    const { data, error } = await supabase
      .from("county_sources")
      .insert([source])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to detect county source" },
      { status: 500 }
    );
  }
}