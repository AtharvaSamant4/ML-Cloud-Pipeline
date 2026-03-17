import os
from pydantic import BaseModel
from typing import List, Optional
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
    status = Column(String, default="uploaded")
    image_url = Column(String)
    detected_objects = Column(JSON, default=list)
    confidence_scores = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

class HealthResponse(BaseModel):
    status: str

class AnalyzeResponse(BaseModel):
    job_id: str
    status: str
    image_url: str

class ResultResponse(BaseModel):
    job_id: str
    status: str
    image_url: str
    detected_objects: Optional[List[str]] = []
    confidence_scores: Optional[List[float]] = []

    class Config:
        from_attributes = True
