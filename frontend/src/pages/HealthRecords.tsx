import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Activity, 
  HeartPulse, 
  Pill, 
  ShieldAlert, 
  Calendar, 
  Printer, 
  Stethoscope, 
  Trash2, 
  ExternalLink, 
  Scale, 
  Droplets, 
  Sparkles, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Phone,
  User,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { PrescriptionModal, Prescription } from '../components/PrescriptionModal';
import { ConsultationSummary } from '../components/ConsultationSummary';
import { PredictResponse } from '../types';

interface DiagnosticHistoryItem {
  id: string;
  symptoms: string[];
  predicted_disease: string;
  confidence: number;
  severity: string;
  model_name?: string;
  created_at: string;
}

interface EmergencyProfile {
  blood_group?: string;
  allergies?: string;
  chronic_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export default function HealthRecords() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'diagnostics' | 'prescriptions' | 'calculators' | 'emergency'>('diagnostics');

  // Diagnostics History
  const [history, setHistory] = useState<DiagnosticHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [summaryReportData, setSummaryReportData] = useState<PredictResponse | null>(null);

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // Vitals & Calculators state
  // BMI
  const [bmiHeight, setBmiHeight] = useState<number>(172);
  const [bmiWeight, setBmiWeight] = useState<number>(68);
  // Blood Pressure
  const [bpSystolic, setBpSystolic] = useState<number>(120);
  const [bpDiastolic, setBpDiastolic] = useState<number>(80);
  // Hydration
  const [waterWeight, setWaterWeight] = useState<number>(65);

  // Emergency Profile
  const [emergency, setEmergency] = useState<EmergencyProfile>({
    blood_group: 'O+',
    allergies: 'None reported',
    chronic_conditions: 'None reported',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: ''
  });
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [emergencySavedMsg, setEmergencySavedMsg] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    } else if (user && token) {
      fetchDiagnosticHistory();
      fetchPrescriptions();
      fetchEmergencyProfile();
    }
  }, [user, token, isLoading]);

  const fetchDiagnosticHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('http://localhost:8000/api/diagnostics/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (e) {
      console.error('Error fetching diagnostic history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const res = await axios.get('http://localhost:8000/api/prescriptions/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(res.data);
    } catch (e) {
      console.error('Error fetching prescriptions:', e);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const fetchEmergencyProfile = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/user/emergency-profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmergency(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDiagnostic = async (id: string) => {
    if (!confirm('Are you sure you want to remove this diagnostic record?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/diagnostics/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      alert('Failed to delete record.');
    }
  };

  const handleSaveEmergencyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmergency(true);
    try {
      await axios.put('http://localhost:8000/api/user/emergency-profile', emergency, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmergencySavedMsg(true);
      setTimeout(() => setEmergencySavedMsg(false), 3000);
    } catch (e) {
      alert('Failed to save emergency profile.');
    } finally {
      setSavingEmergency(false);
    }
  };

  // BMI Calculation
  const bmiValue = React.useMemo(() => {
    if (!bmiHeight || !bmiWeight) return 0;
    const heightInMeters = bmiHeight / 100;
    return +(bmiWeight / (heightInMeters * heightInMeters)).toFixed(1);
  }, [bmiHeight, bmiWeight]);

  const bmiCategory = React.useMemo(() => {
    if (bmiValue < 18.5) return { label: 'Underweight', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (bmiValue < 25) return { label: 'Normal Weight', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (bmiValue < 30) return { label: 'Overweight', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { label: 'Obese', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  }, [bmiValue]);

  // Blood Pressure Category
  const bpCategory = React.useMemo(() => {
    if (bpSystolic > 180 || bpDiastolic > 120) {
      return { label: 'Hypertensive Crisis', color: 'text-rose-700 bg-rose-50 border-rose-200', advice: 'Seek immediate emergency clinical care!' };
    }
    if (bpSystolic >= 140 || bpDiastolic >= 90) {
      return { label: 'Hypertension Stage 2', color: 'text-rose-600 bg-rose-50 border-rose-200', advice: 'Consult your cardiologist or general practitioner.' };
    }
    if (bpSystolic >= 130 || bpDiastolic >= 80) {
      return { label: 'Hypertension Stage 1', color: 'text-orange-600 bg-orange-50 border-orange-200', advice: 'Adopt lifestyle & dietary sodium adjustments.' };
    }
    if (bpSystolic >= 120 && bpDiastolic < 80) {
      return { label: 'Elevated BP', color: 'text-amber-600 bg-amber-50 border-amber-200', advice: 'Maintain physical activity and monitor periodically.' };
    }
    return { label: 'Optimal / Normal BP', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', advice: 'Great! Your blood pressure is in the healthy zone.' };
  }, [bpSystolic, bpDiastolic]);

  // Daily Water Intake (35ml per kg)
  const waterTargetLiters = React.useMemo(() => {
    return +(waterWeight * 0.035).toFixed(1);
  }, [waterWeight]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab={'checker' as any} setActiveTab={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Comprehensive Health Portfolio
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              My Health Records & Vitals
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
              Track your diagnostic timeline, access official doctor prescriptions (Rx), monitor vital health metrics, and manage your emergency ID card.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span>New Symptom Check</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>AI Diagnostic Records ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'prescriptions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>Prescriptions & Rx ({prescriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calculators')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'calculators'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Smart Health Calculators</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'emergency'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Medical ID</span>
          </button>
        </div>

        {/* ================= TAB 1: DIAGNOSTIC HISTORY ================= */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="py-20 text-center text-slate-500 font-semibold text-sm">
                Loading clinical history...
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">No Diagnostic Records Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                  Whenever you run the AI Symptom Checker while signed in, your disease predictions and clinical scores will be securely archived here.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Run Your First Symptom Check
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {history.map((record) => (
                  <div key={record.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {record.model_name || 'AI Model'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-lg capitalize mb-1">
                        {record.predicted_disease}
                      </h3>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-emerald-700">
                          {record.confidence.toFixed(1)}% Match Probability
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          record.severity === 'Severe' ? 'bg-rose-100 text-rose-800' :
                          record.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {record.severity} Severity
                        </span>
                      </div>

                      {/* Symptoms tags */}
                      <div className="mb-4">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">Reported Symptoms:</span>
                        <div className="flex flex-wrap gap-1">
                          {record.symptoms.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium capitalize">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => navigate(`/doctors?disease=${encodeURIComponent(record.predicted_disease)}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Find Doctor</span>
                      </button>

                      <button
                        onClick={() => handleDeleteDiagnostic(record.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PRESCRIPTIONS (Rx) ================= */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {loadingPrescriptions ? (
              <div className="py-20 text-center text-slate-500 font-semibold text-sm">
                Loading digital prescriptions...
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">No Prescriptions Issued Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                  When a doctor completes your telemedicine consultation and issues an official clinical prescription, it will appear here for viewing and printing.
                </p>
                <button
                  onClick={() => navigate('/doctors')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Consult a Specialist
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {prescriptions.map((presc) => (
                  <div key={presc.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="font-mono font-bold text-emerald-700">℞ {presc.id?.substring(0, 8).toUpperCase()}</span>
                        <span>{presc.created_at ? new Date(presc.created_at).toLocaleDateString() : 'Recent'}</span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base mb-0.5">
                        Dr. {presc.doctor_name}
                      </h3>
                      <p className="text-xs font-bold text-emerald-700 mb-3">{presc.doctor_specialization || 'Consultant Physician'}</p>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-3 space-y-1">
                        <div>
                          <span className="text-slate-400">Diagnosis: </span>
                          <strong className="text-slate-800 capitalize">{presc.diagnosis}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Medications: </span>
                          <strong className="text-slate-800">{presc.medications.length} prescribed drugs</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPrescription(presc)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View & Print Prescription</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: SMART HEALTH CALCULATORS ================= */}
        {activeTab === 'calculators' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* BMI Calculator Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Body Mass Index (BMI)</h3>
                    <p className="text-xs text-slate-500">World Health Organization Standard</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Height: {bmiHeight} cm</span>
                      <span className="text-slate-400">{(bmiHeight / 30.48).toFixed(1)} ft</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={220}
                      value={bmiHeight}
                      onChange={(e) => setBmiHeight(+e.target.value)}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Weight: {bmiWeight} kg</span>
                      <span className="text-slate-400">{(bmiWeight * 2.205).toFixed(0)} lbs</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={180}
                      value={bmiWeight}
                      onChange={(e) => setBmiWeight(+e.target.value)}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* BMI Output Display */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-3xl font-black text-slate-900">{bmiValue}</div>
                <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${bmiCategory.color}`}>
                  {bmiCategory.label}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Healthy target range for {bmiHeight}cm: <strong>{+(18.5 * Math.pow(bmiHeight/100, 2)).toFixed(0)} - {+(24.9 * Math.pow(bmiHeight/100, 2)).toFixed(0)} kg</strong>
                </p>
              </div>
            </div>

            {/* Blood Pressure Evaluator Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Blood Pressure Category</h3>
                    <p className="text-xs text-slate-500">American Heart Association Standard</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Systolic Pressure (mmHg)</label>
                    <input
                      type="number"
                      min={70}
                      max={220}
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(+e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Diastolic Pressure (mmHg)</label>
                    <input
                      type="number"
                      min={40}
                      max={140}
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(+e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BP Output Display */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-2xl font-black text-slate-900">{bpSystolic} / {bpDiastolic} <span className="text-xs text-slate-400 font-normal">mmHg</span></div>
                <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${bpCategory.color}`}>
                  {bpCategory.label}
                </div>
                <p className="text-[11px] text-slate-600 mt-2 font-medium">
                  {bpCategory.advice}
                </p>
              </div>
            </div>

            {/* Daily Hydration Target Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Daily Water Target</h3>
                    <p className="text-xs text-slate-500">Clinical Hydration Algorithm</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Body Weight: {waterWeight} kg</span>
                    </div>
                    <input
                      type="range"
                      min={35}
                      max={150}
                      value={waterWeight}
                      onChange={(e) => setWaterWeight(+e.target.value)}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Based on standard clinical physiological requirements (~35 mL per kilogram of body mass per day).
                  </p>
                </div>
              </div>

              {/* Hydration Output */}
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 text-center">
                <div className="text-3xl font-black text-sky-900">{waterTargetLiters} <span className="text-base font-normal">Liters / day</span></div>
                <div className="mt-1 text-xs font-bold text-sky-700">
                  ≈ {Math.round((waterTargetLiters * 1000) / 250)} Standard Glasses (250ml)
                </div>
                <p className="text-[11px] text-sky-600 mt-1">
                  Increase by +500ml during intense workouts or fever.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 4: EMERGENCY MEDICAL ID ================= */}
        {activeTab === 'emergency' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-1">Emergency Medical Profile</h3>
              <p className="text-xs text-slate-500 mb-6">
                Critical health data readily available for emergency personnel and consulting physicians.
              </p>

              {emergencySavedMsg && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Emergency Medical Profile updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveEmergencyProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Group</label>
                  <select
                    value={emergency.blood_group || 'O+'}
                    onChange={(e) => setEmergency(prev => ({ ...prev, blood_group: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Known Drug or Food Allergies</label>
                  <input
                    type="text"
                    value={emergency.allergies || ''}
                    onChange={(e) => setEmergency(prev => ({ ...prev, allergies: e.target.value }))}
                    placeholder="e.g. Penicillin, Sulfa, Peanuts, Latex (or None)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pre-existing / Chronic Conditions</label>
                  <input
                    type="text"
                    value={emergency.chronic_conditions || ''}
                    onChange={(e) => setEmergency(prev => ({ ...prev, chronic_conditions: e.target.value }))}
                    placeholder="e.g. Asthma, Type 2 Diabetes, Hypertension (or None)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Emergency Contact Person</label>
                    <input
                      type="text"
                      value={emergency.emergency_contact_name || ''}
                      onChange={(e) => setEmergency(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                      placeholder="e.g. Sarah Smith (Spouse)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      value={emergency.emergency_contact_phone || ''}
                      onChange={(e) => setEmergency(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingEmergency}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    {savingEmergency ? 'Saving...' : 'Save Emergency Health Profile'}
                  </button>
                </div>
              </form>
            </div>

            {/* Printable Emergency ID Preview Card */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div className="bg-gradient-to-br from-rose-600 to-rose-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-rose-200" />
                    <span className="font-black text-sm uppercase tracking-wider">MediCURE Emergency ID</span>
                  </div>
                  <span className="text-xl font-black bg-white text-rose-700 px-3 py-1 rounded-xl shadow-sm">
                    {emergency.blood_group || 'O+'}
                  </span>
                </div>

                <div className="space-y-3 text-xs mb-6">
                  <div>
                    <span className="text-rose-200 text-[10px] uppercase font-bold block">Patient Name</span>
                    <span className="font-black text-base">{user?.name}</span>
                  </div>

                  <div>
                    <span className="text-rose-200 text-[10px] uppercase font-bold block">Drug Allergies</span>
                    <span className="font-semibold">{emergency.allergies || 'None reported'}</span>
                  </div>

                  <div>
                    <span className="text-rose-200 text-[10px] uppercase font-bold block">Chronic Conditions</span>
                    <span className="font-semibold">{emergency.chronic_conditions || 'None reported'}</span>
                  </div>

                  {emergency.emergency_contact_name && (
                    <div className="pt-2 border-t border-rose-500/50">
                      <span className="text-rose-200 text-[10px] uppercase font-bold block">Emergency Contact</span>
                      <span className="font-bold flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        {emergency.emergency_contact_name} - {emergency.emergency_contact_phone}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-rose-200 pt-2 border-t border-rose-500/50">
                  <span>Emergency First Responder Card</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => window.print()}
                  className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Emergency Medical Card</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Prescription View Modal */}
      {selectedPrescription && (
        <PrescriptionModal
          prescription={selectedPrescription}
          mode="VIEW"
          onClose={() => setSelectedPrescription(null)}
        />
      )}

      {/* Summary Report Modal */}
      {summaryReportData && (
        <ConsultationSummary
          predictionData={summaryReportData}
          onClose={() => setSummaryReportData(null)}
        />
      )}

      <Footer />
    </div>
  );
}
