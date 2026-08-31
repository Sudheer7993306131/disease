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
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Navbar } from './components/Navbar';
import { SymptomSelector } from './components/SymptomSelector';
import { CoOccurringSuggestions } from './components/CoOccurringSuggestions';
import { PredictionCard } from './components/PredictionCard';
import { RemedyModal } from './components/RemedyModal';
import { DiseaseEncyclopedia } from './components/DiseaseEncyclopedia';
import { ModelBenchmarks } from './components/ModelBenchmarks';
import { AboutSection } from './components/AboutSection';
import { ConsultationSummary } from './components/ConsultationSummary';

import { getSymptoms, suggestCoOccurring, predictDisease } from './services/api';
import { ActiveTab, SymptomSuggestion, PredictResponse } from './types';

export function App() {
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'checker' && (
          <div className="space-y-8">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Clinical Symptom Analysis</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Intelligent Disease Prediction & Home Remedies
                </h1>
                <p className="text-sm sm:text-base text-emerald-100/90 mt-2.5 leading-relaxed">
                  Enter your current symptoms in natural language or choose from verified medical tags. Our machine learning engine analyzes over 261 diseases and delivers top potential conditions along with evidence-based home treatments.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-emerald-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    261 Clinical Conditions
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Zap className="w-4 h-4 text-teal-400" />
                    489+ Standard Symptoms
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Stethoscope className="w-4 h-4 text-cyan-400" />
                    Integrated Home Remedies
                  </span>
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute right-0 bottom-0 translate-y-12 translate-x-12 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
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

            {/* Predict Trigger Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">
                    {selectedSymptoms.length} Symptom(s) Confirmed
                  </span>
                  <span className="text-xs text-slate-400">
                    Ready to execute machine learning inference
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {selectedSymptoms.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex-1 sm:flex-none px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                  >
                    Reset
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRunPrediction}
                  disabled={selectedSymptoms.length === 0 || isPredicting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isPredicting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Running Model...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Predict Likely Diseases</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {predictError && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{predictError}</span>
              </div>
            )}

            {/* Step 3: Prediction Results */}
            {predictionData && (
              <div id="prediction-results-section" className="space-y-6 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-600" />
                      Top Predicted Conditions ({predictionData.predictions.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ranked by probability and symptom overlap index using{' '}
                      <strong className="text-slate-700">{predictionData.model_used}</strong> (
                      {predictionData.cross_val_accuracy}% CV Accuracy).
                    </p>
                  </div>

                  <button
                    onClick={() => setShowSummaryReport(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
                  >
                    <FileText className="w-3.5 h-3.5" />
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

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-slate-600">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <span>MediCURE v2.0 • React + FastAPI + Tailwind CSS</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Designed for disease awareness and educational home guidance. Always consult licensed medical professionals for diagnosis.
          </p>
        </div>
      </footer>

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

export default App;
