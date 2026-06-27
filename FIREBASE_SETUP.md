# Firebase — Not Used

Firebase authentication and cloud sync have been removed from Nutri Ninja 5.0.

All user data (family profiles, scan history, grocery basket, theme preference) is stored
**locally on the device** using `@react-native-async-storage/async-storage`.

No account, login, or internet connection is required to use the core features of the app.

---

If you want to re-add Firebase cloud sync in the future:
- Add `useAuth` context back via `auth-gate.tsx` (the file still exists in `src/components/`)
- Re-wrap `<ThemedTabs />` with `<AuthGate>` in `src/app/_layout.tsx`
- Add `EXPO_PUBLIC_FIREBASE_API_KEY` and `EXPO_PUBLIC_FIREBASE_PROJECT_ID` to `eas.json`
- Enable Email/Password in Firebase Console → Authentication → Sign-in method
