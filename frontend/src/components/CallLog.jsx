import React, { useState, useEffect } from 'react';
import { Search, Phone, Clock, User, Calendar, Filter, Eye, Download, BarChart3, PhoneCall, UserCheck, AlertCircle } from 'lucide-react';

const CallLog = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('');
  const [answeredByFilter, setAnsweredByFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [transferredFilter, setTransferredFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const itemsPerPage = 20;

  // Fetch call logs
  const fetchCallLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        company_id: 'company-001',
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (dateFilter) {
        params.append('date_filter', dateFilter);
        if (dateFilter === 'custom' && customDateFrom && customDateTo) {
          params.append('date_from', customDateFrom);
          params.append('date_to', customDateTo);
        }
      }
      if (statusFilter) params.append('status', statusFilter);
      if (answeredByFilter) params.append('answered_by', answeredByFilter);
      if (outcomeFilter) params.append('outcome', outcomeFilter);
      if (transferredFilter) params.append('transferred', transferredFilter);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/call-logs?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setCalls(data.calls || []);
        setTotalCount(data.total_count || 0);
      } else {
        console.error('Error fetching calls:', data);
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch call statistics
  const fetchStats = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/call-logs/stats/company-001?period=${dateFilter === 'custom' ? 'today' : dateFilter}`);
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch call details with transcript
  const fetchCallDetails = async (callId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/call-logs/${callId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedCall(data);
        setShowTranscript(true);
      }
    } catch (error) {
      console.error('Error fetching call details:', error);
    }
  };

  useEffect(() => {
    fetchCallLogs();
    fetchStats();
  }, [currentPage, searchTerm, dateFilter, statusFilter, answeredByFilter, outcomeFilter, transferredFilter, customDateFrom, customDateTo]);

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format phone number
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-600 bg-green-50',
      incoming: 'text-blue-600 bg-blue-50',
      failed: 'text-red-600 bg-red-50',
      missed: 'text-yellow-600 bg-yellow-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  // Get outcome color
  const getOutcomeColor = (outcome) => {
    const colors = {
      appointment_created: 'text-green-600 bg-green-50',
      transferred_to_human: 'text-blue-600 bg-blue-50',
      customer_hangup: 'text-red-600 bg-red-50',
      quote_requested: 'text-purple-600 bg-purple-50',
      follow_up_needed: 'text-yellow-600 bg-yellow-50',
      information_provided: 'text-gray-600 bg-gray-50'
    };
    return colors[outcome] || 'text-gray-600 bg-gray-50';
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter('today');
    setStatusFilter('');
    setAnsweredByFilter('');
    setOutcomeFilter('');
    setTransferredFilter('');
    setCustomDateFrom('');
    setCustomDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Call Log</h1>
        <p className="text-gray-600">Track and analyze all voice interactions with your customers</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_calls}</p>
              </div>
              <PhoneCall className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Answered</p>
                <p className="text-2xl font-bold text-green-600">{stats.ai_answered}</p>
                <p className="text-sm text-gray-500">{stats.ai_success_rate}% success rate</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Appointments Created</p>
                <p className="text-2xl font-bold text-purple-600">{stats.appointments_created}</p>
                <p className="text-sm text-gray-500">{stats.appointment_conversion_rate}% conversion</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-orange-600">{formatDuration(Math.round(stats.avg_duration))}</p>
                <p className="text-sm text-gray-500">per call</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Search & Filter Calls</h2>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset All Filters
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by customer name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="incoming">In Progress</option>
                <option value="failed">Failed</option>
                <option value="missed">Missed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Answered By</label>
              <select
                value={answeredByFilter}
                onChange={(e) => setAnsweredByFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="ai">AI Assistant</option>
                <option value="human">Transferred to Human</option>
                <option value="missed">Missed/Unanswered</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Outcomes</option>
                <option value="appointment_created">Appointment Created</option>
                <option value="transferred_to_human">Transferred to Tech</option>
                <option value="quote_requested">Quote Requested</option>
                <option value="follow_up_needed">Follow-up Needed</option>
                <option value="customer_hangup">Customer Hangup</option>
                <option value="information_provided">Info Provided</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transferred</label>
              <select
                value={transferredFilter}
                onChange={(e) => setTransferredFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Transferred</option>
                <option value="false">Not Transferred</option>
              </select>
            </div>
          </div>
          
          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} calls
        </div>
        <div className="text-sm text-gray-600">
          Page {currentPage} of {Math.ceil(totalCount / itemsPerPage) || 1}
        </div>
      </div>

      {/* Call Log Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading calls...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-8 text-center">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No calls found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handled By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {call.customer_name || 'Unknown Customer'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatPhoneNumber(call.phone_number)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(call.start_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(call.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.status)}`}>
                        {call.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {call.answered_by_ai && !call.transferred_to_tech ? (
                          <>
                            <UserCheck className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-sm text-green-600">AI Assistant</span>
                          </>
                        ) : call.transferred_to_tech ? (
                          <>
                            <User className="h-4 w-4 text-blue-600 mr-1" />
                            <span className="text-sm text-blue-600">
                              {call.tech_name || 'Technician'}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-600">Missed</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {call.outcome && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOutcomeColor(call.outcome)}`}>
                          {call.outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {call.issue_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => fetchCallDetails(call.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Transcript
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > itemsPerPage && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, Math.ceil(totalCount / itemsPerPage)) }, (_, i) => {
              const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (pageNum > Math.ceil(totalCount / itemsPerPage)) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / itemsPerPage)))}
            disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Transcript Modal */}
      {showTranscript && selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Call Transcript</h3>
                  <p className="text-sm text-gray-600">
                    {selectedCall.customer_name} • {formatPhoneNumber(selectedCall.phone_number)} • 
                    {new Date(selectedCall.start_time).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowTranscript(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                <div className="space-y-4">
                  {selectedCall.transcript.map((entry, index) => (
                    <div key={index} className={`flex ${entry.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        entry.speaker === 'ai' 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            {entry.speaker === 'ai' ? '🤖 AI Assistant' : '👤 Customer'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{entry.content}</p>
                        {entry.confidence && (
                          <div className="text-xs text-gray-500 mt-1">
                            Confidence: {Math.round(entry.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No transcript available for this call</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Duration:</span>
                  <span className="ml-2 text-gray-900">{formatDuration(selectedCall.duration)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Outcome:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedCall.outcome?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">AI Confidence:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedCall.ai_confidence ? `${Math.round(selectedCall.ai_confidence * 100)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallLog;