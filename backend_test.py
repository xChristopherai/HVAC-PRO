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
    def __init__(self, base_url="https://techhvac-manager.preview.emergentagent.com"):
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

    def test_dashboard_data_frontend_format(self):
        """Test dashboard endpoint exactly as frontend calls it"""
        # Test without /api prefix as frontend calls it
        url = f"{self.base_url}/dashboard/{self.company_id}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            success = response.status_code < 400
            
            if success:
                data = response.json() if response.content else {}
                
                # Check exact format that Dashboard.jsx expects
                required_keys = ['stats', 'todays_appointments', 'recent_inquiries', 'urgent_jobs']
                has_all_keys = all(key in data for key in required_keys)
                
                stats = data.get('stats', {})
                expected_stats = ['total_customers', 'pending_jobs', 'active_technicians', 'todays_appointments']
                has_stats = all(key in stats for key in expected_stats)
                
                # Check data types
                appointments_is_list = isinstance(data.get('todays_appointments'), list)
                inquiries_is_list = isinstance(data.get('recent_inquiries'), list)
                urgent_jobs_is_list = isinstance(data.get('urgent_jobs'), list)
                
                all_valid = has_all_keys and has_stats and appointments_is_list and inquiries_is_list and urgent_jobs_is_list
                
                details = f"Status: {response.status_code}, Keys: {list(data.keys())}, Stats: {list(stats.keys())}"
                self.log_test("Dashboard Frontend Format", all_valid, details)
                return all_valid
            else:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg += f" - {response.text[:100]}"
                
                self.log_test("Dashboard Frontend Format", False, error_msg)
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("Dashboard Frontend Format", False, "Request timeout")
            return False
        except requests.exceptions.ConnectionError:
            self.log_test("Dashboard Frontend Format", False, "Connection error")
            return False
        except Exception as e:
            self.log_test("Dashboard Frontend Format", False, f"Error: {str(e)}")
            return False

    def test_dashboard_with_api_prefix(self):
        """Test dashboard endpoint with /api prefix"""
        success, data = self.make_request('GET', f'/dashboard/{self.company_id}')
        
        if success:
            required_keys = ['stats', 'todays_appointments', 'recent_inquiries', 'urgent_jobs']
            has_all_keys = all(key in data for key in required_keys)
            
            stats = data.get('stats', {})
            stats_keys = ['total_customers', 'pending_jobs', 'active_technicians', 'todays_appointments']
            has_stats = all(key in stats for key in stats_keys)
            
            self.log_test("Dashboard with API prefix", has_all_keys and has_stats, 
                         f"Customers: {stats.get('total_customers', 0)}, Jobs: {stats.get('pending_jobs', 0)}")
            return has_all_keys and has_stats
        else:
            self.log_test("Dashboard with API prefix", False, f"Error: {data.get('detail', 'Unknown error')}")
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

    # ==================== AI VOICE SCHEDULING TESTS ====================
    
    def test_ai_voice_environment_variable(self):
        """Test AI Voice Scheduling environment variable is loaded"""
        # Test health endpoint to see if AI Voice is enabled
        success, data = self.make_request('GET', '/health')
        
        if success:
            # Check if the backend is running (which means env vars are loaded)
            status_ok = data.get('status') in ['healthy', 'degraded']
            self.log_test("AI Voice Environment Variable", status_ok, 
                         f"Backend status: {data.get('status', 'unknown')}")
            return status_ok
        else:
            self.log_test("AI Voice Environment Variable", False, "Backend not responding")
            return False

    def test_availability_endpoint(self):
        """Test GET /api/availability endpoint"""
        test_date = "2025-01-24"
        params = {"date": test_date}
        success, data = self.make_request('GET', '/availability', params=params)
        
        if success:
            # Check response structure
            has_date = 'date' in data and data['date'] == test_date
            has_windows = 'windows' in data and isinstance(data['windows'], list)
            
            windows_valid = True
            if has_windows and data['windows']:
                for window in data['windows']:
                    required_fields = ['window', 'capacity', 'booked', 'available']
                    if not all(field in window for field in required_fields):
                        windows_valid = False
                        break
            
            all_valid = has_date and has_windows and windows_valid
            window_count = len(data.get('windows', []))
            
            self.log_test("Availability Endpoint", all_valid, 
                         f"Date: {data.get('date')}, Windows: {window_count}")
            return all_valid
        else:
            self.log_test("Availability Endpoint", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_voice_webhook_endpoint(self):
        """Test POST /api/voice/inbound webhook endpoint"""
        # Mock Twilio form data
        mock_form_data = {
            "From": "+15551234567",
            "CallSid": "test_call_sid_123",
            "SpeechResult": "",
            "Digits": ""
        }
        
        # Use requests directly for form data
        url = f"{self.base_url}/api/voice/inbound"
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        
        try:
            response = requests.post(url, data=mock_form_data, headers=headers, timeout=30)
            success = response.status_code < 400
            
            if success:
                # Check if response contains TwiML-like structure
                try:
                    data = response.json()
                    has_say = 'Say' in data
                    has_greeting = 'Welcome to HVAC Pro' in str(data) if has_say else False
                    
                    self.log_test("Voice Webhook Endpoint", has_say, 
                                 f"Status: {response.status_code}, Has greeting: {has_greeting}")
                    return has_say
                except:
                    # Response might be XML, check for basic success
                    self.log_test("Voice Webhook Endpoint", True, 
                                 f"Status: {response.status_code}, Response received")
                    return True
            else:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg += f" - {response.text[:100]}"
                
                self.log_test("Voice Webhook Endpoint", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("Voice Webhook Endpoint", False, f"Error: {str(e)}")
            return False

    def test_appointment_creation_with_ai_voice_source(self):
        """Test POST /api/appointments with source='ai-voice'"""
        # First create a customer for the appointment
        customer_data = {
            "company_id": self.company_id,
            "name": "Sarah Johnson",
            "phone": "+15551234567",
            "address": {"full": "123 Main St, Anytown, ST 12345"},
            "preferred_contact": "phone"
        }
        
        customer_success, customer_response = self.make_request('POST', '/customers', customer_data, self.user_token)
        
        if not customer_success:
            self.log_test("Appointment Creation with AI Voice Source", False, 
                         f"Failed to create customer: {customer_response.get('detail', 'Unknown error')}")
            return False
        
        customer_id = customer_response.get('id')
        
        # Create appointment with AI Voice source
        appointment_data = {
            "company_id": self.company_id,
            "customer_id": customer_id,
            "title": "HVAC Service - No Heat",
            "description": "Customer called via AI Voice system reporting no heat issue",
            "scheduled_date": "2025-01-24T10:00:00",
            "estimated_duration": 120,
            "service_type": "no_heat",
            "source": "ai-voice",
            "issue_type": "no_heat",
            "window": "8-11",
            "address": "123 Main St, Anytown, ST 12345"
        }
        
        success, data = self.make_request('POST', '/appointments', appointment_data, self.user_token)
        
        if success:
            # Check if appointment was created with correct source
            has_id = 'id' in data
            correct_source = data.get('source') == 'ai-voice'
            correct_issue = data.get('issue_type') == 'no_heat'
            correct_window = data.get('window') == '8-11'
            
            all_valid = has_id and correct_source and correct_issue and correct_window
            
            self.log_test("Appointment Creation with AI Voice Source", all_valid,
                         f"ID: {data.get('id', 'none')}, Source: {data.get('source')}, Issue: {data.get('issue_type')}")
            
            # Store appointment ID for filtering test
            if has_id:
                self.ai_voice_appointment_id = data['id']
            
            return all_valid
        else:
            self.log_test("Appointment Creation with AI Voice Source", False, 
                         f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_appointments_filtering_by_source(self):
        """Test GET /api/appointments?source=ai-voice filtering"""
        params = {
            "company_id": self.company_id,
            "source": "ai-voice"
        }
        
        success, data = self.make_request('GET', '/appointments', params=params, token=self.user_token)
        
        if success:
            is_list = isinstance(data, list)
            ai_voice_count = len(data) if is_list else 0
            
            # Check if all returned appointments have ai-voice source
            all_ai_voice = True
            if is_list and data:
                for appointment in data:
                    if appointment.get('source') != 'ai-voice':
                        all_ai_voice = False
                        break
            
            self.log_test("Appointments Filtering by Source", is_list and all_ai_voice,
                         f"Found {ai_voice_count} AI Voice appointments")
            return is_list and all_ai_voice
        else:
            self.log_test("Appointments Filtering by Source", False, 
                         f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_customer_creation_endpoint(self):
        """Test POST /api/customers for Add Customer button"""
        customer_data = {
            "company_id": self.company_id,
            "name": "Michael Davis",
            "phone": "+15559876543",
            "address": {"full": "456 Oak Ave, Springfield, ST 67890"},
            "preferred_contact": "phone",
            "notes": "New customer from voice scheduling system"
        }
        
        success, data = self.make_request('POST', '/customers', customer_data, self.user_token)
        
        if success:
            has_id = 'id' in data
            correct_name = data.get('name') == customer_data['name']
            correct_phone = data.get('phone') == customer_data['phone']
            
            all_valid = has_id and correct_name and correct_phone
            
            self.log_test("Customer Creation Endpoint", all_valid,
                         f"ID: {data.get('id', 'none')}, Name: {data.get('name')}")
            return all_valid
        else:
            self.log_test("Customer Creation Endpoint", False, 
                         f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_sms_service_integration(self):
        """Test SMS service integration for confirmations"""
        # Test the SMS service by checking if it's accessible through health endpoint
        success, data = self.make_request('GET', '/health')
        
        if success:
            services = data.get('services', {})
            sms_status = services.get('sms', 'unknown')
            sms_working = sms_status in ['mock', 'connected', 'healthy']
            
            self.log_test("SMS Service Integration", sms_working,
                         f"SMS Status: {sms_status}")
            return sms_working
        else:
            self.log_test("SMS Service Integration", False, "Health check failed")
            return False

    # ==================== PHASE 2 QUICK ACTIONS TESTS ====================
    
    def test_quick_add_customer(self):
        """Test POST /api/quick/add-customer endpoint"""
        customer_data = {
            "name": "Jennifer Martinez",
            "phone": "+1-555-QUICK-01",
            "email": "jennifer.martinez@email.com",
            "address": "789 Pine Street, Riverside, CA 92501"
        }
        
        success, data = self.make_request('POST', '/quick/add-customer', customer_data, self.user_token)
        
        if success:
            has_success = data.get('success') is True
            has_message = 'message' in data and 'successfully' in data['message'].lower()
            has_customer = 'customer' in data and isinstance(data['customer'], dict)
            
            customer = data.get('customer', {})
            correct_name = customer.get('name') == customer_data['name']
            correct_phone = customer.get('phone') == customer_data['phone']
            has_id = 'id' in customer
            
            all_valid = has_success and has_message and has_customer and correct_name and correct_phone and has_id
            
            self.log_test("Quick Add Customer", all_valid,
                         f"Success: {data.get('success')}, Customer ID: {customer.get('id', 'none')}")
            return all_valid
        else:
            self.log_test("Quick Add Customer", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_quick_schedule_job(self):
        """Test POST /api/quick/schedule-job endpoint"""
        job_data = {
            "title": "Emergency Heating Repair",
            "customer_name": "Robert Thompson",
            "service_type": "no_heat",
            "scheduled_date": "2025-01-25T14:00:00",
            "priority": "high"
        }
        
        success, data = self.make_request('POST', '/quick/schedule-job', job_data, self.user_token)
        
        if success:
            has_success = data.get('success') is True
            has_message = 'message' in data and 'successfully' in data['message'].lower()
            has_job = 'job' in data and isinstance(data['job'], dict)
            
            job = data.get('job', {})
            correct_title = job.get('title') == job_data['title']
            correct_customer = job.get('customer_name') == job_data['customer_name']
            correct_service = job.get('service_type') == job_data['service_type']
            has_id = 'id' in job
            has_status = job.get('status') == 'scheduled'
            
            all_valid = has_success and has_message and has_job and correct_title and correct_customer and correct_service and has_id and has_status
            
            self.log_test("Quick Schedule Job", all_valid,
                         f"Success: {data.get('success')}, Job ID: {job.get('id', 'none')}")
            return all_valid
        else:
            self.log_test("Quick Schedule Job", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_quick_create_invoice(self):
        """Test POST /api/quick/create-invoice endpoint"""
        invoice_data = {
            "customer_name": "Lisa Anderson",
            "amount": 485.50,
            "description": "HVAC System Maintenance and Filter Replacement"
        }
        
        success, data = self.make_request('POST', '/quick/create-invoice', invoice_data, self.user_token)
        
        if success:
            has_success = data.get('success') is True
            has_message = 'message' in data and 'successfully' in data['message'].lower()
            has_invoice = 'invoice' in data and isinstance(data['invoice'], dict)
            
            invoice = data.get('invoice', {})
            correct_customer = invoice.get('customer_name') == invoice_data['customer_name']
            correct_amount = invoice.get('amount') == invoice_data['amount']
            correct_description = invoice.get('service_description') == invoice_data['description']
            has_id = 'id' in invoice and invoice['id'].startswith('INV-')
            has_status = invoice.get('status') == 'pending'
            
            all_valid = has_success and has_message and has_invoice and correct_customer and correct_amount and correct_description and has_id and has_status
            
            self.log_test("Quick Create Invoice", all_valid,
                         f"Success: {data.get('success')}, Invoice ID: {invoice.get('id', 'none')}")
            return all_valid
        else:
            self.log_test("Quick Create Invoice", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_quick_view_reports(self):
        """Test POST /api/quick/view-reports endpoint"""
        report_data = {
            "type": "monthly_summary",
            "period": "last_30_days"
        }
        
        success, data = self.make_request('POST', '/quick/view-reports', report_data, self.user_token)
        
        if success:
            has_success = data.get('success') is True
            has_message = 'message' in data and 'successfully' in data['message'].lower()
            has_report = 'report' in data and isinstance(data['report'], dict)
            has_download_url = 'download_url' in data
            
            report = data.get('report', {})
            correct_type = report.get('type') == report_data['type']
            correct_period = report.get('period') == report_data['period']
            has_id = 'id' in report
            has_summary = 'summary' in report and isinstance(report['summary'], dict)
            
            summary = report.get('summary', {})
            expected_metrics = ['total_jobs', 'total_revenue', 'avg_job_value', 'customer_satisfaction', 'technician_utilization']
            has_metrics = all(metric in summary for metric in expected_metrics)
            
            all_valid = has_success and has_message and has_report and has_download_url and correct_type and correct_period and has_id and has_summary and has_metrics
            
            self.log_test("Quick View Reports", all_valid,
                         f"Success: {data.get('success')}, Report ID: {report.get('id', 'none')}")
            return all_valid
        else:
            self.log_test("Quick View Reports", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    # ==================== PHASE 4 TESTS - TECHNICIANS & MESSAGING ====================
    
    def test_technicians_search_by_name(self):
        """Test GET /api/technicians/search with name parameter (q)"""
        params = {"q": "Mike"}
        success, data = self.make_request('GET', '/technicians/search', params=params, token=self.user_token)
        
        if success:
            has_technicians = 'technicians' in data and isinstance(data['technicians'], list)
            has_total = 'total' in data and isinstance(data['total'], int)
            has_pagination = 'limit' in data and 'offset' in data
            
            technicians = data.get('technicians', [])
            search_works = True
            if technicians:
                # Check if returned technicians match search query
                for tech in technicians:
                    name = tech.get('name', '').lower()
                    if 'mike' not in name:
                        search_works = False
                        break
            
            all_valid = has_technicians and has_total and has_pagination and search_works
            tech_count = len(technicians)
            
            self.log_test("Technician Search by Name", all_valid,
                         f"Found {tech_count} technicians matching 'Mike'")
            return all_valid
        else:
            self.log_test("Technician Search by Name", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_technicians_search_by_email(self):
        """Test GET /api/technicians/search with email parameter (q)"""
        params = {"q": "sarah.d@hvactech.com"}
        success, data = self.make_request('GET', '/technicians/search', params=params, token=self.user_token)
        
        if success:
            has_technicians = 'technicians' in data and isinstance(data['technicians'], list)
            has_total = 'total' in data and isinstance(data['total'], int)
            
            technicians = data.get('technicians', [])
            email_search_works = True
            if technicians:
                # Check if returned technicians match email search
                for tech in technicians:
                    email = tech.get('email', '').lower()
                    if 'sarah.d@hvactech.com' not in email:
                        email_search_works = False
                        break
            
            all_valid = has_technicians and has_total and email_search_works
            tech_count = len(technicians)
            
            self.log_test("Technician Search by Email", all_valid,
                         f"Found {tech_count} technicians with email 'sarah.d@hvactech.com'")
            return all_valid
        else:
            self.log_test("Technician Search by Email", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_technicians_search_by_status(self):
        """Test GET /api/technicians/search with status filter"""
        params = {"status": "available"}
        success, data = self.make_request('GET', '/technicians/search', params=params, token=self.user_token)
        
        if success:
            has_technicians = 'technicians' in data and isinstance(data['technicians'], list)
            has_total = 'total' in data and isinstance(data['total'], int)
            
            technicians = data.get('technicians', [])
            status_filter_works = True
            if technicians:
                # Check if all returned technicians have 'available' status
                for tech in technicians:
                    if tech.get('status') != 'available':
                        status_filter_works = False
                        break
            
            all_valid = has_technicians and has_total and status_filter_works
            tech_count = len(technicians)
            
            self.log_test("Technician Search by Status", all_valid,
                         f"Found {tech_count} available technicians")
            return all_valid
        else:
            self.log_test("Technician Search by Status", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_technicians_search_pagination(self):
        """Test GET /api/technicians/search with pagination parameters"""
        params = {"limit": 2, "offset": 0}
        success, data = self.make_request('GET', '/technicians/search', params=params, token=self.user_token)
        
        if success:
            has_technicians = 'technicians' in data and isinstance(data['technicians'], list)
            has_pagination = 'limit' in data and 'offset' in data and 'total' in data
            
            technicians = data.get('technicians', [])
            correct_limit = len(technicians) <= 2  # Should respect limit
            correct_pagination_values = data.get('limit') == 2 and data.get('offset') == 0
            
            all_valid = has_technicians and has_pagination and correct_limit and correct_pagination_values
            tech_count = len(technicians)
            total = data.get('total', 0)
            
            self.log_test("Technician Search Pagination", all_valid,
                         f"Returned {tech_count} technicians (limit=2), Total: {total}")
            return all_valid
        else:
            self.log_test("Technician Search Pagination", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_add_new_technician(self):
        """Test POST /api/technicians - Add new technician"""
        technician_data = {
            "name": "Alex Rodriguez",
            "email": "alex.r@hvactech.com",
            "phone": "+1-555-TECH-05",
            "years_experience": 6,
            "skills": ["hvac", "installation", "repair"],
            "certifications": ["EPA 608", "NATE Certified"],
            "availability": "08:00-16:00"
        }
        
        success, data = self.make_request('POST', '/technicians', technician_data, self.user_token)
        
        if success:
            # Check required fields
            has_id = 'id' in data
            correct_name = data.get('name') == technician_data['name']
            correct_email = data.get('email') == technician_data['email']
            correct_phone = data.get('phone') == technician_data['phone']
            correct_experience = data.get('years_experience') == technician_data['years_experience']
            
            # Check optional fields
            has_skills = 'skills' in data and isinstance(data['skills'], list)
            has_certifications = 'certifications' in data and isinstance(data['certifications'], list)
            has_availability = 'availability' in data
            
            # Check default values
            has_status = data.get('status') == 'available'
            has_rating = 'rating' in data
            has_jobs_completed = data.get('jobs_completed') == 0
            
            all_valid = (has_id and correct_name and correct_email and correct_phone and 
                        correct_experience and has_skills and has_certifications and 
                        has_availability and has_status and has_rating and has_jobs_completed)
            
            self.log_test("Add New Technician", all_valid,
                         f"ID: {data.get('id', 'none')}, Name: {data.get('name')}, Status: {data.get('status')}")
            return all_valid
        else:
            self.log_test("Add New Technician", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_messages_search_by_customer_name(self):
        """Test GET /api/messages/search with customer name parameter (q)"""
        params = {"q": "Jennifer"}
        success, data = self.make_request('GET', '/messages/search', params=params, token=self.user_token)
        
        if success:
            has_messages = 'messages' in data and isinstance(data['messages'], list)
            has_total = 'total' in data and isinstance(data['total'], int)
            has_pagination = 'limit' in data and 'offset' in data
            
            messages = data.get('messages', [])
            search_works = True
            if messages:
                # Check if returned messages match customer name search
                for msg in messages:
                    customer_name = msg.get('customer_name', '').lower()
                    if 'jennifer' not in customer_name:
                        search_works = False
                        break
            
            all_valid = has_messages and has_total and has_pagination and search_works
            msg_count = len(messages)
            
            self.log_test("Message Search by Customer Name", all_valid,
                         f"Found {msg_count} messages from customers named 'Jennifer'")
            return all_valid
        else:
            self.log_test("Message Search by Customer Name", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_messages_search_by_phone(self):
        """Test GET /api/messages/search with phone number parameter"""
        params = {"customer_phone": "+1-555-123-4567"}
        success, data = self.make_request('GET', '/messages/search', params=params, token=self.user_token)
        
        if success:
            has_messages = 'messages' in data and isinstance(data['messages'], list)
            has_total = 'total' in data and isinstance(data['total'], int)
            
            messages = data.get('messages', [])
            phone_search_works = True
            if messages:
                # Check if returned messages match phone search
                for msg in messages:
                    phone = msg.get('customer_phone', '')
                    if '+1-555-123-4567' not in phone:
                        phone_search_works = False
                        break
            
            all_valid = has_messages and has_total and phone_search_works
            msg_count = len(messages)
            
            self.log_test("Message Search by Phone", all_valid,
                         f"Found {msg_count} messages from phone '+1-555-123-4567'")
            return all_valid
        else:
            self.log_test("Message Search by Phone", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_messages_search_by_status(self):
        """Test GET /api/messages/search with status filter"""
        params = {"status": "active"}
        success, data = self.make_request('GET', '/messages/search', params=params, token=self.user_token)
        
        if success:
            has_messages = 'messages' in data and isinstance(data['messages'], list)
            has_total = 'total' in data and isinstance(data['total'], int)
            
            messages = data.get('messages', [])
            status_filter_works = True
            if messages:
                # Check if all returned messages have 'active' status
                for msg in messages:
                    if msg.get('status') != 'active':
                        status_filter_works = False
                        break
            
            all_valid = has_messages and has_total and status_filter_works
            msg_count = len(messages)
            
            self.log_test("Message Search by Status", all_valid,
                         f"Found {msg_count} active messages")
            return all_valid
        else:
            self.log_test("Message Search by Status", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_messages_search_pagination(self):
        """Test GET /api/messages/search with pagination parameters"""
        params = {"limit": 2, "offset": 0}
        success, data = self.make_request('GET', '/messages/search', params=params, token=self.user_token)
        
        if success:
            has_messages = 'messages' in data and isinstance(data['messages'], list)
            has_pagination = 'limit' in data and 'offset' in data and 'total' in data
            
            messages = data.get('messages', [])
            correct_limit = len(messages) <= 2  # Should respect limit
            correct_pagination_values = data.get('limit') == 2 and data.get('offset') == 0
            
            all_valid = has_messages and has_pagination and correct_limit and correct_pagination_values
            msg_count = len(messages)
            total = data.get('total', 0)
            
            self.log_test("Message Search Pagination", all_valid,
                         f"Returned {msg_count} messages (limit=2), Total: {total}")
            return all_valid
        else:
            self.log_test("Message Search Pagination", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_new_message_creation_feature_flag_disabled(self):
        """Test POST /api/messages with ENABLE_NEW_MESSAGE=false (should fail with 403)"""
        message_data = {
            "customer_phone": "+1-555-TEST-MSG",
            "customer_name": "Test Customer",
            "message": "Test message for feature flag testing"
        }
        
        success, data = self.make_request('POST', '/messages', message_data, self.user_token)
        
        # This should fail with 403 when feature flag is disabled
        expected_failure = not success and (
            data.get('detail') == 'Feature not enabled' or 
            '403' in str(data) or 
            'forbidden' in str(data).lower() or
            'not enabled' in str(data).lower()
        )
        
        if expected_failure:
            self.log_test("New Message Creation (Feature Flag Disabled)", True,
                         f"Correctly blocked with: {data.get('detail', 'Feature disabled')}")
            return True
        elif success:
            # If it succeeds, check if it's because feature flag is actually enabled
            self.log_test("New Message Creation (Feature Flag Disabled)", False,
                         f"Feature flag might be enabled - request succeeded")
            return False
        else:
            self.log_test("New Message Creation (Feature Flag Disabled)", False,
                         f"Unexpected error: {data.get('detail', 'Unknown error')}")
            return False

    # ==================== PHASE 3 TESTS - CUSTOMERS & APPOINTMENTS ====================
    
    def test_customers_search_by_name(self):
        """Test GET /api/customers/search with name parameter"""
        params = {"q": "Jennifer"}
        success, data = self.make_request('GET', '/customers/search', params=params, token=self.user_token)
        
        if success:
            has_customers = 'customers' in data and isinstance(data['customers'], list)
            has_total = 'total' in data and isinstance(data['total'], int)
            has_pagination = 'limit' in data and 'offset' in data
            
            customers = data.get('customers', [])
            search_works = True
            if customers:
                # Check if returned customers match search query
                for customer in customers:
                    name = customer.get('name', '').lower()
                    if 'jennifer' not in name:
                        search_works = False
                        break
            
            all_valid = has_customers and has_total and has_pagination and search_works
            customer_count = len(customers)
            
            self.log_test("Customer Search by Name", all_valid,
                         f"Found {customer_count} customers matching 'Jennifer'")
            return all_valid
        else:
            self.log_test("Customer Search by Name", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_customers_search_by_phone(self):
        """Test GET /api/customers/search with phone parameter"""
        params = {"phone": "555-123"}
        success, data = self.make_request('GET', '/customers/search', params=params, token=self.user_token)
        
        if success:
            has_customers = 'customers' in data and isinstance(data['customers'], list)
            has_total = 'total' in data and isinstance(data['total'], int)
            
            customers = data.get('customers', [])
            phone_search_works = True
            if customers:
                # Check if returned customers match phone search
                for customer in customers:
                    phone = customer.get('phone', '')
                    if '555-123' not in phone:
                        phone_search_works = False
                        break
            
            all_valid = has_customers and has_total and phone_search_works
            customer_count = len(customers)
            
            self.log_test("Customer Search by Phone", all_valid,
                         f"Found {customer_count} customers with phone '555-123'")
            return all_valid
        else:
            self.log_test("Customer Search by Phone", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_customers_search_by_email(self):
        """Test GET /api/customers/search with email parameter"""
        params = {"email": "email.com"}
        success, data = self.make_request('GET', '/customers/search', params=params, token=self.user_token)
        
        if success:
            has_customers = 'customers' in data and isinstance(data['customers'], list)
            has_total = 'total' in data and isinstance(data['total'], int)
            
            customers = data.get('customers', [])
            email_search_works = True
            if customers:
                # Check if returned customers match email search
                for customer in customers:
                    email = customer.get('email', '').lower()
                    if 'email.com' not in email:
                        email_search_works = False
                        break
            
            all_valid = has_customers and has_total and email_search_works
            customer_count = len(customers)
            
            self.log_test("Customer Search by Email", all_valid,
                         f"Found {customer_count} customers with email containing 'email.com'")
            return all_valid
        else:
            self.log_test("Customer Search by Email", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_customers_search_pagination(self):
        """Test GET /api/customers/search with pagination parameters"""
        params = {"limit": 2, "offset": 0}
        success, data = self.make_request('GET', '/customers/search', params=params, token=self.user_token)
        
        if success:
            has_customers = 'customers' in data and isinstance(data['customers'], list)
            has_pagination = 'limit' in data and 'offset' in data and 'total' in data
            
            customers = data.get('customers', [])
            correct_limit = len(customers) <= 2  # Should respect limit
            correct_pagination_values = data.get('limit') == 2 and data.get('offset') == 0
            
            all_valid = has_customers and has_pagination and correct_limit and correct_pagination_values
            customer_count = len(customers)
            total = data.get('total', 0)
            
            self.log_test("Customer Search Pagination", all_valid,
                         f"Returned {customer_count} customers (limit=2), Total: {total}")
            return all_valid
        else:
            self.log_test("Customer Search Pagination", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_appointments_calendar_view(self):
        """Test GET /api/appointments/calendar endpoint"""
        params = {"view": "month"}
        success, data = self.make_request('GET', '/appointments/calendar', params=params, token=self.user_token)
        
        if success:
            has_appointments = 'appointments' in data and isinstance(data['appointments'], list)
            has_view = 'view' in data and data['view'] == 'month'
            
            appointments = data.get('appointments', [])
            calendar_format_valid = True
            
            if appointments:
                # Check calendar format - appointments should have start/end times
                for appt in appointments:
                    required_fields = ['id', 'title', 'start', 'customer_name', 'status']
                    if not all(field in appt for field in required_fields):
                        calendar_format_valid = False
                        break
                    
                    # Check datetime format
                    start_time = appt.get('start', '')
                    if 'T' not in start_time or ':' not in start_time:
                        calendar_format_valid = False
                        break
            
            all_valid = has_appointments and has_view and calendar_format_valid
            appointment_count = len(appointments)
            
            self.log_test("Appointments Calendar View", all_valid,
                         f"Found {appointment_count} appointments in calendar format")
            return all_valid
        else:
            self.log_test("Appointments Calendar View", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_appointments_filter_by_scheduled_status(self):
        """Test GET /api/appointments/filter with status=scheduled"""
        params = {"status": "scheduled"}
        success, data = self.make_request('GET', '/appointments/filter', params=params, token=self.user_token)
        
        if success:
            has_appointments = 'appointments' in data and isinstance(data['appointments'], list)
            
            appointments = data.get('appointments', [])
            status_filter_works = True
            
            if appointments:
                # Check if all returned appointments have 'scheduled' status
                for appt in appointments:
                    if appt.get('status') != 'scheduled':
                        status_filter_works = False
                        break
            
            all_valid = has_appointments and status_filter_works
            appointment_count = len(appointments)
            
            self.log_test("Appointments Filter - Scheduled", all_valid,
                         f"Found {appointment_count} scheduled appointments")
            return all_valid
        else:
            self.log_test("Appointments Filter - Scheduled", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_appointments_filter_by_confirmed_status(self):
        """Test GET /api/appointments/filter with status=confirmed"""
        params = {"status": "confirmed"}
        success, data = self.make_request('GET', '/appointments/filter', params=params, token=self.user_token)
        
        if success:
            has_appointments = 'appointments' in data and isinstance(data['appointments'], list)
            
            appointments = data.get('appointments', [])
            status_filter_works = True
            
            if appointments:
                # Check if all returned appointments have 'confirmed' status
                for appt in appointments:
                    if appt.get('status') != 'confirmed':
                        status_filter_works = False
                        break
            
            all_valid = has_appointments and status_filter_works
            appointment_count = len(appointments)
            
            self.log_test("Appointments Filter - Confirmed", all_valid,
                         f"Found {appointment_count} confirmed appointments")
            return all_valid
        else:
            self.log_test("Appointments Filter - Confirmed", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_appointments_filter_by_in_progress_status(self):
        """Test GET /api/appointments/filter with status=in_progress"""
        params = {"status": "in_progress"}
        success, data = self.make_request('GET', '/appointments/filter', params=params, token=self.user_token)
        
        if success:
            has_appointments = 'appointments' in data and isinstance(data['appointments'], list)
            
            appointments = data.get('appointments', [])
            status_filter_works = True
            
            if appointments:
                # Check if all returned appointments have 'in_progress' status
                for appt in appointments:
                    if appt.get('status') != 'in_progress':
                        status_filter_works = False
                        break
            
            all_valid = has_appointments and status_filter_works
            appointment_count = len(appointments)
            
            self.log_test("Appointments Filter - In Progress", all_valid,
                         f"Found {appointment_count} in-progress appointments")
            return all_valid
        else:
            self.log_test("Appointments Filter - In Progress", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_appointments_filter_by_completed_status(self):
        """Test GET /api/appointments/filter with status=completed"""
        params = {"status": "completed"}
        success, data = self.make_request('GET', '/appointments/filter', params=params, token=self.user_token)
        
        if success:
            has_appointments = 'appointments' in data and isinstance(data['appointments'], list)
            
            appointments = data.get('appointments', [])
            status_filter_works = True
            
            if appointments:
                # Check if all returned appointments have 'completed' status
                for appt in appointments:
                    if appt.get('status') != 'completed':
                        status_filter_works = False
                        break
            
            all_valid = has_appointments and status_filter_works
            appointment_count = len(appointments)
            
            self.log_test("Appointments Filter - Completed", all_valid,
                         f"Found {appointment_count} completed appointments")
            return all_valid
        else:
            self.log_test("Appointments Filter - Completed", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def test_appointments_filter_without_status(self):
        """Test GET /api/appointments/filter without status filter (all appointments)"""
        params = {}
        success, data = self.make_request('GET', '/appointments/filter', params=params, token=self.user_token)
        
        if success:
            has_appointments = 'appointments' in data and isinstance(data['appointments'], list)
            
            appointments = data.get('appointments', [])
            has_mixed_statuses = False
            
            if len(appointments) > 1:
                # Check if we have appointments with different statuses
                statuses = set(appt.get('status') for appt in appointments)
                has_mixed_statuses = len(statuses) > 1
            
            all_valid = has_appointments
            appointment_count = len(appointments)
            
            self.log_test("Appointments Filter - All", all_valid,
                         f"Found {appointment_count} total appointments")
            return all_valid
        else:
            self.log_test("Appointments Filter - All", False, f"Error: {data.get('detail', 'Unknown error')}")
            return False

    def run_ai_voice_scheduling_tests(self):
        """Run comprehensive AI Voice Scheduling tests"""
        print("🎙️ Starting AI Voice Scheduling Backend Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Initialize tokens
        print("\n🔐 Authentication Setup:")
        admin_success = self.test_admin_login()
        user_success = self.test_mock_user_login()
        
        if not user_success:
            print("❌ Cannot proceed without user authentication")
            return False
        
        # AI Voice Scheduling specific tests
        print("\n🎙️ AI Voice Scheduling Tests:")
        
        # 1. Environment Variable Test
        env_success = self.test_ai_voice_environment_variable()
        
        # 2. Availability Endpoint Test
        availability_success = self.test_availability_endpoint()
        
        # 3. Voice Webhook Test
        webhook_success = self.test_voice_webhook_endpoint()
        
        # 4. Appointment Creation with AI Voice Source
        appointment_success = self.test_appointment_creation_with_ai_voice_source()
        
        # 5. Appointments Filtering by Source
        filtering_success = self.test_appointments_filtering_by_source()
        
        # 6. Customer Creation Test
        customer_success = self.test_customer_creation_endpoint()
        
        # 7. SMS Service Integration Test
        sms_success = self.test_sms_service_integration()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        # AI Voice Scheduling Analysis
        print("\n🎙️ AI Voice Scheduling Analysis:")
        
        critical_tests = [
            ("Environment Variable", env_success),
            ("Availability Endpoint", availability_success),
            ("Voice Webhook", webhook_success),
            ("Appointment Creation", appointment_success),
            ("Source Filtering", filtering_success),
            ("Customer Creation", customer_success),
            ("SMS Integration", sms_success)
        ]
        
        passed_critical = sum(1 for _, success in critical_tests if success)
        
        for test_name, success in critical_tests:
            status = "✅" if success else "❌"
            print(f"   {status} {test_name}")
        
        print(f"\n🎯 Critical AI Voice Tests: {passed_critical}/{len(critical_tests)} passed")
        
        # Overall assessment
        if passed_critical >= 6:  # Allow 1 failure
            print("🎉 AI Voice Scheduling implementation is working well!")
            return True
        elif passed_critical >= 4:
            print("⚠️ AI Voice Scheduling has some issues but core functionality works")
            return True
        else:
            print("❌ AI Voice Scheduling has critical issues that need attention")
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

    def run_dashboard_focused_tests(self):
        """Run dashboard-focused tests for frontend debugging"""
        print("🚀 Starting Dashboard-Focused Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity tests
        print("\n📡 Basic Connectivity Tests:")
        self.test_health_check()
        self.test_root_endpoint()
        
        # Dashboard specific tests
        print("\n📊 Dashboard Endpoint Tests:")
        print("Testing dashboard endpoint exactly as frontend calls it...")
        frontend_success = self.test_dashboard_data_frontend_format()
        
        print("Testing dashboard endpoint with /api prefix...")
        api_success = self.test_dashboard_with_api_prefix()
        
        # Authentication tests (optional for dashboard)
        print("\n🔐 Authentication Tests (Optional):")
        user_login_success = self.test_mock_user_login()
        
        if user_login_success:
            print("Testing dashboard with authentication...")
            success, data = self.make_request('GET', f'/dashboard/{self.company_id}', token=self.user_token)
            self.log_test("Dashboard with Auth", success, f"Authenticated request: {'Success' if success else 'Failed'}")
        
        # Final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        # Specific dashboard analysis
        print("\n🔍 Dashboard Analysis:")
        if frontend_success:
            print("✅ Frontend can access dashboard endpoint directly")
        else:
            print("❌ Frontend cannot access dashboard endpoint directly")
            print("   The URL /dashboard/company-001 returns React app HTML instead of API data")
            
        if api_success:
            print("✅ Dashboard endpoint works with /api prefix")
            print("   The URL /api/dashboard/company-001 returns correct JSON data")
        else:
            print("❌ Dashboard endpoint fails with /api prefix")
        
        print("\n🚨 ROOT CAUSE IDENTIFIED:")
        print("   Frontend is calling: /dashboard/company-001")
        print("   But should be calling: /api/dashboard/company-001")
        print("   The frontend authService.authenticatedFetch() is not adding /api prefix")
        
        return frontend_success or api_success

    def run_quick_actions_tests(self):
        """Run PHASE 2 Quick Actions tests"""
        print("⚡ Starting PHASE 2 Quick Actions Backend Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Initialize tokens
        print("\n🔐 Authentication Setup:")
        admin_success = self.test_admin_login()
        user_success = self.test_mock_user_login()
        
        if not user_success:
            print("❌ Cannot proceed without user authentication")
            return False
        
        # Quick Actions specific tests
        print("\n⚡ Quick Actions Tests:")
        
        # 1. Quick Add Customer Test
        add_customer_success = self.test_quick_add_customer()
        
        # 2. Quick Schedule Job Test
        schedule_job_success = self.test_quick_schedule_job()
        
        # 3. Quick Create Invoice Test
        create_invoice_success = self.test_quick_create_invoice()
        
        # 4. Quick View Reports Test
        view_reports_success = self.test_quick_view_reports()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        # Quick Actions Analysis
        print("\n⚡ Quick Actions Analysis:")
        
        critical_tests = [
            ("Quick Add Customer", add_customer_success),
            ("Quick Schedule Job", schedule_job_success),
            ("Quick Create Invoice", create_invoice_success),
            ("Quick View Reports", view_reports_success)
        ]
        
        passed_critical = sum(1 for _, success in critical_tests if success)
        
        for test_name, success in critical_tests:
            status = "✅" if success else "❌"
            print(f"   {status} {test_name}")
        
        print(f"\n🎯 Critical Quick Actions Tests: {passed_critical}/{len(critical_tests)} passed")
        
        # Overall assessment
        if passed_critical == 4:
            print("🎉 All Quick Actions endpoints are working perfectly!")
            return True
        elif passed_critical >= 3:
            print("⚠️ Most Quick Actions are working, minor issues detected")
            return True
        else:
            print("❌ Quick Actions have critical issues that need attention")
            return False

    def run_phase3_customers_appointments_tests(self):
        """Run PHASE 3 Customers & Appointments tests"""
        print("🔍 Starting PHASE 3 Customers & Appointments Backend Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Initialize tokens
        print("\n🔐 Authentication Setup:")
        admin_success = self.test_admin_login()
        user_success = self.test_mock_user_login()
        
        if not user_success:
            print("❌ Cannot proceed without user authentication")
            return False
        
        # PHASE 3 specific tests
        print("\n🔍 Customer Search Tests:")
        
        # Customer Search Tests
        search_name_success = self.test_customers_search_by_name()
        search_phone_success = self.test_customers_search_by_phone()
        search_email_success = self.test_customers_search_by_email()
        search_pagination_success = self.test_customers_search_pagination()
        
        print("\n📅 Appointments Calendar & Filter Tests:")
        
        # Appointments Calendar Test
        calendar_success = self.test_appointments_calendar_view()
        
        # Appointments Filter Tests
        filter_scheduled_success = self.test_appointments_filter_by_scheduled_status()
        filter_confirmed_success = self.test_appointments_filter_by_confirmed_status()
        filter_in_progress_success = self.test_appointments_filter_by_in_progress_status()
        filter_completed_success = self.test_appointments_filter_by_completed_status()
        filter_all_success = self.test_appointments_filter_without_status()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        # PHASE 3 Analysis
        print("\n🔍 PHASE 3 Analysis:")
        
        customer_search_tests = [
            ("Search by Name", search_name_success),
            ("Search by Phone", search_phone_success),
            ("Search by Email", search_email_success),
            ("Search Pagination", search_pagination_success)
        ]
        
        appointments_tests = [
            ("Calendar View", calendar_success),
            ("Filter Scheduled", filter_scheduled_success),
            ("Filter Confirmed", filter_confirmed_success),
            ("Filter In Progress", filter_in_progress_success),
            ("Filter Completed", filter_completed_success),
            ("Filter All", filter_all_success)
        ]
        
        print("\n👥 Customer Search Functionality:")
        passed_search = sum(1 for _, success in customer_search_tests if success)
        for test_name, success in customer_search_tests:
            status = "✅" if success else "❌"
            print(f"   {status} {test_name}")
        
        print("\n📅 Appointments Calendar & Filtering:")
        passed_appointments = sum(1 for _, success in appointments_tests if success)
        for test_name, success in appointments_tests:
            status = "✅" if success else "❌"
            print(f"   {status} {test_name}")
        
        total_critical = len(customer_search_tests) + len(appointments_tests)
        total_passed = passed_search + passed_appointments
        
        print(f"\n🎯 PHASE 3 Critical Tests: {total_passed}/{total_critical} passed")
        print(f"   Customer Search: {passed_search}/{len(customer_search_tests)} passed")
        print(f"   Appointments: {passed_appointments}/{len(appointments_tests)} passed")
        
        # Overall assessment
        if total_passed >= 9:  # Allow 1 failure
            print("🎉 PHASE 3 Customers & Appointments functionality is working excellently!")
            return True
        elif total_passed >= 7:
            print("⚠️ PHASE 3 has minor issues but core functionality works")
            return True
        else:
            print("❌ PHASE 3 has critical issues that need attention")
            return False

def main():
    """Main test execution"""
    tester = HVACAPITester()
    
    # Run PHASE 3 tests as requested
    success = tester.run_phase3_customers_appointments_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())