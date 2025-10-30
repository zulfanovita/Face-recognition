import io
import os
import pickle
import face_recognition
from fastapi import FastAPI,File, UploadFile, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from .database import Base, engine, SessionLocal
from .models import Face
from fastapi.responses import JSONResponse
import base64
from .face_utils import detect_faces_yolo  # ✅ hanya fungsi yang ada

app = FastAPI(title="Face Recognition System (YOLO + FaceRecog)")

# Buat tabel database otomatis
Base.metadata.create_all(bind=engine)

# Serve folder frontend
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Route default (root)
@app.get("/")
def serve_homepage():
    return FileResponse(os.path.join("frontend", "index.html"))

# ----------------- API BAGIAN -----------------

@app.get("/api/face")
def get_faces():
    db = SessionLocal()
    faces = db.query(Face).all()
    return [{"id": f.id, "name": f.name} for f in faces]


# ✅ Versi sederhana: Register wajah (belum pakai encoding karena fokus ke YOLO)
@app.post("/api/face/register")
async def register_face(name: str = Form(...), file: UploadFile = None):
    db = SessionLocal()
    image_bytes = await file.read()

    # Simpan placeholder encoding (belum proses detail)
    face_data = Face(name=name, encoding=pickle.dumps(b"placeholder"))
    db.add(face_data)
    db.commit()
    return {"message": f"Face {name} registered successfully"}


# ✅ Versi deteksi bounding box pakai YOLO
@app.post("/api/face/detect/yolo")
async def detect_face_yolo(file: UploadFile = File(...)):
    image_bytes = await file.read()
    result_image, detected_names = detect_faces_yolo(image_bytes)

    # Konversi hasil ke base64 untuk dikirim via JSON
    image_base64 = base64.b64encode(result_image.getvalue()).decode("utf-8")

    return JSONResponse({
        "image": image_base64,
        "names": detected_names
    })

# ✅ Endpoint sementara nonaktif (supaya gak error)
@app.post("/api/face/recognize/image")
async def recognize_face_with_image(file: UploadFile):
    raise HTTPException(
        status_code=501,
        detail="Endpoint ini belum aktif. Gunakan /api/face/detect/yolo untuk deteksi wajah."
    )

# @app.delete("/api/face/{face_id}")
# def delete_face(face_id: int):
#     db = SessionLocal()
#     face = db.query(Face).filter(Face.id == face_id).first()
#     if not face:
#         raise HTTPException(status_code=404, detail="Face not found")
#     db.delete(face)
#     db.commit()
#     return {"message": f"Face with ID {face_id} deleted"}

@app.delete("/api/face/{face_id}")
def delete_face (face_id: int):
    print(f"[DEBUG] Menerima request hapus ID: {face_id}")  # 🪵 log bantu debug
    db = SessionLocal()
    face = db.query(Face).filter(Face.id == face_id).first()
    if not face:
        raise HTTPException(status_code=404, detail="Face not found")
    db.delete(face)
    db.commit()
    return {"message": f"Face '{face.name}' deleted successfully"}
