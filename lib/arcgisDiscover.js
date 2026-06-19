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

  if (match?.[1]) {
    return match[1];
  }

  return null;
}

function normalizeArcgisServiceUrl(url) {
  let cleaned = cleanUrl(url);

  cleaned = cleaned.split("?")[0];
  cleaned = cleaned.split("#")[0];

  const serviceMatch = cleaned.match(
    /^(.*?\/(?:MapServer|FeatureServer|ImageServer|GeocodeServer|GeometryServer))/i
  );

  if (serviceMatch?.[1]) {
    return serviceMatch[1];
  }

  return cleaned;
}

function buildJsonUrl(url) {
  const clean = cleanUrl(url);
  return `${clean}?f=pjson`;
}

async function fetchJson(url) {
  const res = await fetch(buildJsonUrl(url), {
    headers: {
      "User-Agent": "DealAI County Detector/1.0",
      Accept: "application/json,text/plain,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed ${res.status}: ${url}`);
  }

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${url}`);
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "DealAI County Detector/1.0",
      Accept: "text/html,text/plain,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed ${res.status}: ${url}`);
  }

  return res.text();
}

function extractArcgisUrlsFromText(text) {
  if (!text) return [];

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
    const matches = normalized.match(pattern) || [];
    urls.push(...matches);
  }

  return uniqueArray(
    urls
      .map((url) => normalizeArcgisServiceUrl(url))
      .filter((url) => isArcgisRestUrl(url))
  );
}

function getLayerQueryUrl(serviceUrl, layerId) {
  return `${cleanUrl(serviceUrl)}/${layerId}/query`;
}

function getSampleQueryUrl(serviceUrl, layerId) {
  const queryUrl = getLayerQueryUrl(serviceUrl, layerId);

  const params = new URLSearchParams({
    where: "1=1",
    outFields: "*",
    returnGeometry: "true",
    resultRecordCount: "5",
    f: "json",
  });

  return `${queryUrl}?${params.toString()}`;
}

function classifyFolderFromServiceName(serviceName) {
  if (!serviceName) return null;

  const parts = serviceName.split("/");

  if (parts.length > 1) {
    return parts[0];
  }

  return null;
}

async function discoverServicesFromRoot(rootUrl, options = {}) {
  const maxFolders = options.maxFolders || 100;
  const services = [];

  async function crawlFolder(folderPath = "") {
    const folderUrl = folderPath
      ? `${cleanUrl(rootUrl)}/${folderPath}`
      : cleanUrl(rootUrl);

    const json = await fetchJson(folderUrl);

    if (Array.isArray(json.services)) {
      for (const service of json.services) {
        if (!["MapServer", "FeatureServer"].includes(service.type)) continue;

        const servicePath = service.name;
        const serviceUrl = `${cleanUrl(rootUrl)}/${servicePath}/${service.type}`;

        services.push({
          name: service.name,
          type: service.type,
          url: serviceUrl,
          rootUrl,
          folder: classifyFolderFromServiceName(service.name),
        });
      }
    }

    if (Array.isArray(json.folders) && json.folders.length <= maxFolders) {
      for (const folder of json.folders) {
        if (folder === "System" || folder === "Utilities") continue;
        await crawlFolder(folder);
      }
    }
  }

  await crawlFolder("");

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
    let layerMetadata = null;

    try {
      layerMetadata = await fetchJson(`${cleanUrl(service.url)}/${layer.id}`);
    } catch {
      layerMetadata = null;
    }

    const layerId = Number(layer.id);

    layers.push({
      layer_id: layerId,
      layer_name: layer.name || layerMetadata?.name || null,
      layer_type: layer.type || layerMetadata?.type || null,
      geometry_type: layerMetadata?.geometryType || null,
      object_id_field: layerMetadata?.objectIdField || null,
      query_url: getLayerQueryUrl(service.url, layerId),
      sample_query_url: getSampleQueryUrl(service.url, layerId),
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

export async function discoverArcgisFromCountyUrl({
  county,
  state,
  gisUrl,
  maxServices = 30,
}) {
  if (!county || !state || !gisUrl) {
    throw new Error("county, state, and gisUrl are required");
  }

  const cleanedGisUrl = cleanUrl(gisUrl);
  const discoveredCandidates = [];

  if (isArcgisRestUrl(cleanedGisUrl)) {
    discoveredCandidates.push(cleanedGisUrl);
  } else {
    const html = await fetchText(cleanedGisUrl);
    discoveredCandidates.push(...extractArcgisUrlsFromText(html));
  }

  const roots = uniqueArray(
    discoveredCandidates
      .map((url) => toServicesRoot(url))
      .filter(Boolean)
  );

  const directServices = uniqueArray(
    discoveredCandidates
      .map((url) => normalizeArcgisServiceUrl(url))
      .filter((url) => /(MapServer|FeatureServer)$/i.test(url))
  ).map((url) => {
    const match = url.match(/\/([^/]+)\/(MapServer|FeatureServer)$/i);

    return {
      name: match?.[1] || url,
      type: match?.[2] || "Unknown",
      url,
      rootUrl: toServicesRoot(url),
      folder: null,
    };
  });

  let services = [...directServices];

  for (const root of roots) {
    try {
      const found = await discoverServicesFromRoot(root);
      services.push(...found);
    } catch {
      // Some servers disable directory browsing or block JSON service listing.
      // Direct service URLs discovered from HTML can still be used.
    }
  }

  const uniqueServices = [];
  const seen = new Set();

  for (const service of services) {
    const normalized = normalizeArcgisServiceUrl(service.url);

    if (!seen.has(normalized)) {
      seen.add(normalized);
      uniqueServices.push({
        ...service,
        url: normalized,
      });
    }
  }

  const limitedServices = uniqueServices.slice(0, maxServices);

  const enriched = [];

  for (const service of limitedServices) {
    try {
      const data = await enrichService(service);
      enriched.push(data);
    } catch {
      enriched.push({
        ...service,
        capabilities: null,
        layer_count: 0,
        table_count: 0,
        metadata: null,
        layers: [],
      });
    }
  }

  return {
    county,
    state,
    gisUrl: cleanedGisUrl,
    roots,
    service_count: enriched.length,
    services: enriched,
  };
}