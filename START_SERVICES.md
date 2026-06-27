# Start Services — Local Development

## Backend

```cmd
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:
- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

Make sure `backend/.env` has:
```env
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-1.5-flash
```

## Frontend

```cmd
cd frontend
npx expo start
```

- Press `a` — opens on Android emulator
- Press `w` — opens in browser
- Scan QR code with Expo Go app on physical Android device

Create `frontend/.env` with your PC's local IP:
```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.X.X:8000
```

## Quick API Test

```bash
curl https://nutri-ninja-5-0.onrender.com/
curl https://nutri-ninja-5-0.onrender.com/product/5000112126957
curl "https://nutri-ninja-5-0.onrender.com/search?query=bread"
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Backend port 8000 in use | `netstat -an \| findstr 8000` then kill the process |
| Frontend cache issues | `npx expo start --clear` |
| Phone can't reach local backend | Make sure phone and PC are on the same Wi-Fi |
| Gemini returns 429 | Wait 30–60 seconds (free tier rate limit) |
| Render backend slow first response | First request after 15 min sleep takes ~30 sec — normal |
