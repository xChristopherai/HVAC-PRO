import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingCompany, setExportingCompany] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchAnalytics();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`${BACKEND_URL}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else if (response.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Failed to fetch admin analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCompanyData = async (companyId, companyName) => {
    try {
      setExportingCompany(companyId);
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`${BACKEND_URL}/api/admin/export/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${companyName.toLowerCase().replace(/\s+/g, '-')}-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`Data exported successfully for ${companyName}`);
      } else {
        throw new Error('Export failed');
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export company data');
    } finally {
      setExportingCompany(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const handleBackToApp = () => {
    navigate('/portal');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h3>⚠️ Error Loading Analytics</h3>
        <p>{error}</p>
        <button onClick={fetchAnalytics} className="action-btn primary">
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>👑 HVAC Assistant - Admin Portal</h1>
            <p>Multi-tenant system administration and analytics</p>
          </div>
          <div className="header-actions">
            <button onClick={handleBackToApp} className="action-btn secondary">
              🏠 Main App
            </button>
            <button onClick={fetchAnalytics} className="action-btn secondary">
              🔄 Refresh
            </button>
            <button onClick={handleLogout} className="action-btn primary">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <div className="admin-content">
        {/* System Overview */}
        <div className="overview-section">
          <h2>📊 System Overview</h2>
          
          <div className="overview-grid">
            <div className="overview-card companies">
              <div className="card-icon">🏢</div>
              <div className="card-content">
                <h3>{analytics.overview.total_companies}</h3>
                <p>Total Companies</p>
                <span className="card-detail">
                  {analytics.overview.active_companies} active
                </span>
              </div>
            </div>

            <div className="overview-card appointments">
              <div className="card-icon">📅</div>
              <div className="card-content">
                <h3>{analytics.overview.monthly_appointments}</h3>
                <p>Monthly Appointments</p>
                <span className="card-detail">
                  This month
                </span>
              </div>
            </div>

            <div className="overview-card jobs">
              <div className="card-icon">🔧</div>
              <div className="card-content">
                <h3>{analytics.overview.monthly_jobs}</h3>
                <p>Monthly Jobs</p>
                <span className="card-detail">
                  This month
                </span>
              </div>
            </div>

            <div className="overview-card inquiries">
              <div className="card-icon">💬</div>
              <div className="card-content">
                <h3>{analytics.overview.monthly_inquiries}</h3>
                <p>Monthly Inquiries</p>
                <span className="card-detail">
                  SMS interactions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Management */}
        <div className="companies-section">
          <h2>🏢 Company Management</h2>
          
          <div className="companies-table">
            <div className="table-header">
              <div className="header-cell">Company</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Monthly Stats</div>
              <div className="header-cell">Revenue</div>
              <div className="header-cell">Last Activity</div>
              <div className="header-cell">Actions</div>
            </div>

            <div className="table-body">
              {analytics.companies.map((company) => (
                <div key={company.id} className="table-row">
                  <div className="cell company-info">
                    <div className="company-name">{company.name}</div>
                    <div className="company-id">{company.id}</div>
                  </div>
                  
                  <div className="cell">
                    <span className={`status-badge ${company.status}`}>
                      {company.status}
                    </span>
                  </div>
                  
                  <div className="cell stats">
                    <div className="stat-item">
                      📅 {company.appointments} appointments
                    </div>
                  </div>
                  
                  <div className="cell revenue">
                    ${company.revenue.toFixed(2)}
                  </div>
                  
                  <div className="cell activity">
                    {new Date(company.last_activity).toLocaleDateString()}
                  </div>
                  
                  <div className="cell actions">
                    <button
                      onClick={() => exportCompanyData(company.id, company.name)}
                      disabled={exportingCompany === company.id}
                      className="export-btn"
                    >
                      {exportingCompany === company.id ? (
                        <>
                          <span className="mini-spinner"></span>
                          Exporting...
                        </>
                      ) : (
                        <>📤 Export</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="health-section">
          <h2>🔧 System Health</h2>
          
          <div className="health-grid">
            <div className="health-item">
              <div className="health-icon">🗄️</div>
              <div className="health-content">
                <h4>Database</h4>
                <span className="health-status healthy">✅ Operational</span>
              </div>
            </div>

            <div className="health-item">
              <div className="health-icon">📱</div>
              <div className="health-content">
                <h4>SMS Service</h4>
                <span className="health-status mock">🔧 Mock Mode</span>
              </div>
            </div>

            <div className="health-item">
              <div className="health-icon">📅</div>
              <div className="health-content">
                <h4>Calendar Service</h4>
                <span className="health-status mock">🔧 Mock Mode</span>
              </div>
            </div>

            <div className="health-item">
              <div className="health-icon">🤖</div>
              <div className="health-content">
                <h4>AI Service</h4>
                <span className="health-status healthy">✅ Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-section">
          <h2>⚡ Quick Actions</h2>
          
          <div className="actions-grid">
            <button className="action-card">
              <div className="action-icon">📊</div>
              <h4>Generate Report</h4>
              <p>Create system-wide analytics report</p>
            </button>

            <button className="action-card">
              <div className="action-icon">🔧</div>
              <h4>System Maintenance</h4>
              <p>Perform maintenance tasks</p>
            </button>

            <button className="action-card">
              <div className="action-icon">👥</div>
              <h4>Manage Users</h4>
              <p>Add or modify user accounts</p>
            </button>

            <button className="action-card">
              <div className="action-icon">⚙️</div>
              <h4>System Settings</h4>
              <p>Configure global settings</p>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .admin-header {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          color: white;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header-left h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .header-left p {
          opacity: 0.9;
          font-size: 1.125rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .admin-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          space-y: 3rem;
        }

        .admin-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .overview-card {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: all 0.2s ease;
        }

        .overview-card:hover {
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          transform: translateY(-2px);
        }

        .card-icon {
          font-size: 2.5rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          width: 60px;
          height: 60px;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-content h3 {
          font-size: 2rem;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .card-content p {
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .card-detail {
          color: #9ca3af;
          font-size: 0.875rem;
        }

        .companies-table {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border: 1px solid #e5e7eb;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 1fr;
          gap: 1rem;
          background: #f9fafb;
          padding: 1rem 1.5rem;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-body {
          divide-y: 1px solid #e5e7eb;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1.5rem;
          align-items: center;
          transition: background-color 0.2s ease;
        }

        .table-row:hover {
          background-color: #f9fafb;
        }

        .cell {
          font-size: 0.875rem;
        }

        .company-info .company-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .company-info .company-id {
          color: #6b7280;
          font-size: 0.75rem;
          font-family: monospace;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-badge.active { background: #d1fae5; color: #065f46; }
        .status-badge.trial { background: #fef3c7; color: #92400e; }
        .status-badge.expired { background: #fee2e2; color: #991b1b; }

        .stat-item {
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .revenue {
          font-weight: 600;
          color: #059669;
        }

        .activity {
          color: #6b7280;
        }

        .export-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .export-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .export-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .mini-spinner {
          width: 12px;
          height: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-top: 1px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .health-item {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .health-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          background: #f3f4f6;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .health-content h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .health-status {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
        }

        .health-status.healthy {
          background: #d1fae5;
          color: #065f46;
        }

        .health-status.mock {
          background: #fef3c7;
          color: #92400e;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .action-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          transform: translateY(-2px);
        }

        .action-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .action-card h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .action-card p {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .action-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }

        .action-btn.primary:hover {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
        }

        .action-btn.secondary {
          background: white;
          color: #3b82f6;
          border: 2px solid #3b82f6;
        }

        .action-btn.secondary:hover {
          background: #3b82f6;
          color: white;
        }

        .admin-loading, .admin-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .admin-error h3 {
          color: #dc2626;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .header-actions {
            flex-wrap: wrap;
          }

          .table-header, .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .header-cell, .cell {
            padding: 0.5rem 0;
          }
        }

        @media (max-width: 768px) {
          .admin-content {
            padding: 1rem;
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }

          .health-grid {
            grid-template-columns: 1fr;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;