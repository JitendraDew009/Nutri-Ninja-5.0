# Build Setup

> Full details in [README.md](README.md)

## Build Android APK (EAS Cloud Build)

Open **Command Prompt** on Windows:

```cmd
set NODE_TLS_REJECT_UNAUTHORIZED=0
cd "Nutri Ninja 5.0\frontend"
eas login
eas build -p android --profile preview
```

- Requires free Expo account at expo.dev
- Build takes ~10–15 minutes on EAS cloud
- A download link for the `.apk` is printed when done

## Local Development

**Backend:**
```cmd
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```cmd
cd frontend
npx expo start
```

Set `EXPO_PUBLIC_BACKEND_URL=http://YOUR_PC_IP:8000` in `frontend/.env`.

## Backend Deployment (Render.com)

Live at: `https://nutri-ninja-5-0.onrender.com`

Render settings:
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env vars: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-1.5-flash`

## Verification

```cmd
cd frontend
npx tsc --noEmit
```

```cmd
cd backend
venv\Scripts\python.exe -m py_compile app\main.py
```
