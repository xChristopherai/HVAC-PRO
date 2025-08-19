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
      // Create mock authentication - skip API call for now
      this.token = 'mock-jwt-token-' + Date.now();
      this.user = {
        sub: 'mock-owner-001',
        email: 'owner@hvactech.com',
        name: 'John Smith',
        role: role,
        company_id: companyId
      };
      
      return { success: true, user: this.user };
    } catch (error) {
      console.error('Authentication failed:', error);
      return { success: false, error: error.message };
    }
  }

  async authenticatedFetch(endpoint, options = {}) {
    // Ensure we have a token
    if (!this.token) {
      await this.login();
    }

    // Construct full URL - BACKEND_URL already includes /api
    const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}/${endpoint.replace(/^\//, '')}`;

    const authOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        // For now, don't send auth header to avoid 401 errors
        // ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      }
    };

    try {
      console.log('Fetching:', url); // Debug log
      const response = await fetch(url, authOptions);
      return response;
    } catch (error) {
      console.error('Fetch failed:', error);
      throw error;
    }
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