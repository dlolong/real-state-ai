const FIELD_ALIASES = {
  parcel_id: [
    "APN",
    "AIN",
    "PIN",
    "PARCEL",
    "PARCEL_ID",
    "PARCELID",
    "PARCEL_NO",
    "PARCEL_NUM",
    "ASSESSOR_PARCEL_NUMBER",
    "ASSESSORS_PARCEL_NUMBER",
  ],

  address: [
    "SITUS_ADDRESS",
    "SITUSADDR",
    "SITUS_ADDR",
    "SITE_ADDRESS",
    "SITEADDR",
    "SITE_ADDR",
    "PROPERTY_ADDRESS",
    "PROP_ADDRESS",
    "ADDRESS",
    "FULL_ADDRESS",
  ],

  owner_name: [
    "OWNER",
    "OWNER_NAME",
    "OWN_NAME",
    "TAXPAYER",
    "TAXPAYER_NAME",
    "MAIL_NAME",
    "ASSESSEE",
    "ASSESSEE_NAME",
  ],

  land_value: [
    "LAND_VALUE",
    "LANDVALUE",
    "LAND_VAL",
    "LND_VALUE",
    "LND_VAL",
    "ROLL_LAND_VALUE",
    "ROLL_LAND",
    "ASSESSED_LAND_VALUE",
    "ASSESSED_LAND",
    "LAND",
  ],

  improvement_value: [
    "IMPROVEMENT_VALUE",
    "IMPROVE_VALUE",
    "IMPR_VALUE",
    "IMPRV_VALUE",
    "IMP_VALUE",
    "IMPROVEMENT_VAL",
    "BUILDING_VALUE",
    "BLDG_VALUE",
    "STRUCTURE_VALUE",
    "ROLL_IMPROVEMENT_VALUE",
    "ROLL_IMPROVEMENT",
    "ASSESSED_IMPROVEMENT_VALUE",
    "IMPROVEMENTS",
    "IMPROVE",
  ],

  assessed_value: [
    "ASSESSED_VALUE",
    "TOTAL_VALUE",
    "TOTAL_VAL",
    "TOTAL_ASSD",
    "TOTAL_ASSESSED_VALUE",
    "NET_ASSESSED_VALUE",
    "ROLL_TOTAL_VALUE",
    "LAND_IMPROVEMENT_VALUE",
    "LAND_PLUS_IMPROVEMENT",
    "LAND_IMP_VALUE",
  ],

  object_id: ["OBJECTID", "OBJECT_ID", "FID", "OID"],
};

function normalizeKey(key) {
  return String(key || "")
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

function findValue(attributes, aliases) {
  if (!attributes) return null;

  const normalizedMap = {};

  Object.keys(attributes).forEach((key) => {
    normalizedMap[normalizeKey(key)] = attributes[key];
  });

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);

    if (
      normalizedMap[normalizedAlias] !== undefined &&
      normalizedMap[normalizedAlias] !== null &&
      normalizedMap[normalizedAlias] !== ""
    ) {
      return normalizedMap[normalizedAlias];
    }
  }

  return null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function toText(value) {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();

  return text || null;
}

export function mapArcgisAttributesToProperty({
  attributes,
  county,
  state,
  serviceUrl,
  layerId,
  index = 0,
}) {
  const parcelId = toText(findValue(attributes, FIELD_ALIASES.parcel_id));
  const address = toText(findValue(attributes, FIELD_ALIASES.address));
  const ownerName = toText(findValue(attributes, FIELD_ALIASES.owner_name));

  const landValue = toNumber(findValue(attributes, FIELD_ALIASES.land_value));

  const improvementValue = toNumber(
    findValue(attributes, FIELD_ALIASES.improvement_value)
  );

  let assessedValue = toNumber(
    findValue(attributes, FIELD_ALIASES.assessed_value)
  );

  if (!assessedValue && (landValue || improvementValue)) {
    assessedValue = Number(landValue || 0) + Number(improvementValue || 0);
  }

  const objectId = toText(findValue(attributes, FIELD_ALIASES.object_id));

  const stableKey =
    parcelId ||
    objectId ||
    address ||
    `${Date.now()}-${index}`;

  return {
  county,
  state,
  parcel_id: parcelId,
  address,
  owner_name: ownerName,

  land_value: landValue,
  improvement_value: improvementValue,
  assessed_value: assessedValue,

  source: "ArcGIS REST API",
  source_url: `${serviceUrl}/${layerId}/query`,
  source_service_url: serviceUrl,
  source_layer_id: Number(layerId),
  source_object_id: objectId,
  source_record_key: `${state}:${county}:${serviceUrl}:${layerId}:${stableKey}`,
  raw_data: attributes,
  updated_at: new Date().toISOString(),
};
}