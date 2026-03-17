# EmoSense AI — Frontend-Backend Connection Guide

## ❌ Issues Found & Fixed

### 1. **Frontend Opened as `file://` Protocol**
**Problem:** Browsers block CORS requests when opening HTML directly (`file://` protocol)
**Solution:** Serve frontend via HTTP through Flask server

### 2. **CORS Configuration Weak**
**Problem:** CORS headers not properly configured for content negotiation
**Solution:** ✅ Updated backend with explicit CORS headers

### 3. **No Error Logging**
**Problem:** API errors were silently logged, making debugging impossible
**Solution:** ✅ Added detailed console logging for all API calls and failures

### 4. **Health Check Timeout Too Short**
**Problem:** 2000ms timeout could fail on slower connections
**Solution:** ✅ Increased to 5000ms for better reliability

### 5. **Silent Fallback to Demo Mode**
**Problem:** If API failed, frontend silently switched to demo without notifying user
**Solution:** ✅ Added error messages and console warnings

---

## ✅ How to Run (Step-by-Step)

### **Step 1: Activate Virtual Environment**
```bash
# Navigate to project folder (already should be D:\Project\EmoSense-AI-temp)
cd d:\Project\EmoSense-AI-temp

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# You should see (venv) in your terminal
```

### **Step 2: Install Dependencies**
```bash
pip install -r requirements.txt
```

### **Step 3: Start Flask Backend Server**
```bash
# While in the project root and venv activated
python backend/app.py

# You should see:
# ╔══════════════════════════════════════════╗
# ║    EmoSense AI — Flask Server            ║
# ╠══════════════════════════════════════════╣
# ║  API  → http://localhost:5000            ║
# ║  Open index.html in your browser         ║
# ╚══════════════════════════════════════════╝
```

### **Step 4: Open Frontend in Browser**
**Option A: Serve via Flask (Recommended)**
```bash
# In a NEW terminal (keep Flask running in first terminal)
cd d:\Project\EmoSense-AI-temp
python -m http.server 8000

# Then open: http://localhost:8000/frontend/index.html
```

**Option B: Serve via VS Code Live Server Extension**
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. This opens at `http://localhost:5500/` (or similar)

**❌ DO NOT do this:**
- Don't double-click `index.html` to open as `file://`
- Don't use `python -m http.server` to serve from root if Flask is on 5000

---

## 🔍 Verify Connection is Working

### In Browser Console (Press F12)
You should see messages like:

```
[✓] Flask API connected successfully
✓ Frontend Version: 1.0 | Last Updated: 2026-03-17
```

If you see:
```
[✗] Flask API connection failed: ...
[!] Model not loaded...
```

Then Flask is **not running** or **not accessible**.

---

## 🎯 Checklist Before Using Detection

- [ ] Flask backend server is running (`python backend/app.py`)
- [ ] Console shows `Flask API ✓` (green status indicator)
- [ ] Frontend is opened via `http://localhost:...` (NOT `file://`)
- [ ] `emotion_model.h5` exists in `src/` folder
- [ ] You see green "Flask API ✓" badge in top-right (not "Demo Mode")

---

## 🐛 Troubleshooting

### **Issue: "Demo Mode" appears instead of "Flask API ✓"**
```
Reasons:
1. Flask server not running → Run: python backend/app.py
2. Port 5000 already in use → Kill process or change port
3. Opening as file:// → Use http://localhost:... instead
4. Model missing → Check src/emotion_model.h5 exists
5. CORS error → Check browser console (F12)
```

### **Issue: Camera permission denied**
```
Solution:
1. Browser → Settings → Privacy → Camera → Allow this site
2. Or use a different browser
```

### **Issue: "No image provided" error from API**
```
Solution:
1. Check canvas drawing is working (should see face boxes)
2. Check browser console for JavaScript errors
3. Try different camera/lighting
```

### **Issue: Flask won't start / ModuleNotFoundError**
```
Solution:
1. Make sure venv is activated: .\venv\Scripts\Activate.ps1
2. Install tensorflow: pip install tensorflow
3. Check Python version: python --version (should be 3.8+)
```

---

## 📊 Code Changes Made

### Backend (`backend/app.py`)
```python
# ❌ OLD
CORS(app)

# ✅ NEW
CORS(app, resources={
    r"/*": {
        "origins": "*", 
        "methods": ["GET", "POST", "OPTIONS"], 
        "allow_headers": ["Content-Type"]
    }
})
```

### Frontend (`frontend/app.js`)
- ✅ Increased health check timeout from 2s to 5s
- ✅ Added `Content-Type` header to health check
- ✅ Added detailed error logging for API calls
- ✅ Improved error messages in console
- ✅ Better error handling in `runFrame()`
- ✅ Added startup logs with setup instructions

---

## 🚀 Expected Behavior After Fix

1. **Open frontend** → Browser console shows setup instructions
2. **Check connection** → Green "Flask API ✓" appears (if Flask running)
3. **Click "Start Detection"** → Camera feed appears
4. **Faces detected** → Shows emotion with confidence & bounding boxes
5. **Stats update** → Emotion counts and charts update in real-time
6. **Demo mode warning** → If Flask not running, shows warning banner

---

## 📞 Need More Help?

Check:
1. Browser Console (F12 → Console tab) for error messages
2. Flask terminal for backend errors  
3. Network tab (F12 → Network) to see actual API requests
