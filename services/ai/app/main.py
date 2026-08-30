from fastapi import FastAPI
from app.analyzer import analyze_case

app = FastAPI(title="Reclaim AI Service")

@app.get("/")
def home():
    return {
        "service": "Reclaim AI Service",
        "message": "Revenue recovery intelligence is running",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "reclaim-ai"
    }

@app.post("/analyze")
def analyze(case: dict):
    return analyze_case(case, case.get("intervention_action"))