import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Wrench, 
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Phone,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { cn, formatCurrency, formatTime } from '../lib/utils';
import authService from '../utils/auth';

// Stat Card Component
const StatCard = ({ title, value, change, icon: Icon, trend = 'up' }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className={cn(
                "text-xs mt-1 flex items-center",
                trend === 'up' ? "text-green-600" : "text-red-600"
              )}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {change}
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Appointment Item Component
const AppointmentItem = ({ appointment }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'in_progress': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">{appointment.title}</p>
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
      case 'in_progress': return 'text-yellow-600 bg-yellow-50';
      case 'converted': return 'text-green-600 bg-green-50';
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

  const stats = [
    {
      title: 'Total Customers',
      value: dashboardData.stats.total_customers,
      change: '+12% from last month',
      icon: Users
    },
    {
      title: 'Active Jobs',
      value: dashboardData.stats.pending_jobs,
      change: '-2% from yesterday',
      icon: Wrench,
      trend: 'down'
    },
    {
      title: 'Technicians',
      value: dashboardData.stats.active_technicians,
      change: '+1 this week',
      icon: CheckCircle
    },
    {
      title: "Today's Appointments",
      value: dashboardData.stats.todays_appointments,
      change: '+3 scheduled',
      icon: Calendar
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentUser?.name}!</p>
        </div>
        <Button>
          <ArrowUpRight className="w-4 h-4 mr-2" />
          View Reports
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Today's Appointments</span>
            </CardTitle>
            <CardDescription>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Recent Inquiries</span>
            </CardTitle>
            <CardDescription>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex flex-col space-y-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">Add Customer</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col space-y-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Schedule Job</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col space-y-2">
              <Wrench className="w-5 h-5" />
              <span className="text-sm">Create Invoice</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col space-y-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;