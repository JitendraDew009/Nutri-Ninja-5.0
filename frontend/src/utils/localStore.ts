import AsyncStorage from "@react-native-async-storage/async-storage";

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

// In-memory cache for synchronous reads. Hydrated from AsyncStorage on startup.
const memoryStore: Record<string, string> = {};

// Named listeners for cross-platform event system (replaces window events on Android)
type NamedListener = (detail?: any) => void;
const namedListeners = new Map<string, Set<NamedListener>>();

export function addNativeListener(eventName: string, listener: NamedListener): () => void {
  if (!namedListeners.has(eventName)) {
    namedListeners.set(eventName, new Set());
  }
  namedListeners.get(eventName)!.add(listener);
  return () => {
    namedListeners.get(eventName)?.delete(listener);
  };
}

export function canUseBrowserEvents() {
  return (
    typeof window !== "undefined" &&
    typeof window.addEventListener === "function" &&
    typeof window.removeEventListener === "function" &&
    typeof window.dispatchEvent === "function" &&
    typeof CustomEvent === "function"
  );
}

export function emitStoreEvent(name: string, detail?: any) {
  // Fire browser CustomEvent on web
  if (canUseBrowserEvents()) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
  // Also fire native listeners (works on both Android and web)
  namedListeners.get(name)?.forEach((listener) => {
    try {
      listener(detail);
    } catch {
      // ignore listener errors
    }
  });
}

// Load all persisted data from AsyncStorage into memoryStore.
// Call once at app startup before rendering any components.
export async function hydrateStore(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (!keys || keys.length === 0) return;
    const pairs = await AsyncStorage.multiGet(keys as string[]);
    for (const [key, value] of pairs) {
      if (key && value !== null) {
        memoryStore[key] = value;
      }
    }
  } catch {
    // Continue with empty memory store if AsyncStorage is unavailable
  }
}

export function readStore<T>(key: string, fallback: T): T {
  try {
    const value = memoryStore[key] ?? null;
    return value !== null ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  try {
    const serialized = JSON.stringify(value);
    memoryStore[key] = serialized;
    emitStoreEvent("nutri-data-changed", { key });
    // Persist to AsyncStorage asynchronously (non-blocking)
    AsyncStorage.setItem(key, serialized).catch(() => undefined);
  } catch {
    // Local persistence is best-effort on native unless a storage provider is added.
  }
}

export function deleteStore(key: string) {
  delete memoryStore[key];
  AsyncStorage.removeItem(key).catch(() => undefined);
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

  emitStoreEvent("nutri-profile-changed");
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
