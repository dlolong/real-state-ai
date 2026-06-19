function cleanUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function escapeSqlValue(value) {
  return String(value || "").replace(/'/g, "''");
}

export async function fetchFullArcgisPropertyDetails(property) {
  if (!property.source_service_url || property.source_layer_id === null) {
    throw new Error("Missing source_service_url or source_layer_id");
  }

  const queryUrl = `${cleanUrl(property.source_service_url)}/${property.source_layer_id}/query`;

  const params = new URLSearchParams({
    outFields: "*",
    returnGeometry: "true",
    f: "json",
  });

  if (property.source_object_id) {
    params.set("objectIds", String(property.source_object_id));
  } else if (property.parcel_id) {
    params.set("where", `APN='${escapeSqlValue(property.parcel_id)}'`);
  } else if (property.address) {
    params.set("where", `UPPER(SITUS_ADDRESS) LIKE '%${escapeSqlValue(property.address.toUpperCase())}%'`);
  } else {
    throw new Error("No object ID, parcel ID, or address available for lookup");
  }

  const res = await fetch(`${queryUrl}?${params.toString()}`, {
    headers: {
      "User-Agent": "DealAI Full Property Details/1.0",
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

  const feature = json.features?.[0];

  if (!feature) {
    throw new Error("No full property record found from ArcGIS");
  }

  return {
    attributes: feature.attributes || {},
    geometry: feature.geometry || null,
  };
}