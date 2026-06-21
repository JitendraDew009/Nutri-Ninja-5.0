import axios from "axios";

const BACKEND_URL = "http://127.0.0.1:8000";

export async function fetchProduct(
  barcode: string
) {
  const backendUrl =
    `${BACKEND_URL}/product/${barcode}`;

  const fallbackUrl =
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

  try {
    const response =
      await axios.get(backendUrl, { timeout: 8000 });

    return response.data;
  } catch {
    const response =
      await axios.get(fallbackUrl);

    return response.data;
  }
}

export async function analyzeProduct(product: any, profile?: any) {
  try {
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

export async function searchProducts(
  category: string
) {
  const query = category?.trim();
  if (!query) {
    return [];
  }

  const backendUrl =
    `${BACKEND_URL}/search?query=${encodeURIComponent(query)}&page_size=40`;

  const fallbackUrl =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      query
    )}&search_simple=1&json=1&page_size=40`;

  try {
    const response =
      await axios.get(backendUrl, { timeout: 8000 });

    return (
      response.data
        ?.products || []
    );
  } catch {
    try {
      const response =
        await axios.get(fallbackUrl);

      return (
        response.data
          ?.products || []
      );
    } catch {
      return [];
    }
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
        : "Unable to reach the nutrition assistant. Check the backend and internet connection."
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
        : "Unable to process the voice message. Please try again."
    );
  }
}
