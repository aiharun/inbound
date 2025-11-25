
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Trash2 } from 'lucide-react';
import { ChatMessage, User as UserType } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUser: UserType;
  onSendMessage: (content: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  currentUser,
  onSendMessage
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm sm:items-end sm:justify-end sm:p-6">
      <div className="bg-white w-full h-full sm:h-[600px] sm:w-[400px] sm:rounded-2xl shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
        {/* Header */}
        <div className="bg-orange-600 p-4 flex items-center justify-between sm:rounded-t-2xl shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full text-white">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Ekip Sohbeti</h2>
              <p className="text-orange-100 text-xs">Ayazağa Inbound Ekibi</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-orange-100 hover:text-white p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <MessageSquare size={48} className="mb-2" />
              <p>Henüz mesaj yok. Sohbeti başlat!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              // Check if System Message
              if (msg.isSystemMessage) {
                  return (
                      <div key={msg.id} className="flex justify-center my-4">
                          <div className="bg-slate-200 text-slate-500 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold">
                              <Trash2 size={10} />
                              {msg.content}
                          </div>
                      </div>
                  );
              }

              const isMe = msg.senderUsername === currentUser.username;
              const showHeader = index === 0 || messages[index - 1].senderUsername !== msg.senderUsername;

              return (
                <div 
                  key={msg.id} 
                  className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar for others */}
                    {!isMe && (
                      <div className="flex-shrink-0 mt-1">
                        {showHeader ? (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold border border-orange-200 shadow-sm" title={msg.senderName}>
                            {getInitials(msg.senderName)}
                          </div>
                        ) : (
                          <div className="w-8 h-8" /> // Spacer
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Sender Name */}
                      {!isMe && showHeader && (
                        <span className="text-xs text-slate-500 ml-1 mb-1 font-bold">
                          {msg.senderName}
                        </span>
                      )}
                      
                      {/* Message Bubble */}
                      <div 
                        className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words relative group ${
                          isMe 
                            ? 'bg-orange-600 text-white rounded-tr-none' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                        <span className={`text-[10px] block text-right mt-1 opacity-70 ${isMe ? 'text-orange-100' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 sm:rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Bir mesaj yazın..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-orange-200"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
