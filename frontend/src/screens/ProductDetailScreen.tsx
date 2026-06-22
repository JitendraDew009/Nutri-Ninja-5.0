import React, { useEffect, useRef, useState } from "react";
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

import DietAdvisorChat from "../components/diet-advisor-chat";
import ProductImage from "../components/product-image";
import {
  getHealthScore,
  getHealthScoreColor,
  getHealthScoreLabel,
  getNutriScore,
  getNutriScoreColor,
  getPersonalizedInsights,
  nutriGradeBarColors,
} from "../utils/healthScore";
import { getActiveProfile } from "../utils/localStore";
import { getRecommendations, RecommendationItem, Recommendations } from "../utils/recommendations";
import { getWarningColor, getWarnings } from "../utils/warnings";
import { useThemeMode } from "../utils/themeMode";

interface ProductDetailsProps {
  product: any;
  onClose: () => void;
  searchProducts: (query: string) => Promise<any[]>;
  onAddToBasket?: (product: any) => void;
  onSelectProduct?: (barcode: string) => Promise<void>;
}

const grades = ["A", "B", "C", "D", "E"];

export default function ProductDetailScreen({
  product,
  onClose,
  searchProducts,
  onAddToBasket,
  onSelectProduct,
}: ProductDetailsProps) {
  const { palette } = useThemeMode();
  const scrollRef = useRef<ScrollView | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations>({ better: [], worse: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const category = product.categories_en || product.categories || product.product_name || "";
        const candidates = await searchProducts(category);
        setRecommendations(getRecommendations(product, candidates));
      } catch {
        setRecommendations({ better: [], worse: [] });
      } finally {
        setLoading(false);
      }
    };
    load();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [product, searchProducts]);

  const healthScore = getHealthScore(product);
  const nutriScore = getNutriScore(product);
  const scoreColor = getHealthScoreColor(healthScore);
  const profile = getActiveProfile();
  const warnings = getWarnings(product);
  const insights = getPersonalizedInsights(product, profile);
  const n = product.nutriments || {};

  const ingredientText =
    product.ingredients_text ||
    product.ingredients_text_en ||
    (Array.isArray(product.ingredients)
      ? product.ingredients.map((item: any) => item?.text || item).filter(Boolean).join(", ")
      : "");

  const nutrition = [
    { label: "Calories (Energy)", value: Number(n.energy_100g || 0), unit: "kcal", max: 600, color: "#22b8ad" },
    { label: "Sugars", value: Number(n.sugars_100g || 0), unit: "g", max: 50, color: "#f59e0b" },
    { label: "Saturated Fat", value: Number(n["saturated-fat_100g"] || 0), unit: "g", max: 20, color: palette.danger },
    { label: "Proteins", value: Number(n.proteins_100g || 0), unit: "g", max: 25, color: palette.accentBright },
    { label: "Dietary Fiber", value: Number(n.fiber_100g || 0), unit: "g", max: 15, color: "#22b8ad" },
    { label: "Sodium Salt Equivalent", value: Number(n.salt_100g || 0), unit: "g", max: 3, color: "#f59e0b" },
  ];

  const openRecommendation = async (item: RecommendationItem) => {
    if (item.code && onSelectProduct) await onSelectProduct(item.code);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <SymbolView
              name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
              tintColor={palette.accentBright}
              size={27}
            />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: palette.text }]}>Food Health Analysis</Text>
        </View>

        <View style={[styles.productCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <ProductImage
            product={product}
            style={[styles.productImage, { backgroundColor: palette.surfaceSoft }]}
            placeholderStyle={[styles.productImagePlaceholder, { backgroundColor: palette.surfaceSoft }]}
            placeholderTextStyle={[styles.placeholderText, { color: palette.muted }]}
            placeholderText="No image"
          />
          <View style={styles.productCopy}>
            <Text style={[styles.productName, { color: palette.text }]} numberOfLines={2}>
              {product.product_name || "Unknown product"}
            </Text>
            <Text style={[styles.productMeta, { color: palette.muted }]}>Brand: {product.brands || "Unknown"}</Text>
            <Text style={[styles.productMeta, { color: palette.muted }]}>Barcode: {product.code || "Unavailable"}</Text>
          </View>
        </View>

        {onAddToBasket ? (
          <TouchableOpacity
            style={[styles.basketButton, { backgroundColor: palette.accentBright }]}
            onPress={() => onAddToBasket(product)}
          >
            <SymbolView
              name={{ ios: "cart.badge.plus", android: "add_shopping_cart", web: "add_shopping_cart" }}
              tintColor={palette.onAccent}
              size={26}
            />
            <Text style={[styles.basketButtonText, { color: palette.onAccent }]}>Add to Grocery Basket</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.scoreGrid}>
          <View style={[styles.scorePanel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.panelEyebrow, { color: palette.muted }]}>Ninja Health Score</Text>
            <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreNumber, { color: palette.text }]}>{healthScore}</Text>
              <Text style={[styles.scoreUnit, { color: palette.muted }]}>pts</Text>
            </View>
            <Text style={[styles.scoreStatus, { color: scoreColor }]}>{getHealthScoreLabel(healthScore)} Quality</Text>
          </View>

          <View style={[styles.scorePanel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.panelEyebrow, { color: palette.muted }]}>Official Nutri-Score</Text>
            <View style={styles.gradeRow}>
              {grades.map((grade) => (
                <View
                  key={grade}
                  style={[
                    styles.gradeBox,
                    { backgroundColor: nutriGradeBarColors[grade], opacity: grade === nutriScore ? 1 : 0.28 },
                    grade === nutriScore && styles.gradeSelected,
                  ]}
                >
                  <Text style={styles.gradeLetter}>{grade}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.gradeLabel, { color: getNutriScoreColor(nutriScore) }]}>Grade {nutriScore}</Text>
          </View>
        </View>

        <DietAdvisorChat
          product={product}
          ingredientText={ingredientText}
          healthScore={healthScore}
          nutriScore={nutriScore}
        />

        {ingredientText ? (
          <Section title="Ingredients" icon="nutrition" palette={palette}>
            <Text style={[styles.bodyText, { color: palette.muted }]}>{ingredientText}</Text>
          </Section>
        ) : null}

        <Section title="Nutritional Alerts & Goal Warnings" icon="warning" palette={palette}>
          {warnings.map((warning, index) => (
            <View key={`${warning.title}-${index}`} style={[styles.alertRow, { borderColor: palette.border }]}>
              <SymbolView
                name={{
                  ios: warning.severity === "low" ? "checkmark.circle.fill" : "exclamationmark.triangle.fill",
                  android: warning.severity === "low" ? "check_circle" : "warning",
                  web: warning.severity === "low" ? "check_circle" : "warning",
                }}
                tintColor={warning.severity === "low" ? palette.accentBright : getWarningColor(warning.severity)}
                size={23}
              />
              <View style={styles.alertCopy}>
                <Text style={[styles.alertTitle, { color: palette.text }]}>{warning.title}</Text>
                <Text style={[styles.alertMessage, { color: palette.muted }]}>{warning.message}</Text>
              </View>
            </View>
          ))}
          {insights.map((insight, index) => (
            <View
              key={`insight-${index}`}
              style={[styles.alertRow, styles.insightRow, { borderColor: palette.border, backgroundColor: palette.surfaceSoft }]}
            >
              <SymbolView
                name={{ ios: "lightbulb.fill", android: "lightbulb", web: "lightbulb" }}
                tintColor={palette.accentBright}
                size={23}
              />
              <Text style={[styles.insightText, { color: palette.text }]}>{insight}</Text>
            </View>
          ))}
        </Section>

        <Section title="Nutritional Content (Per 100g)" icon="monitoring" palette={palette}>
          {nutrition.map((item) => {
            const progress = Math.max(0, Math.min(100, (item.value / item.max) * 100));
            return (
              <View key={item.label} style={styles.nutritionRow}>
                <View style={styles.nutritionHeader}>
                  <Text style={[styles.nutritionLabel, { color: palette.text }]}>{item.label}</Text>
                  <Text style={[styles.nutritionValue, { color: palette.muted }]}>
                    {item.value.toFixed(item.unit === "kcal" ? 0 : 1)} {item.unit}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: palette.surfaceSoft }]}>
                  <View style={[styles.progressFill, { backgroundColor: item.color, width: `${progress}%` }]} />
                </View>
              </View>
            );
          })}
        </Section>

        <Section title="Better Healthier Alternatives" icon="recommend" palette={palette}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={palette.accentBright} />
              <Text style={[styles.mutedText, { color: palette.muted }]}>Finding alternatives...</Text>
            </View>
          ) : recommendations.better.length ? (
            recommendations.better.map((item, index) => (
              <RecommendationRow
                key={`better-${item.code || index}`}
                item={item}
                palette={palette}
                onPress={() => openRecommendation(item)}
              />
            ))
          ) : (
            <Text style={[styles.mutedText, { color: palette.muted }]}>No healthier alternatives found for this product.</Text>
          )}
        </Section>

        {recommendations.worse.length ? (
          <Section title="Similar Foods to Limit" icon="block" palette={palette}>
            {recommendations.worse.map((item, index) => (
              <RecommendationRow
                key={`worse-${item.code || index}`}
                item={item}
                palette={palette}
                onPress={() => openRecommendation(item)}
              />
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  children,
  palette,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  palette: ReturnType<typeof useThemeMode>["palette"];
}) {
  return (
    <View style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.sectionHeader}>
        <SymbolView
          name={{ ios: "circle.fill", android: icon, web: icon }}
          tintColor={palette.accentBright}
          size={22}
        />
        <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function RecommendationRow({
  item,
  onPress,
  palette,
}: {
  item: RecommendationItem;
  onPress: () => void;
  palette: ReturnType<typeof useThemeMode>["palette"];
}) {
  const displayGrade =
    item.score >= 80 ? "A" : item.score >= 60 ? "B" : item.score >= 40 ? "C" : item.score >= 20 ? "D" : "E";
  return (
    <TouchableOpacity
      style={[styles.recommendationRow, { backgroundColor: palette.surfaceInset }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <ProductImage
        urls={[item.image]}
        style={[styles.recommendationImage, { backgroundColor: palette.surfaceSoft }]}
        placeholderStyle={[styles.recommendationPlaceholder, { backgroundColor: palette.surfaceSoft }]}
      />
      <View style={styles.recommendationCopy}>
        <Text style={[styles.recommendationName, { color: palette.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.recommendationMeta, { color: palette.muted }]} numberOfLines={1}>
          {item.brand || "Unknown brand"} · Score {item.score}
        </Text>
      </View>
      <View style={[styles.recommendationGrade, { backgroundColor: nutriGradeBarColors[displayGrade] }]}>
        <Text style={styles.recommendationGradeText}>{displayGrade}</Text>
      </View>
      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
        tintColor={palette.muted}
        size={20}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 42 },
  topBar: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 22, marginTop: 4 },
  backButton: { alignItems: "center", height: 42, justifyContent: "center", width: 42 },
  pageTitle: { fontSize: 24, fontWeight: "900", letterSpacing: 0.2 },
  productCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 18,
    padding: 18,
  },
  productImage: { borderRadius: 14, height: 128, width: 128 },
  productImagePlaceholder: { alignItems: "center", borderRadius: 14, height: 128, justifyContent: "center", width: 128 },
  placeholderText: { fontSize: 12 },
  productCopy: { flex: 1 },
  productName: { fontSize: 23, fontWeight: "900", marginBottom: 12 },
  productMeta: { fontSize: 14, lineHeight: 24 },
  basketButton: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginVertical: 18,
    paddingVertical: 17,
  },
  basketButtonText: { fontSize: 17, fontWeight: "900" },
  scoreGrid: { flexDirection: "row", gap: 12, marginBottom: 18 },
  scorePanel: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    minHeight: 220,
    padding: 18,
  },
  panelEyebrow: { fontSize: 13, fontWeight: "800", marginBottom: 18 },
  scoreRing: { alignItems: "center", borderRadius: 60, borderWidth: 9, height: 120, justifyContent: "center", width: 120 },
  scoreNumber: { fontSize: 36, fontWeight: "900" },
  scoreUnit: { fontSize: 12 },
  scoreStatus: { fontSize: 15, fontWeight: "900", marginTop: 14 },
  gradeRow: { flexDirection: "row", gap: 4, marginTop: 20 },
  gradeBox: { alignItems: "center", borderRadius: 8, height: 58, justifyContent: "center", width: 34 },
  gradeSelected: { borderColor: "#fff", borderWidth: 3, transform: [{ scale: 1.12 }] },
  gradeLetter: { color: "#fff", fontSize: 18, fontWeight: "900" },
  gradeLabel: { fontSize: 19, fontWeight: "900", marginTop: 24 },
  section: { borderRadius: 20, borderWidth: 1, marginBottom: 18, padding: 18 },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 16 },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: "900" },
  bodyText: { fontSize: 14, lineHeight: 22 },
  alertRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 14,
  },
  alertCopy: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: "800" },
  alertMessage: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  insightRow: {},
  insightText: { flex: 1, fontSize: 13, lineHeight: 19 },
  nutritionRow: { marginBottom: 16 },
  nutritionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  nutritionLabel: { fontSize: 14, fontWeight: "700" },
  nutritionValue: { fontSize: 14, fontWeight: "700" },
  progressTrack: { borderRadius: 99, height: 8, overflow: "hidden" },
  progressFill: { borderRadius: 99, height: 8 },
  loadingRow: { alignItems: "center", flexDirection: "row", gap: 10, paddingVertical: 8 },
  mutedText: { fontSize: 13, lineHeight: 19 },
  recommendationRow: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 12,
  },
  recommendationImage: { borderRadius: 12, height: 62, width: 62 },
  recommendationPlaceholder: { borderRadius: 12, height: 62, width: 62 },
  recommendationCopy: { flex: 1 },
  recommendationName: { fontSize: 14, fontWeight: "900" },
  recommendationMeta: { fontSize: 11, marginTop: 5 },
  recommendationGrade: { alignItems: "center", borderRadius: 8, height: 44, justifyContent: "center", width: 40 },
  recommendationGradeText: { color: "#fff", fontSize: 18, fontWeight: "900" },
});
