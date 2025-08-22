import React, { useState, useEffect } from 'react';
import { BarChart3, Copy, Send, RefreshCw, Clock, TrendingUp, CheckCircle, DollarSign, X, Calendar } from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('weekly-summary');
  const [datePreset, setDatePreset] = useState('last7');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [lastTrigger, setLastTrigger] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [twilioEnabled, setTwilioEnabled] = useState(true);

  // Fetch SMS preview
  const fetchPreview = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Handle date range based on preset
      if (datePreset === 'custom' && customStart && customEnd) {
        params.append('start', customStart);
        params.append('end', customEnd);
      }
      // For other presets, let backend calculate the range
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/reports/weekly-summary/preview?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setPreview(data);
        setTwilioEnabled(data.delivery_method === 'real_sms');
      } else {
        console.error('Failed to fetch preview');
        // Mock data for demo
        setPreview({
          summary_data: {
            period: 'Last 7 Days',
            start_date: '01/15',
            end_date: '01/22',
            total_calls: 47,
            ai_answered: 38,
            appointments_created: 23,
            qa_passed: 15,
            qa_blocked: 2,
            revenue_potential: 12500,
            holdback_released: 850,
            performance_insights: ['🚀 AI performing excellently', '💰 $850 released']
          },
          sms_body: '📊 HVAC Pro Weekly (01/15-01/22) | 47 calls, 38 AI-handled (81%) | 23 appointments booked | ✅ 15 jobs passed QA | 💰 $12,500 potential',
          sms_length: 138,
          delivery_method: 'logged_only'
        });
        setTwilioEnabled(false);
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger SMS
  const triggerSMS = async () => {
    setTriggering(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/reports/weekly-summary/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: datePreset === 'custom' ? customStart : undefined,
          end: datePreset === 'custom' ? customEnd : undefined
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLastTrigger({
          status: data.delivery_method === 'real_sms' ? 'Sent' : 'Logged (Mock Mode)',
          timestamp: new Date().toLocaleString(),
          message: data.sms_body
        });
        
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = data.delivery_method === 'real_sms' ? 'SMS sent successfully!' : 'SMS logged successfully (mock mode)';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
        
        // Refresh history
        fetchHistory();
      }
    } catch (error) {
      console.error('Error triggering SMS:', error);
    } finally {
      setTriggering(false);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const params = new URLSearchParams({
        limit: '20',
        cursor: (historyPage - 1).toString()
      });
      
      const response = await fetch(`${backendUrl}/api/reports/weekly-summary/history?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.messages || []);
      } else {
        // Mock history data
        const mockHistory = [
          {
            id: 'msg-001',
            timestamp: '2025-01-22T09:00:00Z',
            status: 'Sent',
            channel: 'SMS',
            triggered_by: 'Scheduler',
            message: '📊 HVAC Pro Weekly (01/15-01/22) | 47 calls, 38 AI-handled (81%) | 23 appointments booked | ✅ 15 jobs passed QA | 💰 $12,500 potential',
            range_used: 'Last 7 Days',
            request_id: 'req-12345'
          },
          {
            id: 'msg-002', 
            timestamp: '2025-01-21T14:30:00Z',
            status: 'Logged',
            channel: 'Mock',
            triggered_by: 'Manual',
            message: '📊 HVAC Pro Weekly (01/14-01/21) | 42 calls, 35 AI-handled (83%) | 19 appointments booked | ✅ 12 jobs passed QA | 💰 $11,200 potential',
            range_used: 'Last 7 Days',
            request_id: 'req-12344'
          },
          {
            id: 'msg-003',
            timestamp: '2025-01-15T09:00:00Z', 
            status: 'Sent',
            channel: 'SMS',
            triggered_by: 'Scheduler',
            message: '📊 HVAC Pro Weekly (01/08-01/15) | 38 calls, 29 AI-handled (76%) | 16 appointments booked | ⚠️ 8 jobs passed QA, 3 blocked | 💰 $9,800 potential',
            range_used: 'Last 7 Days',
            request_id: 'req-12343'
          }
        ];
        setHistory(mockHistory);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Copied to clipboard!';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 2000);
    });
  };

  useEffect(() => {
    fetchPreview();
    fetchHistory();
  }, [datePreset, customStart, customEnd]);

  const getAIStatusEmoji = (successRate) => {
    if (successRate >= 80) return '🚀';
    if (successRate >= 60) return '⚠️';
    return '🔴';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const truncateMessage = (message, maxLength = 80) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '…' : message;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Business intelligence and automated communications</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('weekly-summary')}
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'weekly-summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Weekly Summary
            </button>
          </nav>
        </div>
      </div>

      {/* Mock Mode Banner */}
      {!twilioEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800">📱 SMS in Mock Mode — messages are logged, not sent</p>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Date Presets */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <button
            onClick={() => setDatePreset('last7')}
            className={`px-3 py-1 text-sm rounded-lg ${
              datePreset === 'last7'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDatePreset('thisweek')}
            className={`px-3 py-1 text-sm rounded-lg ${
              datePreset === 'thisweek'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDatePreset('custom')}
            className={`px-3 py-1 text-sm rounded-lg ${
              datePreset === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Custom Date Range */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        )}

        {/* Regenerate Button */}
        <button
          onClick={fetchPreview}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Regenerate Preview
        </button>
      </div>

      {/* SMS Preview Card */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">SMS Preview</h2>
        
        {preview ? (
          <>
            <div className="relative mb-4">
              <textarea
                readOnly
                value={preview.sms_body}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm resize-none"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {preview.sms_length}/160
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => copyToClipboard(preview.sms_body)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
              
              <button
                onClick={triggerSMS}
                disabled={triggering}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Send className={`h-4 w-4 ${triggering ? 'animate-pulse' : ''}`} />
                {triggering ? 'Sending...' : 'Trigger Now'}
              </button>
            </div>
            
            {lastTrigger && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{lastTrigger.status} at {lastTrigger.timestamp}</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading preview...</p>
          </div>
        )}
      </div>

      {/* KPI Strip */}
      {preview && preview.summary_data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">{preview.summary_data.total_calls}</div>
            <div className="text-sm text-gray-600">Calls</div>
            <div className="text-xs text-gray-500">{preview.summary_data.period}</div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-green-600">
                {preview.summary_data.total_calls > 0 ? Math.round(preview.summary_data.ai_answered / preview.summary_data.total_calls * 100) : 0}%
              </span>
              <span className="text-lg">
                {getAIStatusEmoji(preview.summary_data.total_calls > 0 ? preview.summary_data.ai_answered / preview.summary_data.total_calls * 100 : 0)}
              </span>
            </div>
            <div className="text-sm text-gray-600">AI Success Rate</div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-purple-600">{preview.summary_data.qa_passed}</div>
            <div className="text-sm text-gray-600">QA Passed ✓</div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(preview.summary_data.revenue_potential)}</div>
            <div className="text-sm text-gray-600">Potential Revenue</div>
          </div>
          
          {preview.summary_data.holdback_released > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <div className="text-2xl font-bold text-indigo-600">{formatCurrency(preview.summary_data.holdback_released)}</div>
              <div className="text-sm text-gray-600">Holdback Released</div>
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Message History</h2>
        </div>
        
        {historyLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No message history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triggered By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((message) => (
                  <tr 
                    key={message.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedMessage(message);
                      setDrawerOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(message.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        message.status === 'Sent' 
                          ? 'text-green-800 bg-green-100'
                          : 'text-yellow-800 bg-yellow-100'
                      }`}>
                        {message.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.channel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.triggered_by}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {truncateMessage(message.message)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
          disabled={historyPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <span className="text-sm text-gray-600">Page {historyPage}</span>
        
        <button
          onClick={() => setHistoryPage(prev => prev + 1)}
          disabled={history.length < 20}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Message Details Drawer */}
      {drawerOpen && selectedMessage && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Message Details</h3>
                  <p className="text-sm text-gray-600">{new Date(selectedMessage.timestamp).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Message Status */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedMessage.status === 'Sent' 
                    ? 'text-green-800 bg-green-100'
                    : 'text-yellow-800 bg-yellow-100'
                }`}>
                  {selectedMessage.status}
                </span>
              </div>

              {/* Full Message */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Full Message</h4>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <p className="text-sm text-gray-900">{selectedMessage.message}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedMessage.message)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Copy Message
                </button>
              </div>

              {/* Metadata */}
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Channel:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedMessage.channel}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Triggered By:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedMessage.triggered_by}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Range Used:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedMessage.range_used}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Request ID:</span>
                  <span className="ml-2 text-sm text-gray-900 font-mono">{selectedMessage.request_id}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;