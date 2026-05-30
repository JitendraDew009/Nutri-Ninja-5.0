# Nutri Ninja - Start Services

## Windows (PowerShell)

### 1. Start Backend Server
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Start Frontend (in new PowerShell window)

```powershell
cd frontend
npm run web
```

---

## macOS / Linux (Bash)

### 1. Start Backend Server
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Start Frontend (in new terminal)

```bash
cd frontend
npm run web
```

---

## Quick URL References

Once both are running:

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:8000 | API endpoint |
| API Documentation | http://localhost:8000/docs | Interactive Swagger UI |
| ReDoc | http://localhost:8000/redoc | Alternative API docs |
| Frontend (Expo Web) | http://localhost:8081 | Web version of app |

---

## Testing API Endpoints

Using curl (or Postman):

```bash
# Test home endpoint
curl http://localhost:8000/

# Test product lookup
curl http://localhost:8000/product/5000112126957

# Search products
curl "http://localhost:8000/search?query=bread"

# Analyze ingredient label text
curl -X POST http://localhost:8000/label/analyze -H "Content-Type: application/json" -d "{\"text\":\"whole wheat, sugar, sodium benzoate\",\"allergies\":\"\"}"
```

---

## Troubleshooting

**Backend won't start:**
- Check port 8000 is not in use: `netstat -an | findstr 8000` (Windows) or `lsof -i :8000` (Mac/Linux)
- Use different port: `uvicorn app.main:app --reload --port 8001`

**Frontend won't start:**
- Clear cache: `npm run reset-project`
- Reinstall: `rm -r node_modules package-lock.json && npm install`

**API connection timeout:**
- Ensure backend is running
- Check firewall/antivirus isn't blocking port 8000
- Verify API URL in frontend is correct

