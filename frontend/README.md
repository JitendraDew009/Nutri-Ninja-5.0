# Nutri Ninja — Frontend

React Native + Expo SDK 56 app. Runs on Android (APK via EAS) and Web.

---

## Screens (Tabs)

| Tab | File | Description |
|---|---|---|
| Scan | `src/app/index.tsx` → `ScannerScreen.tsx` | Barcode scanner, product search, OCR label reader |
| Ninja Hub | `src/app/history.tsx` | Scan history, family profile switcher, stats |
| Grocery Basket | `src/app/grocery-basket.tsx` | Basket health score, quantity controls, AI basket analysis |
| Assistant | `src/app/explore.tsx` | Gemini AI nutrition chat (text only on Android) |
| Diet Profile | `src/app/profile.tsx` | Family profiles, health goals, allergies, dark/day toggle |

---

## Run Locally

```bash
npm install
npx expo start          # then press 'a' for Android or 'w' for web
```

Create `frontend/.env`:
```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.X.X:8000
```

---

## Build Android APK

```cmd
set NODE_TLS_REJECT_UNAUTHORIZED=0
eas login
eas build -p android --profile preview
```

---

## Key Architecture Decisions

### Local-first Storage
All data (profiles, history, basket, theme) is persisted via `AsyncStorage` in `src/utils/localStore.ts`.
- `memoryStore` (in-memory JS object) provides synchronous reads
- `AsyncStorage` provides persistence across restarts
- `hydrateStore()` in `_layout.tsx` loads AsyncStorage into `memoryStore` before first render

### Cross-screen Data Sync
Profile and basket changes are propagated via a native event system in `localStore.ts`:
- `emitStoreEvent(name)` fires both `window.CustomEvent` (web) and `addNativeListener` callbacks (Android)
- All tab screens use `useFocusEffect` to refresh data when they become active

### Backend + OpenFoodFacts Race
Product search and barcode lookup race the backend against OpenFoodFacts directly using `Promise.any`:
- Whichever responds first wins
- This makes the Render free-tier cold start invisible to the user

### No Login Required
Firebase authentication has been removed. All data is local-only.

---

## Environment Variables

| Variable | Used for |
|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | FastAPI backend URL |

Set in `eas.json` for EAS builds, or in `.env` for local dev.

---

## Android Permissions (`app.json`)

```json
"permissions": [
  "android.permission.CAMERA",
  "android.permission.INTERNET"
]
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `expo-camera` | Barcode scanning |
| `expo-symbols` | Cross-platform icons (SF Symbols / Material Symbols) |
| `expo-router` | File-based tab navigation |
| `@react-native-async-storage/async-storage` | Local data persistence |
| `axios` | HTTP requests |
| `react-native-reanimated` | Animations |
| `tesseract.js` | OCR (web only) |
