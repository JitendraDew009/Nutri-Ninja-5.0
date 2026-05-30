/**
 * Health Warnings Generator
 * Identifies potential health concerns based on nutritional content
 */

export interface Warning {
  title: string;
  severity: "low" | "medium" | "high"; // low=yellow, medium=orange, high=red
  message: string;
}

export function getWarnings(product: any): Warning[] {
  if (!product || !product.nutriments) return [];

  const n = product.nutriments || {};
  const warnings: Warning[] = [];

  // Sugar warnings
  if ((n.sugars_100g || 0) > 25) {
    warnings.push({
      title: "🍬 High Sugar",
      severity: "high",
      message: `${n.sugars_100g}g per 100g - May increase risk of diabetes and obesity`,
    });
  } else if ((n.sugars_100g || 0) > 12.5) {
    warnings.push({
      title: "🍬 Moderate Sugar",
      severity: "medium",
      message: `${n.sugars_100g}g per 100g - Consider limiting intake`,
    });
  }

  // Salt warnings
  if ((n.salt_100g || 0) > 1.5) {
    warnings.push({
      title: "🧂 High Sodium",
      severity: "high",
      message: `${n.salt_100g}g per 100g - May increase blood pressure`,
    });
  } else if ((n.salt_100g || 0) > 0.5) {
    warnings.push({
      title: "🧂 Moderate Sodium",
      severity: "medium",
      message: `${n.salt_100g}g per 100g - Use in moderation`,
    });
  }

  // Saturated fat warnings
  if ((n["saturated-fat_100g"] || 0) > 5) {
    warnings.push({
      title: "🧈 High Saturated Fat",
      severity: "high",
      message: `${n["saturated-fat_100g"]}g per 100g - May increase cholesterol`,
    });
  } else if ((n["saturated-fat_100g"] || 0) > 3) {
    warnings.push({
      title: "🧈 Moderate Saturated Fat",
      severity: "medium",
      message: `${n["saturated-fat_100g"]}g per 100g - Not ideal for daily consumption`,
    });
  }

  // Energy density warnings
  if ((n.energy_100g || 0) > 400) {
    warnings.push({
      title: "⚡ High Calorie Density",
      severity: "medium",
      message: `${Math.round(n.energy_100g)} kcal per 100g - High energy density`,
    });
  }

  // Positive indicators (no warnings)
  if (warnings.length === 0) {
    warnings.push({
      title: "✅ Healthy Choice",
      severity: "low",
      message: "This product has a balanced nutritional profile",
    });
  }

  return warnings;
}

/**
 * Get all nutrition info as formatted text
 */
export function getNutritionInfo(product: any): {
  label: string;
  value: string;
}[] {
  if (!product || !product.nutriments) return [];

  const n = product.nutriments;
  const info: { label: string; value: string }[] = [];

  if (n.energy_100g)
    info.push({ label: "Energy", value: `${Math.round(n.energy_100g)} kcal/100g` });
  if (n.carbohydrates_100g)
    info.push({ label: "Carbs", value: `${n.carbohydrates_100g.toFixed(1)}g` });
  if (n.sugars_100g)
    info.push({ label: "Sugars", value: `${n.sugars_100g.toFixed(1)}g` });
  if (n.fat_100g) info.push({ label: "Fat", value: `${n.fat_100g.toFixed(1)}g` });
  if (n["saturated-fat_100g"])
    info.push({ label: "Saturated Fat", value: `${n["saturated-fat_100g"].toFixed(1)}g` });
  if (n.proteins_100g)
    info.push({ label: "Protein", value: `${n.proteins_100g.toFixed(1)}g` });
  if (n.fiber_100g) info.push({ label: "Fiber", value: `${n.fiber_100g.toFixed(1)}g` });
  if (n.salt_100g) info.push({ label: "Salt", value: `${n.salt_100g.toFixed(2)}g` });

  return info;
}

/**
 * Get warning color based on severity
 */
export function getWarningColor(severity: "low" | "medium" | "high"): string {
  switch (severity) {
    case "high":
      return "#dc2626"; // Red
    case "medium":
      return "#f97316"; // Orange
    case "low":
      return "#eab308"; // Yellow
    default:
      return "#666666";
  }
}