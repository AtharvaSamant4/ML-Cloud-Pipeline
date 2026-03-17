import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from services import start_inference

app = FastAPI(title="Inference Service")

class InferRequest(BaseModel):
    job_id: str
    image_url: str

@app.post("/infer")
async def infer(request: InferRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(start_inference, request.job_id, request.image_url)
    return {"status": "queued"}
