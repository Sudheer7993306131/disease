import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Stethoscope, 
  User, 
  ArrowRight, 
  AlertCircle,
  Filter,
  Activity,
  Trash2,
  KeyRound,
  MapPin,
  Copy,
  Check,
  FileText,
  X,
  Loader2,
  Pill
} from 'lucide-react';
import { PrescriptionModal } from '../components/PrescriptionModal';

export default function ConsultationDashboard() {
  const { user, token, isLoading } = useAuth();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const navigate = useNavigate();

  // Accept Appointment Modal state for doctors
  const [acceptModalConsultation, setAcceptModalConsultation] = useState<any | null>(null);
  const [acceptForm, setAcceptForm] = useState({
    consultation_code: '',
    location: '',
    instructions: ''
  });
  const [submittingAccept, setSubmittingAccept] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Decline Appointment Modal state for doctors
  const [declineModalConsultation, setDeclineModalConsultation] = useState<any | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [submittingDecline, setSubmittingDecline] = useState(false);

  // Prescription Modal State
  const [prescModal, setPrescModal] = useState<{
    open: boolean;
    mode: 'VIEW' | 'CREATE';
    consultation?: any;
    prescription?: any;
  }>({ open: false, mode: 'VIEW' });

  const handleViewPrescription = async (prescId: string) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/prescriptions/${prescId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescModal({
        open: true,
        mode: 'VIEW',
        prescription: res.data
      });
    } catch (e) {
      alert('Unable to load prescription details.');
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    } else if (user && token) {
      fetchConsultations();
    }
  }, [user, token, isLoading]);

  const fetchConsultations = () => {
    if (!token) return;
    axios.get('http://localhost:8000/api/consultations', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setConsultations(res.data))
      .catch(err => console.error(err));
  };

  const handleOpenAcceptModal = (c: any) => {
    setAcceptModalConsultation(c);
    const randomCode = `MED-${Math.floor(1000 + Math.random() * 9000)}`;
    setAcceptForm({
      consultation_code: randomCode,
      location: c.type === 'OFFLINE' ? 'Hospital OPD Suite, Room 204' : 'Online Medical Video Room 1',
      instructions: 'Please be ready 5 minutes before scheduled consultation time.'
    });
  };

  const handleConfirmAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptModalConsultation) return;
    setSubmittingAccept(true);

    try {
      await axios.put(`http://localhost:8000/api/consultations/${acceptModalConsultation.id}/status`, {
        status: 'ACCEPTED',
        consultation_code: acceptForm.consultation_code,
        location: acceptForm.location,
        instructions: acceptForm.instructions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAcceptModalConsultation(null);
      fetchConsultations();
    } catch (err) {
      console.error(err);
      alert('Failed to accept consultation');
    } finally {
      setSubmittingAccept(false);
    }
  };

  const handleOpenDeclineModal = (c: any) => {
    setDeclineModalConsultation(c);
    setDeclineReason('Doctor is unavailable at the requested time slot. Please choose another time or specialist.');
  };

  const handleConfirmDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModalConsultation) return;
    setSubmittingDecline(true);

    try {
      await axios.put(`http://localhost:8000/api/consultations/${declineModalConsultation.id}/status`, {
        status: 'REJECTED',
        rejection_reason: declineReason.trim() || 'Doctor is unavailable at requested time slot.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDeclineModalConsultation(null);
      fetchConsultations();
    } catch (err) {
      console.error(err);
      alert('Failed to decline consultation');
    } finally {
      setSubmittingDecline(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this consultation request?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/consultations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchConsultations();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel consultation');
    }
  };

  const totalCount = consultations.length;
  const pendingCount = consultations.filter(c => c.status === 'PENDING').length;
  const acceptedCount = consultations.filter(c => c.status === 'ACCEPTED').length;
  const rejectedCount = consultations.filter(c => c.status === 'REJECTED').length;

  const filteredConsultations = consultations.filter(c => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': 
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" /> Pending Review
          </span>
        );
      case 'ACCEPTED': 
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmed & Active
          </span>
        );
      case 'REJECTED': 
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Request Cancelled
          </span>
        );
      default: 
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 font-bold">
          <Activity className="w-6 h-6 text-emerald-600 animate-spin" />
          Loading consultation records...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar activeTab={'checker' as any} setActiveTab={() => {}} />
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Care Coordination Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {user?.role === 'DOCTOR' ? 'Doctor Consultation Schedule' : 'My Clinical Consultations'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage appointments, medical triaging records, and secure direct doctor-patient communication
            </p>
          </div>

          {user?.role !== 'DOCTOR' && (
            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto active:scale-98"
            >
              <Stethoscope className="w-4 h-4" />
              Book Specialist
            </Link>
          )}
        </div>

        {/* Executive Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div 
            onClick={() => setStatusFilter('ALL')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'ALL' 
                ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/5' 
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Consultations</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          </div>

          <div 
            onClick={() => setStatusFilter('ACCEPTED')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'ACCEPTED' 
                ? 'bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/10' 
                : 'bg-white border-slate-200/80 hover:border-emerald-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Confirmed & Active</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-1">{acceptedCount}</p>
          </div>

          <div 
            onClick={() => setStatusFilter('PENDING')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'PENDING' 
                ? 'bg-amber-50/50 border-amber-500 shadow-md ring-2 ring-amber-500/10' 
                : 'bg-white border-slate-200/80 hover:border-amber-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</p>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
          </div>

          <div 
            onClick={() => setStatusFilter('REJECTED')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'REJECTED' 
                ? 'bg-rose-50/50 border-rose-500 shadow-md ring-2 ring-rose-500/10' 
                : 'bg-white border-slate-200/80 hover:border-rose-200 shadow-sm'
            }`}
          >
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Cancelled</p>
            <p className="text-2xl font-black text-rose-700 mt-1">{rejectedCount}</p>
          </div>
        </div>

        {/* Consultations List */}
        <div className="space-y-4">
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No consultations in this category</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {statusFilter === 'ALL' 
                  ? "You don't have any consultation bookings scheduled yet." 
                  : `There are currently no consultations with status '${statusFilter}'.`}
              </p>
              <div className="mt-6">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition-all"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Run Symptom Checker
                </Link>
              </div>
            </div>
          ) : (
            filteredConsultations.map(c => (
              <div 
                key={c.id} 
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-base shadow-inner shrink-0">
                      {user?.role === 'DOCTOR' ? <User className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                          {user?.role === 'DOCTOR' 
                            ? `Patient: ${c.other_party_name || 'Anonymous User'}`
                            : `Specialist: ${c.other_party_name || 'Dr. Assigned'}`}
                        </h3>
                        {getStatusBadge(c.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Booked: {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Type: {c.type || 'Online Consultation'}
                        </span>
                        <span className="text-slate-400">
                          Ref #{c.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons for Pending */}
                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                    {user?.role === 'DOCTOR' && c.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleOpenAcceptModal(c)} 
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Appointment</span>
                        </button>
                        <button 
                          onClick={() => handleOpenDeclineModal(c)} 
                          className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-all"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    
                    {user?.role === 'USER' && c.status === 'PENDING' && (
                      <button 
                        onClick={() => handleDelete(c.id)} 
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>

                {/* Accepted Appointment Details Box (Code + Location) */}
                {c.status === 'ACCEPTED' && (
                  <div className="mt-2 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                          Consultation Code:
                        </span>
                        <span className="px-3 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-black text-slate-900 tracking-wider shadow-xs">
                          {c.consultation_code || `MED-${c.id.substring(0, 4).toUpperCase()}`}
                        </span>
                        <button
                          onClick={() => handleCopyCode(c.consultation_code || `MED-${c.id.substring(0, 4).toUpperCase()}`)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold ml-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                        >
                          {copiedCode === (c.consultation_code || `MED-${c.id.substring(0, 4).toUpperCase()}`) ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-900">Location:</span>
                        <span className="text-slate-700">{c.location || 'Hospital OPD Clinic, Consultation Suite 1'}</span>
                      </div>

                      {c.instructions && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                          <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span><strong className="text-slate-800">Doctor Note:</strong> {c.instructions}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Doctor Write/Edit Prescription Button */}
                      {user?.role === 'DOCTOR' && (
                        <button
                          onClick={() => setPrescModal({
                            open: true,
                            mode: 'CREATE',
                            consultation: c
                          })}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98"
                        >
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span>{c.has_prescription ? 'Update Rx' : 'Write Prescription (Rx)'}</span>
                        </button>
                      )}

                      {/* View Prescription Button if issued */}
                      {(c.has_prescription || c.prescription_id) && (
                        <button
                          onClick={() => handleViewPrescription(c.prescription_id || c.id)}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98"
                        >
                          <Pill className="w-4 h-4 text-purple-600" />
                          <span>View Rx Slip</span>
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/chat/${c.id}`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98 shrink-0"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Open Clinical Room</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Declined Appointment Details Box with Reason */}
                {c.status === 'REJECTED' && (
                  <div className="mt-2 p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-rose-950">Decline Explanation from Doctor:</p>
                        <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                          {c.rejection_reason || 'Doctor is currently unavailable for this appointment slot. Please try another time or physician.'}
                        </p>
                      </div>
                    </div>

                    {user?.role !== 'DOCTOR' && (
                      <Link
                        to="/doctors"
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs active:scale-98"
                      >
                        Find Another Specialist
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Doctor Accept Consultation Modal */}
        {acceptModalConsultation && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setAcceptModalConsultation(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Confirm Consultation</h3>
                    <p className="text-xs text-slate-500">Provide consultation code and venue for the patient</p>
                  </div>
                </div>
                <button
                  onClick={() => setAcceptModalConsultation(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmAccept} className="space-y-4">
                {/* Consultation Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      Consultancy Code (Pass Code)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAcceptForm({ ...acceptForm, consultation_code: `MED-${Math.floor(1000 + Math.random() * 9000)}` })}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold"
                    >
                      Regenerate
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    value={acceptForm.consultation_code}
                    onChange={(e) => setAcceptForm({ ...acceptForm, consultation_code: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900"
                    placeholder="e.g. MED-5821"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The patient uses this verification code for check-in or video entry.
                  </p>
                </div>

                {/* Consultation Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Consultation Location / Room / Link
                  </label>
                  <input
                    type="text"
                    required
                    value={acceptForm.location}
                    onChange={(e) => setAcceptForm({ ...acceptForm, location: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                    placeholder="e.g. Kadapa General Hospital, OPD Room 204 or Virtual Meeting Room"
                  />
                </div>

                {/* Optional Instructions */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Instructions / Notes for Patient (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={acceptForm.instructions}
                    onChange={(e) => setAcceptForm({ ...acceptForm, instructions: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Please bring previous lab reports and list of active medications..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAcceptModalConsultation(null)}
                    className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAccept}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingAccept ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm & Accept Appointment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Doctor Decline Consultation Modal */}
        {declineModalConsultation && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setDeclineModalConsultation(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Decline Consultation Request</h3>
                    <p className="text-xs text-slate-500">Provide an explanation to guide the patient</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeclineModalConsultation(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmDecline} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Quick Reason Suggestions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Unavailable at requested time slot",
                      "Outside my clinical medical specialty",
                      "Fully booked with scheduled surgeries today",
                      "Emergency triage hospital visit recommended"
                    ].map(tpl => (
                      <button
                        key={tpl}
                        type="button"
                        onClick={() => setDeclineReason(tpl)}
                        className={`px-3 py-1.5 rounded-xl text-xs transition-all text-left ${
                          declineReason === tpl 
                            ? 'bg-rose-100 border border-rose-300 text-rose-900 font-bold shadow-xs' 
                            : 'bg-slate-100/80 border border-slate-200 text-slate-600 hover:bg-slate-200/70'
                        }`}
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    Explanation Provided to Patient
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 outline-none leading-relaxed"
                    placeholder="Enter reason for declining..."
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This reason is immediately delivered to the patient so they can book an appropriate alternative.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeclineModalConsultation(null)}
                    className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDecline}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingDecline ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Declining...</span>
                      </>
                    ) : (
                      <span>Confirm & Send Reason</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Prescription Issue & View Modal */}
        {prescModal.open && (
          <PrescriptionModal
            prescription={prescModal.prescription}
            mode={prescModal.mode}
            initialPatientId={prescModal.consultation?.user_id}
            initialPatientName={prescModal.consultation?.other_party_name}
            initialConsultationId={prescModal.consultation?.id}
            initialDiagnosis={prescModal.consultation?.prediction_disease || ''}
            onClose={() => setPrescModal({ open: false, mode: 'VIEW' })}
            onPrescriptionCreated={() => {
              fetchConsultations();
            }}
          />
        )}

      </main>

      <Footer />
    </div>
  );
}
