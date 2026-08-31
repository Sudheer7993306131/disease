import os
import time
import pickle
from typing import Dict, List, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import precision_recall_fscore_support, accuracy_score

from remedies_service import RemediesService

class MLService:
    def __init__(self, dataset_dir: str, remedies_service: RemediesService):
        self.dataset_dir = dataset_dir
        self.remedies_service = remedies_service
        self.comb_path = os.path.join(dataset_dir, "dis_sym_dataset_comb.csv")
        self.norm_path = os.path.join(dataset_dir, "dis_sym_dataset_norm.csv")
        self.cache_path = os.path.join(dataset_dir, "models_cache.pkl")
        
        self.df_comb = pd.read_csv(self.comb_path)
        self.df_norm = pd.read_csv(self.norm_path)
        
        self.X_comb = self.df_comb.iloc[:, 1:]
        self.Y_comb = self.df_comb.iloc[:, 0:1]
        
        self.dataset_symptoms: List[str] = list(self.X_comb.columns)
        self.symptom_index_map: Dict[str, int] = {sym: idx for idx, sym in enumerate(self.dataset_symptoms)}
        
        self.diseases: List[str] = sorted(list(set(self.Y_comb['label_dis'])))
        self.disease_to_idx: Dict[str, int] = {d: i for i, d in enumerate(self.diseases)}
        
        self.models: Dict[str, Any] = {}
        self.benchmarks: List[Dict[str, Any]] = []
        self.model_cv_scores: Dict[str, float] = {}

        # Disease canonical symptoms lookup
        self.disease_symptoms_map: Dict[str, List[str]] = {}
        self._build_disease_symptom_map()
        
        # Train or load cached models
        self._initialize_models()

    def _build_disease_symptom_map(self):
        for _, row in self.df_norm.iterrows():
            dis_name = row['label_dis']
            symptoms = []
            for sym in self.dataset_symptoms:
                if sym in row and row[sym] == 1:
                    symptoms.append(sym)
            self.disease_symptoms_map[dis_name] = symptoms

    def _initialize_models(self):
        if os.path.exists(self.cache_path):
            try:
                print(f"Loading pre-trained ML models from cache: {self.cache_path}")
                with open(self.cache_path, 'rb') as f:
                    cached_data = pickle.load(f)
                    self.models = cached_data["models"]
                    self.benchmarks = cached_data["benchmarks"]
                    self.model_cv_scores = cached_data["model_cv_scores"]
                print(f"Successfully loaded {len(self.models)} cached models in <100ms!")
                return
            except Exception as e:
                print(f"Cache loading failed ({e}), retraining models...")

        print("Training MediCURE ML models on combination dataset...")
        
        X_train, X_test, y_train, y_test = train_test_split(
            self.X_comb, self.Y_comb.values.ravel(), test_size=0.15, random_state=42
        )

        model_configs = [
            ("multinomial_nb", "Multinomial Naive Bayes", MultinomialNB(alpha=0.1)),
            ("logistic_regression", "Logistic Regression", LogisticRegression(max_iter=300, C=1.0, solver='liblinear')),
            ("random_forest", "Random Forest Classifier", RandomForestClassifier(n_estimators=40, max_depth=20, random_state=42, n_jobs=-1)),
            ("decision_tree", "Decision Tree Classifier", DecisionTreeClassifier(max_depth=25, random_state=42))
        ]

        for model_id, display_name, clf in model_configs:
            start_t = time.time()
            clf.fit(X_train, y_train)
            train_time = time.time() - start_t
            
            y_pred = clf.predict(X_test)
            acc = float(accuracy_score(y_test, y_pred)) * 100
            
            cv_scores = cross_val_score(clf, self.X_comb, self.Y_comb.values.ravel(), cv=3, n_jobs=-1)
            cv_mean = float(cv_scores.mean()) * 100
            
            precision, recall, f1, _ = precision_recall_fscore_support(
                y_test, y_pred, average='weighted', zero_division=0
            )
            
            self.models[model_id] = clf
            self.model_cv_scores[model_id] = cv_mean / 100.0
            
            self.benchmarks.append({
                "model_name": model_id,
                "display_name": display_name,
                "train_accuracy": round(acc, 2),
                "cross_val_accuracy": round(cv_mean, 2),
                "precision": round(float(precision) * 100, 2),
                "recall": round(float(recall) * 100, 2),
                "f1_score": round(float(f1) * 100, 2),
                "training_time_sec": round(train_time, 3)
            })
            print(f"Loaded {display_name}: Accuracy={acc:.2f}%, CV={cv_mean:.2f}%")

        # Save cache
        try:
            with open(self.cache_path, 'wb') as f:
                pickle.dump({
                    "models": self.models,
                    "benchmarks": self.benchmarks,
                    "model_cv_scores": self.model_cv_scores
                }, f)
            print(f"Cached trained models to {self.cache_path}")
        except Exception as e:
            print(f"Failed to cache models: {e}")

    def predict(self, symptoms: List[str], model_name: str = "multinomial_nb", top_k: int = 5) -> Dict[str, Any]:
        if model_name not in self.models:
            model_name = "multinomial_nb"

        model = self.models[model_name]
        cv_accuracy = self.model_cv_scores.get(model_name, 0.95)

        # Create binary feature vector with explicit column names
        sample_x = [0] * len(self.dataset_symptoms)
        valid_input_symptoms = []
        for sym in symptoms:
            if sym in self.symptom_index_map:
                idx = self.symptom_index_map[sym]
                sample_x[idx] = 1
                valid_input_symptoms.append(sym)

        input_set = set(valid_input_symptoms)

        # Convert to DataFrame with feature names for clean prediction
        df_input = pd.DataFrame([sample_x], columns=self.dataset_symptoms)
        proba = model.predict_proba(df_input)[0]
        
        classes = model.classes_
        top_indices = proba.argsort()[-min(top_k * 3, len(classes)):][::-1]

        scored_candidates = []
        for idx in top_indices:
            dis_name = classes[idx]
            model_prob = float(proba[idx])
            
            disease_symptoms = self.disease_symptoms_map.get(dis_name, [])
            dis_sym_set = set(disease_symptoms)
            
            matched = list(input_set.intersection(dis_sym_set))
            unmatched = [s for s in disease_symptoms if s not in input_set]
            
            # Hybrid confidence calculation
            overlap_score = (len(matched) + 1.0) / (len(input_set) + 1.0)
            hybrid_confidence = (0.55 * model_prob) + (0.45 * overlap_score)
            hybrid_confidence = min(max(hybrid_confidence * cv_accuracy, 0.05), 0.99)
            
            severity = self._estimate_severity(dis_name, matched)
            remedies = self.remedies_service.get_remedies_for_disease(dis_name)

            scored_candidates.append({
                "disease": dis_name,
                "confidence": round(hybrid_confidence, 4),
                "probability_percentage": round(hybrid_confidence * 100, 1),
                "matched_symptoms": matched,
                "unmatched_disease_symptoms": unmatched[:8],
                "total_disease_symptoms": len(disease_symptoms),
                "severity": severity,
                "home_remedies": remedies
            })

        scored_candidates.sort(key=lambda x: x["confidence"], reverse=True)
        final_predictions = scored_candidates[:top_k]

        return {
            "predictions": final_predictions,
            "model_used": model_name,
            "input_symptoms": valid_input_symptoms,
            "cross_val_accuracy": round(cv_accuracy * 100, 2)
        }

    def _estimate_severity(self, disease_name: str, matched_symptoms: List[str]) -> str:
        high_risk_keywords = [
            'syndrome', 'cancer', 'encephalitis', 'aids', 'failure', 'stroke', 
            'shock', 'hemorrhage', 'paralysis', 'coma', 'seizure', 'convulsion'
        ]
        moderate_risk_keywords = [
            'infection', 'pneumonia', 'hepatitis', 'jaundice', 'tuberculosis', 
            'ulcer', 'asthma', 'bronchitis', 'diabetes', 'hypertension'
        ]

        name_lower = disease_name.lower()
        if any(k in name_lower for k in high_risk_keywords):
            return "Severe"
        
        severe_symptoms = {'chest pain', 'difficulty breathing', 'coughing blood', 'coma', 'paralysis', 'seizure'}
        if any(s in severe_symptoms for s in matched_symptoms):
            return "Severe"

        if any(k in name_lower for k in moderate_risk_keywords) or len(matched_symptoms) >= 4:
            return "Moderate"

        return "Mild"

    def get_all_diseases_info(self) -> List[Dict[str, Any]]:
        result = []
        for dis in self.diseases:
            syms = self.disease_symptoms_map.get(dis, [])
            remedies = self.remedies_service.get_remedies_for_disease(dis)
            result.append({
                "disease": dis,
                "symptoms": syms,
                "remedies": remedies,
                "total_symptoms": len(syms)
            })
        return result

    def get_benchmarks(self) -> List[Dict[str, Any]]:
        return self.benchmarks
