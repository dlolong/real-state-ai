import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const county = process.argv[2];
const state = process.argv[3];
const gisUrl = process.argv[4];

if (!county || !state || !gisUrl) {
  console.log(
    "Usage: node scripts/discoverArcgis.mjs \"Los Angeles County\" CA \"https://lacounty.maps.arcgis.com/\""
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function cleanUrl(url) {
  return String(url || "")
    .trim()
    .replace(/\\\//g, "/")
    .replace(/\/+$/, "");
}

function uniqueArray(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function isArcgisRestUrl(url) {
  return /\/(arcgis|server)\/rest\/services/i.test(url);
}

function toServicesRoot(url) {
  const cleaned = cleanUrl(url);
  const match = cleaned.match(/^(.*?\/(?:arcgis|server)\/rest\/services)/i);
  return match?.[1] || null;
}

function normalizeArcgisServiceUrl(url) {
  let cleaned = cleanUrl(url).split("?")[0].split("#")[0];

  const serviceMatch = cleaned.match(
    /^(.*?\/(?:MapServer|FeatureServer|ImageServer|GeocodeServer|GeometryServer))/i
  );

  return serviceMatch?.[1] || cleaned;
}

async function fetchJson(url) {
  const res = await fetch(`${cleanUrl(url)}?f=pjson`);

  if (!res.ok) {
    throw new Error(`Failed ${res.status}: ${url}`);
  }

  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed ${res.status}: ${url}`);
  }

  return res.text();
}

function extractArcgisUrlsFromText(text) {
  const normalized = text
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/%2F/gi, "/")
    .replace(/%3A/gi, ":");

  const patterns = [
    /https?:\/\/[^"'\s<>]+\/arcgis\/rest\/services\/[^"'\s<>]+/gi,
    /https?:\/\/[^"'\s<>]+\/server\/rest\/services\/[^"'\s<>]+/gi,
    /https?:\/\/services\d*\.arcgis\.com\/[^"'\s<>]+\/arcgis\/rest\/services\/[^"'\s<>]+/gi,
  ];

  const urls = [];

  for (const pattern of patterns) {
    urls.push(...(normalized.match(pattern) || []));
  }

  return uniqueArray(
    urls
      .map((url) => normalizeArcgisServiceUrl(url))
      .filter((url) => isArcgisRestUrl(url))
  );
}

function getSampleQueryUrl(serviceUrl, layerId) {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: "*",
    returnGeometry: "true",
    resultRecordCount: "5",
    f: "json",
  });

  return `${cleanUrl(serviceUrl)}/${layerId}/query?${params.toString()}`;
}

async function discoverServicesFromRoot(rootUrl) {
  const services = [];

  async function crawl(folderPath = "") {
    const folderUrl = folderPath ? `${cleanUrl(rootUrl)}/${folderPath}` : rootUrl;
    const json = await fetchJson(folderUrl);

    if (Array.isArray(json.services)) {
      for (const service of json.services) {
        if (!["MapServer", "FeatureServer"].includes(service.type)) continue;

        services.push({
          name: service.name,
          type: service.type,
          url: `${cleanUrl(rootUrl)}/${service.name}/${service.type}`,
          rootUrl,
          folder: service.name.includes("/") ? service.name.split("/")[0] : null,
        });
      }
    }

    if (Array.isArray(json.folders)) {
      for (const folder of json.folders) {
        if (folder === "System" || folder === "Utilities") continue;
        await crawl(folder);
      }
    }
  }

  await crawl();

  return services;
}

async function enrichService(service) {
  const metadata = await fetchJson(service.url);
  const layers = [];

  const allLayers = [
    ...(Array.isArray(metadata.layers) ? metadata.layers : []),
    ...(Array.isArray(metadata.tables) ? metadata.tables : []),
  ];

  for (const layer of allLayers) {
    const layerUrl = `${cleanUrl(service.url)}/${layer.id}`;
    let layerMetadata = null;

    try {
      layerMetadata = await fetchJson(layerUrl);
    } catch {}

    layers.push({
      layer_id: Number(layer.id),
      layer_name: layer.name || layerMetadata?.name || null,
      layer_type: layer.type || layerMetadata?.type || null,
      geometry_type: layerMetadata?.geometryType || null,
      object_id_field: layerMetadata?.objectIdField || null,
      query_url: `${cleanUrl(service.url)}/${layer.id}/query`,
      sample_query_url: getSampleQueryUrl(service.url, layer.id),
      fields: layerMetadata?.fields || [],
      metadata: layerMetadata || layer,
    });
  }

  return {
    ...service,
    capabilities: metadata.capabilities || null,
    layer_count: Array.isArray(metadata.layers) ? metadata.layers.length : 0,
    table_count: Array.isArray(metadata.tables) ? metadata.tables.length : 0,
    metadata,
    layers,
  };
}

async function run() {
  console.log("Discovering ArcGIS services...");

  const candidates = [];

  if (isArcgisRestUrl(gisUrl)) {
    candidates.push(gisUrl);
  } else {
    const html = await fetchText(gisUrl);
    candidates.push(...extractArcgisUrlsFromText(html));
  }

  const roots = uniqueArray(candidates.map(toServicesRoot).filter(Boolean));

  let services = [];

  for (const root of roots) {
    const found = await discoverServicesFromRoot(root);
    services.push(...found);
  }

  services = uniqueArray(services.map((s) => s.url)).map((url) => {
    const match = url.match(/\/([^/]+)\/(MapServer|FeatureServer)$/i);

    return {
      name: match?.[1] || url,
      type: match?.[2] || "Unknown",
      url,
      rootUrl: toServicesRoot(url),
      folder: null,
    };
  });

  const enriched = [];

  for (const service of services.slice(0, 30)) {
    try {
      enriched.push(await enrichService(service));
    } catch {
      enriched.push({
        ...service,
        layer_count: 0,
        table_count: 0,
        layers: [],
        metadata: null,
      });
    }
  }

  const { data: countySource, error: countyError } = await supabase
    .from("county_sources")
    .upsert(
      {
        county,
        state,
        gis_url: gisUrl,
        platform: "ArcGIS",
        api_type: "ArcGIS REST API",
        scraping_method: "Use ArcGIS REST API first. Use Playwright only as fallback.",
        confidence_score: enriched.length > 0 ? 95 : 50,
        notes: `Auto-discovered ${enriched.length} ArcGIS services.`,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "county,state",
      }
    )
    .select()
    .single();

  if (countyError) throw countyError;

  for (const service of enriched) {
    const { data: savedService, error: serviceError } = await supabase
      .from("arcgis_services")
      .upsert(
        {
          county_source_id: countySource.id,
          county,
          state,
          service_name: service.name,
          service_type: service.type,
          service_url: service.url,
          root_url: service.rootUrl,
          folder: service.folder,
          capabilities: service.capabilities,
          layer_count: service.layer_count,
          table_count: service.table_count,
          metadata: service.metadata,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "service_url",
        }
      )
      .select()
      .single();

    if (serviceError) throw serviceError;

    if (service.layers.length > 0) {
      const rows = service.layers.map((layer) => ({
        arcgis_service_id: savedService.id,
        county,
        state,
        service_url: service.url,
        layer_id: layer.layer_id,
        layer_name: layer.layer_name,
        layer_type: layer.layer_type,
        geometry_type: layer.geometry_type,
        object_id_field: layer.object_id_field,
        query_url: layer.query_url,
        sample_query_url: layer.sample_query_url,
        fields: layer.fields,
        metadata: layer.metadata,
      }));

      const { error: layerError } = await supabase
        .from("arcgis_layers")
        .upsert(rows, {
          onConflict: "service_url,layer_id",
        });

      if (layerError) throw layerError;
    }
  }

  console.log(`Done. Saved ${enriched.length} services for ${county}, ${state}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


// node scripts/discoverArcgis.mjs "Los Angeles County" CA "https://lacounty.maps.arcgis.com/"