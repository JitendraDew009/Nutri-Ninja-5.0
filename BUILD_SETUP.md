# Nutri Ninja 5.0 - Build Setup Guide

## Prerequisites

- Node.js v18 or newer
- npm
- Python 3.9 or newer

## Automated Setup

Windows:

```powershell
.\build-setup.ps1
```

macOS/Linux:

```bash
bash build-setup.sh
```

## Manual Setup

Backend:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run web
```

## URLs

- Frontend: http://localhost:8081
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

## Implemented API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | API status |
| GET | `/product/{barcode}` | Fetch product from Open Food Facts |
| GET | `/search?query=` | Search products |
| POST | `/analyze` | Generate health score, Nutri-Score, warnings and profile insights |
| POST | `/recommendations` | Rank better and worse similar foods |
| POST | `/label/analyze` | Analyze ingredient label text |
| POST | `/user/profile/{user_id}` | Save profile |
| GET | `/user/profile/{user_id}` | Load profile |
| GET | `/history` | Return backend scan history |

## Verification

Frontend:

```powershell
cd frontend
.\node_modules\.bin\tsc.cmd --noEmit
```

Backend:

```powershell
cd backend
.\venv\Scripts\python.exe -m py_compile app\main.py
```

## Final UI Screens

- Scan: barcode scanner, manual barcode entry, product search, suggestions and feature checklist.
- History: scanned product history with health scores and add-to-basket action.
- Profile: name, age, weight, health goal and allergies.
- More: grocery basket analysis, comparison, calorie tracking, meal planner, voice assistant and OCR label reading.

## Notes

MongoDB Atlas and Redis are represented locally with in-memory storage for demonstration. The API boundaries are already prepared for replacing those stores with production services.
