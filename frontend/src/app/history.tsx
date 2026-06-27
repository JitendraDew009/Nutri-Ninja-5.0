import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ProductDetailScreen from "../screens/ProductDetailScreen";
import { fetchProduct, searchProducts } from "../services/api";
import { getHealthScore, getHealthScoreColor } from "../utils/healthScore";
import {
  UserProfile,
  addNativeListener,
  getActiveProfile,
  canUseBrowserEvents,
  getFamilyProfiles,
  productSummary,
  profileStoreKey,
  readStore,
  saveFamilyProfiles,
  writeStore,
} from "../utils/localStore";
import { useThemeMode } from "../utils/themeMode";

export default function HistoryScreen() {
  const { palette } = useThemeMode();
  const [activeProfile, setActiveProfile] = useState<UserProfile>(getActiveProfile);
  const [profiles, setProfiles] = useState<UserProfile[]>(getFamilyProfiles);
  const [history, setHistory] = useState<any[]>(() => readStore(profileStoreKey("scanHistory", activeProfile.id), []));
  const [basket, setBasket] = useState<any[]>(() => readStore(profileStoreKey("groceryBasket", activeProfile.id), []));

  // Always refresh when this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      const profile = getActiveProfile();
      setProfiles(getFamilyProfiles());
      setActiveProfile(profile);
      setHistory(readStore(profileStoreKey("scanHistory", profile.id), []));
      setBasket(readStore(profileStoreKey("groceryBasket", profile.id), []));
    }, [])
  );
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [openingProduct, setOpeningProduct] = useState(false);

  useEffect(() => {
    const refreshProfile = () => {
      const profile = getActiveProfile();
      setProfiles(getFamilyProfiles());
      setActiveProfile(profile);
      setHistory(readStore(profileStoreKey("scanHistory", profile.id), []));
      setBasket(readStore(profileStoreKey("groceryBasket", profile.id), []));
      setSelectedProduct(null);
    };

    refreshProfile();
    if (canUseBrowserEvents()) {
      window.addEventListener("nutri-profile-changed", refreshProfile);
      return () => window.removeEventListener("nutri-profile-changed", refreshProfile);
    }
    return addNativeListener("nutri-profile-changed", refreshProfile);
  }, []);

  const totalScans = history.length;
  const averageScore = useMemo(() => {
    if (!history.length) return 0;
    const total = history.reduce((sum, item) => sum + getHealthScore(item), 0);
    return Math.round(total / history.length);
  }, [history]);

  const clearHistory = () => {
    setHistory([]);
    writeStore(profileStoreKey("scanHistory", activeProfile.id), []);
  };

  const switchProfile = (profile: UserProfile) => {
    saveFamilyProfiles(profiles, profile.id);
    setActiveProfile(profile);
    setHistory(readStore(profileStoreKey("scanHistory", profile.id), []));
    setBasket(readStore(profileStoreKey("groceryBasket", profile.id), []));
  };

  const goalLabel = activeProfile.goal.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  const handleAddToBasket = (product: any) => {
    const summary = productSummary(product);
    const nextBasket = [summary, ...basket.filter((item) => (item.code || item.product_name) !== summary.code)].slice(0, 30);
    setBasket(nextBasket);
    writeStore(profileStoreKey("groceryBasket", activeProfile.id), nextBasket);
    alert("Added to Grocery Basket");
  };

  const removeScan = (id: string) => {
    const nextHistory = history.filter((item) => (item.code || item.product_name) !== id);
    setHistory(nextHistory);
    writeStore(profileStoreKey("scanHistory", activeProfile.id), nextHistory);
  };

  const openProduct = async (product: any) => {
    if (!product.code) {
      alert("This product cannot be opened because its barcode is unavailable.");
      return;
    }

    setOpeningProduct(true);
    try {
      const response = await fetchProduct(product.code);
      if (response?.product?.product_name) {
        setSelectedProduct(response.product);
      } else {
        alert("Product details are unavailable.");
      }
    } catch {
      alert("Unable to open this product. Check your internet connection.");
    } finally {
      setOpeningProduct(false);
    }
  };

  if (selectedProduct) {
    return (
      <ProductDetailScreen
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        searchProducts={searchProducts}
        onAddToBasket={handleAddToBasket}
        onSelectProduct={async (barcode) => {
          const response = await fetchProduct(barcode);
          if (response?.product) setSelectedProduct(response.product);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, { color: palette.text }]}>Welcome, {activeProfile.name}</Text>
            <Text style={[styles.heroGoal, { color: palette.accentBright }]}>Goal: {goalLabel}</Text>
            <Text style={[styles.heroQuote, { color: palette.muted }]}>Every scan helps build a clearer picture of this profile's food choices.</Text>
          </View>
          <View style={[styles.heroIcon, { backgroundColor: palette.surfaceSoft }]}>
            <SymbolView name={{ ios: "leaf.fill", android: "eco", web: "eco" }} tintColor={palette.accentBright} size={38} />
          </View>
        </View>

        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionHeading, { color: palette.text }]}>Family Profiles</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileList}>
          {profiles.map((profile) => {
            const active = profile.id === activeProfile.id;
            return (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.profileChip,
                  { backgroundColor: palette.surface, borderColor: active ? palette.accentBright : palette.border },
                ]}
                onPress={() => switchProfile(profile)}
              >
                <View style={[styles.profileAvatar, { backgroundColor: active ? palette.accentBright : palette.surfaceSoft }]}>
                  <Text style={[styles.profileInitial, { color: active ? palette.onAccent : palette.text }]}>
                    {profile.name.trim().charAt(0).toUpperCase() || "U"}
                  </Text>
                </View>
                <Text style={[styles.profileChipName, { color: active ? palette.accentBright : palette.text }]} numberOfLines={1}>
                  {profile.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.statLabel, { color: palette.muted }]}>Total Scans</Text>
            <Text style={[styles.statValue, { color: palette.accentBright }]}>{totalScans}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.statLabel, { color: palette.muted }]}>Average Score</Text>
            <Text style={[styles.statValue, { color: getHealthScoreColor(averageScore) }]}>{averageScore}%</Text>
          </View>
        </View>

        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: palette.text }]}>Recent Food Scans</Text>
            <TouchableOpacity onPress={clearHistory} style={styles.clearAction}>
              <SymbolView name={{ ios: "trash", android: "delete_sweep", web: "delete_sweep" }} tintColor={palette.danger} size={20} />
              <Text style={[styles.clearText, { color: palette.danger }]}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {history.length > 0 ? (
            history.map((product) => (
              <TouchableOpacity
                key={product.code || product.product_name}
                style={[styles.scanRow, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => openProduct(product)}
                activeOpacity={0.72}
              >
                <View style={styles.scanThumb}>
                  {product.image_front_url ? (
                    <Image source={{ uri: product.image_front_url }} style={styles.scanImage} />
                  ) : (
                    <View style={[styles.scanPlaceholder, { backgroundColor: palette.surfaceSoft }]}> 
                      <Text style={[styles.scanPlaceholderText, { color: palette.muted }]}>IMG</Text>
                    </View>
                  )}
                </View>
                <View style={styles.scanInfo}>
                  <Text style={[styles.scanName, { color: palette.text }]} numberOfLines={1}>{product.product_name}</Text>
                  <Text style={[styles.scanBrand, { color: palette.muted }]} numberOfLines={1}>{product.brands || "Open Food Facts"}</Text>
                </View>
                <View style={[styles.scoreRingSmall, { borderColor: getHealthScoreColor(getHealthScore(product)) }]}>
                  <Text style={[styles.gradeText, { color: getHealthScoreColor(getHealthScore(product)) }]}>{getHealthScore(product)}</Text>
                </View>
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    removeScan(product.code || product.product_name);
                  }}
                  style={styles.removeButton}
                >
                  <SymbolView name={{ ios: "trash", android: "delete", web: "delete" }} tintColor={palette.danger} size={19} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: palette.muted }]}>No recent scans yet. Start scanning to fill your Ninja Hub.</Text>
          )}
        </View>
        {openingProduct ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={palette.accentBright} />
            <Text style={[styles.loadingLabel, { color: palette.text }]}>Opening product...</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 34 },
  heroCard: { alignItems: "center", borderRadius: 20, borderWidth: 1, flexDirection: "row", marginBottom: 24, padding: 22 },
  heroCopy: { flex: 1 },
  heroIcon: { alignItems: "center", borderRadius: 36, height: 72, justifyContent: "center", marginLeft: 14, width: 72 },
  heroTitle: { fontSize: 24, fontWeight: "900", marginBottom: 8 },
  heroGoal: { fontSize: 13, fontWeight: "800", marginBottom: 12 },
  heroQuote: { fontSize: 13, lineHeight: 20 },
  sectionHeadingRow: { marginBottom: 12 },
  sectionHeading: { fontSize: 18, fontWeight: "900" },
  profileList: { gap: 10, paddingBottom: 22 },
  profileChip: { alignItems: "center", borderRadius: 18, borderWidth: 2, minWidth: 92, padding: 12 },
  profileAvatar: { alignItems: "center", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  profileInitial: { fontSize: 18, fontWeight: "900" },
  profileChipName: { fontSize: 12, fontWeight: "900", marginTop: 8, maxWidth: 76 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 26 },
  statCard: { flex: 1, borderRadius: 20, borderWidth: 1, padding: 18 },
  statLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: "900" },
  recentCard: { marginBottom: 12 },
  recentHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  recentTitle: { fontSize: 18, fontWeight: "900" },
  clearAction: { alignItems: "center", flexDirection: "row", gap: 6 },
  clearText: { fontSize: 13, fontWeight: "700" },
  scanRow: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", marginBottom: 10, padding: 13 },
  scanThumb: { width: 58, height: 58, borderRadius: 14, overflow: "hidden" },
  scanImage: { height: "100%", width: "100%" },
  scanPlaceholder: { alignItems: "center", justifyContent: "center", height: "100%", width: "100%" },
  scanPlaceholderText: { fontSize: 12, fontWeight: "700" },
  scanInfo: { flex: 1 },
  scanName: { fontSize: 14, fontWeight: "800" },
  scanBrand: { fontSize: 12, marginTop: 4 },
  scoreRingSmall: { alignItems: "center", borderRadius: 25, borderWidth: 4, height: 50, justifyContent: "center", width: 50 },
  gradeText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  removeButton: { padding: 6 },
  removeIcon: { fontSize: 18, fontWeight: "900" },
  emptyText: { fontSize: 13, lineHeight: 20, marginTop: 12 },
  loadingOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 20, 25, 0.72)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  loadingLabel: { fontSize: 13, fontWeight: "800", marginTop: 10 },
});
