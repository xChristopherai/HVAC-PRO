import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, MoreHorizontal, Phone, Mail, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn, formatDate } from '../lib/utils';

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

// Customer Row Component
const CustomerRow = ({ customer }) => {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{customer.name}</p>
            <p className="text-xs text-muted-foreground">{customer.email || 'No email'}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-sm text-muted-foreground">
          <Phone className="w-4 h-4 mr-2" />
          {customer.phone}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2" />
          {customer.address?.city || 'No address'}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(customer.created_at)}
      </TableCell>
      <TableCell>
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
          Active
        </span>
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

const Customers = ({ currentUser }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock customers data
  const mockCustomers = [
    {
      id: '1',
      name: 'Tom Harris',
      email: 'tom@example.com',
      phone: '+1-555-123-4567',
      address: { city: 'Springfield' },
      created_at: '2025-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1-555-234-5678',
      address: { city: 'Riverside' },
      created_at: '2025-01-10T14:30:00Z'
    },
    {
      id: '3',
      name: 'Mike Davis',
      email: null,
      phone: '+1-555-345-6789',
      address: { city: 'Arlington' },
      created_at: '2025-01-08T09:15:00Z'
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setCustomers(mockCustomers);
      setLoading(false);
    }, 500);
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Manage your customer base</p>
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-lg"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer base</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            {customers.length} total customers
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6">
              <EmptyState 
                icon={Users}
                title="No customers found"
                description={searchQuery ? "Try adjusting your search" : "Start by adding your first customer"}
                action="Add Customer"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;