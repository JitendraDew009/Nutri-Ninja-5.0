import React, { useState } from "react";
import { SymbolView } from "expo-symbols";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import {
  DEFAULT_PROFILE,
  UserProfile,
  getActiveProfile,
  getFamilyProfiles,
  saveFamilyProfiles,
} from "../utils/localStore";
import { ThemeToggle, useThemeMode } from "../utils/themeMode";

const goals: Array<{ key: UserProfile["goal"]; label: string }> = [
  { key: "general", label: "General wellness" },
  { key: "weight_loss", label: "Weight management" },
  { key: "muscle_gain", label: "Muscle gain" },
  { key: "diabetes", label: "Diabetes support" },
  { key: "heart_health", label: "Heart health" },
];

const relationships: Array<{ key: UserProfile["relationship"]; label: string }> = [
  { key: "self", label: "Myself" },
  { key: "spouse", label: "Spouse" },
  { key: "child", label: "Child" },
  { key: "parent", label: "Parent" },
  { key: "other", label: "Other" },
];

const restrictions = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Low-Sodium"];

export default function ProfileScreen() {
  const { palette } = useThemeMode();
  const [profiles, setProfiles] = useState<UserProfile[]>(getFamilyProfiles);
  const [activeId, setActiveId] = useState(getActiveProfile().id);
  const [editingId, setEditingId] = useState(getActiveProfile().id);
  const [draft, setDraft] = useState<UserProfile>(getActiveProfile);

  const editProfile = (profile: UserProfile) => {
    setEditingId(profile.id);
    setDraft({ ...profile, restrictions: [...(profile.restrictions || [])] });
  };

  const addProfile = () => {
    const profile: UserProfile = {
      ...DEFAULT_PROFILE,
      id: `profile-${Date.now()}`,
      name: "",
      relationship: "other",
    };
    setEditingId(profile.id);
    setDraft(profile);
  };

  const toggleRestriction = (item: string) => {
    const selected = draft.restrictions || [];
    setDraft({
      ...draft,
      restrictions: selected.includes(item)
        ? selected.filter((value) => value !== item)
        : [...selected, item],
    });
  };

  const saveProfile = () => {
    if (!draft.name.trim()) {
      alert("Please enter a profile name.");
      return;
    }
    const normalized = { ...draft, name: draft.name.trim() };
    const exists = profiles.some((profile) => profile.id === editingId);
    const nextProfiles = exists
      ? profiles.map((profile) => (profile.id === editingId ? normalized : profile))
      : [...profiles, normalized];
    setProfiles(nextProfiles);
    setActiveId(normalized.id);
    saveFamilyProfiles(nextProfiles, normalized.id);
    alert("Profile saved and activated.");
  };

  const activateProfile = (profile: UserProfile) => {
    setActiveId(profile.id);
    editProfile(profile);
    saveFamilyProfiles(profiles, profile.id);
  };

  const deleteProfile = () => {
    if (profiles.length <= 1) {
      alert("At least one profile is required.");
      return;
    }
    const nextProfiles = profiles.filter((profile) => profile.id !== editingId);
    const nextActive = nextProfiles[0];
    setProfiles(nextProfiles);
    setActiveId(nextActive.id);
    editProfile(nextActive);
    saveFamilyProfiles(nextProfiles, nextActive.id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.pageTitle, { color: palette.text }]}>Family profiles</Text>
            <Text style={[styles.pageSubtitle, { color: palette.muted }]}>
              Switch between family members to personalize food scores, warnings, and AI guidance.
            </Text>
          </View>
          <ThemeToggle />
        </View>


        <View style={styles.profileStrip}>
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.profileCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: profile.id === activeId ? palette.accentBright : palette.border,
                },
              ]}
              onPress={() => activateProfile(profile)}
            >
              <View style={[styles.avatar, { backgroundColor: palette.surfaceSoft }]}>
                <SymbolView
                  name={{ ios: "person.fill", android: "person", web: "person" }}
                  tintColor={profile.id === activeId ? palette.accentBright : palette.muted}
                  size={24}
                />
              </View>
              <Text style={[styles.profileName, { color: palette.text }]} numberOfLines={1}>{profile.name}</Text>
              <Text style={[styles.profileRelation, { color: palette.muted }]}>
                {relationships.find((item) => item.key === profile.relationship)?.label}
              </Text>
              {profile.id === activeId ? (
                <View style={[styles.activePill, { backgroundColor: palette.accentBright }]}>
                  <Text style={[styles.activePillText, { color: palette.onAccent }]}>Active</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.addCard, { borderColor: palette.border }]}
            onPress={addProfile}
          >
            <SymbolView
              name={{ ios: "person.badge.plus", android: "person_add", web: "person_add" }}
              tintColor={palette.accentBright}
              size={28}
            />
            <Text style={[styles.addText, { color: palette.text }]}>Add member</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.formHeader}>
            <View>
              <Text style={[styles.formTitle, { color: palette.text }]}>
                {profiles.some((profile) => profile.id === editingId) ? "Edit profile" : "New family member"}
              </Text>
              <Text style={[styles.formSubtitle, { color: palette.muted }]}>Personalization settings</Text>
            </View>
            <SymbolView
              name={{ ios: "slider.horizontal.3", android: "tune", web: "tune" }}
              tintColor={palette.accentBright}
              size={25}
            />
          </View>

          <Text style={[styles.label, { color: palette.text }]}>Profile name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
            value={draft.name}
            onChangeText={(name) => setDraft({ ...draft, name })}
            placeholder="e.g. Jitendra, Mom, Aarav"
            placeholderTextColor={palette.muted}
          />

          <Text style={[styles.label, { color: palette.text }]}>Relationship</Text>
          <View style={styles.chipRow}>
            {relationships.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.chip,
                  { borderColor: palette.border, backgroundColor: palette.surfaceSoft },
                  draft.relationship === item.key && { backgroundColor: palette.accentBright, borderColor: palette.accentBright },
                ]}
                onPress={() => setDraft({ ...draft, relationship: item.key })}
              >
                <Text style={[styles.chipText, { color: draft.relationship === item.key ? palette.onAccent : palette.text }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowInput}>
            <View style={styles.flexInput}>
              <Text style={[styles.label, { color: palette.text }]}>Age</Text>
              <TextInput
                style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
                value={draft.age}
                onChangeText={(age) => setDraft({ ...draft, age })}
                placeholder="Age"
                placeholderTextColor={palette.muted}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flexInput}>
              <Text style={[styles.label, { color: palette.text }]}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
                value={draft.weight}
                onChangeText={(weight) => setDraft({ ...draft, weight })}
                placeholder="Weight"
                placeholderTextColor={palette.muted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={[styles.label, { color: palette.text }]}>Primary health goal</Text>
          <View style={styles.chipRow}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.key}
                style={[
                  styles.chip,
                  { borderColor: palette.border, backgroundColor: palette.surfaceSoft },
                  draft.goal === goal.key && { backgroundColor: palette.accentBright, borderColor: palette.accentBright },
                ]}
                onPress={() => setDraft({ ...draft, goal: goal.key })}
              >
                <Text style={[styles.chipText, { color: draft.goal === goal.key ? palette.onAccent : palette.text }]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: palette.text }]}>Dietary preferences</Text>
          <View style={styles.chipRow}>
            {restrictions.map((restriction) => {
              const selected = draft.restrictions?.includes(restriction);
              return (
                <TouchableOpacity
                  key={restriction}
                  style={[
                    styles.chip,
                    { borderColor: palette.border, backgroundColor: palette.surfaceSoft },
                    selected && { backgroundColor: palette.accentBright, borderColor: palette.accentBright },
                  ]}
                  onPress={() => toggleRestriction(restriction)}
                >
                  <Text style={[styles.chipText, { color: selected ? palette.onAccent : palette.text }]}>{restriction}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {[
            ["Allergies", "allergies", "Peanuts, gluten, shellfish"],
            ["Health conditions", "conditions", "Diabetes, hypertension"],
            ["Ingredients to avoid", "dislikedIngredients", "Palm oil, artificial sweeteners"],
          ].map(([label, key, placeholder]) => (
            <View key={key}>
              <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
                value={String(draft[key as keyof UserProfile] || "")}
                onChangeText={(value) => setDraft({ ...draft, [key]: value })}
                placeholder={placeholder}
                placeholderTextColor={palette.muted}
              />
            </View>
          ))}

          <View style={styles.actionRow}>
            {profiles.some((profile) => profile.id === editingId) && profiles.length > 1 ? (
              <TouchableOpacity style={[styles.deleteButton, { borderColor: palette.danger }]} onPress={deleteProfile}>
                <SymbolView name={{ ios: "trash", android: "delete", web: "delete" }} tintColor={palette.danger} size={20} />
                <Text style={[styles.deleteText, { color: palette.danger }]}>Delete</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: palette.accentBright }]} onPress={saveProfile}>
              <SymbolView name={{ ios: "checkmark", android: "check", web: "check" }} tintColor={palette.onAccent} size={20} />
              <Text style={[styles.saveText, { color: palette.onAccent }]}>Save and activate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 12, marginBottom: 18 },
  headerCopy: { flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: "900" },
  pageSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  accountCard: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, marginBottom: 18, padding: 14 },
  accountIcon: { alignItems: "center", borderRadius: 16, height: 44, justifyContent: "center", width: 44 },
  accountCopy: { flex: 1 },
  accountTitle: { fontSize: 14, fontWeight: "900" },
  accountEmail: { fontSize: 11, marginTop: 3 },
  signOutButton: { alignItems: "center", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 11, paddingVertical: 9 },
  signOutText: { fontSize: 11, fontWeight: "900" },
  profileStrip: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  profileCard: { borderRadius: 18, borderWidth: 2, minHeight: 142, padding: 13, width: 122 },
  avatar: { alignItems: "center", borderRadius: 16, height: 42, justifyContent: "center", marginBottom: 10, width: 42 },
  profileName: { fontSize: 14, fontWeight: "900" },
  profileRelation: { fontSize: 11, marginTop: 3 },
  activePill: { alignSelf: "flex-start", borderRadius: 99, marginTop: 10, paddingHorizontal: 8, paddingVertical: 4 },
  activePillText: { fontSize: 10, fontWeight: "900" },
  addCard: { alignItems: "center", borderRadius: 18, borderStyle: "dashed", borderWidth: 1, justifyContent: "center", minHeight: 142, width: 122 },
  addText: { fontSize: 12, fontWeight: "800", marginTop: 9 },
  formCard: { borderRadius: 22, borderWidth: 1, padding: 18 },
  formHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  formTitle: { fontSize: 20, fontWeight: "900" },
  formSubtitle: { fontSize: 12, marginTop: 3 },
  label: { fontSize: 12, fontWeight: "800", marginBottom: 8, marginTop: 8 },
  input: { borderRadius: 14, borderWidth: 1, fontSize: 14, height: 48, paddingHorizontal: 14 },
  textArea: { borderRadius: 14, borderWidth: 1, fontSize: 14, minHeight: 54, paddingHorizontal: 14, paddingTop: 14 },
  rowInput: { flexDirection: "row", gap: 12 },
  flexInput: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  chipText: { fontSize: 11, fontWeight: "800" },
  actionRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 20 },
  deleteButton: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 7, paddingHorizontal: 16, paddingVertical: 13 },
  deleteText: { fontSize: 13, fontWeight: "900" },
  saveButton: { alignItems: "center", borderRadius: 14, flexDirection: "row", gap: 7, justifyContent: "center", paddingHorizontal: 18, paddingVertical: 13 },
  saveText: { fontSize: 13, fontWeight: "900" },
});
