export type UserProfile = {
  name: string;
  age: string;
  weight: string;
  goal: "general" | "diabetes" | "weight_loss" | "muscle_gain" | "heart_health";
  restrictions?: string[];
  allergies: string;
  conditions?: string;
};

const memoryStore: Record<string, string> = {};

function getStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return {
    getItem: (key: string) => memoryStore[key] || null,
    setItem: (key: string, value: string) => {
      memoryStore[key] = value;
    },
  };
}

export function readStore<T>(key: string, fallback: T): T {
  try {
    const value = getStorage().getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  try {
    getStorage().setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is best-effort on native unless a storage provider is added.
  }
}

export function productSummary(product: any) {
  return {
    code: product?.code || product?.id || String(Date.now()),
    product_name: product?.product_name || product?.name || "Unknown product",
    brands: product?.brands || "",
    image_front_url: product?.image_front_url || product?.image_url || product?.image || "",
    nutriments: product?.nutriments || {},
    categories: product?.categories || product?.categories_en || "",
    quantity: product?.quantity || "",
  };
}
