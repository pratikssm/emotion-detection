# ═══════════════════════════════════════════════════════════════
# EmoSense AI — src/train_model.py
# CNN model training on FER2013 dataset
# ═══════════════════════════════════════════════════════════════
# 
# BEFORE RUNNING:
#   1. Download FER2013 from: https://www.kaggle.com/datasets/msambare/fer2013
#   2. Extract so folder looks like:
#      data/
#        train/
#          angry/    disgust/    fear/
#          happy/    neutral/    sad/    surprise/
#        test/
#          (same folders)
#   3. Run: python src/train_model.py
#
# Output: src/emotion_model.h5
# ═══════════════════════════════════════════════════════════════

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# ── CONFIG ────────────────────────────────────────────────────
IMG_SIZE    = 48          # FER2013 images are 48×48
BATCH_SIZE  = 64
EPOCHS      = 50
NUM_CLASSES = 7
DATA_DIR    = os.path.join(os.path.dirname(__file__), '..', 'data')
MODEL_PATH  = os.path.join(os.path.dirname(__file__), 'emotion_model.h5')

# ── DATA GENERATORS ───────────────────────────────────────────
print("[1/4] Loading dataset from:", DATA_DIR)

train_datagen = ImageDataGenerator(
    rescale          = 1./255,
    rotation_range   = 15,
    width_shift_range= 0.1,
    height_shift_range=0.1,
    horizontal_flip  = True,
    zoom_range       = 0.1
)
val_datagen = ImageDataGenerator(rescale=1./255)

train_gen = train_datagen.flow_from_directory(
    os.path.join(DATA_DIR, 'train'),
    target_size  = (IMG_SIZE, IMG_SIZE),
    color_mode   = 'grayscale',
    batch_size   = BATCH_SIZE,
    class_mode   = 'categorical',
    shuffle      = True
)
val_gen = val_datagen.flow_from_directory(
    os.path.join(DATA_DIR, 'test'),
    target_size  = (IMG_SIZE, IMG_SIZE),
    color_mode   = 'grayscale',
    batch_size   = BATCH_SIZE,
    class_mode   = 'categorical',
    shuffle      = False
)

print(f"  Train samples : {train_gen.samples}")
print(f"  Val   samples : {val_gen.samples}")
print(f"  Classes       : {list(train_gen.class_indices.keys())}")

# ── BUILD CNN ─────────────────────────────────────────────────
print("\n[2/4] Building CNN model...")

model = keras.Sequential([
    # Block 1
    layers.Conv2D(64, (3,3), padding='same', activation='relu', input_shape=(IMG_SIZE, IMG_SIZE, 1)),
    layers.BatchNormalization(),
    layers.Conv2D(64, (3,3), padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D(2,2),
    layers.Dropout(0.25),

    # Block 2
    layers.Conv2D(128, (3,3), padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.Conv2D(128, (3,3), padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D(2,2),
    layers.Dropout(0.25),

    # Block 3
    layers.Conv2D(256, (3,3), padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.Conv2D(256, (3,3), padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D(2,2),
    layers.Dropout(0.25),

    # Classifier
    layers.Flatten(),
    layers.Dense(512, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.5),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(NUM_CLASSES, activation='softmax')
])

model.compile(
    optimizer = keras.optimizers.Adam(learning_rate=0.001),
    loss      = 'categorical_crossentropy',
    metrics   = ['accuracy']
)
model.summary()

# ── CALLBACKS ─────────────────────────────────────────────────
callbacks = [
    keras.callbacks.ModelCheckpoint(
        MODEL_PATH, monitor='val_accuracy',
        save_best_only=True, verbose=1
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss', factor=0.5,
        patience=5, min_lr=1e-6, verbose=1
    ),
    keras.callbacks.EarlyStopping(
        monitor='val_accuracy', patience=10,
        restore_best_weights=True, verbose=1
    )
]

# ── TRAIN ─────────────────────────────────────────────────────
print(f"\n[3/4] Training for up to {EPOCHS} epochs...")
history = model.fit(
    train_gen,
    validation_data = val_gen,
    epochs          = EPOCHS,
    callbacks       = callbacks,
    verbose         = 1
)

# ── EVALUATE ──────────────────────────────────────────────────
print("\n[4/4] Evaluating on test set...")
loss, acc = model.evaluate(val_gen, verbose=0)
print(f"  Test Loss     : {loss:.4f}")
print(f"  Test Accuracy : {acc*100:.2f}%")
print(f"\n[✓] Model saved to: {MODEL_PATH}")
print("    Now run: python backend/app.py")