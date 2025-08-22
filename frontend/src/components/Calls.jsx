import React, { useState, useEffect } from 'react';
import { Search, Phone, Clock, User, X, Play, Pause, Download, Copy, ExternalLink, Calendar } from 'lucide-react';
import authService from '../utils/auth';

const Calls = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [aiAnsweredFilter, setAiAnsweredFilter] = useState(false);
  const [transferredFilter, setTransferredFilter] = useState(false);
  const [stats, setStats] = useState({ total: 0, aiAnswered: 0, transferred: 0, avgDuration: 0 });
  const [selectedCall, setSelectedCall] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [twilioEnabled, setTwilioEnabled] = useState(true);
  const [callDetailsLoading, setCallDetailsLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);

  const limit = 20;

  // Fetch calls with current filters using new API
  const fetchCalls = async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      // Add cursor for pagination if not resetting
      if (!reset && nextCursor) {
        params.append('cursor', nextCursor);
      }

      // Date filters - convert to from/to parameters
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.append('from', `+1-*`); // Search all US numbers for demo
      } else if (dateFilter === 'week') {
        params.append('from', `+1-*`); // Search all US numbers for demo
      } else if (dateFilter === 'custom' && customFrom && customTo) {
        params.append('from', `+1-*`); // Search all US numbers for demo
      }

      // Search term
      if (searchTerm.trim()) {
        params.append('q', searchTerm.trim());
      }

      // Tag filters
      if (aiAnsweredFilter) {
        params.append('tag', 'ai_answered');
      }
      if (transferredFilter) {
        params.append('tag', 'transferred_to_tech');
      }

      const response = await authService.authenticatedFetch(`/api/calls?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        const callsData = data.calls || [];
        
        setCalls(reset ? callsData : [...calls, ...callsData]);
        setNextCursor(data.next_cursor);
        setHasMore(!!data.next_cursor);
        
        // Calculate stats from all available data
        const totalCount = data.total_count || callsData.length;
        const aiAnswered = callsData.filter(call => 
          call.tags && call.tags.includes('ai_answered') && !call.tags.includes('transferred_to_tech')
        ).length;
        const transferred = callsData.filter(call => 
          call.tags && call.tags.includes('transferred_to_tech')
        ).length;
        const totalDuration = callsData.reduce((sum, call) => sum + (call.duration_sec || 0), 0);
        const avgDuration = callsData.length > 0 ? Math.round(totalDuration / callsData.length) : 0;
        
        setStats({ total: totalCount, aiAnswered, transferred, avgDuration });
        setTwilioEnabled(true);
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
      // Set mock data for demo
      const mockCalls = [
        {
          id: 'demo-1',
          from: '+1-205-555-1234',
          to: '+1-205-555-HVAC',
          started_at: new Date().toISOString(),
          duration_sec: 180,
          status: 'completed',
          disposition: 'booked',
          tags: ['ai_answered'],
          direction: 'inbound',
          sentiment: 'positive'
        },
        {
          id: 'demo-2',
          from: '+1-205-555-5678',
          to: '+1-205-555-HVAC',
          started_at: new Date(Date.now() - 3600000).toISOString(),
          duration_sec: 240,
          status: 'completed',
          disposition: 'quote',
          tags: ['ai_answered', 'transferred_to_tech'],
          direction: 'inbound',
          sentiment: 'neutral'
        }
      ];
      setCalls(mockCalls);
      setStats({ total: 2, aiAnswered: 1, transferred: 1, avgDuration: 210 });
      setTwilioEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch call details
  const fetchCallDetails = async (callId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      let response;
      try {
        response = await fetch(`${backendUrl}/api/calls/${callId}`);
      } catch (error) {
        response = await fetch(`${backendUrl}/api/call-logs/${callId}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        setSelectedCall(data);
        setDrawerOpen(true);
      }
    } catch (error) {
      console.error('Error fetching call details:', error);
      // Use existing call data
      const call = calls.find(c => c.id === callId);
      if (call) {
        setSelectedCall(call);
        setDrawerOpen(true);
      }
    }
  };

  useEffect(() => {
    setCurrentPage(0);
    fetchCalls(true);
  }, [searchTerm, dateFilter, customFrom, customTo, aiAnsweredFilter, transferredFilter]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
    fetchCalls(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Call Log</h1>
        
        {/* TWILIO Disabled Banner */}
        {!twilioEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-700">📞 Voice disabled (demo mode)</p>
          </div>
        )}

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Date Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">📅</span>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 text-sm rounded-lg ${
                dateFilter === 'today' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1 text-sm rounded-lg ${
                dateFilter === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1 text-sm rounded-lg ${
                dateFilter === 'custom' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          )}

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search name or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2">
            <button
              onClick={() => setAiAnsweredFilter(!aiAnsweredFilter)}
              className={`px-3 py-1 text-sm rounded-full border ${
                aiAnsweredFilter
                  ? 'bg-green-100 border-green-300 text-green-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              AI Answered
            </button>
            <button
              onClick={() => setTransferredFilter(!transferredFilter)}
              className={`px-3 py-1 text-sm rounded-full border ${
                transferredFilter
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Transferred to Tech
            </button>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Calls</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.aiAnswered}</div>
          <div className="text-sm text-gray-600">AI Answered</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.transferred}</div>
          <div className="text-sm text-gray-600">Transferred to Tech</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-orange-600">{formatDuration(stats.avgDuration)}</div>
          <div className="text-sm text-gray-600">Avg Duration</div>
        </div>
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading calls...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-8 text-center">
            <Phone className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No calls found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {calls.map((call) => (
                    <tr 
                      key={call.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => fetchCallDetails(call.id)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDateTime(call.start_time)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {call.customer_name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatPhoneNumber(call.phone_number)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                        {call.direction || 'inbound'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' :
                          call.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {call.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDuration(call.duration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {hasMore && (
              <div className="p-4 border-t">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Drawer */}
      {drawerOpen && selectedCall && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedCall.customer_name || 'Unknown Client'}</h3>
                  <p className="text-sm text-gray-600">{formatPhoneNumber(selectedCall.phone_number)}</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Tags */}
              <div className="flex gap-2 mt-3">
                {selectedCall.answered_by_ai && !selectedCall.transferred_to_tech && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    AI Answered
                  </span>
                )}
                {selectedCall.transferred_to_tech && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Transferred to {selectedCall.tech_name || 'Tech'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Call Details */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <div className="font-medium">{formatDuration(selectedCall.duration)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="font-medium capitalize">{selectedCall.status}</div>
                </div>
              </div>
            </div>

            {/* Audio Player */}
            {selectedCall.recording_url && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <button className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                    <Play className="h-4 w-4 ml-0.5" />
                  </button>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Call Recording</div>
                    <div className="text-xs text-gray-600">Click to play</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Transcript */}
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Transcript</h4>
              {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                <div className="space-y-3">
                  {selectedCall.transcript.map((entry, index) => (
                    <div key={index} className={`flex ${entry.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        entry.speaker === 'ai' 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="font-medium text-xs mb-1">
                          {entry.speaker === 'ai' ? '🤖 AI' : '👤 Customer'}
                        </div>
                        <div>{entry.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">
                  <Phone className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                  No transcript available
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Calls;