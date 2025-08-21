import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, TestTube, Building, Bot, MessageSquare, Calendar, Bell, CreditCard, Map, Link, Shield, Cog, Plus, Trash2, Check, X, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
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
  { id: 'service_areas', name: 'Service Areas', icon: Map },
  { id: 'integrations', name: 'Integrations', icon: Link },
];

// Business Settings Section
const BusinessSection = ({ settings, onSettingsChange, onSave, saving }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0B0F19]">Business Information</h2>
        <p className="text-[#64748B]">Configure your business details and contact information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">Company Details</CardTitle>
          <CardDescription className="text-[#64748B]">Basic information about your HVAC business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Business Name</Label>
              <Input
                value={settings?.business?.business_name || ''}
                onChange={(e) => onSettingsChange('business', 'business_name', e.target.value)}
                placeholder="Elite HVAC Solutions"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Business Phone</Label>
              <Input
                value={settings?.business?.business_phone || ''}
                onChange={(e) => onSettingsChange('business', 'business_phone', e.target.value)}
                placeholder="+1-555-HVAC-PRO"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Business Email</Label>
              <Input
                type="email"
                value={settings?.business?.business_email || ''}
                onChange={(e) => onSettingsChange('business', 'business_email', e.target.value)}
                placeholder="info@hvactech.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Website</Label>
              <Input
                value={settings?.business?.website || ''}
                onChange={(e) => onSettingsChange('business', 'website', e.target.value)}
                placeholder="https://elitehvac.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#0B0F19] font-medium">Business Address</Label>
            <Textarea
              value={settings?.business?.business_address || ''}
              onChange={(e) => onSettingsChange('business', 'business_address', e.target.value)}
              placeholder="123 Business Ave, Tech City, TC 12345"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#0B0F19] font-medium">License Number</Label>
            <Input
              value={settings?.business?.license_number || ''}
              onChange={(e) => onSettingsChange('business', 'license_number', e.target.value)}
              placeholder="HVAC-LIC-2024-001"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(['business'])} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// AI Assistant Settings Section
const AISection = ({ settings, onSettingsChange, onSave, saving }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0B0F19]">AI Assistant</h2>
        <p className="text-[#64748B]">Configure AI-powered features and automation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">Assistant Configuration</CardTitle>
          <CardDescription className="text-[#64748B]">Customize your AI assistant's behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Assistant Name</Label>
              <Input
                value={settings?.ai?.assistant_name || ''}
                onChange={(e) => onSettingsChange('ai', 'assistant_name', e.target.value)}
                placeholder="HVAC Assistant"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Response Temperature</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings?.ai?.response_temperature || ''}
                onChange={(e) => onSettingsChange('ai', 'response_temperature', parseFloat(e.target.value))}
                placeholder="0.7"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#0B0F19] font-medium">Enable Voice Scheduling</Label>
                <p className="text-xs text-[#64748B]">Allow customers to book appointments via phone</p>
              </div>
              <Switch
                checked={settings?.ai?.enable_voice_scheduling || false}
                onCheckedChange={(checked) => onSettingsChange('ai', 'enable_voice_scheduling', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#0B0F19] font-medium">Auto Responses</Label>
                <p className="text-xs text-[#64748B]">Automatically respond to common inquiries</p>
              </div>
              <Switch
                checked={settings?.ai?.auto_responses || false}
                onCheckedChange={(checked) => onSettingsChange('ai', 'auto_responses', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#0B0F19] font-medium">Business Hours Only</Label>
                <p className="text-xs text-[#64748B]">Only operate during business hours</p>
              </div>
              <Switch
                checked={settings?.ai?.business_hours_only || false}
                onCheckedChange={(checked) => onSettingsChange('ai', 'business_hours_only', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(['ai'])} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// SMS Settings Section
const SMSSection = ({ settings, onSettingsChange, onSave, saving }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0B0F19]">SMS Settings</h2>
        <p className="text-[#64748B]">Configure SMS messaging and templates</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">SMS Configuration</CardTitle>
          <CardDescription className="text-[#64748B]">Manage automated SMS responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#0B0F19] font-medium">Auto Replies</Label>
                <p className="text-xs text-[#64748B]">Automatically reply to incoming SMS</p>
              </div>
              <Switch
                checked={settings?.sms?.auto_replies || false}
                onCheckedChange={(checked) => onSettingsChange('sms', 'auto_replies', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#0B0F19] font-medium">Business Hours SMS</Label>
                <p className="text-xs text-[#64748B]">Only send SMS during business hours</p>
              </div>
              <Switch
                checked={settings?.sms?.business_hours_sms || false}
                onCheckedChange={(checked) => onSettingsChange('sms', 'business_hours_sms', checked)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-[#0B0F19] font-medium">Emergency Keywords</Label>
            <Input
              value={settings?.sms?.emergency_keywords?.join(', ') || ''}
              onChange={(e) => onSettingsChange('sms', 'emergency_keywords', e.target.value.split(', '))}
              placeholder="emergency, urgent, no heat, no ac"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">Response Templates</CardTitle>
          <CardDescription className="text-[#64748B]">Customize automated response messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#0B0F19] font-medium">Greeting Message</Label>
            <Textarea
              value={settings?.sms?.response_templates?.greeting || ''}
              onChange={(e) => onSettingsChange('sms', 'response_templates', { ...settings?.sms?.response_templates, greeting: e.target.value })}
              placeholder="Hello! Thanks for contacting Elite HVAC. How can we help you today?"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[#0B0F19] font-medium">After Hours Message</Label>
            <Textarea
              value={settings?.sms?.response_templates?.after_hours || ''}
              onChange={(e) => onSettingsChange('sms', 'response_templates', { ...settings?.sms?.response_templates, after_hours: e.target.value })}
              placeholder="We've received your message. Our office hours are Mon-Fri 8AM-6PM."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(['sms'])} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// Calendar Settings Section (with Test Event functionality)
const CalendarSection = ({ settings, onSettingsChange, onSave, saving }) => {
  const [testingEvent, setTestingEvent] = useState(false);

  const handleTestEvent = async () => {
    setTestingEvent(true);
    try {
      const testData = {
        title: "Test HVAC Service Call",
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
        alert(`✅ Test event created successfully! Event ID: ${result.eventId}`);
      } else {
        alert('❌ Failed to create test event');
      }
    } catch (err) {
      alert('❌ Error creating test event: ' + err.message);
    } finally {
      setTestingEvent(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0B0F19]">Calendar Settings</h2>
        <p className="text-[#64748B]">Configure calendar integration and event settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">Google Calendar Integration</CardTitle>
          <CardDescription className="text-[#64748B]">Sync appointments with Google Calendar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[#0B0F19] font-medium">Google Calendar Connection</Label>
              <p className="text-xs text-[#64748B]">
                {settings?.calendar?.google_connected ? 'Connected to Google Calendar' : 'Not connected'}
              </p>
            </div>
            <Badge variant={settings?.calendar?.google_connected ? "default" : "secondary"}>
              {settings?.calendar?.google_connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Default Calendar</Label>
              <Input
                value={settings?.calendar?.default_calendar || ''}
                onChange={(e) => onSettingsChange('calendar', 'default_calendar', e.target.value)}
                placeholder="primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Default Event Duration (minutes)</Label>
              <Input
                type="number"
                value={settings?.calendar?.default_event_duration || ''}
                onChange={(e) => onSettingsChange('calendar', 'default_event_duration', parseInt(e.target.value))}
                placeholder="90"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[#0B0F19] font-medium">Auto-create Events</Label>
              <p className="text-xs text-[#64748B]">Automatically create calendar events for new appointments</p>
            </div>
            <Switch
              checked={settings?.calendar?.auto_create_events || false}
              onCheckedChange={(checked) => onSettingsChange('calendar', 'auto_create_events', checked)}
            />
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              onClick={handleTestEvent}
              disabled={testingEvent}
            >
              <TestTube className="w-4 h-4 mr-2" />
              {testingEvent ? 'Creating Test Event...' : 'Create Test Event'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(['calendar'])} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// Notifications Settings Section
const NotificationsSection = ({ settings, onSettingsChange, onSave, saving }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0B0F19]">Notifications</h2>
        <p className="text-[#64748B]">Configure notification preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">Owner Contact Information</CardTitle>
          <CardDescription className="text-[#64748B]">Where to send important notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Owner Email</Label>
              <Input
                type="email"
                value={settings?.notifications?.owner_email || ''}
                onChange={(e) => onSettingsChange('notifications', 'owner_email', e.target.value)}
                placeholder="owner@hvactech.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Owner Phone</Label>
              <Input
                type="tel"
                value={settings?.notifications?.owner_phone || ''}
                onChange={(e) => onSettingsChange('notifications', 'owner_phone', e.target.value)}
                placeholder="+1-555-OWNER"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">Notification Preferences</CardTitle>
          <CardDescription className="text-[#64748B]">Choose which notifications to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#0B0F19] font-medium">Job Reminder SMS</Label>
                <p className="text-xs text-[#64748B]">Send SMS reminders to technicians</p>
              </div>
              <Switch
                checked={settings?.notifications?.job_reminder_sms || false}
                onCheckedChange={(checked) => onSettingsChange('notifications', 'job_reminder_sms', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#0B0F19] font-medium">Missed Call Alert</Label>
                <p className="text-xs text-[#64748B]">Get notified when calls are missed</p>
              </div>
              <Switch
                checked={settings?.notifications?.missed_call_alert || false}
                onCheckedChange={(checked) => onSettingsChange('notifications', 'missed_call_alert', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#0B0F19] font-medium">Daily Summary</Label>
                <p className="text-xs text-[#64748B]">Daily summary of jobs and revenue</p>
              </div>
              <Switch
                checked={settings?.notifications?.daily_summary || false}
                onCheckedChange={(checked) => onSettingsChange('notifications', 'daily_summary', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#0B0F19] font-medium">Emergency Escalations</Label>
                <p className="text-xs text-[#64748B]">Immediate alerts for emergencies</p>
              </div>
              <Switch
                checked={settings?.notifications?.emergency_escalations || false}
                onCheckedChange={(checked) => onSettingsChange('notifications', 'emergency_escalations', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(['notifications'])} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// Billing Settings Section (with Manage functionality)
const BillingSection = ({ settings, onSettingsChange, onSave, saving }) => {
  const [managing, setManaging] = useState(false);

  const handleManageBilling = async () => {
    setManaging(true);
    try {
      const response = await authService.authenticatedFetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'manage' })
      });
      
      if (response.ok) {
        const result = await response.json();
        window.open(result.checkoutUrl, '_blank');
      }
    } catch (err) {
      alert('❌ Error opening billing management: ' + err.message);
    } finally {
      setManaging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0B0F19]">Billing</h2>
        <p className="text-[#64748B]">Manage your subscription and payment methods</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">Current Plan</CardTitle>
          <CardDescription className="text-[#64748B]">Your current subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#0B0F19]">{settings?.billing?.plan || 'Professional'}</h3>
              <p className="text-[#64748B]">$99/month</p>
            </div>
            <Badge variant="default">
              {settings?.billing?.status || 'Active'}
            </Badge>
          </div>

          <Button 
            onClick={handleManageBilling} 
            disabled={managing}
            variant="outline"
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {managing ? 'Opening...' : 'Manage Billing'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">Payment Methods</CardTitle>
          <CardDescription className="text-[#64748B]">Stored payment credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* PayPal */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-[#0B0F19]">PayPal</p>
                  <p className="text-xs text-[#64748B]">billing@hvactech.com</p>
                </div>
              </div>
              <Badge variant={settings?.integrations?.paypal?.status === 'connected' ? 'default' : 'secondary'}>
                {settings?.integrations?.paypal?.status === 'connected' ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>

            {/* Venmo */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-[#0B0F19]">Venmo</p>
                  <p className="text-xs text-[#64748B]">@hvactech-business</p>
                </div>
              </div>
              <Badge variant={settings?.integrations?.venmo?.status === 'connected' ? 'default' : 'secondary'}>
                {settings?.integrations?.venmo?.status === 'connected' ? 'Connected' : 'Store Creds'}
              </Badge>
            </div>

            {/* Apple Pay */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-[#0B0F19]">Apple Pay</p>
                  <p className="text-xs text-[#64748B]">Merchant ID configured</p>
                </div>
              </div>
              <Badge variant={settings?.integrations?.apple_pay?.status === 'connected' ? 'default' : 'secondary'}>
                {settings?.integrations?.apple_pay?.status === 'connected' ? 'Connected' : 'Store Creds'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(['billing'])} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// Service Areas Section
const ServiceAreasSection = ({ settings, onSettingsChange, onSave, saving }) => {
  const [newArea, setNewArea] = useState('');

  const addServiceArea = () => {
    if (newArea.trim() && !settings?.service_areas?.areas?.includes(newArea.trim())) {
      const currentAreas = settings?.service_areas?.areas || [];
      onSettingsChange('service_areas', 'areas', [...currentAreas, newArea.trim()]);
      setNewArea('');
    }
  };

  const removeServiceArea = (areaToRemove) => {
    const currentAreas = settings?.service_areas?.areas || [];
    onSettingsChange('service_areas', 'areas', currentAreas.filter(area => area !== areaToRemove));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0B0F19]">Service Areas</h2>
        <p className="text-[#64748B]">Define where you provide HVAC services</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">Service Coverage</CardTitle>
          <CardDescription className="text-[#64748B]">Add ZIP codes, cities, or neighborhoods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addServiceArea()}
              placeholder="Enter ZIP code or city (e.g., 12345 or Springfield)"
              className="flex-1"
            />
            <Button onClick={addServiceArea} disabled={!newArea.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-[#0B0F19] font-medium">Default Service Radius (miles)</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={settings?.service_areas?.default_radius || ''}
              onChange={(e) => onSettingsChange('service_areas', 'default_radius', parseInt(e.target.value))}
              placeholder="25"
            />
          </div>

          {settings?.service_areas?.areas?.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[#0B0F19] font-medium">Current Service Areas</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {settings.service_areas.areas.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-[#0B0F19]">{area}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeServiceArea(area)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(['service_areas'])} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// Integrations Section (with Connect functionality and Credentials Storage)
const IntegrationsSection = ({ settings, onSettingsChange, onSave, saving }) => {
  const [connecting, setConnecting] = useState({});

  const handleConnect = async (provider, credentials = {}) => {
    setConnecting(prev => ({ ...prev, [provider]: true }));
    try {
      const response = await authService.authenticatedFetch(`/api/settings/integrations/${provider}`, {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update local state to reflect connection
        onSettingsChange('integrations', provider, { 
          ...credentials, 
          status: result.status,
          connected_at: new Date().toISOString()
        });
        
        alert(`✅ ${provider} connected successfully!`);
      } else {
        alert(`❌ Failed to connect ${provider}`);
      }
    } catch (err) {
      alert(`❌ Error connecting ${provider}: ${err.message}`);
    } finally {
      setConnecting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const integrations = [
    {
      provider: 'twilio',
      name: 'Twilio SMS & Voice',
      description: 'Send SMS and handle voice calls',
      icon: MessageSquare,
      fields: [
        { name: 'account_sid', label: 'Account SID', type: 'text', required: true },
        { name: 'auth_token', label: 'Auth Token', type: 'password', required: true },
        { name: 'phone_number', label: 'Phone Number', type: 'tel', required: true }
      ]
    },
    {
      provider: 'google_calendar',
      name: 'Google Calendar',
      description: 'Sync appointments with Google Calendar',
      icon: Calendar,
      fields: [
        { name: 'client_id', label: 'Client ID', type: 'text', required: true },
        { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { name: 'calendar_id', label: 'Calendar ID', type: 'text', required: false }
      ]
    },
    {
      provider: 'stripe',
      name: 'Stripe Payments',
      description: 'Accept online payments',
      icon: CreditCard,
      fields: [
        { name: 'publishable_key', label: 'Publishable Key', type: 'text', required: true },
        { name: 'secret_key', label: 'Secret Key', type: 'password', required: true }
      ]
    },
    {
      provider: 'quickbooks',
      name: 'QuickBooks',
      description: 'Sync invoices and financial data',
      icon: Building,
      fields: [
        { name: 'client_id', label: 'App Client ID', type: 'text', required: true },
        { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { name: 'company_id', label: 'Company ID', type: 'text', required: false }
      ]
    }
  ];

  const IntegrationCard = ({ integration }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({});
    const isConnected = settings?.integrations?.[integration.provider]?.status === 'connected';
    
    const handleSubmit = (e) => {
      e.preventDefault();
      handleConnect(integration.provider, formData);
      setIsExpanded(false);
      setFormData({});
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <integration.icon className="w-8 h-8 text-[#0070E0]" />
              <div>
                <CardTitle className="text-[#0B0F19]">{integration.name}</CardTitle>
                <CardDescription className="text-[#64748B]">{integration.description}</CardDescription>
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
              disabled={connecting[integration.provider]}
              variant={isConnected ? "outline" : "default"}
            >
              {connecting[integration.provider] ? 'Connecting...' : isConnected ? 'Reconfigure' : 'Connect'}
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {integration.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label className="text-[#0B0F19] font-medium">{field.label}</Label>
                  <Input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({...prev, [field.name]: e.target.value}))}
                    placeholder={`Enter ${field.label}`}
                    required={field.required}
                  />
                </div>
              ))}
              <div className="flex space-x-2">
                <Button type="submit" disabled={connecting[integration.provider]}>
                  {connecting[integration.provider] ? 'Saving...' : 'Save Credentials'}
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
        <h2 className="text-2xl font-bold text-[#0B0F19]">Integrations</h2>
        <p className="text-[#64748B]">Connect external services and store credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.provider} integration={integration} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0B0F19]">Integration Status</CardTitle>
          <CardDescription className="text-[#64748B]">Overview of connected services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrations.map((integration) => (
              <div key={integration.provider} className="text-center p-3 border rounded-lg">
                <p className="font-medium text-[#0B0F19] capitalize">{integration.provider.replace('_', ' ')}</p>
                <Badge variant={settings?.integrations?.[integration.provider]?.status === 'connected' ? 'default' : 'secondary'} className="mt-1">
                  {settings?.integrations?.[integration.provider]?.status === 'connected' ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(['integrations'])} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

// Main Settings Component
const Settings = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('business');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [currentUser?.company_id]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(`/api/settings/${currentUser?.company_id || 'company-001'}`);
      
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

  const handleSettingsChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async (sections) => {
    setSaving(true);
    try {
      const settingsToUpdate = {};
      sections.forEach(section => {
        settingsToUpdate[section] = settings[section];
      });

      const response = await authService.authenticatedFetch('/api/settings/update', {
        method: 'POST',
        body: JSON.stringify(settingsToUpdate)
      });
      
      if (response.ok) {
        alert('✅ Settings saved successfully!');
        // Refresh to verify persistence
        await fetchSettings();
      } else {
        alert('❌ Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('❌ Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderSection = () => {
    const sectionProps = {
      settings,
      onSettingsChange: handleSettingsChange,
      onSave: handleSave,
      saving
    };

    switch (activeTab) {
      case 'business':
        return <BusinessSection {...sectionProps} />;
      case 'ai':
        return <AISection {...sectionProps} />;
      case 'sms':
        return <SMSSection {...sectionProps} />;
      case 'calendar':
        return <CalendarSection {...sectionProps} />;
      case 'notifications':
        return <NotificationsSection {...sectionProps} />;
      case 'billing':
        return <BillingSection {...sectionProps} />;
      case 'service_areas':
        return <ServiceAreasSection {...sectionProps} />;
      case 'integrations':
        return <IntegrationsSection {...sectionProps} />;
      default:
        return <BusinessSection {...sectionProps} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Settings Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#0B0F19]">Settings</h2>
          <p className="text-sm text-[#64748B]">Manage your HVAC Pro configuration</p>
        </div>
        
        <nav className="space-y-2">
          {settingsNavigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center space-x-3 w-full px-3 py-2 text-left rounded-lg transition-colors",
                activeTab === item.id
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-8 bg-gray-50 overflow-auto">
        {renderSection()}
      </div>
    </div>
  );
};

export default Settings;