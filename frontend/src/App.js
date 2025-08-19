import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Wrench, 
  MessageSquare, 
  Settings as SettingsIcon, 
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

// Legacy components with NEW_UI flag support
import Settings from './components/Settings';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Feature Flag for NEW_UI
const NEW_UI = true;

// Navigation items
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Technicians', href: '/technicians', icon: Wrench },
  { name: 'Messaging', href: '/messaging', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

// Sidebar Component
const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">HVAC Pro</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs font-medium">JS</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Smith</p>
                <p className="text-xs text-muted-foreground truncate">Owner</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Top Bar Component
const TopBar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-4 h-4" />
        </Button>
        
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers, jobs..."
            className="pl-10 w-80"
          />
        </div>
      </div>
      
      {/* Right side */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <SettingsIcon className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

// Main Layout Component
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
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
          <Route path="/customers" element={<Customers currentUser={currentUser} />} />
          <Route path="/appointments" element={<Appointments currentUser={currentUser} />} />
          <Route path="/technicians" element={<Technicians currentUser={currentUser} />} />
          <Route path="/messaging" element={<Messaging currentUser={currentUser} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;