import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X, Plus, Check, Loader2, AlertCircle } from 'lucide-react';
import { matchSymptomsNLP } from '../services/api';

interface SymptomSelectorProps {
  allSymptoms: string[];
  selectedSymptoms: string[];
  onToggleSymptom: (symptom: string) => void;
  onClearAll: () => void;
  selectedModel: string;
  onChangeModel: (model: string) => void;
}

const COMMON_SYMPTOMS = [
  'fever', 'headache', 'coughing', 'fatigue', 'nausea',
  'vomiting', 'chest pain', 'shortness breath', 'stomach pain',
  'joint bone pain', 'sore throat', 'chill', 'dizziness', 'skin rash'
];

export const SymptomSelector: React.FC<SymptomSelectorProps> = ({
  allSymptoms,
  selectedSymptoms,
  onToggleSymptom,
  onClearAll,
  selectedModel,
  onChangeModel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingNLP, setIsSearchingNLP] = useState(false);
  const [nlpMessage, setNlpMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter symptoms based on search term
  const filteredSymptoms = allSymptoms.filter(
    (sym) =>
      sym.toLowerCase().includes(searchTerm.toLowerCase().trim()) &&
      !selectedSymptoms.includes(sym)
  ).slice(0, 10);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFromDropdown = (sym: string) => {
    onToggleSymptom(sym);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleNLPTextParse = async () => {
    if (!searchTerm.trim()) return;
    setIsSearchingNLP(true);
    setNlpMessage(null);
    try {
      const res = await matchSymptomsNLP(searchTerm);
      if (res.matched_symptoms.length === 0) {
        setNlpMessage(`No exact matches found for "${searchTerm}". Try choosing from the suggestions below.`);
      } else {
        res.matched_symptoms.forEach((s) => {
          if (!selectedSymptoms.includes(s)) {
            onToggleSymptom(s);
          }
        });
        setNlpMessage(`Matched & added ${res.matched_symptoms.length} symptom(s)!`);
        setSearchTerm('');
      }
    } catch (err) {
      console.error(err);
      setNlpMessage('Error parsing query with NLP engine.');
    } finally {
      setIsSearchingNLP(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
              1
            </span>
            Describe or Select Symptoms
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Type your condition in plain English, search individual symptoms, or click common pills.
          </p>
        </div>

        {/* Algorithm Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs self-start md:self-auto">
          <span className="font-semibold text-slate-600">ML Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => onChangeModel(e.target.value)}
            className="bg-white font-medium text-slate-800 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="multinomial_nb">Multinomial Naive Bayes (Fastest & Best CV)</option>
            <option value="logistic_regression">Logistic Regression (High Accuracy)</option>
            <option value="random_forest">Random Forest Classifier</option>
            <option value="decision_tree">Decision Tree Classifier</option>
          </select>
        </div>
      </div>

      {/* Search Bar with NLP Support */}
      <div className="mt-5 relative" ref={dropdownRef}>
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
              setNlpMessage(null);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (filteredSymptoms.length > 0 && searchTerm.length < 20) {
                  handleSelectFromDropdown(filteredSymptoms[0]);
                } else {
                  handleNLPTextParse();
                }
              }
            }}
            placeholder="e.g. 'I have high fever with sharp headache and shivering' or type a symptom..."
            className="w-full pl-11 pr-32 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner text-sm sm:text-base"
          />

          <button
            type="button"
            onClick={handleNLPTextParse}
            disabled={!searchTerm.trim() || isSearchingNLP}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            {isSearchingNLP ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>AI Match</span>
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {isDropdownOpen && searchTerm.trim() && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredSymptoms.length > 0 ? (
              filteredSymptoms.map((sym) => (
                <div
                  key={sym}
                  onClick={() => handleSelectFromDropdown(sym)}
                  className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-sm text-slate-700 hover:text-emerald-900 transition-colors"
                >
                  <span className="capitalize">{sym}</span>
                  <Plus className="w-4 h-4 text-emerald-600" />
                </div>
              ))
            ) : (
              <div className="p-3.5 text-center text-xs text-slate-500">
                <span>Press </span>
                <span className="font-semibold text-emerald-700">"AI Match"</span>
                <span> to extract symptoms from your sentence</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NLP Feedback Alert */}
      {nlpMessage && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{nlpMessage}</span>
        </div>
      )}

      {/* Quick Common Symptoms */}
      <div className="mt-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
          Popular Symptoms:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_SYMPTOMS.map((sym) => {
            const isSelected = selectedSymptoms.includes(sym);
            return (
              <button
                key={sym}
                type="button"
                onClick={() => onToggleSymptom(sym)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                <span className="capitalize">{sym}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Symptoms Chips */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>Selected Symptoms</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs">
              {selectedSymptoms.length}
            </span>
          </span>

          {selectedSymptoms.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {selectedSymptoms.length === 0 ? (
          <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400 font-medium">No symptoms selected yet.</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Select at least 2 or 3 symptoms for the highest prediction accuracy.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map((sym) => (
              <span
                key={sym}
                className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <span className="capitalize">{sym}</span>
                <button
                  type="button"
                  onClick={() => onToggleSymptom(sym)}
                  className="w-4 h-4 rounded-full bg-emerald-200/70 hover:bg-emerald-300 flex items-center justify-center text-emerald-900 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
