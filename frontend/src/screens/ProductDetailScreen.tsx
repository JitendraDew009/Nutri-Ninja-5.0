import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { getHealthScore, getNutriScore, getHealthScoreColor, getNutriScoreColor, getHealthScoreLabel, getPersonalizedInsights } from "../utils/healthScore";
import { getWarnings, getNutritionInfo, getWarningColor } from "../utils/warnings";
import { getRecommendations } from "../utils/recommendations";
import { readStore, UserProfile } from "../utils/localStore";

interface ProductDetailsProps {
  product: any;
  onClose: () => void;
  searchProducts: (query: string) => Promise<any[]>;
  onAddToBasket?: (product: any) => void;
}

interface RecommendationItem {
  name: string;
  score: number;
  image: string;
}

export default function ProductDetailScreen({
  product,
  onClose,
  searchProducts,
  onAddToBasket,
}: ProductDetailsProps) {
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecommendations();
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with close button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>✕ Close</Text>
        </TouchableOpacity>
      </View>

      {/* Product Image */}
      {productImageUri ? (
        <Image source={{ uri: productImageUri }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Text style={styles.placeholderText}>No image available</Text>
        </View>
      )}

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.product_name}</Text>
        {product.brands && <Text style={styles.brand}>{product.brands}</Text>}
        {onAddToBasket && (
          <TouchableOpacity style={styles.basketButton} onPress={() => onAddToBasket(product)}>
            <Text style={styles.basketButtonText}>Add to Grocery Basket</Text>
          </TouchableOpacity>
        )}
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

      {/* Better Alternatives */}
      {recommendations && recommendations.better.length > 0 && (
        <View style={styles.recommendationSection}>
          <Text style={styles.sectionTitle}>💚 Healthier Alternatives</Text>
          <FlatList
            data={recommendations.better}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            renderItem={({ item }: { item: RecommendationItem }) => (
              <View style={styles.recommendationCard}>
                {item.image && (
                  <Image source={{ uri: item.image }} style={styles.recommendationImage} />
                )}
                <View style={styles.recommendationBadge}>
                  <Text style={styles.recommendationScore}>{item.score}</Text>
                </View>
                <Text style={styles.recommendationName} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Worse Alternatives */}
      {recommendations && recommendations.worse.length > 0 && (
        <View style={styles.recommendationSection}>
          <Text style={styles.sectionTitle}>⚠️ Less Healthy Alternatives</Text>
          <FlatList
            data={recommendations.worse}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            renderItem={({ item }: { item: RecommendationItem }) => (
              <View style={styles.recommendationCard}>
                {item.image && (
                  <Image source={{ uri: item.image }} style={styles.recommendationImage} />
                )}
                <View style={styles.recommendationBadge}>
                  <Text style={styles.recommendationScore}>{item.score}</Text>
                </View>
                <Text style={styles.recommendationName} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
            )}
          />
        </View>
      )}

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
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  closeBtn: {
    color: "#76FF03",
    fontSize: 16,
    fontWeight: "600",
  },
  productImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#1a1f26",
  },
  productImagePlaceholder: {
    width: "100%",
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1f26",
  },
  placeholderText: {
    color: "#999",
    fontSize: 14,
  },
  productInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1f26",
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
    borderRadius: 8,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  basketButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  scoreCard: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
    alignItems: "center",
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
    fontSize: 20,
    fontWeight: "bold",
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
    backgroundColor: "#1a1f26",
    padding: 12,
    borderRadius: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 12,
    color: "#ccc",
    lineHeight: 16,
  },
  insightsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1f26",
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
    backgroundColor: "#1a1f26",
    padding: 12,
    borderRadius: 8,
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
    borderBottomWidth: 1,
    borderBottomColor: "#1a1f26",
  },
  recommendationCard: {
    marginRight: 12,
    alignItems: "center",
    width: 120,
  },
  recommendationImage: {
    width: 120,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#1a1f26",
    marginBottom: 8,
  },
  recommendationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#76FF03",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendationScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  recommendationName: {
    fontSize: 12,
    color: "#ccc",
    textAlign: "center",
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
