import { Leaf, Github, Mail, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const handleShare = async () => {
    if (navigator.share) {
      // ✅ Native share sheet (mobile + modern desktop)
      try {
        await navigator.share({
          title: 'Krishi Mitra — Smart Agri',
          text: 'AI-powered inventory management and demand forecasting for sustainable agriculture.',
          url: 'https://krishi-mitra-beryl.vercel.app',
        });
      } catch (err) {
        // User cancelled share — do nothing
      }
    } else {
      // ✅ Fallback for browsers that don't support Web Share API — copy to clipboard
      await navigator.clipboard.writeText('https://krishi-mitra-beryl.vercel.app');
      alert('Link copied to clipboard!');
    }
  };

  return (
    <footer className="bg-foreground text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-lg">Smart Agri</span>
            </div>
            <p className="text-sm opacity-80">
              AI-powered inventory management and demand forecasting for sustainable agriculture.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/dashboard" className="hover:opacity-100 transition-opacity">Dashboard</Link></li>
              <li><Link to="/" className="hover:opacity-100 transition-opacity">AI Suggestion</Link></li>
              <li><Link to="/about" className="hover:opacity-100 transition-opacity">Inventory Managment</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/impact" className="hover:opacity-100 transition-opacity">Weather</Link></li>
              <li><Link to="/future" className="hover:opacity-100 transition-opacity">Stocks Prediction</Link></li>
              <li><Link to="/login" className="hover:opacity-100 transition-opacity">Notification</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-3">
              {/* GitHub */}
              <a
                href="https://github.com/Krushnamore/Krishi-Mitra"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
                title="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>

              {/* Gmail */}
              <a
                href="mailto:more96899@gmail.com"
                className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
                title="Email us"
              >
                <Mail className="h-5 w-5" />
              </a>

              {/* Share button — opens native share sheet */}
              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors cursor-pointer"
                title="Share Krishi Mitra"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center text-sm opacity-60">
          <p>© 2026 Smart Agri-Input Inventory System. All rights reserved by Shela Gang. Built for PRPCERM Hackathon</p>
          <p className="mt-1">Powered by AI • Industry 5.0 • AI-Assisted Decision Making</p>
        </div>
      </div>
    </footer>
  );
};