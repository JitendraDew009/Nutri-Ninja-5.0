# Nutri Ninja 5.0 — System Design Document

---

## 1. Overview

Nutri Ninja is a mobile-first food intelligence app for Android. It lets users scan packaged food barcodes, look up nutritional data, receive AI-powered health analysis, manage a grocery basket across family profiles, and chat with a Gemini-powered diet assistant — all with data stored locally on the device.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Android Device                          │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │           React Native App (Expo SDK 56)            │  │
│   │                                                     │  │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │  │
│   │  │  Scanner │ │ History  │ │ Grocery Basket    │   │  │
│   │  │  Screen  │ │ Screen   │ │ Screen            │   │  │
│   │  └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │  │
│   │       │             │                │              │  │
│   │  ┌────▼─────────────▼────────────────▼─────────┐   │  │
│   │  │           Local Store (localStore.ts)        │   │  │
│   │  │      memoryStore (sync) + AsyncStorage       │   │  │
│   │  └──────────────────────────────────────────────┘   │  │
│   │                                                     │  │
│   │  ┌──────────────────────────────────────────────┐   │  │
│   │  │              api.ts (HTTP Client)            │   │  │
│   │  └──────┬──────────────────────────┬────────────┘   │  │
│   └─────────┼──────────────────────────┼────────────────┘  │
└─────────────┼──────────────────────────┼────────────────────┘
              │                          │
    ┌─────────▼────────┐      ┌──────────▼──────────────┐
    │   FastAPI Backend │      │   Open Food Facts API   │
    │   (Render.com)   │      │  world.openfoodfacts.org │
    │                  │      └─────────────────────────┘
    │  ┌────────────┐  │
    │  │ Gemini API │  │
    │  │  (Google)  │  │
    │  └────────────┘  │
    └──────────────────┘
```

---

## 3. Component Breakdown

### 3.1 Frontend (React Native / Expo)

#### Navigation
- **Expo Router** with file-based tab routing
- 5 tabs: Scan, Ninja Hub, Grocery Basket, Assistant, Diet Profile
- Central "Scan" button raised above the tab bar

#### Screens and Responsibilities

| Screen | File | Responsibility |
|---|---|---|
| Scanner | `ScannerScreen.tsx` | Camera scan, product search, OCR |
| Product Detail | `ProductDetailScreen.tsx` | Scores, warnings, nutrition, recommendations, AI chat |
| Ninja Hub | `history.tsx` | Scan history, profile switcher, stats |
| Grocery Basket | `grocery-basket.tsx` | Basket health score, AI basket analysis |
| AI Assistant | `explore.tsx` | Free-form Gemini diet chat |
| Diet Profile | `profile.tsx` | Family profiles, goals, allergies |

#### Key Components

| Component | Purpose |
|---|---|
| `DietAdvisorChat` | In-product AI chat panel (uses product context) |
| `OCRLabelReader` | Paste ingredients → AI analysis |
| `ProductImage` | Multi-URL image with automatic fallback chain |
| `ProductDetailScreen` | Full nutrition analysis view |

---

### 3.2 Local Storage System

All persistence is handled by `src/utils/localStore.ts`.

#### Two-Layer Storage

```
Write request
     │
     ▼
memoryStore[key] = value   ←── Synchronous (instant read-back)
     │
     ▼ (async, non-blocking)
AsyncStorage.setItem(key, value)   ←── Survives app restart
```

On app launch, `_layout.tsx` calls `hydrateStore()` which bulk-loads AsyncStorage into `memoryStore` before any screen renders.

#### Stored Keys

| Key | Type | Description |
|---|---|---|
| `familyProfiles` | `UserProfile[]` | All family member profiles |
| `activeProfileId` | `string` | Currently selected profile |
| `scanHistory:{profileId}` | `Product[]` | Last 30 scans per profile |
| `groceryBasket:{profileId}` | `Product[]` | Basket items per profile |
| `themeModeV2` | `"dark" \| "day"` | UI theme preference |

#### Cross-Screen Event System

On web: `window.CustomEvent` dispatched via `emitStoreEvent()`
On Android: `addNativeListener()` callbacks registered per event name

Screens subscribe with:
```ts
addNativeListener("nutri-profile-changed", refreshProfile);
```

All tab screens also use `useFocusEffect` to refresh data on tab activation.

---

### 3.3 Backend (FastAPI on Render.com)

#### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/product/{barcode}` | Fetch from Open Food Facts + cache |
| `GET` | `/search?query=&page_size=` | Search Open Food Facts |
| `POST` | `/analyze` | Score + profile-aware insights |
| `POST` | `/chat` | Gemini text conversation |
| `POST` | `/chat/voice` | Gemini voice message |
| `POST` | `/recommendations` | Rank better/worse alternatives |
| `POST` | `/label/analyze` | Keyword-based label text analysis |

#### In-Memory Caches (per server instance)

```python
product_cache: dict[str, dict]   # barcode → product data
scan_history: list[dict]         # last 50 scanned products (server-side only)
```

Note: These reset on server restart. All durable storage lives on the device.

---

### 3.4 API Client (api.ts)

#### Search / Barcode Race Strategy

To hide the Render free-tier cold-start delay (~30 sec), the client fires two requests simultaneously and uses the first response:

```
App calls searchProducts("biscuits")
       │
       ├──► Backend /search?query=biscuits  (6s timeout)
       │                    │
       └──► OpenFoodFacts /cgi/search.pl    (12s timeout)
                            │
            Promise.any([...]) ◄────────────── First to resolve wins
```

- If backend is warm → backend wins (filtered, cleaner data)
- If backend is cold → OpenFoodFacts wins (raw data, still works)
- If both fail → empty results (no crash)

#### AI Chat (backend-only)

AI calls cannot be raced — they must go through the backend which holds the Gemini API key:

```
App → POST /chat → Backend → Gemini API → Backend → App
```

Retry logic: up to 3 attempts with auto-retry on rate-limit delays ≤ 15 seconds.

---

## 4. Data Flow Diagrams

### 4.1 Barcode Scan Flow

```
User points camera at barcode
        │
        ▼
CameraView.onBarcodeScanned(data)
        │
        ▼
openProductByBarcode(barcode)
        │
        ├──── fetchProduct(barcode)
        │           │
        │     Promise.any([backend, OpenFoodFacts])
        │           │
        │     product data
        │
        ├──── rememberProduct()  → writeStore("scanHistory:profileId", [...])
        │                               │
        │                         AsyncStorage.setItem(...)
        │
        └──── setSelectedProduct(product) → shows ProductDetailScreen
```

### 4.2 AI Chat Flow

```
User types question in DietAdvisorChat
        │
        ▼
submitMessage(text)
        │
        ├── Prepend product context to first message
        │   "[Product: Britannia Marie Gold, Score: 72, ...]"
        │
        ├── POST /chat  { messages, profile }
        │        │
        │   FastAPI /chat
        │        │
        │   Gemini 1.5 Flash API
        │        │
        │   response.message
        │
        └── setMessages([...history, assistantReply])
```

### 4.3 Add to Basket Flow

```
User taps "Add to Grocery Basket"
        │
        ▼
onAddToBasket(product) in ProductDetailScreen
        │
setBasketAdded(true) ──── Button turns green "Added to Basket!" for 2 sec
        │
writeStore("groceryBasket:profileId", [...])
        │
        ├── memoryStore updated immediately (sync)
        └── AsyncStorage.setItem(...) (async)

User navigates to Grocery Basket tab
        │
useFocusEffect fires
        │
setBasket(readStore("groceryBasket:profileId", []))  ← reads from memoryStore
```

---

## 5. Health Scoring Algorithm

### Ninja Health Score (1–100)

```
score = 100

− min(sugars_100g × 1.8, 25)          # penalize sugar
− min(saturated_fat_100g × 2.2, 25)   # penalize sat fat
− min(salt_100g × 1.5, 15)            # penalize salt
− min(additive_count × 2, 12)         # penalize additives
− min((energy_100g − 300) / 50, 10)   # penalize calorie density > 300

+ min(fiber_100g × 1.5, 15)           # reward fiber
+ min(proteins_100g × 1.2, 15)        # reward protein

score = clamp(score, 1, 100)
```

### Nutri-Score Grade

| Score | Grade |
|---|---|
| 80–100 | A |
| 60–79 | B |
| 40–59 | C |
| 20–39 | D |
| 1–19 | E |

---

## 6. Multi-Profile System

```
familyProfiles: [
  { id: "primary", name: "Jitendra", goal: "muscle_gain", allergies: "...", ... },
  { id: "profile-1234", name: "Mom", goal: "diabetes", allergies: "...", ... },
]

activeProfileId: "primary"

scanHistory:primary: [ ...products ]
scanHistory:profile-1234: [ ...products ]

groceryBasket:primary: [ ...products ]
groceryBasket:profile-1234: [ ...products ]
```

Switching profiles fires `emitStoreEvent("nutri-profile-changed")`, which all screens listen for and use to reload their data.

---

## 7. Personalized Insights

Insights are generated client-side in `healthScore.ts` by cross-referencing the product's nutriments against the active profile:

| Goal | Trigger | Insight |
|---|---|---|
| Diabetes | `sugars_100g > 10` | "Diabetes alert: sugar is high" |
| Weight Loss | `energy_100g > 350` | "High calorie density, keep portions small" |
| Muscle Gain | `proteins_100g >= 8` | "Useful protein for muscle gain" |
| Heart Health | `salt_100g > 0.75` or `sat_fat > 3` | "Sodium/fat deserves caution" |
| Any goal | Allergy match in ingredients text | "Allergy alert: ingredients mention X" |
| Any goal | Disliked ingredient match | "Preference alert: contains X" |

---

## 8. Recommendation Engine

```
searchProducts(firstCategoryWord)
        │
        ▼
candidates = results with product_name AND image AND nutriments
        │
        ▼
getRecommendations(currentProduct, candidates)
        │
        ├── better = [candidates where score > current score] top 5
        └── worse  = [candidates where score < current score] top 5
```

---

## 9. Android Permissions

| Permission | Why |
|---|---|
| `CAMERA` | Barcode scanning via CameraView |
| `INTERNET` | Backend API, OpenFoodFacts, Gemini |

Microphone permission is **not** requested — voice chat is web-browser-only.

---

## 10. Deployment Architecture

```
GitHub (main branch)
        │
        ├──── EAS Build (Expo) ──────────────────► .apk download link
        │      Triggered manually via CLI           Android phone install
        │
        └──── Render.com (auto-deploy) ──────────► https://nutri-ninja-5-0.onrender.com
               Root dir: backend/
               Start: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
               Env: GEMINI_API_KEY, GEMINI_MODEL=gemini-1.5-flash
```

---

## 11. Limitations and Future Improvements

| Area | Current | Future |
|---|---|---|
| OCR | Web-only Tesseract.js | Add `expo-text-recognition` for native Android OCR |
| Voice | Web Speech API only | Add `expo-speech` + `expo-av` for native voice input |
| Backend state | In-memory (resets on restart) | MongoDB Atlas for persistent server-side history |
| AI quota | 15 req/min free tier | Upgrade to Google AI Studio paid or Vertex AI |
| Render cold start | ~30 sec first request | Upgrade to Render paid tier ($7/mo, no sleep) |
| Offline | Requires internet for scanning | Cache product data for offline retry |

---

## 12. Security Considerations

| Risk | Mitigation |
|---|---|
| Gemini API key exposure | Key stored server-side on Render env vars only — never in APK |
| Sensitive data in APK | Only `EXPO_PUBLIC_BACKEND_URL` baked into APK — not a secret |
| User data privacy | All personal data (profiles, history) stored locally on device, never sent to a server |
| Backend CORS | FastAPI configured with `allow_origins=["*"]` for development — restrict for production |
