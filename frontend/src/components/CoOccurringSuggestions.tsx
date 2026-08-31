import React from 'react';
import { Network, Plus, Check, Loader2, Lightbulb } from 'lucide-react';
import { SymptomSuggestion } from '../types';

interface CoOccurringSuggestionsProps {
  suggestions: SymptomSuggestion[];
  selectedSymptoms: string[];
  onToggleSymptom: (symptom: string) => void;
  isLoading: boolean;
  associatedDiseasesCount: number;
}

export const CoOccurringSuggestions: React.FC<CoOccurringSuggestionsProps> = ({
  suggestions,
  selectedSymptoms,
  onToggleSymptom,
  isLoading,
  associatedDiseasesCount,
}) => {
  if (selectedSymptoms.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/40 rounded-2xl p-6 border border-teal-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-200/60">
        <div>
          <h3 className="text-base font-bold text-teal-950 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xs">
              2
            </span>
            <Lightbulb className="w-4 h-4 text-teal-700" />
            AI Co-Occurring Symptom Suggestions
          </h3>
          <p className="text-xs text-teal-800/80 mt-0.5">
            Patients with your selected symptoms also frequently reported the following:
          </p>
        </div>

        {associatedDiseasesCount > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100/90 text-teal-900 border border-teal-200 self-start sm:self-auto">
            {associatedDiseasesCount} correlated conditions analyzed
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center justify-center text-teal-700 gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analyzing medical correlation graph...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="py-4 text-xs text-teal-700 italic">
          No additional high-correlation symptoms found for this combination.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {suggestions.map(({ symptom, co_occurrence_count, relevance_score }) => {
            const isSelected = selectedSymptoms.includes(symptom);
            return (
              <button
                key={symptom}
                type="button"
                onClick={() => onToggleSymptom(symptom)}
                className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm ring-2 ring-teal-600'
                    : 'bg-white/90 hover:bg-white text-slate-800 border-teal-200/70 hover:border-teal-400 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-semibold capitalize line-clamp-2">
                    {symptom}
                  </span>
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 flex-shrink-0 text-teal-200 mt-0.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 flex-shrink-0 text-teal-600 mt-0.5" />
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className={isSelected ? 'text-teal-200' : 'text-slate-400'}>
                    Frequency: {co_occurrence_count}
                  </span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-teal-800 text-teal-100'
                        : 'bg-teal-50 text-teal-700'
                    }`}
                  >
                    {Math.round(relevance_score * 100)}% match
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
