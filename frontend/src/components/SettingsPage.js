import React, { useState, useEffect } from 'react';
import authService from '../utils/auth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SettingsPage = ({ companyId }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('business');
  const [testResults, setTestResults] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const sections = [
    { id: 'business', name: 'Business Information', icon: '🏢' },
    { id: 'ai', name: 'AI Assistant', icon: '🤖' },
    { id: 'sms', name: 'SMS Settings', icon: '📱' },
    { id: 'calendar', name: 'Calendar Integration', icon: '📅' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'billing', name: 'Billing & Payments', icon: '💳' },
    { id: 'services', name: 'Service Areas', icon: '🗺️' },
    { id: 'integrations', name: 'Integrations', icon: '🔗' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'advanced', name: 'Advanced Settings', icon: '⚙️' }
  ];

  useEffect(() => {
    fetchSettings();
  }, [companyId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/settings/${companyId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      alert('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setUnsavedChanges(true);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`${BACKEND_URL}/api/settings/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setUnsavedChanges(false);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const testSMSSettings = async () => {
    const phoneNumber = prompt('Enter phone number to test SMS:');
    if (!phoneNumber) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/settings/test-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResults(prev => ({ ...prev, sms: 'success' }));
        alert('Test SMS sent successfully!');
      } else {
        setTestResults(prev => ({ ...prev, sms: 'error' }));
        alert(`SMS test failed: ${result.error}`);
      }
    } catch (err) {
      setTestResults(prev => ({ ...prev, sms: 'error' }));
      alert('Failed to test SMS settings.');
    }
  };

  const testNotifications = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company_id: companyId }),
      });
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, notifications: 'success' }));
        alert('Test notification sent successfully!');
      } else {
        throw new Error('Test failed');
      }
    } catch (err) {
      setTestResults(prev => ({ ...prev, notifications: 'error' }));
      alert('Failed to test notifications.');
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="settings-error">
        <h3>⚠️ Unable to Load Settings</h3>
        <p>Failed to load settings. Please refresh the page.</p>
        <button onClick={fetchSettings} className="action-btn primary">
          🔄 Retry
        </button>
      </div>
    );
  }

  const renderBusinessSection = () => (
    <div className="settings-section">
      <h3>🏢 Business Information</h3>
      <p>Configure your business details and contact information</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Business Name</label>
          <input
            type="text"
            className="form-input"
            value={settings.business_name || ''}
            onChange={(e) => handleSettingChange('business', 'business_name', e.target.value)}
            placeholder="Elite HVAC Solutions"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Business Phone</label>
          <input
            type="tel"
            className="form-input"
            value={settings.business_phone || ''}
            onChange={(e) => handleSettingChange('business', 'business_phone', e.target.value)}
            placeholder="+1-555-HVAC-PRO"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Business Email</label>
          <input
            type="email"
            className="form-input"
            value={settings.business_email || ''}
            onChange={(e) => handleSettingChange('business', 'business_email', e.target.value)}
            placeholder="info@hvactech.com"
          />
        </div>
        
        <div className="form-group full-width">
          <label className="form-label">Business Address</label>
          <textarea
            className="form-textarea"
            value={settings.business_address?.full || ''}
            onChange={(e) => handleSettingChange('business', 'business_address', { full: e.target.value })}
            placeholder="123 Business St, City, State 12345"
            rows="3"
          />
        </div>
      </div>
      
      <div className="business-hours">
        <h4>Business Hours</h4>
        <div className="hours-grid">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
            <div key={day} className="hours-row">
              <label className="day-label">{day.charAt(0).toUpperCase() + day.slice(1)}</label>
              <input
                type="text"
                className="form-input"
                value={settings.business_hours?.[day] || ''}
                onChange={(e) => handleSettingChange('business', 'business_hours', {
                  ...settings.business_hours,
                  [day]: e.target.value
                })}
                placeholder="8:00 AM - 6:00 PM"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAISection = () => (
    <div className="settings-section">
      <h3>🤖 AI Assistant Configuration</h3>
      <p>Customize your AI assistant's behavior and responses</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Assistant Name</label>
          <input
            type="text"
            className="form-input"
            value={settings.ai_assistant_name || 'Sarah'}
            onChange={(e) => handleSettingChange('ai', 'ai_assistant_name', e.target.value)}
            placeholder="Sarah"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Response Temperature (0.0 - 1.0)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            className="form-range"
            value={settings.ai_temperature || 0.3}
            onChange={(e) => handleSettingChange('ai', 'ai_temperature', parseFloat(e.target.value))}
          />
          <span className="range-value">{settings.ai_temperature || 0.3}</span>
        </div>
        
        <div className="form-group">
          <label className="form-label">Max Response Tokens</label>
          <input
            type="number"
            className="form-input"
            value={settings.max_response_tokens || 120}
            onChange={(e) => handleSettingChange('ai', 'max_response_tokens', parseInt(e.target.value))}
            min="50"
            max="200"
            placeholder="120"
          />
        </div>
        
        <div className="form-group full-width">
          <label className="form-label">AI Greeting Message</label>
          <textarea
            className="form-textarea"
            value={settings.ai_greeting || ''}
            onChange={(e) => handleSettingChange('ai', 'ai_greeting', e.target.value)}
            placeholder="Hi! I'm Sarah from Elite HVAC Solutions. How can I help you today?"
            rows="3"
          />
        </div>
      </div>
    </div>
  );

  const renderSMSSection = () => (
    <div className="settings-section">
      <h3>📱 SMS Configuration</h3>
      <p>Configure SMS settings and automated responses</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={settings.sms_enabled || false}
              onChange={(e) => handleSettingChange('sms', 'sms_enabled', e.target.checked)}
            />
            Enable SMS Service
          </label>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={settings.auto_response_enabled || false}
              onChange={(e) => handleSettingChange('sms', 'auto_response_enabled', e.target.checked)}
            />
            Enable Auto-Response
          </label>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={settings.business_hours_only || false}
              onChange={(e) => handleSettingChange('sms', 'business_hours_only', e.target.checked)}
            />
            Business Hours Only
          </label>
        </div>
      </div>
      
      <div className="integration-status">
        <h4>SMS Integration Status</h4>
        <div className="status-item">
          <span className="status-label">Twilio SMS:</span>
          <span className={`status-badge ${settings.integrations?.twilio_sms?.status}`}>
            {settings.integrations?.twilio_sms?.status || 'not_configured'}
          </span>
        </div>
      </div>
      
      <div className="test-section">
        <button 
          onClick={testSMSSettings}
          className="action-btn secondary"
          disabled={!settings.sms_enabled}
        >
          📱 Test SMS
        </button>
        {testResults.sms && (
          <span className={`test-result ${testResults.sms}`}>
            {testResults.sms === 'success' ? '✅ Test successful' : '❌ Test failed'}
          </span>
        )}
      </div>
    </div>
  );

  const renderCalendarSection = () => (
    <div className="settings-section">
      <h3>📅 Calendar Integration</h3>
      <p>Sync appointments with Google Calendar</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={settings.google_calendar_enabled || false}
              onChange={(e) => handleSettingChange('calendar', 'google_calendar_enabled', e.target.checked)}
            />
            Enable Google Calendar Sync
          </label>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={settings.auto_create_events || false}
              onChange={(e) => handleSettingChange('calendar', 'auto_create_events', e.target.checked)}
            />
            Auto-Create Calendar Events
          </label>
        </div>
        
        <div className="form-group">
          <label className="form-label">Default Appointment Duration (minutes)</label>
          <input
            type="number"
            className="form-input"
            value={settings.default_appointment_duration || 60}
            onChange={(e) => handleSettingChange('calendar', 'default_appointment_duration', parseInt(e.target.value))}
            min="15"
            max="480"
            step="15"
          />
        </div>
      </div>
      
      <div className="integration-status">
        <h4>Calendar Integration Status</h4>
        <div className="status-item">
          <span className="status-label">Google Calendar:</span>
          <span className={`status-badge ${settings.integrations?.google_calendar?.status}`}>
            {settings.integrations?.google_calendar?.status || 'not_configured'}
          </span>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="settings-section">
      <h3>🔔 Notification Settings</h3>
      <p>Configure owner notifications and alerts</p>
      
      <div className="notifications-grid">
        <div className="notification-category">
          <h4>Notification Types</h4>
          <div className="notification-options">
            <label className="notification-item">
              <input
                type="checkbox"
                checked={settings.owner_notifications?.new_appointment || true}
                onChange={(e) => handleSettingChange('notifications', 'owner_notifications', {
                  ...settings.owner_notifications,
                  new_appointment: e.target.checked
                })}
              />
              <span>New Appointment Scheduled</span>
            </label>
            
            <label className="notification-item">
              <input
                type="checkbox"
                checked={settings.owner_notifications?.tech_assigned || true}
                onChange={(e) => handleSettingChange('notifications', 'owner_notifications', {
                  ...settings.owner_notifications,
                  tech_assigned: e.target.checked
                })}
              />
              <span>Technician Assigned to Job</span>
            </label>
            
            <label className="notification-item">
              <input
                type="checkbox"
                checked={settings.owner_notifications?.job_completed || true}
                onChange={(e) => handleSettingChange('notifications', 'owner_notifications', {
                  ...settings.owner_notifications,
                  job_completed: e.target.checked
                })}
              />
              <span>Job Completed</span>
            </label>
            
            <label className="notification-item">
              <input
                type="checkbox"
                checked={settings.owner_notifications?.low_rating || true}
                onChange={(e) => handleSettingChange('notifications', 'owner_notifications', {
                  ...settings.owner_notifications,
                  low_rating: e.target.checked
                })}
              />
              <span>Low Customer Rating (≤3 stars)</span>
            </label>
          </div>
        </div>
        
        <div className="notification-category">
          <h4>Delivery Channels</h4>
          <div className="notification-options">
            <label className="notification-item">
              <input
                type="checkbox"
                checked={settings.notification_channels?.in_app || true}
                onChange={(e) => handleSettingChange('notifications', 'notification_channels', {
                  ...settings.notification_channels,
                  in_app: e.target.checked
                })}
              />
              <span>In-App Notifications</span>
            </label>
            
            <label className="notification-item">
              <input
                type="checkbox"
                checked={settings.notification_channels?.sms || false}
                onChange={(e) => handleSettingChange('notifications', 'notification_channels', {
                  ...settings.notification_channels,
                  sms: e.target.checked
                })}
              />
              <span>SMS Notifications</span>
            </label>
            
            <label className="notification-item">
              <input
                type="checkbox"
                checked={settings.notification_channels?.email || false}
                onChange={(e) => handleSettingChange('notifications', 'notification_channels', {
                  ...settings.notification_channels,
                  email: e.target.checked
                })}
              />
              <span>Email Notifications</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="test-section">
        <button onClick={testNotifications} className="action-btn secondary">
          🔔 Test Notifications
        </button>
        {testResults.notifications && (
          <span className={`test-result ${testResults.notifications}`}>
            {testResults.notifications === 'success' ? '✅ Test successful' : '❌ Test failed'}
          </span>
        )}
      </div>
    </div>
  );

  const renderBillingSection = () => (
    <div className="settings-section">
      <h3>💳 Billing & Payment Settings</h3>
      <p>Configure billing preferences and payment terms</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Default Tax Rate (%)</label>
          <input
            type="number"
            className="form-input"
            value={(settings.default_tax_rate || 0) * 100}
            onChange={(e) => handleSettingChange('billing', 'default_tax_rate', parseFloat(e.target.value) / 100)}
            min="0"
            max="20"
            step="0.1"
            placeholder="8.75"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Payment Terms (days)</label>
          <input
            type="number"
            className="form-input"
            value={settings.payment_terms || 30}
            onChange={(e) => handleSettingChange('billing', 'payment_terms', parseInt(e.target.value))}
            min="1"
            max="90"
            placeholder="30"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Late Fee Rate (%)</label>
          <input
            type="number"
            className="form-input"
            value={(settings.late_fee_rate || 0) * 100}
            onChange={(e) => handleSettingChange('billing', 'late_fee_rate', parseFloat(e.target.value) / 100)}
            min="0"
            max="5"
            step="0.1"
            placeholder="1.5"
          />
        </div>
      </div>
      
      <div className="integration-status">
        <h4>Payment Integration Status</h4>
        <div className="status-item">
          <span className="status-label">Stripe Payments:</span>
          <span className={`status-badge ${settings.integrations?.stripe_payments?.status}`}>
            {settings.integrations?.stripe_payments?.status || 'not_configured'}
          </span>
        </div>
      </div>
    </div>
  );

  const renderServicesSection = () => (
    <div className="settings-section">
      <h3>🗺️ Service Areas & Types</h3>
      <p>Define your service coverage areas and available services</p>
      
      <div className="service-lists">
        <div className="service-category">
          <h4>Service Areas</h4>
          <div className="tags-input">
            {(settings.service_areas || []).map((area, index) => (
              <span key={index} className="tag">
                {area}
                <button
                  type="button"
                  onClick={() => {
                    const newAreas = settings.service_areas.filter((_, i) => i !== index);
                    handleSettingChange('services', 'service_areas', newAreas);
                  }}
                  className="tag-remove"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add service area..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const newAreas = [...(settings.service_areas || []), e.target.value.trim()];
                  handleSettingChange('services', 'service_areas', newAreas);
                  e.target.value = '';
                }
              }}
              className="tag-input"
            />
          </div>
        </div>
        
        <div className="service-category">
          <h4>Service Types</h4>
          <div className="tags-input">
            {(settings.service_types || []).map((type, index) => (
              <span key={index} className="tag">
                {type}
                <button
                  type="button"
                  onClick={() => {
                    const newTypes = settings.service_types.filter((_, i) => i !== index);
                    handleSettingChange('services', 'service_types', newTypes);
                  }}
                  className="tag-remove"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add service type..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const newTypes = [...(settings.service_types || []), e.target.value.trim()];
                  handleSettingChange('services', 'service_types', newTypes);
                  e.target.value = '';
                }
              }}
              className="tag-input"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsSection = () => (
    <div className="settings-section">
      <h3>🔗 Third-Party Integrations</h3>
      <p>Manage connections to external services</p>
      
      <div className="integrations-list">
        <div className="integration-item">
          <div className="integration-info">
            <h4>📱 Twilio SMS</h4>
            <p>Send and receive SMS messages</p>
          </div>
          <div className="integration-status">
            <span className={`status-badge ${settings.integrations?.twilio_sms?.status}`}>
              {settings.integrations?.twilio_sms?.status || 'not_configured'}
            </span>
          </div>
        </div>
        
        <div className="integration-item">
          <div className="integration-info">
            <h4>📅 Google Calendar</h4>
            <p>Sync appointments with Google Calendar</p>
          </div>
          <div className="integration-status">
            <span className={`status-badge ${settings.integrations?.google_calendar?.status}`}>
              {settings.integrations?.google_calendar?.status || 'not_configured'}
            </span>
          </div>
        </div>
        
        <div className="integration-item">
          <div className="integration-info">
            <h4>💳 Stripe Payments</h4>
            <p>Process payments and manage billing</p>
          </div>
          <div className="integration-status">
            <span className={`status-badge ${settings.integrations?.stripe_payments?.status}`}>
              {settings.integrations?.stripe_payments?.status || 'not_configured'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'business': return renderBusinessSection();
      case 'ai': return renderAISection();
      case 'sms': return renderSMSSection();
      case 'calendar': return renderCalendarSection();
      case 'notifications': return renderNotificationsSection();
      case 'billing': return renderBillingSection();
      case 'services': return renderServicesSection();
      case 'integrations': return renderIntegrationsSection();
      case 'security':
        return (
          <div className="settings-section">
            <h3>🔒 Security Settings</h3>
            <p>Configure security and access controls</p>
            <div className="coming-soon">
              <p>Security settings coming soon...</p>
            </div>
          </div>
        );
      case 'advanced':
        return (
          <div className="settings-section">
            <h3>⚙️ Advanced Settings</h3>
            <p>Advanced configuration options</p>
            <div className="coming-soon">
              <p>Advanced settings coming soon...</p>
            </div>
          </div>
        );
      default:
        return renderBusinessSection();
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p>Configure your HVAC Assistant system preferences</p>
      </div>

      <div className="settings-container">
        {/* Settings Navigation */}
        <div className="settings-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-name">{section.name}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {renderSection()}
          
          {/* Save Actions */}
          <div className="settings-actions">
            <button 
              onClick={saveSettings}
              disabled={saving || !unsavedChanges}
              className={`action-btn primary ${saving ? 'loading' : ''}`}
            >
              {saving ? '💾 Saving...' : '💾 Save Changes'}
            </button>
            
            <button 
              onClick={fetchSettings}
              className="action-btn secondary"
              disabled={saving}
            >
              🔄 Reset
            </button>
            
            {unsavedChanges && (
              <div className="unsaved-indicator">
                ⚠️ You have unsaved changes
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          padding: 2rem 0;
        }

        .settings-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .settings-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .settings-header p {
          font-size: 1.125rem;
          color: #64748b;
        }

        .settings-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 3rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .settings-nav {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem;
          border: none;
          background: none;
          text-align: left;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 0.25rem;
        }

        .nav-item:hover {
          background-color: #f8fafc;
        }

        .nav-item.active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }

        .nav-icon {
          font-size: 1.25rem;
          width: 1.5rem;
          text-align: center;
        }

        .nav-name {
          font-weight: 500;
        }

        .settings-content {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
        }

        .settings-section h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .settings-section p {
          color: #64748b;
          margin-bottom: 2rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-range {
          width: 100%;
        }

        .range-value {
          display: inline-block;
          margin-left: 0.5rem;
          font-weight: 600;
          color: #3b82f6;
        }

        .business-hours h4 {
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .hours-grid {
          display: grid;
          gap: 0.75rem;
        }

        .hours-row {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 1rem;
          align-items: center;
        }

        .day-label {
          font-weight: 500;
          text-transform: capitalize;
        }

        .integration-status h4 {
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .status-label {
          font-weight: 500;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.mock { background: #fef3c7; color: #92400e; }
        .status-badge.connected { background: #d1fae5; color: #065f46; }
        .status-badge.not_configured { background: #fee2e2; color: #991b1b; }

        .test-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .test-result {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .test-result.success { color: #065f46; }
        .test-result.error { color: #991b1b; }

        .notifications-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .notification-category h4 {
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .notification-options {
          space-y: 0.75rem;
        }

        .notification-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background-color 0.2s ease;
        }

        .notification-item:hover {
          background-color: #f8fafc;
        }

        .service-lists {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .service-category h4 {
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .tags-input {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          min-height: 2.5rem;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .tag-remove {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1.125rem;
          font-weight: bold;
        }

        .tag-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.875rem;
        }

        .integrations-list {
          space-y: 1rem;
        }

        .integration-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
        }

        .integration-item:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
        }

        .integration-info h4 {
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .integration-info p {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0;
        }

        .coming-soon {
          text-align: center;
          padding: 3rem;
          color: #64748b;
          font-style: italic;
        }

        .settings-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
        }

        .action-btn {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }

        .action-btn.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
        }

        .action-btn.secondary {
          background: white;
          color: #3b82f6;
          border: 2px solid #3b82f6;
        }

        .action-btn.secondary:hover:not(:disabled) {
          background: #3b82f6;
          color: white;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.loading {
          position: relative;
          overflow: hidden;
        }

        .unsaved-indicator {
          color: #f59e0b;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .settings-loading, .settings-error {
          text-align: center;
          padding: 4rem 2rem;
        }

        .settings-loading .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .settings-error h3 {
          color: #ef4444;
          margin-bottom: 1rem;
        }

        @media (max-width: 1024px) {
          .settings-container {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .settings-nav {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
            position: static;
          }
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .notifications-grid {
            grid-template-columns: 1fr;
          }

          .service-lists {
            grid-template-columns: 1fr;
          }

          .settings-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;