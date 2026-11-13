import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  Stethoscope, 
  Calendar, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  ShieldCheck,
  User
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id?: string;
  consultation_id?: string;
  patient_id: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name?: string;
  doctor_specialization?: string;
  doctor_hospital?: string;
  doctor_clinic?: string;
  diagnosis: string;
  medications: Medication[];
  lab_tests?: string[];
  diet_advice?: string;
  general_notes?: string;
  follow_up_date?: string;
  created_at?: string;
}

interface PrescriptionModalProps {
  prescription?: Prescription | null;
  mode: 'VIEW' | 'CREATE';
  initialPatientId?: string;
  initialPatientName?: string;
  initialConsultationId?: string;
  initialDiagnosis?: string;
  onClose: () => void;
  onPrescriptionCreated?: (presc: Prescription) => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  prescription,
  mode,
  initialPatientId = '',
  initialPatientName = '',
  initialConsultationId = '',
  initialDiagnosis = '',
  onClose,
  onPrescriptionCreated,
}) => {
  const { user, token } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Form state for CREATE mode
  const [patientId] = useState(initialPatientId);
  const [patientName] = useState(initialPatientName);
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis || '');
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '500 mg', frequency: '1-0-1 (Morning & Night)', duration: '5 days', instructions: 'After food' }
  ]);
  const [labTestsInput, setLabTestsInput] = useState('');
  const [dietAdvice, setDietAdvice] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const handleAddMedication = () => {
    setMedications(prev => [
      ...prev,
      { name: '', dosage: '500 mg', frequency: '1-0-1', duration: '5 days', instructions: 'After food' }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: keyof Medication, value: string) => {
    setMedications(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert('Please enter a clinical diagnosis.');
      return;
    }
    const validMeds = medications.filter(m => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      alert('Please specify at least one medication name.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        consultation_id: initialConsultationId || undefined,
        patient_id: patientId,
        patient_name: patientName,
        diagnosis,
        medications: validMeds,
        lab_tests: labTestsInput ? labTestsInput.split(',').map(s => s.trim()).filter(Boolean) : [],
        diet_advice: dietAdvice,
        general_notes: generalNotes,
        follow_up_date: followUpDate || undefined
      };

      const res = await axios.post('http://localhost:8000/api/prescriptions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (onPrescriptionCreated) {
        onPrescriptionCreated(res.data);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to issue prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 print:hidden bg-slate-50 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {mode === 'CREATE' ? 'Issue Digital Medical Prescription (Rx)' : 'Official Clinical Prescription'}
              </h3>
              <p className="text-[11px] text-slate-500">MediCURE Electronic Health Record System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'VIEW' && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= VIEW MODE (Printable Slip) ================= */}
        {mode === 'VIEW' && prescription && (
          <div className="p-6 sm:p-10 space-y-6 text-slate-900">
            
            {/* Clinical Header / Letterhead */}
            <div className="border-b-2 border-emerald-600 pb-5 flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-black text-slate-900">Medi<span className="text-emerald-600">CURE</span></span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                    Clinical Telehealth
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900">Dr. {prescription.doctor_name || 'Practitioner'}</h2>
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  {prescription.doctor_specialization || 'Consultant Physician'}
                </p>
                {prescription.doctor_hospital && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {prescription.doctor_hospital}
                  </p>
                )}
                {prescription.doctor_clinic && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {prescription.doctor_clinic}
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 space-y-1">
                <div>Rx ID: <span className="font-mono font-bold text-slate-800">{prescription.id?.substring(0, 8).toUpperCase() || 'RX-MED'}</span></div>
                <div className="flex items-center sm:justify-end gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{prescription.created_at ? new Date(prescription.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString()}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Digitally Verified
                </div>
              </div>
            </div>

            {/* Patient Meta Strip */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold uppercase">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm">{prescription.patient_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold uppercase">Provisional Diagnosis</span>
                <span className="font-extrabold text-emerald-700 text-sm capitalize">{prescription.diagnosis}</span>
              </div>
            </div>

            {/* Standard Medical Rx Symbol Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-black font-serif italic text-emerald-700">℞</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prescribed Medication & Dosages</span>
              </div>

              {/* Medication Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Medicine Name</th>
                      <th className="py-2.5 px-3">Dosage</th>
                      <th className="py-2.5 px-3">Frequency</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {prescription.medications.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                        <td className="py-2.5 px-3 text-slate-700">{m.dosage}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-800">{m.frequency}</td>
                        <td className="py-2.5 px-3 text-slate-700">{m.duration}</td>
                        <td className="py-2.5 px-3 text-slate-500 italic">{m.instructions || 'As advised'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommended Lab Tests */}
            {prescription.lab_tests && prescription.lab_tests.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Diagnostic / Lab Tests</h4>
                <div className="flex flex-wrap gap-2">
                  {prescription.lab_tests.map((test, i) => (
                    <span key={i} className="px-3 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-100 text-xs font-bold">
                      🔬 {test}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Diet & Clinical Advice */}
            {prescription.diet_advice && (
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs">
                <span className="font-bold text-emerald-900 block mb-1">🥗 Dietary & Lifestyle Guidance:</span>
                <p className="text-emerald-800 leading-relaxed">{prescription.diet_advice}</p>
              </div>
            )}

            {/* General Clinical Notes */}
            {prescription.general_notes && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">📋 Clinical Notes:</span>
                <p className="text-slate-600 leading-relaxed">{prescription.general_notes}</p>
              </div>
            )}

            {/* Follow-up & Doctor Signature Footer */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
              <div>
                {prescription.follow_up_date && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Follow-up Review: {prescription.follow_up_date}</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  * Generated by MediCURE Telehealth. Take medications strictly as prescribed. In case of acute emergency, visit the nearest emergency facility.
                </p>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
                <div className="w-24 h-8 border-b border-dashed border-slate-400 mb-1 flex items-center justify-center text-[10px] text-emerald-700 italic font-serif">
                  Digitally Signed
                </div>
                <div className="font-bold text-slate-900">Dr. {prescription.doctor_name}</div>
                <div className="text-[10px] text-slate-400">Licensed Medical Practitioner</div>
              </div>
            </div>
          </div>
        )}

        {/* ================= CREATE MODE (Doctor Form) ================= */}
        {mode === 'CREATE' && (
          <form onSubmit={handleCreatePrescription} className="p-6 sm:p-8 space-y-6">
            
            {/* Patient Header Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Patient</span>
                <div className="font-black text-slate-900 text-base">{patientName}</div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Prescribing Doctor</span>
                <div className="font-bold text-emerald-700 text-sm">Dr. {user?.name}</div>
              </div>
            </div>

            {/* Clinical Diagnosis Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinical Diagnosis *
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Viral Bronchitis, Migraine with Aura, Gastritis"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Medications Table Builder */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Prescribed Medications *
                </label>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Medicine
                </button>
              </div>

              <div className="space-y-3">
                {medications.map((med, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-4">
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Medicine Name</label>
                      <input
                        type="text"
                        required
                        value={med.name}
                        onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Paracetamol"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                        placeholder="500 mg"
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      >
                        <option value="1-0-1 (Morning & Night)">1-0-1 (Morning & Night)</option>
                        <option value="1-1-1 (Thrice Daily)">1-1-1 (Thrice Daily)</option>
                        <option value="1-0-0 (Morning Only)">1-0-0 (Morning Only)</option>
                        <option value="0-0-1 (Night Only)">0-0-1 (Night Only)</option>
                        <option value="SOS (As needed)">SOS (As needed)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                        placeholder="5 days"
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Lab Tests */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Diagnostic Lab Tests (Comma separated)
              </label>
              <input
                type="text"
                value={labTestsInput}
                onChange={(e) => setLabTestsInput(e.target.value)}
                placeholder="e.g. Complete Blood Count (CBC), Fasting Blood Sugar, Chest X-Ray"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Diet & Lifestyle Advice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dietary & Lifestyle Advice
                </label>
                <textarea
                  rows={2}
                  value={dietAdvice}
                  onChange={(e) => setDietAdvice(e.target.value)}
                  placeholder="e.g. Drink 3L warm water, avoid oily/spicy foods, rest 3 days"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  General Clinical Notes
                </label>
                <textarea
                  rows={2}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="e.g. Review in clinic if temperature persists above 101F"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Recommended Follow-up Review Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Issuing...' : 'Issue Official Digital Prescription'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
