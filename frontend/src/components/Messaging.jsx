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
  AlertCircle,
  Paperclip,
  Smile,
  ArrowLeft,
  MoreVertical,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { cn, formatTime } from '../lib/utils';
import authService from '../utils/auth';

// Message Composer Component
const MessageComposer = ({ onSend, isLoading, templates = [] }) => {
  const [message, setMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  
  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message.trim());
      setMessage('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const insertTemplate = (template) => {
    setMessage(template);
    setShowTemplates(false);
  };
  
  return (
    <div className="border-t border-border p-4 space-y-3">
      {/* Template Quick Actions */}
      {showTemplates && (
        <div className="flex flex-wrap gap-2 mb-3">
          {templates.map((template, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => insertTemplate(template.text)}
              className="text-xs"
            >
              {template.name}
            </Button>
          ))}
        </div>
      )}
      
      {/* Message Input */}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={3}
            className="resize-none pr-20"
          />
          <div className="absolute bottom-2 right-2 flex space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowTemplates(!showTemplates)}
              className="h-7 w-7"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
};

// Conversation Thread View
const ConversationThread = ({ conversation, onBack, onSendMessage }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const templates = [
    { name: 'Greeting', text: 'Hello! How can I help you with your HVAC system today?' },
    { name: 'Schedule', text: 'I can schedule a technician to visit you. What time works best?' },
    { name: 'Emergency', text: 'This sounds like an emergency. I\'m dispatching a technician immediately.' },
    { name: 'Quote', text: 'I\'ll have one of our experts prepare a detailed quote for you.' },
    { name: 'Follow-up', text: 'How did everything go with your recent service?' }
  ];
  
  const handleSendMessage = async (messageText) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (onSendMessage) {
        onSendMessage(conversation.id, messageText);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      <div className="border-b border-border p-4 flex items-center space-x-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{conversation.customer_name}</h3>
            <p className="text-sm text-muted-foreground">
              {conversation.customer_phone}
            </p>
          </div>
          {conversation.job_id && (
            <Badge variant="outline" className="text-xs">
              Job #{conversation.job_id}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages?.map((msg, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              msg.sender === 'customer' ? 'justify-start' : 'justify-end'
            )}
          >
            <div
              className={cn(
                "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                msg.sender === 'customer'
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              <p className="text-sm">{msg.message}</p>
              <p className="text-xs mt-1 opacity-70">
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg opacity-70">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-150" />
                </div>
                <span className="text-xs">Sending...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Message Composer */}
      <MessageComposer
        onSend={handleSendMessage}
        isLoading={isLoading}
        templates={templates}
      />
    </div>
  );
};

// New Message Dialog Component (behind feature flag)
const NewMessageDialog = ({ open, onOpenChange, onSendMessage }) => {
  const [formData, setFormData] = useState({
    customer_phone: '',
    customer_name: '',
    message: '',
    priority: 'normal'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage(formData);
    setFormData({ customer_phone: '', customer_name: '', message: '', priority: 'normal' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send New Message</DialogTitle>
          <DialogDescription>
            Start a new conversation with a customer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="customer_phone">Customer Phone *</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Customer name (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Type your message here..."
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Send Message</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Messaging = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);

  // Feature flag for New Message functionality (default hidden)
  const NEW_MESSAGE_ENABLED = process.env.REACT_APP_ENABLE_NEW_MESSAGE === 'true';

  useEffect(() => {
    fetchConversations();
  }, [currentUser?.company_id, filter]);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      let endpoint = `conversations?company_id=${currentUser?.company_id || 'company-001'}`;
      
      // If filtering by specific status, use search endpoint  
      if (filter !== 'all') {
        endpoint = `/api/messages/search?status=${filter}`;
      }
      
      const response = await authService.authenticatedFetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        // Handle both direct array and wrapped response
        const messageList = data.messages || data;
        
        // Ensure conversations have message history
        const conversationsWithMessages = (messageList || []).map(conv => ({
          ...conv,
          messages: conv.conversation_history || [
            {
              sender: 'customer',
              message: conv.last_message || conv.initial_message,
              timestamp: conv.last_message_time || conv.created_at
            }
          ]
        }));
        setConversations(conversationsWithMessages);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setSearching(true);
      let endpoint = `/api/messages/search?q=${encodeURIComponent(searchTerm)}`;
      if (filter !== 'all') {
        endpoint += `&status=${filter}`;
      }
      
      const response = await authService.authenticatedFetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        const searchMessages = (data.messages || []).map(conv => ({
          ...conv,
          messages: [{
            sender: 'customer', 
            message: conv.last_message,
            timestamp: conv.last_message_time
          }]
        }));
        setSearchResults(searchMessages);
      } else {
        console.error('Failed to search messages');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching messages:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleNewMessage = async (messageData) => {
    if (!NEW_MESSAGE_ENABLED) return;
    
    try {
      const response = await authService.authenticatedFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: currentUser?.company_id || 'company-001',
          ...messageData
        })
      });
      
      if (response.ok) {
        const newMessage = await response.json();
        
        // Add to conversations list
        const newConversation = {
          ...newMessage,
          messages: [{
            sender: 'technician',
            message: newMessage.last_message,
            timestamp: newMessage.last_message_time
          }]
        };
        
        setConversations(prev => [newConversation, ...prev]);
        setShowNewMessage(false);
        console.log('New message sent successfully:', newMessage);
      } else {
        console.error('Failed to send new message');
      }
    } catch (err) {
      console.error('Error sending new message:', err);
    }
  };

  const filteredConversations = searchTerm.trim() ? searchResults : (conversations || []).filter(conversation => {
    const matchesSearch = conversation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.customer_phone?.includes(searchTerm) ||
                         conversation.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || conversation.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = (conversationId, message) => {
    // Update the conversation with the new message
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? {
            ...conv,
            messages: [...(conv.messages || []), {
              sender: 'assistant',
              message: message,
              timestamp: new Date().toISOString()
            }],
            last_message: message,
            last_message_at: new Date().toISOString()
          }
        : conv
    ));
  };

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

  // Show conversation thread if one is selected
  if (selectedConversation) {
    return (
      <ConversationThread
        conversation={selectedConversation}
        onBack={() => setSelectedConversation(null)}
        onSendMessage={handleSendMessage}
      />
    );
  }

  const filterOptions = [
    { value: 'all', label: 'All Conversations' },
    { value: 'in_progress', label: 'Active' },
    { value: 'converted', label: 'Converted' },
    { value: 'pending', label: 'Pending' },
  ];

  return (
    <div className="space-y-6">
      {/* New Message Dialog */}
      {NEW_MESSAGE_ENABLED && (
        <NewMessageDialog 
          open={showNewMessage} 
          onOpenChange={setShowNewMessage}
          onSendMessage={handleNewMessage}
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messaging</h1>
          <p className="text-muted-foreground">SMS conversations and customer communications</p>
        </div>
        {NEW_MESSAGE_ENABLED && (
          <Button onClick={() => setShowNewMessage(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        )}
      </div>
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
        <div className="flex space-x-2">
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
            <Card 
              key={conversation.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedConversation(conversation)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{conversation.customer_name || 'Unknown Customer'}</CardTitle>
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
                    "{conversation.last_message || conversation.initial_message}"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(conversation.last_message_at || conversation.created_at)}
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