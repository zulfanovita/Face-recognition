from ultralytics import YOLO
import io
import cv2
import numpy as np
import os

# === Gunakan model YOLO custom (jika ada) ===
MODEL_PATH = "app/best_new.pt"
if not os.path.exists(MODEL_PATH):
    print("[INFO] ⚠️ best_new.pt tidak ditemukan, menggunakan model default YOLOv8n.")
    MODEL_PATH = "yolov8n.pt"

print(f"[INFO] ✅ Menggunakan model: {MODEL_PATH}")
yolo_model = YOLO(MODEL_PATH)

def detect_faces_yolo(image_bytes):
    """Deteksi wajah hanya dengan YOLO (tanpa Face Recognition dulu)."""
    np_image = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_image, cv2.IMREAD_COLOR)

    # Jalankan deteksi dengan YOLO
    results = yolo_model(frame)

    detected_names = []

    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            try:
                name = result.names[int(box.cls[0])]
            except Exception:
                name = "Unknown"

            detected_names.append(name)

            # Gambar bounding box & nama
            color = (0, 255, 0)
            label = f"{name} ({conf:.2f})"
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 3)
            cv2.rectangle(frame, (x1, y1 - th - 10), (x1 + tw + 5, y1), color, -1)
            cv2.putText(
                frame,
                label,
                (x1 + 2, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 0),
                2,
                cv2.LINE_AA,
            )

    # Encode hasil gambar ke bytes
    _, buffer = cv2.imencode(".jpg", frame)
    return io.BytesIO(buffer), detected_names
