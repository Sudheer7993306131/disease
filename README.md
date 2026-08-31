# MediCURE v2.0 - Disease Prediction & Home Remedies System

> An intelligent, full-stack clinical disease prediction and home remedy recommendation system built with **FastAPI**, **React 18 (TypeScript)**, and **Tailwind CSS**, powered by multi-model machine learning on 261 diseases and 489+ symptoms.

---

## Key Features

1. **Intelligent Symptom Checker**:
   - Natural language input with WordNet lemmatization & synonym expansion.
   - 489+ verified dataset symptoms with instant debounce autocomplete.
   - Dynamic AI co-occurring symptom suggestion engine.
2. **Multi-Model Machine Learning**:
   - Supports **Multinomial Naive Bayes** (~90.4% CV accuracy), **Logistic Regression**, **Random Forest**, and **Decision Trees**.
   - Computes hybrid confidence ratings and symptom overlap breakdown.
3. **Evidence-Based Home Remedies**:
   - Integrated clinical remedy dataset covering all 261 diseases with dietary advice and emergency precautions.
4. **Disease Encyclopedia**:
   - Searchable directory of 261 diseases with alphabet filters and instant symptom/remedy previews.
5. **Model Benchmarking Dashboard**:
   - Real-time comparison of accuracy, precision, recall, F1-scores, and training latency.
6. **Clinical Summary Report**:
   - One-click print/exportable PDF clinical summary.

---

## Project Structure

```
medicure-app/
├── backend/
│   ├── dataset/                      # Dataset CSVs and Cure Excel
│   │   ├── dis_sym_dataset_comb.csv  # 261 diseases combination dataset
│   │   ├── dis_sym_dataset_norm.csv  # Normalized symptoms matrix
│   │   ├── cure_minor.xlsx           # Home remedies & treatment dataset
│   │   └── dis_symp_dict.txt         # Raw symptom mappings
│   ├── models.py                     # Pydantic request/response schemas
│   ├── nlp_service.py                # NLP matcher & co-occurrence engine
│   ├── ml_service.py                 # Multi-model ML trainer & inference
│   ├── remedies_service.py           # Cure knowledgebase parser
│   ├── main.py                       # FastAPI application & REST endpoints
│   ├── test_backend.py               # Automated pytest suite
│   ├── requirements.txt              # Python dependencies
│   └── venv/                         # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── SymptomSelector.tsx
│   │   │   ├── CoOccurringSuggestions.tsx
│   │   │   ├── PredictionCard.tsx
│   │   │   ├── RemedyModal.tsx
│   │   │   ├── DiseaseEncyclopedia.tsx
│   │   │   ├── ModelBenchmarks.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   └── ConsultationSummary.tsx
│   │   ├── services/api.ts           # Typed Axios API client
│   │   ├── types/index.ts            # TypeScript definitions
│   │   ├── App.tsx                   # Main React app
│   │   └── index.css                 # Tailwind CSS styles
│   ├── package.json
│   └── vite.config.ts
├── run_app.sh                        # One-command startup script
└── README.md
```

---

## How to Run

### Quick Start (Both Backend & Frontend)

```bash
./run_app.sh
```

- **Frontend App**: `http://localhost:5173`
- **FastAPI Backend & Interactive Swagger Docs**: `http://localhost:8000/docs`

---

### Running Backend Individually

```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Run automated backend tests:
```bash
pytest test_backend.py -v
```

---

### Running Frontend Individually

```bash
cd frontend
npm install
npm run dev
```

Build for production:
```bash
npm run build
```
