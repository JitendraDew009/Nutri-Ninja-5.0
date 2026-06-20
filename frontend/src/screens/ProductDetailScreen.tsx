import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { getHealthScore, getNutriScore, getHealthScoreColor, getNutriScoreColor, getHealthScoreLabel, getPersonalizedInsights } from "../utils/healthScore";
import { getWarnings, getNutritionInfo, getWarningColor } from "../utils/warnings";
import { getRecommendations, RecommendationItem, Recommendations } from "../utils/recommendations";
import { readStore, UserProfile } from "../utils/localStore";

interface ProductDetailsProps {
  product: any;
  onClose: () => void;
  searchProducts: (query: string) => Promise<any[]>;
  onAddToBasket?: (product: any) => void;
  onSelectProduct?: (barcode: string) => Promise<void>;
}

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
    loadRecommendations();
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [product]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const category = product.categories_en || product.categories || "";
      const products = await searchProducts(category);
      const recs = getRecommendations(product, products);
      setRecommendations(recs);
    } catch (error) {
      console.error("Error loading recommendations:", error);
      setRecommendations({ better: [], worse: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecommendation = async (item: RecommendationItem) => {
    if (!item.code) {
      alert("Unable to open product without a barcode.");
      return;
    }

    if (onSelectProduct) {
      await onSelectProduct(item.code);
    }
  };

  const healthScore = getHealthScore(product);
  const nutriScore = getNutriScore(product);
  const warnings = getWarnings(product);
  const nutritionInfo = getNutritionInfo(product);
  const profile = readStore<UserProfile | null>("userProfile", null);
  const personalizedInsights = getPersonalizedInsights(product, profile);

  const productImageUri =
    product.image_front_url ||
    product.image_url ||
    product.image ||
    product.image_small_url ||
    product.image_thumb_url ||
    product.image_front_small_url ||
    "";

  const ingredientText =
    product.ingredients_text ||
    product.ingredients_text_en ||
    product.ingredients_text_fr ||
    (Array.isArray(product.ingredients)
      ? product.ingredients
          .map((item: any) => item?.text || item)
          .filter(Boolean)
          .join(", ")
      : typeof product.ingredients === "string"
      ? product.ingredients
      : "");

  const scoreColor = getHealthScoreColor(healthScore);
  const nutriColor = getNutriScoreColor(nutriScore);
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.imageWrapper, isWide && styles.imageWrapperWide]}>
        {productImageUri ? (
          <Image source={{ uri: productImageUri }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.placeholderText}>No image available</Text>
          </View>
        )}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeBtn}>✕ Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.imageOverlay}>
          <Text style={styles.productNameOverlay} numberOfLines={2}>{product.product_name}</Text>
          {product.brands ? <Text style={styles.brandOverlay}>{product.brands}</Text> : null}
        </View>
      </View>

      <View style={[styles.detailContainer, isWide && styles.detailContainerWide]}>
        {onAddToBasket ? (
          <TouchableOpacity style={styles.basketButton} onPress={() => onAddToBasket(product)}>
            <Text style={styles.basketButtonText}>Add to Grocery Basket</Text>
          </TouchableOpacity>
        ) : null}

        <View style={[styles.scoreCard, isWide ? styles.scoreCardHorizontal : styles.scoreCardVertical]}>
          <View style={[styles.scoreCircle, { backgroundColor: scoreColor }]}> 
            <Text style={styles.scoreNumber}>{healthScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Health Score</Text>
            <Text style={[styles.scoreStatus, { color: scoreColor }]}>{getHealthScoreLabel(healthScore)}</Text>
          </View>
          <View style={[styles.nutriCard, { borderLeftColor: nutriColor }]}> 
            <Text style={styles.nutriLabel}>Nutri-Score</Text>
            <Text style={[styles.nutriGrade, { color: nutriColor }]}>{nutriScore}</Text>
          </View>
        </View>
      </View>

      {ingredientText ? (
        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>🧾 Ingredients</Text>
          <Text style={styles.ingredientsText}>{ingredientText}</Text>
        </View>
      ) : null}

      {/* Health Score Card */}
      <View style={styles.scoreCard}>
        <View style={[styles.scoreCircle, { backgroundColor: scoreColor }]}>
          <Text style={styles.scoreNumber}>{healthScore}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreLabel}>Health Score</Text>
          <Text style={[styles.scoreStatus, { color: scoreColor }]}>
            {getHealthScoreLabel(healthScore)}
          </Text>
        </View>

        {/* Nutri-Score */}
        <View style={[styles.nutriCard, { borderLeftColor: nutriColor }]}>
          <Text style={styles.nutriLabel}>Nutri-Score</Text>
          <Text style={[styles.nutriGrade, { color: nutriColor }]}>{nutriScore}</Text>
        </View>
      </View>

      {/* Warnings */}
      {warnings.length > 0 && (
        <View style={styles.warningsSection}>
          <Text style={styles.sectionTitle}>⚠️ Health Warnings</Text>
          {warnings.map((warning, index) => (
            <View
              key={index}
              style={[styles.warningItem, { borderLeftColor: getWarningColor(warning.severity) }]}
            >
              <Text style={styles.warningTitle}>{warning.title}</Text>
              <Text style={styles.warningMessage}>{warning.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Personalized Insights</Text>
        {personalizedInsights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>

      {/* Nutrition Facts */}
      {nutritionInfo.length > 0 && (
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>📊 Nutrition Per 100g</Text>
          <View style={styles.nutritionGrid}>
            {nutritionInfo.map((item, index) => (
              <View key={index} style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>{item.label}</Text>
                <Text style={styles.nutritionValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.recommendationSection}>
        <Text style={styles.sectionTitle}>🔍 Recommendations</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#76FF03" />
            <Text style={styles.loadingText}>Loading recommendations...</Text>
          </View>
        ) : recommendations.better.length === 0 && recommendations.worse.length === 0 ? (
          <Text style={styles.noRecommendationsText}>No alternative recommendations were found for this product.</Text>
        ) : null}

        {recommendations.better.length > 0 && (
          <View style={styles.recommendationBlock}>
            <Text style={styles.recommendationTitle}>Healthier Alternatives</Text>
            <FlatList
              data={recommendations.better}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendationList}
              renderItem={({ item }: { item: RecommendationItem }) => (
                <TouchableOpacity style={styles.recommendationCard} activeOpacity={0.85} onPress={() => handleSelectRecommendation(item)}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.recommendationImage} />
                  ) : null}
                  <View style={styles.recommendationBadge}>
                    <Text style={styles.recommendationScore}>{item.score}</Text>
                  </View>
                  <Text style={styles.recommendationName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.brand ? <Text style={styles.recommendationBrand}>{item.brand}</Text> : null}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {recommendations.worse.length > 0 && (
          <View style={styles.recommendationBlock}>
            <Text style={styles.recommendationTitle}>Less Healthy Alternatives</Text>
            <FlatList
              data={recommendations.worse}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendationList}
              renderItem={({ item }: { item: RecommendationItem }) => (
                <TouchableOpacity style={styles.recommendationCard} activeOpacity={0.85} onPress={() => handleSelectRecommendation(item)}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.recommendationImage} />
                  ) : null}
                  <View style={[styles.recommendationBadge, styles.recommendationBadgeWarning]}>
                    <Text style={styles.recommendationScore}>{item.score}</Text>
                  </View>
                  <Text style={styles.recommendationName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.brand ? <Text style={styles.recommendationBrand}>{item.brand}</Text> : null}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#76FF03" />
          <Text style={styles.loadingText}>Finding recommendations...</Text>
        </View>
      )}

      {/* Footer spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1419",
  },
  content: {
    paddingBottom: 24,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    minHeight: 240,
    backgroundColor: "#1a1f26",
  },
  imageWrapperWide: {
    minHeight: 340,
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productImagePlaceholder: {
    width: "100%",
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1f26",
  },
  placeholderText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  header: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 18,
    padding: 10,
  },
  closeBtn: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  imageOverlay: {
    position: "absolute",
    left: 20,
    bottom: 20,
    right: 20,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderRadius: 16,
  },
  productNameOverlay: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  brandOverlay: {
    color: "#d7e9ff",
    fontSize: 14,
  },
  detailContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  detailContainerWide: {
    paddingHorizontal: 28,
  },
  productInfo: {
    marginTop: 12,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    color: "#999",
  },
  basketButton: {
    backgroundColor: "#76FF03",
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    alignSelf: "flex-start",
    shadowColor: "#76FF03",
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  basketButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
  },
  scoreCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#121a22",
    marginBottom: 16,
    gap: 16,
    alignItems: "center",
  },
  scoreCardHorizontal: {
    flexDirection: "row",
  },
  scoreCardVertical: {
    flexDirection: "column",
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  scoreMax: {
    fontSize: 12,
    color: "#fff",
    marginTop: 2,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  scoreStatus: {
    fontSize: 16,
    fontWeight: "bold",
  },
  nutriCard: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    justifyContent: "center",
  },
  nutriLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  nutriGrade: {
    fontSize: 24,
    fontWeight: "900",
  },
  warningsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1f26",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  warningItem: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 12,
    backgroundColor: "#121a22",
    padding: 14,
    borderRadius: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  warningMessage: {
    fontSize: 12,
    color: "#ccc",
    lineHeight: 16,
  },
  insightsSection: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#121a22",
    marginBottom: 16,
  },
  insightItem: {
    backgroundColor: "#172033",
    borderLeftColor: "#38bdf8",
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
  },
  insightText: {
    color: "#d7e9ff",
    fontSize: 12,
    lineHeight: 17,
  },
  nutritionSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1f26",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nutritionItem: {
    width: "48%",
    backgroundColor: "#121a22",
    padding: 12,
    borderRadius: 12,
    minWidth: 140,
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#76FF03",
  },
  ingredientsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1f26",
    backgroundColor: "#0f1419",
  },
  ingredientsText: {
    color: "#d7e9ff",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  recommendationSection: {
    padding: 16,
    backgroundColor: "#121a22",
    borderRadius: 20,
    marginBottom: 16,
  },
  recommendationBlock: {
    marginTop: 12,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  recommendationList: {
    paddingLeft: 2,
  },
  recommendationCard: {
    marginRight: 12,
    width: 140,
    borderRadius: 18,
    backgroundColor: "#0f1720",
    padding: 12,
    minHeight: 220,
  },
  recommendationImage: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    backgroundColor: "#1a1f26",
    marginBottom: 10,
  },
  recommendationBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#76FF03",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendationBadgeWarning: {
    backgroundColor: "#f97316",
  },
  recommendationScore: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
  },
  recommendationName: {
    fontSize: 14,
    color: "#fff",
    textAlign: "left",
    fontWeight: "700",
    marginBottom: 4,
  },
  recommendationBrand: {
    fontSize: 12,
    color: "#a3b3c1",
  },
  noRecommendationsText: {
    color: "#a3b3c1",
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    marginTop: 12,
    fontSize: 14,
  },
});
