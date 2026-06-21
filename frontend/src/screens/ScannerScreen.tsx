import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";

import ProductDetailScreen from "./ProductDetailScreen";
import OCRLabelReader from "../components/ocr-label-reader";
import ProductImage from "../components/product-image";
import { fetchProduct, searchProducts } from "../services/api";
import { getHealthScore, getHealthScoreColor, getNutriScore, getNutriScoreColor } from "../utils/healthScore";
import { productSummary, readStore, writeStore, UserProfile } from "../utils/localStore";
import { useThemeMode } from "../utils/themeMode";
import { getProductImageUrl, getProductImageUrls } from "../utils/productImage";

interface Suggestion {
  id: string;
  name: string;
  image: string;
  imageUrls: string[];
  barcode?: string;
  brand?: string;
  nutriScore: string;
  nutriColor: string;
}

const defaultProfile: UserProfile = {
  name: "Nutri Ninja User",
  age: "",
  weight: "",
  goal: "general",
  restrictions: [],
  allergies: "",
  conditions: "",
};

const goalLabels: Record<UserProfile["goal"], string> = {
  general: "General Fitness",
  diabetes: "Diabetes Support",
  weight_loss: "Weight Loss",
  muscle_gain: "Muscle Gain",
  heart_health: "Heart Health",
};

export default function ScannerScreen() {
  const { palette } = useThemeMode();
  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeText, setBarcodeText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>(() => readStore("scanHistory", []));
  const [basket, setBasket] = useState<any[]>(() => readStore("groceryBasket", []));
  const [profile, setProfile] = useState<UserProfile>(() => readStore("userProfile", defaultProfile));
  const [loading, setLoading] = useState(false);
  const [scanEnabled, setScanEnabled] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const isWeb = Platform.OS === "web";
  const hasCameraPermission = permission?.granted === true;
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSearchRef = useRef<string>("");

  useEffect(() => {
    if (permission?.granted === false) {
      requestPermission();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [permission, requestPermission]);

  const rememberProduct = (product: any) => {
    const summary = productSummary(product);
    const nextHistory = [
      summary,
      ...scanHistory.filter((item) => item.code !== summary.code),
    ].slice(0, 30);
    setScanHistory(nextHistory);
    writeStore("scanHistory", nextHistory);
    return summary;
  };

  const openProductByBarcode = async (barcode: string) => {
    if (!barcode.trim()) {
      alert("Enter a barcode first");
      return;
    }

    setLoading(true);
    setScanEnabled(false);
    try {
      const response = await fetchProduct(barcode.trim());
      if (response?.product?.product_name) {
        rememberProduct(response.product);
        setSelectedProduct(response.product);
      } else {
        alert("Product not found");
        setScanEnabled(true);
      }
    } catch {
      alert("Unable to fetch product. Check backend or internet connection.");
      setScanEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanEnabled || loading) return;
    setBarcodeText(data);
    openProductByBarcode(data);
  };

  const handleSearch = (text: string) => {
    const query = text.trim();
    setSearchText(text);
    latestSearchRef.current = query;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const currentQuery = latestSearchRef.current;
      setLoading(true);
      try {
        const results = await searchProducts(currentQuery);
        if (latestSearchRef.current !== currentQuery) {
          return;
        }

        setSuggestions(
          results.slice(0, 8).map((product: any, index: number) => {
            const nutriScore = getNutriScore(product);
            return {
              id: `${product.code || index}`,
              name: product.product_name || "Unknown product",
              brand: product.brands || "",
              image: getProductImageUrl(product),
              imageUrls: getProductImageUrls(product),
              barcode: product.code,
              nutriScore,
              nutriColor: getNutriScoreColor(nutriScore),
            };
          })
        );
      } finally {
        if (latestSearchRef.current === currentQuery) {
          setLoading(false);
        }
      }
    }, 300);
  };

  const handleSelectSuggestion = async (product: Suggestion) => {
    if (!product.barcode) {
      alert("This item cannot be opened because it has no barcode.");
      return;
    }

    await openProductByBarcode(product.barcode);
    setSearchText("");
    setSuggestions([]);
  };

  const handleAddToBasket = (product: any) => {
    const summary = productSummary(product);
    const nextBasket = [
      summary,
      ...basket.filter((item) => item.code !== summary.code),
    ].slice(0, 30);
    setBasket(nextBasket);
    writeStore("groceryBasket", nextBasket);
    alert("Added to grocery basket");
  };

  useEffect(() => {
    setProfile(readStore("userProfile", defaultProfile));
  }, []);

  const closeProduct = () => {
    setSelectedProduct(null);
    setScanEnabled(true);
    setSearchText("");
    setSuggestions([]);
  };

  const handleOpenLens = async () => {
    if (isWeb) {
      alert("Camera scan is not available in the browser. Open the app in Expo Go or a native build to use the camera.");
      return;
    }

    const response = await requestPermission();
    if (response?.granted) {
      setShowCamera(true);
      setScanEnabled(true);
      return;
    }

    alert("Camera access is required to scan barcodes.");
  };

  if (selectedProduct) {
    return (
      <ProductDetailScreen
        product={selectedProduct}
        onClose={closeProduct}
        searchProducts={searchProducts}
        onAddToBasket={handleAddToBasket}
        onSelectProduct={openProductByBarcode}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.profileHeader, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <View style={styles.profileBrand}> 
            <View style={[styles.logoCircle, { backgroundColor: palette.surfaceSoft }]}> 
              <Text style={[styles.logoEmoji, { color: palette.accentBright }]}>🥑</Text>
            </View>
            <View>
              <Text style={[styles.profileName, { color: palette.text }]}>Hello, {profile.name}</Text>
              <Text style={[styles.profileSubtitle, { color: palette.muted }]}>Welcome back to your scanner.</Text>
            </View>
          </View>
          <View style={[styles.goalBadge, { backgroundColor: palette.surfaceSoft }]}> 
            <Text style={[styles.goalLabel, { color: palette.muted }]}>Dietary Goal</Text>
            <Text style={[styles.goalValue, { color: palette.accentBright }]}>{goalLabels[profile.goal]}</Text>
          </View>
        </View>

        <View style={styles.headerPanel}>
          <Text style={[styles.pageTitle, { color: palette.text }]}>Search Product Catalog</Text>
          <Text style={[styles.pageSubtitle, { color: palette.muted }]}>Scan barcodes or lookup products by name.</Text>
        </View>

        <View style={[styles.searchBarCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <View style={[styles.searchBar, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}> 
            <Text style={[styles.searchIcon, { color: palette.muted }]}>🔎</Text>
            <TextInput
              style={[styles.searchInput, { color: palette.text }]}
              placeholder="Search by product or brand"
              placeholderTextColor="#7b8794"
              value={searchText}
              onChangeText={handleSearch}
              onSubmitEditing={() => handleSearch(searchText)}
              returnKeyType="search"
            />
          </View>
        </View>

        {(loading || suggestions.length > 0 || searchText.trim().length > 0) && (
          <View style={[styles.suggestionsCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
            <View style={styles.suggestionsHeader}>
              <Text style={[styles.suggestionsTitle, { color: palette.text }]}>Search Results</Text>
              {loading ? (
                <View style={styles.inlineLoading}>
                  <ActivityIndicator size="small" color={palette.accentBright} />
                  <Text style={[styles.loadingText, { color: palette.muted, marginLeft: 8 }]}>Searching...</Text>
                </View>
              ) : null}
            </View>

            <ScrollView style={styles.suggestionList} nestedScrollEnabled>
              {!loading && suggestions.length === 0 ? (
                <Text style={[styles.noResultsText, { color: palette.muted }]}>No matching products found yet. Try another keyword.</Text>
              ) : null}

              {suggestions.map((item) => (
                <TouchableOpacity key={item.id} style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)}>
                  <ProductImage
                    urls={item.imageUrls}
                    style={styles.suggestionImage}
                    placeholderStyle={styles.emptyImage}
                  />
                  <View style={styles.suggestionTextWrap}>
                    <Text style={[styles.suggestionName, { color: palette.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.suggestionBrand, { color: palette.muted }]} numberOfLines={1}>{item.brand || item.barcode || "Open Food Facts"}</Text>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: item.nutriColor }]}> 
                    <Text style={styles.scoreBadgeText}>{item.nutriScore}</Text>
                  </View>
                  <Text style={[styles.chevron, { color: palette.accentBright }]}>›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.featureCard, { backgroundColor: palette.surface, borderColor: palette.border, marginTop: 12 }]}> 
          <View style={styles.featureHeader}>
            <View style={[styles.featureBadge, { backgroundColor: palette.surfaceSoft }]}> 
              <Text style={[styles.featureBadgeText, { color: palette.accentBright }]}>📸</Text>
            </View>
            <View style={styles.featureTextBlock}>
              <Text style={[styles.featureTitle, { color: palette.text }]}>Barcode Scanner</Text>
              <Text style={[styles.featureSubtitle, { color: palette.muted }]}>Scan product barcodes through the camera for fast lookup.</Text>
            </View>
          </View>
          {showCamera && !isWeb && hasCameraPermission ? (
            <View style={styles.cameraBox}>
              <CameraView
                style={styles.camera}
                onBarcodeScanned={scanEnabled ? handleBarcodeScanned : undefined}
                ratio="16:9"
              />
              <View style={styles.cameraShade}>
                <View style={styles.scanLine} />
              </View>
            </View>
          ) : (
            <View style={[styles.cameraPlaceholder, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}> 
              <Text style={[styles.placeholderText, { color: palette.muted }]}>
                Open the lens to scan barcodes directly with the camera.
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: palette.accentBright },
            ]}
            onPress={handleOpenLens}
          >
            <Text style={styles.primaryButtonText}>
              Open Lens
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.featureCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.featureTitle, { color: palette.text }]}>Pulsing Barcode Terminal</Text>
          <Text style={[styles.featureSubtitle, { color: palette.muted }]}>Enter a barcode manually or scan from a label.</Text>
          <View style={[styles.barcodeDisplay, { borderColor: palette.border }]}> 
            <BarcodeBars />
          </View>
          <TextInput
            style={[styles.manualInput, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
            placeholder="Enter barcode manually"
            placeholderTextColor="#7b8794"
            keyboardType="numeric"
            value={barcodeText}
            onChangeText={setBarcodeText}
            onSubmitEditing={() => openProductByBarcode(barcodeText)}
          />
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: palette.accentBright }]} onPress={() => openProductByBarcode(barcodeText)}>
            <Text style={styles.secondaryButtonText}>Lookup Barcode</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BarcodeBars() {
  const widths = [2, 5, 1, 4, 3, 1, 6, 2, 4, 1, 5, 2, 3, 6, 1, 4, 2, 5, 1, 3, 6, 2, 4];
  return (
    <View style={styles.barcodeBars}>
      {widths.map((width, index) => (
        <View key={`${width}-${index}`} style={[styles.barcodeBar, { width }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6faf4" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  headerPanel: { marginBottom: 22 },
  pageTitle: { fontSize: 26, fontWeight: "900", marginBottom: 8 },
  pageSubtitle: { fontSize: 14, lineHeight: 20 },
  profileHeader: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    padding: 18,
  },
  profileBrand: { alignItems: "center", flexDirection: "row", gap: 12, flex: 1 },
  logoCircle: {
    alignItems: "center",
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    marginRight: 12,
    width: 44,
  },
  logoEmoji: { fontSize: 20 },
  profileName: { fontSize: 16, fontWeight: "900" },
  profileSubtitle: { fontSize: 12, lineHeight: 18 },
  goalBadge: {
    alignItems: "flex-end",
    borderRadius: 16,
    minWidth: 120,
    padding: 12,
  },
  goalLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  goalValue: { fontSize: 13, fontWeight: "900" },
  searchBarCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16 },
  searchBar: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchIcon: { fontSize: 18 },
  featureCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16 },
  featureHeader: { alignItems: "center", flexDirection: "row", gap: 14, marginBottom: 16 },
  featureBadge: { alignItems: "center", borderRadius: 18, height: 44, justifyContent: "center", width: 44 },
  featureBadgeText: { fontSize: 20 },
  featureTextBlock: { flex: 1 },
  featureTitle: { fontSize: 17, fontWeight: "900", marginBottom: 4 },
  featureSubtitle: { fontSize: 13, lineHeight: 20 },
  primaryButton: { alignItems: "center", borderRadius: 16, paddingVertical: 14, marginTop: 6 },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  barcodeDisplay: { alignItems: "center", borderRadius: 16, borderWidth: 1, marginVertical: 16, padding: 14 },
  secondaryButton: { alignItems: "center", borderRadius: 16, paddingVertical: 14, marginTop: 6 },
  secondaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  suggestionsCard: { borderRadius: 20, borderWidth: 1, marginTop: 6, marginBottom: 16, padding: 14, maxHeight: 320, overflow: "hidden" },
  suggestionList: { maxHeight: 280 },
  suggestionsHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  suggestionsTitle: { fontSize: 15, fontWeight: "900", marginBottom: 0 },
  inlineLoading: { alignItems: "center", flexDirection: "row" },
  noResultsText: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  suggestionItem: { alignItems: "center", borderBottomColor: "#e5e7eb", borderBottomWidth: 1, flexDirection: "row", gap: 10, paddingVertical: 12 },
  suggestionImage: { backgroundColor: "#e5e7eb", borderRadius: 6, height: 44, width: 44 },
  emptyImage: { backgroundColor: "#e5e7eb", borderRadius: 6, height: 44, width: 44 },
  suggestionTextWrap: { flex: 1 },
  suggestionName: { color: "#111827", fontSize: 13, fontWeight: "700" },
  suggestionBrand: { color: "#64748b", fontSize: 11, marginTop: 2 },
  scoreBadge: {
    alignItems: "center",
    borderRadius: 12,
    height: 28,
    justifyContent: "center",
    minWidth: 38,
    paddingHorizontal: 10,
  },
  scoreBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  chevron: { color: "#16a34a", fontSize: 24 },
  sectionHeader: { fontSize: 18, fontWeight: "800", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  scanCard: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  cardTitle: { color: "#111827", fontSize: 17, fontWeight: "800", textAlign: "left" },
  cardSubtitle: { color: "#64748b", fontSize: 13, marginTop: 6, textAlign: "left" },
  cameraBox: {
    backgroundColor: "#d7dde4",
    borderRadius: 8,
    height: 154,
    marginTop: 14,
    overflow: "hidden",
  },
  camera: { flex: 1 },
  cameraShade: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.08)",
    height: "100%",
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  barcodeMock: { alignItems: "center", flex: 1, justifyContent: "center" },
  barcodeBars: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    height: 70,
    justifyContent: "center",
  },
  barcodeBar: { backgroundColor: "#0f172a", height: 66 },
  scanLine: {
    backgroundColor: "#22c55e",
    height: 3,
    left: 0,
    position: "absolute",
    right: 0,
    top: "50%",
  },
  cornerTopLeft: {
    borderColor: "#f8fafc",
    borderLeftWidth: 2,
    borderTopWidth: 2,
    height: 24,
    left: 14,
    position: "absolute",
    top: 14,
    width: 24,
  },
  cornerTopRight: {
    borderColor: "#f8fafc",
    borderRightWidth: 2,
    borderTopWidth: 2,
    height: 24,
    position: "absolute",
    right: 14,
    top: 14,
    width: 24,
  },
  permissionButton: {
    backgroundColor: "rgba(15,23,42,0.78)",
    borderRadius: 8,
    bottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
  },
  permissionButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  cameraPlaceholder: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    minHeight: 150,
    justifyContent: "center",
    marginBottom: 14,
  },
  placeholderText: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  dividerRow: { alignItems: "center", flexDirection: "row", gap: 10, marginVertical: 14 },
  divider: { backgroundColor: "#d1d5db", flex: 1, height: 1 },
  orText: { color: "#111827", fontSize: 12 },
  manualInput: {
    borderColor: "#d1d5db",
    borderRadius: 6,
    borderWidth: 1,
    color: "#111827",
    fontSize: 13,
    height: 44,
    paddingHorizontal: 12,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: "#35a853",
    borderRadius: 6,
    height: 42,
    justifyContent: "center",
    marginTop: 10,
  },
  searchButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  searchPanel: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  panelTitle: { color: "#111827", fontSize: 15, fontWeight: "800", marginBottom: 10 },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#d9e2ec",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
  },
  searchRow: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#d9e2ec",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: { color: "#111827", flex: 1, fontSize: 14, height: 44, paddingHorizontal: 12 },
  searchActionButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  searchActionButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  splitRow: {
    flexDirection: "column",
    gap: 14,
  },
  basketCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  basketStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  basketStat: {
    flex: 1,
    backgroundColor: "#f1f6ed",
    borderRadius: 8,
    padding: 12,
  },
  basketStatLabel: {
    color: "#64748b",
    fontSize: 11,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  basketStatValue: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "bold",
  },
  basketHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  basketCountPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  basketCountText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
  },
  basketProgressWrapper: {
    marginTop: 16,
  },
  basketProgressTrack: {
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  basketProgressFill: {
    height: 10,
    borderRadius: 999,
  },
  basketProgressLabel: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 8,
  },
  basketSummary: {
    marginTop: 14,
    marginBottom: 12,
  },
  basketSummaryText: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  basketList: {
    marginTop: 6,
  },
  basketItem: {
    alignItems: "center",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  basketItemText: { flex: 1 },
  basketItemTitle: { color: "#111827", fontSize: 13, fontWeight: "700" },
  basketItemBrand: { color: "#64748b", fontSize: 11, marginTop: 2 },
  basketBadge: {
    borderRadius: 999,
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  basketBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  basketMoreText: { color: "#64748b", fontSize: 12, marginTop: 8 },
  muted: { color: "#64748b", fontSize: 12, lineHeight: 18, marginTop: 10 },
  loadingOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.72)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  loadingText: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 10 },
});
