import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { Leaf, Tractor, Store, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Mode = 'login' | 'register';
type Role = 'farmer' | 'retailer';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('farmer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    farmSize: '', cropTypes: '', shopName: '', shopAddress: '',
  });

  const set = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
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
      }
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-secondary px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-hero p-8 text-primary-foreground text-center">
              <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-3">
                <Leaf className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold">Krishi Mitra</h1>
              <p className="text-primary-foreground/80 text-sm mt-1">AI-Powered Agricultural Platform</p>
            </div>

            <div className="p-8">
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

              {/* Role Selector — register only */}
              {mode === 'register' && (
                <div className="mb-5">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('farmer')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        role === 'farmer'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <Tractor className="h-6 w-6" />
                      <span className="text-sm font-semibold">Farmer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('retailer')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        role === 'retailer'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <Store className="h-6 w-6" />
                      <span className="text-sm font-semibold">Retailer</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name — register only */}
                {mode === 'register' && (
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="Min 6 characters"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Phone — register only, both roles */}
                {mode === 'register' && (
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Mobile Number *
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 py-2 rounded-lg border border-border bg-secondary text-sm text-muted-foreground">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        className={`${inputClass} flex-1`}
                      />
                    </div>
                  </div>
                )}

                {/* Farmer extra fields */}
                {mode === 'register' && role === 'farmer' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Farm Size (optional)</label>
                      <input
                        type="text"
                        value={form.farmSize}
                        onChange={e => set('farmSize', e.target.value)}
                        placeholder="e.g. 5 acres"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">
                        Crop Types (optional, comma separated)
                      </label>
                      <input
                        type="text"
                        value={form.cropTypes}
                        onChange={e => set('cropTypes', e.target.value)}
                        placeholder="e.g. wheat, rice, cotton"
                        className={inputClass}
                      />
                    </div>
                  </>
                )}

                {/* Retailer extra fields */}
                {mode === 'register' && role === 'retailer' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Shop Name *</label>
                      <input
                        type="text"
                        required
                        value={form.shopName}
                        onChange={e => set('shopName', e.target.value)}
                        placeholder="e.g. Suresh Agro Supplies"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Shop Address (optional)</label>
                      <input
                        type="text"
                        value={form.shopAddress}
                        onChange={e => set('shopAddress', e.target.value)}
                        placeholder="Full address with city"
                        className={inputClass}
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {mode === 'login'
                    ? 'Sign In'
                    : `Register as ${role === 'farmer' ? 'Farmer' : 'Retailer'}`}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-primary hover:underline font-medium"
                >
                  {mode === 'login' ? 'Register' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;