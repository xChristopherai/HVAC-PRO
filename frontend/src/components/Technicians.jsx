import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import authService from '../utils/auth';

const StatusBadge = ({ status }) => {
  const configs = {
    available: { label: 'Available', variant: 'success', icon: CheckCircle },
    busy: { label: 'Busy', variant: 'warning', icon: Clock },
    off_duty: { label: 'Off Duty', variant: 'secondary', icon: User },
    unavailable: { label: 'Unavailable', variant: 'destructive', icon: AlertCircle },
  };
  
  const config = configs[status] || configs.off_duty;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="flex items-center space-x-1">
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </Badge>
  );
};

const TechnicianCard = ({ technician }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">{technician.name}</CardTitle>
              <div className="flex items-center space-x-2">
                <StatusBadge status={technician.status} />
                {technician.is_lead && (
                  <Badge variant="outline" className="text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    Lead Tech
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{technician.phone}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="truncate">{technician.email}</span>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <p className="text-sm font-medium">{technician.jobs_completed || 0}</p>
            <p className="text-xs text-muted-foreground">Jobs Completed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <p className="text-sm font-medium">{technician.average_rating?.toFixed(1) || 'N/A'}</p>
            </div>
            <p className="text-xs text-muted-foreground">Avg Rating</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="pt-2 flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Calendar className="w-3 h-3 mr-1" />
            Schedule
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline">
            <Edit className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Technicians = ({ currentUser }) => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddTechnician, setShowAddTechnician] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchTechnicians();
  }, [currentUser?.company_id, statusFilter]);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      
      let endpoint = `technicians?company_id=${currentUser?.company_id || 'company-001'}`;
      
      // If filtering by specific status, use search endpoint
      if (statusFilter !== 'all') {
        endpoint = `/api/technicians/search?status=${statusFilter}`;
      }
      
      const response = await authService.authenticatedFetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        // Handle both direct array and wrapped response
        const technicianList = data.technicians || data;
        setTechnicians(Array.isArray(technicianList) ? technicianList : []);
      } else {
        setTechnicians([]);
      }
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setSearching(true);
      let endpoint = `/api/technicians/search?q=${encodeURIComponent(searchTerm)}`;
      if (statusFilter !== 'all') {
        endpoint += `&status=${statusFilter}`;
      }
      
      const response = await authService.authenticatedFetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.technicians || []);
      } else {
        console.error('Failed to search technicians');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching technicians:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddTechnician = async (technicianData) => {
    try {
      const response = await authService.authenticatedFetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: currentUser?.company_id || 'company-001',
          ...technicianData
        })
      });
      
      if (response.ok) {
        const newTechnician = await response.json();
        
        // Update technicians list
        setTechnicians(prev => [newTechnician, ...prev]);
        
        // If there's a search term, refresh search results
        if (searchTerm.trim()) {
          await handleSearch();
        }
        
        setShowAddTechnician(false);
        console.log('Technician added successfully:', newTechnician);
      } else {
        console.error('Failed to add technician');
      }
    } catch (err) {
      console.error('Error adding technician:', err);
    }
  };

  const filteredTechnicians = searchTerm.trim() ? searchResults : (technicians || []).filter(tech => {
    const matchesSearch = tech.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tech.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tech.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || tech.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'available', label: 'Available' },
    { value: 'busy', label: 'Busy' },
    { value: 'off_duty', label: 'Off Duty' },
    { value: 'unavailable', label: 'Unavailable' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Technicians</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Technician
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-6 bg-muted rounded"></div>
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
          <h1 className="text-3xl font-bold">Technicians</h1>
          <p className="text-muted-foreground">Manage your technician team</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Technician
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search technicians..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Technicians', count: technicians.length, color: 'text-blue-600' },
          { label: 'Available', count: technicians.filter(t => t.status === 'available').length, color: 'text-green-600' },
          { label: 'Busy', count: technicians.filter(t => t.status === 'busy').length, color: 'text-amber-600' },
          { label: 'Lead Technicians', count: technicians.filter(t => t.is_lead).length, color: 'text-purple-600' },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.count}</p>
                </div>
                <Wrench className={cn("w-8 h-8", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechnicians.length > 0 ? (
          filteredTechnicians.map((technician) => (
            <TechnicianCard key={technician.id} technician={technician} />
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No technicians found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No technicians match your search criteria.' 
                    : "You haven't added any technicians yet."
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Technician
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

export default Technicians;
