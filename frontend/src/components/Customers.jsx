import React, { useState, useEffect } from 'react';
import { 
  Users, 
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
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { cn } from '../lib/utils';
import StatTile from './ui/StatTile';
import SearchBar from './ui/SearchBar';
import FilterChips from './ui/FilterChips';
import UnifiedCard from './ui/UnifiedCard';
import authService from '../utils/auth';

const AddCustomerDialog = ({ open, onOpenChange, onAddCustomer }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddCustomer({
      ...formData,
      address: { full: formData.address }
    });
    setFormData({ name: '', phone: '', email: '', address: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Enter the customer's information to add them to your database.
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
                placeholder="Customer name"
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="customer@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St, City, State 12345"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Customer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Customers = ({ currentUser, aiVoiceEnabled }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [currentUser?.company_id]);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Mock demo data for realistic dashboard preview
      // Designed to match requirements: ~40-50% active, 2-3 new this month, 3-4 repeat customers
      const mockCustomers = [
        // Active customers with jobs (5 total = ~42% of 12)
        {
          id: 'cust-001',
          name: 'Sarah Johnson',
          phone: '(205) 555-1432',
          email: 'sarah.j@email.com',
          address: '1234 Elm Street, Birmingham, AL',
          status: 'Active',
          total_jobs: 2,
          created_at: '2025-06-15T10:00:00Z',
          date_added: '2025-06-15T10:00:00Z',
          last_appointment: '2025-08-10T14:30:00Z'
        },
        {
          id: 'cust-002',
          name: 'Mike Peterson',
          phone: '(205) 555-2211',
          email: 'mikep@email.com',
          address: '567 Oak Avenue, Birmingham, AL',
          status: 'Active',
          total_jobs: 1,
          created_at: '2025-08-21T14:30:00Z',
          date_added: '2025-08-21T14:30:00Z',
          last_appointment: '2025-08-21T14:30:00Z'
        },
        {
          id: 'cust-003',
          name: 'Robert Miller',
          phone: '(205) 555-8321',
          email: 'robertm@email.com',
          address: '890 Pine Road, Birmingham, AL',
          status: 'Active',
          total_jobs: 4,
          created_at: '2025-05-10T09:15:00Z',
          date_added: '2025-05-10T09:15:00Z',
          last_appointment: '2025-08-18T11:00:00Z'
        },
        {
          id: 'cust-004',
          name: 'Jennifer Davis',
          phone: '(205) 555-9876',
          email: 'jennifer.davis@email.com',
          address: '321 Maple Drive, Hoover, AL',
          status: 'Active',
          total_jobs: 3,
          created_at: '2025-07-15T16:20:00Z',
          date_added: '2025-07-15T16:20:00Z',
          last_appointment: '2025-08-20T16:15:00Z'
        },
        {
          id: 'cust-005',
          name: 'David Wilson',
          phone: '(205) 555-4567',
          email: 'davidw@email.com',
          address: '654 Cedar Lane, Vestavia Hills, AL',
          status: 'Active',
          total_jobs: 5,
          created_at: '2025-04-28T11:45:00Z',
          date_added: '2025-04-28T11:45:00Z',
          last_appointment: '2025-08-17T09:30:00Z'
        },

        // Inactive customers (7 total = ~58% of 12)
        {
          id: 'cust-006',
          name: 'Lisa Thompson',
          phone: '(205) 555-7890',
          email: 'lisa.thompson@email.com',
          address: '987 Birch Street, Mountain Brook, AL',
          status: 'Inactive',
          total_jobs: 0,
          created_at: '2025-08-22T08:30:00Z',
          date_added: '2025-08-22T08:30:00Z',
          last_appointment: null
        },
        {
          id: 'cust-007',
          name: 'Michael Brown',
          phone: '(205) 555-3456',
          email: 'mbrown@email.com',
          address: '147 Walnut Avenue, Homewood, AL',
          status: 'Inactive',
          total_jobs: 0,
          created_at: '2025-07-15T13:10:00Z',
          date_added: '2025-07-15T13:10:00Z',
          last_appointment: null
        },
        {
          id: 'cust-008',
          name: 'Amanda Garcia',
          phone: '(205) 555-6543',
          email: 'amanda.g@email.com',
          address: '258 Hickory Place, Pelham, AL',
          status: 'Inactive',
          total_jobs: 0,
          created_at: '2025-06-12T15:25:00Z',
          date_added: '2025-06-12T15:25:00Z',
          last_appointment: null
        },
        {
          id: 'cust-009',
          name: 'Christopher Lee',
          phone: '(205) 555-2468',
          email: 'chris.lee@email.com',
          address: '369 Poplar Road, Chelsea, AL',
          status: 'Inactive',
          total_jobs: 0,
          created_at: '2025-08-18T12:00:00Z',
          date_added: '2025-08-18T12:00:00Z',
          last_appointment: null
        },
        {
          id: 'cust-010',
          name: 'Michelle Martinez',
          phone: '(205) 555-1357',
          email: 'michelle.m@email.com',
          address: '741 Dogwood Drive, Alabaster, AL',
          status: 'Inactive',
          total_jobs: 0,
          created_at: '2025-05-20T10:45:00Z',
          date_added: '2025-05-20T10:45:00Z',
          last_appointment: null
        },
        {
          id: 'cust-011',
          name: 'Kevin Rodriguez',
          phone: '(205) 555-9753',
          email: 'kevin.r@email.com',
          address: '852 Willow Lane, Trussville, AL',
          status: 'Inactive',
          total_jobs: 0,
          created_at: '2025-07-20T17:15:00Z',
          date_added: '2025-07-20T17:15:00Z',
          last_appointment: null
        },
        {
          id: 'cust-012',
          name: 'Rachel White',
          phone: '(205) 555-8642',
          email: 'rachel.white@email.com',
          address: '963 Ash Street, Gardendale, AL',
          status: 'Inactive',
          total_jobs: 0,
          created_at: '2025-06-08T14:20:00Z',
          date_added: '2025-06-08T14:20:00Z',
          last_appointment: null
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setCustomers(mockCustomers);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setSearching(true);
      const response = await authService.authenticatedFetch(`/api/customers/search?q=${encodeURIComponent(searchTerm)}`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.customers || []);
      } else {
        console.error('Failed to search customers');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddCustomer = async (customerData) => {
    try {
      const response = await authService.authenticatedFetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: currentUser?.company_id || 'company-001',
          ...customerData
        })
      });
      
      if (response.ok) {
        const newCustomer = await response.json();
        
        // Update customers list
        setCustomers(prev => [newCustomer, ...prev]);
        
        // If there's a search term, refresh search results to include new customer
        if (searchTerm.trim()) {
          await handleSearch();
        }
        
        setShowAddCustomer(false);
        console.log('Customer added successfully:', newCustomer);
      } else {
        console.error('Failed to add customer');
      }
    } catch (err) {
      console.error('Error adding customer:', err);
    }
  };

  const filteredCustomers = searchTerm.trim() ? searchResults : (customers || []).filter(customer => 
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div id="customers-page" className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Customers</h1>
          <Button onClick={() => setShowAddCustomer(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
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
    <div id="customers-page" className="space-y-6" style={{ background: '#F3F4F6' }}>
      {/* Add Customer Dialog */}
      <AddCustomerDialog 
        open={showAddCustomer} 
        onOpenChange={setShowAddCustomer}
        onAddCustomer={handleAddCustomer}
      />
      
      {/* Header - Appointments Style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage your customer database</p>
        </div>
        <Button 
          onClick={() => setShowAddCustomer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filters - Appointments Style */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          placeholder="Search customers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          loading={searching}
        />
        <Button 
          variant="outline"
          className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
          style={{ backgroundColor: '#FFFFFF', color: '#374151', borderColor: '#D1D5DB' }}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search Results Indicator */}
      {searchTerm.trim() && (
        <div className="flex items-center justify-between py-2 px-4 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {searching ? 'Searching...' : `Found ${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''} matching "${searchTerm}"`}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSearchTerm('')}
            className="text-blue-700 hover:text-blue-800"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Stats Tiles - Appointments Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Customers"
          value={customers.length}
          icon={Users}
          color="text-blue-600"
        />
        <StatTile
          label="Active"
          value={customers.filter(c => c.status === 'Active').length}
          icon={Users}
          color="text-emerald-600"
        />
        <StatTile
          label="New This Month"
          value={customers.filter(c => {
            const created = new Date(c.created_at || c.date_added);
            const now = new Date();
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          }).length}
          icon={Plus}
          color="text-amber-600"
        />
        <StatTile
          label="Repeat Customers"
          value={customers.filter(c => (c.total_jobs || 0) > 1).length}
          icon={Users}
          color="text-emerald-600"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <Card 
              key={customer.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                color: '#111827'
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {customer.customer_type || 'Regular'}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{customer.email}</span>
                </div>
                
                {customer.address && (
                  <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                )}
                
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {customer.total_jobs || 0} jobs
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2" title="View Customer">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" title="Edit Customer">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2" 
                      title="Schedule Appointment"
                      onClick={() => window.location.href = '/appointments'}
                    >
                      <Calendar className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <UnifiedCard className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-900">No customers found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No customers match your search criteria.' : "You haven't added any customers yet."}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowAddCustomer(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Customer
                </Button>
              )}
            </UnifiedCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;