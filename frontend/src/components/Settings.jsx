import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, TestTube, Building, Bot, MessageSquare, Calendar, Bell, CreditCard, Map, Link, Shield, Cog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import authService from '../utils/auth';

// Settings Navigation
const settingsNavigation = [
  { id: 'business', name: 'Business', icon: Building },
  { id: 'ai', name: 'AI Assistant', icon: Bot },
  { id: 'sms', name: 'SMS Settings', icon: MessageSquare },
  { id: 'calendar', name: 'Calendar', icon: Calendar },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'billing', name: 'Billing', icon: CreditCard },
  { id: 'services', name: 'Service Areas', icon: Map },
  { id: 'integrations', name: 'Integrations', icon: Link },
];

// Business Settings Section
const BusinessSection = ({ settings, onSettingsChange, onSave, saving }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Business Information</h2>
        <p className="text-muted-foreground">Configure your business details and contact information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Basic information about your HVAC business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name</label>
              <Input
                value={settings?.business_name || ''}
                onChange={(e) => onSettingsChange('business_name', e.target.value)}
                placeholder="Elite HVAC Solutions"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Phone</label>
              <Input
                value={settings?.business_phone || ''}
                onChange={(e) => onSettingsChange('business_phone', e.target.value)}
                placeholder="+1-555-HVAC-PRO"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Email</label>
              <Input
                type="email"
                value={settings?.business_email || ''}
                onChange={(e) => onSettingsChange('business_email', e.target.value)}
                placeholder="info@hvactech.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Business Address</label>
            <Input
              value={settings?.business_address?.full || ''}
              onChange={(e) => onSettingsChange('business_address', { full: e.target.value })}
              placeholder="123 Business St, Springfield, IL 62701"
            />
            <p className="text-xs text-muted-foreground">This address will be used for invoices and customer communications</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// AI Assistant Section
const AISection = ({ settings, onSettingsChange, onSave, saving }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI Assistant</h2>
        <p className="text-muted-foreground">Configure your AI assistant's behavior and responses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assistant Configuration</CardTitle>
          <CardDescription>Customize how your AI assistant interacts with customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Assistant Name</label>
            <Input
              value={settings?.ai_assistant_name || 'Sarah'}
              onChange={(e) => onSettingsChange('ai_assistant_name', e.target.value)}
              placeholder="Sarah"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Response Temperature</label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={settings?.ai_temperature || 0.3}
              onChange={(e) => onSettingsChange('ai_temperature', parseFloat(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Lower values make responses more focused and consistent (0.3 recommended)</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Max Response Length</label>
            <Input
              type="number"
              min="50"
              max="200"
              value={settings?.max_response_tokens || 120}
              onChange={(e) => onSettingsChange('max_response_tokens', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Maximum number of characters in AI responses</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// Integration Status Card
const IntegrationCard = ({ title, description, status, onTest }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'mock': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <span className={cn(
            "inline-flex px-2 py-1 rounded-full text-xs font-medium",
            getStatusColor(status)
          )}>
            {status || 'not_configured'}
          </span>
        </div>
        {onTest && (
          <Button variant="outline" size="sm" onClick={onTest}>
            <TestTube className="w-4 h-4 mr-2" />
            Test
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Main Settings Component
const Settings = ({ currentUser }) => {
  const [activeSection, setActiveSection] = useState('business');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [currentUser?.company_id]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(`settings/${currentUser?.company_id || 'company-001'}`);
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await authService.authenticatedFetch(`settings/${currentUser?.company_id || 'company-001'}`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        // Show success message
        console.log('Settings saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'business':
        return (
          <BusinessSection 
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onSave={handleSave}
            saving={saving}
          />
        );
      case 'ai':
        return (
          <AISection 
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onSave={handleSave}
            saving={saving}
          />
        );
      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Integrations</h2>
              <p className="text-muted-foreground">Manage connections to external services</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IntegrationCard
                title="Twilio SMS"
                description="Send and receive SMS messages"
                status={settings?.integrations?.twilio_sms?.status}
              />
              <IntegrationCard
                title="Google Calendar"
                description="Sync appointments with Google Calendar"
                status={settings?.integrations?.google_calendar?.status}
              />
              <IntegrationCard
                title="Stripe Payments"
                description="Process payments and manage billing"
                status={settings?.integrations?.stripe_payments?.status}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Coming Soon</h2>
              <p className="text-muted-foreground">This section is being developed</p>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <Cog className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Feature in Development</h3>
                <p className="text-muted-foreground">This settings section will be available soon.</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your HVAC Pro system</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded-lg"></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - PayPal style */}
      <div>
        <h1 className="section-header">Settings</h1>
        <p className="text-[#475569]">Configure your HVAC Pro system preferences</p>
      </div>

      {/* Settings Layout - PayPal style */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div>
          <Card>
            <CardContent className="p-6">
              <nav className="space-y-2">
                {settingsNavigation.map((item) => {
                  const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center px-4 py-3 text-base font-medium transition-colors text-left rounded-lg",
                      activeSection === item.id
                        ? "bg-[#E6F1FD] text-[#0B0F19] border-l-2 border-[#0070E0]"
                        : "text-[#0B0F19] hover:bg-[#F9FAFB]"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default Settings;