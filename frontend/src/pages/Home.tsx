import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sparkles,
  RefreshCw,
  FileText,
  AlertCircle,
  Stethoscope,
  HeartPulse,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

import { Navbar } from '../components/Navbar';
import { SymptomSelector } from '../components/SymptomSelector';
import { CoOccurringSuggestions } from '../components/CoOccurringSuggestions';
import { PredictionCard } from '../components/PredictionCard';
import { RemedyModal } from '../components/RemedyModal';
import { DiseaseEncyclopedia } from '../components/DiseaseEncyclopedia';
import { ModelBenchmarks } from '../components/ModelBenchmarks';
import { AboutSection } from '../components/AboutSection';
import { ConsultationSummary } from '../components/ConsultationSummary';
import { Footer } from '../components/Footer';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import { getSymptoms, suggestCoOccurring, predictDisease } from '../services/api';
import { ActiveTab, SymptomSuggestion, PredictResponse } from '../types';

const SAMPLE_SCENARIOS = [
  {
    title: 'Viral Flu Symptoms',
    symptoms: ['fever', 'headache', 'chill', 'fatigue'],
    icon: '🌡️'
  },
  {
    title: 'Respiratory Infection',
    symptoms: ['coughing', 'sore throat', 'shortness breath', 'chest pain'],
    icon: '🫁'
  },
  {
    title: 'Gastric Disturbance',
    symptoms: ['stomach pain', 'nausea', 'vomiting', 'acidity'],
    icon: '🩺'
  },
  {
    title: 'Skin Allergy / Rash',
    symptoms: ['skin rash', 'itching', 'skin peeling'],
    icon: '🧴'
  }
];

export function Home() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('checker');
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('multinomial_nb');

  // Co-occurring suggestions state
  const [suggestions, setSuggestions] = useState<SymptomSuggestion[]>([]);
  const [associatedDiseasesCount, setAssociatedDiseasesCount] = useState<number>(0);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState<boolean>(false);

  // Predictions state
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionData, setPredictionData] = useState<PredictResponse | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Remedy Modal & Summary Report state
  const [activeRemedyDisease, setActiveRemedyDisease] = useState<string | null>(null);
  const [showSummaryReport, setShowSummaryReport] = useState<boolean>(false);

  // Load initial symptoms list
  useEffect(() => {
    getSymptoms()
      .then((data) => setAllSymptoms(data))
      .catch((err) => console.error('Failed to load symptoms:', err));
  }, []);

  // Update co-occurring suggestions whenever selected symptoms change
  useEffect(() => {
    if (selectedSymptoms.length === 0) {
      setSuggestions([]);
      setAssociatedDiseasesCount(0);
      return;
    }

    setIsSuggestionsLoading(true);
    suggestCoOccurring(selectedSymptoms, 12)
      .then((res) => {
        setSuggestions(res.suggestions);
        setAssociatedDiseasesCount(res.associated_diseases_count);
      })
      .catch((err) => console.error('Error suggesting symptoms:', err))
      .finally(() => setIsSuggestionsLoading(false));
  }, [selectedSymptoms]);

  const handleToggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleClearAll = () => {
    setSelectedSymptoms([]);
    setPredictionData(null);
    setPredictError(null);
  };

  const handleApplyScenario = (symptoms: string[]) => {
    setSelectedSymptoms(symptoms);
    setPredictionData(null);
    setPredictError(null);
  };

  const handleRunPrediction = async () => {
    if (selectedSymptoms.length === 0) {
      setPredictError('Please select or describe at least one symptom to run prediction.');
      return;
    }

    setIsPredicting(true);
    setPredictError(null);

    try {
      const res = await predictDisease(selectedSymptoms, selectedModel, 5);
      setPredictionData(res);

      // Securely archive diagnostic result to patient's medical history
      if (token && res.predictions.length > 0) {
        axios.post('http://localhost:8000/api/diagnostics/history', {
          symptoms: selectedSymptoms,
          predicted_disease: res.predictions[0].disease,
          confidence: res.predictions[0].probability_percentage,
          severity: res.predictions[0].severity || 'Moderate',
          model_name: selectedModel
        }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      }

      // Trigger celebratory confetti if confident match found
      if (res.predictions.length > 0 && res.predictions[0].probability_percentage >= 50) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#06b6d4', '#3b82f6'],
        });
      }

      // Smooth scroll to results
      setTimeout(() => {
        const resultsEl = document.getElementById('prediction-results-section');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setPredictError(err.response?.data?.detail || 'Prediction failed. Please try again.');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'checker' && (
          <div className="space-y-8">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Clinical AI Symptom Diagnostic Engine</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Intelligent Disease Triage & Home Care Remedies
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
                  Enter your current symptoms in plain English, select from categorized clinical body systems, or review AI co-occurring patterns. MediCURE evaluates over 261 diseases with verified ML probabilistic models and provides clinical remedy guidelines.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-emerald-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    261 Clinical Conditions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-teal-400" />
                    489+ Standardized Symptoms
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-cyan-400" />
                    Evidence-Backed Home Care
                  </span>
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute right-0 bottom-0 translate-y-12 translate-x-12 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Quick Scenario Templates */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  Quick Clinical Triage Examples
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">Click to test instant diagnostic combinations</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SAMPLE_SCENARIOS.map((sc) => (
                  <button
                    key={sc.title}
                    type="button"
                    onClick={() => handleApplyScenario(sc.symptoms)}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 rounded-2xl text-left transition-all active:scale-98 group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{sc.icon}</span>
                      <span className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {sc.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 capitalize line-clamp-1">
                      {sc.symptoms.join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1: Symptom Selector */}
            <SymptomSelector
              allSymptoms={allSymptoms}
              selectedSymptoms={selectedSymptoms}
              onToggleSymptom={handleToggleSymptom}
              onClearAll={handleClearAll}
              selectedModel={selectedModel}
              onChangeModel={setSelectedModel}
            />

            {/* Step 2: Co-Occurring AI Suggestions */}
            <CoOccurringSuggestions
              suggestions={suggestions}
              selectedSymptoms={selectedSymptoms}
              onToggleSymptom={handleToggleSymptom}
              isLoading={isSuggestionsLoading}
              associatedDiseasesCount={associatedDiseasesCount}
            />

            {/* Step 3: Predict Trigger Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shadow-xs">
                  2
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block text-sm sm:text-base">
                    {selectedSymptoms.length} Symptom{selectedSymptoms.length === 1 ? '' : 's'} Selected & Ready
                  </span>
                  <span className="text-xs text-slate-500">
                    {selectedSymptoms.length === 0 
                      ? "Select at least 1 symptom above to execute AI prediction" 
                      : "Ready to run multi-disease probabilistic classification"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {selectedSymptoms.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex-1 sm:flex-none px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Reset
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRunPrediction}
                  disabled={selectedSymptoms.length === 0 || isPredicting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  {isPredicting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Evaluating Models...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Run AI Disease Diagnostic</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {predictError && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-bold">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{predictError}</span>
              </div>
            )}

            {/* Step 3: Prediction Results */}
            {predictionData ? (
              <div id="prediction-results-section" className="space-y-6 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-600" />
                      Top Predicted Conditions ({predictionData.predictions.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Probabilistically ranked by symptom overlap matrix using{' '}
                      <strong className="text-slate-800">{predictionData.model_used}</strong> (
                      {predictionData.cross_val_accuracy}% Cross-Validation Accuracy).
                    </p>
                  </div>

                  <button
                    onClick={() => setShowSummaryReport(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto active:scale-98"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate Clinical Report</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {predictionData.predictions.map((pred, idx) => (
                    <PredictionCard
                      key={pred.disease}
                      prediction={pred}
                      rank={idx + 1}
                      onOpenRemedies={(d) => setActiveRemedyDisease(d)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Educational Guide Card when waiting for prediction */
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">How MediCURE Clinical Diagnostic AI Works</h3>
                    <p className="text-xs text-slate-500">Evidence-based triage powered by machine learning algorithms</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs">
                      1
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900">Multi-Modal Symptom Entry</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Type symptoms in natural language or pick from physiological organ categories.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-extrabold text-xs">
                      2
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900">Probabilistic Inference</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Our Naive Bayes & Logistic Regression engines compute disease likelihood with severity stratification.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5">
                    <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs">
                      3
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900">Actionable Care Pathways</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Review immediate home remedy protocols or directly connect with categorized clinical specialists.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Disease Encyclopedia */}
        {activeTab === 'encyclopedia' && (
          <DiseaseEncyclopedia
            onSelectDisease={(d) => setActiveRemedyDisease(d)}
          />
        )}

        {/* Tab 3: Model Benchmarks */}
        {activeTab === 'benchmarks' && <ModelBenchmarks />}

        {/* Tab 4: About Section */}
        {activeTab === 'about' && <AboutSection />}
      </main>

      {/* Professional Global Footer */}
      <Footer />

      {/* Remedy Modal Drawer */}
      <RemedyModal
        diseaseName={activeRemedyDisease}
        onClose={() => setActiveRemedyDisease(null)}
      />

      {/* Consultation Summary Print Modal */}
      {showSummaryReport && predictionData && (
        <ConsultationSummary
          predictionData={predictionData}
          onClose={() => setShowSummaryReport(false)}
        />
      )}
    </div>
  );
}

export default Home;
