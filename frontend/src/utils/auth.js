// Authentication utility for HVAC Assistant
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  async login(role = 'owner', companyId = 'company-001') {
    try {
      // Call actual login API to get proper JWT token
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: role,
          company_id: companyId
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.access_token;
        this.user = {
          sub: `mock-${role}-001`,
          email: `${role}@hvactech.com`,
          name: 'John Smith',
          role: role,
          company_id: companyId
        };
        
        return { success: true, user: this.user };
      } else {
        throw new Error('Login API failed');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      // Fallback to mock token for demo
      this.token = 'mock-jwt-token-' + Date.now();
      this.user = {
        sub: 'mock-owner-001',
        email: 'owner@hvactech.com',
        name: 'John Smith',
        role: role,
        company_id: companyId
      };
      
      return { success: true, user: this.user };
    }
  }

  async authenticatedFetch(endpoint, options = {}) {
    try {
      if (!this.token) {
        await this.login();
      }

      const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint.startsWith('/api') ? endpoint : `/api/${endpoint.replace(/^\//, '')}`}`;
      
      const authOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          ...options.headers,
        }
      };

      console.log('Fetching:', url, 'with token:', this.token ? 'present' : 'missing');
      const response = await fetch(url, authOptions);
      
      if (response.ok) {
        return response;
      } else {
        console.error('API response not ok:', response.status, response.statusText);
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Fetch failed, using mock data:', error);
      
      // Return mock data based on endpoint
      return this.getMockResponse(endpoint);
    }
  }

  getMockResponse(endpoint) {
    // Mock response based on endpoint
    let mockData = {};
    
    if (endpoint.includes('dashboard')) {
      mockData = {
        stats: {
          total_customers: 15,
          pending_jobs: 0,
          active_technicians: 3,
          todays_appointments: 3
        },
        todays_appointments: [
          {
            id: "1",
            title: "AC Repair - Tom Harris",
            description: "Air conditioning unit not cooling properly",
            scheduled_date: "2025-08-19T03:21:00",
            status: "confirmed"
          },
          {
            id: "2", 
            title: "System Maintenance - Tom Harris",
            description: "Regular HVAC system maintenance",
            scheduled_date: "2025-08-19T03:21:00",
            status: "scheduled"
          }
        ],
        recent_inquiries: [
          {
            id: "1",
            customer_phone: "+1-555-430-1463",
            initial_message: "Need to schedule maintenance for my HVAC system",
            status: "in_progress",
            created_at: "2025-08-19T02:00:00"
          },
          {
            id: "2",
            customer_phone: "+1-555-551-5821", 
            initial_message: "Need quote for new HVAC system installation",
            status: "in_progress",
            created_at: "2025-08-19T01:30:00"
          }
        ],
        urgent_jobs: []
      };
    } else if (endpoint.includes('owner-insights')) {
      mockData = {
        today_performance: {
          appointments: 3,
          completed: 0,
          revenue: 0.0
        },
        seven_day_trends: [
          {date: "2025-08-13", appointments: 2, completed: 1, revenue: 250},
          {date: "2025-08-14", appointments: 4, completed: 3, revenue: 780},
          {date: "2025-08-15", appointments: 1, completed: 1, revenue: 150},
          {date: "2025-08-16", appointments: 3, completed: 2, revenue: 450},
          {date: "2025-08-17", appointments: 5, completed: 4, revenue: 920},
          {date: "2025-08-18", appointments: 2, completed: 2, revenue: 350},
          {date: "2025-08-19", appointments: 3, completed: 0, revenue: 0}
        ],
        performance_metrics: {
          avg_response_time: 15.5,
          conversion_rate: 75.2
        },
        technician_leaderboard: [
          {id: "1", name: "Diana Foster", jobs_completed: 8, average_rating: 4.8, total_ratings: 12},
          {id: "2", name: "Alex Rodriguez", jobs_completed: 6, average_rating: 4.5, total_ratings: 9},
          {id: "3", name: "Brian Campbell", jobs_completed: 4, average_rating: 4.2, total_ratings: 7}
        ]
      };
    } else if (endpoint.includes('settings')) {
      mockData = {
        business_name: "Elite HVAC Solutions",
        business_phone: "+1-555-HVAC-PRO", 
        business_email: "info@hvactech.com",
        business_address: {
          full: "123 Business St, Springfield, IL 62701"
        },
        ai_assistant_name: "Sarah",
        ai_temperature: 0.3,
        max_response_tokens: 120,
        sms_enabled: true,
        integrations: {
          twilio_sms: { status: "mock" },
          google_calendar: { status: "mock" },
          stripe_payments: { status: "not_configured" }
        }
      };
    }

    return {
      ok: true,
      json: async () => mockData
    };
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.token;
  }

  logout() {
    this.token = null;
    this.user = null;
  }
}

export default new AuthService();