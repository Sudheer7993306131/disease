import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Send, User, ShieldAlert, Clock, MessageSquare } from 'lucide-react';

export default function DirectChat() {
  const { recipientId } = useParams();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [permissionStatus, setPermissionStatus] = useState<'ALLOWED' | 'PENDING' | 'NEED_REQUEST'>('ALLOWED');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    // Fetch recipient info
    axios.get('http://localhost:8000/api/users')
      .then(res => {
        const found = res.data.find((u: any) => u.id === recipientId);
        if (found) setRecipient(found);
      })
      .catch(console.error);

    // Check permissions
    if (user.role === 'USER') {
      axios.get('http://localhost:8000/api/notifications/permissions', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          const { all_allowed, accepted_doctors, pending_doctors } = res.data;
          if (all_allowed || accepted_doctors.includes(recipientId)) {
            setPermissionStatus('ALLOWED');
          } else if (pending_doctors.includes(recipientId)) {
            setPermissionStatus('PENDING');
          } else {
            setPermissionStatus('NEED_REQUEST');
          }
        })
        .catch(console.error);
    } else {
      setPermissionStatus('ALLOWED');
    }

    // Fetch chat history
    axios.get(`http://localhost:8000/api/chat/direct-history/${recipientId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const formatted = res.data.map((m: any) => ({
          text: m.text,
          sender: m.sender_id === user.id ? 'me' : 'them',
          senderName: m.sender_id === user.id ? user.name : 'Them'
        }));
        setMessages(formatted);
        scrollToBottom();
      })
      .catch(console.error);

    // Connect WebSocket
    const wsUrl = `ws://localhost:8000/api/chat/ws/direct/${recipientId}?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const data = event.data; // format: "SenderName: message"
      const splitIdx = data.indexOf(': ');
      if (splitIdx !== -1) {
        const senderName = data.slice(0, splitIdx);
        const text = data.slice(splitIdx + 2);
        setMessages(prev => [...prev, { text, sender: 'them', senderName }]);
        scrollToBottom();
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [recipientId, user, token]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !ws.current || permissionStatus !== 'ALLOWED') return;

    ws.current.send(inputText);
    setMessages(prev => [...prev, { text: inputText, sender: 'me', senderName: user?.name }]);
    setInputText('');
    scrollToBottom();
  };

  const sendRequest = async () => {
    if (!recipient) return;
    try {
      await axios.post('http://localhost:8000/api/notifications', {
        user_id: recipient.id,
        title: 'New Message Request',
        message: `${user?.name} has requested to connect and message you.`,
        type: 'MESSAGE_REQUEST',
        sender_id: user?.id,
        sender_name: user?.name,
        reference_id: user?.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPermissionStatus('PENDING');
      alert(`Message request sent to Dr. ${recipient.name}! You will be able to message once they accept.`);
    } catch (e) {
      alert('Failed to send request');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar activeTab={'checker' as any} setActiveTab={() => {}} />
      
      <main className="flex-1 flex justify-center p-0 sm:p-6 h-[calc(100vh-64px)]">
        <div className="w-full max-w-5xl bg-white sm:rounded-2xl sm:shadow-xl sm:border border-slate-200 flex flex-col overflow-hidden h-full">
          
          {/* Chat Header */}
          <div className="bg-white border-b border-slate-200 p-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-md">
                  <span className="font-extrabold text-lg uppercase">{recipient?.name?.charAt(0) || <User className="w-6 h-6"/>}</span>
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg leading-tight">{recipient?.name || 'Loading...'}</h2>
                <p className="text-xs text-indigo-600 font-semibold">{recipient?.role || 'User'}</p>
              </div>
            </div>
            
            {user?.role === 'USER' && recipient?.role === 'DOCTOR' && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                permissionStatus === 'ALLOWED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                permissionStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-slate-100 text-slate-700'
              }`}>
                {permissionStatus === 'ALLOWED' ? '✓ Request Accepted' :
                 permissionStatus === 'PENDING' ? 'Waiting for Acceptance' :
                 'Request Required'}
              </span>
            )}
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 bg-slate-50/50 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 relative" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            
            {permissionStatus !== 'ALLOWED' ? (
              <div className="my-auto max-w-md mx-auto text-center bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Doctor Approval Required</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  To protect doctor privacy and maintain organized consultations, patients must have their message request accepted by Dr. {recipient?.name || 'the doctor'} before starting direct messaging.
                </p>

                {permissionStatus === 'PENDING' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold">
                    <Clock className="w-4 h-4 animate-spin text-amber-600" />
                    Request is Pending Doctor Approval
                  </div>
                ) : (
                  <button
                    onClick={sendRequest}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Message Request
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <span className="bg-white border border-slate-200 text-slate-500 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                    Direct Communication Channel
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No messages yet. Send a greeting to start chatting!
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3 shadow-sm relative group ${
                        msg.sender === 'me' 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                      }`}>
                        {msg.sender !== 'me' && <p className="text-xs font-extrabold text-indigo-600 mb-1">{recipient?.name || msg.senderName}</p>}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="bg-white border-t border-slate-200 p-4 sm:px-6 shrink-0">
            <form onSubmit={sendMessage} className="flex gap-3 items-end">
              <div className="flex-1 bg-slate-100 rounded-2xl border border-transparent focus-within:border-indigo-300 focus-within:bg-white transition-all focus-within:ring-4 focus-within:ring-indigo-100 p-1">
                <input
                  type="text"
                  value={inputText}
                  disabled={permissionStatus !== 'ALLOWED'}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={permissionStatus === 'ALLOWED' ? 'Write a message...' : 'Approval required before messaging'}
                  className="w-full bg-transparent border-none rounded-xl px-4 py-3 text-sm outline-none text-slate-800 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <button 
                type="submit"
                disabled={!inputText.trim() || permissionStatus !== 'ALLOWED'}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white h-[52px] w-[52px] rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center shrink-0 group"
              >
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
