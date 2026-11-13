import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Stethoscope, 
  ShieldCheck, 
  User as UserIcon, 
  MapPin, 
  Star, 
  GraduationCap, 
  Building2, 
  Filter, 
  X, 
  Info, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  Award,
  CheckCircle2,
  HeartPulse
} from 'lucide-react';

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'DOCTOR' | 'ADMIN';
  created_at?: string;
  specialization?: string;
  qualification?: string;
  experience_years?: number;
  hospital?: string;
  clinic_address?: string;
  consultation_fee?: number;
  rating?: number;
  doctor_id?: string;
  about?: string;
  is_verified?: boolean;
}

export default function UserDirectory() {
  const { user, token, isLoading } = useAuth();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'DOCTOR' | 'USER' | 'ADMIN'>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'experience'>('name');
  const [selectedUserModal, setSelectedUserModal] = useState<DirectoryUser | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [permissions, setPermissions] = useState<{
    all_allowed: boolean;
    accepted_doctors: string[];
    pending_doctors: string[];
  }>({
    all_allowed: false,
    accepted_doctors: [],
    pending_doctors: []
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchUsers();
      if (token) {
        fetchPermissions();
      }
    }
  }, [user, token, isLoading]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('http://localhost:8000/api/users', { headers });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPermissions = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:8000/api/notifications/permissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(res.data);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const handleRequestMessage = async (targetUser: DirectoryUser, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (targetUser.role !== 'DOCTOR') {
      showToast('Direct requests can currently be sent to verified specialists.');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/notifications', {
        user_id: targetUser.id,
        title: 'New Message Request',
        message: `${user?.name} has requested to connect and message with you.`,
        type: 'MESSAGE_REQUEST',
        sender_id: user?.id,
        sender_name: user?.name,
        reference_id: user?.id
      }, { headers: { Authorization: `Bearer ${token}` } });

      setPermissions(prev => ({
        ...prev,
        pending_doctors: [...prev.pending_doctors, targetUser.id]
      }));

      showToast(`Message request sent to Dr. ${targetUser.name}! They will be notified.`);
    } catch (e) {
      showToast('Failed to send request. Please try again.');
    }
  };

  // Extract unique doctor specialties for filter dropdown
  const uniqueSpecialties = useMemo(() => {
    const specs = new Set<string>();
    users.forEach(u => {
      if (u.role === 'DOCTOR' && u.specialization) {
        specs.add(u.specialization);
      }
    });
    return Array.from(specs).sort();
  }, [users]);

  // Metric counts
  const counts = useMemo(() => {
    const total = users.length;
    const doctors = users.filter(u => u.role === 'DOCTOR').length;
    const patients = users.filter(u => u.role === 'USER').length;
    const admins = users.filter(u => u.role === 'ADMIN').length;
    return { total, doctors, patients, admins };
  }, [users]);

  // Filtering & Sorting
  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        // Don't show current logged-in user
        if (String(u.id) === String(user?.id)) return false;

        // Role filter
        if (selectedRole !== 'ALL' && u.role !== selectedRole) return false;

        // Specialty filter (only applies if doctor or ALL)
        if (selectedSpecialty !== 'ALL' && u.specialization !== selectedSpecialty) return false;

        // Text search
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          (u.specialization && u.specialization.toLowerCase().includes(q)) ||
          (u.hospital && u.hospital.toLowerCase().includes(q)) ||
          (u.clinic_address && u.clinic_address.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'experience') {
          return (b.experience_years || 0) - (a.experience_years || 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [users, search, selectedRole, selectedSpecialty, sortBy, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 flex flex-col items-center justify-center">
        <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
        <p className="mt-4 text-emerald-800 font-bold text-sm tracking-wide">Loading community directory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      
      {/* Decorative Ambient Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.18),rgba(99,102,241,0.08),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-48 -left-24 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-72 -right-24 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <Navbar activeTab={'checker' as any} setActiveTab={() => {}} />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Page Hero Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3.5 py-1 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-indigo-500/15 text-emerald-800 text-xs font-black rounded-full tracking-wider uppercase inline-flex items-center gap-1.5 border border-emerald-300/60 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Network
                </span>
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                  Live Community
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 tracking-tight">
                User & Specialist Directory
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
                Connect with board-certified physicians, explore verified community members, and interact with healthcare practitioners in real-time.
              </p>
            </div>

            {/* Quick Action Info Pill */}
            <div className="bg-gradient-to-br from-white to-emerald-50/40 border border-emerald-200/80 rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3.5 self-start md:self-auto">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <div className="font-extrabold text-slate-900 text-sm">Direct Medical Connect</div>
                <div className="text-emerald-700 font-medium">1-click requests to certified doctors</div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5 mt-7">
            {/* All Members Card */}
            <button
              onClick={() => setSelectedRole('ALL')}
              className={`p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer ${
                selectedRole === 'ALL'
                  ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white border-transparent shadow-xl shadow-indigo-500/25 ring-2 ring-indigo-400 scale-[1.02]'
                  : 'bg-white/95 hover:bg-indigo-50/40 text-slate-700 border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">All Members</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedRole === 'ALL' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black mt-2 tracking-tight">{counts.total}</div>
            </button>

            {/* Specialists Card */}
            <button
              onClick={() => setSelectedRole('DOCTOR')}
              className={`p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer ${
                selectedRole === 'DOCTOR'
                  ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white border-transparent shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400 scale-[1.02]'
                  : 'bg-white/95 hover:bg-emerald-50/40 text-slate-700 border-slate-200/90 hover:border-emerald-300 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">Specialists</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedRole === 'DOCTOR' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black mt-2 tracking-tight">{counts.doctors}</div>
            </button>

            {/* Patients Card */}
            <button
              onClick={() => setSelectedRole('USER')}
              className={`p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer ${
                selectedRole === 'USER'
                  ? 'bg-gradient-to-br from-sky-500 via-sky-600 to-blue-600 text-white border-transparent shadow-xl shadow-sky-500/25 ring-2 ring-sky-400 scale-[1.02]'
                  : 'bg-white/95 hover:bg-sky-50/40 text-slate-700 border-slate-200/90 hover:border-sky-300 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">Patients</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedRole === 'USER' ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-600 border border-sky-100'
                }`}>
                  <UserIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black mt-2 tracking-tight">{counts.patients}</div>
            </button>

            {/* Admins Card */}
            <button
              onClick={() => setSelectedRole('ADMIN')}
              className={`p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer ${
                selectedRole === 'ADMIN'
                  ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-700 text-white border-transparent shadow-xl shadow-purple-500/25 ring-2 ring-purple-400 scale-[1.02]'
                  : 'bg-white/95 hover:bg-purple-50/40 text-slate-700 border-slate-200/90 hover:border-purple-300 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">Admins</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedRole === 'ADMIN' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600 border border-purple-100'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black mt-2 tracking-tight">{counts.admins}</div>
            </button>
          </div>
        </div>

        {/* Search, Specialty & Sorting Toolbar */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-md shadow-slate-200/50 mb-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, specialty, hospital, or clinic location..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-xs transition-all bg-slate-50/50 focus:bg-white"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            
            {/* Specialty filter for doctors */}
            {uniqueSpecialties.length > 0 && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-emerald-600 shrink-0 hidden sm:block" />
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full sm:w-52 px-3.5 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 bg-slate-50/50 hover:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-xs transition-all cursor-pointer"
                >
                  <option value="ALL">All Medical Specialties</option>
                  {uniqueSpecialties.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Options */}
            <div className="w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full sm:w-44 px-3.5 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 bg-slate-50/50 hover:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-xs transition-all cursor-pointer"
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="rating">Sort: Top Rated ⭐</option>
                <option value="experience">Sort: Experience 🎓</option>
              </select>
            </div>

            {/* Active Filters Clear Button */}
            {(search || selectedRole !== 'ALL' || selectedSpecialty !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedRole('ALL');
                  setSelectedSpecialty('ALL');
                }}
                className="px-4 py-3 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors whitespace-nowrap shadow-xs"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Directory Grid */}
        {loadingUsers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-200 rounded-2xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-16 bg-slate-100 rounded-2xl"></div>
                <div className="h-10 bg-slate-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/90 shadow-md">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">No members match your criteria</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              We couldn't find any users matching your keywords or filter combinations. Try adjusting your search query.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedRole('ALL');
                setSelectedSpecialty('ALL');
              }}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-2xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(u => {
              const isDoctor = u.role === 'DOCTOR';
              const isAdmin = u.role === 'ADMIN';
              const isCurrentUserDoctorOrAdmin = user?.role !== 'USER';
              const isAccepted = permissions.all_allowed || permissions.accepted_doctors.includes(u.id);
              const isPending = permissions.pending_doctors.includes(u.id);

              return (
                <div 
                  key={u.id}
                  onClick={() => setSelectedUserModal(u)}
                  className={`bg-white/95 rounded-3xl p-6 border shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                    isDoctor ? 'border-emerald-100/90 hover:border-emerald-400 hover:shadow-emerald-500/10' :
                    isAdmin ? 'border-purple-100/90 hover:border-purple-400 hover:shadow-purple-500/10' :
                    'border-sky-100/90 hover:border-sky-400 hover:shadow-sky-500/10'
                  }`}
                >
                  {/* Top Glowing Color Accent Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isDoctor ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600' :
                    isAdmin ? 'bg-gradient-to-r from-purple-500 via-violet-600 to-fuchsia-600' :
                    'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500'
                  }`} />

                  <div>
                    {/* Header: Avatar, Name & Role Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl uppercase shadow-md transition-transform group-hover:scale-105 ${
                          isDoctor ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-600/25 ring-4 ring-emerald-50' :
                          isAdmin ? 'bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-purple-600/25 ring-4 ring-purple-50' :
                          'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-600/25 ring-4 ring-sky-50'
                        }`}>
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors line-clamp-1">
                              {isDoctor ? `Dr. ${u.name}` : u.name}
                            </h3>
                            {isDoctor && (
                              <span title="Verified Medical Specialist">
                                <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">{u.email}</p>
                        </div>
                      </div>

                      {/* Role Pill */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shrink-0 shadow-xs ${
                        isDoctor ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        isAdmin ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                        'bg-sky-50 text-sky-800 border border-sky-200'
                      }`}>
                        {u.role}
                      </span>
                    </div>

                    {/* Role Specific Details Section */}
                    {isDoctor ? (
                      <div className="bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 rounded-2xl p-4 border border-emerald-100/70 space-y-2.5 mb-5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-100/90 to-teal-100/90 text-emerald-900 text-xs font-black shadow-xs">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                            {u.specialization || 'General Physician'}
                          </span>
                          <div className="flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{u.rating ? u.rating.toFixed(1) : '5.0'}</span>
                          </div>
                        </div>

                        {u.hospital && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="line-clamp-1">{u.hospital}</span>
                          </div>
                        )}

                        {u.clinic_address && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="line-clamp-1">{u.clinic_address}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-emerald-100/60 font-medium">
                          <span>Experience: <strong className="text-slate-900 font-extrabold">{u.experience_years ? `${u.experience_years} Years` : '3+ Years'}</strong></span>
                          <span>Fee: <strong className="text-emerald-700 font-black">₹{u.consultation_fee || 500}</strong></span>
                        </div>
                      </div>
                    ) : isAdmin ? (
                      <div className="bg-gradient-to-br from-slate-50 via-purple-50/30 to-violet-50/20 rounded-2xl p-4 border border-purple-100/70 space-y-2 mb-5 text-xs text-purple-900">
                        <div className="flex items-center gap-2 font-black text-purple-950">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          Platform Administrator
                        </div>
                        <p className="text-[11px] text-purple-700 leading-relaxed font-medium">
                          Oversees medical credentialing, verification compliance, and community trust.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 rounded-2xl p-4 border border-sky-100/70 space-y-2 mb-5 text-xs text-slate-600">
                        <div className="flex items-center gap-2 font-black text-sky-950">
                          <UserIcon className="w-4 h-4 text-sky-600" />
                          Community Patient
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                          Active community member eligible for telemedicine consultations and digital prescriptions.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center gap-2.5">
                    {/* Primary Action Button */}
                    {(isCurrentUserDoctorOrAdmin || isAccepted || isAdmin) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/direct-chat/${u.id}`);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md active:scale-98 cursor-pointer ${
                          isAdmin 
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/20' 
                            : isDoctor
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20'
                            : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-600/20'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        {isAdmin ? 'Contact Support' : isAccepted && !isCurrentUserDoctorOrAdmin ? 'Direct Chat (Approved)' : 'Direct Message'}
                      </button>
                    ) : isPending ? (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl text-xs font-bold cursor-not-allowed shadow-xs"
                      >
                        <Clock className="w-4 h-4 animate-spin text-amber-600" />
                        Request Pending
                      </div>
                    ) : isDoctor ? (
                      <button
                        onClick={(e) => handleRequestMessage(u, e)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Request to Message
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserModal(u);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4" />
                        View Member
                      </button>
                    )}

                    {/* Secondary Detail Arrow Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserModal(u);
                      }}
                      title="View Details"
                      className="p-2.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* User / Doctor Details Modal */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUserModal(null)}
              className="absolute top-5 right-5 p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl uppercase shadow-lg ${
                selectedUserModal.role === 'DOCTOR' ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-500/25 ring-4 ring-emerald-50' :
                selectedUserModal.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-purple-500/25 ring-4 ring-purple-50' :
                'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-500/25 ring-4 ring-sky-50'
              }`}>
                {selectedUserModal.name?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">
                    {selectedUserModal.role === 'DOCTOR' ? `Dr. ${selectedUserModal.name}` : selectedUserModal.name}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedUserModal.role === 'DOCTOR' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    selectedUserModal.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                    'bg-sky-100 text-sky-800 border border-sky-200'
                  }`}>
                    {selectedUserModal.role}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{selectedUserModal.email}</p>
              </div>
            </div>

            {/* Doctor Extended Information */}
            {selectedUserModal.role === 'DOCTOR' && (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 rounded-2xl border border-emerald-100">
                    <span className="text-slate-400 font-semibold block mb-0.5 text-[11px] uppercase">Specialization</span>
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      {selectedUserModal.specialization || 'General Physician'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl border border-amber-100">
                    <span className="text-slate-400 font-semibold block mb-0.5 text-[11px] uppercase">Rating</span>
                    <span className="font-extrabold text-amber-700 flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {selectedUserModal.rating ? selectedUserModal.rating.toFixed(1) : '5.0'} / 5.0
                    </span>
                  </div>

                  <div className="p-3.5 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 rounded-2xl border border-indigo-100">
                    <span className="text-slate-400 font-semibold block mb-0.5 text-[11px] uppercase">Experience</span>
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      {selectedUserModal.experience_years ? `${selectedUserModal.experience_years} Years` : '3+ Years'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 rounded-2xl border border-teal-100">
                    <span className="text-slate-400 font-semibold block mb-0.5 text-[11px] uppercase">Consultation Fee</span>
                    <span className="font-black text-emerald-800 text-sm">
                      ₹{selectedUserModal.consultation_fee || 500} / visit
                    </span>
                  </div>
                </div>

                {selectedUserModal.hospital && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Hospital Affiliation</span>
                      <span className="font-bold text-slate-900">{selectedUserModal.hospital}</span>
                    </div>
                  </div>
                )}

                {selectedUserModal.clinic_address && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Clinic Address</span>
                      <span className="font-semibold text-slate-800">{selectedUserModal.clinic_address}</span>
                    </div>
                  </div>
                )}

                {selectedUserModal.about && (
                  <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/70">
                    <span className="text-xs font-bold text-emerald-950 block mb-1">About Doctor</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{selectedUserModal.about}</p>
                  </div>
                )}
              </div>
            )}

            {/* General Member Information */}
            {selectedUserModal.role !== 'DOCTOR' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 mb-6 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Account Type:</span>
                  <span className="font-bold text-slate-800">{selectedUserModal.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Status:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Active Member
                  </span>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {(user?.role !== 'USER' || permissions.all_allowed || permissions.accepted_doctors.includes(selectedUserModal.id) || selectedUserModal.role === 'ADMIN') ? (
                <button
                  onClick={() => {
                    navigate(`/direct-chat/${selectedUserModal.id}`);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white shadow-lg transition-all cursor-pointer ${
                    selectedUserModal.role === 'ADMIN'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-600/25'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {selectedUserModal.role === 'ADMIN' ? 'Message Support' : 'Start Direct Chat'}
                </button>
              ) : permissions.pending_doctors.includes(selectedUserModal.id) ? (
                <div className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl font-black text-sm">
                  <Clock className="w-4 h-4 animate-spin text-amber-600" />
                  Connection Request Pending
                </div>
              ) : selectedUserModal.role === 'DOCTOR' ? (
                <button
                  onClick={() => handleRequestMessage(selectedUserModal)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Request Message Permission
                </button>
              ) : null}

              {selectedUserModal.role === 'DOCTOR' && (
                <button
                  onClick={() => navigate('/doctors')}
                  className="px-5 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                  Book Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
