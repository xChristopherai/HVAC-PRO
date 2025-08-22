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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { cn } from '../lib/utils';
import StatTile from './ui/StatTile';
import SearchBar from './ui/SearchBar';
import FilterChips from './ui/FilterChips';
import UnifiedCard from './ui/UnifiedCard';
import authService from '../utils/auth';

// Helper function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'available':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'busy':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'off_duty':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'unavailable':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

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
    <Card 
      className="hover:shadow-md transition-shadow"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        color: '#111827'
      }}
    >
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
              <Star className="w-4 h-4 text-amber-500 fill-current" />
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
      
      // Mock demo data for realistic dashboard preview  
      const mockTechnicians = [
        {
          id: 'tech-001',
          name: 'John Smith',
          email: 'john.smith@hvacpro.com',
          phone: '(205) 555-1001',
          specialization: 'Lead Technician',
          role: 'lead',
          is_lead: true,
          status: 'busy',
          rating: 4.9,
          completed_jobs: 120,
          years_experience: 8,
          certifications: ['EPA 608', 'NATE Certified'],
          created_at: '2025-01-15T09:00:00Z'
        },
        {
          id: 'tech-002', 
          name: 'Alex Martinez',
          email: 'alex.martinez@hvacpro.com',
          phone: '(205) 555-1002',
          specialization: 'HVAC Technician',
          role: 'technician',
          is_lead: false,
          status: 'available',
          rating: 4.7,
          completed_jobs: 90,
          years_experience: 5,
          certifications: ['EPA 608'],
          created_at: '2025-02-20T10:30:00Z'
        },
        {
          id: 'tech-003',
          name: 'Kevin Lee', 
          email: 'kevin.lee@hvacpro.com',
          phone: '(205) 555-1003',
          specialization: 'HVAC Technician',
          role: 'technician',
          is_lead: false,
          status: 'available',
          rating: 4.5,
          completed_jobs: 45,
          years_experience: 2,
          certifications: ['EPA 608'],
          created_at: '2025-04-10T14:15:00Z'
        },
        {
          id: 'tech-004',
          name: 'Sam Carter',
          email: 'sam.carter@hvacpro.com',
          phone: '(205) 555-1004', 
          specialization: 'HVAC Technician',
          role: 'technician',
          is_lead: false,
          status: 'off_duty',
          rating: 4.3,
          completed_jobs: 32,
          years_experience: 1.5,
          certifications: ['EPA 608'],
          created_at: '2025-05-25T11:20:00Z'
        },
        {
          id: 'tech-005',
          name: 'James Green',
          email: 'james.green@hvacpro.com',
          phone: '(205) 555-1005',
          specialization: 'Junior Technician',
          role: 'technician',
          is_lead: false, 
          status: 'available',
          rating: 4.1,
          completed_jobs: 18,
          years_experience: 0.5,
          certifications: ['EPA 608'],
          created_at: '2025-07-15T08:45:00Z'
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Filter by status if needed
      let filteredTechs = mockTechnicians;
      if (statusFilter !== 'all') {
        filteredTechs = mockTechnicians.filter(tech => tech.status === statusFilter);
      }
      
      setTechnicians(filteredTechs);
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
    <div className="space-y-6" style={{ background: '#F3F4F6' }}>
      {/* Add Technician Dialog */}
      <AddTechnicianDialog 
        open={showAddTechnician} 
        onOpenChange={setShowAddTechnician}
        onAddTechnician={handleAddTechnician}
      />
      
      {/* Header - Appointments Style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Technicians</h1>
          <p className="text-gray-500">Manage your technician team</p>
        </div>
        <Button 
          onClick={() => setShowAddTechnician(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Technician
        </Button>
      </div>

      {/* Search and Filters - Appointments Style */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          placeholder="Search technicians by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          loading={searching}
        />
        <FilterChips
          options={[
            { label: 'All', value: 'all', count: technicians.length },
            { label: 'Available', value: 'available', count: technicians.filter(t => t.status === 'available').length },
            { label: 'Busy', value: 'busy', count: technicians.filter(t => t.status === 'busy').length },
            { label: 'Off Duty', value: 'off_duty', count: technicians.filter(t => t.status === 'off_duty').length }
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Stats Tiles - Appointments Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Technicians"
          value={technicians.length}
          icon={Wrench}
          color="text-blue-600"
        />
        <StatTile
          label="Available"
          value={technicians.filter(t => t.status === 'available').length}
          icon={CheckCircle}
          color="text-emerald-600"
        />
        <StatTile
          label="Busy"
          value={technicians.filter(t => t.status === 'busy').length}
          icon={Clock}
          color="text-amber-600"
        />
        <StatTile
          label="Lead Technicians"
          value={technicians.filter(t => t.is_lead || t.role === 'lead').length}
          icon={Award}
          color="text-emerald-600"
        />
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechnicians.length > 0 ? (
          filteredTechnicians.map((technician) => (
            <UnifiedCard key={technician.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{technician.name}</h3>
                    <p className="text-gray-500">{technician.specialization || 'General HVAC'}</p>
                  </div>
                  <Badge 
                    className={cn(
                      getStatusColor(technician.status),
                      "text-xs font-medium"
                    )}
                  >
                    {technician.status?.replace('_', ' ').toUpperCase() || 'AVAILABLE'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{technician.phone}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{technician.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Star className="w-4 h-4" />
                    <span>Rating: {technician.rating || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {technician.completed_jobs || 0} jobs completed
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2" title="View Technician">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" title="Edit Technician">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2" 
                      title="Schedule"
                      onClick={() => window.location.href = '/appointments'}
                    >
                      <Calendar className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </UnifiedCard>
          ))
        ) : (
          <div className="col-span-full">
            <UnifiedCard className="p-12 text-center">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-900">No technicians found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No technicians match your search criteria.' : "You haven't added any technicians yet."}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowAddTechnician(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Technician
                </Button>
              )}
            </UnifiedCard>
          </div>
        )}
      </div>
    </div>
  );
};

// Add Technician Dialog Component
const AddTechnicianDialog = ({ open, onOpenChange, onAddTechnician }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    years_experience: '',
    availability: '09:00-17:00'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTechnician({
      ...formData,
      years_experience: parseInt(formData.years_experience) || 1,
      skills: ['hvac'], // Default skill
      certifications: []
    });
    setFormData({ name: '', email: '', phone: '', years_experience: '', availability: '09:00-17:00' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Technician</DialogTitle>
          <DialogDescription>
            Add a new technician to your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Technician name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="technician@hvactech.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                min="1"
                max="50"
                value={formData.years_experience}
                onChange={(e) => setFormData(prev => ({ ...prev, years_experience: e.target.value }))}
                placeholder="5"
              />
            </div>
            
            <div>
              <Label htmlFor="availability">Availability</Label>
              <Input
                id="availability"
                value={formData.availability}
                onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                placeholder="09:00-17:00"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Technician</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Technicians;
