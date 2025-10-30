## Overview
An end-to-end face recognition system using FastAPI, PostgreSQL, and pre-trained deep learning models.

## Features
- Face Detection and Feature Extraction using `face_recognition`
- Face Matching against stored encodings
- REST API for managing faces
- Docker support

## Endpoints
| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/face` | GET | Get all registered faces |
| `/api/face/register` | POST | Register new face |
| `/api/face/recognize` | POST | Recognize a face |
| `/api/face/{id}` | DELETE | Delete a face by ID |

## Run Locally
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload