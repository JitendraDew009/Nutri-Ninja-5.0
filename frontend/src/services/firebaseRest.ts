import axios from "axios";

export type FirebaseSession = {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
  displayName?: string;
  expiresAt: number;
};

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "";
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "";
const SESSION_KEY = "firebaseSession";
const AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts";

export const firebaseConfigured = Boolean(apiKey && projectId);

function storage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function getFirebaseSession(): FirebaseSession | null {
  try {
    const raw = storage()?.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data: any): FirebaseSession {
  const session: FirebaseSession = {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    localId: data.localId,
    email: data.email || "",
    displayName: data.displayName || "",
    expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
  };
  storage()?.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function authError(error: any) {
  const code = error?.response?.data?.error?.message || "";
  const messages: Record<string, string> = {
    EMAIL_EXISTS: "An account already exists with this email.",
    INVALID_LOGIN_CREDENTIALS: "Email or password is incorrect.",
    WEAK_PASSWORD: "Use a password with at least 6 characters.",
    TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Please try again later.",
    USER_DISABLED: "This account has been disabled.",
  };
  return new Error(messages[code] || code.replaceAll("_", " ").toLowerCase() || "Authentication failed.");
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  try {
    const response = await axios.post(`${AUTH_BASE}:signUp?key=${apiKey}`, {
      email,
      password,
      returnSecureToken: true,
    });
    let session = saveSession(response.data);
    if (name.trim()) {
      const update = await axios.post(`${AUTH_BASE}:update?key=${apiKey}`, {
        idToken: session.idToken,
        displayName: name.trim(),
        returnSecureToken: true,
      });
      session = saveSession({ ...update.data, email, localId: session.localId });
    }
    return session;
  } catch (error) {
    throw authError(error);
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const response = await axios.post(
      `${AUTH_BASE}:signInWithPassword?key=${apiKey}`,
      { email, password, returnSecureToken: true }
    );
    return saveSession(response.data);
  } catch (error) {
    throw authError(error);
  }
}

export function signOutFirebase() {
  storage()?.removeItem(SESSION_KEY);
}

export async function refreshFirebaseSession(session: FirebaseSession) {
  if (session.expiresAt > Date.now() + 60_000) return session;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
  });
  const response = await axios.post(
    `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
    body.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return saveSession({
    idToken: response.data.id_token,
    refreshToken: response.data.refresh_token,
    localId: response.data.user_id,
    email: session.email,
    displayName: session.displayName,
    expiresIn: response.data.expires_in,
  });
}

function cloudUrl(uid: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/appData/main`;
}

export async function saveUserCloudData(session: FirebaseSession, data: Record<string, unknown>) {
  const current = await refreshFirebaseSession(session);
  await axios.patch(
    cloudUrl(current.localId),
    {
      fields: {
        payload: { stringValue: JSON.stringify(data) },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    },
    { headers: { Authorization: `Bearer ${current.idToken}` } }
  );
  return current;
}

export async function loadUserCloudData(session: FirebaseSession) {
  const current = await refreshFirebaseSession(session);
  try {
    const response = await axios.get(cloudUrl(current.localId), {
      headers: { Authorization: `Bearer ${current.idToken}` },
    });
    const payload = response.data?.fields?.payload?.stringValue;
    return {
      session: current,
      data: payload ? JSON.parse(payload) : null,
    };
  } catch (error: any) {
    if (error?.response?.status === 404) return { session: current, data: null };
    throw error;
  }
}
