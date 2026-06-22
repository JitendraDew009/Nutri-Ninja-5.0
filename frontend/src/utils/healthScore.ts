/**
 * Health Score Calculator
 * Calculates a custom 1-100 health score based on nutritional content
 */

export interface NutrientData {
  energy_100g?: number;
  sugars_100g?: number;
  "saturated-fat_100g"?: number;
  salt_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  [key: string]: number | undefined;
}

export function getHealthScore(product: any): number {
  if (!product || !product.nutriments) return 50;

  const n: NutrientData = product.nutriments;

  // Start with base score
  let score = 100;

  // Penalize for sugars (higher is worse)
  if (n.sugars_100g) {
    score -= Math.min(n.sugars_100g * 1.8, 25);
  }

  // Penalize for saturated fat (higher is worse)
  if (n["saturated-fat_100g"]) {
    score -= Math.min(n["saturated-fat_100g"] * 2.2, 25);
  }

  // Penalize for salt (higher is worse)
  if (n.salt_100g) {
    score -= Math.min(n.salt_100g * 1.5, 15);
  }

  // Reward for fiber (higher is better)
  if (n.fiber_100g) {
    score += Math.min(n.fiber_100g * 1.5, 15);
  }

  // Reward for protein (higher is better)
  if (n.proteins_100g) {
    score += Math.min(n.proteins_100g * 1.2, 15);
  }

  const additiveCount =
    product.additives_n ||
    product.additives_tags?.length ||
    product.additives_old_tags?.length ||
    0;

  if (additiveCount) {
    score -= Math.min(additiveCount * 2, 12);
  }

  // Penalize for energy density (too high is worse)
  if (n.energy_100g) {
    // Above 300 kcal per 100g is considered high
    if (n.energy_100g > 300) {
      score -= Math.min((n.energy_100g - 300) / 50, 10);
    }
  }

  // Clamp score between 1 and 100
  return Math.round(Math.max(1, Math.min(100, score)));
}

/**
 * Get Nutri-Score grade based on algorithm
 * Returns: A, B, C, D, or E
 */
export function getNutriScore(product: any): string {
  const healthScore = getHealthScore(product);

  if (healthScore >= 80) return "A";
  if (healthScore >= 60) return "B";
  if (healthScore >= 40) return "C";
  if (healthScore >= 20) return "D";
  return "E";
}

/**
 * Official Nutri-Score bar colors (A–E)
 */
export const nutriGradeBarColors: Record<string, string> = {
  A: "#16b88b",
  B: "#7ac70c",
  C: "#d3a72c",
  D: "#e8732f",
  E: "#ef4650",
};

/**
 * Get color for health score
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return "#16a34a"; // Green
  if (score >= 60) return "#65a30d"; // Lime
  if (score >= 40) return "#eab308"; // Yellow
  if (score >= 20) return "#f97316"; // Orange
  return "#dc2626"; // Red
}

/**
 * Get color for Nutri-Score
 */
export function getNutriScoreColor(grade: string): string {
  switch (grade?.toUpperCase()) {
    case "A":
      return "#16a34a";
    case "B":
      return "#65a30d";
    case "C":
      return "#eab308";
    case "D":
      return "#f97316";
    case "E":
      return "#dc2626";
    default:
      return "#666666";
  }
}

/**
 * Get health score label
 */
export function getHealthScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Very Poor";
}

export function getPersonalizedInsights(product: any, profile?: any): string[] {
  const n = product?.nutriments || {};
  const goal = profile?.goal || "general";
  const insights: string[] = [];

  if (goal === "diabetes" && (n.sugars_100g || 0) > 10) {
    insights.push("Diabetes alert: sugar is high for regular intake.");
  }

  if (goal === "weight_loss" && (n.energy_100g || 0) > 350) {
    insights.push("Weight loss mode: calorie density is high, keep portion size small.");
  }

  if (goal === "muscle_gain" && (n.proteins_100g || 0) >= 8) {
    insights.push("Muscle gain mode: this product contributes useful protein.");
  }

  if (goal === "heart_health" && ((n.salt_100g || 0) > 0.75 || (n["saturated-fat_100g"] || 0) > 3)) {
    insights.push("Heart health alert: sodium or saturated fat deserves caution.");
  }

  const allergies = String(profile?.allergies || "").toLowerCase();
  const ingredients = String(product?.ingredients_text || "").toLowerCase();
  if (allergies && ingredients) {
    allergies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((allergy) => {
        if (ingredients.includes(allergy)) {
          insights.push(`Allergy alert: ingredients mention ${allergy}.`);
        }
      });
  }

  const avoided = String(profile?.dislikedIngredients || "").toLowerCase();
  if (avoided && ingredients) {
    avoided
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((ingredient) => {
        if (ingredients.includes(ingredient)) {
          insights.push(`Preference alert: this product contains ${ingredient}, which is on your avoid list.`);
        }
      });
  }

  if (insights.length === 0) {
    insights.push("No major profile-specific issues detected from available label data.");
  }

  return insights;
}
