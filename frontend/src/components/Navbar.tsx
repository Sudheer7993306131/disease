import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  BookOpen, 
  BarChart3, 
  HeartPulse, 
  Bell, 
  X, 
  Trash2, 
  Check, 
  MessageSquare, 
  ArrowRight, 
  Clock, 
  Users, 
  Stethoscope, 
  Calendar, 
  ChevronDown, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  Menu,
  FileText,
  Sparkles,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface NavbarProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab = 'checker', setActiveTab }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user, token, showNotifications]);

  const fetchNotifications = () => {
    if (!token) return;
    axios.get('http://localhost:8000/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setNotifications(res.data))
      .catch(console.error);
  };

  const deleteNotification = (id: string) => {
    if (!token) return;
    axios.delete(`http://localhost:8000/api/notifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      })
      .catch(console.error);
  };

  const handleAction = async (notifId: string, action: 'ACCEPT' | 'REJECT') => {
    if (!token) return;
    setActionLoading(notifId);
    try {
      await axios.post(
        `http://localhost:8000/api/notifications/${notifId}/action`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action.toLowerCase()} request`);
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleTabClick = (tab: ActiveTab) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        if (setActiveTab) setActiveTab(tab);
      }, 50);
    } else if (setActiveTab) {
      setActiveTab(tab);
    }
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read || n.status === 'PENDING').length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-17">
            
            {/* Brand Logo & Clinical Suite Badge */}
            <Link 
              to="/"
              className="flex items-center space-x-3.5 cursor-pointer group shrink-0"
            >
              <div className="w-10.5 h-10.5 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500/20 group-hover:scale-105 transition-all duration-200">
                <HeartPulse className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">Medi</span>
                  <span className="text-xl font-black tracking-tight text-emerald-600">CURE</span>
                  <span className="ml-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 tracking-widest uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    AI 2.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold tracking-tight hidden lg:block uppercase">
                  Clinical Diagnostics & Telehealth Suite
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center space-x-1">
              <button
                onClick={() => handleTabClick('checker')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'checker' && location.pathname === '/'
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border border-emerald-200/90 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Symptom Checker</span>
              </button>

              <button
                onClick={() => handleTabClick('encyclopedia')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'encyclopedia' && location.pathname === '/'
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border border-emerald-200/90 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Encyclopedia</span>
              </button>

              <div className="h-5 w-[1px] bg-slate-200/80 mx-1"></div>

              {/* Chat / Messages Link */}
              <Link
                to="/chat"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  location.pathname.startsWith('/chat') || location.pathname.startsWith('/direct-chat')
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border border-emerald-200/90 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Messages</span>
              </Link>

              <Link
                to="/doctors"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  location.pathname === '/doctors'
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border border-emerald-200/90 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Find Doctors</span>
              </Link>

              <Link
                to="/users"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  location.pathname === '/users'
                    ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-900 border border-indigo-200/90 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Directory</span>
              </Link>

              <Link
                to="/health-records"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  location.pathname === '/health-records'
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border border-emerald-200/90 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Health Records</span>
              </Link>
            </nav>

            {/* Right Action Area: Notifications, User Profile & Mobile Toggle */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Notifications Icon Button */}
              {user && (
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative w-10 h-10 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Notifications"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-rose-600 text-white text-[9px] font-black items-center justify-center shadow-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </span>
                  )}
                </button>
              )}

              {/* User Dropdown or Sign In */}
              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-xs">
                      {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-black text-slate-800 leading-none truncate max-w-[110px]">{user.name}</p>
                      <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider mt-0.5">{user.role}</p>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${
                      profileDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                    }`} />
                  </button>

                  {/* Dropdown Menu & Click-Outside Backdrop */}
                  {profileDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setProfileDropdownOpen(false)} 
                      />
                      <div className="absolute right-0 mt-2.5 w-72 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                        
                        {/* Profile Header Box */}
                        <div className="p-3.5 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-100 mb-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm uppercase shadow-sm">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                            </div>
                          </div>
                          <div className="mt-2.5 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200/70">
                              {user.role === 'DOCTOR' ? '🩺 Verified Doctor' : user.role === 'ADMIN' ? '🛡️ Administrator' : '👤 Patient Account'}
                            </span>
                          </div>
                        </div>

                        {/* Navigation Items */}
                        <div className="space-y-0.5">
                          <Link
                            to="/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors"
                          >
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>My Consultations</span>
                          </Link>

                          <Link
                            to="/health-records"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors"
                          >
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <span>Health Records & Vitals</span>
                          </Link>

                          <Link
                            to="/chat"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                            <span>Chat & Telehealth</span>
                          </Link>

                          {/* Benchmarks link */}
                          <button
                            onClick={() => handleTabClick('benchmarks')}
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 rounded-xl transition-colors cursor-pointer"
                          >
                            <BarChart3 className="w-4 h-4 text-cyan-600" />
                            <span>Model Benchmarks</span>
                          </button>

                          {user.role === 'DOCTOR' && (
                            <Link
                              to="/doctor-profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl transition-colors"
                            >
                              <Stethoscope className="w-4 h-4 text-teal-600" />
                              <span>Clinical Profile & Availability</span>
                            </Link>
                          )}

                          {user.role === 'ADMIN' && (
                            <Link
                              to="/admin"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-900 rounded-xl transition-colors"
                            >
                              <Shield className="w-4 h-4 text-purple-600" />
                              <span>Admin Oversight Portal</span>
                            </Link>
                          )}

                          <button
                            onClick={() => {
                              setShowNotifications(true);
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 rounded-xl transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2.5">
                              <Bell className="w-4 h-4 text-indigo-600" />
                              <span>Notifications</span>
                            </span>
                            {notifications.length > 0 && (
                              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                                {notifications.length}
                              </span>
                            )}
                          </button>
                        </div>

                        <div className="border-t border-slate-100 my-1"></div>

                        {/* Sign Out Button */}
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/25 active:scale-98"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 xl:hidden text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-xl px-4 py-3.5 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => handleTabClick('checker')}
              className="w-full text-left flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Symptom Checker</span>
            </button>
            <button
              onClick={() => handleTabClick('encyclopedia')}
              className="w-full text-left flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>Medical Encyclopedia</span>
            </button>
            <Link
              to="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Telehealth Messages</span>
            </Link>
            {user && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>My Consultations</span>
              </Link>
            )}
            <Link
              to="/doctors"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
            >
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>Find Specialists</span>
            </Link>
            <Link
              to="/users"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>User Directory</span>
            </Link>
            <Link
              to="/health-records"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Health Records & Vitals</span>
            </Link>
          </div>
        )}
      </header>

      {/* Slide-in Notifications Drawer */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowNotifications(false)}
          />
          
          <div className="w-full sm:w-[440px] bg-white h-full shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-slate-50 via-emerald-50/20 to-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Notifications</h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    {notifications.length} {notifications.length === 1 ? 'total alert' : 'total alerts'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowNotifications(false)} 
                className="p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
              {notifications.length === 0 ? (
                <div className="text-center py-24 px-4">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-3.5 text-slate-300 shadow-sm border border-slate-200">
                    <Bell className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm">All caught up!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    When message requests, appointment updates, or doctor responses arrive, you'll see them right here.
                  </p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative group"
                  >
                    {/* Delete Icon at Top Right */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="pr-8">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          notif.status === 'PENDING' ? 'bg-amber-500 animate-pulse' :
                          notif.status === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`} />
                        <h4 className="font-black text-slate-900 text-sm leading-tight">{notif.title}</h4>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed font-medium">
                        {notif.message}
                      </p>
                    </div>

                    {/* Interactive: Message Request Action Buttons */}
                    {notif.type === 'MESSAGE_REQUEST' && notif.status === 'PENDING' && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          disabled={actionLoading === notif.id}
                          onClick={() => handleAction(notif.id, 'ACCEPT')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-sm active:scale-98 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept Request
                        </button>
                        <button
                          disabled={actionLoading === notif.id}
                          onClick={() => handleAction(notif.id, 'REJECT')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 disabled:opacity-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Interactive: Accepted status & direct chat shortcut */}
                    {notif.status === 'ACCEPTED' && (notif.sender_id || notif.reference_id) && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" /> Request Accepted
                        </span>
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            navigate(`/chat?recipient=${notif.sender_id || notif.reference_id}`);
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          Chat Now <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Interactive: Direct message alert shortcut */}
                    {notif.type === 'NEW_MESSAGE' && notif.sender_id && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            navigate(`/chat?recipient=${notif.sender_id}`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Reply in Chat
                        </button>
                      </div>
                    )}

                    {/* Interactive: Consultation Request shortcut */}
                    {notif.type === 'CONSULTATION_REQUEST' && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            navigate('/dashboard');
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          View Consultation Dashboard <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2.5 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
