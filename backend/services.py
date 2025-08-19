import os
import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import json
import httpx
from .phase2_models import (
    Message, MessageCreate, MessageThread, 
    CustomerRating, RatingCreate, OwnerNotification, NotificationCreate,
    SMSTemplate, CalendarEvent, CalendarEventCreate
)

logger = logging.getLogger(__name__)

# Mock Service Adapters for External Integrations
class MockTwilioService:
    """Mock Twilio SMS service for development"""
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "mock_account_sid")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "mock_auth_token")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER", "+1234567890")
        self.sent_messages = []  # Store mock sent messages
        
    async def send_sms(self, to: str, body: str, from_number: str = None) -> Dict[str, Any]:
        """Mock SMS sending"""
        if not from_number:
            from_number = self.phone_number
            
        # Simulate SMS sending
        message_data = {
            "sid": f"mock_sms_{len(self.sent_messages) + 1}",
            "to": to,
            "from": from_number,
            "body": body,
            "status": "sent",
            "date_created": datetime.utcnow().isoformat(),
            "price": "-0.0075",
            "direction": "outbound-api"
        }
        
        self.sent_messages.append(message_data)
        
        logger.info(f"Mock SMS sent to {to}: {body}")
        return message_data
        
    async def get_message_status(self, message_sid: str) -> str:
        """Mock message status check"""
        return "delivered"
        
    def process_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming SMS webhook (mock)"""
        return {
            "from": webhook_data.get("From", "+1555000000"),
            "to": webhook_data.get("To", self.phone_number),
            "body": webhook_data.get("Body", "Test message"),
            "message_sid": webhook_data.get("MessageSid", f"mock_incoming_{datetime.utcnow().timestamp()}")
        }

class MockGoogleCalendarService:
    """Mock Google Calendar service for development"""
    
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID", "mock_client_id")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "mock_secret")
        self.refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN", "mock_refresh_token")
        self.calendar_id = os.getenv("GOOGLE_CALENDAR_ID", "mock_calendar_id")
        self.created_events = []
        
    async def create_event(self, event_data: Dict[str, Any], retry_count: int = 0) -> Optional[str]:
        """Mock calendar event creation with retry logic"""
        try:
            # Simulate potential failures for retry testing
            if retry_count == 0 and len(self.created_events) % 5 == 4:
                raise Exception("Mock calendar service temporarily unavailable")
            
            # Create mock event
            event_id = f"mock_event_{len(self.created_events) + 1}_{datetime.utcnow().timestamp()}"
            
            mock_event = {
                "id": event_id,
                "summary": event_data.get("summary", "HVAC Appointment"),
                "start": event_data.get("start", {}),
                "end": event_data.get("end", {}),
                "attendees": event_data.get("attendees", []),
                "description": event_data.get("description", ""),
                "created": datetime.utcnow().isoformat(),
                "status": "confirmed"
            }
            
            self.created_events.append(mock_event)
            
            logger.info(f"Mock calendar event created: {event_id}")
            return event_id
            
        except Exception as e:
            logger.error(f"Mock calendar event creation failed (attempt {retry_count + 1}): {str(e)}")
            
            # Implement exponential backoff retry (max 3 attempts)
            if retry_count < 2:
                await asyncio.sleep(2 ** retry_count)
                return await self.create_event(event_data, retry_count + 1)
            
            raise e
    
    async def update_event(self, event_id: str, event_data: Dict[str, Any]) -> bool:
        """Mock event update"""
        for event in self.created_events:
            if event["id"] == event_id:
                event.update(event_data)
                event["updated"] = datetime.utcnow().isoformat()
                logger.info(f"Mock calendar event updated: {event_id}")
                return True
        return False
    
    async def delete_event(self, event_id: str) -> bool:
        """Mock event deletion"""
        for i, event in enumerate(self.created_events):
            if event["id"] == event_id:
                del self.created_events[i]
                logger.info(f"Mock calendar event deleted: {event_id}")
                return True
        return False

class MockLLMService:
    """Mock LLM service using Emergent LLM Key"""
    
    def __init__(self):
        self.api_key = os.getenv("EMERGENT_LLM_KEY", "sk-emergent-68d0e189c6844Bd6f2")
        
    async def generate_sms_response(self, customer_message: str, context: Dict[str, Any]) -> str:
        """Generate AI SMS response with minimal token usage"""
        
        # Use template-based responses for common scenarios to minimize LLM usage
        templates = {
            "greeting": "Hi! I'm Sarah from {company_name}. How can I help you today?",
            "emergency": "I understand this is urgent. Let me connect you with our emergency technician right away. What's the issue?",
            "appointment": "I'd be happy to schedule an appointment for you. What service do you need and when works best?",
            "pricing": "I'll have one of our technicians provide a detailed estimate. Can you describe the issue?",
            "default": "Thanks for contacting {company_name}! I'm here to help. Can you tell me more about your HVAC needs?"
        }
        
        # Simple keyword matching for template selection
        message_lower = customer_message.lower()
        
        if any(word in message_lower for word in ["emergency", "urgent", "broken", "not working"]):
            template_key = "emergency"
        elif any(word in message_lower for word in ["appointment", "schedule", "book"]):
            template_key = "appointment"
        elif any(word in message_lower for word in ["price", "cost", "estimate", "quote"]):
            template_key = "pricing"
        elif any(word in message_lower for word in ["hello", "hi", "hey"]):
            template_key = "greeting"
        else:
            template_key = "default"
        
        # Use template with context substitution
        response = templates[template_key].format(
            company_name=context.get("company_name", "Elite HVAC Solutions")
        )
        
        # Log LLM usage for monitoring
        logger.info(f"Generated template-based SMS response using template: {template_key}")
        
        return response
    
    async def optimize_sms_template(self, template: str, max_tokens: int = 120) -> str:
        """Optimize SMS template for minimal credits"""
        
        # Mock template optimization - in production this would use LLM
        if len(template) > max_tokens:
            # Simple truncation with ellipsis
            return template[:max_tokens-3] + "..."
        
        return template

class MockEmailService:
    """Mock email service for notifications"""
    
    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY", "mock_sendgrid_key")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@hvactech.com")
        self.sent_emails = []
        
    async def send_email(self, to: str, subject: str, content: str, content_type: str = "text/html") -> bool:
        """Mock email sending"""
        email_data = {
            "to": to,
            "from": self.from_email,
            "subject": subject,
            "content": content,
            "content_type": content_type,
            "sent_at": datetime.utcnow().isoformat(),
            "status": "delivered"
        }
        
        self.sent_emails.append(email_data)
        logger.info(f"Mock email sent to {to}: {subject}")
        return True

# Phase 2 Service Classes
class MessagingService:
    """In-app messaging with SMS bridge"""
    
    def __init__(self, sms_service: MockTwilioService, db):
        self.sms_service = sms_service
        self.db = db
        
    async def send_message(self, message_data: MessageCreate) -> Message:
        """Send message and optionally bridge to SMS"""
        
        # Create message in database
        message = Message(**message_data.dict())
        await self.db.messages.insert_one(message.dict())
        
        # Update thread
        await self.update_message_thread(message)
        
        # Bridge to SMS if customer is involved and not already SMS
        if message.sender_type != "customer" and not message.is_sms_bridge:
            await self.bridge_to_sms(message)
        
        return message
    
    async def bridge_to_sms(self, message: Message):
        """Bridge message to SMS for customer communication"""
        
        # Get job details for customer phone
        job = await self.db.jobs.find_one({"id": message.job_id})
        if not job:
            return
        
        customer = await self.db.customers.find_one({"id": job["customer_id"]})
        if not customer or not customer.get("phone"):
            return
        
        # Send SMS with context
        sms_content = f"Update from {job['title']}: {message.content}"
        
        try:
            sms_result = await self.sms_service.send_sms(
                to=customer["phone"],
                body=sms_content
            )
            
            # Update message with SMS ID
            await self.db.messages.update_one(
                {"id": message.id},
                {"$set": {"sms_message_id": sms_result["sid"]}}
            )
            
        except Exception as e:
            logger.error(f"Failed to bridge message to SMS: {str(e)}")
    
    async def update_message_thread(self, message: Message):
        """Update message thread with new message"""
        
        thread_filter = {"job_id": message.job_id}
        
        thread_update = {
            "$set": {
                "last_message_at": message.created_at,
                "last_message_content": message.content[:100],
                "updated_at": datetime.utcnow()
            },
            "$inc": {f"unread_counts.{message.sender_id}": 0}  # Don't increment for sender
        }
        
        # Increment unread count for other participants
        existing_thread = await self.db.message_threads.find_one(thread_filter)
        if existing_thread:
            for participant in existing_thread.get("participants", []):
                if participant["user_id"] != message.sender_id:
                    thread_update["$inc"][f"unread_counts.{participant['user_id']}"] = 1
        
        await self.db.message_threads.update_one(
            thread_filter,
            thread_update,
            upsert=True
        )
    
    async def mark_messages_read(self, job_id: str, user_id: str) -> int:
        """Mark messages as read for a user"""
        
        # Add read receipt to messages
        await self.db.messages.update_many(
            {
                "job_id": job_id,
                "sender_id": {"$ne": user_id}
            },
            {
                "$addToSet": {
                    "read_by": {
                        "user_id": user_id,
                        "read_at": datetime.utcnow()
                    }
                }
            }
        )
        
        # Reset unread count for user
        await self.db.message_threads.update_one(
            {"job_id": job_id},
            {"$set": {f"unread_counts.{user_id}": 0}}
        )
        
        return 1

class RatingService:
    """Customer rating system with SMS automation"""
    
    def __init__(self, sms_service: MockTwilioService, db):
        self.sms_service = sms_service
        self.db = db
    
    async def request_rating(self, job_id: str) -> bool:
        """Send SMS rating request after job completion"""
        
        # Get job details
        job = await self.db.jobs.find_one({"id": job_id})
        if not job:
            return False
        
        customer = await self.db.customers.find_one({"id": job["customer_id"]})
        technician = await self.db.technicians.find_one({"id": job["technician_id"]})
        
        if not customer or not technician:
            return False
        
        # Create rating request SMS
        sms_content = f"""Hi {customer['name']}! Your {job['title']} service with {technician['name']} is complete. 

Please rate your experience (1-5):
1=Poor, 2=Fair, 3=Good, 4=Great, 5=Excellent

Reply with just the number. Thank you!"""
        
        try:
            sms_result = await self.sms_service.send_sms(
                to=customer["phone"],
                body=sms_content
            )
            
            # Create rating record
            rating = CustomerRating(
                company_id=job["company_id"],
                job_id=job_id,
                customer_id=job["customer_id"],
                technician_id=job["technician_id"],
                rating=0,  # Will be updated when response received
                sms_request_sent=True,
                sms_request_sent_at=datetime.utcnow()
            )
            
            await self.db.ratings.insert_one(rating.dict())
            
            logger.info(f"Rating request sent for job {job_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send rating request: {str(e)}")
            return False
    
    async def process_rating_response(self, customer_phone: str, message_body: str) -> bool:
        """Process SMS rating response"""
        
        # Extract rating from message
        try:
            rating_value = int(message_body.strip())
            if rating_value < 1 or rating_value > 5:
                raise ValueError("Rating out of range")
        except ValueError:
            return False
        
        # Find pending rating request
        customer = await self.db.customers.find_one({"phone": customer_phone})
        if not customer:
            return False
        
        pending_rating = await self.db.ratings.find_one({
            "customer_id": customer["id"],
            "rating": 0,
            "sms_request_sent": True,
            "response_received_at": None
        })
        
        if not pending_rating:
            return False
        
        # Update rating
        await self.db.ratings.update_one(
            {"id": pending_rating["id"]},
            {
                "$set": {
                    "rating": rating_value,
                    "response_received_at": datetime.utcnow(),
                    "follow_up_required": rating_value <= 3
                }
            }
        )
        
        # Update technician average rating
        await self.update_technician_rating(pending_rating["technician_id"])
        
        # Send low rating notification if needed
        if rating_value <= 3:
            await self.send_low_rating_notification(pending_rating, rating_value)
        
        logger.info(f"Rating {rating_value} processed for job {pending_rating['job_id']}")
        return True
    
    async def update_technician_rating(self, technician_id: str):
        """Update technician's rolling average rating"""
        
        # Get all ratings for technician
        ratings = await self.db.ratings.find({
            "technician_id": technician_id,
            "rating": {"$gt": 0}
        }).to_list(1000)
        
        if not ratings:
            return
        
        total_rating = sum(r["rating"] for r in ratings)
        average_rating = total_rating / len(ratings)
        
        # Update technician record
        await self.db.technicians.update_one(
            {"id": technician_id},
            {
                "$set": {
                    "average_rating": round(average_rating, 2),
                    "total_ratings": len(ratings)
                }
            }
        )
    
    async def send_low_rating_notification(self, rating_data: dict, rating_value: int):
        """Send notification for low ratings"""
        
        job = await self.db.jobs.find_one({"id": rating_data["job_id"]})
        customer = await self.db.customers.find_one({"id": rating_data["customer_id"]})
        technician = await self.db.technicians.find_one({"id": rating_data["technician_id"]})
        
        notification_service = NotificationService(
            sms_service=self.sms_service,
            email_service=MockEmailService(),
            db=self.db
        )
        
        notification = NotificationCreate(
            company_id=rating_data["company_id"],
            owner_id="owner",  # Will be updated with actual owner ID
            notification_type="low_rating",
            title=f"Low Rating Alert: {rating_value}/5 stars",
            message=f"Customer {customer['name']} rated {technician['name']} {rating_value}/5 for {job['title']}",
            data={
                "job_id": rating_data["job_id"],
                "customer_id": rating_data["customer_id"],
                "technician_id": rating_data["technician_id"],
                "rating": rating_value
            },
            action_required=True,
            action_url=f"/portal/jobs/{rating_data['job_id']}",
            priority="high"
        )
        
        await notification_service.send_notification(notification)

class NotificationService:
    """Owner notification system with multi-channel delivery"""
    
    def __init__(self, sms_service: MockTwilioService, email_service: MockEmailService, db):
        self.sms_service = sms_service
        self.email_service = email_service
        self.db = db
    
    async def send_notification(self, notification: NotificationCreate) -> OwnerNotification:
        """Send multi-channel notification"""
        
        # Create notification record
        notification_obj = OwnerNotification(**notification.dict())
        await self.db.notifications.insert_one(notification_obj.dict())
        
        # Get notification settings
        settings = await self.get_notification_settings(
            notification.company_id,
            notification.owner_id
        )
        
        channels_sent = ["in_app"]  # Always create in-app notification
        
        # Send SMS if enabled
        if settings.get("sms_enabled", False) and settings.get("sms_number"):
            try:
                await self.sms_service.send_sms(
                    to=settings["sms_number"],
                    body=f"{notification.title}: {notification.message}"
                )
                channels_sent.append("sms")
            except Exception as e:
                logger.error(f"Failed to send SMS notification: {str(e)}")
        
        # Send email if enabled
        if settings.get("email_enabled", False) and settings.get("email_address"):
            try:
                await self.email_service.send_email(
                    to=settings["email_address"],
                    subject=notification.title,
                    content=self.format_email_notification(notification_obj)
                )
                channels_sent.append("email")
            except Exception as e:
                logger.error(f"Failed to send email notification: {str(e)}")
        
        # Update notification with sent channels
        await self.db.notifications.update_one(
            {"id": notification_obj.id},
            {"$set": {"channels_sent": channels_sent}}
        )
        
        return notification_obj
    
    async def get_notification_settings(self, company_id: str, user_id: str) -> Dict[str, Any]:
        """Get notification settings for user"""
        
        settings = await self.db.notification_settings.find_one({
            "company_id": company_id,
            "user_id": user_id
        })
        
        if not settings:
            # Return default settings
            return {
                "in_app_enabled": True,
                "sms_enabled": False,
                "email_enabled": False,
                "new_appointment": True,
                "tech_assigned": True,
                "job_completed": True,
                "low_rating": True
            }
        
        return settings
    
    def format_email_notification(self, notification: OwnerNotification) -> str:
        """Format notification for email"""
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">{notification.title}</h2>
            <p>{notification.message}</p>
            
            {f'<p><a href="{notification.action_url}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>' if notification.action_url else ''}
            
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
                This is an automated notification from your HVAC Assistant.
                Sent at {notification.created_at.strftime('%Y-%m-%d %H:%M:%S')}
            </p>
        </div>
        """
        
        return html_content

# Service Instances (Dependency Injection)
twilio_service = MockTwilioService()
calendar_service = MockGoogleCalendarService()
llm_service = MockLLMService()
email_service = MockEmailService()

def get_messaging_service(db):
    """Get messaging service instance"""
    return MessagingService(twilio_service, db)

def get_rating_service(db):
    """Get rating service instance"""
    return RatingService(twilio_service, db)

def get_notification_service(db):
    """Get notification service instance"""
    return NotificationService(twilio_service, email_service, db)

def get_calendar_service():
    """Get calendar service instance"""
    return calendar_service

def get_llm_service():
    """Get LLM service instance"""
    return llm_service