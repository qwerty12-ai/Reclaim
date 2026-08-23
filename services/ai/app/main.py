from fastapi import FastAPI

app = FastAPI(title="Reclaim AI Service")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "reclaim-ai"
    }