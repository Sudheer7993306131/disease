import React from 'react';
import { Activity, BookOpen, BarChart3, Info, HeartPulse } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('checker')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-xl font-bold tracking-tight text-slate-900">Medi</span>
                <span className="text-xl font-extrabold tracking-tight text-emerald-600">CURE</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  v2.0 AI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Disease Prediction & Home Remedies
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('checker')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'checker'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Symptom Checker</span>
            </button>

            <button
              onClick={() => setActiveTab('encyclopedia')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'encyclopedia'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Encyclopedia</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmarks')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'benchmarks'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>ML Benchmarks</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'about'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">About</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
