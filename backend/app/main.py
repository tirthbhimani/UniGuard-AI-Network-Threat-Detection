from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.analysis import router as analysis_router
from app.api.monitor import router as monitor_router
from app.api.ai import router as ai_router

app = FastAPI(title="UniGuard")

# Open CORS is fine for a local hackathon demo — do not ship this open elsewhere.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
app.include_router(monitor_router)

app.include_router(ai_router)