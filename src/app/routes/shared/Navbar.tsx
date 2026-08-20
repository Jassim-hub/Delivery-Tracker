import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import {
  Bike,
  UserCheck,
  Shield,
  LogOut,
  MapPin,
  Package,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Tv,
  Star,
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (role) {
      case 'rider':
        return [
          { label: 'Delivery Queue', href: '/rider', icon: Bike },
          { label: 'Live Chat', href: '/rider/chat', icon: MessageSquare },
          { label: 'My Rating & Specs', href: '/rider/profile', icon: Star },
        ];
      case 'customer':
        return [
          { label: 'Live Tracking', href: '/customer', icon: MapPin },
          { label: 'Rider Chat', href: '/customer/chat', icon: MessageSquare },
          { label: 'Order History', href: '/customer/history', icon: Package },
        ];
      case 'admin':
        return [
          { label: 'Live Ops Map', href: '/admin', icon: Shield },
          { label: 'Deliveries', href: '/admin/deliveries', icon: Package },
          { label: 'Rider Fleet', href: '/admin/riders', icon: Bike },
          { label: 'SAP ByD Sync', href: '/admin/sap-sync', icon: RefreshCw },
          { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
          { label: 'TV Wallboard', href: '/admin/tv-display', icon: Tv },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-primary via-primary-700 to-primary-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-surface text-primary flex items-center justify-center font-black text-base shadow-sm">
                DT
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base leading-tight tracking-tight">
                  Delivery Tracker <span className="text-accent font-black">Pro</span>
                </span>
                <span className="text-[9px] text-purple-200 uppercase font-mono tracking-wider">
                  Live Dispatch PWA
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-purple-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header: Active Persona Profile & Logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-white/20">
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={user.full_name}
                  className="w-8 h-8 rounded-full object-cover border border-white/40"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-white truncate max-w-[130px]">
                    {user.full_name}
                  </div>
                  <Badge variant="accent" className="text-[9px] py-0 px-1.5 uppercase font-bold">
                    {user.role}
                  </Badge>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-900 border-t border-white/10 px-4 py-3 space-y-1 animate-slide-up">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white font-bold' : 'text-purple-200 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
