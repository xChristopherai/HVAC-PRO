import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Wrench, 
  MessageSquare, 
  Settings as SettingsIcon, 
  Phone,
  Shield,
  BarChart3,
  Search,
  Bell,
  Menu,
  X,
  User,
  ChevronDown
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { cn } from './lib/utils';
import authService from './utils/auth';

// Import components
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Appointments from './components/Appointments';
import Technicians from './components/Technicians';
import Messaging from './components/Messaging';
import Calls from './components/Calls';
import QAGates from './components/QAGates';
import Reports from './components/Reports';
import Settings from './components/Settings';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// AI Voice Scheduling Feature Flag
const AI_VOICE_SCHEDULING_ENABLED = process.env.REACT_APP_AI_VOICE_SCHEDULING_ENABLED === 'true';

// Navigation items
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Technicians', href: '/technicians', icon: Wrench },
  { name: 'Messaging', href: '/messaging', icon: MessageSquare },
  { name: 'Calls', href: '/calls', icon: Phone },
  { name: 'QA Gates', href: '/qa-gates', icon: Shield },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

// Hook for responsive behavior
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);
  
  return { isMobile };
};

// Top Navigation Component - Stripe Style
const TopNavigation = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const location = useLocation();
  const { isMobile } = useResponsive();
  
  const headerStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    height: '64px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    width: '100%'
  };
  
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 1.5rem'
  };
  
  const navItemsStyle = {
    display: isMobile ? 'none' : 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flex: 1,
    justifyContent: 'center',
    maxWidth: '800px'
  };
  
  return (
    <header className="top-nav" style={headerStyle}>
      <div className="top-nav-container" style={containerStyle}>
        {/* Left side - Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">HVAC Pro</span>
        </div>

        {/* Center - Navigation items (desktop only) */}
        <nav style={navItemsStyle}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           (item.href === '/dashboard' && location.pathname === '/');
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors relative",
                  isActive && "text-blue-600 font-semibold"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side - Search, notifications, user menu */}
        <div className="flex items-center gap-3">
          {!isMobile && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-9 w-64 bg-white border-gray-200"
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-600 hover:text-gray-900"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900"
                aria-label="User menu"
              >
                <div className="w-7 h-7 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">John Smith</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Mobile hamburger button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

// Mobile Navigation Drawer
const MobileNavDrawer = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  
  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, setIsOpen]);
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">HVAC Pro</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           (item.href === '/dashboard' && location.pathname === '/');
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors",
                  isActive && "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                )}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

// Main Layout Component - CLEAN NO SIDEBAR
const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <MobileNavDrawer isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />
      
      {/* Main Content - Full Width, No Sidebar Space */}
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      if (!authService.isAuthenticated()) {
        await authService.login('owner', 'company-001');
      }
      
      const mockUser = {
        sub: 'mock-owner-001',
        email: 'owner@hvactech.com',
        name: 'John Smith',
        role: 'owner',
        company_id: 'company-001'
      };
      
      setCurrentUser(mockUser);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Authentication failed:', err);
      setError('Authentication failed. Using offline mode.');
      setIsAuthenticated(true);
      setCurrentUser({
        sub: 'mock-owner-001',
        email: 'owner@hvactech.com',
        name: 'John Smith (Offline)',
        role: 'owner',
        company_id: 'company-001'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg animate-pulse mx-auto flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <p className="text-gray-600">Loading HVAC Pro...</p>
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-12 h-12 bg-red-50 rounded-lg mx-auto flex items-center justify-center">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} />} />
          <Route path="/customers" element={<Customers currentUser={currentUser} aiVoiceEnabled={AI_VOICE_SCHEDULING_ENABLED} />} />
          <Route path="/appointments" element={<Appointments currentUser={currentUser} aiVoiceEnabled={AI_VOICE_SCHEDULING_ENABLED} />} />
          <Route path="/technicians" element={<Technicians currentUser={currentUser} />} />
          <Route path="/messaging" element={<Messaging currentUser={currentUser} />} />
          <Route path="/calls" element={<Calls currentUser={currentUser} />} />
          <Route path="/qa-gates" element={<QAGates currentUser={currentUser} />} />
          <Route path="/reports" element={<Reports currentUser={currentUser} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;