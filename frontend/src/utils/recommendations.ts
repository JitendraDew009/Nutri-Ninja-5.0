/**
 * Recommendation Engine
 * Suggests healthier and unhealthier food alternatives
 */

import { getHealthScore } from "./healthScore";
import { getProductImageUrl } from "./productImage";

export interface RecommendationItem {
  name: string;
  score: number;
  image: string;
  brand?: string;
  code?: string;
}

export interface Recommendations {
  better: RecommendationItem[];
  worse: RecommendationItem[];
}

export function getRecommendations(currentProduct: any, products: any[]): Recommendations {
  if (!currentProduct || !Array.isArray(products)) {
    return { better: [], worse: [] };
  }

  const currentScore = getHealthScore(currentProduct);
  const currentName = currentProduct?.product_name?.toLowerCase() || "";

  // Filter and map valid products
  const validProducts = products
    .filter((item) => item?.product_name && item.nutriments)
    .map((item) => ({
      name: item.product_name,
      brand: item.brands || "",
      score: getHealthScore(item),
      image: getProductImageUrl(item),
      code: item.code || item._id || "",
    }))
    // Remove duplicates and current product
    .filter((item) => !item.name.toLowerCase().includes(currentName))
    // Remove items without images (better UI)
    .filter((item) => item.image?.length > 0);

  // Find better alternatives (higher score)
  const better = validProducts
    .filter((item) => item.score > currentScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Find worse alternatives (lower score)
  const worse = validProducts
    .filter((item) => item.score < currentScore)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  return { better, worse };
}

/**
 * Get improvement percentage compared to current product
 */
export function getScoreImprovement(currentScore: number, alternativeScore: number): number {
  if (currentScore === 0) return 0;
  return Math.round(((alternativeScore - currentScore) / currentScore) * 100);
}
