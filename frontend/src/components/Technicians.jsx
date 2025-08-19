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

const SkillBadge = ({ skill, level }) => {
  const levelColors = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-yellow-100 text-yellow-800', 
    3: 'bg-green-100 text-green-800',
    4: 'bg-blue-100 text-blue-800',
    5: 'bg-purple-100 text-purple-800'
  };
  
  return (
    <Badge 
      variant="secondary" 
      className={cn("text-xs", levelColors[level] || 'bg-gray-100 text-gray-800')}
    >
      {skill}
      {level && <span className="ml-1">★{level}</span>}
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

        {/* Skills */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Skills</p>
          <div className="flex flex-wrap gap-1">
            {technician.skills?.slice(0, 4).map((skill, index) => (
              <SkillBadge key={index} skill={skill.name} level={skill.level} />
            )) || <span className="text-sm text-muted-foreground">No skills listed</span>}
            {technician.skills?.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{technician.skills.length - 4} more
              </Badge>
            )}
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

        {/* Availability */}
        {technician.availability && (
          <div className="space-y-2">
            <p className="text-sm font-medium">This Week</p>
            <div className="text-xs text-muted-foreground">
              {technician.availability.hours_this_week || 0}h scheduled
            </div>
          </div>
        )}
        
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

  useEffect(() => {
    fetchTechnicians();
  }, [currentUser?.company_id]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(`technicians?company_id=${currentUser?.company_id || 'company-001'}`);
      
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data);
      }
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTechnicians = technicians.filter(tech => {
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
            "inline-flex px-2 py-1 rounded-full text-xs font-medium",
            technician.is_active ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
          )}>
            {technician.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rating</span>
            <div className="flex items-center space-x-1">
              {renderStars(technician.average_rating)}
              <span className="text-xs text-muted-foreground ml-1">
                ({technician.total_ratings} reviews)
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Jobs Completed</span>
            <span className="font-medium">{technician.total_jobs_completed}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <Phone className="w-3 h-3 mr-2" />
            {technician.phone}
          </div>
          {technician.email && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Mail className="w-3 h-3 mr-2" />
              {technician.email}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Technicians = ({ currentUser }) => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock technicians data
  const mockTechnicians = [
    {
      id: '1',
      name: 'Diana Foster',
      email: 'diana@hvacpro.com',
      phone: '+1-555-111-2222',
      specialties: ['AC Repair', 'Installation'],
      is_active: true,
      average_rating: 4.8,
      total_ratings: 24,
      total_jobs_completed: 156
    },
    {
      id: '2',
      name: 'Alex Rodriguez',
      email: 'alex@hvacpro.com',
      phone: '+1-555-222-3333',
      specialties: ['Maintenance', 'Emergency Service'],
      is_active: true,
      average_rating: 4.5,
      total_ratings: 18,
      total_jobs_completed: 89
    },
    {
      id: '3',
      name: 'Brian Campbell',
      email: 'brian@hvacpro.com',
      phone: '+1-555-333-4444',
      specialties: ['HVAC Repair', 'Installation'],
      is_active: true,
      average_rating: 4.2,
      total_ratings: 31,
      total_jobs_completed: 124
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setTechnicians(mockTechnicians);
      setLoading(false);
    }, 500);
  }, []);

  const filteredTechnicians = technicians.filter(technician =>
    technician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    technician.specialties?.some(specialty => 
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Technicians</h1>
            <p className="text-muted-foreground">Manage your team of technicians</p>
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
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
          <p className="text-muted-foreground">Manage your team of technicians</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Technician
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search technicians..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Technicians Grid */}
      {filteredTechnicians.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTechnicians.map((technician) => (
            <TechnicianCard key={technician.id} technician={technician} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <EmptyState 
              icon={Wrench}
              title="No technicians found"
              description={searchQuery ? "Try adjusting your search" : "Start by adding your first technician"}
              action="Add Technician"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Technicians;