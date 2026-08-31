import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["total_diseases"] == 261
    assert data["total_symptoms"] > 400

def test_get_symptoms():
    response = client.get("/api/symptoms")
    assert response.status_code == 200
    symptoms = response.json()
    assert len(symptoms) > 400
    assert "fever" in symptoms or "headache" in symptoms

def test_match_symptoms_nlp():
    response = client.post("/api/match-symptoms", json={"query": "I have high temperature, headache and vomiting"})
    assert response.status_code == 200
    data = response.json()
    assert "matched_symptoms" in data
    assert len(data["matched_symptoms"]) >= 1

def test_suggest_symptoms():
    response = client.post("/api/suggest-symptoms", json={"selected_symptoms": ["fever", "headache"]})
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert len(data["suggestions"]) > 0

def test_predict_disease():
    response = client.post("/api/predict", json={
        "symptoms": ["fever", "headache", "vomiting", "stiff neck"],
        "model_name": "multinomial_nb",
        "top_k": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["predictions"]) > 0
    top = data["predictions"][0]
    assert "disease" in top
    assert "confidence" in top
    assert "home_remedies" in top
    assert len(top["home_remedies"]) > 0

def test_get_diseases_encyclopedia():
    response = client.get("/api/diseases")
    assert response.status_code == 200
    data = response.json()
    assert data["total_diseases"] == 261
    assert len(data["diseases"]) == 261

def test_get_remedies_for_disease():
    response = client.get("/api/remedies/Abscess")
    assert response.status_code == 200
    data = response.json()
    assert data["disease"] == "Abscess"
    assert len(data["home_remedies"]) > 0

def test_get_model_benchmarks():
    response = client.get("/api/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert len(data["benchmarks"]) >= 4
