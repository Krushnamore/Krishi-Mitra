import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { Leaf, Tractor, Store, Eye, EyeOff, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

type Mode = 'login' | 'register' | 'forgot' | 'reset';
type Role = 'farmer' | 'retailer';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('farmer');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    farmSize: '', cropTypes: '', shopName: '', shopAddress: '',
  });

  const [resetForm, setResetForm] = useState({
    otp: '', newPassword: '', confirmPassword: '',
  });

  const set = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const setR = (field: string, value: string) =>
    setResetForm(f => ({ ...f, [field]: value }));

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  // Login / Register submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/dashboard');
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          role,
          phone: form.phone,
          farmSize: role === 'farmer' ? form.farmSize : undefined,
          cropTypes: role === 'farmer'
            ? form.cropTypes.split(',').map(s => s.trim()).filter(Boolean)
            : undefined,
          shopName: role === 'retailer' ? form.shopName : undefined,
          shopAddress: role === 'retailer' ? form.shopAddress : undefined,
        });
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  // Step 1 — send OTP
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast({
        title: 'OTP Sent',
        description: data.otp
          ? `Dev mode — your OTP is: ${data.otp}`
          : 'Check your email for the OTP.',
      });
      setMode('reset');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  // Step 2 — verify OTP + set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          otp: resetForm.otp,
          newPassword: resetForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast({ title: 'Success', description: 'Password reset! Please login.' });
      setMode('login');
      setResetForm({ otp: '', newPassword: '', confirmPassword: '' });
      setResetEmail('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-secondary px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-hero p-8 text-primary-foreground text-center">
              <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-3">
                {mode === 'forgot' || mode === 'reset'
                  ? <KeyRound className="h-8 w-8" />
                  : <Leaf className="h-8 w-8" />
                }
              </div>
              <h1 className="text-2xl font-bold">Krishi Mitra</h1>
              <p className="text-primary-foreground/80 text-sm mt-1">
                {mode === 'forgot' && 'Forgot Password'}
                {mode === 'reset' && 'Reset Password'}
                {(mode === 'login' || mode === 'register') && 'AI-Powered Agricultural Platform'}
              </p>
            </div>

            <div className="p-8">

              {/* ── FORGOT PASSWORD — Step 1 ── */}
              {mode === 'forgot' && (
                <>
                  <button
                    onClick={() => setMode('login')}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </button>
                  <p className="text-sm text-muted-foreground mb-5">
                    Enter your registered email address. We'll generate a reset OTP for you.
                  </p>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={inputClass}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Send Reset OTP
                    </Button>
                  </form>
                </>
              )}

              {/* ── RESET PASSWORD — Step 2 ── */}
              {mode === 'reset' && (
                <>
                  <button
                    onClick={() => setMode('forgot')}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-5">
                    <p className="text-sm text-primary font-medium">OTP sent to: {resetEmail}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the 6-digit OTP and your new password below.
                    </p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">6-Digit OTP</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={resetForm.otp}
                        onChange={e => setR('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter OTP"
                        className={`${inputClass} text-center text-lg tracking-widest font-mono`}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={resetForm.newPassword}
                          onChange={e => setR('newPassword', e.target.value)}
                          placeholder="Min 6 characters"
                          className={`${inputClass} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(v => !v)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Confirm Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={resetForm.confirmPassword}
                        onChange={e => setR('confirmPassword', e.target.value)}
                        placeholder="Repeat new password"
                        className={inputClass}
                      />
                      {resetForm.confirmPassword && resetForm.newPassword !== resetForm.confirmPassword && (
                        <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || resetForm.newPassword !== resetForm.confirmPassword}
                      size="lg"
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Reset Password
                    </Button>
                  </form>
                  <button
                    onClick={() => { setMode('forgot'); setResetForm({ otp: '', newPassword: '', confirmPassword: '' }); }}
                    className="w-full text-center text-sm text-muted-foreground hover:text-primary mt-3 transition-colors"
                  >
                    Didn't receive OTP? Send again
                  </button>
                </>
              )}

              {/* ── LOGIN / REGISTER ── */}
              {(mode === 'login' || mode === 'register') && (
                <>
                  {/* Mode Toggle */}
                  <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-xl">
                    {(['login', 'register'] as Mode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          mode === m
                            ? 'bg-card shadow text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {m === 'login' ? 'Sign In' : 'Register'}
                      </button>
                    ))}
                  </div>

                  {/* Role Selector */}
                  {mode === 'register' && (
                    <div className="mb-5">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">I am a...</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['farmer', 'retailer'] as Role[]).map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                              role === r
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            {r === 'farmer' ? <Tractor className="h-6 w-6" /> : <Store className="h-6 w-6" />}
                            <span className="text-sm font-semibold capitalize">{r}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1">Full Name *</label>
                        <input
                          type="text" required value={form.name}
                          onChange={e => set('name', e.target.value)}
                          placeholder="Your full name" className={inputClass}
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Email *</label>
                      <input
                        type="email" required value={form.email}
                        onChange={e => set('email', e.target.value)}
                        placeholder="you@example.com" className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required minLength={6} value={form.password}
                          onChange={e => set('password', e.target.value)}
                          placeholder="Min 6 characters"
                          className={`${inputClass} pr-10`}
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {mode === 'register' && (
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1">Mobile Number *</label>
                        <div className="flex gap-2">
                          <span className="flex items-center px-3 py-2 rounded-lg border border-border bg-secondary text-sm text-muted-foreground">
                            +91
                          </span>
                          <input
                            type="tel" required value={form.phone}
                            onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit mobile number"
                            maxLength={10} pattern="[0-9]{10}"
                            className={`${inputClass} flex-1`}
                          />
                        </div>
                      </div>
                    )}

                    {mode === 'register' && role === 'farmer' && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1">Farm Size (optional)</label>
                          <input type="text" value={form.farmSize}
                            onChange={e => set('farmSize', e.target.value)}
                            placeholder="e.g. 5 acres" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1">Crop Types (comma separated)</label>
                          <input type="text" value={form.cropTypes}
                            onChange={e => set('cropTypes', e.target.value)}
                            placeholder="e.g. wheat, rice, cotton" className={inputClass} />
                        </div>
                      </>
                    )}

                    {mode === 'register' && role === 'retailer' && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1">Shop Name *</label>
                          <input type="text" required value={form.shopName}
                            onChange={e => set('shopName', e.target.value)}
                            placeholder="e.g. Suresh Agro Supplies" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1">Shop Address (optional)</label>
                          <input type="text" value={form.shopAddress}
                            onChange={e => set('shopAddress', e.target.value)}
                            placeholder="Full address with city" className={inputClass} />
                        </div>
                      </>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {mode === 'login' ? 'Sign In' : `Register as ${role === 'farmer' ? 'Farmer' : 'Retailer'}`}
                    </Button>
                  </form>

                  {/* Forgot Password Link */}
                  {mode === 'login' && (
                    <div className="text-center mt-3">
                      <button
                        onClick={() => setMode('forgot')}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <p className="text-center text-sm text-muted-foreground mt-3">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      className="text-primary hover:underline font-medium"
                    >
                      {mode === 'login' ? 'Register' : 'Sign In'}
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
