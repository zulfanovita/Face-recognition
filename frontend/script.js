const API_URL = "http://127.0.0.1:8000/api";
const video = document.getElementById("camera");
const canvas = document.getElementById("snapshot");
const captureBtn = document.getElementById("captureBtn");
const outputImg = document.getElementById("outputImage");

// ================= REGISTER FACE =================
async function registerFace() {
  const name = document.getElementById("registerName").value;
  const fileInput = document.getElementById("registerFile");
  const resultEl = document.getElementById("registerResult");

  if (!name || !fileInput.files.length) {
    resultEl.textContent = "Please enter a name and select a photo.";
    resultEl.style.color = "red";
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch(`${API_URL}/face/register`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      resultEl.textContent = data.message;
      resultEl.style.color = "green";

      // ✅ Hapus pesan setelah 3 detik
      setTimeout(() => {
        resultEl.textContent = "";
      }, 3000);

      // ✅ Kosongkan input setelah sukses
      document.getElementById("registerName").value = "";
      document.getElementById("registerFile").value = "";
    } else {
      resultEl.textContent = data.detail || "Failed to register face.";
      resultEl.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    resultEl.textContent = "Error connecting to server.";
    resultEl.style.color = "red";
  }
}

// ================= YOLO DETECTION =================
async function detectFaceYolo() {
  const file = document.getElementById("recognizeFile").files[0];
  if (!file) return alert("Please select an image!");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://127.0.0.1:8000/api/face/detect/yolo", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      alert("Detection failed");
      return;
    }

    const data = await res.json();
    const img = document.getElementById("outputImage");
    const namesEl = document.getElementById("detected-names");

    // 🖼️ Tampilkan gambar hasil deteksi
    img.src = "data:image/jpeg;base64," + data.image;
    img.style.display = "block";

    // 🧠 Tampilkan nama-nama wajah yang terdeteksi
    if (data.names && data.names.length > 0) {
      // Gabungkan semua nama jadi satu string, tanpa tanda kurung atau koma aneh
      const cleanNames = data.names.map(n => n.trim()).join(", ");
      namesEl.innerText = `Detected: ${cleanNames}`;
    } else {
      namesEl.innerText = "No known faces detected.";
    }

    document.getElementById("recognizeResult").innerText = "YOLO detection result below.";
  } catch (err) {
    console.error("Error during detection:", err);
    alert("Error connecting to server.");
  }
}

// ================= RECOGNITION (FaceRecog lama) =================
async function recognizeFace() {
  const file = document.getElementById("recognizeFile").files[0];
  if (!file) return alert("Please select an image!");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/face/recognize/image`, {
    method: "POST",
    body: formData,
  });

  const blob = await res.blob();
  outputImg.src = URL.createObjectURL(blob);
  outputImg.style.display = "block";
  document.getElementById("recognizeResult").innerText =
    "Detected faces with bounding boxes shown below.";
}

// ================= CAMERA =================
async function startCamera() {
  const video = document.getElementById("camera");
  video.style.display = "block";

  await navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    });

  await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri("/models")]);

  video.addEventListener("play", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
      );
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
    }, 200);
  });
}

// ================= CAPTURE =================
function capturePhoto() {
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(uploadCapturedImage, "image/jpeg");
}

async function uploadCapturedImage(blob) {
  const formData = new FormData();
  formData.append("file", blob);

  const res = await fetch(`${API_URL}/face/recognize/image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    alert("No face detected or server error");
    return;
  }

  const blobRes = await res.blob();
  const outputImg = document.getElementById("outputImage");
  outputImg.src = URL.createObjectURL(blobRes);
  outputImg.style.display = "block";
  document.getElementById("recognizeResult").innerText =
    "Detected faces from camera image.";
}

// ================= GET ALL FACES =================
async function getAllFaces() {
  const res = await fetch(`${API_URL}/face`);
  const faces = await res.json();
  const list = document.getElementById("faceList");
  list.innerHTML = "";

  if (faces.length === 0) {
    const li = document.createElement("li");
    li.innerText = "Belum ada wajah terdaftar.";
    list.appendChild(li);
    return;
  }

  faces.forEach((f) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    li.innerHTML = `
      <span>${f.name}</span>
      <button class="delete-btn" onclick="deleteFace(${f.id})" title="Hapus ${f.name}">
        <span class="material-icons">delete</span>
      </button>
    `;
    list.appendChild(li);
  });
}

async function deleteFace(id) {
  if (!confirm("Are you sure you want to delete this face?")) return;

  try {
    const res = await fetch(`${API_URL}/face/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (res.ok) {
      alert(`✅ ${data.message}`);
      getAllFaces(); // refresh daftar
    } else {
      alert(`❌ ${data.detail || "Failed to delete face"}`);
    }
  } catch (err) {
    console.error(err);
    alert("Server error while deleting face");
  }
}
