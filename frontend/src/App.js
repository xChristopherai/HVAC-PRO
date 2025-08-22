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
  Search,
  Bell,
  Menu,
  X
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
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

// Sidebar Component - PayPal style
const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  
  return (
    <div className={cn(
      "sidebar fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#0070E0] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-lg font-semibold text-[#0B0F19]">HVAC Pro</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           (item.href === '/dashboard' && location.pathname === '/');
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "sidebar-item",
                  isActive && "active"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-[18px] h-[18px] mr-3" />
                <span className="text-base font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-6 border-t border-[#E5E7EB]">
          <div className="text-sm text-[#475569]">
            Signed in as <span className="font-medium text-[#0B0F19]">John Smith</span>
          </div>
        </div>
      </div>
    </div>
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

// Main Layout Component - FIXED LAYOUT
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="main-layout">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="main-content">
        {/* Top Bar - Mobile only */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 lg:hidden">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <span className="text-lg font-semibold text-[#0B0F19]">HVAC Pro</span>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="content-wrapper">
          {children}
        </main>
      </div>
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
          <Route path="/settings" element={<Settings currentUser={currentUser} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;