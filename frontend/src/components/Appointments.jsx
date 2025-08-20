import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Filter,
  Clock,
  User,
  MapPin,
  Wrench,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Calendar as CalendarView
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn, formatTime } from '../lib/utils';
import authService from '../utils/auth';

const StatusBadge = ({ status }) => {
  const configs = {
    scheduled: { label: 'Scheduled', variant: 'default', icon: CalendarIcon },
    confirmed: { label: 'Confirmed', variant: 'success', icon: CheckCircle },
    in_progress: { label: 'In Progress', variant: 'warning', icon: PlayCircle },
    completed: { label: 'Completed', variant: 'success', icon: CheckCircle },
    cancelled: { label: 'Cancelled', variant: 'destructive', icon: AlertCircle },
  };
  
  const config = configs[status] || configs.scheduled;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="flex items-center space-x-1">
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </Badge>
  );
};

const AppointmentCard = ({ appointment }) => {
  const isAIGenerated = appointment.source === 'ai-voice' || appointment.is_ai_generated;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{appointment.title}</CardTitle>
            <CardDescription>{appointment.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status={appointment.status} />
            {isAIGenerated && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                AI Voice
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2 text-sm">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span>{formatTime(appointment.scheduled_date)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{appointment.duration || '60'} minutes</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{appointment.customer_name}</span>
          </div>
          
          {appointment.technician_name && (
            <div className="flex items-center space-x-2 text-sm">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <span>{appointment.technician_name}</span>
            </div>
          )}
        </div>
        
        {appointment.address && (
          <div className="flex items-start space-x-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{appointment.address}</span>
          </div>
        )}
        
        <div className="pt-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Job #{appointment.job_id}
          </div>
          
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">View Details</Button>
            <Button size="sm">Edit</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Appointments = ({ currentUser, aiVoiceEnabled }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, [currentUser?.company_id]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(`appointments?company_id=${currentUser?.company_id || 'company-001'}`);
      
      if (response.ok) {
        const data = await response.json();
        // Ensure data is always an array
        setAppointments(Array.isArray(data) ? data : []);
      } else {
        // Set empty array on error
        setAppointments([]);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      // Set empty array on exception  
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = (appointments || []).filter(appointment => {
    if (filter === 'all') return true;
    return appointment.status === filter;
  });

  const filterOptions = [
    { value: 'all', label: 'All Appointments' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Appointments</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="h-8 bg-muted rounded"></div>
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
          <p className="text-muted-foreground">Manage and schedule customer appointments</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <CalendarView className="w-4 h-4 mr-2" />
            Calendar View
          </Button>
          {!aiVoiceEnabled && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today', count: appointments.filter(a => new Date(a.scheduled_date).toDateString() === new Date().toDateString()).length, color: 'text-blue-600' },
          { label: 'This Week', count: appointments.length, color: 'text-green-600' },
          { label: 'Confirmed', count: appointments.filter(a => a.status === 'confirmed').length, color: 'text-emerald-600' },
          { label: 'In Progress', count: appointments.filter(a => a.status === 'in_progress').length, color: 'text-amber-600' },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.count}</p>
                </div>
                <CalendarIcon className={cn("w-8 h-8", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No appointments found</h3>
                <p className="text-muted-foreground mb-4">
                  {filter !== 'all' 
                    ? `No appointments with status "${filter}".` 
                    : "You haven't scheduled any appointments yet."
                  }
                </p>
                {filter === 'all' && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Your First Appointment
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;