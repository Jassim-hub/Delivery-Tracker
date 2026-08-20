import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { mockStore } from '@/lib/supabase/mock-store';
import { Users, Shield, Bike, UserCheck, RotateCcw, Tv, ChevronDown } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { user, loginAs, availableProfiles } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSwitch = (profileId: string, role: string) => {
    loginAs(profileId);
    setIsOpen(false);
    if (role === 'rider') navigate('/rider');
    else if (role === 'customer') navigate('/customer');
    else if (role === 'admin') navigate('/admin');
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo deliveries, chats, and coordinates to initial state?')) {
      mockStore.resetToDefaults();
      window.location.reload();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-700" />;
      case 'rider':
        return <Bike className="w-4 h-4 text-amber-600" />;
      case 'customer':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      {/* Trigger Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-white/60 backdrop-blur-sm border border-slate-900/10 shadow-sm text-xs font-bold text-blue-700 hover:bg-blue-50 hover:scale-105 transition-all duration-200"
          title="Switch Active Persona / Role"
        >
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Role Switcher:</span>
          <span className="font-extrabold text-gray-900 truncate max-w-[120px]">
            {user?.full_name?.split(' ')[0] || 'Select Role'} ({user?.role?.toUpperCase()})
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-12 right-0 w-80 rounded-2xl bg-surface border border-gray-100 shadow-2xl p-3 animate-slide-up space-y-2 text-gray-900">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Evaluation Switcher</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Demo Mode</span>
            </div>

            {/* Profile List */}
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {availableProfiles.map((p) => {
                const isActive = user?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwitch(p.id, p.role)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-primary text-white font-semibold shadow-sm'
                        : 'hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={p.full_name}
                        className="w-7 h-7 rounded-full object-cover border border-white/30"
                      />
                      <div>
                        <div className={`text-xs ${isActive ? 'text-white font-bold' : 'text-gray-900 font-semibold'}`}>
                          {p.full_name}
                        </div>
                        <div className={`text-[10px] capitalize ${isActive ? 'text-blue-100' : 'text-muted'}`}>
                          {p.role} {p.role === 'rider' ? '• Yamaha DT 125' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {!isActive && getRoleIcon(p.role)}
                      {isActive && <span className="text-xs font-bold text-accent">Active</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 px-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/tv-display');
                }}
                className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-700 font-semibold p-1.5 rounded-lg hover:bg-primary/5"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>TV Board</span>
              </button>

              <button
                onClick={handleResetData}
                className="flex items-center gap-1.5 text-[11px] text-muted hover:text-red-600 font-semibold p-1.5 rounded-lg hover:bg-red-50"
                title="Reset local state to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
