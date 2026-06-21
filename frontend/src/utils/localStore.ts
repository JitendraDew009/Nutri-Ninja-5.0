export type UserProfile = {
  id: string;
  name: string;
  relationship: "self" | "spouse" | "child" | "parent" | "other";
  age: string;
  weight: string;
  goal: "general" | "diabetes" | "weight_loss" | "muscle_gain" | "heart_health";
  restrictions?: string[];
  allergies: string;
  conditions?: string;
  dislikedIngredients?: string;
};

export const DEFAULT_PROFILE: UserProfile = {
  id: "primary",
  name: "Primary User",
  relationship: "self",
  age: "",
  weight: "",
  goal: "general",
  restrictions: [],
  allergies: "",
  conditions: "",
  dislikedIngredients: "",
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nutri-data-changed", { detail: { key } }));
    }
  } catch {
    // Local persistence is best-effort on native unless a storage provider is added.
  }
}

export function getFamilyProfiles(): UserProfile[] {
  const profiles = readStore<UserProfile[]>("familyProfiles", []);
  if (profiles.length) return profiles;

  const legacy = readStore<Partial<UserProfile> | null>("userProfile", null);
  const migrated: UserProfile = {
    ...DEFAULT_PROFILE,
    ...(legacy || {}),
    id: legacy?.id || "primary",
    relationship: legacy?.relationship || "self",
  };
  writeStore("familyProfiles", [migrated]);
  writeStore("activeProfileId", migrated.id);
  writeStore("userProfile", migrated);
  return [migrated];
}

export function getActiveProfile(): UserProfile {
  const profiles = getFamilyProfiles();
  const activeId = readStore("activeProfileId", profiles[0].id);
  return profiles.find((profile) => profile.id === activeId) || profiles[0];
}

export function saveFamilyProfiles(profiles: UserProfile[], activeId?: string) {
  const safeProfiles = profiles.length ? profiles : [DEFAULT_PROFILE];
  const nextActiveId =
    activeId && safeProfiles.some((profile) => profile.id === activeId)
      ? activeId
      : safeProfiles[0].id;
  const activeProfile =
    safeProfiles.find((profile) => profile.id === nextActiveId) || safeProfiles[0];

  writeStore("familyProfiles", safeProfiles);
  writeStore("activeProfileId", nextActiveId);
  // Keep the legacy key synchronized for existing scoring code.
  writeStore("userProfile", activeProfile);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nutri-profile-changed"));
  }
}

export function setActiveProfile(profileId: string) {
  saveFamilyProfiles(getFamilyProfiles(), profileId);
}

export function profileStoreKey(baseKey: string, profileId = getActiveProfile().id) {
  return `${baseKey}:${profileId}`;
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
