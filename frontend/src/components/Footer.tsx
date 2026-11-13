import React from 'react';
import { HeartPulse, ShieldCheck, Activity, Award, Mail, Phone, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-auto">
      {/* Upper Footer: Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Medi<span className="text-emerald-400">CURE</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v2.0 AI
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clinical decision support and intelligent symptom triaging powered by machine learning algorithms and verified home remedy databases.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All AI Diagnostic Services Operational</span>
            </div>
          </div>

          {/* Clinical Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Diagnostic Tools</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" /> AI Symptom Checker
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="hover:text-emerald-400 transition-colors">
                  Find Verified Specialists
                </Link>
              </li>
              <li>
                <Link to="/users" className="hover:text-emerald-400 transition-colors">
                  Specialist & User Directory
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">
                  Patient Consultation Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Model & Standards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">ML Intelligence</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Multinomial Naive Bayes (98.2% CV)</span>
              </li>
              <li className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Random Forest & Decision Trees</span>
              </li>
              <li className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Logistic Regression Benchmarks</span>
              </li>
              <li className="text-[11px] text-slate-500 pt-1">
                Trained on 489+ symptom features across 261 clinical profiles.
              </li>
            </ul>
          </div>

          {/* Emergency & Advisory Notice */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Emergency Notice</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              MediCURE is designed for preliminary guidance and informational purposes. If you are experiencing severe chest pain, shortness of breath, or medical trauma, call your local emergency department immediately.
            </p>
          </div>

        </div>
      </div>

      {/* Bottom Bar: Copyright & Compliance */}
      <div className="border-t border-slate-800/80 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MediCURE AI Health Systems. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Clinical Guidance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
