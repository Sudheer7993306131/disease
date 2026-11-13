import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  UserCheck, 
  Stethoscope, 
  Search, 
  Check, 
  Clock, 
  Activity, 
  AlertCircle,
  Building2,
  Users
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, token, isLoading } = useAuth();
  const [unverifiedDoctors, setUnverifiedDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      navigate('/');
    } else if (user?.role === 'ADMIN') {
      fetchDoctors();
    }
  }, [user, isLoading]);

  const fetchDoctors = () => {
    setLoading(true);
    axios.get('http://localhost:8000/api/admin/unverified-doctors', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setUnverifiedDoctors(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (id: string, docName: string) => {
    try {
      await axios.put(`http://localhost:8000/api/admin/verify-doctor/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: `Dr. ${docName} has been verified and added to the public registry!` });
      fetchDoctors();
      setTimeout(() => setMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to approve doctor profile.' });
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const filteredDoctors = unverifiedDoctors.filter(doc => {
    const name = doc.user?.name || '';
    const email = doc.user?.email || '';
    const spec = doc.specialization || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || spec.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-slate-600 font-bold text-sm">
          <Activity className="w-5 h-5 text-emerald-600 animate-spin" />
          <span>Loading Administration Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar activeTab={'checker' as any} setActiveTab={() => {}} />
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Medical Administration Portal</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Verify practitioner medical credentials, govern platform access, and manage user directories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/doctors"
              className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              Public Directory
            </Link>
            <Link
              to="/users"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Directory</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{unverifiedDoctors.length}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Role</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-2">Administrator</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Security</span>
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-700 mt-2">Active</p>
          </div>
        </div>

        {/* Notification Alert */}
        {message && (
          <div className={`p-4 rounded-2xl mb-6 text-xs sm:text-sm font-bold flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <Check className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Pending Approvals Table Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Pending Practitioner Approvals
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review credential requests and approve doctors for the public directory.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search pending doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 animate-spin" />
              <span>Fetching practitioner records...</span>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-16 text-center">
              <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No pending doctor approvals</h3>
              <p className="text-xs text-slate-400 mt-1">All registered doctors have been reviewed and verified.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDoctors.map(doc => (
                <div key={doc.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-black text-base uppercase shrink-0">
                      {doc.user?.name ? doc.user.name.charAt(0) : 'D'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-base">Dr. {doc.user?.name || 'Practitioner'}</h3>
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Pending
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{doc.user?.email}</p>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {doc.specialization || 'General Physician'}
                        </span>
                        {doc.hospital && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {doc.hospital}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleApprove(doc.id, doc.user?.name || 'Doctor')}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-98 self-start sm:self-auto"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Approve & Verify Doctor</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
