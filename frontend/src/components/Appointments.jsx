import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, Clock, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn, formatDate, formatTime } from '../lib/utils';

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Button size="sm">
        <Plus className="w-4 h-4 mr-2" />
        {action}
      </Button>
    </div>
  );
};

// Appointment Card Component
const AppointmentCard = ({ appointment }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'in_progress': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', getPriorityColor(appointment.priority))}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-sm mb-1">{appointment.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{appointment.description}</p>
          </div>
          <span className={cn(
            "inline-flex px-2 py-1 rounded-full text-xs font-medium",
            getStatusColor(appointment.status)
          )}>
            {appointment.status}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-2" />
            {formatDate(appointment.scheduled_date)} at {formatTime(appointment.scheduled_date)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="w-3 h-3 mr-2" />
            Customer: Tom Harris
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 mr-2" />
            Springfield, IL
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Appointments = ({ currentUser }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState('all');

  // Mock appointments data
  const mockAppointments = [
    {
      id: '1',
      title: 'AC Repair - Tom Harris',
      description: 'Air conditioning unit not cooling properly',
      scheduled_date: '2025-08-19T15:30:00Z',
      status: 'confirmed',
      priority: 'high'
    },
    {
      id: '2',
      title: 'System Maintenance - Sarah Johnson',
      description: 'Regular HVAC system maintenance',
      scheduled_date: '2025-08-20T10:00:00Z',
      status: 'scheduled',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Duct Cleaning - Mike Davis',
      description: 'Complete duct cleaning service',
      scheduled_date: '2025-08-21T14:00:00Z',
      status: 'scheduled',
      priority: 'low'
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setAppointments(mockAppointments);
      setLoading(false);
    }, 500);
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedView === 'today') {
      const today = new Date().toDateString();
      const appointmentDate = new Date(appointment.scheduled_date).toDateString();
      return matchesSearch && appointmentDate === today;
    }
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-muted-foreground">Manage scheduled appointments</p>
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage scheduled appointments</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={selectedView === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedView('all')}
          >
            All
          </Button>
          <Button 
            variant={selectedView === 'today' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedView('today')}
          >
            Today
          </Button>
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Appointments Grid */}
      {filteredAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <EmptyState 
              icon={Calendar}
              title="No appointments found"
              description={searchQuery ? "Try adjusting your search" : "No appointments scheduled"}
              action="Schedule Appointment"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Appointments;