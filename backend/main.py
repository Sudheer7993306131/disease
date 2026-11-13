import os
import uvicorn
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from models import (
    SymptomMatchRequest, SymptomMatchResponse,
    CoOccurringRequest, CoOccurringResponse,
    PredictRequest, PredictResponse,
    DiseaseListResponse, DiseaseInfo,
    ModelBenchmarkResponse
)
from remedies_service import RemediesService
from nlp_service import NLPService
from ml_service import MLService

app = FastAPI(
    title="MediCURE AI API",
    description="Intelligent Symptom-Based Disease Prediction & Home Remedies Recommendation Engine",
    version="2.0.0"
)

# Enable CORS for React frontend (Vite default port 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from pymongo.errors import PyMongoError

@app.exception_handler(PyMongoError)
async def pymongo_exception_handler(request: Request, exc: PyMongoError):
    print(f"MongoDB Error: {exc}")
    origin = request.headers.get("origin", "*")
    headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
    }
    return JSONResponse(
        status_code=500,
        content={"detail": "Database connection failed! Ensure MongoDB Atlas IP Whitelist is configured."},
        headers=headers
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global Exception: {exc}")
    origin = request.headers.get("origin", "*")
    headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
    }
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
        headers=headers
    )

# Initialize Database
from database import db
# MongoDB doesn't need create_all, collections are created on demand.

# Include Routers
from routers import auth_router, doctor_router, consultation_router, chat_router, admin_router, user_router, notification_router, prescription_router
app.include_router(auth_router.router)
app.include_router(doctor_router.router)
app.include_router(consultation_router.router)
app.include_router(chat_router.router)
app.include_router(admin_router.router)
app.include_router(user_router.router)
app.include_router(notification_router.router)
app.include_router(prescription_router.router)



# Dataset directory relative to current file
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(CURRENT_DIR, "dataset")

print(f"Initializing MediCURE Services with dataset in {DATASET_DIR}...")
remedies_service = RemediesService(DATASET_DIR)
ml_service = MLService(DATASET_DIR, remedies_service)
nlp_service = NLPService(ml_service.dataset_symptoms, ml_service.df_norm)
print("MediCURE Services initialization complete!")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MediCURE AI Disease Prediction API",
        "total_diseases": len(ml_service.diseases),
        "total_symptoms": len(ml_service.dataset_symptoms),
        "models_available": list(ml_service.models.keys())
    }

@app.get("/api/symptoms", response_model=List[str])
def get_all_symptoms():
    """Returns list of all 489+ standardized symptoms in the MediCURE dataset."""
    return ml_service.dataset_symptoms

@app.post("/api/match-symptoms", response_model=SymptomMatchResponse)
def match_symptoms(request: SymptomMatchRequest):
    """Processes free-text or comma-separated symptoms into dataset matches using NLP & synonyms."""
    matched = nlp_service.match_symptoms_from_text(request.query)
    raw_terms = [t.strip() for t in request.query.replace(',', ';').split(';') if t.strip()]
    return SymptomMatchResponse(
        matched_symptoms=matched,
        input_terms=raw_terms,
        total_found=len(matched)
    )

@app.post("/api/suggest-symptoms", response_model=CoOccurringResponse)
def suggest_co_occurring(request: CoOccurringRequest):
    """Returns symptoms frequently co-occurring with the currently selected symptoms."""
    suggestions, assoc_diseases_count = nlp_service.suggest_co_occurring_symptoms(
        request.selected_symptoms, limit=request.limit or 12
    )
    return CoOccurringResponse(
        suggestions=suggestions,
        associated_diseases_count=assoc_diseases_count
    )

@app.post("/api/predict", response_model=PredictResponse)
def predict_disease(request: PredictRequest):
    """Performs multi-class ML inference and symptom overlap scoring to rank most probable diseases."""
    if not request.symptoms:
        raise HTTPException(status_code=400, detail="At least one symptom must be selected.")
    
    result = ml_service.predict(
        symptoms=request.symptoms,
        model_name=request.model_name or "multinomial_nb",
        top_k=request.top_k or 5
    )
    return PredictResponse(**result)

@app.get("/api/diseases", response_model=DiseaseListResponse)
def list_diseases(search: Optional[str] = Query(None, description="Optional search query to filter diseases")):
    """Returns the encyclopedia of all 261 diseases with symptoms and home remedies."""
    all_info = ml_service.get_all_diseases_info()
    if search and search.strip():
        q = search.strip().lower()
        all_info = [
            d for d in all_info 
            if q in d['disease'].lower() or any(q in s.lower() for s in d['symptoms'])
        ]
    
    disease_objects = [DiseaseInfo(**d) for d in all_info]
    return DiseaseListResponse(
        total_diseases=len(disease_objects),
        diseases=disease_objects
    )

@app.get("/api/remedies/{disease_name}")
def get_disease_remedies(disease_name: str):
    """Returns home remedies and clinical guidance for a specific disease."""
    remedies = remedies_service.get_remedies_for_disease(disease_name)
    symptoms = ml_service.disease_symptoms_map.get(disease_name, [])
    return {
        "disease": disease_name,
        "symptoms": symptoms,
        "home_remedies": remedies,
        "severity": ml_service._estimate_severity(disease_name, symptoms)
    }

@app.get("/api/benchmarks", response_model=ModelBenchmarkResponse)
def get_model_benchmarks():
    """Returns comparative performance metrics for ML algorithms trained on MediCURE data."""
    benchmarks = ml_service.get_benchmarks()
    best_model = "multinomial_nb"
    if benchmarks:
        best_model = max(benchmarks, key=lambda b: b['cross_val_accuracy'])['display_name']
    return ModelBenchmarkResponse(
        benchmarks=benchmarks,
        best_model=best_model
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
