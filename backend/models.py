from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SymptomMatchRequest(BaseModel):
    query: str = Field(..., description="Free text user symptoms e.g. 'I have a high fever and severe headache'")

class SymptomMatchResponse(BaseModel):
    matched_symptoms: List[str]
    input_terms: List[str]
    total_found: int

class CoOccurringRequest(BaseModel):
    selected_symptoms: List[str] = Field(..., description="Currently selected symptoms")
    limit: Optional[int] = Field(12, description="Max suggestions to return")

class SymptomSuggestion(BaseModel):
    symptom: str
    co_occurrence_count: int
    relevance_score: float

class CoOccurringResponse(BaseModel):
    suggestions: List[SymptomSuggestion]
    associated_diseases_count: int

class PredictRequest(BaseModel):
    symptoms: List[str] = Field(..., min_length=1, description="List of confirmed dataset symptoms")
    model_name: Optional[str] = Field("multinomial_nb", description="Algorithm: multinomial_nb, logistic_regression, random_forest, decision_tree")
    top_k: Optional[int] = Field(5, description="Number of top diseases to return")

class DiseasePrediction(BaseModel):
    disease: str
    confidence: float
    probability_percentage: float
    matched_symptoms: List[str]
    unmatched_disease_symptoms: List[str]
    total_disease_symptoms: int
    severity: str  # Mild, Moderate, Severe
    home_remedies: List[str]

class PredictResponse(BaseModel):
    predictions: List[DiseasePrediction]
    model_used: str
    input_symptoms: List[str]
    cross_val_accuracy: float

class DiseaseInfo(BaseModel):
    disease: str
    symptoms: List[str]
    remedies: List[str]
    total_symptoms: int

class DiseaseListResponse(BaseModel):
    total_diseases: int
    diseases: List[DiseaseInfo]

class ModelBenchmarkItem(BaseModel):
    model_name: str
    display_name: str
    train_accuracy: float
    cross_val_accuracy: float
    precision: float
    recall: float
    f1_score: float
    training_time_sec: float

class ModelBenchmarkResponse(BaseModel):
    benchmarks: List[ModelBenchmarkItem]
    best_model: str
