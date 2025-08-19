import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';
import authService from './utils/auth';

// Import components
import SettingsPage from './components/SettingsPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import OwnerInsights from './components/OwnerInsights';
import MessagingSystem from './components/MessagingSystem';


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Navigation Component
const Navigation = ({ currentUser, onLogout }) => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = currentUser?.role === 'owner' || isAdmin;

  if (location.pathname.startsWith('/admin')) {
    return null; // No navigation for admin pages
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h2>🔧 HVAC Assistant</h2>
      </div>
      
      <div className="nav-links">
        <Link to="/portal" className={isActive('/portal')}>
          📊 Dashboard
        </Link>
        
        {isOwner && (
          <Link to="/owner-insights" className={isActive('/owner-insights')}>
            📈 Owner Insights
          </Link>
        )}
        
        <Link to="/settings" className={isActive('/settings')}>
          ⚙️ Settings
        </Link>
        
        {isAdmin && (
          <Link to="/admin" className={isActive('/admin')}>
            👑 Admin Portal
          </Link>
        )}
      </div>
      
      <div className="nav-user">
        <span className="user-info">
          {currentUser?.name || 'Mock Owner'} ({currentUser?.role || 'owner'})
        </span>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

// Main Dashboard Component
const MainDashboard = ({ companyId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [companyId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(`${BACKEND_URL}/api/dashboard/${companyId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!dashboardData) return <div className="error">No dashboard data available</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Business Dashboard</h1>
        <p>Real-time overview of your HVAC business operations</p>
      </header>

      {/* Quick Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card customers">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{dashboardData.stats.total_customers}</h3>
            <p>Total Customers</p>
          </div>
        </div>
        
        <div className="stat-card jobs">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <h3>{dashboardData.stats.pending_jobs}</h3>
            <p>Pending Jobs</p>
          </div>
        </div>
        
        <div className="stat-card technicians">
          <div className="stat-icon">👷</div>
          <div className="stat-content">
            <h3>{dashboardData.stats.active_technicians}</h3>
            <p>Active Technicians</p>
          </div>
        </div>
        
        <div className="stat-card appointments">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{dashboardData.stats.todays_appointments}</h3>
            <p>Today's Appointments</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Today's Appointments */}
        <div className="dashboard-section appointments-section">
          <h3>📅 Today's Appointments</h3>
          <div className="appointments-list">
            {dashboardData.todays_appointments.length === 0 ? (
              <p className="no-data">No appointments scheduled for today</p>
            ) : (
              dashboardData.todays_appointments.map((appointment) => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-time">
                    {new Date(appointment.scheduled_date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="appointment-details">
                    <h4>{appointment.title}</h4>
                    <p>{appointment.description}</p>
                    <span className={`status status-${appointment.status}`}>
                      {appointment.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="dashboard-section inquiries-section">
          <h3>💬 Recent SMS Inquiries</h3>
          <div className="inquiries-list">
            {dashboardData.recent_inquiries.length === 0 ? (
              <p className="no-data">No recent inquiries</p>
            ) : (
              dashboardData.recent_inquiries.map((inquiry) => (
                <div key={inquiry.id} className="inquiry-item">
                  <div className="inquiry-header">
                    <span className="customer-phone">{inquiry.customer_phone}</span>
                    <span className={`inquiry-status status-${inquiry.status}`}>
                      {inquiry.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="inquiry-message">
                    <p>"{inquiry.initial_message}"</p>
                  </div>
                  <div className="inquiry-footer">
                    <span className="inquiry-time">
                      {new Date(inquiry.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Urgent Jobs */}
        <div className="dashboard-section urgent-jobs-section">
          <h3>🚨 Urgent Jobs</h3>
          <div className="jobs-list">
            {dashboardData.urgent_jobs.length === 0 ? (
              <p className="no-data">No urgent jobs</p>
            ) : (
              dashboardData.urgent_jobs.map((job) => (
                <div key={job.id} className="job-item">
                  <div className="job-header">
                    <h4>{job.title}</h4>
                    <span className={`priority priority-${job.priority}`}>
                      {job.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="job-description">{job.description}</p>
                  <div className="job-footer">
                    <span className={`job-status status-${job.status}`}>
                      {job.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="job-time">
                      {new Date(job.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="dashboard-actions">
        <button className="action-btn primary" onClick={fetchDashboardData}>
          🔄 Refresh Data
        </button>
        <button className="action-btn secondary">
          📊 View Reports
        </button>
        <button className="action-btn secondary">
          👥 Manage Customers
        </button>
        <button className="action-btn secondary">
          🔧 Manage Jobs
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock authentication for development
    const mockUser = {
      sub: 'mock-owner-001',
      email: 'owner@hvactech.com',
      name: 'John Smith',
      role: 'owner',
      company_id: 'company-001'
    };
    
    setCurrentUser(mockUser);
    setIsAuthenticated(true);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading HVAC Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Admin Login Route */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Admin Dashboard Route */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Protected Routes with Navigation */}
          <Route path="/*" element={
            <>
              <Navigation currentUser={currentUser} onLogout={handleLogout} />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/portal" replace />} />
                  
                  <Route path="/portal" element={
                    <MainDashboard companyId={currentUser?.company_id || 'company-001'} />
                  } />
                  
                  <Route path="/owner-insights" element={
                    <OwnerInsights companyId={currentUser?.company_id || 'company-001'} />
                  } />
                  
                  <Route path="/settings" element={
                    <SettingsPage companyId={currentUser?.company_id || 'company-001'} />
                  } />
                  
                  <Route path="/jobs/:jobId/messages" element={
                    <MessagingSystem currentUser={currentUser} />
                  } />
                  
                  <Route path="*" element={<Navigate to="/portal" replace />} />
                </Routes>
              </main>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;