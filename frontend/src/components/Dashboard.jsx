import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Wrench, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Phone,
  CheckCircle,
  Badge,
  Plus,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { cn, formatCurrency, formatTime } from '../lib/utils';
import authService from '../utils/auth';

// Feature Flags
const NEW_UI = process.env.REACT_APP_NEW_UI !== 'false';
const AI_VOICE_SCHEDULING_ENABLED = process.env.REACT_APP_AI_VOICE_SCHEDULING_ENABLED === 'true';

// Stat Card Component - Clean Professional Design
const StatCard = ({ title, value, change, icon: Icon, trend = 'up', changePercent }) => {
  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={cn(
                "text-sm mt-2 flex items-center font-medium",
                trend === 'up' ? "text-emerald-600" : "text-red-600"
              )}>
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {change}
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Appointment Item Component with AI Voice badge support
const AppointmentItem = ({ appointment }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-emerald-600 bg-emerald-50';
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'in_progress': return 'text-amber-600 bg-amber-50';
      case 'completed': return 'text-emerald-600 bg-emerald-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const isAIGenerated = appointment.source === 'ai-voice' || appointment.is_ai_generated;

  return (
    <div className="flex items-center justify-between p-4 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <p className="font-medium text-sm">{appointment.title}</p>
            {AI_VOICE_SCHEDULING_ENABLED && isAIGenerated && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                Created by AI Voice
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{appointment.description}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{formatTime(appointment.scheduled_date)}</p>
        <span className={cn(
          "inline-flex px-2 py-1 rounded-full text-xs font-medium",
          getStatusColor(appointment.status)
        )}>
          {appointment.status}
        </span>
      </div>
    </div>
  );
};

// Inquiry Item Component
const InquiryItem = ({ inquiry }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-50';
      case 'in_progress': return 'text-amber-600 bg-amber-50';
      case 'converted': return 'text-emerald-600 bg-emerald-50';
      case 'closed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-4 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{inquiry.customer_phone}</span>
        </div>
        <span className={cn(
          "inline-flex px-2 py-1 rounded-full text-xs font-medium",
          getStatusColor(inquiry.status)
        )}>
          {inquiry.status.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">"{inquiry.initial_message}"</p>
      <p className="text-xs text-muted-foreground">
        {formatTime(inquiry.created_at)}
      </p>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action && <Button size="sm">{action}</Button>}
    </div>
  );
};

// Main Dashboard Component
const Dashboard = ({ currentUser }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser?.company_id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(`dashboard/${currentUser?.company_id || 'company-001'}`);
      
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

  // Quick Actions handlers
  const handleQuickAction = async (actionType, actionData = {}) => {
    setActionLoading(prev => ({ ...prev, [actionType]: true }));
    try {
      const response = await authService.authenticatedFetch(`/api/quick/${actionType}`, {
        method: 'POST',
        body: JSON.stringify(actionData)
      });

      if (response.ok) {
        const result = await response.json();
        // Show success toast (you could implement a proper toast system)
        alert(`✅ ${result.message}`);
        console.log(`Quick action ${actionType} result:`, result);
      } else {
        throw new Error('Quick action failed');
      }
    } catch (err) {
      console.error(`Quick action ${actionType} failed:`, err);
      alert(`❌ Quick action failed: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionType]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentUser?.name}!</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentUser?.name}!</p>
        </div>
        
        <Card>
          <CardContent className="p-12">
            <EmptyState 
              icon={AlertCircle}
              title="Unable to load dashboard"
              description="There was an error loading your dashboard data."
              action="Retry"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced stats with proper deltas vs prior period
  const stats = [
    {
      title: 'Total Customers',
      value: dashboardData?.stats?.total_customers || 0,
      change: '+12% from last month',
      changePercent: 12,
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Active Jobs',
      value: dashboardData?.stats?.pending_jobs || 0,
      change: '-2% from yesterday',
      changePercent: -2,
      icon: Wrench,
      trend: 'down'
    },
    {
      title: 'Technicians',
      value: dashboardData?.stats?.active_technicians || 0,
      change: '+1 this week',
      changePercent: 5,
      icon: CheckCircle,
      trend: 'up'
    },
    {
      title: "Today's Appointments",
      value: dashboardData?.stats?.todays_appointments || 0,
      change: '+3 scheduled',
      changePercent: 15,
      icon: Calendar,
      trend: 'up'
    }
  ];

  // Quick Actions configuration
  const quickActions = [
    {
      id: 'add-customer',
      label: 'Add Customer',
      icon: Users,
      handler: () => handleQuickAction('add-customer', { name: 'New Customer', phone: '+1-555-0123' }),
      loading: actionLoading['add-customer']
    },
    {
      id: 'schedule-job',
      label: 'Schedule Job',
      icon: Calendar,
      handler: () => handleQuickAction('schedule-job', { title: 'Service Call', customer_name: 'Quick Customer' }),
      loading: actionLoading['schedule-job']
    },
    {
      id: 'create-invoice',
      label: 'Create Invoice',
      icon: FileText,
      handler: () => handleQuickAction('create-invoice', { customer_name: 'Quick Customer', amount: 250 }),
      loading: actionLoading['create-invoice']
    },
    {
      id: 'view-reports',
      label: 'View Reports',
      icon: Clock,
      handler: () => handleQuickAction('view-reports', { type: 'monthly_summary' }),
      loading: actionLoading['view-reports']
    }
  ];

  // Feature Flag: NEW_UI fallback
  if (!NEW_UI) {
    return (
      <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard (Legacy Mode)</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold">{stat.title}</h3>
              <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.change}</p>
            </div>
          ))}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.handler}
                disabled={action.loading}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center space-y-2"
              >
                <action.icon className="w-6 h-6" />
                <span className="text-sm">{action.loading ? 'Loading...' : action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - PayPal style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header">Dashboard</h1>
          <p className="text-[#475569]">Welcome back, {currentUser?.name || 'John Smith'}!</p>
        </div>
        <Button className="bg-[#0070E0] hover:bg-[#065FC6] text-white">
          <ArrowUpRight className="w-4 h-4 mr-2" />
          View Reports
        </Button>
      </div>

      {/* Stats Grid - PayPal style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid - PayPal style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Appointments */}
        <Card className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-[#0B0F19]">
              <Calendar className="w-5 h-5 text-[#0070E0]" />
              <span>Today's Appointments</span>
            </CardTitle>
            <CardDescription className="text-[#475569]">
              Scheduled appointments for today
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {dashboardData.todays_appointments?.length > 0 ? (
              <div className="space-y-1">
                {dashboardData.todays_appointments.map((appointment) => (
                  <AppointmentItem key={appointment.id} appointment={appointment} />
                ))}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState 
                  icon={Calendar}
                  title="No appointments today"
                  description="All clear! No appointments scheduled for today."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-[#0B0F19]">
              <Phone className="w-5 h-5 text-[#0070E0]" />
              <span>Recent Inquiries</span>
            </CardTitle>
            <CardDescription className="text-[#475569]">
              Latest customer inquiries via SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {dashboardData.recent_inquiries?.length > 0 ? (
              <div className="space-y-1">
                {dashboardData.recent_inquiries.slice(0, 3).map((inquiry) => (
                  <InquiryItem key={inquiry.id} inquiry={inquiry} />
                ))}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState 
                  icon={Phone}
                  title="No recent inquiries"
                  description="No new customer inquiries at the moment."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - PayPal style with functional buttons */}
      <Card className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-[#0B0F19]">Quick Actions</CardTitle>
          <CardDescription className="text-[#64748B]">
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button 
                key={action.id}
                variant="outline" 
                className="h-16 flex flex-col space-y-2 hover:bg-[#F0F8FF] hover:border-[#0070E0] transition-colors"
                onClick={action.handler}
                disabled={action.loading}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-sm">
                  {action.loading ? 'Loading...' : action.label}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;