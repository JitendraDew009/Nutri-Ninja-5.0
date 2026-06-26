import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

function getBackendUrl() {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000`;
  }

  const constants = Constants as any;
  const hostUri =
    constants?.expoConfig?.hostUri ||
    constants?.manifest?.debuggerHost ||
    constants?.manifest2?.extra?.expoClient?.hostUri;

  const host = typeof hostUri === "string" ? hostUri.split(":")[0] : "";
  if (host) return `http://${host}:8000`;

  const isDevelopment = process.env.NODE_ENV !== "production";
  if (isDevelopment && Platform.OS === "android") return "http://10.0.2.2:8000";

  if (Platform.OS !== "web") return "";

  return "http://127.0.0.1:8000";
}

const BACKEND_URL = getBackendUrl();
const BACKEND_REQUIRED_MESSAGE =
  "Backend URL is not configured for this Android build. Set EXPO_PUBLIC_BACKEND_URL to your deployed FastAPI HTTPS URL before exporting the APK/AAB.";

const OFF_BASE = "https://world.openfoodfacts.org";

// Race backend against OpenFoodFacts directly — whichever replies first wins.
// This eliminates the cold-start wait on Render free tier.
async function raceGet(backendUrl: string, offUrl: string): Promise<any> {
  const backendReq = axios.get(backendUrl, { timeout: 6000 }).then((r) => r.data);
  const offReq = axios.get(offUrl, { timeout: 12000 }).then((r) => r.data);
  return Promise.any([backendReq, offReq]);
}

export async function fetchProduct(barcode: string) {
  const offUrl = `${OFF_BASE}/api/v0/product/${barcode}.json`;

  if (!BACKEND_URL) {
    const response = await axios.get(offUrl, { timeout: 12000 });
    return response.data;
  }

  try {
    return await raceGet(`${BACKEND_URL}/product/${barcode}`, offUrl);
  } catch {
    const response = await axios.get(offUrl, { timeout: 12000 });
    return response.data;
  }
}

export async function analyzeProduct(product: any, profile?: any) {
  try {
    if (!BACKEND_URL) throw new Error("Backend not configured");

    const response = await axios.post(`${BACKEND_URL}/analyze`, {
      product,
      profile,
    });

    return response.data;
  } catch {
    return {
      product,
      nutriments: product?.nutriments || {},
    };
  }
}

export async function searchProducts(category: string) {
  const query = category?.trim();
  if (!query) return [];

  const offUrl =
    `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=20`;

  if (!BACKEND_URL) {
    try {
      const response = await axios.get(offUrl, { timeout: 12000 });
      return response.data?.products || [];
    } catch {
      return [];
    }
  }

  try {
    const data = await raceGet(
      `${BACKEND_URL}/search?query=${encodeURIComponent(query)}&page_size=20`,
      offUrl
    );
    // Backend returns { products: [...] }, OFF returns { products: [...] } too
    return data?.products || [];
  } catch {
    return [];
  }
}

export async function searchProductsByName(query: string) {
  return searchProducts(query);
}

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function sendChatMessage(messages: ChatMessage[], profile?: any) {
  try {
    if (!BACKEND_URL) throw new Error(BACKEND_REQUIRED_MESSAGE);

    const response = await axios.post(
      `${BACKEND_URL}/chat`,
      { messages, profile },
      { timeout: 50000 }
    );
    return response.data?.message as string;
  } catch (error: any) {
    const detail = error?.response?.data?.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : error?.message === BACKEND_REQUIRED_MESSAGE
          ? BACKEND_REQUIRED_MESSAGE
          : `Unable to reach the nutrition assistant at ${BACKEND_URL}. Check that the backend is running and your phone is on the same Wi-Fi.`
    );
  }
}

export async function sendVoiceMessage(
  audioBase64: string,
  mimeType: string,
  messages: ChatMessage[],
  profile?: any
) {
  try {
    if (!BACKEND_URL) throw new Error(BACKEND_REQUIRED_MESSAGE);

    const response = await axios.post(
      `${BACKEND_URL}/chat/voice`,
      {
        audio_base64: audioBase64,
        mime_type: mimeType,
        messages,
        profile,
      },
      { timeout: 80000 }
    );
    return response.data?.message as string;
  } catch (error: any) {
    const detail = error?.response?.data?.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : error?.message === BACKEND_REQUIRED_MESSAGE
          ? BACKEND_REQUIRED_MESSAGE
          : `Unable to process the voice message at ${BACKEND_URL}. Check that the backend is running and your phone is on the same Wi-Fi.`
    );
  }
}
