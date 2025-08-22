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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn, formatTime } from '../lib/utils';
import authService from '../utils/auth';

const ScheduleAppointmentDialog = ({ open, onOpenChange, onScheduleAppointment }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    customer_name: '',
    service_type: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onScheduleAppointment(formData);
    setFormData({ title: '', description: '', scheduled_date: '', customer_name: '', service_type: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule New Appointment</DialogTitle>
          <DialogDescription>
            Schedule a service appointment for a customer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Customer name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="HVAC Service - No Heat"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Service description"
              />
            </div>
            
            <div>
              <Label htmlFor="service_type">Service Type *</Label>
              <Input
                id="service_type"
                value={formData.service_type}
                onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
                placeholder="no_heat, no_cool, maintenance, plumbing"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="scheduled_date">Date & Time *</Label>
              <Input
                id="scheduled_date"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule Appointment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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
            <Button size="sm" variant="outline" onClick={() => console.log('View appointment:', appointment.id)}>
              View Details
            </Button>
            <Button size="sm" onClick={() => console.log('Edit appointment:', appointment.id)}>
              Edit
            </Button>
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
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'calendar'
  const [calendarData, setCalendarData] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  useEffect(() => {
    fetchAppointments();
    if (view === 'calendar') {
      fetchCalendarData();
    }
  }, [currentUser?.company_id, filter, view]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      let endpoint = `appointments?company_id=${currentUser?.company_id || 'company-001'}`;
      
      // If filtering by specific status, use filter endpoint
      if (filter !== 'all') {
        endpoint = `/api/appointments/filter?status=${filter}`;
      }
      
      const response = await authService.authenticatedFetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        // Handle both direct array and wrapped response
        const appointmentList = data.appointments || data;
        setAppointments(Array.isArray(appointmentList) ? appointmentList : []);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    try {
      setLoadingCalendar(true);
      const response = await authService.authenticatedFetch('/api/appointments/calendar');
      
      if (response.ok) {
        const data = await response.json();
        setCalendarData(data.appointments || []);
      } else {
        setCalendarData([]);
      }
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
      setCalendarData([]);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleScheduleAppointment = async (appointmentData) => {
    try {
      const response = await authService.authenticatedFetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: currentUser?.company_id || 'company-001',
          customer_id: 'temp-customer-id', // In real app, would select from customers
          ...appointmentData,
          scheduled_date: new Date(appointmentData.scheduled_date).toISOString(),
          estimated_duration: 60,
          source: 'manual'
        })
      });
      
      if (response.ok) {
        const newAppointment = await response.json();
        setAppointments(prev => [newAppointment, ...prev]);
        setShowScheduleForm(false);
      } else {
        console.error('Failed to schedule appointment');
      }
    } catch (err) {
      console.error('Error scheduling appointment:', err);
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
          {!aiVoiceEnabled && (
            <Button onClick={() => setShowScheduleForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          )}
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
      {/* Schedule Appointment Dialog */}
      <ScheduleAppointmentDialog 
        open={showScheduleForm} 
        onOpenChange={setShowScheduleForm}
        onScheduleAppointment={handleScheduleAppointment}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage and schedule customer appointments</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex rounded-lg border border-gray-200 p-1">
            <Button
              variant={view === 'list' ? "default" : "ghost"}
              size="sm"
              onClick={() => setView('list')}
              className="h-8"
            >
              List
            </Button>
            <Button
              variant={view === 'calendar' ? "default" : "ghost"}
              size="sm"
              onClick={() => setView('calendar')}
              className="h-8"
            >
              <CalendarView className="w-4 h-4 mr-1" />
              Calendar
            </Button>
          </div>
          {!aiVoiceEnabled && (
            <Button onClick={() => setShowScheduleForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Status Tabs - Enhanced for PHASE 3 */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.value)}
            className={filter === option.value ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {option.label}
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {option.value === 'all' 
                ? appointments.length 
                : appointments.filter(a => a.status === option.value).length}
            </span>
          </Button>
        ))}
      </div>

      {/* Appointments Content - List or Calendar View */}
      {view === 'calendar' ? (
        <AppointmentCalendarView 
          appointments={calendarData.length > 0 ? calendarData : appointments} 
          loading={loadingCalendar || loading}
        />
      ) : (
        <>
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
                    {filter === 'all' && !aiVoiceEnabled && (
                      <Button onClick={() => setShowScheduleForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule Your First Appointment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Appointment Calendar View Component
const AppointmentCalendarView = ({ appointments, loading }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'border-l-emerald-500 bg-emerald-50';
      case 'scheduled': return 'border-l-blue-500 bg-blue-50';  
      case 'in_progress': return 'border-l-amber-500 bg-amber-50';
      case 'completed': return 'border-l-emerald-500 bg-emerald-50';
      case 'cancelled': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-300 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const date = new Date(appointment.start || appointment.scheduled_date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(appointment);
    return acc;
  }, {});

  const sortedDates = Object.keys(appointmentsByDate).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="space-y-6">
      {sortedDates.length > 0 ? (
        sortedDates.map((date) => (
          <div key={date}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
              })}
            </h3>
            <div className="space-y-2">
              {appointmentsByDate[date].map((appointment) => (
                <Card key={appointment.id} className={`border-l-4 ${getStatusColor(appointment.status)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium text-gray-800">{appointment.title}</h4>
                            <p className="text-sm text-gray-600">{appointment.customer_name}</p>
                          </div>
                          {appointment.source === 'ai-voice' && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                              AI Voice
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{formatTime(appointment.start || appointment.scheduled_date)}</span>
                          {appointment.technician && (
                            <span>• {appointment.technician}</span>
                          )}
                          <span>• {appointment.status}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No appointments scheduled</h3>
          <p className="text-gray-600">Your calendar is empty. Schedule some appointments to get started.</p>
        </div>
      )}
    </div>
  );
};

export default Appointments;