import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Send, Phone, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn, formatTime } from '../lib/utils';

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

// Message Thread Component
const MessageThread = ({ thread, isSelected, onClick }) => {
  return (
    <div 
      className={cn(
        "p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors",
        isSelected && "bg-accent"
      )}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Phone className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium truncate">{thread.customer_phone}</p>
            <p className="text-xs text-muted-foreground">{formatTime(thread.last_message_at)}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">{thread.last_message_content}</p>
          <div className="flex items-center mt-2">
            <span className={cn(
              "inline-flex px-2 py-1 rounded-full text-xs font-medium",
              thread.status === 'active' ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
            )}>
              {thread.status}
            </span>
            {thread.unread_count > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                {thread.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Message Component
const Message = ({ message, isOwn }) => {
  return (
    <div className={cn(
      "flex mb-4",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
        isOwn 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground"
      )}>
        <p className="text-sm">{message.content}</p>
        <p className={cn(
          "text-xs mt-1",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
};

const Messaging = ({ currentUser }) => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const mockThreads = [
    {
      id: '1',
      customer_phone: '+1-555-123-4567',
      last_message_at: '2025-08-19T14:30:00Z',
      last_message_content: 'When can you come for the AC repair?',
      status: 'active',
      unread_count: 2
    },
    {
      id: '2',
      customer_phone: '+1-555-234-5678',
      last_message_at: '2025-08-19T13:15:00Z',
      last_message_content: 'Thank you for the quick service!',
      status: 'resolved',
      unread_count: 0
    }
  ];

  const mockMessages = [
    {
      id: '1',
      content: 'Hi, my AC stopped working. Can someone help?',
      created_at: '2025-08-19T13:00:00Z',
      sender_type: 'customer'
    },
    {
      id: '2',
      content: 'Hi! I can help you with that. Let me schedule a technician for you.',
      created_at: '2025-08-19T13:05:00Z',
      sender_type: 'owner'
    },
    {
      id: '3',
      content: 'When can you come for the AC repair?',
      created_at: '2025-08-19T14:30:00Z',
      sender_type: 'customer'
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setThreads(mockThreads);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (selectedThread) {
      setMessages(mockMessages);
    }
  }, [selectedThread]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      content: newMessage,
      created_at: new Date().toISOString(),
      sender_type: 'owner'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredThreads = threads.filter(thread =>
    thread.customer_phone.includes(searchQuery) ||
    thread.last_message_content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messaging</h1>
          <p className="text-muted-foreground">Communicate with customers</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
          <Card>
            <CardContent className="p-0">
              <div className="animate-pulse space-y-4 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg"></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Messaging</h1>
        <p className="text-muted-foreground">Communicate with customers</p>
      </div>

      {/* Messaging Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Threads List */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto">
            {filteredThreads.length > 0 ? (
              <div>
                {filteredThreads.map((thread) => (
                  <MessageThread
                    key={thread.id}
                    thread={thread}
                    isSelected={selectedThread?.id === thread.id}
                    onClick={() => setSelectedThread(thread)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState 
                  icon={MessageSquare}
                  title="No conversations"
                  description="No customer conversations yet"
                  action="Start Conversation"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedThread ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedThread.customer_phone}</CardTitle>
                    <CardDescription>Customer conversation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-4">
                  {messages.map((message) => (
                    <Message
                      key={message.id}
                      message={message}
                      isOwn={message.sender_type === 'owner'}
                    />
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <EmptyState 
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a conversation from the left to start messaging"
              />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messaging;