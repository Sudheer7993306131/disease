import axios from 'axios';
import {
  SymptomMatchResponse,
  CoOccurringResponse,
  PredictResponse,
  DiseaseListResponse,
  ModelBenchmarkResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSymptoms = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/symptoms');
  return response.data;
};

export const matchSymptomsNLP = async (query: string): Promise<SymptomMatchResponse> => {
  const response = await api.post<SymptomMatchResponse>('/match-symptoms', { query });
  return response.data;
};

export const suggestCoOccurring = async (
  selectedSymptoms: string[],
  limit = 12
): Promise<CoOccurringResponse> => {
  const response = await api.post<CoOccurringResponse>('/suggest-symptoms', {
    selected_symptoms: selectedSymptoms,
    limit,
  });
  return response.data;
};

export const predictDisease = async (
  symptoms: string[],
  modelName = 'multinomial_nb',
  topK = 5
): Promise<PredictResponse> => {
  const response = await api.post<PredictResponse>('/predict', {
    symptoms,
    model_name: modelName,
    top_k: topK,
  });
  return response.data;
};

export const getDiseases = async (search?: string): Promise<DiseaseListResponse> => {
  const response = await api.get<DiseaseListResponse>('/diseases', {
    params: search ? { search } : {},
  });
  return response.data;
};

export const getDiseaseRemedies = async (diseaseName: string) => {
  const response = await api.get(`/remedies/${encodeURIComponent(diseaseName)}`);
  return response.data;
};

export const getModelBenchmarks = async (): Promise<ModelBenchmarkResponse> => {
  const response = await api.get<ModelBenchmarkResponse>('/benchmarks');
  return response.data;
};
