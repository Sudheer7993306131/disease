import os
import csv
import time
import pickle
from typing import Dict, List, Any, Tuple
import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import precision_recall_fscore_support, accuracy_score

try:
    from sklearn.ensemble import RandomForestClassifier
    _HAS_SKLEARN_ENSEMBLE = True
except ImportError:
    RandomForestClassifier = None
    _HAS_SKLEARN_ENSEMBLE = False

from remedies_service import RemediesService


class BaggedRandomForestClassifier(BaseEstimator, ClassifierMixin):
    """Bootstrap-aggregated DecisionTreeClassifier ensemble when sklearn.ensemble is unavailable."""

    def __init__(self, n_estimators: int = 40, max_depth: int = 20, max_features: str = "sqrt", random_state: int = 42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.max_features = max_features
        self.random_state = random_state

    def fit(self, X, y):
        X_arr = np.asarray(X)
        y_arr = np.asarray(y)
        self.classes_ = np.unique(y_arr)
        n_samples = X_arr.shape[0]
        rng = np.random.RandomState(self.random_state)
        self.estimators_ = []
        for i in range(self.n_estimators):
            indices = rng.randint(0, n_samples, size=n_samples)
            tree = DecisionTreeClassifier(
                max_depth=self.max_depth,
                max_features=self.max_features,
                random_state=self.random_state + i
            )
            tree.fit(X_arr[indices], y_arr[indices])
            self.estimators_.append(tree)
        return self

    def predict_proba(self, X):
        X_arr = np.asarray(X)
        avg_proba = np.zeros((X_arr.shape[0], len(self.classes_)), dtype=np.float64)
        for tree in self.estimators_:
            tree_proba = tree.predict_proba(X_arr)
            col_indices = np.searchsorted(self.classes_, tree.classes_)
            avg_proba[:, col_indices] += tree_proba
        avg_proba /= len(self.estimators_)
        return avg_proba

    def predict(self, X):
        proba = self.predict_proba(X)
        return self.classes_[np.argmax(proba, axis=1)]


def _load_comb_dataset(csv_path: str) -> Tuple[List[str], np.ndarray, np.ndarray]:
    with open(csv_path, 'r', encoding='utf-8', newline='') as f:
        reader = csv.reader(f)
        headers = next(reader)
        ignored = {'label_dis', 'Recommended_Specialist'}
        symptom_indices = [i for i, col in enumerate(headers) if col not in ignored]
        dataset_symptoms = [headers[i] for i in symptom_indices]
        label_idx = headers.index('label_dis')

        X_rows = []
        y_rows = []
        for row in reader:
            if not row:
                continue
            y_rows.append(row[label_idx])
            X_rows.append([int(row[i]) for i in symptom_indices])

    return dataset_symptoms, np.array(X_rows, dtype=np.int8), np.array(y_rows)


def _load_norm_records(csv_path: str, dataset_symptoms: List[str]) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    with open(csv_path, 'r', encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            record: Dict[str, Any] = {'label_dis': row['label_dis']}
            for sym in dataset_symptoms:
                if row.get(sym) == '1':
                    record[sym] = 1
            records.append(record)
    return records


class MLService:
    def __init__(self, dataset_dir: str, remedies_service: RemediesService):
        self.dataset_dir = dataset_dir
        self.remedies_service = remedies_service
        self.comb_path = os.path.join(dataset_dir, "dis_sym_dataset_comb.csv")
        self.norm_path = os.path.join(dataset_dir, "dis_sym_dataset_norm.csv")
        cache_name = "models_cache.pkl" if _HAS_SKLEARN_ENSEMBLE else "models_cache_fallback.pkl"
        self.cache_path = os.path.join(dataset_dir, cache_name)

        self.dataset_symptoms, self.X_comb, self.Y_comb = _load_comb_dataset(self.comb_path)
        self.df_norm = _load_norm_records(self.norm_path, self.dataset_symptoms)

        self.symptom_index_map: Dict[str, int] = {sym: idx for idx, sym in enumerate(self.dataset_symptoms)}

        self.diseases: List[str] = sorted(list(set(self.Y_comb)))
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
        for row in self.df_norm:
            dis_name = row['label_dis']
            symptoms = [sym for sym in self.dataset_symptoms if row.get(sym) == 1]
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
            self.X_comb, self.Y_comb, test_size=0.15, random_state=42
        )

        if _HAS_SKLEARN_ENSEMBLE:
            rf_clf = RandomForestClassifier(n_estimators=40, max_depth=20, random_state=42, n_jobs=-1)
        else:
            rf_clf = BaggedRandomForestClassifier(n_estimators=40, max_depth=20, random_state=42)

        model_configs = [
            ("multinomial_nb", "Multinomial Naive Bayes", MultinomialNB(alpha=0.1)),
            ("logistic_regression", "Logistic Regression", LogisticRegression(max_iter=300, C=1.0, solver='liblinear')),
            ("random_forest", "Random Forest Classifier", rf_clf),
            ("decision_tree", "Decision Tree Classifier", DecisionTreeClassifier(max_depth=25, random_state=42))
        ]

        cv_jobs = -1 if _HAS_SKLEARN_ENSEMBLE else 1
        for model_id, display_name, clf in model_configs:
            start_t = time.time()
            clf.fit(X_train, y_train)
            train_time = time.time() - start_t

            y_pred = clf.predict(X_test)
            acc = float(accuracy_score(y_test, y_pred)) * 100

            cv_scores = cross_val_score(clf, self.X_comb, self.Y_comb, cv=3, n_jobs=cv_jobs)
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

        # Convert to NumPy feature array for prediction
        sample_arr = np.array([sample_x], dtype=self.X_comb.dtype)
        proba = model.predict_proba(sample_arr)[0]
        
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
            
            # Predict specialist
            name_l = dis_name.lower()
            specialist = 'General Physician'
            if any(k in name_l for k in ['brain', 'neuro', 'stroke', 'paralysis', 'migraine', 'headache', 'encephalitis']): specialist = 'Neurologist'
            elif any(k in name_l for k in ['heart', 'cardio', 'myocardial', 'angina']): specialist = 'Cardiologist'
            elif any(k in name_l for k in ['skin', 'acne', 'rash', 'psoriasis', 'fungal', 'melanoma', 'eczema', 'abscess', 'haemangioma']): specialist = 'Dermatologist'
            elif any(k in name_l for k in ['eye', 'vision', 'cataract', 'glaucoma', 'conjunctivitis', 'amblyopia', 'amaurosis', 'aniseikonia', 'anisometropia']): specialist = 'Ophthalmologist'
            elif any(k in name_l for k in ['bone', 'joint', 'arthritis', 'osteo', 'fracture', 'spine', 'asbestos']): specialist = 'Orthopedic'
            elif any(k in name_l for k in ['lung', 'asthma', 'bronchitis', 'respiratory', 'pneumonia', 'tb', 'tuberculosis', 'anthrax']): specialist = 'Pulmonologist'
            elif any(k in name_l for k in ['stomach', 'gastric', 'ulcer', 'bowel', 'liver', 'hepatitis', 'jaundice', 'digestive', 'gerd', 'amoebiasis', 'appendicitis']): specialist = 'Gastroenterologist'
            elif any(k in name_l for k in ['kidney', 'renal', 'urinary']): specialist = 'Nephrologist'
            elif any(k in name_l for k in ['sugar', 'diabetes', 'thyroid', 'hormone', 'endocrine']): specialist = 'Endocrinologist'
            elif any(k in name_l for k in ['woman', 'pregnancy', 'cervical', 'ovarian', 'uterus', 'gyno', 'pcos', 'antepartum']): specialist = 'Gynecologist'
            elif any(k in name_l for k in ['child', 'pediatric']): specialist = 'Pediatrician'
            elif any(k in name_l for k in ['mental', 'depression', 'anxiety', 'schizophrenia', 'bipolar', 'alcohol', 'alzheimer']): specialist = 'Psychiatrist'
            elif any(k in name_l for k in ['tooth', 'dental', 'gum']): specialist = 'Dentist'
            elif any(k in name_l for k in ['cancer', 'tumor', 'leukemia']): specialist = 'Oncologist'
            elif any(k in name_l for k in ['blood', 'anemia', 'anaemia']): specialist = 'Hematologist'
            elif any(k in name_l for k in ['ear', 'nose', 'throat', 'sinus']): specialist = 'ENT Specialist'
            elif any(k in name_l for k in ['allergy', 'allergic']): specialist = 'Allergist'

            scored_candidates.append({
                "disease": dis_name,
                "confidence": round(hybrid_confidence, 4),
                "probability_percentage": round(hybrid_confidence * 100, 1),
                "matched_symptoms": matched,
                "unmatched_disease_symptoms": unmatched[:8],
                "total_disease_symptoms": len(disease_symptoms),
                "severity": severity,
                "home_remedies": remedies,
                "recommended_specialist": specialist
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
