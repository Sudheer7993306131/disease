import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Building2, 
  BriefcaseMedical, 
  DollarSign, 
  Loader2, 
  ShieldCheck, 
  GraduationCap, 
  Check, 
  FileText 
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

export default function DoctorProfile() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form State
  const [formData, setFormData] = useState({
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
    if (!isLoading && (!user || (user.role !== 'DOCTOR' && user.role !== 'ADMIN'))) {
      navigate('/');
    } else if (user) {
      fetchProfile();
    }
  }, [user, isLoading]);

  const fetchProfile = async () => {
    try {
      const docRes = await axios.get('http://localhost:8000/api/doctor/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myDocProfile = docRes.data;
      
      if (myDocProfile) {
        setProfile(myDocProfile);
        setFormData({
          name: myDocProfile.user?.name || user?.name || '',
          specialization: myDocProfile.specialization || 'General Physician',
          qualification: myDocProfile.qualification || '',
          experience_years: myDocProfile.experience_years || 0,
          hospital: myDocProfile.hospital || '',
          clinic_address: myDocProfile.clinic_address || '',
          consultation_fee: myDocProfile.consultation_fee || 500,
          online_consultation: myDocProfile.online_consultation ?? true,
          offline_consultation: myDocProfile.offline_consultation ?? true,
          latitude: myDocProfile.latitude || 0,
          longitude: myDocProfile.longitude || 0,
          about: myDocProfile.about || ''
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.put('http://localhost:8000/api/doctors/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Doctor credentials and consultation profile updated successfully!' });
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setMessage({ type: 'success', text: 'GPS Location coordinates acquired!' });
        },
        (error) => {
          console.error("Error getting location:", error);
          setMessage({ type: 'error', text: 'Please enable location permissions in your browser.' });
        }
      );
    } else {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">Loading Doctor Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab={'checker' as any} setActiveTab={() => {}} />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Dr. {formData.name || user?.name}'s Profile</h1>
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your clinical credentials, fee, hospital affiliations, and consultation availability.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Verified Specialist</span>
            </span>
          </div>
        </div>
        
        {message.text && (
          <div className={`p-4 rounded-2xl mb-6 text-xs sm:text-sm font-bold flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Doctor Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>Doctor Full Name</span>
              </label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Dr. Full Name"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <BriefcaseMedical className="w-4 h-4 text-emerald-600" />
                <span>Specialization</span>
              </label>
              <select 
                value={formData.specialization}
                onChange={e => setFormData({...formData, specialization: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {MEDICAL_SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                <span>Qualifications (e.g. MBBS, MD, MS)</span>
              </label>
              <input 
                type="text" 
                value={formData.qualification}
                onChange={e => setFormData({...formData, qualification: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. MBBS, MD (Internal Medicine)"
              />
            </div>

            {/* Hospital/Clinic */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>Hospital / Medical Facility</span>
              </label>
              <input 
                type="text" 
                value={formData.hospital}
                onChange={e => setFormData({...formData, hospital: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Apollo Hospital / City Clinic"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Years of Clinical Experience
              </label>
              <input 
                type="number" 
                min="0"
                max="60"
                value={formData.experience_years}
                onChange={e => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Consultation Fee */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Consultation Fee (₹)</span>
              </label>
              <input 
                type="number" 
                min="0"
                step="50"
                value={formData.consultation_fee}
                onChange={e => setFormData({...formData, consultation_fee: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Clinic Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Clinic Physical Address</span>
              </label>
              <input 
                type="text"
                value={formData.clinic_address}
                onChange={e => setFormData({...formData, clinic_address: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Street address, department floor, city"
              />
            </div>

            {/* Location */}
            <div className="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Clinic GPS Location Coordinates</span>
                </label>
                <button 
                  type="button"
                  onClick={getLocation}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Use My Current Location
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Latitude</label>
                  <input 
                    type="number" step="any"
                    value={formData.latitude || ''}
                    onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 14.3350"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Longitude</label>
                  <input 
                    type="number" step="any"
                    value={formData.longitude || ''}
                    onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 78.5382"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Setting precise coordinates enables patients to locate you in distance-ranked searches.</p>
            </div>

            {/* Consultation Types */}
            <div className="md:col-span-2 flex flex-wrap gap-8 p-4 bg-slate-50 rounded-2xl border border-slate-200/90">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.online_consultation}
                  onChange={e => setFormData({...formData, online_consultation: e.target.checked})}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Offer Online Video Consultations</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.offline_consultation}
                  onChange={e => setFormData({...formData, offline_consultation: e.target.checked})}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Offer Offline (In-Clinic) Consultations</span>
              </label>
            </div>

            {/* About / Bio */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>About Doctor / Clinical Philosophy</span>
              </label>
              <textarea 
                rows={3}
                value={formData.about}
                onChange={e => setFormData({...formData, about: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Describe your medical approach, specialty areas, and patient care philosophy..."
              />
            </div>
            
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/doctors')}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              View in Doctors Directory
            </button>

            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
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
      </main>

      <Footer />
    </div>
  );
}
