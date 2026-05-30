# Nutri Ninja Frontend

React Native + Expo frontend for Nutri Ninja 5.0.

## Screens

- `src/app/index.tsx` - Home and scanner flow
- `src/app/explore.tsx` - Nutrition dashboard, profile, basket, history, voice, OCR label analysis
- `src/screens/ScannerScreen.tsx` - Camera barcode scanner and product search
- `src/screens/ProductDetailScreen.tsx` - Product health score, warnings, nutrition, recommendations

## Run

```powershell
npm install
npm run web
```

## Verify

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
```
