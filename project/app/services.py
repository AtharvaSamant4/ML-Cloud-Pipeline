import uuid
import os
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from app.schemas import SessionLocal, Job

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_to_cloudinary(file: UploadFile, job_id: str) -> str:
    allowed_extensions = {"jpg", "jpeg", "png"}
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")
        
    ext = file.filename.split(".")[-1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only jpg, jpeg, and png files are allowed")

    public_id = f"jobs/{job_id}/original"
    
    try:
        file_bytes = file.file.read()
        response = cloudinary.uploader.upload(
            file_bytes,
            public_id=public_id,
            resource_type="image"
        )
        return response.get("secure_url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    finally:
        file.file.close()

def create_job(job_id: str, image_url: str):
    db = SessionLocal()
    try:
        new_job = Job(
            job_id=job_id,
            status="queued",
            image_url=image_url,
            detected_objects=[],
            confidence_scores=[]
        )
        db.add(new_job)
        db.commit()
        db.refresh(new_job)
        return new_job
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        db.close()

def get_job(job_id: str):
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.job_id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        db.close()
