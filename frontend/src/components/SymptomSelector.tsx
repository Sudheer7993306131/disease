import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  X, 
  Plus, 
  Check, 
  Loader2, 
  AlertCircle, 
  Layers, 
  Activity, 
  Thermometer 
} from 'lucide-react';
import { matchSymptomsNLP } from '../services/api';

interface SymptomSelectorProps {
  allSymptoms: string[];
  selectedSymptoms: string[];
  onToggleSymptom: (symptom: string) => void;
  onClearAll: () => void;
  selectedModel: string;
  onChangeModel: (model: string) => void;
}

const SYMPTOM_CATEGORIES: { [key: string]: { label: string; icon: string; symptoms: string[] } } = {
  'Frequent': {
    label: 'Common Triage',
    icon: '🌟',
    symptoms: [
      'fever', 'headache', 'coughing', 'fatigue', 'nausea',
      'vomiting', 'chest pain', 'shortness breath', 'stomach pain',
      'joint bone pain', 'sore throat', 'chill', 'dizziness', 'skin rash'
    ]
  },
  'Vitals': {
    label: 'General & Vitals',
    icon: '🌡️',
    symptoms: [
      'fever', 'chill', 'fatigue', 'high fever', 'mild fever', 'sweating', 'weight loss', 'weakness', 'malaise'
    ]
  },
  'Respiratory': {
    label: 'Respiratory & Chest',
    icon: '🫁',
    symptoms: [
      'coughing', 'shortness breath', 'sore throat', 'chest pain', 'sinus congestion', 'runny nose', 'wheezing', 'phlegm'
    ]
  },
  'Digestive': {
    label: 'Digestive & Stomach',
    icon: '🩺',
    symptoms: [
      'stomach pain', 'nausea', 'vomiting', 'acidity', 'diarrhea', 'constipation', 'abdominal pain', 'loss of appetite', 'indigestion'
    ]
  },
  'Neuro': {
    label: 'Head & Neurological',
    icon: '🧠',
    symptoms: [
      'headache', 'dizziness', 'blurred vision', 'insomnia', 'migraine', 'depression', 'anxiety', 'altered sensorium'
    ]
  },
  'Joints': {
    label: 'Joints & Bones',
    icon: '🦴',
    symptoms: [
      'joint bone pain', 'muscle pain', 'back pain', 'neck pain', 'knee pain', 'swollen joints', 'joint stiffness'
    ]
  },
  'Skin': {
    label: 'Skin & Allergy',
    icon: '🧴',
    symptoms: [
      'skin rash', 'itching', 'skin peeling', 'redness eyes', 'blister', 'acne', 'yellowish skin'
    ]
  }
};

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
  const [activeCategory, setActiveCategory] = useState<string>('Frequent');
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
        setNlpMessage(`No direct matches found for "${searchTerm}". Try browsing categories or typing individual keywords.`);
      } else {
        res.matched_symptoms.forEach((s) => {
          if (!selectedSymptoms.includes(s)) {
            onToggleSymptom(s);
          }
        });
        setNlpMessage(`Successfully identified and selected ${res.matched_symptoms.length} symptom(s)!`);
        setSearchTerm('');
      }
    } catch (err) {
      console.error(err);
      setNlpMessage('Error running natural language parsing on symptom query.');
    } finally {
      setIsSearchingNLP(false);
    }
  };

  const activeCategoryData = SYMPTOM_CATEGORIES[activeCategory] || SYMPTOM_CATEGORIES['Frequent'];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-6">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs shadow-sm shadow-emerald-600/30">
              1
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Enter or Select Clinical Symptoms
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Describe symptoms in plain sentences, search individual clinical terms, or pick from body systems.
          </p>
        </div>

        {/* Algorithm Selector */}
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-200 text-xs self-start sm:self-auto shrink-0 shadow-xs">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-slate-600">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => onChangeModel(e.target.value)}
            className="bg-transparent font-extrabold text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="multinomial_nb">Multinomial Naive Bayes (98.7% CV)</option>
            <option value="logistic_regression">Logistic Regression (98.2% CV)</option>
            <option value="random_forest">Random Forest Classifier (97.9% CV)</option>
            <option value="decision_tree">Decision Tree Classifier (95.1% CV)</option>
          </select>
        </div>
      </div>

      {/* Natural Language AI Search Bar */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4.5 w-4.5" />
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
                if (filteredSymptoms.length > 0 && searchTerm.length < 25) {
                  handleSelectFromDropdown(filteredSymptoms[0]);
                } else {
                  handleNLPTextParse();
                }
              }
            }}
            placeholder="Type symptoms or full sentence e.g. 'high fever with headache and chills'..."
            className="w-full pl-11 pr-32 py-3.5 bg-slate-50/90 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs sm:text-sm shadow-inner"
          />

          <button
            type="button"
            onClick={handleNLPTextParse}
            disabled={!searchTerm.trim() || isSearchingNLP}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-98"
          >
            {isSearchingNLP ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            )}
            <span>AI Match</span>
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {isDropdownOpen && searchTerm.trim() && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
            {filteredSymptoms.length > 0 ? (
              filteredSymptoms.map((sym) => (
                <div
                  key={sym}
                  onClick={() => handleSelectFromDropdown(sym)}
                  className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs sm:text-sm text-slate-700 hover:text-emerald-900 transition-colors"
                >
                  <span className="capitalize font-semibold">{sym}</span>
                  <Plus className="w-4 h-4 text-emerald-600" />
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                <span>Press </span>
                <span className="font-bold text-emerald-700">"AI Match"</span>
                <span> to extract clinical tags from your full phrase</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NLP Feedback Alert */}
      {nlpMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{nlpMessage}</span>
        </div>
      )}

      {/* Body System & Organ Categories */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Browse by Clinical Body System
          </span>
          <span className="text-[11px] text-slate-400 font-semibold">Click any tag to add</span>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(SYMPTOM_CATEGORIES).map(([catKey, catData]) => {
            const isCatActive = activeCategory === catKey;
            const selectedInCat = catData.symptoms.filter(s => selectedSymptoms.includes(s)).length;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setActiveCategory(catKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isCatActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{catData.icon}</span>
                <span>{catData.label}</span>
                {selectedInCat > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold ml-0.5">
                    {selectedInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Symptom Tag Pills for Active Category */}
        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-wrap gap-2">
          {activeCategoryData.symptoms.map((sym) => {
            const isSelected = selectedSymptoms.includes(sym);

            return (
              <button
                key={sym}
                type="button"
                onClick={() => onToggleSymptom(sym)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white text-slate-700 border border-slate-200/80 hover:border-emerald-300 hover:text-emerald-800 shadow-2xs'
                }`}
              >
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="capitalize">{sym}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Symptoms Tray */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Selected Clinical Symptoms
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              selectedSymptoms.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
            }`}>
              {selectedSymptoms.length}
            </span>
          </div>

          {selectedSymptoms.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {selectedSymptoms.length === 0 ? (
          <div className="py-7 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <Thermometer className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-slate-500 font-bold">No symptoms selected yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select 2 to 4 symptoms above for the highest medical diagnosis accuracy.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map((sym) => (
              <span
                key={sym}
                className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/90 text-emerald-950 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs animate-in fade-in"
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
