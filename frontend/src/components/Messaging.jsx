import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  Send,
  Phone,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { cn, formatTime } from '../lib/utils';
import authService from '../utils/auth';

const Messaging = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [currentUser?.company_id]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(`conversations?company_id=${currentUser?.company_id || 'company-001'}`);
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => 
    conversation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.customer_phone?.includes(searchTerm) ||
    conversation.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Messaging</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
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
          <h1 className="text-3xl font-bold">Messaging</h1>
          <p className="text-muted-foreground">SMS conversations and templates</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Conversations', count: conversations.length, color: 'text-blue-600' },
          { label: 'Unread Messages', count: conversations.filter(c => c.unread_count > 0).length, color: 'text-red-600' },
          { label: 'Active Today', count: conversations.filter(c => new Date(c.last_message_at).toDateString() === new Date().toDateString()).length, color: 'text-green-600' },
          { label: 'SMS Bridge Active', count: conversations.filter(c => c.is_sms_bridge).length, color: 'text-purple-600' },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.count}</p>
                </div>
                <MessageSquare className={cn("w-8 h-8", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <Card key={conversation.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{conversation.customer_name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{conversation.customer_phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {conversation.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unread_count} new
                      </Badge>
                    )}
                    {conversation.is_sms_bridge && (
                      <Badge variant="secondary" className="text-xs">
                        SMS
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Last Message */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    "{conversation.last_message}"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(conversation.last_message_at)}
                    </span>
                    <div className="flex items-center space-x-1">
                      {conversation.status === 'delivered' ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {conversation.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Job Info */}
                {conversation.job_id && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Job #{conversation.job_id}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {conversation.job_status}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="pt-2 flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Send className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No conversations found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No conversations match your search criteria.' : "No SMS conversations yet."}
                </p>
                {!searchTerm && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Start a Conversation
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

export default Messaging;