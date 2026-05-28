import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, Leaf, Info, Package, AlertTriangle, Cloud,
  Tractor, Store, LogOut, User, MessageSquare, BookOpen, Microscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const farmerNavLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: Leaf },
  { path: '/weather', label: 'Weather', icon: Cloud },
  { path: '/farmer/chatbot', label: 'AI Chatbot', icon: MessageSquare },
  { path: '/farmer/crop-diagnosis', label: 'Crop Diagnosis', icon: Microscope },
  { path: '/farmer/yojna', label: 'Govt Schemes', icon: BookOpen },
  { path: '/farmer/retailers', label: 'Nearby Retailers', icon: Store },
];

const retailerNavLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: Leaf },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
];

const publicNavLinks = [
  { path: '/', label: 'Home', icon: Leaf },
  { path: '/about', label: 'About', icon: Info },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = isAuthenticated
    ? user?.role === 'farmer' ? farmerNavLinks : retailerNavLinks
    : publicNavLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const renderLink = (link: any, onClick?: () => void) => {
    const Icon = link.icon;
    const active = location.pathname === link.path;
    return (
      <Link
        key={link.path}
        to={link.path}
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{link.label}</span>
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-bold hidden sm:block text-foreground">Smart Agri</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {navLinks.map(link => renderLink(link))}
          </div>

          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm">
                  {user?.role === 'farmer'
                    ? <Tractor className="h-3.5 w-3.5 text-primary" />
                    : <Store className="h-3.5 w-3.5 text-primary" />}
                  <span className="font-medium text-foreground">{user?.name?.split(' ')[0]}</span>
                  <span className="text-xs text-muted-foreground capitalize">({user?.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">Sign In / Register</Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-3 space-y-1 border-t border-border">
            {navLinks.map(link => renderLink(link, () => setIsOpen(false)))}
            <div className="pt-2 border-t border-border mt-2">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {user?.name} · <span className="capitalize">{user?.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Sign In / Register</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};