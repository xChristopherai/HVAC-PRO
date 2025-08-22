import React, { useState, useEffect } from 'react';
import { Shield, DollarSign, CheckCircle, Clock, XCircle, Camera, FileText, Settings, X, AlertTriangle } from 'lucide-react';

const QAGates = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ passed: 0, pending: 0, blocked: 0, holdbackBalance: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [qaSettings, setQASettings] = useState({
    holdback_percentage: 10,
    block_microns: true,
    require_inspection: true,
    require_warranty: true
  });
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideType, setOverrideType] = useState(''); // 'qa' or 'holdback'

  const itemsPerPage = 20;

  // Fetch jobs with QA status
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        cursor: (currentPage - 1).toString()
      });
      
      if (statusFilter) params.append('status', statusFilter);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Try new QA API first, fallback to mock data
      let response;
      try {
        response = await fetch(`${backendUrl}/api/qa/jobs?${params}`);
        if (!response.ok) throw new Error('API not available');
      } catch (error) {
        console.log('QA API not available, using mock data');
        // Mock data for demo
        const mockJobs = [
          {
            id: 'job-001',
            customer_name: 'John Smith',
            customer_address: '123 Main St, Springfield',
            subcontractor_name: 'Mike Wilson',
            subcontractor_id: 'sub-001',
            microns: 450,
            microns_pass: true,
            photos: [
              { type: 'before', url: 'https://via.placeholder.com/300x200?text=Before', description: 'Before installation' },
              { type: 'after', url: 'https://via.placeholder.com/300x200?text=After', description: 'After installation' },
              { type: 'equipment', url: 'https://via.placeholder.com/300x200?text=Equipment', description: 'Equipment closeup' }
            ],
            photos_pass: true,
            warranty_registered: true,
            inspection_status: 'passed',
            inspection_pass: true,
            holdback_amount: 150,
            holdback_status: 'released',
            qa_status: 'passed',
            overall_pass: true,
            blocking_reasons: [],
            completion_date: '2025-01-20T10:30:00Z'
          },
          {
            id: 'job-002',
            customer_name: 'Sarah Johnson',
            customer_address: '456 Oak Ave, Downtown',
            subcontractor_name: 'Tom Anderson',
            subcontractor_id: 'sub-002',
            microns: 501,
            microns_pass: false,
            photos: [
              { type: 'before', url: 'https://via.placeholder.com/300x200?text=Before', description: 'Before installation' }
            ],
            photos_pass: false,
            warranty_registered: false,
            inspection_status: 'scheduled',
            inspection_pass: false,
            holdback_amount: 200,
            holdback_status: 'held',
            qa_status: 'blocked',
            overall_pass: false,
            blocking_reasons: [
              'Microns reading 501 exceeds limit (500)',
              'Missing required photos: after, equipment',
              'Warranty not registered'
            ],
            completion_date: null
          },
          {
            id: 'job-003',
            customer_name: 'Robert Davis',
            customer_address: '789 Pine St, Eastside',
            subcontractor_name: 'Lisa Martinez',
            subcontractor_id: 'sub-003',
            microns: 420,
            microns_pass: true,
            photos: [
              { type: 'before', url: 'https://via.placeholder.com/300x200?text=Before', description: 'Before installation' },
              { type: 'after', url: 'https://via.placeholder.com/300x200?text=After', description: 'After installation' }
            ],
            photos_pass: false,
            warranty_registered: true,
            inspection_status: 'pending',
            inspection_pass: false,
            holdback_amount: 120,
            holdback_status: 'held',
            qa_status: 'pending',
            overall_pass: false,
            blocking_reasons: [
              'Missing required photos: equipment'
            ],
            completion_date: null
          }
        ];
        
        // Filter by status if needed
        let filteredJobs = mockJobs;
        if (statusFilter) {
          filteredJobs = mockJobs.filter(job => job.qa_status === statusFilter);
        }
        
        setJobs(filteredJobs);
        setTotalJobs(filteredJobs.length);
        
        // Calculate stats
        const passed = mockJobs.filter(j => j.qa_status === 'passed').length;
        const pending = mockJobs.filter(j => j.qa_status === 'pending').length;
        const blocked = mockJobs.filter(j => j.qa_status === 'blocked').length;
        const holdbackBalance = mockJobs.reduce((sum, j) => j.holdback_status === 'held' ? sum + j.holdback_amount : sum, 0);
        
        setStats({ passed, pending, blocked, holdbackBalance });
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setJobs(data.jobs || []);
      setTotalJobs(data.total || 0);
      setStats(data.stats || stats);
      
    } catch (error) {
      console.error('Error fetching QA jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch QA settings
  const fetchQASettings = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/qa/settings`);
      
      if (response.ok) {
        const data = await response.json();
        setQASettings(data);
      }
    } catch (error) {
      console.log('QA settings API not available, using defaults');
    }
  };

  // Save QA settings
  const saveQASettings = async (newSettings) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/qa/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      
      if (response.ok) {
        setQASettings(newSettings);
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = 'QA settings saved successfully';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
      }
    } catch (error) {
      console.error('Error saving QA settings:', error);
    }
  };

  // Handle override actions
  const handleOverride = async () => {
    if (!overrideReason.trim()) return;
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const endpoint = overrideType === 'qa' 
        ? `/api/qa/jobs/${selectedJob.id}/override`
        : `/api/qa/jobs/${selectedJob.id}/holdback/release`;
      
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: overrideReason })
      });
      
      if (response.ok) {
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = overrideType === 'qa' ? 'QA override applied' : 'Holdback released';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
        
        // Refresh data
        fetchJobs();
        setShowOverrideModal(false);
        setOverrideReason('');
      }
    } catch (error) {
      console.error('Error processing override:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchQASettings();
  }, [currentPage, statusFilter]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-amber-600" />;
      case 'blocked': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-amber-600 bg-amber-50';
      case 'blocked': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">QA Gates & Holdbacks</h1>
            <p className="text-gray-600">Monitor job quality and control subcontractor payments</p>
          </div>

          {/* Owner Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div 
              className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow ${
                statusFilter === 'passed' ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => setStatusFilter(statusFilter === 'passed' ? '' : 'passed')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">✅ Jobs Passed QA</p>
                  <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div 
              className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow ${
                statusFilter === 'pending' ? 'ring-2 ring-amber-500' : ''
              }`}
              onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">⏳ Jobs Pending QA</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </div>

            <div 
              className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow ${
                statusFilter === 'blocked' ? 'ring-2 ring-red-500' : ''
              }`}
              onClick={() => setStatusFilter(statusFilter === 'blocked' ? '' : 'blocked')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">❌ Jobs Blocked</p>
                  <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">💰 Holdback Balance</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.holdbackBalance)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  QA Jobs {statusFilter && `(${statusFilter})`}
                </h2>
                {statusFilter && (
                  <button
                    onClick={() => setStatusFilter('')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No jobs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subcontractor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Microns</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspection</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holdback</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr 
                        key={job.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedJob(job);
                          setDrawerOpen(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {job.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{job.customer_name}</div>
                          <div className="text-sm text-gray-500">{job.customer_address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.subcontractor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 mr-2">{job.microns}</span>
                            {job.microns_pass ? (
                              <span className="text-green-500" title="Microns < 500 ✓">🟢</span>
                            ) : (
                              <span className="text-red-500" title="Microns ≥ 500 ❌">🔴</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 mr-2">{job.photos.length}/4</span>
                            {job.photos_pass ? (
                              <span className="text-green-500" title="All photos uploaded ✓">🟢</span>
                            ) : (
                              <span className="text-red-500" title="Missing photos ❌">🔴</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {job.warranty_registered ? (
                            <span className="text-green-500" title="Warranty registered ✓">🟢</span>
                          ) : (
                            <span className="text-red-500" title="Warranty not registered ❌">🔴</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="mr-2">{job.inspection_status}</span>
                            {job.inspection_pass ? (
                              <span className="text-green-500" title="Inspection passed ✓">🟢</span>
                            ) : job.inspection_status === 'scheduled' ? (
                              <span className="text-amber-600" title="Inspection scheduled ⏳">🟡</span>
                            ) : (
                              <span className="text-red-500" title="Inspection pending/failed ❌">🔴</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            job.holdback_status === 'released' 
                              ? 'text-green-800 bg-green-100' 
                              : 'text-orange-800 bg-orange-100'
                          }`}>
                            {job.holdback_status === 'released' 
                              ? 'Released' 
                              : `${formatCurrency(job.holdback_amount)} Held`
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.qa_status)}`}>
                            {job.qa_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalJobs > itemsPerPage && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(totalJobs / itemsPerPage)}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(totalJobs / itemsPerPage)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Owner Controls */}
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Owner Controls</h2>
        </div>

        {/* Holdback Percentage */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Holdback Percentage: {qaSettings.holdback_percentage}%
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={qaSettings.holdback_percentage}
            onChange={(e) => setQASettings(prev => ({ ...prev, holdback_percentage: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>10%</span>
            <span>20%</span>
          </div>
        </div>

        {/* QA Toggles */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Auto-block microns ≥500</label>
            <input
              type="checkbox"
              checked={qaSettings.block_microns}
              onChange={(e) => setQASettings(prev => ({ ...prev, block_microns: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Require inspection pass before payout</label>
            <input
              type="checkbox"
              checked={qaSettings.require_inspection}
              onChange={(e) => setQASettings(prev => ({ ...prev, require_inspection: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Require warranty registration before payout</label>
            <input
              type="checkbox"
              checked={qaSettings.require_warranty}
              onChange={(e) => setQASettings(prev => ({ ...prev, require_warranty: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>

        <button
          onClick={() => saveQASettings(qaSettings)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Settings
        </button>

        <p className="text-xs text-gray-500 mt-2">
          * Settings apply to NEW jobs only
        </p>
      </div>

      {/* Job Details Drawer */}
      {drawerOpen && selectedJob && (
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
                  <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
                  <p className="text-sm text-gray-600">{selectedJob.id}</p>
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
              {/* Customer Info */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Customer</h4>
                <p className="text-sm text-gray-600">{selectedJob.customer_name}</p>
                <p className="text-sm text-gray-500">{selectedJob.customer_address}</p>
              </div>

              {/* QA Status */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <h4 className="font-medium text-gray-900 mr-2">QA Status</h4>
                  {getStatusIcon(selectedJob.qa_status)}
                </div>
                
                {selectedJob.blocking_reasons.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800 mb-1">Blocking Reasons:</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          {selectedJob.blocking_reasons.map((reason, index) => (
                            <li key={index}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Photos */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Photos ({selectedJob.photos.length})</h4>
                {selectedJob.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedJob.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={photo.url} 
                          alt={photo.description}
                          className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-75"
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                        <p className="text-xs text-gray-500 mt-1">{photo.type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No photos uploaded</p>
                )}
              </div>

              {/* Override Actions */}
              {!selectedJob.overall_pass && (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setOverrideType('qa');
                      setShowOverrideModal(true);
                    }}
                    className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-amber-700"
                  >
                    Override → Mark QA Passed
                  </button>
                  
                  {selectedJob.holdback_status === 'held' && (
                    <button
                      onClick={() => {
                        setOverrideType('holdback');
                        setShowOverrideModal(true);
                      }}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700"
                    >
                      Force Release Holdback
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {overrideType === 'qa' ? 'Override QA Gate' : 'Force Release Holdback'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for this override action:
              </p>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Enter reason for override..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowOverrideModal(false);
                    setOverrideReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOverride}
                  disabled={!overrideReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAGates;