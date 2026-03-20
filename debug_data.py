import os
import glob
import cv2
import numpy as np

DATA_DIR = 'data'
IMG_SIZE = 48

print("=" * 60)
print("DATASET VALIDATION")
print("=" * 60)

for split in ['train', 'test']:
    print(f"\n[{split.upper()}]")
    split_path = os.path.join(DATA_DIR, split)
    
    class_dirs = sorted([d for d in os.listdir(split_path) 
                        if os.path.isdir(os.path.join(split_path, d))])
    
    print(f"Classes found: {class_dirs}")
    
    for class_name in class_dirs:
        class_path = os.path.join(split_path, class_name)
        img_files = glob.glob(os.path.join(class_path, '*'))
        img_files = [f for f in img_files if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        valid_count = 0
        invalid_count = 0
        
        for img_file in img_files[:5]:  # Check first 5
            try:
                img = cv2.imread(img_file, cv2.IMREAD_GRAYSCALE)
                if img is None:
                    invalid_count += 1
                else:
                    h, w = img.shape
                    if h == IMG_SIZE and w == IMG_SIZE:
                        valid_count += 1
                    else:
                        print(f"  ⚠ {class_name}: Image size mismatch {h}x{w} (expected {IMG_SIZE}x{IMG_SIZE})")
            except Exception as e:
                invalid_count += 1
                print(f"  ✗ Error loading {img_file}: {e}")
        
        print(f"  {class_name}: {len(img_files)} images | Sampled valid: {valid_count}/{min(5, len(img_files))}")

print("\n" + "=" * 60)
