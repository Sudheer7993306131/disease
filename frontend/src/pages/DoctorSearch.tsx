import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  MapPin, 
  Star, 
  Clock, 
  Stethoscope, 
  ChevronRight, 
  ShieldCheck, 
  Search, 
  Calendar, 
  Activity,
  CheckCircle2,
  Sparkles,
  HeartPulse,
  Brain,
  Eye,
  MessageSquare,
  Baby,
  Smile,
  Layers,
  X,
  Edit3,
  Building2,
  DollarSign,
  GraduationCap,
  ExternalLink,
  Navigation,
  Check,
  Loader2,
  UserCheck
} from 'lucide-react';

const MEDICAL_SPECIALTIES = [
  "General Physician",
  "Cardiologist",
  "Neurologist",
  "Orthopedic",
  "Dermatologist",
  "Gynecologist",
  "Psychiatrist",
  "Gastroenterologist",
  "Endocrinologist",
  "Ophthalmologist",
  "Dentist",
  "ENT Specialist",
  "Pediatrician",
  "Oncologist",
  "Nephrologist",
  "Pulmonologist"
];

export default function DoctorSearch() {
  const [searchParams] = useSearchParams();
  const disease = searchParams.get('disease') || '';
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('ALL');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Doctor Details & Edit Modal States
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  // Doctor Reviews State
  const [doctorReviews, setDoctorReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  const [editFormData, setEditFormData] = useState({
    name: '',
    specialization: 'General Physician',
    qualification: '',
    experience_years: 0,
    hospital: '',
    clinic_address: '',
    consultation_fee: 500,
    online_consultation: true,
    offline_consultation: true,
    latitude: 0,
    longitude: 0,
    about: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, [disease]);

  const fetchDoctors = (lat?: number, lon?: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (disease) params.append('disease', disease);
    if (lat) params.append('lat', lat.toString());
    if (lon) params.append('lon', lon.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    axios.get(`http://localhost:8000/api/recommendations/doctors${queryString}`)
      .then(res => {
        setDoctors(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchDoctors(position.coords.latitude, position.coords.longitude);
        setLocationError('');
      },
      () => {
        setLocationError('Unable to retrieve your location');
      }
    );
  };

  const handleBook = async (doctorId: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      navigate('/login?redirect=/doctors' + (disease ? `?disease=${encodeURIComponent(disease)}` : ''));
      return;
    }
    try {
      await axios.post('http://localhost:8000/api/consultations', {
        doctor_id: doctorId,
        type: 'ONLINE'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Consultation booked successfully! The doctor has been notified.');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to book consultation.');
    }
  };

  // Check if current user is this doctor or an admin
  const isDoctorSelf = (doc: any) => {
    if (!user) return false;
    const currentUserId = String(user.id);
    const docUserId = String(doc.user_id || doc.user?.id || '');
    const isIdMatch = docUserId && docUserId === currentUserId;
    const isEmailMatch = user.role === 'DOCTOR' && doc.user?.email && doc.user.email.toLowerCase() === user.email.toLowerCase();
    const isAdmin = user.role === 'ADMIN';
    return isIdMatch || isEmailMatch || isAdmin;
  };

  // Fetch reviews for a doctor
  const fetchDoctorReviews = (doctorId: string) => {
    setLoadingReviews(true);
    axios.get(`http://localhost:8000/api/doctors/${doctorId}/reviews`)
      .then(res => setDoctorReviews(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoadingReviews(false));
  };

  // Open modal in View mode
  const handleOpenDetails = (doc: any) => {
    setSelectedDoctor(doc);
    setIsEditing(false);
    setEditSuccessMsg('');
    setEditErrorMsg('');
    setShowReviewForm(false);
    setReviewSuccessMsg('');
    setReviewComment('');
    setReviewRating(5);
    populateEditForm(doc);
    fetchDoctorReviews(doc.id);
  };

  // Submit patient review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=/doctors');
      return;
    }
    if (!selectedDoctor) return;
    if (!reviewComment.trim()) {
      alert('Please enter your review feedback');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await axios.post(`http://localhost:8000/api/doctors/${selectedDoctor.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim()
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const newReview = res.data;
      setDoctorReviews(prev => [newReview, ...prev]);

      // Calculate new average rating
      const updatedList = [newReview, ...doctorReviews];
      const newAvg = Number((updatedList.reduce((sum, r) => sum + (r.rating || 5), 0) / updatedList.length).toFixed(1));

      setSelectedDoctor((prev: any) => prev ? { ...prev, rating: newAvg } : null);
      setDoctors((prev: any[]) => prev.map((d: any) => d.id === selectedDoctor.id ? { ...d, rating: newAvg } : d));

      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
      setReviewSuccessMsg('Your review has been successfully submitted! Thank you.');
      setTimeout(() => setReviewSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Open modal directly in Edit mode
  const handleOpenEdit = (doc: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDoctor(doc);
    setIsEditing(true);
    setEditSuccessMsg('');
    setEditErrorMsg('');
    populateEditForm(doc);
  };

  const populateEditForm = (doc: any) => {
    setEditFormData({
      name: doc.user?.name || '',
      specialization: doc.specialization || 'General Physician',
      qualification: doc.qualification || '',
      experience_years: doc.experience_years || 0,
      hospital: doc.hospital || '',
      clinic_address: doc.clinic_address || '',
      consultation_fee: doc.consultation_fee || 500,
      online_consultation: doc.online_consultation ?? true,
      offline_consultation: doc.offline_consultation ?? true,
      latitude: doc.latitude || 0,
      longitude: doc.longitude || 0,
      about: doc.about || ''
    });
  };

  // Handle saving edited doctor profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setSaving(true);
    setEditSuccessMsg('');
    setEditErrorMsg('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:8000/api/doctors/${selectedDoctor.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedDoctor = res.data;
      
      // Update local doctors list
      setDoctors(prev => prev.map(d => d.id === updatedDoctor.id ? updatedDoctor : d));
      setSelectedDoctor(updatedDoctor);
      setEditSuccessMsg('Doctor details updated successfully!');
      
      setTimeout(() => {
        setIsEditing(false);
        setEditSuccessMsg('');
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setEditErrorMsg(err.response?.data?.detail || 'Failed to update doctor profile. Please verify your credentials.');
    } finally {
      setSaving(false);
    }
  };

  // GPS for Edit form
  const handleGetLocationForEdit = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setEditFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setEditSuccessMsg('Current GPS coordinates acquired!');
          setTimeout(() => setEditSuccessMsg(''), 3000);
        },
        () => {
          setEditErrorMsg('Please allow location permissions to acquire GPS coordinates.');
        }
      );
    }
  };

  // Helper function for specialization icon
  const getSpecialtyIcon = (spec: string) => {
    const s = spec.toLowerCase();
    if (s.includes('cardio')) return <HeartPulse className="w-4 h-4 text-rose-500" />;
    if (s.includes('neuro') || s.includes('psych')) return <Brain className="w-4 h-4 text-purple-500" />;
    if (s.includes('derma')) return <Sparkles className="w-4 h-4 text-amber-500" />;
    if (s.includes('opht') || s.includes('eye')) return <Eye className="w-4 h-4 text-cyan-500" />;
    if (s.includes('pedia') || s.includes('child')) return <Baby className="w-4 h-4 text-teal-500" />;
    if (s.includes('dent')) return <Smile className="w-4 h-4 text-indigo-500" />;
    return <Stethoscope className="w-4 h-4 text-emerald-600" />;
  };

  // Extract distinct specializations and their counts
  const specializations = Array.from(new Set(doctors.map(d => d.specialization || 'General Physician')));
  
  // Filter by search query
  const searchFilteredDoctors = doctors.filter(doc => {
    const name = doc.user?.name || '';
    const spec = doc.specialization || '';
    const hosp = doc.hospital || '';
    const q = searchTerm.toLowerCase();
    return name.toLowerCase().includes(q) || spec.toLowerCase().includes(q) || hosp.toLowerCase().includes(q);
  });

  // Group doctors by specialization
  const groupedBySpecialty: { [key: string]: any[] } = {};
  searchFilteredDoctors.forEach(doc => {
    const spec = doc.specialization || 'General Physician';
    if (!groupedBySpecialty[spec]) groupedBySpecialty[spec] = [];
    groupedBySpecialty[spec].push(doc);
  });

  // Filter based on active specialization tab
  const visibleCategories = selectedSpecialization === 'ALL' 
    ? Object.keys(groupedBySpecialty)
    : Object.keys(groupedBySpecialty).filter(s => s === selectedSpecialization);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar activeTab={'checker' as any} setActiveTab={() => {}} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              <span>Certified Healthcare Specialists Registry</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Find Verified Doctors {disease && <span className="text-emerald-400">for {disease}</span>}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Browse medical professionals categorized by clinical specialization, locate specialists near you, and schedule online consultations directly.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleUseLocation}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-98"
              >
                <MapPin className="w-4 h-4 text-slate-950" />
                Find Near Me
              </button>

              {locationError && (
                <span className="text-xs text-rose-300 bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/30">
                  {locationError}
                </span>
              )}
            </div>
          </div>

          <div className="absolute right-0 bottom-0 translate-y-12 translate-x-12 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Search & Location Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by doctor name, specialty, or clinic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold self-end sm:self-center">
            <span>Showing <strong className="text-slate-900">{searchFilteredDoctors.length}</strong> doctors across <strong className="text-slate-900">{Object.keys(groupedBySpecialty).length}</strong> specializations</span>
          </div>
        </div>

        {/* Specialization Category Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Filter by Medical Specialization
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* All Specializations Pill */}
            <button
              onClick={() => setSelectedSpecialization('ALL')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedSpecialization === 'ALL'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
              }`}
            >
              <span>All Specializations</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedSpecialization === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {doctors.length}
              </span>
            </button>

            {/* Individual Specialization Pills */}
            {specializations.map(spec => {
              const count = doctors.filter(d => (d.specialization || 'General Physician') === spec).length;
              const isSelected = selectedSpecialization === spec;

              return (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialization(spec)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 shadow-xs'
                  }`}
                >
                  {getSpecialtyIcon(spec)}
                  <span>{spec}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categorized Doctor Groups */}
        {loading ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200">
            <Activity className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading categorized doctors...</p>
          </div>
        ) : visibleCategories.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No doctors found in this category</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try switching back to 'All Specializations' or change your search filter.
            </p>
            <button
              onClick={() => { setSelectedSpecialization('ALL'); setSearchTerm(''); }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {visibleCategories.map(specName => {
              const docsInCategory = groupedBySpecialty[specName] || [];
              if (docsInCategory.length === 0) return null;

              return (
                <div key={specName} className="space-y-4">
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                        {getSpecialtyIcon(specName)}
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900">{specName}</h3>
                        <p className="text-xs text-slate-500">
                          {docsInCategory.length} verified {docsInCategory.length === 1 ? 'specialist' : 'specialists'} available
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Verified Department
                    </span>
                  </div>

                  {/* Doctor Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {docsInCategory.map(doc => {
                      const isOwn = isDoctorSelf(doc);

                      return (
                        <div 
                          key={doc.id} 
                          onClick={() => handleOpenDetails(doc)}
                          className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group hover:-translate-y-1 duration-200 cursor-pointer relative ${
                            isOwn ? 'border-emerald-500/80 ring-2 ring-emerald-500/10' : 'border-slate-200/80'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center text-lg font-black uppercase shadow-md shadow-emerald-500/20">
                                  {doc.user?.name ? doc.user.name.charAt(0) : 'D'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                                      Dr. {doc.user?.name || 'Specialist'}
                                    </h3>
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                  </div>
                                  <p className="text-xs font-bold text-emerald-600 mt-0.5">
                                    {doc.specialization || 'General Physician'}
                                  </p>
                                </div>
                              </div>

                              {isOwn && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                                  <UserCheck className="w-3 h-3" />
                                  <span>You</span>
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-2.5 mb-5 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                  <strong className="text-slate-800">{doc.rating > 0 ? doc.rating : '4.9'}</strong> / 5.0
                                </span>
                                <span className="text-slate-500 font-medium">
                                  {doc.experience_years ? `${doc.experience_years} yrs exp` : 'Experienced'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{doc.hospital || 'Premier Medical Clinic'}</span>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-semibold">
                                <span className="text-slate-800">Consultation Fee</span>
                                <span className="text-slate-900 font-extrabold">₹{doc.consultation_fee || 500}</span>
                              </div>
                            </div>

                            <div className="text-[11px] font-bold text-emerald-600 flex items-center justify-between mb-4 px-1 group-hover:text-emerald-700">
                              <span>Click card to view details</span>
                              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>

                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            {isOwn ? (
                              <button
                                onClick={(e) => handleOpenEdit(doc, e)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all active:scale-98"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>Edit My Details</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleBook(doc.id, e)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all active:scale-98"
                              >
                                <span>Book Consultation</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/chat?recipient=${doc.user_id}`);
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2 text-center text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                              Direct Clinical Message
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Doctor Details & Edit Modal */}
        {selectedDoctor && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => { setSelectedDoctor(null); setIsEditing(false); }}
          >
            <div 
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    {isEditing ? <Edit3 className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {isEditing ? 'Edit Doctor Information' : 'Doctor Clinical Profile'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isEditing ? 'Update your clinical details visible to patients' : 'Comprehensive credentials & consultation availability'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing && isDoctorSelf(selectedDoctor) && (
                    <button
                      onClick={() => { setIsEditing(true); setEditSuccessMsg(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedDoctor(null); setIsEditing(false); }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Feedback Notifications */}
              {editSuccessMsg && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}
              {editErrorMsg && (
                <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editErrorMsg}</span>
                </div>
              )}

              {/* Modal Body */}
              <div className="p-6">
                {!isEditing ? (
                  /* ================= READ-ONLY DETAILS VIEW ================= */
                  <div className="space-y-6">
                    {/* Hero Information */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-100">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center text-3xl font-black uppercase shadow-lg shadow-emerald-500/25 shrink-0">
                        {selectedDoctor.user?.name ? selectedDoctor.user.name.charAt(0) : 'D'}
                      </div>
                      
                      <div className="text-center sm:text-left flex-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h2 className="text-xl font-extrabold text-slate-900">
                            Dr. {selectedDoctor.user?.name || 'Medical Specialist'}
                          </h2>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            Verified Doctor
                          </span>
                        </div>

                        <p className="text-sm font-bold text-emerald-700 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                          {getSpecialtyIcon(selectedDoctor.specialization || 'General Physician')}
                          <span>{selectedDoctor.specialization || 'General Physician'}</span>
                        </p>

                        <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-bold text-slate-800">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            {selectedDoctor.rating > 0 ? selectedDoctor.rating : '4.9'} / 5.0 Rating
                          </span>
                          <span>•</span>
                          <span className="text-slate-500 font-semibold">{selectedDoctor.user?.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notice if own profile */}
                    {isDoctorSelf(selectedDoctor) && (
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
                          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>This is your active doctor profile. You can modify any details at any time.</span>
                        </div>
                        <button
                          onClick={() => { setIsEditing(true); setEditSuccessMsg(''); }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs"
                        >
                          Edit Profile
                        </button>
                      </div>
                    )}

                    {/* Highlights 4-Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Experience</span>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {selectedDoctor.experience_years ? `${selectedDoctor.experience_years} Years` : '1+ Years'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Fee</span>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900">
                          ₹{selectedDoctor.consultation_fee || 500}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Degrees</span>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 truncate" title={selectedDoctor.qualification}>
                          {selectedDoctor.qualification || 'MBBS / Specialist'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Affiliation</span>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 truncate" title={selectedDoctor.hospital}>
                          {selectedDoctor.hospital || 'Premier Hospital'}
                        </p>
                      </div>
                    </div>

                    {/* Consultation Modes & Location */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                        Consultation Modes & Facilities
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                          selectedDoctor.online_consultation !== false ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                              📹
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">Online Video Consultation</p>
                              <p className="text-[11px] text-slate-500">Video call & digital prescriptions</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            selectedDoctor.online_consultation !== false ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {selectedDoctor.online_consultation !== false ? 'Active' : 'Unavailable'}
                          </span>
                        </div>

                        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                          selectedDoctor.offline_consultation !== false ? 'bg-teal-50/50 border-teal-200' : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                              🏥
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">In-Clinic Physical Visit</p>
                              <p className="text-[11px] text-slate-500">Walk-in or scheduled clinic slots</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            selectedDoctor.offline_consultation !== false ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {selectedDoctor.offline_consultation !== false ? 'Active' : 'Unavailable'}
                          </span>
                        </div>
                      </div>

                      {/* Location Information */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {selectedDoctor.clinic_address || selectedDoctor.hospital || 'Consultation Clinic & Healthcare Complex'}
                              </p>
                              {selectedDoctor.latitude && selectedDoctor.longitude ? (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  GPS: {selectedDoctor.latitude.toFixed(4)}, {selectedDoctor.longitude.toFixed(4)}
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-400 mt-0.5">Clinic address registered</p>
                              )}
                            </div>
                          </div>

                          {selectedDoctor.latitude && selectedDoctor.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${selectedDoctor.latitude},${selectedDoctor.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 transition-all shrink-0 shadow-xs"
                            >
                              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Map</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* About Section */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                        About Clinical Practice & Diagnostic Approach
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                        {selectedDoctor.about || `${selectedDoctor.user?.name || 'Dr. Specialist'} is a dedicated healthcare professional specializing in ${selectedDoctor.specialization || 'general practice'}. With a clinical focus on comprehensive diagnostic evaluation, evidence-backed therapy, and empathetic patient rehabilitation.`}
                      </p>
                    </div>

                    {/* Patient Reviews Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <span>Patient Reviews & Testimonials</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              ★ {selectedDoctor.rating > 0 ? selectedDoctor.rating : '5.0'} ({doctorReviews.length})
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Verified patient ratings and clinical consultation experiences
                          </p>
                        </div>

                        {!showReviewForm && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!user) {
                                navigate('/login?redirect=/doctors');
                                return;
                              }
                              setShowReviewForm(true);
                            }}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span>Write a Review</span>
                          </button>
                        )}
                      </div>

                      {/* Review Success Banner */}
                      {reviewSuccessMsg && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{reviewSuccessMsg}</span>
                        </div>
                      )}

                      {/* Interactive Review Form */}
                      {showReviewForm && (
                        <form onSubmit={handleSubmitReview} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">Your Rating</span>
                            <button
                              type="button"
                              onClick={() => setShowReviewForm(false)}
                              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                            >
                              Cancel
                            </button>
                          </div>

                          {/* 5-Star Interactive Rating Picker */}
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((starVal) => {
                              const activeRating = reviewHoverRating || reviewRating;
                              const isFilled = starVal <= activeRating;

                              return (
                                <button
                                  key={starVal}
                                  type="button"
                                  onClick={() => setReviewRating(starVal)}
                                  onMouseEnter={() => setReviewHoverRating(starVal)}
                                  onMouseLeave={() => setReviewHoverRating(0)}
                                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                                >
                                  <Star className={`w-6 h-6 ${
                                    isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                                  }`} />
                                </button>
                              );
                            })}
                            <span className="text-xs font-bold text-slate-600 ml-2">
                              {reviewRating === 5 && '5 Stars - Excellent Care'}
                              {reviewRating === 4 && '4 Stars - Very Good'}
                              {reviewRating === 3 && '3 Stars - Good'}
                              {reviewRating === 2 && '2 Stars - Needs Improvement'}
                              {reviewRating === 1 && '1 Star - Unsatisfied'}
                            </span>
                          </div>

                          <div>
                            <textarea
                              rows={3}
                              required
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder={`Share your clinical consultation experience with Dr. ${selectedDoctor.user?.name || 'this specialist'}...`}
                              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowReviewForm(false)}
                              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={submittingReview}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {submittingReview ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Publishing...</span>
                                </>
                              ) : (
                                <span>Publish Review</span>
                              )}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Reviews List */}
                      {loadingReviews ? (
                        <div className="py-6 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                          <span>Loading patient reviews...</span>
                        </div>
                      ) : doctorReviews.length === 0 ? (
                        <div className="text-center py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-xs font-semibold text-slate-600">
                            No patient reviews written yet for Dr. {selectedDoctor.user?.name || 'this specialist'}.
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Be the first patient to share your consultation experience!
                          </p>
                          {!showReviewForm && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!user) {
                                  navigate('/login?redirect=/doctors');
                                  return;
                                }
                                setShowReviewForm(true);
                              }}
                              className="mt-2.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
                            >
                              Write the First Review
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {doctorReviews.map((rev) => (
                            <div key={rev.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center uppercase">
                                    {rev.user_name ? rev.user_name.charAt(0) : 'P'}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">{rev.user_name || 'Verified Patient'}</p>
                                    <span className="text-[10px] text-slate-400">
                                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent Patient'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`w-3.5 h-3.5 ${
                                      s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                    }`} />
                                  ))}
                                </div>
                              </div>

                              <p className="text-xs text-slate-700 leading-relaxed pl-9">
                                {rev.comment}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      {!isDoctorSelf(selectedDoctor) ? (
                        <>
                          <button
                            onClick={() => {
                              const docId = selectedDoctor.id;
                              setSelectedDoctor(null);
                              handleBook(docId);
                            }}
                            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
                          >
                            <span>Book Consultation (₹{selectedDoctor.consultation_fee || 500})</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              const recipientId = selectedDoctor.user_id;
                              setSelectedDoctor(null);
                              navigate(`/chat?recipient=${recipientId}`);
                            }}
                            className="py-3 px-5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4 text-indigo-600" />
                            <span>Direct Message</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setIsEditing(true); setEditSuccessMsg(''); }}
                          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit My Doctor Details</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ================= EDIT MODE FORM ================= */
                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
                      <Edit3 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Changes saved here will immediately update your public card in the doctors registry.</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name</label>
                        <input
                          type="text"
                          required
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Dr. Full Name"
                        />
                      </div>

                      {/* Specialization */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Medical Specialization</label>
                        <select
                          value={editFormData.specialization}
                          onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        >
                          {MEDICAL_SPECIALTIES.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      </div>

                      {/* Qualifications */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications / Degrees</label>
                        <input
                          type="text"
                          value={editFormData.qualification}
                          onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="e.g. MBBS, MD, MS (Ortho)"
                        />
                      </div>

                      {/* Experience */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Years of Experience</label>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={editFormData.experience_years}
                          onChange={(e) => setEditFormData({ ...editFormData, experience_years: parseInt(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      {/* Hospital / Clinic */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Affiliation</label>
                        <input
                          type="text"
                          value={editFormData.hospital}
                          onChange={(e) => setEditFormData({ ...editFormData, hospital: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Hospital or clinic name"
                        />
                      </div>

                      {/* Fee */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={editFormData.consultation_fee}
                          onChange={(e) => setEditFormData({ ...editFormData, consultation_fee: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      {/* Clinic Address */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Physical Address</label>
                        <input
                          type="text"
                          value={editFormData.clinic_address}
                          onChange={(e) => setEditFormData({ ...editFormData, clinic_address: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Street, Landmark, City, State"
                        />
                      </div>

                      {/* Location Coordinates */}
                      <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>GPS Coordinates (for Distance Search)</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleGetLocationForEdit}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
                          >
                            Use Current Location
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Latitude</span>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.latitude || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, latitude: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                              placeholder="e.g. 14.335"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Longitude</span>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.longitude || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, longitude: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                              placeholder="e.g. 78.538"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Consultation Type Checkboxes */}
                      <div className="sm:col-span-2 flex flex-wrap gap-6 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={editFormData.online_consultation}
                            onChange={(e) => setEditFormData({ ...editFormData, online_consultation: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span>Offer Online Consultations</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={editFormData.offline_consultation}
                            onChange={(e) => setEditFormData({ ...editFormData, offline_consultation: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span>Offer In-Clinic Visits</span>
                        </label>
                      </div>

                      {/* About / Clinical Bio */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">About Clinical Practice / Bio</label>
                        <textarea
                          rows={3}
                          value={editFormData.about}
                          onChange={(e) => setEditFormData({ ...editFormData, about: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Describe your diagnostic approach, areas of interest, or patient care philosophy..."
                        />
                      </div>
                    </div>

                    {/* Form Controls */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Save Profile Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
