import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useDarkMode } from '@/features/theme/DarkModeContext';
import { Badge } from '@/components/ui/badge';
import { InitialsAvatar } from '@/components/ui/InitialsAvatar';
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
  Sun,
  Moon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
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
    <header className="sticky top-0 z-40 bg-white/60 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-900/10 dark:border-gray-700/50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-surface dark:bg-gray-800 text-primary flex items-center justify-center font-black text-base shadow-sm">
                DT
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-gray-900 dark:text-gray-100">
                  Delivery Tracker <span className="text-accent font-black">Pro</span>
                </span>
                <span className="text-[9px] text-blue-700 dark:text-blue-400 uppercase font-mono tracking-wider">
                  Live Dispatch PWA
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav
              className={`hidden md:flex md:gap-1 ${
                location.pathname.startsWith('/admin')
                  ? 'md:fixed md:left-4 md:top-20 md:z-30 md:w-56 md:flex-col md:items-stretch md:rounded-2xl md:border md:border-orange-900/15 md:bg-white/50 md:p-3 md:backdrop-blur-md md:shadow-lg'
                  : 'md:fixed md:left-4 md:top-20 md:z-30 md:w-48 md:flex-col md:items-stretch md:rounded-2xl md:border md:border-sky-900/15 md:bg-white/45 md:p-2 md:backdrop-blur-md md:shadow-sm'
              }`}
            >
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all md:w-full md:justify-start ${
                      isActive
                        ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-300 shadow-sm'
                        : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-900 dark:hover:text-blue-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header: Active Persona Profile, Dark Toggle & Logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-white/20 dark:border-gray-700">
                <InitialsAvatar
                  src={user.avatar_url}
                  name={user.full_name}
                  size="sm"
                  className="border border-white/40"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[130px]">
                    {user.full_name}
                  </div>
                  <Badge variant="accent" className="text-[9px] py-0 px-1.5 uppercase font-bold">
                    {user.role}
                  </Badge>
                </div>
              </div>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl text-blue-700 dark:text-yellow-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-blue-700 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-900 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-blue-700 active:text-blue-900 hover:bg-blue-50 hover:text-blue-900 md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/70 dark:bg-gray-900/90 backdrop-blur-md border-t border-slate-900/10 dark:border-gray-700/50 px-4 py-3 space-y-1 animate-slide-up">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive
                    ? 'bg-blue-50 dark:bg-sky-900/40 text-blue-900 dark:text-sky-300 font-bold'
                    : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800'
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
