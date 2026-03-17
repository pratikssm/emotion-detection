# ═══════════════════════════════════════════════════════════════
# EmoSense AI — backend/app.py
# Flask REST API for facial emotion detection
# ═══════════════════════════════════════════════════════════════

import os
import cv2
import numpy as np
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})   # Allow requests from the frontend

# ── Load model & Haar Cascade ──────────────────────────────────
MODEL_PATH   = os.path.join(os.path.dirname(__file__), '..', 'src', 'emotion_model.h5')
CASCADE_PATH = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'

model        = None
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']

# Try to load model at startup
try:
    from tensorflow import keras
    if os.path.exists(MODEL_PATH):
        model = keras.models.load_model(MODEL_PATH)
        print(f"[✓] Model loaded from {MODEL_PATH}")
    else:
        print(f"[!] Model not found at {MODEL_PATH} — train first: python src/train_model.py")
except Exception as e:
    print(f"[!] Could not load TensorFlow/model: {e}")


# ── HEALTH CHECK ───────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':      'running',
        'model_ready': model is not None
    })


# ── PREDICT ────────────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'success': False, 'error': 'Model not loaded', 'count': 0, 'faces': []})

    data = request.json
    if not data or 'image' not in data:
        return jsonify({'success': False, 'error': 'No image provided', 'count': 0, 'faces': []})

    try:
        # ── Decode base64 image ──────────────────────
        img_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
        img_bytes = base64.b64decode(img_data)
        np_arr    = np.frombuffer(img_bytes, dtype=np.uint8)
        frame     = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({'success': False, 'error': 'Invalid image', 'count': 0, 'faces': []})

        # ── Detect faces ─────────────────────────────
        gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(48, 48))

        results = []

        for (x, y, w, h) in faces:
            # Preprocess face ROI for model
            roi        = gray[y:y+h, x:x+w]
            roi_resize = cv2.resize(roi, (48, 48))
            roi_norm   = roi_resize.astype('float32') / 255.0
            roi_input  = roi_norm.reshape(1, 48, 48, 1)

            # Predict
            preds  = model.predict(roi_input, verbose=0)[0]
            idx    = int(np.argmax(preds))
            scores = {label: float(round(float(preds[i]), 4)) for i, label in enumerate(EMOTION_LABELS)}

            results.append({
                'emotion':    EMOTION_LABELS[idx],
                'confidence': float(round(float(preds[idx]), 4)),
                'scores':     scores,
                'box':        {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)}
            })

        return jsonify({'success': True, 'count': len(results), 'faces': results})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e), 'count': 0, 'faces': []})


# ── SERVE FRONTEND (Optional) ──────────────────────────────────
# Uncomment this if you want Flask to also serve index.html directly
#
# from flask import send_from_directory
# @app.route('/')
# def index():
#     return send_from_directory('../frontend', 'index.html')
# @app.route('/<path:path>')
# def static_files(path):
#     return send_from_directory('../frontend', path)


if __name__ == '__main__':
    print("\n╔══════════════════════════════════════╗")
    print("║    EmoSense AI — Flask Server        ║")
    print("╠══════════════════════════════════════╣")
    print("║  API  → http://localhost:5000        ║")
    print("║  Open index.html in your browser     ║")
    print("╚══════════════════════════════════════╝\n")
    app.run(host='0.0.0.0', port=5000, debug=True)