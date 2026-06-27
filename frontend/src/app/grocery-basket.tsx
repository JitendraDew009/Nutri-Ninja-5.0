import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ProductImage from "../components/product-image";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import { fetchProduct, searchProducts, sendChatMessage } from "../services/api";
import {
  getHealthScore,
  getHealthScoreColor,
  getHealthScoreLabel,
  getNutriScore,
  getNutriScoreColor,
} from "../utils/healthScore";
import { getActiveProfile, profileStoreKey, readStore, writeStore } from "../utils/localStore";
import { ThemeToggle, useThemeMode } from "../utils/themeMode";

const goalLabels: Record<string, string> = {
  general: "General Fitness",
  diabetes: "Diabetes Support",
  weight_loss: "Weight Loss",
  muscle_gain: "Muscle Gain",
  heart_health: "Heart Health",
};

function itemKey(item: any) {
  return String(item?.code || item?.product_name || item?.name || "basket-item");
}

function itemCount(item: any) {
  const count = Number(item?.basketQuantity || item?.basket_quantity || 1);
  return Number.isFinite(count) && count > 0 ? Math.round(count) : 1;
}

function gradeFromScore(score: number) {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "E";
}

export default function GroceryBasketScreen() {
  const { palette } = useThemeMode();
  const [activeProfile, setActiveProfile] = useState(getActiveProfile);
  const basketKey = profileStoreKey("groceryBasket", activeProfile.id);
  const [basket, setBasket] = useState<any[]>(() => readStore(basketKey, []));
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [openingCode, setOpeningCode] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");

  // Refresh basket every time this tab is focused so additions from other screens are visible
  useFocusEffect(
    useCallback(() => {
      const profile = getActiveProfile();
      setActiveProfile(profile);
      setBasket(readStore(profileStoreKey("groceryBasket", profile.id), []));
    }, [])
  );

  const basketScore = useMemo(() => {
    if (!basket.length) return 0;
    const totalWeightedScore = basket.reduce(
      (sum, item) => sum + getHealthScore(item) * itemCount(item),
      0
    );
    const totalItems = basket.reduce((sum, item) => sum + itemCount(item), 0);
    return Math.round(totalWeightedScore / Math.max(totalItems, 1));
  }, [basket]);

  const totalQuantity = useMemo(
    () => basket.reduce((sum, item) => sum + itemCount(item), 0),
    [basket]
  );

  const saveBasket = (nextBasket: any[]) => {
    setBasket(nextBasket);
    writeStore(basketKey, nextBasket);
  };

  const clearBasket = () => {
    setAiInsight("");
    saveBasket([]);
  };

  const updateItemQuantity = (target: any, delta: number) => {
    const targetKey = itemKey(target);
    const nextBasket = basket
      .map((item) => {
        if (itemKey(item) !== targetKey) return item;
        const nextCount = Math.max(0, itemCount(item) + delta);
        return { ...item, basketQuantity: nextCount };
      })
      .filter((item) => itemCount(item) > 0);
    saveBasket(nextBasket);
  };

  const removeItem = (target: any) => {
    saveBasket(basket.filter((item) => itemKey(item) !== itemKey(target)));
  };

  const openBasketProduct = async (item: any) => {
    const code = item?.code;
    setOpeningCode(code || itemKey(item));
    try {
      if (code) {
        const response = await fetchProduct(String(code));
        setSelectedProduct(response?.product?.product_name ? response.product : item);
      } else {
        setSelectedProduct(item);
      }
    } catch {
      setSelectedProduct(item);
    } finally {
      setOpeningCode(null);
    }
  };

  const analyzeBasket = async () => {
    if (!basket.length) return;
    setAiLoading(true);
    setAiInsight("");
    try {
      const products = basket
        .map((item) => `${item.product_name || "Unknown"} (${item.brands || "Unknown brand"}), score ${getHealthScore(item)}, qty ${itemCount(item)}`)
        .join("; ");
      const message = await sendChatMessage(
        [
          {
            role: "user",
            content: `Analyze this family grocery basket for ${activeProfile.name}. Goal: ${goalLabels[activeProfile.goal] || activeProfile.goal}. Products: ${products}. Give a short practical shopping recommendation in 3 bullets.`,
          },
        ],
        activeProfile
      );
      setAiInsight(message);
    } catch (error: any) {
      setAiInsight(
        error?.message ||
          `Basket score is ${basketScore}/100 (${getHealthScoreLabel(basketScore)}). Try replacing low-score items with higher fiber, lower sugar, and lower salt alternatives.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddToBasket = (product: any) => {
    const code = itemKey(product);
    const existing = basket.find((item) => itemKey(item) === code);
    const nextBasket = existing
      ? basket.map((item) =>
          itemKey(item) === code ? { ...product, basketQuantity: itemCount(item) + 1 } : item
        )
      : [{ ...product, basketQuantity: 1 }, ...basket].slice(0, 30);
    saveBasket(nextBasket);
  };

  useEffect(() => {
    setBasket(readStore(basketKey, []));
    setAiInsight("");
  }, [basketKey]);

  if (selectedProduct) {
    return (
      <ProductDetailScreen
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        searchProducts={searchProducts}
        onAddToBasket={handleAddToBasket}
        onSelectProduct={async (barcode: string) => {
          const response = await fetchProduct(barcode);
          if (response?.product) setSelectedProduct(response.product);
        }}
      />
    );
  }

  const scoreColor = getHealthScoreColor(basketScore);
  const basketGrade = gradeFromScore(basketScore);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: palette.text }]}>Family Shopping Basket</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              Aggregate healthy shopping insights for your household
            </Text>
          </View>
          <ThemeToggle />
        </View>

        <View style={[styles.profileCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.familyIcon, { backgroundColor: palette.surfaceSoft }]}>
            <SymbolView
              name={{ ios: "person.3.fill", android: "family_restroom", web: "family_restroom" }}
              tintColor={palette.accentBright}
              size={31}
            />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.profileTitle, { color: palette.text }]}>Analyzing for: {activeProfile.name}</Text>
            <Text style={[styles.profileSub, { color: palette.muted }]}>
              Family Target: {goalLabels[activeProfile.goal] || activeProfile.goal}
            </Text>
          </View>
        </View>

        {basket.length ? (
          <>
            <View style={[styles.performanceCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.eyebrow, { color: "#22c7a7" }]}>Aggregated Health Performance</Text>

              <View style={styles.performanceBody}>
                <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
                  <Text style={[styles.scoreNumber, { color: palette.text }]}>{basketScore}</Text>
                  <Text style={[styles.scoreGrade, { color: scoreColor }]}>Grade {basketGrade}</Text>
                </View>
                <View style={styles.performanceCopy}>
                  <Text style={[styles.weightedTitle, { color: palette.text }]}>
                    Weighted Score: {basketScore}/100
                  </Text>
                  <Text style={[styles.weightedText, { color: palette.muted }]}>
                    Evaluated over {totalQuantity} item(s). Higher scores denote cleaner ingredients, fewer toxic additives,
                    and a better match for your goal profiles.
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.border }]} />

              {aiInsight ? (
                <View style={[styles.aiBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                  <Text style={[styles.aiTitle, { color: palette.accentBright }]}>Basket AI Insight</Text>
                  <Text style={[styles.aiText, { color: palette.text }]}>{aiInsight}</Text>
                </View>
              ) : null}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.clearButton, { borderColor: palette.danger }]}
                  onPress={clearBasket}
                  activeOpacity={0.85}
                >
                  <SymbolView
                    name={{ ios: "trash.fill", android: "delete", web: "delete" }}
                    tintColor={palette.danger}
                    size={20}
                  />
                  <Text style={[styles.clearButtonText, { color: palette.danger }]}>Clear All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.aiButton, { backgroundColor: palette.accentBright }]}
                  onPress={analyzeBasket}
                  activeOpacity={0.9}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <ActivityIndicator color={palette.onAccent} />
                  ) : (
                    <SymbolView
                      name={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }}
                      tintColor={palette.onAccent}
                      size={20}
                    />
                  )}
                  <Text style={[styles.aiButtonText, { color: palette.onAccent }]}>
                    {aiLoading ? "Analyzing..." : "Analyze Basket with AI"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: palette.muted }]}>
              Basket Products ({totalQuantity})
            </Text>

            <View style={styles.productList}>
              {basket.map((item) => {
                const healthScore = getHealthScore(item);
                const grade = getNutriScore(item);
                const key = itemKey(item);
                const isOpening = openingCode === (item?.code || key);

                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.productRow, { backgroundColor: palette.surface, borderColor: palette.border }]}
                    onPress={() => openBasketProduct(item)}
                    activeOpacity={0.9}
                  >
                    <ProductImage
                      product={item}
                      style={[styles.productImage, { backgroundColor: palette.surfaceSoft }]}
                      placeholderStyle={[styles.productPlaceholder, { backgroundColor: palette.surfaceSoft }]}
                      placeholderTextStyle={[styles.placeholderText, { color: palette.muted }]}
                      placeholderText=""
                    />

                    <View style={styles.productCopy}>
                      <Text style={[styles.productName, { color: palette.text }]} numberOfLines={1}>
                        {item.product_name || "Unknown product"}
                      </Text>
                      <Text style={[styles.productBrand, { color: palette.muted }]} numberOfLines={1}>
                        {item.brands || "Unknown brand"}
                      </Text>
                      <View style={styles.metaRow}>
                        <View style={[styles.gradeBadge, { backgroundColor: getNutriScoreColor(grade) }]}>
                          <Text style={styles.gradeBadgeText}>{grade}</Text>
                        </View>
                        <Text style={[styles.metaText, { color: getHealthScoreColor(healthScore) }]}>
                          Score {healthScore}
                        </Text>
                      </View>
                    </View>

                    {isOpening ? (
                      <ActivityIndicator color={palette.accentBright} />
                    ) : (
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={[styles.iconButton, { borderColor: palette.muted }]}
                          onPress={(event) => {
                            event.stopPropagation();
                            updateItemQuantity(item, -1);
                          }}
                        >
                          <SymbolView
                            name={{ ios: "minus.circle", android: "remove_circle", web: "remove_circle" }}
                            tintColor={palette.muted}
                            size={25}
                          />
                        </TouchableOpacity>
                        <Text style={[styles.quantityText, { color: palette.text }]}>{itemCount(item)}</Text>
                        <TouchableOpacity
                          style={[styles.iconButton, { borderColor: palette.accentBright }]}
                          onPress={(event) => {
                            event.stopPropagation();
                            updateItemQuantity(item, 1);
                          }}
                        >
                          <SymbolView
                            name={{ ios: "plus.circle", android: "add_circle", web: "add_circle" }}
                            tintColor={palette.accentBright}
                            size={25}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(event) => {
                            event.stopPropagation();
                            removeItem(item);
                          }}
                        >
                          <SymbolView
                            name={{ ios: "trash", android: "delete", web: "delete" }}
                            tintColor={palette.danger}
                            size={24}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.surfaceSoft }]}>
              <SymbolView
                name={{ ios: "basket", android: "shopping_basket", web: "shopping_basket" }}
                tintColor={palette.accentBright}
                size={34}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Your family basket is empty</Text>
            <Text style={[styles.emptyText, { color: palette.muted }]}>
              Scan products or add items from food details to build a household basket.
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 34 },
  flex: { flex: 1 },
  headerRow: { alignItems: "flex-start", flexDirection: "row", gap: 12, marginBottom: 24 },
  title: { fontSize: 33, fontWeight: "900", letterSpacing: -1 },
  subtitle: { fontSize: 18, lineHeight: 30, marginTop: 14 },
  profileCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    padding: 22,
  },
  familyIcon: { alignItems: "center", borderRadius: 42, height: 64, justifyContent: "center", width: 64 },
  profileTitle: { fontSize: 19, fontWeight: "900" },
  profileSub: { fontSize: 16, fontWeight: "600", letterSpacing: 1, marginTop: 10 },
  performanceCard: { borderRadius: 20, borderWidth: 1, marginBottom: 24, padding: 20 },
  eyebrow: { fontSize: 15, fontWeight: "900", letterSpacing: 3, marginBottom: 22, textAlign: "center", textTransform: "uppercase" },
  performanceBody: { alignItems: "center", flexDirection: "row", gap: 24 },
  scoreRing: {
    alignItems: "center",
    borderRadius: 70,
    borderWidth: 10,
    height: 136,
    justifyContent: "center",
    width: 136,
  },
  scoreNumber: { fontSize: 38, fontWeight: "900" },
  scoreGrade: { fontSize: 14, fontWeight: "900", marginTop: 6 },
  performanceCopy: { flex: 1 },
  weightedTitle: { fontSize: 19, fontWeight: "900", marginBottom: 12 },
  weightedText: { fontSize: 15, fontWeight: "600", lineHeight: 32 },
  divider: { height: 1, marginVertical: 22 },
  aiBox: { borderRadius: 16, borderWidth: 1, marginBottom: 16, padding: 14 },
  aiTitle: { fontSize: 13, fontWeight: "900", marginBottom: 8, textTransform: "uppercase" },
  aiText: { fontSize: 14, lineHeight: 21 },
  actionsRow: { alignItems: "center", flexDirection: "row", gap: 14 },
  clearButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  clearButtonText: { fontSize: 15, fontWeight: "900" },
  aiButton: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  aiButtonText: { fontSize: 15, fontWeight: "900" },
  sectionLabel: { fontSize: 17, fontWeight: "900", letterSpacing: 3, marginBottom: 14, textTransform: "uppercase" },
  productList: { gap: 14 },
  productRow: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 96,
    padding: 14,
  },
  productImage: { borderRadius: 12, height: 58, width: 58 },
  productPlaceholder: { borderRadius: 12, height: 58, width: 58 },
  placeholderText: { fontSize: 10 },
  productCopy: { flex: 1, minWidth: 0 },
  productName: { fontSize: 17, fontWeight: "900" },
  productBrand: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  metaRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 9 },
  gradeBadge: { alignItems: "center", borderRadius: 7, height: 28, justifyContent: "center", width: 34 },
  gradeBadgeText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  metaText: { fontSize: 12, fontWeight: "900" },
  quantityControls: { alignItems: "center", flexDirection: "row", gap: 9 },
  iconButton: { alignItems: "center", justifyContent: "center" },
  quantityText: { fontSize: 17, fontWeight: "900", minWidth: 18, textAlign: "center" },
  deleteButton: { paddingLeft: 8 },
  emptyCard: { alignItems: "center", borderRadius: 20, borderWidth: 1, padding: 28 },
  emptyIcon: { alignItems: "center", borderRadius: 38, height: 76, justifyContent: "center", marginBottom: 18, width: 76 },
  emptyTitle: { fontSize: 21, fontWeight: "900", marginBottom: 10, textAlign: "center" },
  emptyText: { fontSize: 14, lineHeight: 21, textAlign: "center" },
});
