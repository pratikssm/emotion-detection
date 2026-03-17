# EmoSense AI — Facial Emotion Recognition System

> A full-stack AI web application that detects and classifies 7 human facial emotions in real time using a CNN trained on FER2013 dataset.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Python](https://img.shields.io/badge/python-3.8+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Features

✅ **Real-Time Emotion Detection** — Detect 7 emotions (Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise) from webcam feed  
✅ **Deep CNN Model** — Trained on 35,887+ images from FER2013 dataset  
✅ **Live Analytics** — Confidence scores, session history, emotion distribution charts  
✅ **Full-Stack Python** — Flask REST API + HTML5/CSS3/JavaScript frontend  
✅ **No Cloud Required** — Runs entirely on your machine  
✅ **Beautiful UI** — Modern glassmorphism design with animations  

---

## � Project Showcase

![EmoSense AI - About Page](images/emosense-ui.png)

*Beautiful and intuitive interface showing system architecture, supported emotions, and technologies used.*

---

## �📋 Technology Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Python 3.8+ • Flask • TensorFlow/Keras |
| **Frontend** | HTML5 • CSS3 • Vanilla JavaScript • Chart.js |
| **ML Model** | CNN (Convolutional Neural Network) • OpenCV |
| **Database** | SQLite3 |
| **Security** | bcrypt (password hashing) |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Git
- Webcam (for emotion detection)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/EmoSense-AI.git
   cd EmoSense-AI
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   .\venv\Scripts\Activate.ps1
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Train the model (if emotion_model.h5 doesn't exist)**
   ```bash
   python src/train_model.py
   ```
   > Downloads FER2013 dataset (~150MB) and trains CNN (~5-10 minutes on GPU, longer on CPU)

5. **Start Flask backend**
   ```bash
   python backend/app.py
   ```
   Server runs at `http://localhost:5000`

6. **Serve frontend** (New terminal)
   ```bash
   python -m http.server 8000
   ```
   Open in browser: `http://localhost:8000/frontend/index.html`

---

## 📁 Project Structure

```
EmoSense-AI/
├── backend/
│   └── app.py              # Flask REST API with emotion detection
│
├── frontend/
│   ├── index.html          # Main UI
│   ├── app.js              # JavaScript logic (API calls, animations)
│   └── css/
│       └── style.css       # Modern glassmorphism styling
│
├── src/
│   ├── train_model.py      # CNN training script
│   └── emotion_model.h5    # Trained model (generated after training)
│
├── data/                   # FER2013 dataset (auto-downloaded on train)
│   ├── train/              # 28,709 training images (7 emotions)
│   └── test/               # 7,178 test images
│
├── requirements.txt        # Python dependencies
├── .gitignore             # Files to exclude from Git
└── README.md              # This file
```

---

## 🎓 How It Works

### 1. **Frontend → Backend**
- Captures video frames from webcam
- Sends frame as base64-encoded JPEG to Flask API
- API response includes emotion label + confidence scores

### 2. **Backend Prediction**
- Detects face(s) using OpenCV Haar Cascade
- Preprocesses face to 48×48 grayscale
- Runs CNN inference (< 50ms per face)
- Returns JSON with emotion + confidence for 7 classes

### 3. **Real-Time Display**
- Draws bounding box around faces with emotion label
- Updates confidence bars for all 7 emotions
- Logs detection to session history
- Updates pie chart with emotion distribution

---

## 🔧 API Endpoints

### Health Check
**GET** `/health`
```json
{ "status": "running", "model_ready": true }
```

### Predict Emotion
**POST** `/predict`
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "faces": [
    {
      "emotion": "Happy",
      "confidence": 0.9234,
      "scores": {
        "Angry": 0.0012,
        "Disgust": 0.0001,
        "Fear": 0.0003,
        "Happy": 0.9234,
        "Neutral": 0.0601,
        "Sad": 0.0121,
        "Surprise": 0.0028
      },
      "box": {"x": 100, "y": 150, "w": 180, "h": 200}
    }
  ]
}
```

---

## 🐛 Troubleshooting

### **Flask not starting: ModuleNotFoundError**
```bash
# Make sure venv is activated
.\venv\Scripts\Activate.ps1   # Windows
source venv/bin/activate       # macOS/Linux

# Install missing package
pip install tensorflow
```

### **Frontend shows "Demo Mode" instead of "Flask API ✓"**
- Flask server not running → Start it: `python backend/app.py`
- Port 5000 already in use → Kill process or change port in `frontend/app.js` (line 8)
- CORS error → Check browser console (F12) for details

### **Camera permission denied**
- Browser → Settings → Privacy → Camera → Allow this site

### **Model file not found**
```bash
# Train the model
python src/train_model.py
```

See **FRONTEND_BACKEND_FIX.md** for detailed debugging steps.

---

## 📊 Model Architecture

**Input:** 48×48 grayscale image  
**Layers:**
- Conv2D(64, 3×3) → ReLU → MaxPool(2×2)
- Conv2D(128, 3×3) → ReLU → MaxPool(2×2)
- Conv2D(128, 3×3) → ReLU → MaxPool(2×2)
- Conv2D(64, 3×3) → ReLU → MaxPool(2×2)
- Flatten → Dense(1024, ReLU) → Dropout(0.5)
- Dense(512, ReLU) → Dropout(0.5)
- Dense(7, Softmax) → **Output probabilities for 7 emotions**

**Training:**
- Dataset: FER2013 (Facial Expression Recognition)
- Images: 35,887 (training) + 7,178 (test)
- Accuracy: ~65-72% (depends on image quality)
- Time: ~5-10 minutes (GPU) or ~30-60 minutes (CPU)

---

## 📈 Usage Example

1. **Open frontend** at `http://localhost:8000/frontend/index.html`
2. **Click "Detection"** tab
3. **Allow camera access** when prompted
4. **Click "Start Detection"** button
5. **Face your camera** — emotions detected in real-time
6. **Download report** to save session statistics

---

## 🎨 Customization

### Change API URL
Edit `frontend/app.js` line 8:
```javascript
const API_URL = 'http://localhost:5000/predict';
```

### Change theme colors
Edit `frontend/app.js` lines 34-47 (color constants)

### Retrain model
Edit `src/train_model.py` for different hyperparameters, then:
```bash
python src/train_model.py
```

---

## 📝 What Gets Ignored from GitHub

The `.gitignore` file excludes:
- `venv/` — Virtual environment (recreate with `python -m venv venv`)
- `emotion_model.h5` — Large ML model (regenerate with `python src/train_model.py`)
- `data/train/` & `data/test/` — Dataset (auto-downloaded during training)
- `users.db` — User database (created locally)
- `activity_log.txt` — Log files
- `__pycache__/` — Python cache
- `.vscode/` — IDE settings

---

## ⬇️ Setup After Cloning

When someone clones this repo, they should run:
```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate it
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Train model (downloads dataset & trains)
python src/train_model.py

# 5. Start Flask
python backend/app.py

# 6. Start frontend server (new terminal)
python -m http.server 8000
```
Then open `http://localhost:8000/frontend/index.html`

---

## 📄 Files Structure for GitHub

### ✅ **PUSH TO GITHUB:**
```
backend/app.py
frontend/index.html
frontend/app.js
frontend/css/style.css
src/train_model.py
requirements.txt
README.md
.gitignore
SETUP_GUIDE.txt
FRONTEND_BACKEND_FIX.md
```

### ❌ **DO NOT PUSH:**
```
venv/                    (too large, machine-specific)
emotion_model.h5         (too large ~10-50MB)
data/train/              (too large ~1GB+)
data/test/               (too large ~200MB+)
users.db                 (database, sensitive)
activity_log.txt         (log files)
__pycache__/             (Python cache)
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License — see LICENSE file for details.

---

## 👨‍💻 Author

**Created:** March 2026  
**Project:** EmoSense AI — Facial Emotion Recognition System  
**Status:** ✅ Active & Maintained

---

## 🎯 Future Enhancements

- [ ] Multi-face emotion averaging
- [ ] Real-time emotion intensity graph
- [ ] User authentication system
- [ ] Cloud deployment (AWS/Google Cloud)
- [ ] Mobile app (React Native)
- [ ] Additional emotion classes

---

## ❓ FAQ

**Q: Why is emotion_model.h5 not in the repo?**  
A: The trained model is ~10-50MB and shouldn't be stored in Git. Train it locally with `python src/train_model.py`.

**Q: Can I use this with pre-recorded videos?**  
A: Currently supports webcam only. Modify `frontend/app.js` to load video files instead.

**Q: How accurate is the model?**  
A: ~65-72% accuracy on test set, varies by image quality and lighting.

**Q: Can I deploy this online?**  
A: Yes! Docker instructions and cloud deployment guides coming soon.

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check `FRONTEND_BACKEND_FIX.md` for troubleshooting
- Review `SETUP_GUIDE.txt` for detailed setup steps

---

**Happy emotion detection! 😊**
