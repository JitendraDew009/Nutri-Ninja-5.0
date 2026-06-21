/**
 * Parse ingredient text and extract individual ingredients
 */

export interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
  isAllergen: boolean;
  allergenType?: string;
}

export interface AllergenInfo {
  name: string;
  common: boolean;
  severity: 'high' | 'moderate' | 'low';
}

const COMMON_ALLERGENS: Record<string, AllergenInfo> = {
  peanut: { name: 'Peanuts', common: true, severity: 'high' },
  peanuts: { name: 'Peanuts', common: true, severity: 'high' },
  tree_nut: { name: 'Tree Nuts', common: true, severity: 'high' },
  almonds: { name: 'Almonds', common: true, severity: 'high' },
  cashew: { name: 'Cashews', common: true, severity: 'high' },
  walnut: { name: 'Walnuts', common: true, severity: 'high' },
  pecan: { name: 'Pecans', common: true, severity: 'high' },
  milk: { name: 'Milk', common: true, severity: 'high' },
  dairy: { name: 'Dairy', common: true, severity: 'high' },
  lactose: { name: 'Lactose', common: true, severity: 'moderate' },
  egg: { name: 'Eggs', common: true, severity: 'high' },
  eggs: { name: 'Eggs', common: true, severity: 'high' },
  soy: { name: 'Soy', common: true, severity: 'high' },
  soybeans: { name: 'Soybeans', common: true, severity: 'high' },
  wheat: { name: 'Wheat', common: true, severity: 'high' },
  gluten: { name: 'Gluten', common: true, severity: 'high' },
  fish: { name: 'Fish', common: true, severity: 'high' },
  shellfish: { name: 'Shellfish', common: true, severity: 'high' },
  shrimp: { name: 'Shellfish (Shrimp)', common: true, severity: 'high' },
  crab: { name: 'Shellfish (Crab)', common: true, severity: 'high' },
  lobster: { name: 'Shellfish (Lobster)', common: true, severity: 'high' },
  sesame: { name: 'Sesame', common: true, severity: 'moderate' },
  sulfites: { name: 'Sulfites', common: false, severity: 'moderate' },
  sulfur_dioxide: { name: 'Sulfur Dioxide', common: false, severity: 'moderate' },
  mustard: { name: 'Mustard', common: false, severity: 'moderate' },
  celery: { name: 'Celery', common: false, severity: 'moderate' },
  lupin: { name: 'Lupin', common: false, severity: 'low' },
};

/**
 * Parse ingredient text and extract individual ingredients
 */
export function parseIngredients(text: string): Ingredient[] {
  if (!text) return [];

  // Split by common separators
  const ingredientStrings = text
    .split(/[,;\\n]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return ingredientStrings
    .map((ingredientStr) => parseIngredient(ingredientStr))
    .filter((ing) => ing !== null) as Ingredient[];
}

/**
 * Parse a single ingredient string
 */
function parseIngredient(text: string): Ingredient | null {
  if (!text || text.length < 2) return null;

  const cleaned = text.toLowerCase().trim();
  let name = text.trim();
  let quantity: string | undefined;
  let unit: string | undefined;

  // Extract quantity and unit (e.g., "2.5g", "1 cup")
  const quantityMatch = text.match(/^(\d+(?:\.\d+)?)\s*(%|mg|g|kg|ml|l|oz|cup|tbsp|tsp|lb)?/i);
  if (quantityMatch) {
    quantity = quantityMatch[1];
    unit = quantityMatch[2];
    name = text.substring(quantityMatch[0].length).trim();
  }

  // Check for allergens
  const allergenKey = Object.keys(COMMON_ALLERGENS).find(
    (key) => cleaned.includes(key) || cleaned.startsWith(key)
  );

  const isAllergen = !!allergenKey;
  const allergenType = allergenKey ? COMMON_ALLERGENS[allergenKey].name : undefined;

  return {
    name,
    quantity,
    unit,
    isAllergen,
    allergenType,
  };
}

/**
 * Extract allergens from ingredient list
 */
export function extractAllergens(ingredients: Ingredient[]): AllergenInfo[] {
  const allergens: Map<string, AllergenInfo> = new Map();

  ingredients.forEach((ing) => {
    if (ing.isAllergen && ing.allergenType) {
      if (!allergens.has(ing.allergenType)) {
        const allergenInfo = Object.values(COMMON_ALLERGENS).find(
          (a) => a.name === ing.allergenType
        );
        if (allergenInfo) {
          allergens.set(ing.allergenType, allergenInfo);
        }
      }
    }
  });

  return Array.from(allergens.values()).sort(
    (a, b) => (b.common ? 1 : 0) - (a.common ? 1 : 0)
  );
}

/**
 * Assess nutritional impact from ingredients
 */
export function assessIngredientHealth(ingredients: Ingredient[]): {
  score: number;
  warning: string;
  details: string[];
} {
  const details: string[] = [];
  let score = 50; // Start neutral

  // Check for high sugar indicators
  if (
    ingredients.some((ing) =>
      /sugar|glucose|fructose|sucrose|dextrose|corn\s*syrup|honey/i.test(ing.name)
    )
  ) {
    score -= 5;
    details.push('Contains added sugars');
  }

  // Check for artificial additives
  if (ingredients.some((ing) => /artificial|dye|color|carmine|tartrazine/i.test(ing.name))) {
    score -= 3;
    details.push('Contains artificial additives');
  }

  // Check for trans fats
  if (ingredients.some((ing) => /trans\s*fat|partially\s*hydrogenated/i.test(ing.name))) {
    score -= 10;
    details.push('Contains trans fats (avoid if possible)');
  }

  // Check for saturated fats
  if (ingredients.some((ing) => /palm\s*oil|coconut\s*oil|butter/i.test(ing.name))) {
    score -= 2;
    details.push('High in saturated fats');
  }

  // Check for whole grains
  if (
    ingredients.some((ing) => /whole\s*grain|whole\s*wheat|brown\s*rice|oats?/i.test(ing.name))
  ) {
    score += 3;
    details.push('Contains whole grains');
  }

  // Check for protein sources
  if (
    ingredients.some((ing) => /protein|soy|legume|bean|lentil|tofu/i.test(ing.name))
  ) {
    score += 2;
    details.push('Good protein source');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  const warning =
    score >= 70
      ? 'Generally good ingredients'
      : score >= 50
        ? 'Mixed ingredient quality'
        : 'Contains potentially unhealthy items';

  return { score, warning, details };
}
