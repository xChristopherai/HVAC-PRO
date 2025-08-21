from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Base Models
class BaseDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Enums
class CompanyStatus(str, Enum):
    ACTIVE = "active"
    TRIAL = "trial"
    EXPIRED = "expired"
    SUSPENDED = "suspended"

class UserRole(str, Enum):
    ADMIN = "admin"
    OWNER = "owner"
    DISPATCHER = "dispatcher"
    TECHNICIAN = "technician"
    CUSTOMER = "customer"

class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class AppointmentSource(str, Enum):
    AI_VOICE = "ai-voice"
    AI_SMS = "ai-sms"
    MANUAL = "manual"

class IssueType(str, Enum):
    NO_HEAT = "no_heat"
    NO_COOL = "no_cool"
    MAINTENANCE = "maintenance"
    PLUMBING = "plumbing"

class TimeWindow(str, Enum):
    MORNING = "8-11"
    AFTERNOON = "12-3"
    EVENING = "3-6"

class JobStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class JobPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EMERGENCY = "emergency"

class InquiryStatus(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    CONVERTED = "converted"
    CLOSED = "closed"

class NotificationChannel(str, Enum):
    IN_APP = "in_app"
    SMS = "sms"
    EMAIL = "email"

# Company & User Models
class Company(BaseDocument):
    name: str
    email: EmailStr
    phone: str
    address: Dict[str, str]
    status: CompanyStatus = CompanyStatus.TRIAL
    subscription_end: Optional[datetime] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    business_hours: Dict[str, str] = Field(default_factory=dict)
    service_areas: List[str] = Field(default_factory=list)
    
class CompanyCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: Dict[str, str]

class User(BaseDocument):
    company_id: str
    email: EmailStr
    name: str
    role: UserRole
    phone: Optional[str] = None
    is_active: bool = True
    last_login: Optional[datetime] = None
    profile: Dict[str, Any] = Field(default_factory=dict)

class UserCreate(BaseModel):
    company_id: str
    email: EmailStr
    name: str
    role: UserRole
    phone: Optional[str] = None

# Customer Models
class Customer(BaseDocument):
    company_id: str
    name: str
    email: Optional[EmailStr] = None
    phone: str
    address: Dict[str, str]
    preferred_contact: str = "phone"
    notes: str = ""
    total_jobs: int = 0
    total_spent: float = 0.0
    last_service: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)

class CustomerCreate(BaseModel):
    company_id: str
    name: str
    email: Optional[EmailStr] = None
    phone: str
    address: Dict[str, str]
    preferred_contact: str = "phone"
    notes: str = ""

# Technician Models
class Technician(BaseDocument):
    company_id: str
    user_id: Optional[str] = None
    name: str
    email: Optional[EmailStr] = None
    phone: str
    specialties: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    hourly_rate: float = 0.0
    is_active: bool = True
    current_location: Optional[Dict[str, float]] = None
    average_rating: float = 0.0
    total_ratings: int = 0
    total_jobs_completed: int = 0

class TechnicianCreate(BaseModel):
    company_id: str
    name: str
    email: Optional[EmailStr] = None
    phone: str
    specialties: List[str] = Field(default_factory=list)
    hourly_rate: float = 0.0

# Appointment Models  
class Appointment(BaseDocument):
    company_id: str
    customer_id: str
    technician_id: Optional[str] = None
    title: str
    description: str
    scheduled_date: datetime
    estimated_duration: int  # minutes
    status: AppointmentStatus = AppointmentStatus.SCHEDULED
    service_type: str
    priority: JobPriority = JobPriority.MEDIUM
    estimated_cost: Optional[float] = None
    notes: str = ""
    calendar_event_id: Optional[str] = None
    # New fields for AI Voice Scheduling
    source: AppointmentSource = AppointmentSource.MANUAL
    is_ai_generated: Optional[bool] = False
    issue_type: Optional[IssueType] = None
    window: Optional[TimeWindow] = None
    address: Optional[str] = None

class AppointmentCreate(BaseModel):
    company_id: str
    customer_id: str
    title: str
    description: str
    scheduled_date: datetime
    estimated_duration: int = 60
    service_type: str
    priority: JobPriority = JobPriority.MEDIUM
    estimated_cost: Optional[float] = None
    # New fields for AI Voice Scheduling
    source: AppointmentSource = AppointmentSource.MANUAL
    issue_type: Optional[IssueType] = None
    window: Optional[TimeWindow] = None
    address: Optional[str] = None

# AI Voice Scheduling Models
class Availability(BaseDocument):
    company_id: str
    date: str  # YYYY-MM-DD format
    windows: List[Dict[str, Any]] = Field(default_factory=lambda: [
        {"window": "8-11", "capacity": 4, "booked": 0},
        {"window": "12-3", "capacity": 4, "booked": 0},
        {"window": "3-6", "capacity": 4, "booked": 0}
    ])

class VoiceSessionState(BaseModel):
    phone_number: str
    state: str = "greet"  # greet, collect_name, collect_address, collect_issue, offer_windows, confirm
    data: Dict[str, Any] = Field(default_factory=dict)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow().replace(microsecond=0))
    
class AvailabilityWindow(BaseModel):
    window: TimeWindow
    capacity: int
    booked: int
    available: int
    
class AvailabilityResponse(BaseModel):
    date: str
    windows: List[AvailabilityWindow]

# Job Models
class Job(BaseDocument):
    company_id: str
    appointment_id: Optional[str] = None
    customer_id: str
    technician_id: Optional[str] = None
    title: str
    description: str
    status: JobStatus = JobStatus.PENDING
    priority: JobPriority = JobPriority.MEDIUM
    scheduled_date: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    parts_used: List[Dict[str, Any]] = Field(default_factory=list)
    labor_hours: Optional[float] = None
    notes: str = ""
    customer_signature: Optional[str] = None
    photos: List[str] = Field(default_factory=list)

class JobCreate(BaseModel):
    company_id: str
    customer_id: str
    title: str
    description: str
    priority: JobPriority = JobPriority.MEDIUM
    estimated_cost: Optional[float] = None

# Invoice Models
class InvoiceItem(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float
    total: float

class Invoice(BaseDocument):
    company_id: str
    customer_id: str
    job_id: Optional[str] = None
    invoice_number: str
    items: List[InvoiceItem]
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    status: str = "draft"  # draft, sent, paid, overdue, cancelled
    due_date: datetime
    paid_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: str = ""

class InvoiceCreate(BaseModel):
    company_id: str
    customer_id: str
    job_id: Optional[str] = None
    items: List[InvoiceItem]
    tax_rate: float = 0.0
    due_date: datetime
    notes: str = ""

# Inquiry Models (SMS Conversations)
class Inquiry(BaseDocument):
    company_id: str
    customer_phone: str
    customer_name: Optional[str] = None
    status: InquiryStatus = InquiryStatus.NEW
    initial_message: str
    ai_response: str
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)
    estimated_value: Optional[float] = None
    service_type: Optional[str] = None
    urgency: JobPriority = JobPriority.MEDIUM
    follow_up_date: Optional[datetime] = None
    converted_to_appointment: bool = False
    appointment_id: Optional[str] = None

class InquiryCreate(BaseModel):
    company_id: str
    customer_phone: str
    initial_message: str

# Call Log Models (Phase 6)
class CallStatus(str, Enum):
    INCOMING = "incoming"
    OUTGOING = "outgoing"
    MISSED = "missed"
    COMPLETED = "completed"
    FAILED = "failed"

class CallOutcome(str, Enum):
    APPOINTMENT_CREATED = "appointment_created"
    QUOTE_REQUESTED = "quote_requested"
    FOLLOW_UP_NEEDED = "follow_up_needed"
    TRANSFERRED_TO_HUMAN = "transferred_to_human"
    CUSTOMER_HANGUP = "customer_hangup"
    TECHNICAL_ISSUE = "technical_issue"
    INFORMATION_PROVIDED = "information_provided"

class CallLog(BaseDocument):
    company_id: str
    phone_number: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    call_sid: str  # Twilio Call SID
    direction: str = "inbound"  # inbound/outbound
    status: CallStatus = CallStatus.INCOMING
    duration: Optional[int] = None  # seconds
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    answered_by_ai: bool = True
    transferred_to_tech: bool = False
    tech_id: Optional[str] = None
    tech_name: Optional[str] = None
    outcome: Optional[CallOutcome] = None
    appointment_id: Optional[str] = None
    transcript: List[Dict[str, Any]] = Field(default_factory=list)
    session_data: Dict[str, Any] = Field(default_factory=dict)
    issue_type: Optional[IssueType] = None
    urgency_level: str = "normal"  # low, normal, high, emergency
    notes: str = ""
    ai_confidence: Optional[float] = None  # 0.0-1.0
    
class CallLogCreate(BaseModel):
    company_id: str
    phone_number: str
    call_sid: str
    direction: str = "inbound"
    customer_name: Optional[str] = None
    issue_type: Optional[IssueType] = None

class CallLogSearchResponse(BaseModel):
    calls: List[CallLog]
    total_count: int
    filters_applied: Dict[str, Any]

# Settings Models
class CompanySettings(BaseModel):
    # Business Information
    business_name: str = "Elite HVAC Solutions"
    business_phone: str = "+1-555-HVAC-PRO"
    business_email: EmailStr = "info@hvactech.com"
    business_address: Dict[str, str] = Field(default_factory=dict)
    business_hours: Dict[str, str] = Field(default_factory=dict)
    
    # AI Assistant Settings
    ai_assistant_name: str = "Sarah"
    ai_greeting: str = "Hi! I'm Sarah from Elite HVAC Solutions. How can I help you today?"
    ai_temperature: float = 0.3
    max_response_tokens: int = 120
    
    # SMS Settings
    sms_enabled: bool = True
    sms_templates: Dict[str, str] = Field(default_factory=dict)
    auto_response_enabled: bool = True
    business_hours_only: bool = False
    
    # Calendar Settings
    google_calendar_enabled: bool = False
    auto_create_events: bool = False
    default_appointment_duration: int = 60
    
    # Notification Settings
    owner_notifications: Dict[str, bool] = Field(default_factory=dict)
    notification_channels: Dict[str, bool] = Field(default_factory=dict)
    
    # Billing Settings
    default_tax_rate: float = 0.0875
    payment_terms: int = 30
    late_fee_rate: float = 0.015
    
    # Service Settings
    service_areas: List[str] = Field(default_factory=list)
    service_types: List[str] = Field(default_factory=list)
    
    # Integration Settings
    integrations: Dict[str, Dict[str, Any]] = Field(default_factory=dict)