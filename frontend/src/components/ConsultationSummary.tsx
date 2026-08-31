import React from 'react';
import { FileText, Printer, Calendar, Stethoscope, CheckCircle2 } from 'lucide-react';
import { PredictResponse } from '../types';

interface ConsultationSummaryProps {
  predictionData: PredictResponse;
  onClose: () => void;
}

export const ConsultationSummary: React.FC<ConsultationSummaryProps> = ({
  predictionData,
  onClose,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden print:shadow-none print:border-none">
        {/* Printable Report Header */}
        <div className="p-8 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">Medi</span>
              <span className="text-xl font-extrabold text-emerald-600">CURE</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Clinical Summary Report
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Generated on {currentDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-8 space-y-6 text-sm text-slate-800">
          {/* Patient Symptoms */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Reported Symptoms ({predictionData.input_symptoms.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {predictionData.input_symptoms.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold capitalize"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Model info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
            <span>
              <strong>Inference Engine:</strong> {predictionData.model_used}
            </span>
            <span>
              <strong>Cross-Validation Accuracy:</strong> {predictionData.cross_val_accuracy}%
            </span>
          </div>

          {/* Top Predictions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Predicted Conditions & Confidence
            </h4>
            <div className="space-y-3">
              {predictionData.predictions.map((p, idx) => (
                <div
                  key={p.disease}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">
                        {idx + 1}. {p.disease}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.severity === 'Severe'
                            ? 'bg-rose-100 text-rose-800'
                            : p.severity === 'Moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.severity}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-600">
                      {p.probability_percentage}% Confidence
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    <strong>Confirmed Symptoms:</strong> {p.matched_symptoms.join(', ')}
                  </div>

                  {p.home_remedies && p.home_remedies.length > 0 && (
                    <div className="text-xs text-emerald-900 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                      <strong>Home Care:</strong> {p.home_remedies.slice(0, 3).join(' • ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Advice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong>Clinical Advisory:</strong> This document is generated for personal symptom tracking and informational purposes based on machine learning probability models. It should be presented to a physician for clinical assessment.
          </div>
        </div>
      </div>
    </div>
  );
};
