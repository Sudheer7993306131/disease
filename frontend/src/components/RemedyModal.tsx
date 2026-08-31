import React, { useEffect, useState } from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, HeartHandshake, Printer, Check, Loader2, Stethoscope, Utensils } from 'lucide-react';
import { getDiseaseRemedies } from '../services/api';

interface RemedyModalProps {
  diseaseName: string | null;
  onClose: () => void;
}

export const RemedyModal: React.FC<RemedyModalProps> = ({ diseaseName, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!diseaseName) return;
    setIsLoading(true);
    getDiseaseRemedies(diseaseName)
      .then((res) => {
        setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [diseaseName]);

  if (!diseaseName) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!data) return;
    const text = `MediCURE - Home Remedies for ${data.disease}:\n\n` +
      data.home_remedies.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n') +
      `\n\n*Note: This is for educational and supportive care only. Consult a doctor for medical diagnosis.*`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden relative transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>Home Care & Treatment Protocol</span>
          </div>

          <h2 className="text-2xl font-extrabold capitalize">{diseaseName}</h2>

          {data && (
            <div className="mt-3 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                Severity: {data.severity}
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                {data.home_remedies?.length || 0} Actionable Remedies
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Fetching clinical home remedies & dataset details...</p>
            </div>
          ) : data ? (
            <>
              {/* Home Remedies List */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Recommended Home Remedies & Supportive Care
                </h3>

                <div className="space-y-2.5">
                  {data.home_remedies && data.home_remedies.length > 0 ? (
                    data.home_remedies.map((remedy: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800 text-sm leading-relaxed"
                      >
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs mt-0.5 shadow-sm">
                          {idx + 1}
                        </div>
                        <span className="font-medium">{remedy}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      No specific home remedy registered. Please follow general rest and hydration protocols.
                    </p>
                  )}
                </div>
              </div>

              {/* General Health and Nutrition Tips */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Utensils className="w-4 h-4 text-teal-700" />
                  Hydration & Supportive Dietary Advice
                </h4>
                <ul className="text-xs text-teal-900/90 space-y-1.5 list-disc list-inside">
                  <li>Drink 2–3 liters of warm water or electrolyte fluids daily.</li>
                  <li>Incorporate antioxidant-rich light soups, broths, and fresh fruits.</li>
                  <li>Avoid heavy, spicy, ultra-processed, or high-sugar foods during recovery.</li>
                  <li>Ensure 8+ hours of uninterrupted sleep in a ventilated resting space.</li>
                </ul>
              </div>

              {/* Red Flag Warning Alert */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      When to Seek Immediate Medical Attention
                    </h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      If you experience persistent high fever ({'>'}103°F/39.5°C), severe breathing difficulty, sudden chest pain, confusion, persistent vomiting, or symptoms lasting more than 3–5 days, consult a qualified healthcare professional immediately.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              Unable to load remedy details.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Remedies'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Guide</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
