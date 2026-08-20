import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Profile } from '@/types';
import { mockStore } from '@/lib/supabase/mock-store';
import { Send, Clock, CheckCheck, Shield, Bike, UserCheck } from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';

interface ChatWindowProps {
  threadId: string;
  currentUser: Profile;
  recipientName?: string;
  recipientRole?: string;
  deliveryReference?: string;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  threadId,
  currentUser,
  recipientName = 'Support & Dispatch',
  recipientRole = 'admin',
  deliveryReference,
  className = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreadMessages = () => {
    const threadMsgs = mockStore.getChatMessages(threadId);
    setMessages(threadMsgs);
    // Mark messages as read by current user
    mockStore.markThreadMessagesAsRead(threadId, currentUser.id);
  };

  useEffect(() => {
    fetchThreadMessages();
    const unsubscribe = mockStore.subscribe(() => {
      fetchThreadMessages();
    });
    return () => unsubscribe();
  }, [threadId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    // Sanitize input (strip dangerous script tags)
    const sanitized = inputMessage
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .slice(0, 500); // 500 character limit

    setIsSending(true);

    // Optimistic message dispatch
    mockStore.sendChatMessage(threadId, currentUser.id, sanitized);
    setInputMessage('');
    setIsSending(false);
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-purple-600" />;
      case 'rider':
        return <Bike className="w-3.5 h-3.5 text-amber-600" />;
      case 'customer':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col h-[480px] bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary-700 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-sm">
            {recipientName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm leading-tight">
              <span>{recipientName}</span>
              <span className="p-0.5 bg-white rounded-full">{getRoleIcon(recipientRole)}</span>
            </div>
            <div className="text-[11px] text-purple-200">
              {deliveryReference ? `Order: ${deliveryReference}` : 'Active Communication Channel'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[10px] text-purple-100 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Realtime</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF9FD]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted">
            <Clock className="w-8 h-8 text-primary/30 mb-2" />
            <p className="text-xs font-semibold text-gray-700">No messages in this channel yet.</p>
            <p className="text-[11px] text-muted">Send a message to start communicating in real time.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-muted">
                  <span>{formatTimeOnly(msg.created_at)}</span>
                  {isMe && (
                    <CheckCheck
                      className={`w-3 h-3 ${msg.read_at ? 'text-blue-500' : 'text-gray-400'}`}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Message ${recipientName.split(' ')[0]}...`}
          maxLength={500}
          className="flex-1 bg-gray-50 text-xs text-gray-900 rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="p-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:pointer-events-none text-gray-900 rounded-xl transition-all shadow-sm active:scale-95"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
