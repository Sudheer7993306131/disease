import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Lock, Mail, User, Stethoscope, ArrowRight, Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [specialization, setSpecialization] = useState('General Physician');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:8000/api/auth/register', {
        name,
        email,
        password,
        role,
        specialization: role === 'DOCTOR' ? specialization : undefined
      });
      alert('Account registered successfully! Please sign in with your credentials.');
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar activeTab={'checker' as any} setActiveTab={() => {}} />
      
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">
          
          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-3">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Create Account</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Join MediCURE AI to access personalized disease analysis and care triaging
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
            {error && (
              <div className="mb-5 text-xs text-rose-700 bg-rose-50 border border-rose-200/80 p-3.5 rounded-xl font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                {error}
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role Toggle Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole('USER')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      role === 'USER' 
                        ? 'bg-white text-emerald-700 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Patient / User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('DOCTOR')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      role === 'DOCTOR' 
                        ? 'bg-white text-emerald-700 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Medical Doctor
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="pl-10 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
                    placeholder="Dr. Jane Smith or John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {role === 'DOCTOR' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Medical Specialization
                  </label>
                  <select 
                    value={specialization} 
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
                  >
                    <option value="General Physician">General Physician</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Gynecologist">Gynecologist</option>
                    <option value="Orthopedic">Orthopedic</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                    <option value="Gastroenterologist">Gastroenterologist</option>
                    <option value="Endocrinologist">Endocrinologist</option>
                    <option value="Ophthalmologist">Ophthalmologist</option>
                    <option value="Dentist">Dentist</option>
                    <option value="ENT Specialist">ENT Specialist</option>
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all mt-4 active:scale-98"
              >
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Registering Account...
                  </>
                ) : (
                  <>
                    Create Verified Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Compliant Healthcare Data Privacy Standard</span>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
