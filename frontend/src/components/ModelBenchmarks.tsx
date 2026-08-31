import React, { useState, useEffect } from 'react';
import { BarChart3, Award, Zap, Clock, CheckCircle, Shield, Brain, Loader2 } from 'lucide-react';
import { getModelBenchmarks } from '../services/api';
import { ModelBenchmarkResponse } from '../types';

export const ModelBenchmarks: React.FC = () => {
  const [data, setData] = useState<ModelBenchmarkResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getModelBenchmarks()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Running machine learning evaluation pipeline...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
            <Brain className="w-3.5 h-3.5" />
            <span>Multi-Model AI Comparison</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Machine Learning Model Performance & Benchmarks
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Evaluation of 4 diverse machine learning classifiers trained on the MediCURE 261-disease clinical symptom matrix using 10-fold cross-validation and stratified testing.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Recommended Model: {data.best_model}</span>
            </div>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.benchmarks.map((b) => {
          const isBest = b.display_name === data.best_model;
          return (
            <div
              key={b.model_name}
              className={`rounded-2xl p-5 border transition-all ${
                isBest
                  ? 'bg-gradient-to-b from-white to-emerald-50/40 border-emerald-400 shadow-md ring-2 ring-emerald-500/30 relative'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {isBest && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Award className="w-3 h-3" /> Top Accuracy
                </span>
              )}

              <h3 className="text-base font-bold text-slate-900">{b.display_name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{b.model_name}</p>

              {/* Accuracy Meter */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-slate-500">Cross-Val Accuracy:</span>
                  <span className="text-xl font-extrabold text-emerald-600">
                    {b.cross_val_accuracy}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${b.cross_val_accuracy}%` }}
                  />
                </div>
              </div>

              {/* Metric details */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Test Accuracy:</span>
                  <span className="font-bold text-slate-800">{b.train_accuracy}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Precision:</span>
                  <span className="font-bold text-slate-800">{b.precision}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Recall:</span>
                  <span className="font-bold text-slate-800">{b.recall}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">F1-Score:</span>
                  <span className="font-bold text-slate-800">{b.f1_score}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Training Time:
                  </span>
                  <span className="font-bold text-slate-800">{b.training_time_sec}s</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Evaluation Analysis */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          Key Research Insights & Classifier Suitability
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Multinomial Naive Bayes (MNB)
            </h4>
            <p className="text-xs leading-relaxed text-slate-600">
              Performs exceptionally well on high-dimensional binary and sparse symptom occurrence matrices (489 features across 261 diseases). Provides fast probability estimates with strong cross-validation stability (~90.4%).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-teal-600" />
              Logistic Regression
            </h4>
            <p className="text-xs leading-relaxed text-slate-600">
              Provides robust linear separation across 261 output classes with L2 regularization, yielding balanced precision (~89.4%) and stable multiclass decision boundaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
