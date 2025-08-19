import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@hvactech.com');
  const [password, setPassword] = useState('HvacAdmin2024!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store admin token
        localStorage.setItem('admin_token', data.access_token);
        // Navigate to admin dashboard
        navigate('/admin');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToApp = () => {
    navigate('/portal');
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">👑</span>
            <h1>HVAC Assistant</h1>
            <p>Admin Portal</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              📧 Admin Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="admin@hvactech.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              🔒 Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter admin password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                🚀 Access Admin Portal
              </>
            )}
          </button>

          <div className="login-footer">
            <button 
              type="button" 
              onClick={handleBackToApp}
              className="back-btn"
            >
              ← Back to Main App
            </button>
          </div>
        </form>

        <div className="login-info">
          <div className="info-card">
            <h3>🔐 Admin Access</h3>
            <p>This portal provides access to multi-tenant company management, analytics, and system administration.</p>
            
            <div className="features-list">
              <div className="feature">✅ Company Management</div>
              <div className="feature">📊 Cross-Tenant Analytics</div>
              <div className="feature">📤 Data Export</div>
              <div className="feature">🔧 System Configuration</div>
            </div>
          </div>

          <div className="demo-credentials">
            <h4>Demo Credentials:</h4>
            <p><strong>Email:</strong> admin@hvactech.com</p>
            <p><strong>Password:</strong> HvacAdmin2024!</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-login {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-container {
          display: grid;
          grid-template-columns: 400px 350px;
          gap: 3rem;
          max-width: 900px;
          width: 100%;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
        }

        .logo-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .logo h1 {
          font-size: 2rem;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .logo p {
          color: #6b7280;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .login-form {
          background: white;
          padding: 2.5rem;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: #f9fafb;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          border: 1px solid #fecaca;
        }

        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.875rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-btn .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .back-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 0.875rem;
          transition: color 0.2s ease;
        }

        .back-btn:hover {
          color: #374151;
        }

        .login-footer {
          text-align: center;
        }

        .login-info {
          space-y: 2rem;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          padding: 2rem;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .info-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .info-card p {
          opacity: 0.9;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .features-list {
          space-y: 0.5rem;
        }

        .feature {
          font-size: 0.875rem;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .demo-credentials {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          padding: 1.5rem;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .demo-credentials h4 {
          font-weight: 600;
          margin-bottom: 0.75rem;
          opacity: 0.9;
        }

        .demo-credentials p {
          margin: 0.25rem 0;
          font-size: 0.875rem;
          opacity: 0.8;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .login-container {
            grid-template-columns: 1fr;
            gap: 2rem;
            max-width: 400px;
          }

          .login-form {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;