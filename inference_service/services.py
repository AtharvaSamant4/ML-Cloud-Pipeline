import os
import uuid
import requests
from ultralytics import YOLO
from sqlalchemy import create_engine, Column, String, DateTime, JSON
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Job(Base):
    __tablename__ = "jobs"
    job_id = Column(String, primary_key=True, index=True)
    status = Column(String)
    image_url = Column(String)
    detected_objects = Column(JSON, default=list)
    confidence_scores = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

model = YOLO("yolov5s.pt")

def start_inference(job_id: str, image_url: str):
    db = SessionLocal()
    tmp_path = None
    try:
        job = db.query(Job).filter(Job.job_id == job_id).first()
        if job:
            job.status = "processing"
            db.commit()
            
        response = requests.get(image_url, stream=True)
        response.raise_for_status()
        
        tmp_path = f"/tmp/{uuid.uuid4()}.jpg"
        os.makedirs("/tmp", exist_ok=True)
        
        with open(tmp_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        results = model(tmp_path)
        
        detected_objects = []
        confidence_scores = []
        
        for result in results:
            for box in result.boxes:
                detected_objects.append(model.names[int(box.cls)])
                confidence_scores.append(float(box.conf))
                
        job = db.query(Job).filter(Job.job_id == job_id).first()
        if job:
            job.status = "complete"
            job.detected_objects = detected_objects
            job.confidence_scores = confidence_scores
            db.commit()
            
    except Exception as e:
        db.rollback()
        job = db.query(Job).filter(Job.job_id == job_id).first()
        if job:
            job.status = "failed"
            db.commit()
    finally:
        db.close()
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
