export function normalizeImageUrl(value: unknown): string {
  if (typeof value !== "string") return "";

  const url = value.trim();
  if (!url) return "";

  // Prevent mixed-content blocking when the web app is served over HTTPS.
  return url.startsWith("http://") ? `https://${url.slice(7)}` : url;
}

export function getProductImageUrls(product: any): string[] {
  const candidates = [
    product?.image_front_url,
    product?.image_url,
    product?.image_front_small_url,
    product?.image_small_url,
    product?.image_front_thumb_url,
    product?.image_thumb_url,
    product?.image,
  ]
    .map(normalizeImageUrl)
    .filter(Boolean);

  return [...new Set(candidates)];
}

export function getProductImageUrl(product: any): string {
  return getProductImageUrls(product)[0] || "";
}
