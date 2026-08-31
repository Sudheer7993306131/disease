import React from 'react';
import { HeartPulse, ShieldAlert, Database, Cpu, Layers, CheckCircle2, GitBranch } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Banner */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4 shadow-sm">
          <HeartPulse className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          About MediCURE v2.0
        </h1>
        <p className="text-base text-slate-600 mt-3 max-w-2xl mx-auto leading-relaxed">
          An AI-powered clinical decision support and disease prediction application built with <strong>React</strong>, <strong>FastAPI</strong>, and <strong>Tailwind CSS</strong>, utilizing real-world medical data to connect reported symptoms to likely conditions and actionable home treatments.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">261 Diseases & 489+ Symptoms</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Curated and preprocessed from the National Health Portal (NHP) and clinical medical datasets with verified symptom co-occurrence matrix.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Multi-Model Machine Learning</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Trained and cross-validated with Multinomial Naive Bayes (~90.4% CV), Logistic Regression, Random Forest, and Decision Trees.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">FastAPI & React Architecture</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Modern asynchronous REST architecture with instant NLP natural language matcher, dynamic co-occurrence graph, and responsive Tailwind UI.
          </p>
        </div>
      </div>

      {/* Dataset & NLP Pipeline */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-emerald-600" />
          Data Pipeline & Algorithmic Workflow
        </h2>

        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Natural Language Preprocessing:</strong> Free-form text input is tokenized, stripped of stopwords, lemmatized with WordNet, and expanded across medical synonym clusters to match standardized symptom identifiers.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">AI Co-Occurring Recommendations:</strong> Evaluates conditional symptom frequencies across all diseases matching current symptoms to help users confirm related warning signs.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Hybrid Confidence Score:</strong> Blends multiclass classification probabilities with Jaccard symptom overlap ratios:
              <code className="block mt-1 p-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-800">
                Confidence = (0.55 × ML_Probability + 0.45 × Overlap_Score) × CV_Accuracy
              </code>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Actionable Home Remedies:</strong> Integrated knowledgebase containing home care guidelines and dietary advice for every single condition.
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-rose-50 rounded-2xl p-6 border border-rose-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 leading-relaxed space-y-1">
            <h4 className="font-bold text-sm uppercase tracking-wider text-rose-950">
              Important Medical Disclaimer
            </h4>
            <p>
              MediCURE is an educational machine learning and informational tool designed to assist with early symptom awareness and home wellness advice. It does not provide medical diagnosis, clinical consultation, or formal treatment prescriptions. Always seek the advice of a qualified physician or healthcare professional with any questions regarding a medical condition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
