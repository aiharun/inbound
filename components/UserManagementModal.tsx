import React, { useState } from 'react';
import { X, UserPlus, Trash2, Shield, User, Clock, Monitor, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { User as UserType, ActiveSession } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserType[];
  activeSessions: ActiveSession[];
  onAddUser: (user: UserType) => void;
  onDeleteUser: (username: string) => void;
  currentUser: UserType;
  onSendMessage: (targetUsername: string, messageContent: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  activeSessions,
  onAddUser,
  onDeleteUser,
  currentUser,
  onSendMessage
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState('');

  // Messaging State
  const [messagingUser, setMessagingUser] = useState<UserType | null>(null);
  const [messageBody, setMessageBody] = useState('');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUsername || !newPassword || !newName) {
      setError('Tüm alanları doldurunuz.');
      return;
    }

    if (users.some(u => u.username === newUsername)) {
      setError('Bu kullanıcı adı zaten mevcut.');
      return;
    }

    onAddUser({
      username: newUsername,
      password: newPassword,
      name: newName,
      role: newRole
    });

    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewRole('user');
  };

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messagingUser && messageBody.trim()) {
      onSendMessage(messagingUser.username, messageBody);
      setMessagingUser(null);
      setMessageBody('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 m-4 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Kullanıcı Yönetimi</h2>
            <p className="text-sm text-slate-500">Personel ekle, sil ve aktif oturumları izle</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto custom-scrollbar pr-2">
          {/* LEFT COLUMN: User List & Add User / Message User */}
          <div className="space-y-6">
            
            {/* Toggle between Add User and Send Message Form */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              {messagingUser ? (
                 <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <MessageSquare size={18} className="text-blue-600" />
                            Mesaj Gönder
                        </h3>
                        <button 
                            onClick={() => {
                                setMessagingUser(null);
                                setMessageBody('');
                            }}
                            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                            <ArrowLeft size={12} /> Geri
                        </button>
                    </div>
                    <div className="mb-3 p-2 bg-white rounded border border-slate-200 text-sm">
                        <span className="text-slate-400">Alıcı:</span> <span className="font-bold text-slate-700 ml-1">{messagingUser.name}</span>
                    </div>
                    <form onSubmit={handleSendMessageSubmit} className="space-y-3">
                        <textarea
                            placeholder="Mesajınızı yazın..."
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!messageBody.trim()}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} />
                            Gönder
                        </button>
                    </form>
                 </div>
              ) : (
                <>
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <UserPlus size={18} className="text-orange-600" />
                    Yeni Kullanıcı Ekle
                  </h3>
                  <form onSubmit={handleAddSubmit} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Ad Soyad"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Kullanıcı Adı"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Şifre"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="user">Standart Kullanıcı</option>
                      <option value="admin">Yönetici (Admin)</option>
                    </select>
                    
                    {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

                    <button
                      type="submit"
                      className="w-full py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors shadow-sm"
                    >
                      Kullanıcı Oluştur
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Registered Users List */}
            <div>
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <User size={18} className="text-slate-500" />
                Kayıtlı Kullanıcılar
              </h3>
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.username} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-orange-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                        {user.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500">@{user.username}</p>
                      </div>
                    </div>
                    {user.username !== currentUser.username && (
                      <div className="flex gap-1">
                          <button
                            onClick={() => setMessagingUser(user)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mesaj Gönder"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteUser(user.username)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Sessions */}
          <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 h-full">
            <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <Monitor size={18} className="text-emerald-600" />
              Aktif Oturumlar (Online)
            </h3>
            
            {activeSessions.length === 0 ? (
              <p className="text-sm text-emerald-600/60 italic">Görüntülenecek aktif oturum yok.</p>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex items-start gap-3">
                     <div className="relative">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                            <User size={16} />
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                     </div>
                     <div>
                        <p className="font-bold text-slate-800 text-sm">{session.name}</p>
                        <p className="text-xs text-slate-500 mb-1">@{session.username}</p>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                            <Clock size={10} />
                            {new Date(session.loginTime).toLocaleTimeString('tr-TR')}
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 p-3 bg-emerald-100/50 rounded-lg text-xs text-emerald-700">
                <p className="font-bold mb-1">Bilgi:</p>
                Sistemdeki anlık giriş yapmış kullanıcıları gösterir. Kullanıcı çıkış yaptığında listeden otomatik düşer.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};