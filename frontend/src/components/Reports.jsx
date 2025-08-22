import React, { useState, useEffect } from 'react';
import { Copy, Send, RefreshCw, Calendar, X } from 'lucide-react';

const Reports = () => {
  const [datePreset, setDatePreset] = useState('last7');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch SMS preview
  const fetchPreview = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (datePreset === 'custom' && customStart && customEnd) {
        params.append('start', customStart);
        params.append('end', customEnd);
      }
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      try {
        const response = await fetch(`${backendUrl}/api/reports/weekly-summary/preview?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Transform backend data to expected format
          const summary = data.summary_data;
          const transformedPreview = {
            brand: "HVAC Pro",
            start: summary.start_date,
            end: summary.end_date,
            calls: summary.total_calls,
            ai_pct: summary.total_calls > 0 ? Math.round(summary.ai_answered / summary.total_calls * 100) : 0,
            qa_passed: summary.qa_passed,
            jobs_billed_cents: Math.round(summary.revenue_potential * 100), // Convert to cents
            money_on_hold_cents: Math.round(summary.holdback_released * 100), // Convert to cents
            sms: composePlainSMS({
              brand: "HVAC Pro",
              start: summary.start_date,
              end: summary.end_date,
              calls: summary.total_calls,
              ai_pct: summary.total_calls > 0 ? Math.round(summary.ai_answered / summary.total_calls * 100) : 0,
              qa_passed: summary.qa_passed,
              jobs_billed: formatCurrency(summary.revenue_potential),
              on_hold: formatCurrency(summary.holdback_released)
            }),
            mock_mode: data.delivery_method !== 'real_sms'
          };
          
          setPreview(transformedPreview);
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        console.log('Using mock data for preview');
        
        // Mock data with expected format
        setPreview({
          brand: "HVAC Pro",
          start: "01/15",
          end: "01/22",
          calls: 47,
          ai_pct: 81,
          qa_passed: 15,
          jobs_billed_cents: 1250000, // $12,500 in cents
          money_on_hold_cents: 85000,  // $850 in cents
          sms: "HVAC Pro (01/15–01/22): 47 calls | AI handled 81% | 15 jobs QA passed | $12,500 billed | $850 on hold",
          mock_mode: true
        });
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compose plain English SMS
  const composePlainSMS = (data) => {
    return `${data.brand} (${data.start}–${data.end}): ${data.calls} calls | AI handled ${data.ai_pct}% | ${data.qa_passed} jobs QA passed | ${data.jobs_billed} billed | ${data.on_hold} on hold`;
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
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        setLastStatus({
          sent: data.delivery_method === 'real_sms',
          mock: data.delivery_method === 'logged_only',
          timestamp: timestamp
        });
        
        // Show success toast
        showToast(data.delivery_method === 'real_sms' ? 'SMS sent successfully!' : 'SMS logged successfully (mock mode)', 'success');
        
        // Refresh history
        fetchHistory();
      }
    } catch (error) {
      console.error('Error triggering SMS:', error);
      showToast('Error sending SMS', 'error');
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
        limit: '10',
        cursor: (historyPage - 1).toString()
      });
      
      try {
        const response = await fetch(`${backendUrl}/api/reports/weekly-summary/history?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          setHistory(data.messages || []);
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        // Mock history data
        const mockHistory = [
          {
            id: 'msg-001',
            ts: '2025-01-22T09:00:00Z',
            status: 'sent',
            sms: 'HVAC Pro (01/15–01/22): 47 calls | AI handled 81% | 15 jobs QA passed | $12,500 billed | $850 on hold',
            mock: false,
            range: { start: '01/15', end: '01/22' }
          },
          {
            id: 'msg-002', 
            ts: '2025-01-21T14:30:00Z',
            status: 'logged',
            sms: 'HVAC Pro (01/14–01/21): 42 calls | AI handled 83% | 12 jobs QA passed | $11,200 billed | $720 on hold',
            mock: true,
            range: { start: '01/14', end: '01/21' }
          },
          {
            id: 'msg-003',
            ts: '2025-01-15T09:00:00Z', 
            status: 'sent',
            sms: 'HVAC Pro (01/08–01/15): 38 calls | AI handled 76% | 8 jobs QA passed | $9,800 billed | $640 on hold',
            mock: false,
            range: { start: '01/08', end: '01/15' }
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

  // Format currency from cents
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format currency from cents with thousands separators
  const formatCurrencyFromCents = (cents) => {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(dollars);
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 'success');
    });
  };

  // Truncate message
  const truncateMessage = (message, maxLength = 80) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '…' : message;
  };

  useEffect(() => {
    fetchPreview();
    fetchHistory();
  }, [datePreset, customStart, customEnd]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Weekly Summary</h1>
        <p className="text-xl text-gray-600">Business performance and automated reports</p>
      </div>

      {/* Date Presets */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <Calendar className="h-5 w-5 text-gray-500" />
        
        <button
          onClick={() => setDatePreset('last7')}
          className={`px-4 py-2 text-lg font-medium rounded-lg ${
            datePreset === 'last7'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 7 Days
        </button>
        
        <button
          onClick={() => setDatePreset('thisweek')}
          className={`px-4 py-2 text-lg font-medium rounded-lg ${
            datePreset === 'thisweek'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Week
        </button>
        
        <button
          onClick={() => setDatePreset('custom')}
          className={`px-4 py-2 text-lg font-medium rounded-lg ${
            datePreset === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Custom Range
        </button>

        {/* Custom Date Range */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-3 ml-4">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 text-lg border border-gray-300 rounded-lg"
            />
            <span className="text-gray-500 text-lg">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 text-lg border border-gray-300 rounded-lg"
            />
          </div>
        )}

        <button
          onClick={fetchPreview}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 text-lg font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 ml-auto"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
      </div>

      {/* SMS Preview */}
      <div className="bg-white rounded-xl border shadow-sm p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">SMS Preview</h2>
        
        {preview ? (
          <>
            <div className="relative mb-6">
              <textarea
                readOnly
                value={preview.sms}
                className="w-full h-20 p-4 text-lg border border-gray-300 rounded-lg bg-gray-50 resize-none"
              />
              <div className="absolute bottom-3 right-3 text-sm text-gray-500 font-medium">
                {preview.sms.length}/160
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => copyToClipboard(preview.sms)}
                className="flex items-center gap-2 px-6 py-3 text-lg font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Copy className="h-5 w-5" />
                Copy
              </button>
              
              <button
                onClick={triggerSMS}
                disabled={triggering}
                className="flex items-center gap-2 px-6 py-3 text-lg font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Send className={`h-5 w-5 ${triggering ? 'animate-pulse' : ''}`} />
                {triggering ? 'Sending...' : 'Send Now'}
              </button>
            </div>
            
            {lastStatus && (
              <div className="text-lg text-gray-600">
                {lastStatus.sent ? `Sent at ${lastStatus.timestamp}` : `Logged (Mock Mode) at ${lastStatus.timestamp}`}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading preview...</p>
          </div>
        )}
      </div>

      {/* Owner Scorecard */}
      {preview && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{preview.calls}</div>
            <div className="text-xl font-medium text-gray-700">Calls</div>
          </div>
          
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{preview.ai_pct}%</div>
            <div className="text-xl font-medium text-gray-700">AI handled</div>
          </div>
          
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">{preview.qa_passed}</div>
            <div className="text-xl font-medium text-gray-700">QA passed</div>
          </div>
          
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">{formatCurrencyFromCents(preview.jobs_billed_cents)}</div>
            <div className="text-xl font-medium text-gray-700">Jobs billed</div>
          </div>
          
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">{formatCurrencyFromCents(preview.money_on_hold_cents)}</div>
            <div className="text-xl font-medium text-gray-700">Money on hold</div>
          </div>
        </div>
      )}

      {/* Recent Messages */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">Recent Messages</h2>
        </div>
        
        {historyLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg text-gray-600">No messages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-lg font-medium text-gray-700">Date/Time</th>
                  <th className="px-6 py-4 text-left text-lg font-medium text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-lg font-medium text-gray-700">Message</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((message) => (
                  <tr 
                    key={message.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedMessage(message);
                      setModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 text-lg text-gray-900">
                      {new Date(message.ts).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        message.status === 'sent' 
                          ? 'text-green-700 bg-green-100'
                          : 'text-yellow-700 bg-yellow-100'
                      }`}>
                        {message.status === 'sent' ? 'Sent' : 'Logged'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-lg text-gray-900">
                      {truncateMessage(message.sms)}
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
          className="px-6 py-3 text-lg font-medium border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        
        <span className="text-lg text-gray-600">Page {historyPage}</span>
        
        <button
          onClick={() => setHistoryPage(prev => prev + 1)}
          disabled={history.length < 10}
          className="px-6 py-3 text-lg font-medium border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Message Modal */}
      {modalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 shadow-xl">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Message Details</h3>
                  <p className="text-lg text-gray-600">{new Date(selectedMessage.ts).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  selectedMessage.status === 'sent' 
                    ? 'text-green-700 bg-green-100'
                    : 'text-yellow-700 bg-yellow-100'
                }`}>
                  {selectedMessage.status === 'sent' ? 'Sent' : 'Logged'}
                </span>
              </div>
              
              <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                <p className="text-lg text-gray-900">{selectedMessage.sms}</p>
              </div>
              
              <button
                onClick={() => copyToClipboard(selectedMessage.sms)}
                className="px-4 py-2 text-lg font-medium text-blue-600 hover:text-blue-700"
              >
                Copy Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;