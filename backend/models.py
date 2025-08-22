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

# Enhanced Call Transcript Models
class CallDirection(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"

class CallStatus(str, Enum):
    INCOMING = "incoming"
    COMPLETED = "completed"
    MISSED = "missed"
    VOICEMAIL = "voicemail"
    TRANSFERRED = "transferred"

class CallDisposition(str, Enum):
    BOOKED = "booked"
    QUOTE = "quote"
    SUPPORT = "support"
    SPAM = "spam"
    FOLLOW_UP = "follow_up"
    NO_ANSWER = "no_answer"

class CallSentiment(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"

class TranscriptRole(str, Enum):
    AI = "ai"
    CUSTOMER = "customer"
    TECH = "tech"
    SYSTEM = "system"

class TranscriptEntry(BaseModel):
    ts: datetime = Field(default_factory=datetime.utcnow)
    role: TranscriptRole
    text: Optional[str] = None
    event: Optional[str] = None  # For system events like "transfer_started"

# Main Call model for full transcript system
class Call(BaseDocument):
    # Basic call information
    direction: CallDirection = CallDirection.INBOUND
    from_: str = Field(alias="from")  # Phone number
    to: str  # Phone number
    
    # Timing
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration_sec: Optional[int] = None
    
    # Status and outcome
    status: CallStatus = CallStatus.INCOMING
    disposition: Optional[CallDisposition] = None
    
    # Tags and metadata
    tags: List[str] = Field(default_factory=list)
    transcript: List[TranscriptEntry] = Field(default_factory=list)
    recording_url: Optional[str] = None
    sentiment: Optional[CallSentiment] = None
    
    # Relationships
    created_by: Optional[str] = None
    customer_id: Optional[str] = None
    appointment_id: Optional[str] = None
    
    class Config:
        allow_population_by_field_name = True

# Backward compatibility - keep existing CallLog for Phase 6 compatibility
class CallLogStatus(str, Enum):
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
    status: CallLogStatus = CallLogStatus.INCOMING
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

# QA Gates & Subcontractor Models (Phase 7)
class QAStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    FAILED = "failed"
    BLOCKED = "blocked"

class InspectionType(str, Enum):
    STARTUP = "startup"
    WARRANTY = "warranty" 
    COMPLIANCE = "compliance"
    CUSTOMER_REQUEST = "customer_request"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    HOLDBACK = "holdback"
    RELEASED = "released"
    BLOCKED = "blocked"

class StartupMetrics(BaseModel):
    microns: float  # Must be < 500 for pass
    temperature_differential: Optional[float] = None
    pressure_readings: Optional[Dict[str, float]] = Field(default_factory=dict)
    airflow_cfm: Optional[float] = None
    refrigerant_charge: Optional[float] = None
    electrical_readings: Optional[Dict[str, float]] = Field(default_factory=dict)
    startup_time: Optional[datetime] = None
    technician_notes: str = ""

class QAGate(BaseDocument):
    job_id: str
    company_id: str
    technician_id: str
    qa_status: QAStatus = QAStatus.PENDING
    
    # QA Requirements
    startup_metrics: Optional[StartupMetrics] = None
    photos: List[Dict[str, str]] = Field(default_factory=list)  # [{"type": "before", "url": "...", "description": "..."}, ...]
    required_photos: List[str] = Field(default_factory=lambda: ["before", "after", "equipment"])
    
    # Validation Results
    microns_pass: bool = False
    photos_pass: bool = False
    metrics_pass: bool = False
    overall_pass: bool = False
    
    # Failure Reasons
    failure_reasons: List[str] = Field(default_factory=list)
    
    # QA Completion
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None
    
    def calculate_qa_status(self):
        """Calculate overall QA status based on requirements"""
        if not self.startup_metrics:
            self.qa_status = QAStatus.PENDING
            self.overall_pass = False
            return
        
        # Check microns requirement (< 500)
        self.microns_pass = self.startup_metrics.microns < 500
        
        # Check photos requirement
        photo_types_present = {photo["type"] for photo in self.photos}
        self.photos_pass = all(req_type in photo_types_present for req_type in self.required_photos)
        
        # Check metrics completeness
        self.metrics_pass = (
            self.startup_metrics.temperature_differential is not None and
            self.startup_metrics.airflow_cfm is not None and
            len(self.startup_metrics.electrical_readings) > 0
        )
        
        # Update failure reasons
        self.failure_reasons = []
        if not self.microns_pass:
            self.failure_reasons.append(f"Microns reading {self.startup_metrics.microns} exceeds limit (500)")
        if not self.photos_pass:
            missing = set(self.required_photos) - {photo["type"] for photo in self.photos}
            self.failure_reasons.append(f"Missing required photos: {', '.join(missing)}")
        if not self.metrics_pass:
            self.failure_reasons.append("Incomplete startup metrics")
        
        # Overall pass status
        self.overall_pass = self.microns_pass and self.photos_pass and self.metrics_pass
        
        if self.overall_pass:
            self.qa_status = QAStatus.PASSED
            self.completed_at = datetime.utcnow()
        else:
            self.qa_status = QAStatus.FAILED

class WarrantyRegistration(BaseDocument):
    job_id: str
    company_id: str
    customer_id: str
    
    # Equipment Details
    equipment_type: str
    manufacturer: str
    model_number: str
    serial_number: str
    installation_date: datetime
    
    # Warranty Info
    warranty_start_date: datetime
    warranty_end_date: datetime
    warranty_type: str  # "parts", "labor", "full"
    warranty_terms: str = ""
    
    # Registration Status
    registered: bool = False
    registration_number: Optional[str] = None
    registered_at: Optional[datetime] = None
    registered_by: Optional[str] = None

class Inspection(BaseDocument):
    job_id: str
    company_id: str
    inspection_type: InspectionType
    
    # Scheduling
    scheduled_date: Optional[datetime] = None
    scheduled_by: Optional[str] = None
    
    # Completion
    completed: bool = False
    completed_date: Optional[datetime] = None
    inspector_id: Optional[str] = None
    
    # Results
    inspection_pass: bool = False
    inspection_notes: str = ""
    deficiencies: List[str] = Field(default_factory=list)
    
    # Requirements
    required: bool = True  # Some jobs may not require inspection

class SubcontractorPayment(BaseDocument):
    job_id: str
    company_id: str
    subcontractor_id: str
    
    # Payment Details
    base_amount: float
    holdback_percentage: float = 10.0  # Default 10% holdback
    holdback_amount: float = 0.0
    releasable_amount: float = 0.0
    
    # Payment Status
    payment_status: PaymentStatus = PaymentStatus.HOLDBACK
    
    # Release Conditions
    qa_gate_passed: bool = False
    warranty_registered: bool = False
    inspection_passed: bool = False  # Only if inspection required
    inspection_required: bool = True
    
    # Payment History
    payments_made: List[Dict[str, Any]] = Field(default_factory=list)
    total_paid: float = 0.0
    
    # Release Tracking
    holdback_released: bool = False
    holdback_released_at: Optional[datetime] = None
    
    def calculate_amounts(self):
        """Calculate holdback and releasable amounts"""
        self.holdback_amount = self.base_amount * (self.holdback_percentage / 100)
        self.releasable_amount = self.base_amount - self.holdback_amount
        # Initialize total_paid to releasable_amount (initial payment)
        if self.total_paid == 0.0:
            self.total_paid = self.releasable_amount
    
    def check_release_conditions(self):
        """Check if holdback can be released"""
        conditions_met = (
            self.qa_gate_passed and
            self.warranty_registered and
            (not self.inspection_required or self.inspection_passed)
        )
        
        if conditions_met and not self.holdback_released:
            self.payment_status = PaymentStatus.RELEASED
            return True
        elif not conditions_met:
            self.payment_status = PaymentStatus.HOLDBACK
            return False
        
        return self.holdback_released

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