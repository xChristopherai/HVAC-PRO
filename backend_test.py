#!/usr/bin/env python3
"""
HVAC Assistant Backend API Testing Suite
Tests all major endpoints and functionality
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class HVACAPITester:
    def __init__(self, base_url="https://hvac-assist-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.company_id = "company-001"  # Elite HVAC Solutions
        
    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    token: str = None, params: Dict = None) -> tuple[bool, Dict]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, params=params, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
                
            return response.status_code < 400, response.json() if response.content else {}
            
        except requests.exceptions.Timeout:
            return False, {"error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return False, {"error": "Connection error"}
        except Exception as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test basic health endpoint"""
        success, data = self.make_request('GET', '/health')
        self.log_test("Health Check", success, f"Status: {data.get('status', 'unknown')}")
        return success

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, data = self.make_request('GET', '/')
        expected_message = "HVAC Assistant API v2.0"
        message_correct = data.get('message') == expected_message
        self.log_test("Root Endpoint", success and message_correct, 
                     f"Message: {data.get('message', 'none')}")
        return success and message_correct

    def test_admin_login(self):
        """Test admin authentication"""
        credentials = {
            "email": "admin@hvactech.com",
            "password": "HvacAdmin2024!"
        }
        
        success, data = self.make_request('POST', '/admin/login', credentials)
        
        if success and 'access_token' in data:
            self.admin_token = data['access_token']
            self.log_test("Admin Login", True, "Token received")
            return True
        else:
            self.log_test("Admin Login", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_mock_user_login(self):
        """Test mock user authentication"""
        credentials = {
            "role": "owner",
            "company_id": self.company_id
        }
        
        success, data = self.make_request('POST', '/auth/login', credentials)
        
        if success and 'access_token' in data:
            self.user_token = data['access_token']
            self.log_test("Mock User Login", True, "Token received")
            return True
        else:
            self.log_test("Mock User Login", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_dashboard_data(self):
        """Test main dashboard endpoint"""
        success, data = self.make_request('GET', f'/dashboard/{self.company_id}', token=self.user_token)
        
        if success:
            required_keys = ['stats', 'todays_appointments', 'recent_inquiries', 'urgent_jobs']
            has_all_keys = all(key in data for key in required_keys)
            
            stats = data.get('stats', {})
            stats_keys = ['total_customers', 'pending_jobs', 'active_technicians', 'todays_appointments']
            has_stats = all(key in stats for key in stats_keys)
            
            self.log_test("Dashboard Data", has_all_keys and has_stats, 
                         f"Customers: {stats.get('total_customers', 0)}, Jobs: {stats.get('pending_jobs', 0)}")
            return has_all_keys and has_stats
        else:
            self.log_test("Dashboard Data", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_owner_insights(self):
        """Test owner insights analytics endpoint"""
        params = {"company_id": self.company_id}
        success, data = self.make_request('GET', '/owner-insights', params=params, token=self.user_token)
        
        if success:
            required_keys = ['today_performance', 'seven_day_trends', 'performance_metrics', 'technician_leaderboard']
            has_all_keys = all(key in data for key in required_keys)
            
            trends = data.get('seven_day_trends', [])
            has_trends = len(trends) == 7
            
            self.log_test("Owner Insights", has_all_keys and has_trends, 
                         f"7-day trends: {len(trends)} days, Revenue today: ${data.get('today_performance', {}).get('revenue', 0)}")
            return has_all_keys and has_trends
        else:
            self.log_test("Owner Insights", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_company_settings(self):
        """Test company settings endpoint"""
        success, data = self.make_request('GET', f'/settings/{self.company_id}', token=self.user_token)
        
        if success:
            has_integrations = 'integrations' in data
            integrations = data.get('integrations', {})
            expected_integrations = ['google_calendar', 'twilio_sms', 'stripe_payments']
            has_expected = all(key in integrations for key in expected_integrations)
            
            self.log_test("Company Settings", has_integrations and has_expected, 
                         f"Integrations: {list(integrations.keys())}")
            return has_integrations and has_expected
        else:
            self.log_test("Company Settings", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_customers_list(self):
        """Test customers listing endpoint"""
        params = {"company_id": self.company_id}
        success, data = self.make_request('GET', '/customers', params=params, token=self.user_token)
        
        if success:
            is_list = isinstance(data, list)
            customer_count = len(data) if is_list else 0
            
            self.log_test("Customers List", is_list, f"Found {customer_count} customers")
            return is_list
        else:
            self.log_test("Customers List", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_technicians_list(self):
        """Test technicians listing endpoint"""
        params = {"company_id": self.company_id}
        success, data = self.make_request('GET', '/technicians', params=params, token=self.user_token)
        
        if success:
            is_list = isinstance(data, list)
            tech_count = len(data) if is_list else 0
            
            self.log_test("Technicians List", is_list, f"Found {tech_count} technicians")
            return is_list
        else:
            self.log_test("Technicians List", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_appointments_list(self):
        """Test appointments listing endpoint"""
        params = {"company_id": self.company_id}
        success, data = self.make_request('GET', '/appointments', params=params, token=self.user_token)
        
        if success:
            is_list = isinstance(data, list)
            appt_count = len(data) if is_list else 0
            
            self.log_test("Appointments List", is_list, f"Found {appt_count} appointments")
            return is_list
        else:
            self.log_test("Appointments List", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_jobs_list(self):
        """Test jobs listing endpoint"""
        params = {"company_id": self.company_id}
        success, data = self.make_request('GET', '/jobs', params=params, token=self.user_token)
        
        if success:
            is_list = isinstance(data, list)
            job_count = len(data) if is_list else 0
            
            self.log_test("Jobs List", is_list, f"Found {job_count} jobs")
            return is_list
        else:
            self.log_test("Jobs List", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_inquiries_list(self):
        """Test SMS inquiries listing endpoint"""
        params = {"company_id": self.company_id}
        success, data = self.make_request('GET', '/inquiries', params=params, token=self.user_token)
        
        if success:
            is_list = isinstance(data, list)
            inquiry_count = len(data) if is_list else 0
            
            self.log_test("Inquiries List", is_list, f"Found {inquiry_count} inquiries")
            return is_list
        else:
            self.log_test("Inquiries List", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_admin_analytics(self):
        """Test admin analytics endpoint"""
        success, data = self.make_request('GET', '/admin/analytics', token=self.admin_token)
        
        if success:
            required_keys = ['overview', 'companies']
            has_all_keys = all(key in data for key in required_keys)
            
            overview = data.get('overview', {})
            overview_keys = ['total_companies', 'active_companies', 'monthly_appointments']
            has_overview = all(key in overview for key in overview_keys)
            
            self.log_test("Admin Analytics", has_all_keys and has_overview, 
                         f"Companies: {overview.get('total_companies', 0)}, Active: {overview.get('active_companies', 0)}")
            return has_all_keys and has_overview
        else:
            self.log_test("Admin Analytics", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_company_details(self):
        """Test company details endpoint"""
        success, data = self.make_request('GET', f'/companies/{self.company_id}', token=self.user_token)
        
        if success:
            required_keys = ['id', 'name', 'status']
            has_all_keys = all(key in data for key in required_keys)
            is_elite_hvac = data.get('name') == 'Elite HVAC Solutions'
            
            self.log_test("Company Details", has_all_keys and is_elite_hvac, 
                         f"Company: {data.get('name', 'Unknown')}, Status: {data.get('status', 'Unknown')}")
            return has_all_keys and is_elite_hvac
        else:
            self.log_test("Company Details", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting HVAC Assistant Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity tests
        print("\n📡 Basic Connectivity Tests:")
        self.test_health_check()
        self.test_root_endpoint()
        
        # Authentication tests
        print("\n🔐 Authentication Tests:")
        admin_login_success = self.test_admin_login()
        user_login_success = self.test_mock_user_login()
        
        if not user_login_success:
            print("❌ Cannot proceed without user authentication")
            return False
            
        # Core business endpoints
        print("\n📊 Core Business Endpoints:")
        self.test_dashboard_data()
        self.test_owner_insights()
        self.test_company_settings()
        self.test_company_details()
        
        # Data listing endpoints
        print("\n📋 Data Listing Endpoints:")
        self.test_customers_list()
        self.test_technicians_list()
        self.test_appointments_list()
        self.test_jobs_list()
        self.test_inquiries_list()
        
        # Admin endpoints (if admin login succeeded)
        if admin_login_success:
            print("\n👑 Admin Endpoints:")
            self.test_admin_analytics()
        
        # Final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Backend API is functioning well!")
            return True
        elif success_rate >= 50:
            print("⚠️  Backend has some issues but core functionality works")
            return True
        else:
            print("🚨 Backend has major issues - needs attention")
            return False

def main():
    """Main test execution"""
    tester = HVACAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())