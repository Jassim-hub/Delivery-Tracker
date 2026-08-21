import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Bike, UserCheck, Sparkles, ArrowRight, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginAs, availableProfiles } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await loginWithEmail(email, password);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      navigate('/');
    }
  };

  const handleQuickDemoLogin = (profileId: string, role: string) => {
    loginAs(profileId);
    if (role === 'rider') navigate('/rider');
    else if (role === 'customer') navigate('/customer');
    else if (role === 'admin') navigate('/admin');
  };

  const adminProfile = availableProfiles.find((p) => p.role === 'admin');
  const riderProfile = availableProfiles.find((p) => p.role === 'rider');
  const customerProfile = availableProfiles.find((p) => p.role === 'customer');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-sky-50">
      <div className="w-full max-w-md space-y-5 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-700 text-accent text-2xl font-black shadow-sm">
            DT
          </div>
          <h1 className="text-2xl font-black text-primary">Delivery Tracker Pro</h1>
          <p className="text-xs text-muted">
            Live GPS Tracking PWA • SAP Business ByDesign Adapter
          </p>
        </div>

        {/* Quick Demo Personas Login Card */}
        <Card className="border-2 border-accent bg-amber-50/40 p-4 shadow-gold">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              One-Click Instant Evaluation Login
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {riderProfile && (
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(riderProfile.id, 'rider')}
                className="flex flex-col items-center p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-amber-200 shadow-sm transition-all hover:scale-105"
              >
                {riderProfile.avatar_url ? (
                  <img src={riderProfile.avatar_url} alt={riderProfile.full_name} className="w-7 h-7 rounded-full object-cover mb-1 border border-amber-200" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                ) : (
                  <Bike className="w-5 h-5 text-accent mb-1" />
                )}
                <span className="text-[11px] font-bold text-gray-900">Rider</span>
                <span className="text-[9px] text-muted">{riderProfile.full_name.split(' ')[0]}</span>
              </button>
            )}

            {customerProfile && (
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(customerProfile.id, 'customer')}
                className="flex flex-col items-center p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-amber-200 shadow-sm transition-all hover:scale-105"
              >
                {customerProfile.avatar_url ? (
                  <img src={customerProfile.avatar_url} alt={customerProfile.full_name} className="w-7 h-7 rounded-full object-cover mb-1 border border-amber-200" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                ) : (
                  <UserCheck className="w-5 h-5 text-emerald-600 mb-1" />
                )}
                <span className="text-[11px] font-bold text-gray-900">Customer</span>
                <span className="text-[9px] text-muted">{customerProfile.full_name.split(' ')[0]}</span>
              </button>
            )}

            {adminProfile && (
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(adminProfile.id, 'admin')}
                className="flex flex-col items-center p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-amber-200 shadow-sm transition-all hover:scale-105"
              >
                {adminProfile.avatar_url ? (
                  <img src={adminProfile.avatar_url} alt={adminProfile.full_name} className="w-7 h-7 rounded-full object-cover mb-1 border border-amber-200" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                ) : (
                  <Shield className="w-5 h-5 text-blue-700 mb-1" />
                )}
                <span className="text-[11px] font-bold text-gray-900">Admin</span>
                <span className="text-[9px] text-muted">{adminProfile.full_name.split(' ')[0]}</span>
              </button>
            )}
          </div>
        </Card>

        {/* Email / Password Sign In Form */}
        <Card className="shadow-card p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Account Credentials Sign In
            </h2>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. rider@deliverytracker.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full font-bold text-xs py-3 mt-2 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 mr-1" />
              Sign In to Portal
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-muted border-t border-gray-100 pt-4">
            Need a new account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Create Self-Service Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
