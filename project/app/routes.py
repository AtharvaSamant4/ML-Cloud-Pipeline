import uuid
import os
import requests
from fastapi import APIRouter, UploadFile, File, Path
from app.schemas import HealthResponse, AnalyzeResponse, ResultResponse
from app.services import upload_to_cloudinary, create_job, get_job

router = APIRouter()

INFERENCE_URL = os.getenv("INFERENCE_URL", "http://localhost:8001/infer")

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok"}

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_image(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    image_url = upload_to_cloudinary(file, job_id)
    
    job = create_job(job_id, image_url)
    
    try:
        requests.post(INFERENCE_URL, json={
            "job_id": job_id,
            "image_url": image_url
        }, timeout=5)
    except Exception:
        pass
        
    return {"job_id": job_id, "status": job.status, "image_url": image_url}

@router.get("/results/{job_id}", response_model=ResultResponse)
async def get_results(job_id: str = Path(..., title="The ID of the job to retrieve results for")):
    job = get_job(job_id)
    return {
        "job_id": job.job_id,
        "status": job.status,
        "image_url": job.image_url,
        "detected_objects": job.detected_objects,
        "confidence_scores": job.confidence_scores
    }
