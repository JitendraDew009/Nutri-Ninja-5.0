import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { UserProfile, readStore, writeStore } from "../utils/localStore";
import { ThemeToggle, useThemeMode } from "../utils/themeMode";

const defaultProfile: UserProfile = {
  name: "Nutri Ninja User",
  age: "",
  weight: "",
  goal: "general",
  restrictions: [],
  allergies: "",
  conditions: "",
};

const goals: Array<{ key: UserProfile["goal"]; label: string }> = [
  { key: "general", label: "General Fitness" },
  { key: "weight_loss", label: "Weight Loss" },
  { key: "muscle_gain", label: "Muscle Gain" },
];

const restrictions = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"];

export default function ProfileScreen() {
  const { palette } = useThemeMode();
  const [profile, setProfile] = useState<UserProfile>(() => readStore("userProfile", defaultProfile));

  const toggleRestriction = (item: string) => {
    const nextRestrictions = profile.restrictions?.includes(item)
      ? profile.restrictions.filter((value) => value !== item)
      : [...(profile.restrictions || []), item];

    setProfile({ ...profile, restrictions: nextRestrictions });
  };

  const saveProfile = () => {
    writeStore("userProfile", profile);
    alert("Profile saved");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.pageTitle, { color: palette.text }]}>Personalized Diets Profile</Text>
          <Text style={[styles.pageSubtitle, { color: palette.muted }]}>Configure your health goals, allergies, and diagnostics to personalize scoring benchmarks.</Text>

          <View style={styles.rowInput}>
            <View style={styles.flexInput}>
              <Text style={[styles.fieldLabel, { color: palette.text }]}>Age (years)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
                value={profile.age}
                onChangeText={(age) => setProfile({ ...profile, age })}
                placeholder="25"
                placeholderTextColor="#7b8794"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flexInput}>
              <Text style={[styles.fieldLabel, { color: palette.text }]}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
                value={profile.weight}
                onChangeText={(weight) => setProfile({ ...profile, weight })}
                placeholder="70.0"
                placeholderTextColor="#7b8794"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: palette.text }]}>Dietary Health Goal</Text>
          <View style={styles.chipRow}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.key}
                style={[styles.chip, profile.goal === goal.key && styles.chipActive]}
                onPress={() => setProfile({ ...profile, goal: goal.key })}
              >
                <Text style={[styles.chipText, profile.goal === goal.key && styles.chipTextActive]}>{goal.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: palette.text }]}>Dietary Restrictions (Select multiple)</Text>
          <View style={styles.chipRow}>
            {restrictions.map((restriction) => (
              <TouchableOpacity
                key={restriction}
                style={[styles.chip, profile.restrictions?.includes(restriction) && styles.chipActive]}
                onPress={() => toggleRestriction(restriction)}
              >
                <Text style={[styles.chipText, profile.restrictions?.includes(restriction) && styles.chipTextActive]}>{restriction}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: palette.text }]}>Allergies (comma separated)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
            value={profile.allergies}
            onChangeText={(allergies) => setProfile({ ...profile, allergies })}
            placeholder="peanuts, gluten"
            placeholderTextColor="#7b8794"
          />
          <Text style={[styles.helperText, { color: palette.muted }]}>Scoring will flag allergy warnings if ingredients contain matches listed here.</Text>

          <Text style={[styles.sectionLabel, { color: palette.text }]}>Diagnostics/Conditions (comma separated)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
            value={profile.conditions}
            onChangeText={(conditions) => setProfile({ ...profile, conditions })}
            placeholder="diabetes, hypertension"
            placeholderTextColor="#7b8794"
          />

          <TouchableOpacity style={styles.button} onPress={saveProfile}>
            <Text style={styles.buttonText}>Save Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18, marginTop: 14 },
  pageTitle: { fontSize: 24, fontWeight: "900", marginBottom: 6 },
  pageSubtitle: { fontSize: 13, lineHeight: 20, marginBottom: 18 },
  rowInput: { flexDirection: "row", gap: 12, marginBottom: 16 },
  flexInput: { flex: 1 },
  fieldLabel: { color: "#334155", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: "700", marginBottom: 10, marginTop: 6 },
  input: {
    borderColor: "#d1d5db",
    borderRadius: 14,
    borderWidth: 1,
    color: "#111827",
    fontSize: 14,
    height: 48,
    paddingHorizontal: 14,
  },
  textArea: {
    borderColor: "#d1d5db",
    borderRadius: 14,
    borderWidth: 1,
    color: "#111827",
    fontSize: 14,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 8,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  chip: { backgroundColor: "#f3f4f6", borderRadius: 999, borderColor: "#d1d5db", borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  chipActive: { backgroundColor: "#2f6f2d", borderColor: "#2f6f2d" },
  chipText: { color: "#334155", fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  helperText: { fontSize: 12, lineHeight: 18, marginBottom: 16 },
  button: { alignItems: "center", backgroundColor: "#264e24", borderRadius: 16, paddingVertical: 14 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
});
