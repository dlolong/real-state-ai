function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function textIncludes(value, words) {
  const text = String(value || "").toLowerCase();
  return words.some((word) => text.includes(word.toLowerCase()));
}

function getValue(property, keys) {
  for (const key of keys) {
    if (property[key] !== null && property[key] !== undefined && property[key] !== "") {
      return property[key];
    }
  }

  return null;
}

function calculateEstimatedValue(property) {
  const estimatedMarketValue = toNumber(property.estimated_market_value);
  if (estimatedMarketValue) return estimatedMarketValue;

  const assessedValue = toNumber(property.assessed_value);
  if (assessedValue) return assessedValue;

  const landValue = toNumber(property.land_value) || 0;
  const improvementValue = toNumber(property.improvement_value) || 0;

  if (landValue || improvementValue) {
    return landValue + improvementValue;
  }

  return null;
}

function calculateEstimatedCost(property, estimatedValue) {
  const listingPrice = toNumber(property.listing_price);
  if (listingPrice) return listingPrice;

  const lastSalePrice = toNumber(property.last_sale_price);
  if (lastSalePrice) return lastSalePrice;

  if (estimatedValue) {
    return estimatedValue * 0.75;
  }

  return null;
}

function calculateROIScore({ estimatedValue, estimatedCost }) {
  if (!estimatedValue || !estimatedCost) {
    return {
      score: 40,
      profit: null,
      reason: "Limited value data available.",
    };
  }

  const estimatedProfit = estimatedValue - estimatedCost;
  const margin = estimatedProfit / estimatedValue;

  let score = 50;

  if (margin >= 0.35) score += 35;
  else if (margin >= 0.25) score += 25;
  else if (margin >= 0.15) score += 15;
  else if (margin >= 0.08) score += 8;
  else score -= 10;

  if (estimatedProfit >= 75000) score += 10;
  else if (estimatedProfit >= 40000) score += 7;
  else if (estimatedProfit >= 20000) score += 4;

  return {
    score: clamp(score),
    profit: Math.round(estimatedProfit),
    reason: `Estimated margin is ${(margin * 100).toFixed(1)}%.`,
  };
}

function calculateMotivationScore(property) {
  let score = 40;
  const reasons = [];

  if (property.tax_status && textIncludes(property.tax_status, ["delinquent", "default", "past due", "unpaid"])) {
    score += 30;
    reasons.push("Tax status suggests possible seller motivation.");
  }

  if (property.owner_name) {
    score += 5;
    reasons.push("Owner name is available.");
  }

  if (
    property.mailing_address &&
    property.address &&
    String(property.mailing_address).toLowerCase() !== String(property.address).toLowerCase()
  ) {
    score += 20;
    reasons.push("Mailing address differs from property address, possible absentee owner.");
  }

  if (property.owner_name && textIncludes(property.owner_name, ["llc", "inc", "trust", "corp"])) {
    score -= 5;
    reasons.push("Entity ownership may mean a more experienced seller.");
  }

  if (!reasons.length) {
    reasons.push("No strong seller motivation signal detected yet.");
  }

  return {
    score: clamp(score),
    reasons,
  };
}

function calculateRiskScore(property) {
  let score = 30;
  const reasons = [];

  if (!property.address) {
    score += 20;
    reasons.push("Missing property address.");
  }

  if (!property.owner_name) {
    score += 15;
    reasons.push("Missing owner name.");
  }

  if (!property.parcel_id) {
    score += 15;
    reasons.push("Missing parcel ID/APN.");
  }

  if (!property.assessed_value && !property.land_value && !property.improvement_value && !property.estimated_market_value) {
    score += 25;
    reasons.push("Missing valuation data.");
  }

  if (property.raw_data) {
    score -= 5;
    reasons.push("Raw county record is stored for verification.");
  }

  if (!reasons.length) {
    reasons.push("No major data risk detected.");
  }

  return {
    score: clamp(score),
    reasons,
  };
}

function getGrade(score) {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

export function scoreProperty(property) {
  const estimatedValue = calculateEstimatedValue(property);
  const estimatedCost = calculateEstimatedCost(property, estimatedValue);

  const roi = calculateROIScore({
    estimatedValue,
    estimatedCost,
  });

  const motivation = calculateMotivationScore(property);
  const risk = calculateRiskScore(property);

  const finalScore = clamp(
    roi.score * 0.45 +
      motivation.score * 0.35 +
      (100 - risk.score) * 0.20
  );

  const grade = getGrade(finalScore);

  const dealSummary = [
    `Deal Grade: ${grade}.`,
    `Final score is ${finalScore}/100.`,
    `ROI score is ${roi.score}/100.`,
    `Motivation score is ${motivation.score}/100.`,
    `Risk score is ${risk.score}/100.`,
    roi.reason,
    ...motivation.reasons.slice(0, 2),
    ...risk.reasons.slice(0, 2),
  ].join(" ");

  return {
    roi_score: roi.score,
    motivation_score: motivation.score,
    risk_score: risk.score,
    deal_score: finalScore,
    deal_grade: grade,
    estimated_profit: roi.profit,
    deal_summary: dealSummary,
    score_breakdown: {
      estimated_value: estimatedValue,
      estimated_cost: estimatedCost,
      roi,
      motivation,
      risk,
      formula: {
        roi_weight: 0.45,
        motivation_weight: 0.35,
        inverse_risk_weight: 0.20,
      },
    },
    scored_at: new Date().toISOString(),
  };
}