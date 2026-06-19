import { mapArcgisAttributesToProperty } from "@/lib/propertyFieldMapper";

function normalizeKey(key) {
  return String(key || "")
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

function getFieldValue(attributes, fieldName) {
  if (!fieldName || !attributes) return null;

  if (attributes[fieldName] !== undefined) {
    return attributes[fieldName];
  }

  const target = normalizeKey(fieldName);

  const foundKey = Object.keys(attributes).find(
    (key) => normalizeKey(key) === target
  );

  if (!foundKey) return null;

  return attributes[foundKey];
}

function toText(value) {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();

  return text || null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

export function mapArcgisAttributesWithCustomMapping({
  attributes,
  mapping = {},
  county,
  state,
  serviceUrl,
  layerId,
  index = 0,
}) {
  const base = mapArcgisAttributesToProperty({
    attributes,
    county,
    state,
    serviceUrl,
    layerId,
    index,
  });

  const parcelId = toText(getFieldValue(attributes, mapping.parcel_id));
  const address = toText(getFieldValue(attributes, mapping.address));
  const ownerName = toText(getFieldValue(attributes, mapping.owner_name));

  const landValue = toNumber(getFieldValue(attributes, mapping.land_value));
  const improvementValue = toNumber(
    getFieldValue(attributes, mapping.improvement_value)
  );

  let assessedValue = toNumber(
    getFieldValue(attributes, mapping.assessed_value)
  );

  const taxStatus = toText(getFieldValue(attributes, mapping.tax_status));
  const mailingAddress = toText(
    getFieldValue(attributes, mapping.mailing_address)
  );

  const sourceObjectId = toText(
    getFieldValue(attributes, mapping.source_object_id)
  );

  if (!assessedValue && (landValue || improvementValue)) {
    assessedValue = Number(landValue || 0) + Number(improvementValue || 0);
  }

  return {
    ...base,

    parcel_id: parcelId || base.parcel_id,
    address: address || base.address,
    owner_name: ownerName || base.owner_name,

    land_value: landValue ?? base.land_value,
    improvement_value: improvementValue ?? base.improvement_value,
    assessed_value: assessedValue ?? base.assessed_value,

    tax_status: taxStatus || base.tax_status || null,
    mailing_address: mailingAddress || base.mailing_address || null,

    source_object_id: sourceObjectId || base.source_object_id || null,

    raw_data: attributes,
    updated_at: new Date().toISOString(),
  };
}