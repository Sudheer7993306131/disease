import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { 
  Send, 
  Search, 
  Smile, 
  Paperclip, 
  Mic, 
  CheckCheck, 
  Phone, 
  Video, 
  MoreVertical, 
  User as UserIcon, 
  Stethoscope, 
  Calendar, 
  ShieldCheck, 
  Lock, 
  ArrowLeft,
  MessageSquare,
  Clock,
  Sparkles,
  Trash2,
  Ban,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface ChatContact {
  id: string; // recipient_id or consultation_id
  type: 'DIRECT' | 'CONSULTATION';
  name: string;
  role?: string;
  avatar?: string;
  subtitle?: string;
  lastMessage?: string;
  timestamp?: string;
  isOnline?: boolean;
  isBlocked?: boolean;
  hasBlockedMe?: boolean;
}

export default function Chat() {
  const { consultationId, recipientId } = useParams();
  const [searchParams] = useSearchParams();
  const directRecipientParam = searchParams.get('recipient') || recipientId;
  const consultationParam = searchParams.get('consultation') || consultationId;

  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeChat, setActiveChat] = useState<ChatContact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // 1. Fetch RECENT conversations only (users with chat history + active consultations)
  const loadRecentConversations = async () => {
    if (!token || !user) return;

    try {
      const contactList: ChatContact[] = [];

      // A. Load accepted consultations
      const consultRes = await axios.get('http://localhost:8000/api/consultations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      consultRes.data.forEach((c: any) => {
        if (c.status === 'ACCEPTED') {
          contactList.push({
            id: c.id,
            type: 'CONSULTATION',
            name: c.other_party_name || `Consultation #${c.id.substring(0, 6)}`,
            subtitle: 'Online Clinical Consultation',
            role: user.role === 'DOCTOR' ? 'Patient' : 'Doctor Specialist',
            timestamp: c.created_at,
            isOnline: true
          });
        }
      });

      // B. Load ONLY recent direct contacts (users with active chat history)
      const recentRes = await axios.get('http://localhost:8000/api/chat/recent-contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      recentRes.data.forEach((r: any) => {
        contactList.push({
          id: r.id,
          type: 'DIRECT',
          name: r.role === 'DOCTOR' ? `Dr. ${r.name}` : r.name,
          role: r.role,
          subtitle: r.last_message || (r.role === 'DOCTOR' ? 'Verified Doctor' : 'Direct Contact'),
          timestamp: r.timestamp,
          isOnline: true,
          isBlocked: r.is_blocked,
          hasBlockedMe: r.has_blocked_me
        });
      });

      // If a recipient was explicitly opened via URL parameter and not yet in recent list, fetch user info and add
      if (directRecipientParam && !contactList.some(c => c.id === directRecipientParam && c.type === 'DIRECT')) {
        const usersRes = await axios.get('http://localhost:8000/api/users');
        const target = usersRes.data.find((u: any) => u.id === directRecipientParam);
        if (target) {
          const newC: ChatContact = {
            id: target.id,
            type: 'DIRECT',
            name: target.role === 'DOCTOR' ? `Dr. ${target.name}` : target.name,
            role: target.role,
            subtitle: target.role === 'DOCTOR' ? 'Verified Doctor' : 'Direct Message',
            isOnline: true
          };
          contactList.unshift(newC);
          setActiveChat(newC);
        }
      }

      setContacts(contactList);

      // Preselect active chat
      if (directRecipientParam) {
        const match = contactList.find(c => c.id === directRecipientParam && c.type === 'DIRECT');
        if (match) setActiveChat(match);
      } else if (consultationParam) {
        const match = contactList.find(c => c.id === consultationParam && c.type === 'CONSULTATION');
        if (match) setActiveChat(match);
      } else if (contactList.length > 0 && !activeChat) {
        setActiveChat(contactList[0]);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  useEffect(() => {
    loadRecentConversations();
  }, [token, user, directRecipientParam, consultationParam]);

  // 2. Connect WebSocket & Load History when activeChat changes
  useEffect(() => {
    if (!token || !user || !activeChat) return;

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setMessages([]);
    setMenuOpen(false);

    if (activeChat.type === 'CONSULTATION') {
      axios.get(`http://localhost:8000/api/chat/history/${activeChat.id}`)
        .then(res => {
          const formatted = res.data.map((m: any) => ({
            id: m.id || m._id,
            text: m.text,
            isMe: m.sender_id === user.id,
            senderName: m.sender_id === user.id ? user.name : activeChat.name,
            timestamp: m.timestamp || new Date().toISOString()
          }));
          setMessages(formatted);
          scrollToBottom();
        })
        .catch(console.error);

      const socket = new WebSocket(`ws://localhost:8000/api/chat/ws/${activeChat.id}?token=${token}`);
      socket.onmessage = (event) => {
        const raw = event.data;
        let text = raw;
        let senderName = activeChat.name;
        if (raw.includes(': ')) {
          senderName = raw.split(': ')[0];
          text = raw.split(': ').slice(1).join(': ');
        }
        setMessages(prev => [...prev, {
          id: Date.now(),
          text,
          isMe: false,
          senderName,
          timestamp: new Date().toISOString()
        }]);
        scrollToBottom();
      };
      ws.current = socket;

    } else {
      axios.get(`http://localhost:8000/api/chat/direct-history/${activeChat.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          const formatted = res.data.map((m: any) => ({
            id: m.id,
            text: m.text,
            isMe: m.sender_id === user.id,
            senderName: m.sender_id === user.id ? user.name : activeChat.name,
            timestamp: m.timestamp || new Date().toISOString()
          }));
          setMessages(formatted);
          scrollToBottom();
        })
        .catch(console.error);

      const socket = new WebSocket(`ws://localhost:8000/api/chat/ws/direct/${activeChat.id}?token=${token}`);
      socket.onmessage = (event) => {
        const raw = event.data;
        let text = raw;
        let senderName = activeChat.name;
        if (raw.includes(': ')) {
          senderName = raw.split(': ')[0];
          text = raw.split(': ').slice(1).join(': ');
        }
        setMessages(prev => [...prev, {
          id: Date.now(),
          text,
          isMe: false,
          senderName,
          timestamp: new Date().toISOString()
        }]);
        scrollToBottom();
      };
      ws.current = socket;
    }

    return () => {
      ws.current?.close();
    };
  }, [activeChat, token, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !ws.current || !activeChat || activeChat.isBlocked || activeChat.hasBlockedMe) return;

    ws.current.send(inputText);
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: inputText,
      isMe: true,
      senderName: user?.name,
      timestamp: new Date().toISOString()
    }]);

    setInputText('');
    scrollToBottom();
  };

  // 3. Delete Chat Action
  const handleDeleteChat = async () => {
    if (!activeChat || !token) return;
    if (!window.confirm(`Are you sure you want to delete all chat history with ${activeChat.name}? This will remove it from your recent chats.`)) return;

    try {
      if (activeChat.type === 'DIRECT') {
        await axios.delete(`http://localhost:8000/api/chat/direct-history/${activeChat.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.delete(`http://localhost:8000/api/chat/history/${activeChat.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setMessages([]);
      setContacts(prev => prev.filter(c => !(c.id === activeChat.id && c.type === activeChat.type)));
      setActiveChat(null);
      setMenuOpen(false);
      alert('Chat history deleted successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete chat history.');
    }
  };

  // 4. Block / Unblock User Action
  const handleToggleBlock = async () => {
    if (!activeChat || !token || activeChat.type !== 'DIRECT') return;

    try {
      if (activeChat.isBlocked) {
        // Unblock
        await axios.delete(`http://localhost:8000/api/chat/block/${activeChat.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActiveChat(prev => prev ? { ...prev, isBlocked: false } : null);
        setContacts(prev => prev.map(c => c.id === activeChat.id ? { ...c, isBlocked: false } : c));
        alert(`${activeChat.name} has been unblocked.`);
      } else {
        // Block
        await axios.post(`http://localhost:8000/api/chat/block/${activeChat.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActiveChat(prev => prev ? { ...prev, isBlocked: true } : null);
        setContacts(prev => prev.map(c => c.id === activeChat.id ? { ...c, isBlocked: true } : c));
        alert(`${activeChat.name} has been blocked.`);
      }
      setMenuOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update block status.');
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subtitle && c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-screen flex flex-col bg-[#efeae2] overflow-hidden select-none">
      {/* Top Main Navigation Bar */}
      <Navbar activeTab={'checker' as any} setActiveTab={() => {}} />

      {/* WhatsApp Web Split Container */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto overflow-hidden bg-white shadow-2xl relative border-x border-slate-200">
        
        {/* ================= LEFT SIDEBAR (Recent Chats List) ================= */}
        <div className={`w-full md:w-[380px] lg:w-[420px] bg-white border-r border-slate-200 flex flex-col shrink-0 ${
          activeChat ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header Bar */}
          <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{user?.name}</h3>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" /> Recent Conversations
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <button 
                onClick={() => navigate('/users')}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                title="Start new conversation with verified doctor"
              >
                <MessageSquare className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Search in Recent Chats */}
          <div className="p-2.5 bg-white border-b border-slate-100">
            <div className="bg-[#f0f2f5] rounded-xl flex items-center px-3 py-1.5 gap-2 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search recent chats..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm outline-none text-slate-800 placeholder:text-slate-400 py-1"
              />
            </div>
          </div>

          {/* Recent Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-20 px-6 text-slate-400">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No recent chats</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Only contacts you have actively chatted with or booked consultations with will appear here.
                </p>
                <button
                  onClick={() => navigate('/users')}
                  className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
                >
                  Start Chat from Directory
                </button>
              </div>
            ) : (
              filteredContacts.map(contact => {
                const isSelected = activeChat?.id === contact.id && activeChat?.type === contact.type;

                return (
                  <div
                    key={`${contact.type}-${contact.id}`}
                    onClick={() => setActiveChat(contact)}
                    className={`flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors relative ${
                      isSelected 
                        ? 'bg-[#f0f2f5] border-l-4 border-emerald-600' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-200 to-emerald-100 flex items-center justify-center text-emerald-800 font-extrabold text-base border border-slate-200">
                        {contact.role === 'DOCTOR' ? <Stethoscope className="w-5 h-5 text-emerald-700" /> : contact.name.charAt(0)}
                      </div>
                      {contact.isOnline && !contact.isBlocked && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                      )}
                      {contact.isBlocked && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                          ✕
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{contact.name}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {contact.timestamp ? new Date(contact.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                          {contact.subtitle || 'Click to message'}
                        </p>
                        {contact.isBlocked && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded">
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT CHAT PANE ================= */}
        {activeChat ? (
          <div className="flex-1 flex flex-col bg-[#efeae2] h-full overflow-hidden relative">
            
            {/* Top WhatsApp Header */}
            <div className="bg-[#f0f2f5] px-4 py-2.5 flex items-center justify-between border-b border-slate-200 z-20 shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-1.5 -ml-1 text-slate-600 hover:bg-slate-200 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {activeChat.name.charAt(0)}
                  </div>
                  {activeChat.isOnline && !activeChat.isBlocked && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate max-w-[180px] sm:max-w-md">
                    {activeChat.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    {activeChat.isBlocked ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Blocked Contact
                      </span>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        online • {activeChat.type === 'CONSULTATION' ? 'Clinical Channel' : 'Direct Messages'}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Calls & Options Menu */}
              <div className="flex items-center space-x-1 sm:space-x-2 text-slate-600 relative">
                <button 
                  onClick={() => alert(`Audio consultation calling ${activeChat.name}...`)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                  title="Audio Consultation Call"
                >
                  <Phone className="w-4 h-4 text-slate-600" />
                </button>
                <button 
                  onClick={() => alert(`Initiating video consultation with ${activeChat.name}...`)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                  title="Video Consultation Call"
                >
                  <Video className="w-4 h-4 text-slate-600" />
                </button>

                {/* 3-DOTS OPTIONS MENU (Delete Chat & Block User) */}
                <div className="relative">
                  <button 
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors focus:outline-none"
                    title="Chat Options"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-600" />
                  </button>

                  {menuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setMenuOpen(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                        
                        {/* Delete Chat */}
                        <button
                          onClick={handleDeleteChat}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                          <span>Delete Chat History</span>
                        </button>

                        {/* Block / Unblock User (for direct chat) */}
                        {activeChat.type === 'DIRECT' && (
                          <button
                            onClick={handleToggleBlock}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors text-left ${
                              activeChat.isBlocked 
                                ? 'text-emerald-700 hover:bg-emerald-50' 
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {activeChat.isBlocked ? (
                              <>
                                <UserCheck className="w-4 h-4 text-emerald-600" />
                                <span>Unblock User</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4 text-slate-500" />
                                <span>Block User</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>

            {/* Blocked Warning Banner */}
            {activeChat.isBlocked && (
              <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-800 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  You have blocked this contact. Unblock to send and receive messages.
                </span>
                <button
                  onClick={handleToggleBlock}
                  className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-all"
                >
                  Unblock
                </button>
              </div>
            )}

            {/* WhatsApp Canvas */}
            <div 
              className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 relative"
              style={{
                backgroundImage: 'radial-gradient(#d1d7db 1.2px, transparent 1.2px)',
                backgroundSize: '24px 24px'
              }}
            >
              <div className="text-center my-2">
                <span className="inline-flex items-center gap-1.5 bg-[#ffeecd] border border-amber-200/80 text-amber-900 text-[11px] font-medium px-4 py-1.5 rounded-lg shadow-sm">
                  <Lock className="w-3 h-3 text-amber-700" />
                  Messages and calls are end-to-end encrypted. No one outside of this chat can read them.
                </span>
              </div>

              <div className="text-center my-3">
                <span className="bg-white/90 border border-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-md shadow-xs uppercase tracking-wider">
                  Today
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {activeChat.isBlocked ? 'This conversation is blocked.' : 'No messages yet. Say hello to start chatting!'}
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div 
                    key={msg.id || idx} 
                    className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
                  >
                    <div 
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-xs relative group ${
                        msg.isMe
                          ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs border border-emerald-200/50'
                          : 'bg-white text-[#111b21] rounded-tl-xs border border-slate-200/80'
                      }`}
                    >
                      {!msg.isMe && (
                        <p className="text-[11px] font-extrabold text-emerald-700 mb-0.5">
                          {msg.senderName || activeChat.name}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm leading-relaxed pr-14 break-words">
                        {msg.text}
                      </p>
                      
                      <div className="flex items-center justify-end gap-1 -mt-1 text-[10px] text-[#667781] float-right ml-2 select-none">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.isMe && (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="bg-[#f0f2f5] px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 border-t border-slate-200 shrink-0">
              <button 
                type="button"
                disabled={activeChat.isBlocked}
                onClick={() => setInputText(prev => prev + ' 👋 ')}
                className="p-2 text-[#54656f] hover:bg-slate-200 rounded-full transition-colors disabled:opacity-40"
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              <button 
                type="button"
                disabled={activeChat.isBlocked}
                onClick={() => alert('Attachments: upload medical reports or prescriptions.')}
                className="p-2 text-[#54656f] hover:bg-slate-200 rounded-full transition-colors hidden sm:block disabled:opacity-40"
                title="Attach document"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  disabled={activeChat.isBlocked}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={activeChat.isBlocked ? 'You cannot message a blocked user.' : 'Type a message...'}
                  className="w-full bg-white rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none text-[#111b21] placeholder:text-[#8696a0] shadow-2xs border border-transparent focus:border-slate-300 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />

                {inputText.trim() && !activeChat.isBlocked ? (
                  <button 
                    type="submit"
                    className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center transition-all shadow-md shrink-0 active:scale-95"
                    title="Send message"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                ) : (
                  <button 
                    type="button"
                    disabled={activeChat.isBlocked}
                    className="w-10 h-10 rounded-full text-[#54656f] hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0 disabled:opacity-40"
                    title="Voice note"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </form>
            </div>

          </div>
        ) : (
          /* Empty State Screen */
          <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#f0f2f5] p-8 text-center border-b-[6px] border-[#00a884]">
            <div className="w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center mb-6 text-emerald-600">
              <MessageSquare className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-light text-slate-800">MediCURE Web Messages</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
              Send and receive direct clinical messages, consultation updates, and triage advice directly with verified doctors.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-8 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>End-to-end encrypted medical communication</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
