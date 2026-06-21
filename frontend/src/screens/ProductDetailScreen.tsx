import React, { useEffect, useRef, useState } from "react";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ProductImage from "../components/product-image";
import {
  getHealthScore,
  getHealthScoreColor,
  getHealthScoreLabel,
  getNutriScore,
  getNutriScoreColor,
  getPersonalizedInsights,
} from "../utils/healthScore";
import { getActiveProfile } from "../utils/localStore";
import { getRecommendations, RecommendationItem, Recommendations } from "../utils/recommendations";
import { getWarningColor, getWarnings } from "../utils/warnings";

interface ProductDetailsProps {
  product: any;
  onClose: () => void;
  searchProducts: (query: string) => Promise<any[]>;
  onAddToBasket?: (product: any) => void;
  onSelectProduct?: (barcode: string) => Promise<void>;
}

const grades = ["A", "B", "C", "D", "E"];
const gradeColors: Record<string, string> = {
  A: "#16b88b",
  B: "#7ac70c",
  C: "#d3a72c",
  D: "#e8732f",
  E: "#ef4650",
};

export default function ProductDetailScreen({
  product,
  onClose,
  searchProducts,
  onAddToBasket,
  onSelectProduct,
}: ProductDetailsProps) {
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
    { label: "Saturated Fat", value: Number(n["saturated-fat_100g"] || 0), unit: "g", max: 20, color: "#ef4650" },
    { label: "Proteins", value: Number(n.proteins_100g || 0), unit: "g", max: 25, color: "#49d983" },
    { label: "Dietary Fiber", value: Number(n.fiber_100g || 0), unit: "g", max: 15, color: "#22b8ad" },
    { label: "Sodium Salt Equivalent", value: Number(n.salt_100g || 0), unit: "g", max: 3, color: "#f59e0b" },
  ];

  const openRecommendation = async (item: RecommendationItem) => {
    if (item.code && onSelectProduct) await onSelectProduct(item.code);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} tintColor="#49df88" size={27} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Food Health Analysis</Text>
      </View>

      <View style={styles.productCard}>
        <ProductImage
          product={product}
          style={styles.productImage}
          placeholderStyle={styles.productImagePlaceholder}
          placeholderTextStyle={styles.placeholderText}
          placeholderText="No image"
        />
        <View style={styles.productCopy}>
          <Text style={styles.productName} numberOfLines={2}>{product.product_name || "Unknown product"}</Text>
          <Text style={styles.productMeta}>Brand: {product.brands || "Unknown"}</Text>
          <Text style={styles.productMeta}>Barcode: {product.code || "Unavailable"}</Text>
        </View>
      </View>

      {onAddToBasket ? (
        <TouchableOpacity style={styles.basketButton} onPress={() => onAddToBasket(product)}>
          <SymbolView name={{ ios: "cart.badge.plus", android: "add_shopping_cart", web: "add_shopping_cart" }} tintColor="#06120c" size={26} />
          <Text style={styles.basketButtonText}>Add to Grocery Basket</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.scoreGrid}>
        <View style={styles.scorePanel}>
          <Text style={styles.panelEyebrow}>Ninja Health Score</Text>
          <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
            <Text style={styles.scoreNumber}>{healthScore}</Text>
            <Text style={styles.scoreUnit}>pts</Text>
          </View>
          <Text style={[styles.scoreStatus, { color: scoreColor }]}>{getHealthScoreLabel(healthScore)} Quality</Text>
        </View>

        <View style={styles.scorePanel}>
          <Text style={styles.panelEyebrow}>Official Nutri-Score</Text>
          <View style={styles.gradeRow}>
            {grades.map((grade) => (
              <View
                key={grade}
                style={[
                  styles.gradeBox,
                  { backgroundColor: gradeColors[grade], opacity: grade === nutriScore ? 1 : 0.28 },
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

      {ingredientText ? (
        <Section title="Ingredients" icon="nutrition">
          <Text style={styles.bodyText}>{ingredientText}</Text>
        </Section>
      ) : null}

      <Section title="Nutritional Alerts & Goal Warnings" icon="warning">
        {warnings.map((warning, index) => (
          <View key={`${warning.title}-${index}`} style={styles.alertRow}>
            <SymbolView
              name={{
                ios: warning.severity === "low" ? "checkmark.circle.fill" : "exclamationmark.triangle.fill",
                android: warning.severity === "low" ? "check_circle" : "warning",
                web: warning.severity === "low" ? "check_circle" : "warning",
              }}
              tintColor={warning.severity === "low" ? "#49df88" : getWarningColor(warning.severity)}
              size={23}
            />
            <View style={styles.alertCopy}>
              <Text style={styles.alertTitle}>{warning.title}</Text>
              <Text style={styles.alertMessage}>{warning.message}</Text>
            </View>
          </View>
        ))}
        {insights.map((insight, index) => (
          <View key={`insight-${index}`} style={[styles.alertRow, styles.insightRow]}>
            <SymbolView name={{ ios: "lightbulb.fill", android: "lightbulb", web: "lightbulb" }} tintColor="#49df88" size={23} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </Section>

      <Section title="Nutritional Content (Per 100g)" icon="monitoring">
        {nutrition.map((item) => {
          const progress = Math.max(0, Math.min(100, (item.value / item.max) * 100));
          return (
            <View key={item.label} style={styles.nutritionRow}>
              <View style={styles.nutritionHeader}>
                <Text style={styles.nutritionLabel}>{item.label}</Text>
                <Text style={styles.nutritionValue}>{item.value.toFixed(item.unit === "kcal" ? 0 : 1)} {item.unit}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { backgroundColor: item.color, width: `${progress}%` }]} />
              </View>
            </View>
          );
        })}
      </Section>

      <Section title="Better Healthier Alternatives" icon="recommend">
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#49df88" />
            <Text style={styles.mutedText}>Finding alternatives...</Text>
          </View>
        ) : recommendations.better.length ? (
          recommendations.better.map((item, index) => (
            <RecommendationRow key={`better-${item.code || index}`} item={item} onPress={() => openRecommendation(item)} />
          ))
        ) : (
          <Text style={styles.mutedText}>No healthier alternatives found for this product.</Text>
        )}
      </Section>

      {recommendations.worse.length ? (
        <Section title="Similar Foods to Limit" icon="block">
          {recommendations.worse.map((item, index) => (
            <RecommendationRow key={`worse-${item.code || index}`} item={item} onPress={() => openRecommendation(item)} />
          ))}
        </Section>
      ) : null}
    </ScrollView>
  );
}

function Section({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SymbolView name={{ ios: "circle.fill", android: icon, web: icon }} tintColor="#49df88" size={22} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function RecommendationRow({ item, onPress }: { item: RecommendationItem; onPress: () => void }) {
  const displayGrade = item.score >= 80 ? "A" : item.score >= 60 ? "B" : item.score >= 40 ? "C" : item.score >= 20 ? "D" : "E";
  return (
    <TouchableOpacity style={styles.recommendationRow} onPress={onPress} activeOpacity={0.75}>
      <ProductImage urls={[item.image]} style={styles.recommendationImage} placeholderStyle={styles.recommendationPlaceholder} />
      <View style={styles.recommendationCopy}>
        <Text style={styles.recommendationName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.recommendationMeta} numberOfLines={1}>{item.brand || "Unknown brand"} · Score {item.score}</Text>
      </View>
      <View style={[styles.recommendationGrade, { backgroundColor: gradeColors[displayGrade] }]}>
        <Text style={styles.recommendationGradeText}>{displayGrade}</Text>
      </View>
      <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} tintColor="#8994ad" size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050817" },
  content: { padding: 18, paddingBottom: 42 },
  topBar: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 22, marginTop: 4 },
  backButton: { alignItems: "center", height: 42, justifyContent: "center", width: 42 },
  pageTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", letterSpacing: 0.2 },
  productCard: { alignItems: "center", backgroundColor: "#10172f", borderRadius: 22, flexDirection: "row", gap: 18, padding: 18 },
  productImage: { backgroundColor: "#202b52", borderRadius: 16, height: 128, width: 128 },
  productImagePlaceholder: { alignItems: "center", backgroundColor: "#202b52", borderRadius: 16, height: 128, justifyContent: "center", width: 128 },
  placeholderText: { color: "#8490aa", fontSize: 12 },
  productCopy: { flex: 1 },
  productName: { color: "#fff", fontSize: 23, fontWeight: "900", marginBottom: 12 },
  productMeta: { color: "#9ca7be", fontSize: 14, lineHeight: 24 },
  basketButton: { alignItems: "center", backgroundColor: "#49df88", borderRadius: 18, flexDirection: "row", gap: 12, justifyContent: "center", marginVertical: 18, paddingVertical: 17 },
  basketButtonText: { color: "#06120c", fontSize: 17, fontWeight: "900" },
  scoreGrid: { flexDirection: "row", gap: 12, marginBottom: 18 },
  scorePanel: { alignItems: "center", backgroundColor: "#10172f", borderColor: "#27345d", borderRadius: 20, borderWidth: 1, flex: 1, minHeight: 220, padding: 18 },
  panelEyebrow: { color: "#9ca7be", fontSize: 13, fontWeight: "800", marginBottom: 18 },
  scoreRing: { alignItems: "center", borderRadius: 60, borderWidth: 9, height: 120, justifyContent: "center", width: 120 },
  scoreNumber: { color: "#fff", fontSize: 36, fontWeight: "900" },
  scoreUnit: { color: "#9ca7be", fontSize: 12 },
  scoreStatus: { fontSize: 15, fontWeight: "900", marginTop: 14 },
  gradeRow: { flexDirection: "row", gap: 4, marginTop: 20 },
  gradeBox: { alignItems: "center", borderRadius: 6, height: 58, justifyContent: "center", width: 34 },
  gradeSelected: { borderColor: "#fff", borderWidth: 3, transform: [{ scale: 1.12 }] },
  gradeLetter: { color: "#fff", fontSize: 18, fontWeight: "900" },
  gradeLabel: { fontSize: 19, fontWeight: "900", marginTop: 24 },
  section: { backgroundColor: "#10172f", borderRadius: 22, marginBottom: 18, padding: 18 },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 16 },
  sectionTitle: { color: "#f8fafc", flex: 1, fontSize: 18, fontWeight: "900" },
  bodyText: { color: "#c8d0df", fontSize: 14, lineHeight: 22 },
  alertRow: { alignItems: "center", borderColor: "#354267", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 12, marginBottom: 10, padding: 14 },
  alertCopy: { flex: 1 },
  alertTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "800" },
  alertMessage: { color: "#9ca7be", fontSize: 12, lineHeight: 17, marginTop: 3 },
  insightRow: { backgroundColor: "#202c53" },
  insightText: { color: "#e1e7f1", flex: 1, fontSize: 13, lineHeight: 19 },
  nutritionRow: { marginBottom: 16 },
  nutritionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  nutritionLabel: { color: "#f8fafc", fontSize: 14, fontWeight: "700" },
  nutritionValue: { color: "#aab4c8", fontSize: 14, fontWeight: "700" },
  progressTrack: { backgroundColor: "#202a43", borderRadius: 99, height: 8, overflow: "hidden" },
  progressFill: { borderRadius: 99, height: 8 },
  loadingRow: { alignItems: "center", flexDirection: "row", gap: 10, paddingVertical: 8 },
  mutedText: { color: "#919cb2", fontSize: 13, lineHeight: 19 },
  recommendationRow: { alignItems: "center", backgroundColor: "#0b1127", borderRadius: 16, flexDirection: "row", gap: 12, marginBottom: 10, padding: 12 },
  recommendationImage: { backgroundColor: "#202b52", borderRadius: 12, height: 62, width: 62 },
  recommendationPlaceholder: { backgroundColor: "#202b52", borderRadius: 12, height: 62, width: 62 },
  recommendationCopy: { flex: 1 },
  recommendationName: { color: "#fff", fontSize: 14, fontWeight: "900" },
  recommendationMeta: { color: "#909bb1", fontSize: 11, marginTop: 5 },
  recommendationGrade: { alignItems: "center", borderRadius: 8, height: 44, justifyContent: "center", width: 40 },
  recommendationGradeText: { color: "#fff", fontSize: 18, fontWeight: "900" },
});
