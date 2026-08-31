import React, { useState, useEffect } from 'react';
import { Search, BookOpen, ChevronRight, Stethoscope, Loader2, Sparkles, Filter } from 'lucide-react';
import { getDiseases } from '../services/api';
import { DiseaseInfo } from '../types';

interface DiseaseEncyclopediaProps {
  onSelectDisease: (diseaseName: string) => void;
}

export const DiseaseEncyclopedia: React.FC<DiseaseEncyclopediaProps> = ({ onSelectDisease }) => {
  const [diseases, setDiseases] = useState<DiseaseInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getDiseases(searchQuery)
      .then((res) => {
        setDiseases(res.diseases);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [searchQuery]);

  const alphabet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

  const filteredByLetter = activeLetter
    ? diseases.filter((d) => d.disease.toUpperCase().startsWith(activeLetter))
    : diseases;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" />
            <span>MediCURE Medical Knowledgebase</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Disease & Home Remedy Encyclopedia
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Browse our comprehensive index of all 261 clinical diseases, characteristic symptoms, and proven home remedy treatments verified against the MediCURE dataset.
          </p>
        </div>

        {/* Search bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveLetter(null);
              }}
              placeholder="Search diseases by name (e.g. Asthma, Encephalitis) or symptoms..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-inner"
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Alphabet Filter Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-1 items-center">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setActiveLetter(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              activeLetter === null
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveLetter(letter === activeLetter ? null : letter)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                activeLetter === letter
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Disease Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredByLetter.length} conditions
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Searching disease encyclopedia...</p>
          </div>
        ) : filteredByLetter.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-base font-semibold text-slate-700">No diseases found matching your search.</p>
            <p className="text-xs text-slate-400 mt-1">Try another keyword or reset the alphabet filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredByLetter.map((item) => (
              <div
                key={item.disease}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 capitalize group-hover:text-emerald-700 transition-colors">
                      {item.disease}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                      {item.total_symptoms} Symptoms
                    </span>
                  </div>

                  {/* Characteristic Symptoms Preview */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Key Symptoms:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.symptoms.slice(0, 3).map((sym) => (
                        <span
                          key={sym}
                          className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 text-xs capitalize border border-slate-100"
                        >
                          {sym}
                        </span>
                      ))}
                      {item.symptoms.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 text-xs">
                          +{item.symptoms.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remedies preview */}
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100/60">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                      Remedy Preview:
                    </span>
                    <p className="text-xs text-emerald-900 font-medium line-clamp-2">
                      {item.remedies.join(', ') || 'Consult doctor immediately.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {item.remedies.length} remedies
                  </span>
                  <button
                    onClick={() => onSelectDisease(item.disease)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 group-hover:translate-x-1 transition-all"
                  >
                    <span>View Treatment</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
