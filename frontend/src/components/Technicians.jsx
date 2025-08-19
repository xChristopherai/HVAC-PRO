import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Search, Star, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

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

// Technician Card Component
const TechnicianCard = ({ technician }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={cn(
          "w-4 h-4",
          i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
        )} 
      />
    ));
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">{technician.name}</h3>
            <p className="text-xs text-muted-foreground">{technician.specialties?.join(', ')}</p>
          </div>
          <span className={cn(
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