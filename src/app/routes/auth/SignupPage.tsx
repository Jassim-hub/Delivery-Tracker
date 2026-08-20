import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bike, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'rider' | 'customer'>('rider');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signup(fullName, email, phone, role);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      if (role === 'rider') navigate('/rider');
      else navigate('/customer');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-sky-50">
      <div className="w-full max-w-md space-y-5 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-700 text-accent text-2xl font-black shadow-sm">
            DT
          </div>
          <h1 className="text-2xl font-black text-primary">Create Delivery Account</h1>
          <p className="text-xs text-muted">
            Self-service onboarding for Riders & Customers
          </p>
        </div>

        <Card className="shadow-card p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Select Your Role *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('rider')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    role === 'rider'
                      ? 'border-blue-700 bg-blue-50 text-blue-700 font-bold shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Bike className="w-5 h-5 text-accent" />
                  <span className="text-xs">Rider / Courier</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    role === 'customer'
                      ? 'border-blue-700 bg-blue-50 text-blue-700 font-bold shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs">Customer / Recipient</span>
                </button>
              </div>
            </div>

            <Input
              label="Full Name *"
              type="text"
              placeholder="e.g. Dennis Mugisha"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="e.g. dennis@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Phone Number (Click-to-Call) *"
              type="tel"
              placeholder="+256 700 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <div className="p-3 rounded-xl bg-blue-50 text-[11px] text-blue-900">
              ℹ️ <strong>Security Notice:</strong> Admin dispatcher accounts cannot be created via self-service and are restricted to database seed credentials per §6.
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full font-bold text-xs py-3 mt-2 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Complete Registration & Start
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-muted border-t border-gray-100 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign In Here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
