import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, HeartPulse, ChevronRight, Stethoscope, AlertTriangle, Info } from 'lucide-react';
import { DiseasePrediction } from '../types';

interface PredictionCardProps {
  prediction: DiseasePrediction;
  rank: number;
  onOpenRemedies: (diseaseName: string) => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  rank,
  onOpenRemedies,
}) => {
  const navigate = useNavigate();
  const {
    disease,
    probability_percentage,
    matched_symptoms,
    unmatched_disease_symptoms,
    total_disease_symptoms,
    severity,
    recommended_specialist,
  } = prediction;

  const getSeverityBadge = () => {
    switch (severity) {
      case 'Severe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3" />
            High Clinical Severity
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Info className="w-3 h-3" />
            Moderate Severity
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Mild / Manageable
          </span>
        );
    }
  };

  const getConfidenceBarColor = () => {
    if (probability_percentage >= 70) return 'bg-emerald-500';
    if (probability_percentage >= 45) return 'bg-teal-500';
    return 'bg-amber-500';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-extrabold text-sm shadow-sm">
            #{rank}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 capitalize tracking-tight">
                {disease}
              </h3>
              {getSeverityBadge()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Matched {matched_symptoms.length} of {total_disease_symptoms} characteristic symptoms
            </p>
            <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5" />
              Recommended: {recommended_specialist}
            </p>
          </div>
        </div>

        {/* Confidence Percentage */}
        <div className="text-right self-start sm:self-auto bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none w-full sm:w-auto">
          <div className="flex items-baseline justify-between sm:justify-end gap-1.5">
            <span className="text-xs text-slate-400 font-medium sm:hidden">Confidence:</span>
            <span className="text-2xl font-extrabold text-slate-900">
              {probability_percentage.toFixed(1)}%
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 block text-right">
            Confidence Score
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getConfidenceBarColor()}`}
          style={{ width: `${Math.min(probability_percentage, 100)}%` }}
        />
      </div>

      {/* Matched & Correlated Symptoms */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
        <div>
          <span className="font-semibold text-emerald-800 block mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Confirmed Patient Symptoms:
          </span>
          <div className="flex flex-wrap gap-1">
            {matched_symptoms.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {unmatched_disease_symptoms.length > 0 && (
          <div>
            <span className="font-semibold text-slate-500 block mb-1.5">
              Other Typical Indicators of this Disease:
            </span>
            <div className="flex flex-wrap gap-1">
              {unmatched_disease_symptoms.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize"
                >
                  {s}
                </span>
              ))}
              {unmatched_disease_symptoms.length > 4 && (
                <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 font-medium">
                  +{unmatched_disease_symptoms.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-400 flex items-center gap-1 w-full sm:w-auto">
          <Stethoscope className="w-3.5 h-3.5" />
          Home care & clinical remedies available
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => navigate(`/doctors?disease=${encodeURIComponent(disease)}`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Consult {recommended_specialist}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenRemedies(disease)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:translate-x-0.5"
          >
            <span>View Home Remedies</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
