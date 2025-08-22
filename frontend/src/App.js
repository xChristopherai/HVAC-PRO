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
// New UI Components (to be created)
import Customers from './components/Customers';
import Appointments from './components/Appointments';
import Technicians from './components/Technicians';
import Messaging from './components/Messaging';
import Calls from './components/Calls';
import QAGates from './components/QAGates';
import Reports from './components/Reports';

// Legacy components with NEW_UI flag support
import Settings from './components/Settings';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Feature Flag for NEW_UI
const NEW_UI = true;

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
const TopNavigation = ({ sidebarOpen, setSidebarOpen }) => {
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
    maxWidth: '1400px',
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
        <div className="top-nav-logo">
          <div className="logo-icon">
            <span className="logo-text">H</span>
          </div>
          <span className="logo-brand">HVAC Pro</span>
        </div>

        {/* Center - Navigation items (desktop) */}
        <nav className="top-nav-items" style={navItemsStyle}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           (item.href === '/dashboard' && location.pathname === '/');
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "nav-item",
                  isActive && "nav-item-active"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="nav-item-icon" />
                <span className="nav-item-label">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side - Search, notifications, user menu */}
        <div className="top-nav-actions">
          {!isMobile && (
            <>
              <div className="search-container">
                <Search className="search-icon" />
                <Input 
                  placeholder="Search..." 
                  className="search-input"
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="notification-btn"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </Button>
              
              <div className="user-menu">
                <Button 
                  variant="ghost" 
                  className="user-menu-btn"
                  aria-label="User menu"
                >
                  <div className="user-avatar">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="user-name">John Smith</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {/* Mobile hamburger button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
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
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="mobile-nav-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Drawer */}
      <div className={cn("mobile-nav-drawer", isOpen && "mobile-nav-drawer-open")}>
        <div className="mobile-nav-header">
          <div className="mobile-nav-logo">
            <div className="logo-icon">
              <span className="logo-text">H</span>
            </div>
            <span className="logo-brand">HVAC Pro</span>
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
        
        <nav className="mobile-nav-items">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           (item.href === '/dashboard' && location.pathname === '/');
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "mobile-nav-item",
                  isActive && "mobile-nav-item-active"
                )}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="mobile-nav-icon" />
                <span className="mobile-nav-label">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

// Authentication hook
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authResult = await authService.login('owner', 'company-001');
        if (authResult.success) {
          setUser(authResult.user);
        }
      } catch (err) {
        console.error('Authentication failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return { user, loading };
};

// Main Layout Component - NEW HORIZONTAL LAYOUT
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="app-layout">
      <TopNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <MobileNavDrawer isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="main-content-area">
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

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-primary rounded-lg animate-pulse mx-auto flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading HVAC Pro...</p>
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-12 h-12 bg-destructive/10 rounded-lg mx-auto flex items-center justify-center">
            <X className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">{error}</p>
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