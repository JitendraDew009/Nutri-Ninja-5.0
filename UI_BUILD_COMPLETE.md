# Nutri Ninja 5.0 — Feature Status

## Screens

### Scan (`src/app/index.tsx` → `ScannerScreen.tsx`)
- Camera barcode scanner with specific barcode type targeting (faster scan)
- Product name/brand search with image suggestions
- Food Label OCR — paste ingredients, get AI analysis
- Manual barcode entry
- Profile header showing active family member and dietary goal

### Product Detail (`src/screens/ProductDetailScreen.tsx`)
- Product image, name, brand, barcode
- Ninja Health Score (1–100)
- Official Nutri-Score (A–E)
- Health warnings (sugar, salt, saturated fat, calorie density)
- Personalized insights based on user goal and allergies
- Full nutrition table with progress bars
- Better and worse product recommendations
- Add to Grocery Basket button (visual feedback, no popup)
- Diet Advisor Live Chat — ask AI about the specific product

### Ninja Hub / History (`src/app/history.tsx`)
- Family profile switcher (chips)
- Total scans + average health score stats
- Per-profile scan history with health score rings
- Add to basket or remove individual scans
- Refreshes automatically when tab is opened

### Grocery Basket (`src/app/grocery-basket.tsx`)
- Weighted basket health score + grade
- Per-item quantity controls (+ / −)
- AI basket analysis (Gemini: 3-bullet practical recommendation)
- Remove individual items or clear all
- Refreshes automatically when tab is opened

### AI Assistant (`src/app/explore.tsx`)
- Gemini 1.5 Flash powered nutrition chat
- Text input on Android (mic disabled — voice is browser-only)
- Supports Hindi and English detection

### Diet Profile (`src/app/profile.tsx`)
- Multiple family member profiles
- Health goals: General / Weight Loss / Muscle Gain / Diabetes / Heart Health
- Dietary restrictions (Vegetarian, Vegan, Gluten-Free, etc.)
- Allergies, health conditions, ingredients to avoid
- Dark / Day mode toggle
- All data stored locally on device

## Design System

| Token | Value |
|---|---|
| Background (dark) | `#050817` |
| Surface (dark) | `#10172f` |
| Accent green | `#49df88` |
| Danger | `#ef4650` |
| Background (day) | `#f4f7fb` |
| Surface (day) | `#ffffff` |

Health score colors: Green (80+) → Lime (60+) → Yellow (40+) → Orange (20+) → Red (<20)

## Known Limitations

| Limitation | Notes |
|---|---|
| OCR image capture | Web-only (Tesseract.js). Android shows tip to paste text manually. |
| Voice chat | Web Speech API is browser-only. Mic button grayed out on Android. |
| Render cold start | Backend on free tier sleeps after 15 min. First request may take ~30 sec. |
| Gemini rate limit | 15 req/min on free tier. Retry after ~30 sec if busy. |
