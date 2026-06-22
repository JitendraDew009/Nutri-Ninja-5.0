import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  FirebaseSession,
  firebaseConfigured,
  getFirebaseSession,
  loadUserCloudData,
  saveUserCloudData,
  signInWithEmail,
  signOutFirebase,
  signUpWithEmail,
} from "../services/firebaseRest";
import { getFamilyProfiles, readStore, writeStore } from "../utils/localStore";
import { useThemeMode } from "../utils/themeMode";

type AuthContextValue = {
  session: FirebaseSession | null;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue>({ session: null, signOut: () => undefined });

export function useAuth() {
  return useContext(AuthContext);
}

function cloudSnapshot() {
  const profiles = getFamilyProfiles();
  return {
    familyProfiles: profiles,
    activeProfileId: readStore("activeProfileId", profiles[0]?.id || "primary"),
    profileData: Object.fromEntries(
      profiles.map((profile) => [
        profile.id,
        {
          history: readStore(`scanHistory:${profile.id}`, []),
          basket: readStore(`groceryBasket:${profile.id}`, []),
        },
      ])
    ),
  };
}

function restoreSnapshot(data: any) {
  if (!data?.familyProfiles?.length) return;
  writeStore("familyProfiles", data.familyProfiles);
  writeStore("activeProfileId", data.activeProfileId || data.familyProfiles[0].id);
  Object.entries(data.profileData || {}).forEach(([profileId, value]: [string, any]) => {
    writeStore(`scanHistory:${profileId}`, value?.history || []);
    writeStore(`groceryBasket:${profileId}`, value?.basket || []);
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nutri-profile-changed"));
  }
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<FirebaseSession | null>(getFirebaseSession);
  const [initializing, setInitializing] = useState(Boolean(session && firebaseConfigured));
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session || !firebaseConfigured) {
      setInitializing(false);
      return;
    }
    loadUserCloudData(session)
      .then(({ session: refreshed, data }) => {
        setSession(refreshed);
        if (data) restoreSnapshot(data);
        else saveUserCloudData(refreshed, cloudSnapshot());
      })
      .finally(() => setInitializing(false));
  }, []);

  useEffect(() => {
    if (!session || typeof window === "undefined") return;
    const sync = () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        saveUserCloudData(session, cloudSnapshot()).then(setSession).catch(() => undefined);
      }, 900);
    };
    window.addEventListener("nutri-data-changed", sync);
    return () => window.removeEventListener("nutri-data-changed", sync);
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      signOut: () => {
        signOutFirebase();
        setSession(null);
      },
    }),
    [session]
  );

  if (!firebaseConfigured) return <>{children}</>;
  if (initializing) return <LoadingScreen />;
  if (!session) return <AuthScreen onAuthenticated={setSession} />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function LoadingScreen() {
  const { palette } = useThemeMode();
  return (
    <SafeAreaView style={[styles.center, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <ActivityIndicator size="large" color={palette.accentBright} />
      <Text style={[styles.loadingText, { color: palette.muted }]}>Loading your cloud profile...</Text>
    </SafeAreaView>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: FirebaseSession) => void }) {
  const { palette } = useThemeMode();
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const session = signup
        ? await signUpWithEmail(name, email.trim(), password)
        : await signInWithEmail(email.trim(), password);
      onAuthenticated(session);
    } catch (err: any) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.authPage, { backgroundColor: palette.background }]} edges={["top", "bottom"]}>
      <View style={[styles.authCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={[styles.logo, { backgroundColor: palette.surfaceSoft }]}>
          <SymbolView name={{ ios: "leaf.fill", android: "eco", web: "eco" }} tintColor={palette.accentBright} size={38} />
        </View>
        <Text style={[styles.title, { color: palette.text }]}>{signup ? "Create your account" : "Welcome back"}</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>
          Securely sync family profiles and nutrition history with Google Firebase.
        </Text>
        {signup ? (
          <TextInput
            style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={palette.muted}
          />
        ) : null}
        <TextInput
          style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor={palette.muted}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={palette.muted}
          secureTextEntry
        />
        {error ? <Text style={[styles.error, { color: palette.danger }]}>{error}</Text> : null}
        <TouchableOpacity style={[styles.primary, { backgroundColor: palette.accentBright }]} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={palette.onAccent} />
          ) : (
            <Text style={[styles.primaryText, { color: palette.onAccent }]}>{signup ? "Create account" : "Sign in"}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSignup((value) => !value)}>
          <Text style={[styles.switchText, { color: palette.accentBright }]}>
            {signup ? "Already have an account? Sign in" : "New to Nutri Ninja? Create an account"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadingText: { fontSize: 13, marginTop: 12 },
  authPage: { alignItems: "center", flex: 1, justifyContent: "center", padding: 20 },
  authCard: { borderRadius: 26, borderWidth: 1, maxWidth: 430, padding: 28, width: "100%" },
  logo: { alignItems: "center", borderRadius: 24, height: 64, justifyContent: "center", marginBottom: 20, width: 64 },
  title: { fontSize: 24, fontWeight: "900" },
  subtitle: { fontSize: 13, lineHeight: 20, marginBottom: 22, marginTop: 7 },
  input: { borderRadius: 14, borderWidth: 1, fontSize: 14, height: 50, marginBottom: 12, paddingHorizontal: 15 },
  error: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  primary: { alignItems: "center", borderRadius: 16, justifyContent: "center", marginTop: 4, minHeight: 50 },
  primaryText: { fontSize: 14, fontWeight: "900" },
  switchText: { fontSize: 13, fontWeight: "800", marginTop: 18, textAlign: "center" },
});
