import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowRight, BarChart3, Package, AlertTriangle, TrendingUp,
  Leaf, Cpu, Users, Tractor, Store
} from 'lucide-react';
import heroImage from '@/assets/hero-agriculture.jpg';

const Index = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    { icon: Package, title: 'Smart Inventory Tracking', description: 'Real-time stock monitoring with easy data entry for agricultural inputs.' },
    { icon: BarChart3, title: 'AI Demand Forecasting', description: 'AI-powered predictions for the next 5 days of product demand.' },
    { icon: AlertTriangle, title: 'Intelligent Alerts', description: 'Automatic low-stock and overstock warnings to optimize inventory levels.' },
    { icon: TrendingUp, title: 'Data-Driven Insights', description: 'Make informed decisions with AI-assisted analysis and recommendations.' },
  ];

  const stats = [
    { value: '85.5%', label: 'Forecast Accuracy' },
    { value: '40%', label: 'Stock-out Reduction' },
    { value: '25%', label: 'Waste Reduction' },
    { value: '5 Days', label: 'Forecast Window' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-foreground mb-6 animate-fade-in">
              <Leaf className="h-4 w-4" />
              <span className="text-sm font-medium">Industry 5.0 • AI-Powered Agriculture</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6 animate-slide-up">
              Krishi-Mitra-Input Inventory &{' '}
              <span className="text-primary">Demand Forecasting</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Eliminate stock-outs and overstocking with AI-powered demand prediction.
              Helping agricultural retailers optimize inventory for sustainable farming.
            </p>

            {/* Role Badges */}
            <div className="flex gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-primary-foreground text-sm">
                <Tractor className="h-4 w-4" /> For Farmers
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-primary-foreground text-sm">
                <Store className="h-4 w-4" /> For Retailers
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="hero" size="xl">
                    Go to Dashboard <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="hero" size="xl">
                    Get Started <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link to="/about">
                <Button variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-primary-foreground/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Our AI-powered system helps agricultural retailers make data-driven decisions for optimal inventory management.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">The Problem We Solve</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive h-fit"><AlertTriangle className="h-5 w-5" /></div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Stock-out Issues</h4>
                    <p className="text-muted-foreground">Retailers run out of essential inputs during peak farming seasons, leaving farmers without critical supplies.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="p-2 rounded-lg bg-warning/10 text-warning h-fit"><Package className="h-5 w-5" /></div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Overstocking Waste</h4>
                    <p className="text-muted-foreground">Excess inventory leads to product expiration, financial losses, and environmental impact.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <Cpu className="h-8 w-8 text-primary mb-4" />
                <h4 className="font-semibold text-foreground mb-2">AI Based</h4>
                <p className="text-sm text-muted-foreground">Advanced machine learning for accurate demand prediction</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h4 className="font-semibold text-foreground mb-2">Industry 5.0</h4>
                <p className="text-sm text-muted-foreground">AI-assisted human decision making for agriculture</p>
              </div>
              <div className="col-span-2 p-6 rounded-2xl bg-primary text-primary-foreground">
                <Leaf className="h-8 w-8 mb-4" />
                <h4 className="font-semibold mb-2">Sustainable Agriculture</h4>
                <p className="text-sm opacity-90">Reduce waste, optimize resources, and support farmers with intelligent inventory optimization.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to Optimize Your Inventory?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join the future of agricultural supply chain management with AI-powered demand forecasting and inventory optimization.
          </p>
          <Link to="/login">
            <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              Sign-in / Login <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
