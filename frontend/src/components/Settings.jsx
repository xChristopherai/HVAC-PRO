import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, TestTube, Building, Bot, MessageSquare, Calendar, Bell, CreditCard, Map, Link, Shield, Cog, Plus, Trash2, Check, X, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
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

// Calendar Settings Section
const CalendarSection = ({ settings, onSave }) => {
  const [calendarSettings, setCalendarSettings] = useState({
    google_connected: settings?.calendar?.google_connected || false,
    default_calendar: settings?.calendar?.default_calendar || 'primary',
    default_event_duration: settings?.calendar?.default_event_duration || 60,
    auto_create_events: settings?.calendar?.auto_create_events || false,
    ...settings?.calendar
  });
  const [saving, setSaving] = useState(false);
  const [testingEvent, setTestingEvent] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authService.authenticatedFetch('/api/settings/calendar', {
        method: 'POST',
        body: JSON.stringify(calendarSettings)
      });
      
      if (response.ok) {
        console.log('Calendar settings saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save calendar settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEvent = async () => {
    setTestingEvent(true);
    try {
      const testData = {
        title: "Test HVAC Appointment",
        start: new Date().toISOString(),
        end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        customerId: "test-customer",
        techId: "test-tech"
      };
      
      const response = await authService.authenticatedFetch('/api/calendar/create', {
        method: 'POST',
        body: JSON.stringify(testData)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('Test event created successfully! Event ID: ' + result.eventId);
      }
    } catch (err) {
      alert('Failed to create test event: ' + err.message);
    } finally {
      setTestingEvent(false);
    }
  };

  const handleConnect = () => {
    // Mock Google OAuth flow
    setCalendarSettings(prev => ({
      ...prev,
      google_connected: true,
      connection_status: 'connected'
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Calendar Settings</h2>
        <p className="text-muted-foreground">Configure calendar integration and event settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar Integration</CardTitle>
          <CardDescription>Connect your Google Calendar to sync appointments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Google Calendar Connection</Label>
              <p className="text-xs text-muted-foreground">
                {calendarSettings.google_connected ? 'Connected to Google Calendar' : 'Not connected'}
              </p>
            </div>
            <Button 
              variant={calendarSettings.google_connected ? "outline" : "default"}
              onClick={handleConnect}
              disabled={calendarSettings.google_connected}
            >
              {calendarSettings.google_connected ? 'Connected' : 'Connect (Mock)'}
            </Button>
          </div>

          {calendarSettings.google_connected && (
            <>
              <div className="space-y-2">
                <Label htmlFor="default_calendar">Default Calendar</Label>
                <Input
                  id="default_calendar"
                  value={calendarSettings.default_calendar}
                  onChange={(e) => setCalendarSettings(prev => ({...prev, default_calendar: e.target.value}))}
                  placeholder="primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_duration">Default Event Duration (minutes)</Label>
                <Input
                  id="event_duration"
                  type="number"
                  value={calendarSettings.default_event_duration}
                  onChange={(e) => setCalendarSettings(prev => ({...prev, default_event_duration: parseInt(e.target.value)}))}
                  placeholder="60"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_create"
                  checked={calendarSettings.auto_create_events}
                  onCheckedChange={(checked) => setCalendarSettings(prev => ({...prev, auto_create_events: checked}))}
                />
                <Label htmlFor="auto_create">Auto-create events for new appointments</Label>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={handleTestEvent}
                  disabled={testingEvent}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testingEvent ? 'Creating...' : 'Create Test Event'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// Notifications Settings Section
const NotificationsSection = ({ settings, onSave }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    job_reminder_sms: settings?.notifications?.job_reminder_sms || false,
    missed_call_alert: settings?.notifications?.missed_call_alert || false,
    daily_summary: settings?.notifications?.daily_summary || false,
    emergency_escalations: settings?.notifications?.emergency_escalations || false,
    owner_email: settings?.notifications?.owner_email || '',
    owner_phone: settings?.notifications?.owner_phone || '',
    ...settings?.notifications
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authService.authenticatedFetch('/api/settings/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationSettings)
      });
      
      if (response.ok) {
        console.log('Notifications settings saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save notifications settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-muted-foreground">Configure notification preferences and contact information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Owner Contact Information</CardTitle>
          <CardDescription>Where to send important notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner_email">Owner Email</Label>
              <Input
                id="owner_email"
                type="email"
                value={notificationSettings.owner_email}
                onChange={(e) => setNotificationSettings(prev => ({...prev, owner_email: e.target.value}))}
                placeholder="owner@hvactech.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_phone">Owner Phone</Label>
              <Input
                id="owner_phone"
                type="tel"
                value={notificationSettings.owner_phone}
                onChange={(e) => setNotificationSettings(prev => ({...prev, owner_phone: e.target.value}))}
                placeholder="+1-555-123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="job_reminder_sms"
                checked={notificationSettings.job_reminder_sms}
                onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, job_reminder_sms: checked}))}
              />
              <div>
                <Label htmlFor="job_reminder_sms" className="text-[#0B0F19] font-medium">Job Reminder SMS</Label>
                <p className="text-xs text-[#64748B]">Send SMS reminders to technicians before appointments</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="missed_call_alert"
                checked={notificationSettings.missed_call_alert}
                onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, missed_call_alert: checked}))}
              />
              <div>
                <Label htmlFor="missed_call_alert" className="text-[#0B0F19] font-medium">Missed-call Alert to Owner</Label>
                <p className="text-xs text-[#64748B]">Get notified when customers call but aren't answered</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="daily_summary"
                checked={notificationSettings.daily_summary}
                onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, daily_summary: checked}))}
              />
              <div>
                <Label htmlFor="daily_summary">Daily Summary</Label>
                <p className="text-xs text-muted-foreground">Receive daily summary of completed jobs and revenue</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="emergency_escalations"
                checked={notificationSettings.emergency_escalations}
                onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, emergency_escalations: checked}))}
              />
              <div>
                <Label htmlFor="emergency_escalations">Emergency Escalations</Label>
                <p className="text-xs text-muted-foreground">Immediate alerts for emergency service requests</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// Billing Settings Section
const BillingSection = ({ settings, onSave }) => {
  const [billingSettings, setBillingSettings] = useState({
    current_plan: settings?.billing?.plan || 'trial',
    plan_status: settings?.billing?.status || 'active',
    ...settings?.billing
  });
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await authService.authenticatedFetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Open checkout URL
        window.open(result.checkoutUrl, '_blank');
        console.log('Billing checkout created:', result);
      }
    } catch (err) {
      console.error('Failed to create checkout:', err);
      alert('Failed to create billing session');
    } finally {
      setLoading(false);
    }
  };

  const getPlanDetails = (plan) => {
    switch (plan) {
      case 'pro':
        return { name: 'Professional', price: '$99/month', features: ['Unlimited appointments', 'SMS/Voice AI', 'Google Calendar', 'Priority support'] };
      case 'enterprise':
        return { name: 'Enterprise', price: '$199/month', features: ['Everything in Pro', 'Multi-location', 'Advanced analytics', 'Custom integrations'] };
      default:
        return { name: 'Trial', price: 'Free', features: ['Up to 10 appointments', 'Basic features', '7-day trial'] };
    }
  };

  const currentPlanDetails = getPlanDetails(billingSettings.current_plan);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Billing</h2>
        <p className="text-muted-foreground">Manage your subscription and billing information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your current subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{currentPlanDetails.name}</h3>
              <p className="text-muted-foreground">{currentPlanDetails.price}</p>
            </div>
            <Badge variant={billingSettings.current_plan === 'trial' ? 'secondary' : 'default'}>
              {billingSettings.plan_status || 'active'}
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Features included:</h4>
            <ul className="space-y-1">
              {currentPlanDetails.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-muted-foreground">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {billingSettings.current_plan === 'trial' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>Get access to more features and unlimited usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Professional</h3>
                <p className="text-2xl font-bold">$99<span className="text-sm font-normal">/month</span></p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Unlimited appointments</li>
                  <li>• SMS & Voice AI</li>
                  <li>• Google Calendar sync</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Enterprise</h3>
                <p className="text-2xl font-bold">$199<span className="text-sm font-normal">/month</span></p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Everything in Professional</li>
                  <li>• Multi-location support</li>
                  <li>• Advanced analytics</li>
                  <li>• Custom integrations</li>
                </ul>
              </div>
            </div>

            <Button onClick={handleUpgrade} disabled={loading} className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Upgrade / Manage Billing'}
            </Button>
          </CardContent>
        </Card>
      )}

      {billingSettings.current_plan !== 'trial' && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>Update payment method or change plan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleUpgrade} disabled={loading} variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              {loading ? 'Loading...' : 'Manage Billing'}
            </Button>
          </CardContent>
        </Card>
      )}
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
      case 'calendar':
        return (
          <CalendarSection 
            settings={settings}
            onSave={handleSave}
          />
        );
      case 'notifications':
        return (
          <NotificationsSection 
            settings={settings}
            onSave={handleSave}
          />
        );
      case 'billing':
        return (
          <BillingSection 
            settings={settings}
            onSave={handleSave}
          />
        );
      case 'services':
        return (
          <ServiceAreasSection 
            settings={settings}
            onSave={handleSave}
          />
        );
      case 'integrations':
        return (
          <IntegrationsSection 
            settings={settings}
            onSave={handleSave}
          />
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
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

// Service Areas Settings Section
const ServiceAreasSection = ({ settings, onSave }) => {
  const [serviceAreaSettings, setServiceAreaSettings] = useState({
    areas: settings?.serviceAreas?.areas || [],
    default_radius: settings?.serviceAreas?.default_radius || 25,
    ...settings?.serviceAreas
  });
  const [saving, setSaving] = useState(false);
  const [newArea, setNewArea] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authService.authenticatedFetch('/api/settings/service-areas', {
        method: 'POST',
        body: JSON.stringify(serviceAreaSettings)
      });
      
      if (response.ok) {
        console.log('Service areas settings saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save service areas settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const addServiceArea = () => {
    if (newArea.trim() && !serviceAreaSettings.areas.includes(newArea.trim())) {
      setServiceAreaSettings(prev => ({
        ...prev,
        areas: [...prev.areas, newArea.trim()]
      }));
      setNewArea('');
    }
  };

  const removeServiceArea = (areaToRemove) => {
    setServiceAreaSettings(prev => ({
      ...prev,
      areas: prev.areas.filter(area => area !== areaToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addServiceArea();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Service Areas</h2>
        <p className="text-muted-foreground">Define the areas where you provide HVAC services</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Coverage</CardTitle>
          <CardDescription>Add ZIP codes, cities, or neighborhoods you serve</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter ZIP code or city name (e.g., 12345 or Springfield)"
              className="flex-1"
            />
            <Button onClick={addServiceArea} disabled={!newArea.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_radius">Default Service Radius (miles)</Label>
            <Input
              id="default_radius"
              type="number"
              min="1"
              max="100"
              value={serviceAreaSettings.default_radius}
              onChange={(e) => setServiceAreaSettings(prev => ({...prev, default_radius: parseInt(e.target.value)}))}
              placeholder="25"
            />
            <p className="text-xs text-muted-foreground">Default radius for service areas when specific boundaries aren't defined</p>
          </div>

          {serviceAreaSettings.areas.length > 0 && (
            <div className="space-y-2">
              <Label>Current Service Areas</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {serviceAreaSettings.areas.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <span className="text-sm">{area}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeServiceArea(area)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {serviceAreaSettings.areas.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Map className="w-8 h-8 mx-auto mb-2" />
              <p>No service areas defined yet</p>
              <p className="text-xs">Add ZIP codes or city names to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Area Examples</CardTitle>
          <CardDescription>Common ways to define your service coverage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">By ZIP Code</h4>
              <p className="text-sm text-muted-foreground">12345, 12346, 12347</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">By City</h4>
              <p className="text-sm text-muted-foreground">Springfield, Shelbyville, Capital City</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">By Neighborhood</h4>
              <p className="text-sm text-muted-foreground">Downtown, Riverside, Hillview</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">By County</h4>
              <p className="text-sm text-muted-foreground">Sangamon County, Logan County</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// Integrations Settings Section
const IntegrationsSection = ({ settings, onSave }) => {
  const [integrationSettings, setIntegrationSettings] = useState({
    twilio: settings?.integrations?.twilio || {},
    google_calendar: settings?.integrations?.google_calendar || {},
    stripe: settings?.integrations?.stripe || {},
    quickbooks: settings?.integrations?.quickbooks || {}
  });
  const [connecting, setConnecting] = useState({});

  const handleConnect = async (provider, data) => {
    setConnecting(prev => ({ ...prev, [provider]: true }));
    try {
      const response = await authService.authenticatedFetch(`/api/settings/integrations/${provider}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        setIntegrationSettings(prev => ({
          ...prev,
          [provider]: { ...data, status: result.status }
        }));
        console.log(`${provider} integration saved:`, result);
      }
    } catch (err) {
      console.error(`Failed to save ${provider} integration:`, err);
      alert(`Failed to connect ${provider}`);
    } finally {
      setConnecting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const IntegrationConnectCard = ({ provider, title, description, icon: Icon, fields }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({});
    const isConnected = integrationSettings[provider]?.status === 'connected';
    
    const handleSubmit = (e) => {
      e.preventDefault();
      handleConnect(provider, formData);
      setIsExpanded(false);
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className="w-8 h-8" />
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isExpanded ? (
            <Button 
              onClick={() => setIsExpanded(true)} 
              disabled={connecting[provider]}
              variant={isConnected ? "outline" : "default"}
            >
              {connecting[provider] ? 'Connecting...' : isConnected ? 'Reconfigure' : 'Connect'}
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({...prev, [field.name]: e.target.value}))}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                </div>
              ))}
              <div className="flex space-x-2">
                <Button type="submit" disabled={connecting[provider]}>
                  {connecting[provider] ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsExpanded(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrations</h2>
        <p className="text-muted-foreground">Connect external services to expand your HVAC Pro capabilities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IntegrationConnectCard
          provider="twilio"
          title="Twilio SMS & Voice"
          description="Send SMS messages and handle voice calls"
          icon={MessageSquare}
          fields={[
            { name: 'account_sid', label: 'Account SID', required: true, placeholder: 'ACxxx...' },
            { name: 'auth_token', label: 'Auth Token', type: 'password', required: true, placeholder: 'Your Twilio auth token' },
            { name: 'phone_number', label: 'Phone Number', required: true, placeholder: '+1234567890', description: 'Your Twilio phone number' }
          ]}
        />

        <IntegrationConnectCard
          provider="google_calendar"
          title="Google Calendar"
          description="Sync appointments with Google Calendar"
          icon={Calendar}
          fields={[
            { name: 'client_id', label: 'Client ID', required: true, placeholder: 'Google OAuth Client ID' },
            { name: 'client_secret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Google OAuth Client Secret' },
            { name: 'calendar_id', label: 'Calendar ID', required: false, placeholder: 'primary', description: 'Leave as "primary" for main calendar' }
          ]}
        />

        <IntegrationConnectCard
          provider="stripe"
          title="Stripe Payments"
          description="Accept online payments and manage billing"
          icon={CreditCard}
          fields={[
            { name: 'publishable_key', label: 'Publishable Key', required: true, placeholder: 'pk_test_...' },
            { name: 'secret_key', label: 'Secret Key', type: 'password', required: true, placeholder: 'sk_test_...', description: 'Keep this secure - never share publicly' }
          ]}
        />

        <IntegrationConnectCard
          provider="quickbooks"
          title="QuickBooks"
          description="Sync invoices and financial data"
          icon={Building}
          fields={[
            { name: 'client_id', label: 'App Client ID', required: true, placeholder: 'QuickBooks App Client ID' },
            { name: 'client_secret', label: 'Client Secret', type: 'password', required: true, placeholder: 'QuickBooks Client Secret' },
            { name: 'company_id', label: 'Company ID', required: false, placeholder: 'QuickBooks Company ID' }
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>Overview of all connected services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(integrationSettings).map(([provider, config]) => (
              <div key={provider} className="text-center p-3 border rounded-lg">
                <p className="font-medium capitalize">{provider.replace('_', ' ')}</p>
                <Badge variant={config.status === 'connected' ? 'default' : 'secondary'} className="mt-1">
                  {config.status || 'Not Connected'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;