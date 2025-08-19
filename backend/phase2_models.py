from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
from models import BaseDocument

# Phase 2 Enums
class MessageSender(str, Enum):
    OWNER = "owner"
    TECHNICIAN = "technician"
    DISPATCHER = "dispatcher"
    CUSTOMER = "customer"
    SYSTEM = "system"

class NotificationType(str, Enum):
    NEW_APPOINTMENT = "new_appointment"
    TECH_ASSIGNED = "tech_assigned"
    JOB_COMPLETED = "job_completed"
    LOW_RATING = "low_rating"
    PAYMENT_RECEIVED = "payment_received"
    SYSTEM_ALERT = "system_alert"

class MessageStatus(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"

# Messaging System Models
class Message(BaseDocument):
    company_id: str
    job_id: str
    thread_id: str  # Unique identifier for conversation thread
    sender_type: MessageSender
    sender_id: str  # User ID or customer phone
    sender_name: str
    content: str
    status: MessageStatus = MessageStatus.SENT
    read_by: List[Dict[str, datetime]] = Field(default_factory=list)  # [{"user_id": "xxx", "read_at": datetime}]
    sms_message_id: Optional[str] = None  # Twilio message SID
    attachments: List[Dict[str, str]] = Field(default_factory=list)
    is_sms_bridge: bool = False  # True if message was sent/received via SMS

class MessageCreate(BaseModel):
    company_id: str
    job_id: str
    sender_type: MessageSender
    sender_id: str
    sender_name: str
    content: str
    attachments: List[Dict[str, str]] = Field(default_factory=list)

class MessageThread(BaseDocument):
    company_id: str
    job_id: str
    participants: List[Dict[str, str]]  # [{"user_id": "xxx", "role": "owner", "name": "John"}]
    last_message_at: datetime
    last_message_content: str
    unread_counts: Dict[str, int] = Field(default_factory=dict)  # {"user_id": unread_count}
    is_active: bool = True

# Customer Rating System Models
class CustomerRating(BaseDocument):
    company_id: str
    job_id: str
    customer_id: str
    technician_id: str
    rating: int  # 1-5 scale
    feedback: Optional[str] = None
    rating_date: datetime = Field(default_factory=datetime.utcnow)
    sms_request_sent: bool = False
    sms_request_sent_at: Optional[datetime] = None
    response_received_at: Optional[datetime] = None
    follow_up_required: bool = False

class RatingCreate(BaseModel):
    company_id: str
    job_id: str
    customer_id: str
    technician_id: str
    rating: int
    feedback: Optional[str] = None

class RatingRequest(BaseModel):
    job_id: str
    customer_phone: str
    technician_name: str
    service_description: str

# Owner Notification System Models
class OwnerNotification(BaseDocument):
    company_id: str
    owner_id: str
    notification_type: NotificationType
    title: str
    message: str
    data: Dict[str, Any] = Field(default_factory=dict)  # Additional context data
    channels_sent: List[str] = Field(default_factory=list)  # ["in_app", "sms", "email"]
    is_read: bool = False
    read_at: Optional[datetime] = None
    action_required: bool = False
    action_url: Optional[str] = None
    priority: str = "normal"  # low, normal, high, urgent

class NotificationCreate(BaseModel):
    company_id: str
    owner_id: str
    notification_type: NotificationType
    title: str
    message: str
    data: Dict[str, Any] = Field(default_factory=dict)
    action_required: bool = False
    action_url: Optional[str] = None
    priority: str = "normal"

class NotificationSettings(BaseModel):
    company_id: str
    user_id: str
    
    # Notification Types Toggle
    new_appointment: bool = True
    tech_assigned: bool = True
    job_completed: bool = True
    low_rating: bool = True
    payment_received: bool = True
    system_alert: bool = True
    
    # Delivery Channels
    in_app_enabled: bool = True
    sms_enabled: bool = False
    email_enabled: bool = False
    
    # Timing Settings
    quiet_hours_start: Optional[str] = None  # "22:00"
    quiet_hours_end: Optional[str] = None    # "08:00"
    weekend_notifications: bool = True
    
    # Contact Information
    sms_number: Optional[str] = None
    email_address: Optional[str] = None

# SMS Template System Models
class SMSTemplate(BaseDocument):
    company_id: str
    template_name: str
    template_key: str  # unique identifier
    content: str
    variables: List[str] = Field(default_factory=list)  # ["customer_name", "technician_name", etc.]
    category: str = "general"  # appointment, rating, notification, etc.
    is_active: bool = True
    usage_count: int = 0
    last_used: Optional[datetime] = None

class SMSTemplateCreate(BaseModel):
    company_id: str
    template_name: str
    template_key: str
    content: str
    variables: List[str] = Field(default_factory=list)
    category: str = "general"

# Google Calendar Integration Models
class CalendarEvent(BaseDocument):
    company_id: str
    appointment_id: str
    google_event_id: str
    calendar_id: str
    title: str
    start_time: datetime
    end_time: datetime
    attendees: List[str] = Field(default_factory=list)
    sync_status: str = "synced"  # synced, failed, pending
    last_sync_at: datetime = Field(default_factory=datetime.utcnow)
    retry_count: int = 0
    error_message: Optional[str] = None

class CalendarEventCreate(BaseModel):
    company_id: str
    appointment_id: str
    title: str
    start_time: datetime
    end_time: datetime
    attendees: List[str] = Field(default_factory=list)

# Owner Analytics Models (for caching computed metrics)
class OwnerMetrics(BaseDocument):
    company_id: str
    date: datetime  # Date for daily metrics
    
    # Daily Performance
    appointments_scheduled: int = 0
    appointments_completed: int = 0
    revenue_generated: float = 0.0
    jobs_assigned: int = 0
    jobs_completed: int = 0
    
    # Response Times (in minutes)
    avg_response_time: Optional[float] = None
    min_response_time: Optional[float] = None
    max_response_time: Optional[float] = None
    
    # Conversion Metrics
    inquiries_received: int = 0
    inquiries_converted: int = 0
    conversion_rate: Optional[float] = None
    
    # Customer Satisfaction
    ratings_received: int = 0
    average_rating: Optional[float] = None
    
    # Technician Performance
    active_technicians: int = 0
    technician_utilization: Optional[float] = None

class TechnicianLeaderboard(BaseModel):
    technician_id: str
    name: str
    jobs_completed: int
    average_rating: float
    total_ratings: int
    revenue_generated: float
    efficiency_score: float  # Computed metric