// Authentication utility for HVAC Assistant
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

class AuthService {
  constructor() {
    this.token = localStorage.getItem('hvac_token');
  }

  async login(role = 'owner', companyId = 'company-001') {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: role,
          company_id: companyId
        })
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.access_token;
      localStorage.setItem('hvac_token', this.token);
      
      return this.token;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async authenticatedFetch(endpoint, options = {}) {
    // Ensure we have a token
    if (!this.token) {
      await this.login();
    }

    // Construct full URL
    const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}/api/${endpoint.replace(/^\//, '')}`;

    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders()
      }
    };

    const response = await fetch(url, authOptions);
    
    // If unauthorized, try to re-login once
    if (response.status === 401 && !options._retried) {
      await this.login();
      return this.authenticatedFetch(endpoint, { ...options, _retried: true });
    }

    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('hvac_token');
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export default new AuthService();