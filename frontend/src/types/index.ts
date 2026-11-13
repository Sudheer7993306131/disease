export interface SymptomMatchResponse {
  matched_symptoms: string[];
  input_terms: string[];
  total_found: number;
}

export interface SymptomSuggestion {
  symptom: string;
  co_occurrence_count: number;
  relevance_score: number;
}

export interface CoOccurringResponse {
  suggestions: SymptomSuggestion[];
  associated_diseases_count: number;
}

export interface DiseasePrediction {
  disease: string;
  confidence: number;
  probability_percentage: number;
  matched_symptoms: string[];
  unmatched_disease_symptoms: string[];
  total_disease_symptoms: number;
  severity: 'Mild' | 'Moderate' | 'Severe';
  home_remedies: string[];
  recommended_specialist: string;
}

export interface PredictResponse {
  predictions: DiseasePrediction[];
  model_used: string;
  input_symptoms: string[];
  cross_val_accuracy: number;
}

export interface DiseaseInfo {
  disease: string;
  symptoms: string[];
  remedies: string[];
  total_symptoms: number;
}

export interface DiseaseListResponse {
  total_diseases: number;
  diseases: DiseaseInfo[];
}

export interface ModelBenchmarkItem {
  model_name: string;
  display_name: string;
  train_accuracy: number;
  cross_val_accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_time_sec: number;
}

export interface ModelBenchmarkResponse {
  benchmarks: ModelBenchmarkItem[];
  best_model: string;
}

export type ActiveTab = 'checker' | 'encyclopedia' | 'benchmarks' | 'about';
