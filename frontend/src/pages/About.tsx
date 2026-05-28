import { Layout } from '@/components/Layout';
import { 
  Target, 
  Lightbulb, 
  TrendingUp, 
  Package,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const About = () => {
  const problemPoints = [
    {
      icon: AlertTriangle,
      title: 'Stock-out Crisis',
      description: 'Retailers frequently run out of essential agricultural inputs during peak seasons, disrupting farming operations and causing crop losses.',
    },
    {
      icon: Package,
      title: 'Overstock Waste',
      description: 'Excess inventory leads to product expiration, capital lock-in, and environmental concerns due to improper disposal.',
    },
    {
      icon: BarChart3,
      title: 'Guesswork Ordering',
      description: 'Without data-driven insights, retailers rely on intuition, leading to inefficient inventory management and lost opportunities.',
    },
  ];

  const solutionSteps = [
    {
      step: '1',
      title: 'Data Collection',
      description: 'Retailers enter current stock levels through an intuitive dashboard interface.',
    },
    {
      step: '2',
      title: 'AI Analysis',
      description: 'Python model analyzes historical data, seasonal patterns, and market trends.',
    },
    {
      step: '3',
      title: 'Demand Prediction',
      description: 'System generates accurate 5-day demand forecasts for each product.',
    },
    {
      step: '4',
      title: 'Weather Forecast ',
      description: 'Weather data is incorporated to refine demand predictions based on upcoming conditions.',
    },
    {
      step: '5',
      title: 'Smart Alerts',
     description: 'Automatic alerts notify retailers about low-stock or overstock situations.',
    },
  ];

  const benefits = [
    'Reduce stock-outs by up to 40%',
    'Minimize inventory waste by 25%',
    'Improve cash flow management',
    'Support sustainable farming practices',
    'Enable data-driven decision making',
    'Save time on manual forecasting',
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              About the System
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Understanding how AI-powered demand forecasting transforms 
              agricultural inventory management.
            </p>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                About Agri Insights Hub
              </h2>
              <p className="text-muted-foreground">
                Empowering agricultural retailers with cutting-edge AI technology for smarter inventory management.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Our Mission</h3>
                <p className="text-muted-foreground mb-6">
                  To revolutionize agricultural supply chains by providing retailers with accurate demand forecasting 
                  and intelligent inventory management solutions, ensuring sustainable farming practices and optimal resource utilization.
                </p>
                <h3 className="text-xl font-semibold text-foreground mb-4">Our Vision</h3>
                <p className="text-muted-foreground">
                  A world where every agricultural retailer can make data-driven decisions, reducing waste, 
                  preventing stock-outs, and contributing to a more sustainable and efficient food production system.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">What We Do</h3>
                <p className="text-muted-foreground mb-6">
                  Agri Insights Hub leverages advanced machine learning algorithms to analyze historical sales data, 
                  seasonal patterns, and market trends. Our AI-powered platform provides 5-day demand forecasts, 
                  automated alerts, and actionable insights to help retailers optimize their inventory levels.
                </p>
                <h3 className="text-xl font-semibold text-foreground mb-4">Our Technology</h3>
                <p className="text-muted-foreground">
                  Built on Python machine learning models with 85.5% forecast accuracy, our system integrates 
                  seamlessly with existing retail operations, providing real-time insights through an intuitive web dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive mb-4">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Problem Statement</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              The Challenge We Address
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Agricultural input retailers face significant challenges in inventory management, 
              impacting farmers, businesses, and the environment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {problemPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div 
                  key={index}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-destructive/30 transition-colors"
                >
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive w-fit mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{point.title}</h3>
                  <p className="text-muted-foreground">{point.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-medium">Our Solution</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              How the System Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A step-by-step flow showing how retailers benefit from AI-assisted inventory management.
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-12 right-12 h-1 bg-primary/20 rounded-full" />
              
              <div className="grid md:grid-cols-5 gap-4">
                {solutionSteps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg z-10 mb-4">
                        {step.step}
                      </div>
                      <h4 className="font-semibold text-foreground mb-2">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {index < solutionSteps.length - 1 && (
                      <ArrowRight className="hidden md:block absolute top-3 -right-2 h-5 w-5 text-primary z-10" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This System */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success mb-4">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Why It Matters</span>
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-6">
                Why This System is Needed
              </h2>
              <p className="text-muted-foreground mb-8">
                In the era of Industry 5.0, AI-assisted decision making is transforming 
                how agricultural supply chains operate. Our system bridges the gap between 
                traditional inventory management and modern predictive analytics.
              </p>
              
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-primary text-primary-foreground">
                <div className="text-4xl font-display font-bold mb-2">85.5%</div>
                <p className="text-sm opacity-90">Forecast Accuracy</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="text-4xl font-display font-bold text-primary mb-2">5</div>
                <p className="text-sm text-muted-foreground">Day Forecast Window</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="text-4xl font-display font-bold text-primary mb-2">40%</div>
                <p className="text-sm text-muted-foreground">Stock-out Reductio</p>
              </div>
              <div className="p-6 rounded-2xl bg-success text-success-foreground">
                <div className="text-4xl font-display font-bold mb-2">25%</div>
                <p className="text-sm opacity-90">Waste Reduction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
            Ready to See It in Action?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Explore the dashboard to see how demand forecasting and inventory alerts work in real-time.
          </p>
          <Link to="/dashboard">
            <Button variant="hero" size="lg">
              View Dashboard Demo
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default About;
