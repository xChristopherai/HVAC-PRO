from fastapi import FastAPI, HTTPException, Depends, status, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
from collections import defaultdict

# Import models and services
from models import *
from phase2_models import *
from auth import *
from services import *

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'hvac_assistant')]

# Create FastAPI app
app = FastAPI(title="HVAC Assistant API", version="2.0.0")

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/api/admin/login")
async def admin_login(credentials: dict):
    """Admin portal login"""
    email = credentials.get("email")
    password = credentials.get("password")
    
    if authenticate_admin(email, password):
        token = create_admin_token()
        return {"access_token": token, "token_type": "bearer"}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials"
    )

@app.post("/api/auth/login")
async def login(credentials: dict):
    """Business user login (mock for development)"""
    
    # Mock authentication for development
    role = credentials.get("role", "owner")
    company_id = credentials.get("company_id", "elite-hvac-001")
    
    mock_auth = MockAuth()
    token = mock_auth.create_mock_token(UserRole(role), company_id)
    
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# ==================== COMPANY MANAGEMENT ENDPOINTS ====================

@app.post("/api/companies", response_model=Company)
async def create_company(company: CompanyCreate, current_user: dict = Depends(require_admin)):
    """Create new company (admin only)"""
    company_obj = Company(**company.dict())
    await db.companies.insert_one(company_obj.dict())
    return company_obj

@app.get("/api/companies", response_model=List[Company])
async def list_companies(current_user: dict = Depends(require_admin)):
    """List all companies (admin only)"""
    companies = await db.companies.find().to_list(1000)
    return [Company(**comp) for comp in companies]

@app.get("/api/companies/{company_id}", response_model=Company)
async def get_company(company_id: str, current_user: dict = Depends(get_current_user)):
    """Get company details"""
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return Company(**company)

@app.put("/api/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, company_data: dict, current_user: dict = Depends(require_owner_or_admin)):
    """Update company information"""
    await db.companies.update_one(
        {"id": company_id},
        {"$set": {**company_data, "updated_at": datetime.utcnow()}}
    )
    updated_company = await db.companies.find_one({"id": company_id})
    return Company(**updated_company)

# ==================== CUSTOMER MANAGEMENT ENDPOINTS ====================

@app.post("/api/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate, current_user: dict = Depends(get_current_user)):
    """Create new customer"""
    customer_obj = Customer(**customer.dict())
    await db.customers.insert_one(customer_obj.dict())
    return customer_obj

@app.get("/api/customers", response_model=List[Customer])
async def list_customers(
    company_id: str = Query(...),
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """List customers for company"""
    customers = await db.customers.find({"company_id": company_id}).skip(skip).limit(limit).to_list(limit)
    return [Customer(**cust) for cust in customers]

@app.get("/api/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    """Get customer details"""
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

@app.put("/api/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: dict, current_user: dict = Depends(get_current_user)):
    """Update customer information"""
    await db.customers.update_one(
        {"id": customer_id},
        {"$set": {**customer_data, "updated_at": datetime.utcnow()}}
    )
    updated_customer = await db.customers.find_one({"id": customer_id})
    return Customer(**updated_customer)

@app.delete("/api/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    """Delete customer"""
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

# ==================== TECHNICIAN MANAGEMENT ENDPOINTS ====================

@app.post("/api/technicians", response_model=Technician)
async def create_technician(technician: TechnicianCreate, current_user: dict = Depends(get_current_user)):
    """Create new technician"""
    technician_obj = Technician(**technician.dict())
    await db.technicians.insert_one(technician_obj.dict())
    return technician_obj

@app.get("/api/technicians", response_model=List[Technician])
async def list_technicians(
    company_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """List technicians for company"""
    technicians = await db.technicians.find({"company_id": company_id}).to_list(100)
    return [Technician(**tech) for tech in technicians]

@app.get("/api/technicians/{technician_id}", response_model=Technician)
async def get_technician(technician_id: str, current_user: dict = Depends(get_current_user)):
    """Get technician details"""
    technician = await db.technicians.find_one({"id": technician_id})
    if not technician:
        raise HTTPException(status_code=404, detail="Technician not found")
    return Technician(**technician)

@app.put("/api/technicians/{technician_id}", response_model=Technician)
async def update_technician(technician_id: str, technician_data: dict, current_user: dict = Depends(get_current_user)):
    """Update technician information"""
    await db.technicians.update_one(
        {"id": technician_id},
        {"$set": {**technician_data, "updated_at": datetime.utcnow()}}
    )
    updated_technician = await db.technicians.find_one({"id": technician_id})
    return Technician(**updated_technician)

# ==================== APPOINTMENT MANAGEMENT ENDPOINTS ====================

@app.post("/api/appointments", response_model=Appointment)
async def create_appointment(appointment: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    """Create new appointment"""
    appointment_obj = Appointment(**appointment.dict())
    await db.appointments.insert_one(appointment_obj.dict())
    
    # Create Google Calendar event if enabled
    if appointment.scheduled_date:
        calendar_service = get_calendar_service()
        try:
            event_data = {
                "summary": f"HVAC: {appointment.title}",
                "description": appointment.description,
                "start": {"dateTime": appointment.scheduled_date.isoformat()},
                "end": {"dateTime": (appointment.scheduled_date + timedelta(minutes=appointment.estimated_duration)).isoformat()},
            }
            event_id = await calendar_service.create_event(event_data)
            
            # Update appointment with calendar event ID
            await db.appointments.update_one(
                {"id": appointment_obj.id},
                {"$set": {"calendar_event_id": event_id}}
            )
            
        except Exception as e:
            logger.error(f"Failed to create calendar event: {str(e)}")
    
    return appointment_obj

@app.get("/api/appointments", response_model=List[Appointment])
async def list_appointments(
    company_id: str = Query(...),
    status: Optional[str] = None,
    technician_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    source: Optional[str] = Query(None, description="Filter by appointment source: ai-voice, ai-sms, manual"),
    current_user: dict = Depends(get_current_user)
):
    """List appointments with filters"""
    filters = {"company_id": company_id}
    
    if status:
        filters["status"] = status
    if technician_id:
        filters["technician_id"] = technician_id
    if date_from:
        filters["scheduled_date"] = {"$gte": date_from}
    if date_to:
        filters.setdefault("scheduled_date", {})["$lte"] = date_to
    if source:
        filters["source"] = source
    
    appointments = await db.appointments.find(filters).sort("scheduled_date", 1).to_list(100)
    return [Appointment(**appt) for appt in appointments]

@app.get("/api/appointments/{appointment_id}", response_model=Appointment)
async def get_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    """Get appointment details"""
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return Appointment(**appointment)

@app.put("/api/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(appointment_id: str, appointment_data: dict, current_user: dict = Depends(get_current_user)):
    """Update appointment"""
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {**appointment_data, "updated_at": datetime.utcnow()}}
    )
    updated_appointment = await db.appointments.find_one({"id": appointment_id})
    return Appointment(**updated_appointment)

# ==================== AI VOICE SCHEDULING ENDPOINTS ====================

# Environment variables for Twilio integration
ai_voice_enabled = os.environ.get('AI_VOICE_SCHEDULING_ENABLED', 'true').lower() == 'true'
twilio_enabled = os.environ.get('TWILIO_ENABLED', 'false').lower() == 'true'

@app.get("/api/availability")
async def get_availability(date: str = Query(..., description="Date in YYYY-MM-DD format")):
    """Get available appointment windows for a specific date"""
    try:
        # Check if availability is configured for this date
        availability_doc = await db.availability.find_one({"date": date})
        
        if availability_doc:
            availability = Availability(**availability_doc)
        else:
            # Create default availability
            availability = Availability(
                company_id="default",
                date=date,
                windows=[
                    {"window": "8-11", "capacity": 4, "booked": 0},
                    {"window": "12-3", "capacity": 4, "booked": 0},
                    {"window": "3-6", "capacity": 4, "booked": 0}
                ]
            )
            # Save default availability
            await db.availability.insert_one(availability.dict())
        
        # Count existing appointments for this date to calculate booked slots
        existing_appointments = await db.appointments.find({
            "scheduled_date": {"$regex": f"^{date}"}
        }).to_list(100)
        
        # Update booked counts based on existing appointments
        for window in availability.windows:
            window["booked"] = sum(1 for apt in existing_appointments if apt.get("window") == window["window"])
            window["available"] = window["capacity"] - window["booked"]
        
        windows = [
            AvailabilityWindow(
                window=TimeWindow(w["window"]),
                capacity=w["capacity"],
                booked=w["booked"],
                available=max(0, w["capacity"] - w["booked"])
            ) for w in availability.windows
        ]
        
        return AvailabilityResponse(date=date, windows=windows)
        
    except Exception as e:
        logger.error(f"Error getting availability: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# In-memory session storage (for development)
voice_sessions = {}

@app.post("/api/voice/inbound")
async def voice_webhook(request: Request):
    """Enhanced Twilio voice webhook handler with call logging"""
    if not ai_voice_enabled:
        return {"error": "AI Voice Scheduling is disabled"}
    
    try:
        form_data = await request.form()
        phone_number = form_data.get("From", "").replace("+1", "")
        call_sid = form_data.get("CallSid", "")
        call_status = form_data.get("CallStatus", "")
        
        logger.info(f"Voice call from {phone_number}, CallSid: {call_sid}, Status: {call_status}")
        
        # Create or update call log
        call_log = await manage_call_log(call_sid, phone_number, form_data)
        
        # Get or create session state
        session_key = f"voice_{phone_number}_{call_sid}"
        if session_key not in voice_sessions:
            voice_sessions[session_key] = VoiceSessionState(
                phone_number=phone_number,
                state="greet",
                expires_at=datetime.utcnow() + timedelta(minutes=15)
            ).dict()
        
        session = voice_sessions[session_key]
        current_state = session["state"]
        
        # Handle call status updates
        if call_status in ["completed", "busy", "failed", "no-answer"]:
            await finalize_call_log(call_log, call_status, voice_sessions[session_key])
            return JSONResponse(content={"status": "call_ended"})
        
        # Process voice state machine
        twiml_response = await handle_enhanced_voice_state(voice_sessions[session_key], form_data, call_log)
        
        # Log interaction in call transcript
        await add_call_transcript(call_log.id, voice_sessions[session_key], form_data.get("SpeechResult", ""))
        
        return JSONResponse(
            content=twiml_response,
            headers={"Content-Type": "application/xml"}
        )
        
    except Exception as e:
        logger.error(f"Voice webhook error: {str(e)}")
        return JSONResponse(
            content={"Say": "I'm sorry, we're experiencing technical difficulties. Please call back later."},
            headers={"Content-Type": "application/xml"}
        )

async def manage_call_log(call_sid: str, phone_number: str, form_data) -> 'CallLog':
    """Create or update call log entry"""
    try:
        # Check if call log already exists
        existing_log = await db.call_logs.find_one({"call_sid": call_sid})
        
        if existing_log:
            # Update existing log
            call_log = CallLog(**existing_log)
        else:
            # Find customer by phone
            customer = await db.customers.find_one({"phone": phone_number})
            
            # Create new call log
            call_log_data = CallLogCreate(
                company_id="company-001",
                phone_number=phone_number,
                call_sid=call_sid,
                customer_name=customer.get("name", "Unknown") if customer else "Unknown"
            )
            
            call_log = CallLog(
                **call_log_data.dict(),
                customer_id=customer.get("id") if customer else None,
                status=CallStatus.INCOMING,
                answered_by_ai=True
            )
            
            await db.call_logs.insert_one(call_log.dict())
            logger.info(f"Created call log: {call_log.id}")
        
        return call_log
        
    except Exception as e:
        logger.error(f"Error managing call log: {str(e)}")
        # Return minimal call log to prevent crashes
        return CallLog(
            company_id="company-001",
            phone_number=phone_number,
            call_sid=call_sid,
            customer_name="Unknown"
        )

async def add_call_transcript(call_log_id: str, session: dict, speech_result: str):
    """Add interaction to call transcript"""
    try:
        if not speech_result:
            return
            
        transcript_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "state": session.get("state", "unknown"),
            "speaker": "customer",
            "content": speech_result,
            "confidence": 0.9  # Mock confidence score
        }
        
        await db.call_logs.update_one(
            {"id": call_log_id},
            {
                "$push": {"transcript": transcript_entry},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
    except Exception as e:
        logger.error(f"Error adding call transcript: {str(e)}")

async def finalize_call_log(call_log: 'CallLog', call_status: str, session: dict):
    """Finalize call log when call ends"""
    try:
        # Determine call outcome based on session data
        outcome = CallOutcome.TECHNICAL_ISSUE
        
        if session.get("state") == "completed" and session.get("data", {}).get("appointment_created"):
            outcome = CallOutcome.APPOINTMENT_CREATED
        elif session.get("state") in ["collect_name", "collect_address", "collect_issue"]:
            outcome = CallOutcome.CUSTOMER_HANGUP
        elif call_status == "completed":
            outcome = CallOutcome.INFORMATION_PROVIDED
        
        # Calculate duration (mock for now)
        duration = (datetime.utcnow() - call_log.start_time).seconds
        
        # Update call log
        await db.call_logs.update_one(
            {"id": call_log.id},
            {
                "$set": {
                    "status": CallStatus.COMPLETED if call_status == "completed" else CallStatus.FAILED,
                    "end_time": datetime.utcnow(),
                    "duration": duration,
                    "outcome": outcome,
                    "session_data": session.get("data", {}),
                    "issue_type": session.get("data", {}).get("issue_type"),
                    "appointment_id": session.get("data", {}).get("appointment_id"),
                    "ai_confidence": 0.85,  # Mock confidence score
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Finalized call log {call_log.id}: {outcome}")
        
    except Exception as e:
        logger.error(f"Error finalizing call log: {str(e)}")

async def handle_enhanced_voice_state(session: dict, form_data, call_log: 'CallLog') -> dict:
    """Enhanced voice state machine with better logging"""
    phone_number = session["phone_number"]
    current_state = session["state"]
    
    # Extract speech input if available
    speech_result = form_data.get("SpeechResult", "").lower().strip()
    digits = form_data.get("Digits", "")
    
    twiml = {"Say": "", "Gather": None, "Hangup": False}
    
    if current_state == "greet":
        twiml["Say"] = "Hello! Welcome to HVAC Pro. I'm here to help you schedule a service appointment. May I get your name please?"
        twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
        session["state"] = "collect_name"
        
        # Add AI response to transcript
        await add_ai_response_to_transcript(call_log.id, "greet", twiml["Say"])
    
    elif current_state == "collect_name":
        if speech_result:
            if "data" not in session:
                session["data"] = {}
            session["data"]["name"] = speech_result.title()
            twiml["Say"] = f"Thank you {speech_result.title()}. What's your service address?"
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
            session["state"] = "collect_address"
            
            await add_ai_response_to_transcript(call_log.id, "collect_name", twiml["Say"])
        else:
            twiml["Say"] = "I didn't catch that. Could you please tell me your name?"
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
    
    elif current_state == "collect_address":
        if speech_result:
            if "data" not in session:
                session["data"] = {}
            session["data"]["address"] = speech_result
            twiml["Say"] = "Got it. What type of issue are you experiencing? Please say: no heat, no cooling, maintenance, or plumbing."
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
            session["state"] = "collect_issue"
            
            await add_ai_response_to_transcript(call_log.id, "collect_address", twiml["Say"])
        else:
            twiml["Say"] = "Could you please repeat your address?"
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
    
    elif current_state == "collect_issue":
        if speech_result:
            # Map speech to issue types
            issue_mapping = {
                "no heat": "no_heat",
                "no heating": "no_heat", 
                "heat": "no_heat",
                "no cool": "no_cool",
                "no cooling": "no_cool",
                "cool": "no_cool",
                "air": "no_cool",
                "maintenance": "maintenance",
                "plumbing": "plumbing"
            }
            
            detected_issue = None
            for key, value in issue_mapping.items():
                if key in speech_result:
                    detected_issue = value
                    break
            
            if detected_issue:
                if "data" not in session:
                    session["data"] = {}
                session["data"]["issue_type"] = detected_issue
                
                # Get today's availability
                from datetime import date
                today = date.today().strftime("%Y-%m-%d")
                availability_resp = await get_availability(today)
                
                available_windows = [w for w in availability_resp.windows if w.available > 0]
                
                if available_windows:
                    window_text = ", ".join([f"{w.window.replace('-', ' to ')}" for w in available_windows])
                    twiml["Say"] = f"Perfect. I can schedule you for today between {window_text}. Please say which time window works best for you."
                    twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
                    session["state"] = "offer_windows"
                    session["data"]["available_windows"] = [w.window for w in available_windows]
                    session["data"]["date"] = today
                    
                    await add_ai_response_to_transcript(call_log.id, "collect_issue", twiml["Say"])
                else:
                    twiml["Say"] = "I'm sorry, we don't have any availability today. Let me transfer you to our office for manual scheduling."
                    twiml["Hangup"] = True
                    
                    # Update call log for transfer
                    await db.call_logs.update_one(
                        {"id": call_log.id},
                        {"$set": {"transferred_to_tech": True, "outcome": CallOutcome.TRANSFERRED_TO_HUMAN}}
                    )
            else:
                twiml["Say"] = "I didn't understand the issue type. Please say: no heat, no cooling, maintenance, or plumbing."
                twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
        else:
            twiml["Say"] = "Could you please repeat the type of issue you're experiencing?"
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
    
    elif current_state == "offer_windows":
        if speech_result:
            # Try to match spoken window to available windows
            available_windows = session["data"].get("available_windows", [])
            selected_window = None
            
            # Simple matching logic
            if "morning" in speech_result or "8" in speech_result or "eleven" in speech_result:
                if "8-11" in available_windows:
                    selected_window = "8-11"
            elif "afternoon" in speech_result or "12" in speech_result or "noon" in speech_result:
                if "12-3" in available_windows:
                    selected_window = "12-3"
            elif "evening" in speech_result or "3" in speech_result or "later" in speech_result:
                if "3-6" in available_windows:
                    selected_window = "3-6"
            
            if selected_window:
                session["data"]["window"] = selected_window
                
                # Create appointment
                try:
                    appointment = await create_voice_appointment(session["data"], phone_number)
                    session["data"]["appointment_created"] = True
                    session["data"]["appointment_id"] = appointment.id
                    session["state"] = "completed"
                    
                    window_text = selected_window.replace("-", " to ")
                    twiml["Say"] = f"Perfect! You're all booked for {session['data']['date']} between {window_text}. Please keep your pets secured and ensure easy access to your HVAC system. You'll receive an SMS confirmation shortly. Thank you!"
                    twiml["Hangup"] = True
                    
                    # Send SMS confirmation
                    await send_appointment_sms(phone_number, session["data"], selected_window)
                    
                    # Update call log with appointment details
                    await db.call_logs.update_one(
                        {"id": call_log.id},
                        {
                            "$set": {
                                "appointment_id": appointment.id,
                                "outcome": CallOutcome.APPOINTMENT_CREATED,
                                "issue_type": session["data"].get("issue_type")
                            }
                        }
                    )
                    
                    await add_ai_response_to_transcript(call_log.id, "offer_windows", twiml["Say"])
                    
                except Exception as e:
                    logger.error(f"Error creating appointment: {str(e)}")
                    twiml["Say"] = "I'm sorry, there was an error booking your appointment. Please call our office directly."
                    twiml["Hangup"] = True
            else:
                available_text = ", ".join([w.replace("-", " to ") for w in available_windows])
                twiml["Say"] = f"I didn't understand which time you prefer. Available times are: {available_text}. Which works for you?"
                twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
        else:
            twiml["Say"] = "Which time window would you prefer?"
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
    
    return twiml

async def add_ai_response_to_transcript(call_log_id: str, state: str, response: str):
    """Add AI response to call transcript"""
    try:
        transcript_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "state": state,
            "speaker": "ai",
            "content": response,
            "confidence": 1.0
        }
        
        await db.call_logs.update_one(
            {"id": call_log_id},
            {
                "$push": {"transcript": transcript_entry},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
    except Exception as e:
        logger.error(f"Error adding AI response to transcript: {str(e)}")
    """Handle voice call state machine"""
    phone_number = session["phone_number"]
    current_state = session["state"]
    
    # Extract speech input if available
    speech_result = form_data.get("SpeechResult", "").lower().strip()
    digits = form_data.get("Digits", "")
    
    twiml = {"Say": "", "Gather": None, "Hangup": False}
    
    if current_state == "greet":
        twiml["Say"] = "Hello! Welcome to HVAC Pro. I'm here to help you schedule a service appointment. May I get your name please?"
        twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
        session["state"] = "collect_name"
    
    elif current_state == "collect_name":
        if speech_result:
            if "data" not in session:
                session["data"] = {}
            session["data"]["name"] = speech_result.title()
            twiml["Say"] = f"Thank you {speech_result.title()}. What's your service address?"
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
            session["state"] = "collect_address"
        else:
            twiml["Say"] = "I didn't catch that. Could you please tell me your name?"
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
    
    elif current_state == "collect_address":
        if speech_result:
            if "data" not in session:
                session["data"] = {}
            session["data"]["address"] = speech_result
            twiml["Say"] = "Got it. What type of issue are you experiencing? Please say: no heat, no cooling, maintenance, or plumbing."
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
            session["state"] = "collect_issue"
        else:
            twiml["Say"] = "Could you please repeat your address?"
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
    
    elif current_state == "collect_issue":
        if speech_result:
            # Map speech to issue types
            issue_mapping = {
                "no heat": "no_heat",
                "no heating": "no_heat", 
                "heat": "no_heat",
                "no cool": "no_cool",
                "no cooling": "no_cool",
                "cool": "no_cool",
                "air": "no_cool",
                "maintenance": "maintenance",
                "plumbing": "plumbing"
            }
            
            detected_issue = None
            for key, value in issue_mapping.items():
                if key in speech_result:
                    detected_issue = value
                    break
            
            if detected_issue:
                if "data" not in session:
                    session["data"] = {}
                session["data"]["issue_type"] = detected_issue
                
                # Get today's availability
                from datetime import date
                today = date.today().strftime("%Y-%m-%d")
                availability_resp = await get_availability(today)
                
                available_windows = [w for w in availability_resp.windows if w.available > 0]
                
                if available_windows:
                    window_text = ", ".join([f"{w.window.replace('-', ' to ')}" for w in available_windows])
                    twiml["Say"] = f"Perfect. I can schedule you for today between {window_text}. Please say which time window works best for you."
                    twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
                    session["state"] = "offer_windows"
                    session["data"]["available_windows"] = [w.window for w in available_windows]
                    session["data"]["date"] = today
                else:
                    twiml["Say"] = "I'm sorry, we don't have any availability today. Let me transfer you to our office for manual scheduling."
                    twiml["Hangup"] = True
            else:
                twiml["Say"] = "I didn't understand the issue type. Please say: no heat, no cooling, maintenance, or plumbing."
                twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
        else:
            twiml["Say"] = "Could you please repeat the type of issue you're experiencing?"
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
    
    elif current_state == "offer_windows":
        if speech_result:
            # Try to match spoken window to available windows
            available_windows = session["data"].get("available_windows", [])
            selected_window = None
            
            # Simple matching logic
            if "morning" in speech_result or "8" in speech_result or "eleven" in speech_result:
                if "8-11" in available_windows:
                    selected_window = "8-11"
            elif "afternoon" in speech_result or "12" in speech_result or "noon" in speech_result:
                if "12-3" in available_windows:
                    selected_window = "12-3"
            elif "evening" in speech_result or "3" in speech_result or "later" in speech_result:
                if "3-6" in available_windows:
                    selected_window = "3-6"
            
            if selected_window:
                session["data"]["window"] = selected_window
                
                # Create appointment
                try:
                    appointment = await create_voice_appointment(session["data"], phone_number)
                    window_text = selected_window.replace("-", " to ")
                    twiml["Say"] = f"Perfect! You're all booked for {session['data']['date']} between {window_text}. Please keep your pets secured and ensure easy access to your HVAC system. You'll receive an SMS confirmation shortly. Thank you!"
                    twiml["Hangup"] = True
                    
                    # Send SMS confirmation
                    await send_appointment_sms(phone_number, session["data"], selected_window)
                    
                except Exception as e:
                    logger.error(f"Error creating appointment: {str(e)}")
                    twiml["Say"] = "I'm sorry, there was an error booking your appointment. Please call our office directly."
                    twiml["Hangup"] = True
            else:
                available_text = ", ".join([w.replace("-", " to ") for w in available_windows])
                twiml["Say"] = f"I didn't understand which time you prefer. Available times are: {available_text}. Which works for you?"
                twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
        else:
            twiml["Say"] = "Which time window would you prefer?"
            twiml["Gather"] = {"input": "speech", "action": "/api/voice/inbound", "method": "POST"}
    
    return twiml

async def create_voice_appointment(session_data: dict, phone_number: str) -> Appointment:
    """Create appointment from voice session data"""
    try:
        # Find or create customer
        customer = await db.customers.find_one({"phone": phone_number})
        
        if not customer:
            # Create new customer
            customer_data = CustomerCreate(
                company_id="company-001",  # Default company
                name=session_data.get("name", "Voice Customer"),
                phone=phone_number,
                address={"full": session_data.get("address", "")},
                preferred_contact="phone"
            )
            customer_obj = Customer(**customer_data.dict())
            await db.customers.insert_one(customer_obj.dict())
            customer_id = customer_obj.id
        else:
            customer_id = customer["id"]
        
        # Parse scheduled date and time
        from datetime import datetime, date
        appointment_date = session_data["date"]  # YYYY-MM-DD
        window = session_data["window"]  # e.g. "8-11"
        start_hour = int(window.split("-")[0])
        
        scheduled_datetime = datetime.strptime(f"{appointment_date} {start_hour:02d}:00", "%Y-%m-%d %H:%M")
        
        # Create appointment
        appointment_data = AppointmentCreate(
            company_id="company-001",
            customer_id=customer_id,
            title=f"HVAC Service - {session_data.get('issue_type', 'Service')}",
            description=f"Issue: {session_data.get('issue_type', 'Service')}. Address: {session_data.get('address', '')}",
            scheduled_date=scheduled_datetime,
            estimated_duration=120,  # 2 hours default
            service_type=session_data.get("issue_type", "maintenance"),
            source=AppointmentSource.AI_VOICE,
            issue_type=IssueType(session_data.get("issue_type", "maintenance")),
            window=TimeWindow(window),
            address=session_data.get("address", "")
        )
        
        appointment_obj = Appointment(**appointment_data.dict())
        await db.appointments.insert_one(appointment_obj.dict())
        
        # Update availability (increment booked count)
        await db.availability.update_one(
            {"date": appointment_date, "windows.window": window},
            {"$inc": {"windows.$.booked": 1}}
        )
        
        logger.info(f"Created voice appointment: {appointment_obj.id}")
        return appointment_obj
        
    except Exception as e:
        logger.error(f"Error creating voice appointment: {str(e)}")
        raise

# ==================== CALL LOG ENDPOINTS (PHASE 6) ====================

@app.get("/api/call-logs", response_model=CallLogSearchResponse)
async def search_call_logs(
    company_id: str = Query(..., description="Company ID"),
    search: Optional[str] = Query(None, description="Search by customer name or phone number"),
    date_filter: Optional[str] = Query(None, description="Date filter: today, yesterday, this_week, last_week, custom"),
    date_from: Optional[str] = Query(None, description="Start date for custom filter (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date for custom filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Call status filter"),
    answered_by: Optional[str] = Query(None, description="Filter by who answered: ai, human, missed"),
    outcome: Optional[str] = Query(None, description="Call outcome filter"),
    issue_type: Optional[str] = Query(None, description="Issue type filter"),
    transferred: Optional[bool] = Query(None, description="Filter by transferred calls"),
    skip: int = Query(0, description="Skip records for pagination"),
    limit: int = Query(50, description="Limit records returned"),
    current_user: dict = Depends(get_current_user)
):
    """Search and filter call logs with comprehensive filters"""
    
    try:
        # Build query filters
        filters = {"company_id": company_id}
        
        # Search filter (customer name or phone)
        if search:
            search_regex = {"$regex": search.replace("+", "\\+"), "$options": "i"}
            filters["$or"] = [
                {"customer_name": search_regex},
                {"phone_number": search_regex}
            ]
        
        # Date filters
        if date_filter:
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            if date_filter == "today":
                filters["start_time"] = {"$gte": today}
            elif date_filter == "yesterday":
                yesterday = today - timedelta(days=1)
                filters["start_time"] = {"$gte": yesterday, "$lt": today}
            elif date_filter == "this_week":
                week_start = today - timedelta(days=today.weekday())
                filters["start_time"] = {"$gte": week_start}
            elif date_filter == "last_week":
                week_start = today - timedelta(days=today.weekday() + 7)
                week_end = today - timedelta(days=today.weekday())
                filters["start_time"] = {"$gte": week_start, "$lt": week_end}
            elif date_filter == "custom" and date_from and date_to:
                try:
                    from_date = datetime.strptime(date_from, "%Y-%m-%d")
                    to_date = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
                    filters["start_time"] = {"$gte": from_date, "$lt": to_date}
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Status filter
        if status:
            filters["status"] = status
            
        # Answered by filter
        if answered_by:
            if answered_by == "ai":
                filters["answered_by_ai"] = True
                filters["transferred_to_tech"] = False
            elif answered_by == "human":
                filters["transferred_to_tech"] = True
            elif answered_by == "missed":
                filters["status"] = {"$in": ["missed", "failed"]}
                
        # Outcome filter
        if outcome:
            filters["outcome"] = outcome
            
        # Issue type filter
        if issue_type:
            filters["issue_type"] = issue_type
            
        # Transferred filter
        if transferred is not None:
            filters["transferred_to_tech"] = transferred
        
        # Get total count
        total_count = await db.call_logs.count_documents(filters)
        
        # Get paginated results
        call_logs_data = await db.call_logs.find(filters)\
            .sort("start_time", -1)\
            .skip(skip)\
            .limit(limit)\
            .to_list(limit)
        
        call_logs = [CallLog(**log) for log in call_logs_data]
        
        return CallLogSearchResponse(
            calls=call_logs,
            total_count=total_count,
            filters_applied={
                "search": search,
                "date_filter": date_filter,
                "status": status,
                "answered_by": answered_by,
                "outcome": outcome,
                "issue_type": issue_type,
                "transferred": transferred
            }
        )
        
    except Exception as e:
        logger.error(f"Error searching call logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/call-logs/{call_id}", response_model=CallLog)
async def get_call_log(
    call_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed call log with full transcript"""
    
    call_log = await db.call_logs.find_one({"id": call_id})
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    return CallLog(**call_log)

@app.get("/api/call-logs/stats/{company_id}")
async def get_call_stats(
    company_id: str,
    period: str = Query("today", description="Stats period: today, this_week, this_month"),
    current_user: dict = Depends(get_current_user)
):
    """Get call statistics for dashboard"""
    
    try:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Determine date range
        if period == "today":
            start_date = today
        elif period == "this_week":
            start_date = today - timedelta(days=today.weekday())
        elif period == "this_month":
            start_date = today.replace(day=1)
        else:
            start_date = today
        
        # Build aggregation pipeline
        pipeline = [
            {
                "$match": {
                    "company_id": company_id,
                    "start_time": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_calls": {"$sum": 1},
                    "ai_answered": {"$sum": {"$cond": [{"$eq": ["$answered_by_ai", True]}, 1, 0]}},
                    "transferred_to_human": {"$sum": {"$cond": ["$transferred_to_tech", 1, 0]}},
                    "appointments_created": {"$sum": {"$cond": [{"$eq": ["$outcome", "appointment_created"]}, 1, 0]}},
                    "avg_duration": {"$avg": "$duration"},
                    "completed_calls": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}}
                }
            }
        ]
        
        result = await db.call_logs.aggregate(pipeline).to_list(1)
        
        if not result:
            return {
                "period": period,
                "total_calls": 0,
                "ai_answered": 0,
                "transferred_to_human": 0,
                "appointments_created": 0,
                "avg_duration": 0,
                "completed_calls": 0,
                "ai_success_rate": 0,
                "appointment_conversion_rate": 0
            }
        
        stats = result[0]
        
        # Calculate rates
        ai_success_rate = (stats["ai_answered"] / stats["total_calls"] * 100) if stats["total_calls"] > 0 else 0
        appointment_rate = (stats["appointments_created"] / stats["completed_calls"] * 100) if stats["completed_calls"] > 0 else 0
        
        return {
            "period": period,
            "total_calls": stats["total_calls"],
            "ai_answered": stats["ai_answered"],
            "transferred_to_human": stats["transferred_to_human"],
            "appointments_created": stats["appointments_created"],
            "avg_duration": round(stats["avg_duration"] or 0, 1),
            "completed_calls": stats["completed_calls"],
            "ai_success_rate": round(ai_success_rate, 1),
            "appointment_conversion_rate": round(appointment_rate, 1)
        }
        
    except Exception as e:
        logger.error(f"Error getting call stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def send_appointment_sms(phone_number: str, session_data: dict, window: str):
    """Send SMS confirmation after appointment creation with enhanced tracking"""
    try:
        sms_service = get_sms_service()
        window_text = window.replace("-", " to ")
        
        # Enhanced SMS template with more professional tone
        message = f"""Confirmed! {session_data.get('name', '')}, your HVAC service is scheduled for {session_data['date']} between {window_text}.
        
📍 Address: {session_data.get('address', 'As provided')}
🔧 Issue: {session_data.get('issue_type', 'Service').replace('_', ' ').title()}
        
We'll call 30 minutes before arrival. Please ensure pets are secured and HVAC system is accessible.

For changes, call (555) HVAC-PRO. Reply STOP to opt out."""
        
        # Check if TWILIO_ENABLED, otherwise log mock SMS
        if twilio_enabled:
            await sms_service.send_message(
                to_number=phone_number,
                message=message
            )
            logger.info(f"Real SMS confirmation sent to {phone_number}")
        else:
            # Mock SMS - just log it
            logger.info(f"MOCK SMS (TWILIO_ENABLED=false) to {phone_number}: {message}")
            
            # Also add to mock sent messages for testing
            if hasattr(sms_service, 'sent_messages'):
                sms_service.sent_messages.append({
                    "to": phone_number,
                    "body": message,
                    "status": "mock_sent",
                    "timestamp": datetime.utcnow().isoformat()
                })
        
    except Exception as e:
        logger.error(f"Error sending SMS confirmation: {str(e)}")
        # Don't fail the whole appointment creation if SMS fails

# ==================== JOB MANAGEMENT ENDPOINTS ====================

@app.post("/api/jobs", response_model=Job)
async def create_job(job: JobCreate, current_user: dict = Depends(get_current_user)):
    """Create new job"""
    job_obj = Job(**job.dict())
    await db.jobs.insert_one(job_obj.dict())
    return job_obj

@app.get("/api/jobs", response_model=List[Job])
async def list_jobs(
    company_id: str = Query(...),
    status: Optional[str] = None,
    technician_id: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List jobs with filters"""
    filters = {"company_id": company_id}
    
    if status:
        filters["status"] = status
    if technician_id:
        filters["technician_id"] = technician_id
    if priority:
        filters["priority"] = priority
    
    jobs = await db.jobs.find(filters).sort("created_at", -1).to_list(100)
    return [Job(**job) for job in jobs]

@app.get("/api/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    """Get job details"""
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return Job(**job)

@app.put("/api/jobs/{job_id}", response_model=Job)
async def update_job(job_id: str, job_data: dict, current_user: dict = Depends(get_current_user)):
    """Update job"""
    await db.jobs.update_one(
        {"id": job_id},
        {"$set": {**job_data, "updated_at": datetime.utcnow()}}
    )
    updated_job = await db.jobs.find_one({"id": job_id})
    return Job(**updated_job)

@app.post("/api/jobs/{job_id}/assign")
async def assign_technician(job_id: str, assignment_data: dict, current_user: dict = Depends(get_current_user)):
    """Assign technician to job"""
    technician_id = assignment_data.get("technician_id")
    
    # Update job
    await db.jobs.update_one(
        {"id": job_id},
        {"$set": {"technician_id": technician_id, "status": "assigned", "updated_at": datetime.utcnow()}}
    )
    
    # Send notification to technician via SMS
    job = await db.jobs.find_one({"id": job_id})
    technician = await db.technicians.find_one({"id": technician_id})
    
    if job and technician and technician.get("phone"):
        sms_service = twilio_service
        message = f"New job assigned: {job['title']} at {job.get('scheduled_date', 'TBD')}. Please confirm receipt."
        
        try:
            await sms_service.send_sms(technician["phone"], message)
        except Exception as e:
            logger.error(f"Failed to send assignment SMS: {str(e)}")
    
    return {"message": "Technician assigned successfully"}

@app.post("/api/jobs/{job_id}/complete")
async def complete_job(job_id: str, completion_data: dict, current_user: dict = Depends(get_current_user)):
    """Mark job as completed"""
    
    # Update job
    await db.jobs.update_one(
        {"id": job_id},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.utcnow(),
                "actual_cost": completion_data.get("actual_cost"),
                "labor_hours": completion_data.get("labor_hours"),
                "notes": completion_data.get("notes", ""),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Send rating request SMS
    rating_service = get_rating_service(db)
    try:
        await rating_service.request_rating(job_id)
    except Exception as e:
        logger.error(f"Failed to send rating request: {str(e)}")
    
    return {"message": "Job marked as completed"}

# ==================== INVOICE MANAGEMENT ENDPOINTS ====================

@app.post("/api/invoices", response_model=Invoice)
async def create_invoice(invoice: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    """Create new invoice"""
    
    # Calculate totals
    subtotal = sum(item.total for item in invoice.items)
    tax_amount = subtotal * invoice.tax_rate
    total_amount = subtotal + tax_amount
    
    # Generate invoice number
    invoice_count = await db.invoices.count_documents({"company_id": invoice.company_id})
    invoice_number = f"INV-{datetime.now().year}-{invoice_count + 1:04d}"
    
    invoice_obj = Invoice(
        **invoice.dict(),
        invoice_number=invoice_number,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount
    )
    
    await db.invoices.insert_one(invoice_obj.dict())
    return invoice_obj

@app.get("/api/invoices", response_model=List[Invoice])
async def list_invoices(
    company_id: str = Query(...),
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List invoices"""
    filters = {"company_id": company_id}
    if status:
        filters["status"] = status
    
    invoices = await db.invoices.find(filters).sort("created_at", -1).to_list(100)
    return [Invoice(**inv) for inv in invoices]

@app.get("/api/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    """Get invoice details"""
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return Invoice(**invoice)

# ==================== SMS INQUIRY ENDPOINTS ====================

@app.post("/api/inquiries", response_model=Inquiry)
async def create_inquiry(inquiry: InquiryCreate, current_user: dict = Depends(get_current_user)):
    """Create SMS inquiry"""
    
    # Generate AI response
    llm_service = get_llm_service()
    context = {"company_name": "Elite HVAC Solutions"}
    ai_response = await llm_service.generate_sms_response(inquiry.initial_message, context)
    
    inquiry_obj = Inquiry(
        **inquiry.dict(),
        ai_response=ai_response,
        conversation_history=[
            {"sender": "customer", "message": inquiry.initial_message, "timestamp": datetime.utcnow()},
            {"sender": "ai", "message": ai_response, "timestamp": datetime.utcnow()}
        ]
    )
    
    await db.inquiries.insert_one(inquiry_obj.dict())
    
    # Send SMS response
    sms_service = twilio_service
    try:
        await sms_service.send_sms(inquiry.customer_phone, ai_response)
    except Exception as e:
        logger.error(f"Failed to send SMS response: {str(e)}")
    
    return inquiry_obj

@app.get("/api/inquiries", response_model=List[Inquiry])
async def list_inquiries(
    company_id: str = Query(...),
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List SMS inquiries"""
    filters = {"company_id": company_id}
    if status:
        filters["status"] = status
    
    inquiries = await db.inquiries.find(filters).sort("created_at", -1).to_list(100)
    return [Inquiry(**inq) for inq in inquiries]

@app.post("/api/inquiries/{inquiry_id}/respond")
async def respond_to_inquiry(inquiry_id: str, response_data: dict, current_user: dict = Depends(get_current_user)):
    """Respond to SMS inquiry"""
    
    inquiry = await db.inquiries.find_one({"id": inquiry_id})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    response_message = response_data.get("message", "")
    
    # Update inquiry with new message
    await db.inquiries.update_one(
        {"id": inquiry_id},
        {
            "$push": {
                "conversation_history": {
                    "sender": "agent",
                    "message": response_message,
                    "timestamp": datetime.utcnow()
                }
            },
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    # Send SMS
    sms_service = twilio_service
    try:
        await sms_service.send_sms(inquiry["customer_phone"], response_message)
    except Exception as e:
        logger.error(f"Failed to send SMS: {str(e)}")
    
    return {"message": "Response sent successfully"}

# ==================== TWILIO WEBHOOK ENDPOINT ====================

@app.post("/api/webhooks/twilio")
async def twilio_webhook(request: Request):
    """Handle incoming SMS from Twilio"""
    
    form_data = await request.form()
    webhook_data = dict(form_data)
    
    sms_service = twilio_service
    processed_data = sms_service.process_webhook(webhook_data)
    
    customer_phone = processed_data["from"]
    message_body = processed_data["body"]
    
    # Check if this is a rating response (1-5)
    rating_service = get_rating_service(db)
    rating_processed = await rating_service.process_rating_response(customer_phone, message_body)
    
    if not rating_processed:
        # Handle as regular inquiry
        # Find existing inquiry or create new one
        existing_inquiry = await db.inquiries.find_one({
            "customer_phone": customer_phone,
            "status": {"$in": ["new", "in_progress"]}
        })
        
        if existing_inquiry:
            # Add to conversation
            await db.inquiries.update_one(
                {"id": existing_inquiry["id"]},
                {
                    "$push": {
                        "conversation_history": {
                            "sender": "customer",
                            "message": message_body,
                            "timestamp": datetime.utcnow()
                        }
                    }
                }
            )
        else:
            # Create new inquiry
            inquiry = InquiryCreate(
                company_id="elite-hvac-001",  # Default company
                customer_phone=customer_phone,
                initial_message=message_body
            )
            await create_inquiry(inquiry, None)
    
    return {"status": "processed"}

# ==================== PHASE 2: OWNER INSIGHTS ENDPOINTS ====================

@app.get("/api/owner-insights")
async def get_owner_insights(
    company_id: str = Query(...)
):
    """Get owner dashboard insights with analytics"""
    
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    
    # Today's performance
    today_appointments = await db.appointments.count_documents({
        "company_id": company_id,
        "scheduled_date": {"$gte": today, "$lt": today + timedelta(days=1)}
    })
    
    completed_today = await db.jobs.count_documents({
        "company_id": company_id,
        "status": "completed",
        "completed_at": {"$gte": today}
    })
    
    # Revenue calculation
    today_revenue = 0.0
    completed_jobs_today = await db.jobs.find({
        "company_id": company_id,
        "status": "completed",
        "completed_at": {"$gte": today}
    }).to_list(100)
    
    for job in completed_jobs_today:
        if job.get("actual_cost"):
            today_revenue += job["actual_cost"]
    
    # 7-day trends
    daily_stats = []
    for i in range(7):
        day_start = today - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        
        day_appointments = await db.appointments.count_documents({
            "company_id": company_id,
            "scheduled_date": {"$gte": day_start, "$lt": day_end}
        })
        
        day_completed = await db.jobs.count_documents({
            "company_id": company_id,
            "status": "completed",
            "completed_at": {"$gte": day_start, "$lt": day_end}
        })
        
        day_revenue = 0.0
        day_jobs = await db.jobs.find({
            "company_id": company_id,
            "status": "completed",
            "completed_at": {"$gte": day_start, "$lt": day_end}
        }).to_list(100)
        
        for job in day_jobs:
            if job.get("actual_cost"):
                day_revenue += job["actual_cost"]
        
        daily_stats.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "appointments": day_appointments,
            "completed": day_completed,
            "revenue": day_revenue
        })
    
    # Performance metrics
    week_inquiries = await db.inquiries.count_documents({
        "company_id": company_id,
        "created_at": {"$gte": week_ago}
    })
    
    week_converted = await db.inquiries.count_documents({
        "company_id": company_id,
        "created_at": {"$gte": week_ago},
        "converted_to_appointment": True
    })
    
    conversion_rate = (week_converted / week_inquiries * 100) if week_inquiries > 0 else 0
    
    # Calculate average response time (mock calculation)
    avg_response_time = 15.5  # minutes - mock data
    
    # Technician leaderboard
    technicians = await db.technicians.find({"company_id": company_id}).to_list(100)
    leaderboard = []
    
    for tech in technicians:
        tech_jobs = await db.jobs.count_documents({
            "company_id": company_id,
            "technician_id": tech["id"],
            "status": "completed",
            "completed_at": {"$gte": week_ago}
        })
        
        leaderboard.append({
            "id": tech["id"],
            "name": tech["name"],
            "jobs_completed": tech_jobs,
            "average_rating": tech.get("average_rating", 0.0),
            "total_ratings": tech.get("total_ratings", 0)
        })
    
    # Sort by jobs completed
    leaderboard.sort(key=lambda x: x["jobs_completed"], reverse=True)
    
    return {
        "today_performance": {
            "appointments": today_appointments,
            "completed": completed_today,
            "revenue": today_revenue
        },
        "seven_day_trends": daily_stats[::-1],  # Reverse for chronological order
        "performance_metrics": {
            "avg_response_time": avg_response_time,
            "conversion_rate": conversion_rate
        },
        "technician_leaderboard": leaderboard[:10]  # Top 10
    }

# ==================== PHASE 2: MESSAGING SYSTEM ENDPOINTS ====================

@app.post("/api/messages", response_model=Message)
async def send_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    """Send message in job thread"""
    messaging_service = get_messaging_service(db)
    return await messaging_service.send_message(message)

@app.get("/api/jobs/{job_id}/messages", response_model=List[Message])
async def get_job_messages(job_id: str, current_user: dict = Depends(get_current_user)):
    """Get messages for job thread"""
    messages = await db.messages.find({"job_id": job_id}).sort("created_at", 1).to_list(100)
    return [Message(**msg) for msg in messages]

@app.post("/api/jobs/{job_id}/messages/read")
async def mark_messages_read(job_id: str, current_user: dict = Depends(get_current_user)):
    """Mark messages as read for current user"""
    messaging_service = get_messaging_service(db)
    user_id = current_user.get("sub")
    await messaging_service.mark_messages_read(job_id, user_id)
    return {"message": "Messages marked as read"}

@app.get("/api/message-threads", response_model=List[MessageThread])
async def get_message_threads(
    company_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Get message threads for company"""
    threads = await db.message_threads.find({
        "company_id": company_id,
        "is_active": True
    }).sort("last_message_at", -1).to_list(100)
    return [MessageThread(**thread) for thread in threads]

# ==================== PHASE 2: RATING SYSTEM ENDPOINTS ====================

@app.get("/api/ratings", response_model=List[CustomerRating])
async def get_ratings(
    company_id: str = Query(...),
    technician_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get customer ratings"""
    filters = {"company_id": company_id}
    if technician_id:
        filters["technician_id"] = technician_id
    
    ratings = await db.ratings.find(filters).sort("created_at", -1).to_list(100)
    return [CustomerRating(**rating) for rating in ratings]

@app.post("/api/jobs/{job_id}/request-rating")
async def request_job_rating(job_id: str, current_user: dict = Depends(get_current_user)):
    """Manually request rating for completed job"""
    rating_service = get_rating_service(db)
    success = await rating_service.request_rating(job_id)
    
    if success:
        return {"message": "Rating request sent successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to send rating request")

# ==================== PHASE 2: NOTIFICATION ENDPOINTS ====================

@app.get("/api/notifications", response_model=List[OwnerNotification])
async def get_notifications(
    company_id: str = Query(...),
    unread_only: bool = False,
    current_user: dict = Depends(require_owner_or_admin)
):
    """Get owner notifications"""
    filters = {"company_id": company_id}
    if unread_only:
        filters["is_read"] = False
    
    notifications = await db.notifications.find(filters).sort("created_at", -1).limit(50).to_list(50)
    return [OwnerNotification(**notif) for notif in notifications]

@app.post("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark notification as read"""
    await db.notifications.update_one(
        {"id": notification_id},
        {
            "$set": {
                "is_read": True,
                "read_at": datetime.utcnow()
            }
        }
    )
    return {"message": "Notification marked as read"}

@app.post("/api/notifications/test")
async def test_notifications(
    test_data: dict,
    current_user: dict = Depends(require_owner_or_admin)
):
    """Test notification system"""
    
    notification_service = get_notification_service(db)
    
    test_notification = NotificationCreate(
        company_id=test_data.get("company_id", "elite-hvac-001"),
        owner_id=current_user.get("sub"),
        notification_type="system_alert",
        title="Test Notification",
        message="This is a test notification from your HVAC Assistant system.",
        data={"test": True},
        priority="normal"
    )
    
    await notification_service.send_notification(test_notification)
    
    return {"message": "Test notification sent successfully"}

# ==================== SETTINGS ENDPOINTS ====================

@app.get("/api/settings/{company_id}")
async def get_company_settings(company_id: str):
    """Get comprehensive company settings"""
    
    # Get settings from company document
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Default settings structure
    default_settings = CompanySettings().dict()
    
    # Merge with saved settings
    saved_settings = company.get("settings", {})
    settings = {**default_settings, **saved_settings}
    
    # Add integration status
    settings["integrations"] = {
        "google_calendar": {
            "enabled": bool(os.getenv("GOOGLE_CLIENT_ID", "").startswith("mock_")),
            "status": "mock" if os.getenv("GOOGLE_CLIENT_ID", "").startswith("mock_") else "connected"
        },
        "twilio_sms": {
            "enabled": bool(os.getenv("TWILIO_ACCOUNT_SID", "")),
            "status": "mock" if os.getenv("TWILIO_ACCOUNT_SID", "").startswith("mock_") else "connected"
        },
        "stripe_payments": {
            "enabled": False,
            "status": "not_configured"
        }
    }
    
    return settings

@app.put("/api/settings/{company_id}")
async def update_company_settings(
    company_id: str,
    settings: dict
):
    """Update company settings"""
    
    await db.companies.update_one(
        {"id": company_id},
        {
            "$set": {
                "settings": settings,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Settings updated successfully"}

# ==================== SPECIFIC SETTINGS ENDPOINTS ====================

@app.post("/api/settings/calendar")
async def save_calendar_settings(calendar_settings: dict, current_user: dict = Depends(get_current_user)):
    """Save calendar-specific settings"""
    
    company_id = current_user.get("company_id", "company-001")
    
    await db.companies.update_one(
        {"id": company_id},
        {
            "$set": {
                "settings.calendar": calendar_settings,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return {"message": "Calendar settings saved successfully"}

@app.post("/api/calendar/create")
async def create_calendar_event(event_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a calendar event (mock or real)"""
    
    try:
        calendar_service = get_calendar_service()
        
        # Format event data for Google Calendar
        formatted_event = {
            "summary": event_data.get("title", "HVAC Appointment"),
            "start": {
                "dateTime": event_data.get("start"),
                "timeZone": "America/New_York"
            },
            "end": {
                "dateTime": event_data.get("end"),
                "timeZone": "America/New_York"
            },
            "description": f"Customer: {event_data.get('customerId', 'N/A')}, Technician: {event_data.get('techId', 'N/A')}"
        }
        
        event_id = await calendar_service.create_event(formatted_event)
        
        return {
            "success": True,
            "eventId": event_id,
            "message": "Test event created successfully"
        }
    except Exception as e:
        logger.error(f"Failed to create calendar event: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to create test event"
        }

@app.post("/api/settings/notifications")
async def save_notifications_settings(notifications_settings: dict, current_user: dict = Depends(get_current_user)):
    """Save notifications settings"""
    
    company_id = current_user.get("company_id", "company-001")
    
    await db.companies.update_one(
        {"id": company_id},
        {
            "$set": {
                "settings.notifications": notifications_settings,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return {"message": "Notifications settings saved successfully"}

@app.post("/api/billing/checkout")
async def create_billing_checkout(billing_data: dict, current_user: dict = Depends(get_current_user)):
    """Create billing checkout session (mock or real Stripe)"""
    
    stripe_secret = os.getenv("STRIPE_SECRET_KEY", "")
    
    if stripe_secret and not stripe_secret.startswith("mock_"):
        # Real Stripe integration would go here
        # For now, return mock response
        checkout_url = f"https://checkout.stripe.com/pay/mock_session_{datetime.utcnow().timestamp()}"
    else:
        # Mock checkout
        checkout_url = f"https://mock-billing.com/checkout?plan={billing_data.get('plan', 'pro')}&company_id={current_user.get('company_id')}"
    
    # Save billing info
    company_id = current_user.get("company_id", "company-001")
    await db.companies.update_one(
        {"id": company_id},
        {
            "$set": {
                "settings.billing.plan": billing_data.get("plan", "trial"),
                "settings.billing.last_checkout": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return {
        "checkoutUrl": checkout_url,
        "message": "Checkout session created"
    }

@app.post("/api/settings/service-areas")
async def save_service_areas_settings(service_areas: dict, current_user: dict = Depends(get_current_user)):
    """Save service areas settings"""
    
    company_id = current_user.get("company_id", "company-001")
    
    await db.companies.update_one(
        {"id": company_id},
        {
            "$set": {
                "settings.serviceAreas": service_areas,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return {"message": "Service areas settings saved successfully"}

@app.post("/api/settings/integrations/{provider}")
async def save_integration_settings(provider: str, integration_data: dict, current_user: dict = Depends(get_current_user)):
    """Save integration settings for a specific provider"""
    
    company_id = current_user.get("company_id", "company-001")
    
    # Mock connection status - in real implementation, this would validate the keys
    mock_status = "connected" if integration_data.get("api_key") or integration_data.get("client_id") else "not_configured"
    
    integration_settings = {
        **integration_data,
        "status": mock_status,
        "connected_at": datetime.utcnow() if mock_status == "connected" else None
    }
    
    await db.companies.update_one(
        {"id": company_id},
        {
            "$set": {
                f"settings.integrations.{provider}": integration_settings,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return {
        "message": f"{provider} integration settings saved successfully",
        "status": mock_status
    }

# ==================== PHASE 5 - UNIFIED SETTINGS ENDPOINT ====================

@app.post("/api/settings/update")
async def update_all_settings(settings_data: dict, current_user: dict = Depends(get_current_user)):
    """Unified endpoint to update all settings sections"""
    
    try:
        company_id = current_user.get("company_id", "company-001")
        
        # Structure the update based on the section
        update_operations = {}
        timestamp = datetime.utcnow()
        
        for section, data in settings_data.items():
            if section in ['business', 'ai', 'sms', 'calendar', 'notifications', 'billing', 'service_areas', 'integrations']:
                update_operations[f"settings.{section}"] = data
        
        # Add metadata
        update_operations["updated_at"] = timestamp
        update_operations["settings.last_updated"] = timestamp
        update_operations["settings.updated_by"] = current_user.get("email", "unknown")
        
        # Perform the database update
        result = await db.companies.update_one(
            {"id": company_id},
            {"$set": update_operations},
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Settings updated successfully",
            "updated_sections": list(settings_data.keys()),
            "timestamp": timestamp.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to update settings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Settings update failed: {str(e)}")

@app.get("/api/settings/{company_id}")
async def get_company_settings(company_id: str, current_user: dict = Depends(get_current_user)):
    """Get all company settings (enhanced for Phase 5)"""
    
    try:
        # Mock comprehensive settings data for Phase 5
        mock_settings = {
            "business": {
                "business_name": "Elite HVAC Solutions",
                "business_phone": "+1-555-HVAC-PRO",
                "business_email": "info@hvactech.com",
                "business_address": "123 Business Ave, Tech City, TC 12345",
                "website": "https://elitehvac.com",
                "license_number": "HVAC-LIC-2024-001"
            },
            "ai": {
                "assistant_name": "HVAC Assistant",
                "response_temperature": 0.7,
                "max_tokens": 150,
                "enable_voice_scheduling": True,
                "auto_responses": True,
                "business_hours_only": True
            },
            "sms": {
                "twilio_connected": False,
                "auto_replies": True,
                "business_hours_sms": True,
                "emergency_keywords": ["emergency", "urgent", "no heat", "no ac"],
                "response_templates": {
                    "greeting": "Hello! Thanks for contacting Elite HVAC. How can we help you today?",
                    "after_hours": "We've received your message. Our office hours are Mon-Fri 8AM-6PM. We'll respond first thing tomorrow!",
                    "emergency": "This appears to be an emergency. We're contacting our on-call technician right now."
                }
            },
            "calendar": {
                "google_connected": True,
                "default_calendar": "primary",
                "default_event_duration": 90,
                "auto_create_events": True,
                "timezone": "America/New_York",
                "buffer_time": 15
            },
            "notifications": {
                "job_reminder_sms": True,
                "missed_call_alert": True,
                "daily_summary": False,
                "emergency_escalations": True,
                "owner_email": "owner@hvactech.com",
                "owner_phone": "+1-555-OWNER",
                "notification_hours": "08:00-20:00"
            },
            "billing": {
                "plan": "professional",
                "status": "active",
                "next_billing": "2025-02-20",
                "payment_methods": [
                    {"type": "card", "last4": "4242", "brand": "visa", "primary": True},
                    {"type": "paypal", "email": "billing@hvactech.com", "primary": False}
                ],
                "auto_billing": True,
                "billing_email": "billing@hvactech.com"
            },
            "service_areas": {
                "areas": ["12345", "12346", "Springfield", "Shelbyville", "Capital City"],
                "default_radius": 25,
                "emergency_radius": 50,
                "travel_fee_distance": 20
            },
            "integrations": {
                "twilio": {"status": "connected", "phone": "+1-555-HVAC-PRO"},
                "google_calendar": {"status": "connected", "calendar": "primary"},
                "stripe": {"status": "not_connected"},
                "quickbooks": {"status": "not_connected"},
                "paypal": {"status": "not_connected"},
                "apple_pay": {"status": "not_connected"},
                "venmo": {"status": "not_connected"}
            }
        }
        
        return mock_settings
        
    except Exception as e:
        logger.error(f"Failed to get settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== QUICK ACTIONS ENDPOINTS (PHASE 2) ====================

@app.post("/api/quick/add-customer")
async def quick_add_customer(customer_data: dict, current_user: dict = Depends(get_current_user)):
    """Quick action: Add a new customer"""
    
    try:
        # Mock customer creation with realistic data
        new_customer = {
            "id": f"quick-customer-{datetime.utcnow().timestamp()}",
            "name": customer_data.get("name", "Quick Customer"),
            "phone": customer_data.get("phone", "+1-555-QUICK"),
            "email": customer_data.get("email", "quick@customer.com"),
            "company_id": current_user.get("company_id", "company-001"),
            "created_at": datetime.utcnow(),
            "source": "quick_action"
        }
        
        # In real implementation, would save to database
        # await db.customers.insert_one(new_customer)
        
        return {
            "success": True,
            "message": "Customer added successfully!",
            "customer": new_customer
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to add customer"
        }

@app.post("/api/quick/schedule-job")
async def quick_schedule_job(job_data: dict, current_user: dict = Depends(get_current_user)):
    """Quick action: Schedule a new job"""
    
    try:
        # Mock job scheduling with realistic data
        new_job = {
            "id": f"quick-job-{datetime.utcnow().timestamp()}",
            "title": job_data.get("title", "Quick Service Call"),
            "customer_name": job_data.get("customer_name", "Quick Customer"),
            "service_type": job_data.get("service_type", "maintenance"),
            "scheduled_date": job_data.get("scheduled_date", (datetime.utcnow() + timedelta(days=1)).isoformat()),
            "company_id": current_user.get("company_id", "company-001"),
            "created_at": datetime.utcnow(),
            "status": "scheduled",
            "source": "quick_action"
        }
        
        # In real implementation, would save to database
        # await db.appointments.insert_one(new_job)
        
        return {
            "success": True,
            "message": "Job scheduled successfully!",
            "job": new_job
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to schedule job"
        }

@app.post("/api/quick/create-invoice")
async def quick_create_invoice(invoice_data: dict, current_user: dict = Depends(get_current_user)):
    """Quick action: Create a new invoice"""
    
    try:
        # Mock invoice creation with realistic data
        new_invoice = {
            "id": f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{int(datetime.utcnow().timestamp() % 10000)}",
            "customer_name": invoice_data.get("customer_name", "Quick Customer"),
            "amount": invoice_data.get("amount", 250.00),
            "service_description": invoice_data.get("description", "HVAC Service Call"),
            "company_id": current_user.get("company_id", "company-001"),
            "created_at": datetime.utcnow(),
            "due_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "status": "pending",
            "source": "quick_action"
        }
        
        # In real implementation, would save to database and integrate with billing
        # await db.invoices.insert_one(new_invoice)
        
        return {
            "success": True,
            "message": f"Invoice {new_invoice['id']} created successfully!",
            "invoice": new_invoice
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to create invoice"
        }

@app.post("/api/quick/view-reports")
async def quick_view_reports(report_data: dict, current_user: dict = Depends(get_current_user)):
    """Quick action: Generate quick reports"""
    
    try:
        # Mock report generation with realistic data
        report = {
            "id": f"report-{datetime.utcnow().timestamp()}",
            "type": report_data.get("type", "monthly_summary"),
            "period": report_data.get("period", "last_30_days"),
            "company_id": current_user.get("company_id", "company-001"),
            "generated_at": datetime.utcnow(),
            "summary": {
                "total_jobs": 47,
                "total_revenue": 12750.00,
                "avg_job_value": 271.28,
                "customer_satisfaction": 4.8,
                "technician_utilization": 85
            }
        }
        
        # In real implementation, would generate actual reports from data
        # report_data = await generate_report(report_type, company_id)
        
        return {
            "success": True,
            "message": "Report generated successfully!",
            "report": report,
            "download_url": f"/reports/{report['id']}.pdf"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to generate report"
        }

# ==================== PHASE 4 ENDPOINTS - TECHNICIANS & MESSAGING ====================

@app.get("/api/test-phase4")
async def test_phase4():
    """Test endpoint for PHASE 4"""
    return {"message": "PHASE 4 endpoints are working"}

@app.get("/api/technicians/search")
async def search_technicians(
    q: Optional[str] = None,
    status: Optional[str] = None,
    skill: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Search technicians with filters"""
    
    try:
        company_id = current_user.get("company_id", "company-001")
        
        # Mock technicians data
        all_technicians = [
            {
                "id": "tech-001",
                "name": "Mike Johnson",
                "email": "mike.j@hvactech.com",
                "phone": "+1-555-TECH-01",
                "status": "available",
                "company_id": company_id,
                "skills": ["hvac", "installation", "repair"],
                "rating": 4.8,
                "jobs_completed": 147,
                "years_experience": 8,
                "certifications": ["EPA 608", "NATE Certified"],
                "current_job": None,
                "availability": "09:00-17:00",
                "created_at": "2024-01-15T08:00:00Z"
            },
            {
                "id": "tech-002", 
                "name": "Sarah Davis",
                "email": "sarah.d@hvactech.com",
                "phone": "+1-555-TECH-02",
                "status": "busy",
                "company_id": company_id,
                "skills": ["hvac", "maintenance", "diagnostics"],
                "rating": 4.9,
                "jobs_completed": 203,
                "years_experience": 12,
                "certifications": ["EPA 608", "NATE Certified", "R-410A"],
                "current_job": "appt-002",
                "availability": "08:00-16:00", 
                "created_at": "2024-01-10T09:30:00Z"
            },
            {
                "id": "tech-003",
                "name": "David Wilson",
                "email": "david.w@hvactech.com", 
                "phone": "+1-555-TECH-03",
                "status": "off_duty",
                "company_id": company_id,
                "skills": ["hvac", "electrical", "plumbing"],
                "rating": 4.7,
                "jobs_completed": 89,
                "years_experience": 5,
                "certifications": ["EPA 608", "Electrical License"],
                "current_job": None,
                "availability": "10:00-18:00",
                "created_at": "2024-01-20T10:15:00Z"
            },
            {
                "id": "tech-004",
                "name": "Jennifer Brown",
                "email": "jennifer.b@hvactech.com",
                "phone": "+1-555-TECH-04", 
                "status": "unavailable",
                "company_id": company_id,
                "skills": ["hvac", "commercial", "industrial"],
                "rating": 4.6,
                "jobs_completed": 156,
                "years_experience": 10,
                "certifications": ["EPA 608", "NATE Certified", "Commercial HVAC"],
                "current_job": None,
                "availability": "07:00-15:00",
                "created_at": "2024-01-05T11:45:00Z"
            }
        ]
        
        # Apply filters
        filtered_technicians = all_technicians
        
        if q:
            filtered_technicians = [t for t in filtered_technicians 
                                  if q.lower() in t["name"].lower() or q.lower() in t["email"].lower()]
        if status:
            filtered_technicians = [t for t in filtered_technicians if t["status"] == status]
        if skill:
            filtered_technicians = [t for t in filtered_technicians if skill.lower() in [s.lower() for s in t["skills"]]]
            
        # Apply pagination
        paginated_technicians = filtered_technicians[offset:offset + limit]
        
        return {
            "technicians": paginated_technicians,
            "total": len(filtered_technicians),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to search technicians: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/technicians")
async def add_technician(technician_data: dict, current_user: dict = Depends(get_current_user)):
    """Add a new technician"""
    
    try:
        company_id = current_user.get("company_id", "company-001")
        
        new_technician = {
            "id": f"tech-{datetime.utcnow().timestamp()}",
            "name": technician_data.get("name"),
            "email": technician_data.get("email"),
            "phone": technician_data.get("phone"),
            "status": "available",
            "company_id": company_id,
            "skills": technician_data.get("skills", ["hvac"]),
            "rating": 5.0,
            "jobs_completed": 0,
            "years_experience": technician_data.get("years_experience", 1),
            "certifications": technician_data.get("certifications", []),
            "current_job": None,
            "availability": technician_data.get("availability", "09:00-17:00"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        # In real implementation, would save to database
        # await db.technicians.insert_one(new_technician)
        
        return new_technician
        
    except Exception as e:
        logger.error(f"Failed to add technician: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/messages/search")
async def search_messages(
    q: Optional[str] = None,
    status: Optional[str] = None,
    customer_phone: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Search messages with filters"""
    
    try:
        company_id = current_user.get("company_id", "company-001")
        
        # Mock messages data
        all_messages = [
            {
                "id": "msg-001",
                "customer_phone": "+1-555-123-4567",
                "customer_name": "Jennifer Martinez",
                "status": "active",
                "company_id": company_id,
                "last_message": "Hi, I need help with my heating system. It's not working properly.",
                "last_message_time": "2025-01-24T14:30:00Z",
                "created_at": "2025-01-24T14:30:00Z",
                "message_count": 3,
                "assigned_to": "mike.j@hvactech.com",
                "priority": "normal",
                "tags": ["heating", "repair"]
            },
            {
                "id": "msg-002",
                "customer_phone": "+1-555-987-6543", 
                "customer_name": "Robert Thompson",
                "status": "converted",
                "company_id": company_id,
                "last_message": "Thank you! The technician fixed the issue perfectly.",
                "last_message_time": "2025-01-23T16:45:00Z",
                "created_at": "2025-01-22T10:15:00Z",
                "message_count": 8,
                "assigned_to": "sarah.d@hvactech.com",
                "priority": "high",
                "tags": ["ac", "installation", "completed"]
            },
            {
                "id": "msg-003",
                "customer_phone": "+1-555-456-7890",
                "customer_name": "Lisa Anderson", 
                "status": "pending",
                "company_id": company_id,
                "last_message": "I sent you photos of the unit. Can you take a look?",
                "last_message_time": "2025-01-24T09:20:00Z",
                "created_at": "2025-01-24T09:20:00Z",
                "message_count": 1,
                "assigned_to": None,
                "priority": "normal",
                "tags": ["maintenance", "photos"]
            },
            {
                "id": "msg-004",
                "customer_phone": "+1-555-321-0987",
                "customer_name": "Michael Davis",
                "status": "active",
                "company_id": company_id,
                "last_message": "When can you schedule the maintenance check?",
                "last_message_time": "2025-01-23T11:30:00Z",
                "created_at": "2025-01-23T11:30:00Z",
                "message_count": 5,
                "assigned_to": "david.w@hvactech.com",
                "priority": "low",
                "tags": ["maintenance", "scheduling"]
            }
        ]
        
        # Apply filters
        filtered_messages = all_messages
        
        if q:
            filtered_messages = [m for m in filtered_messages 
                               if q.lower() in m["customer_name"].lower() or 
                                  q.lower() in m["last_message"].lower() or
                                  q.lower() in m["customer_phone"]]
        if status:
            filtered_messages = [m for m in filtered_messages if m["status"] == status]
        if customer_phone:
            filtered_messages = [m for m in filtered_messages if customer_phone in m["customer_phone"]]
            
        # Apply pagination
        paginated_messages = filtered_messages[offset:offset + limit]
        
        return {
            "messages": paginated_messages,
            "total": len(filtered_messages),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to search messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/messages")
async def send_new_message(message_data: dict, current_user: dict = Depends(get_current_user)):
    """Send a new message (behind feature flag)"""
    
    try:
        new_message_enabled = os.getenv("ENABLE_NEW_MESSAGE", "false").lower() == "true"
        if not new_message_enabled:
            raise HTTPException(status_code=403, detail="New message feature not enabled")
            
        company_id = current_user.get("company_id", "company-001")
        
        new_message = {
            "id": f"msg-{datetime.utcnow().timestamp()}",
            "customer_phone": message_data.get("customer_phone"),
            "customer_name": message_data.get("customer_name", "Unknown Customer"),
            "status": "active",
            "company_id": company_id,
            "last_message": message_data.get("message"),
            "last_message_time": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "message_count": 1,
            "assigned_to": current_user.get("email"),
            "priority": message_data.get("priority", "normal"),
            "tags": message_data.get("tags", [])
        }
        
        # In real implementation, would save to database and send via SMS
        # await db.messages.insert_one(new_message)
        # await sms_service.send_message(customer_phone, message)
        
        return new_message
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send new message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PHASE 3 ENDPOINTS - CUSTOMERS & APPOINTMENTS ====================

@app.get("/api/test-phase3")
async def test_phase3_endpoint():
    """Test endpoint to verify PHASE 3 code is loaded"""
    return {"message": "PHASE 3 endpoints are loaded", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/simple-test")
async def simple_test():
    """Simple test endpoint"""
    return {"message": "Simple test works", "customers": [{"name": "Jennifer Martinez", "phone": "+1-555-123-4567"}]}

@app.get("/api/customers/search")
async def search_customers(
    q: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None, 
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Search customers with filters"""
    
    try:
        company_id = current_user.get("company_id", "company-001")
        
        # Mock search results - in real implementation would query database
        all_customers = [
            {
                "id": "customer-001",
                "name": "Jennifer Martinez",
                "phone": "+1-555-123-4567",
                "email": "jennifer@email.com",
                "address": {"full": "123 Main St, Anytown, ST 12345"},
                "company_id": company_id,
                "created_at": "2025-01-20T10:00:00Z",
                "last_service": "2025-01-15T14:30:00Z",
                "total_jobs": 3,
                "status": "active"
            },
            {
                "id": "customer-002", 
                "name": "Robert Thompson",
                "phone": "+1-555-987-6543",
                "email": "robert.t@email.com",
                "address": {"full": "456 Oak Ave, Somewhere, ST 67890"},
                "company_id": company_id,
                "created_at": "2025-01-18T09:15:00Z",
                "last_service": "2025-01-10T16:00:00Z",
                "total_jobs": 5,
                "status": "active"
            },
            {
                "id": "customer-003",
                "name": "Lisa Anderson",
                "phone": "+1-555-456-7890",
                "email": "lisa.anderson@email.com", 
                "address": {"full": "789 Pine Dr, Elsewhere, ST 11111"},
                "company_id": company_id,
                "created_at": "2025-01-16T11:30:00Z",
                "last_service": "2025-01-05T13:45:00Z",
                "total_jobs": 2,
                "status": "active"
            }
        ]
        
        # Apply search filters
        filtered_customers = all_customers
        if q:
            filtered_customers = [c for c in filtered_customers 
                                if q.lower() in c["name"].lower() or q.lower() in c["phone"]]
        if phone:
            filtered_customers = [c for c in filtered_customers if phone in c["phone"]]
        if email:
            filtered_customers = [c for c in filtered_customers if email.lower() in c["email"].lower()]
        
        # Apply pagination
        paginated_customers = filtered_customers[offset:offset + limit]
        
        return {
            "customers": paginated_customers,
            "total": len(filtered_customers),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to search customers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/appointments/calendar")
async def get_appointments_calendar(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    view: Optional[str] = "month",
    current_user: dict = Depends(get_current_user)
):
    """Get appointments in calendar format"""
    
    try:
        company_id = current_user.get("company_id", "company-001")
        
        # Mock calendar appointments data
        calendar_appointments = [
            {
                "id": "appt-001",
                "title": "HVAC Maintenance - Martinez",
                "customer_name": "Jennifer Martinez",
                "customer_id": "customer-001",
                "start": "2025-01-24T09:00:00",
                "end": "2025-01-24T11:00:00", 
                "status": "scheduled",
                "service_type": "maintenance",
                "technician": "Mike Johnson",
                "address": "123 Main St, Anytown, ST 12345",
                "source": "manual"
            },
            {
                "id": "appt-002", 
                "title": "No Heat Service - Thompson",
                "customer_name": "Robert Thompson",
                "customer_id": "customer-002",
                "start": "2025-01-24T14:00:00",
                "end": "2025-01-24T16:00:00",
                "status": "confirmed", 
                "service_type": "no_heat",
                "technician": "Sarah Davis",
                "address": "456 Oak Ave, Somewhere, ST 67890",
                "source": "ai-voice",
                "is_ai_generated": True
            },
            {
                "id": "appt-003",
                "title": "AC Installation - Anderson", 
                "customer_name": "Lisa Anderson",
                "customer_id": "customer-003",
                "start": "2025-01-25T08:00:00",
                "end": "2025-01-25T12:00:00",
                "status": "in_progress",
                "service_type": "installation",
                "technician": "Mike Johnson",
                "address": "789 Pine Dr, Elsewhere, ST 11111",
                "source": "manual"
            },
            {
                "id": "appt-004",
                "title": "System Check - Davis",
                "customer_name": "Michael Davis", 
                "customer_id": "customer-004",
                "start": "2025-01-25T15:00:00",
                "end": "2025-01-25T17:00:00",
                "status": "completed",
                "service_type": "maintenance",
                "technician": "Sarah Davis",
                "address": "321 Elm St, Newtown, ST 22222",
                "source": "manual"
            }
        ]
        
        return {
            "appointments": calendar_appointments,
            "view": view,
            "start_date": start_date,
            "end_date": end_date
        }
        
    except Exception as e:
        logger.error(f"Failed to get calendar appointments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/appointments/filter")
async def filter_appointments(
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    technician: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Filter appointments by status and other criteria"""
    
    try:
        company_id = current_user.get("company_id", "company-001")
        
        # Get all appointments (same as calendar data)
        all_appointments = [
            {
                "id": "appt-001",
                "title": "HVAC Maintenance - Martinez",
                "customer_name": "Jennifer Martinez", 
                "customer_id": "customer-001",
                "scheduled_date": "2025-01-24T09:00:00",
                "status": "scheduled",
                "service_type": "maintenance",
                "technician": "Mike Johnson",
                "address": "123 Main St, Anytown, ST 12345",
                "source": "manual",
                "description": "Regular HVAC system maintenance"
            },
            {
                "id": "appt-002",
                "title": "No Heat Service - Thompson", 
                "customer_name": "Robert Thompson",
                "customer_id": "customer-002", 
                "scheduled_date": "2025-01-24T14:00:00",
                "status": "confirmed",
                "service_type": "no_heat", 
                "technician": "Sarah Davis",
                "address": "456 Oak Ave, Somewhere, ST 67890",
                "source": "ai-voice",
                "is_ai_generated": True,
                "description": "Customer called via AI Voice system reporting no heat issue"
            },
            {
                "id": "appt-003",
                "title": "AC Installation - Anderson",
                "customer_name": "Lisa Anderson",
                "customer_id": "customer-003",
                "scheduled_date": "2025-01-25T08:00:00", 
                "status": "in_progress",
                "service_type": "installation",
                "technician": "Mike Johnson",
                "address": "789 Pine Dr, Elsewhere, ST 11111",
                "source": "manual",
                "description": "New AC unit installation"
            },
            {
                "id": "appt-004",
                "title": "System Check - Davis",
                "customer_name": "Michael Davis",
                "customer_id": "customer-004",
                "scheduled_date": "2025-01-23T15:00:00",
                "status": "completed", 
                "service_type": "maintenance",
                "technician": "Sarah Davis",
                "address": "321 Elm St, Newtown, ST 22222",
                "source": "manual",
                "description": "Completed system maintenance check"
            }
        ]
        
        # Apply status filter
        filtered_appointments = all_appointments
        if status:
            filtered_appointments = [a for a in filtered_appointments if a["status"] == status]
        
        # Apply technician filter
        if technician:
            filtered_appointments = [a for a in filtered_appointments if technician.lower() in a["technician"].lower()]
            
        return {
            "appointments": filtered_appointments,
            "total": len(filtered_appointments),
            "filters": {
                "status": status,
                "date_from": date_from,
                "date_to": date_to,
                "technician": technician
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to filter appointments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/settings/test-sms")
async def test_sms_settings(
    test_data: dict,
    current_user: dict = Depends(require_owner_or_admin)
):
    """Test SMS configuration"""
    
    phone_number = test_data.get("phone_number")
    if not phone_number:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    sms_service = twilio_service
    
    try:
        result = await sms_service.send_sms(
            to=phone_number,
            body="Test message from your HVAC Assistant. SMS integration is working correctly!"
        )
        
        return {
            "success": True,
            "message": "Test SMS sent successfully",
            "sms_id": result.get("sid")
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ==================== ADMIN ANALYTICS ENDPOINTS ====================

@app.get("/api/admin/analytics")
async def get_admin_analytics(current_user: dict = Depends(require_admin)):
    """Get multi-tenant admin analytics"""
    
    # Company overview
    total_companies = await db.companies.count_documents({})
    active_companies = await db.companies.count_documents({"status": "active"})
    
    # Monthly metrics
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    monthly_appointments = await db.appointments.count_documents({
        "created_at": {"$gte": month_start}
    })
    
    monthly_jobs = await db.jobs.count_documents({
        "created_at": {"$gte": month_start}
    })
    
    monthly_inquiries = await db.inquiries.count_documents({
        "created_at": {"$gte": month_start}
    })
    
    # Company performance
    companies = await db.companies.find({}).to_list(100)
    company_stats = []
    
    for company in companies:
        company_appointments = await db.appointments.count_documents({
            "company_id": company["id"],
            "created_at": {"$gte": month_start}
        })
        
        company_revenue = 0.0
        company_jobs = await db.jobs.find({
            "company_id": company["id"],
            "status": "completed",
            "completed_at": {"$gte": month_start}
        }).to_list(100)
        
        for job in company_jobs:
            if job.get("actual_cost"):
                company_revenue += job["actual_cost"]
        
        company_stats.append({
            "id": company["id"],
            "name": company["name"],
            "status": company["status"],
            "appointments": company_appointments,
            "revenue": company_revenue,
            "last_activity": company.get("updated_at", company["created_at"])
        })
    
    return {
        "overview": {
            "total_companies": total_companies,
            "active_companies": active_companies,
            "monthly_appointments": monthly_appointments,
            "monthly_jobs": monthly_jobs,
            "monthly_inquiries": monthly_inquiries
        },
        "companies": company_stats
    }

@app.get("/api/admin/export/{company_id}")
async def export_company_data(company_id: str, current_user: dict = Depends(require_admin)):
    """Export company data (admin only)"""
    
    # Collect all company data
    company = await db.companies.find_one({"id": company_id})
    customers = await db.customers.find({"company_id": company_id}).to_list(1000)
    appointments = await db.appointments.find({"company_id": company_id}).to_list(1000)
    jobs = await db.jobs.find({"company_id": company_id}).to_list(1000)
    technicians = await db.technicians.find({"company_id": company_id}).to_list(100)
    inquiries = await db.inquiries.find({"company_id": company_id}).to_list(1000)
    
    export_data = {
        "company": company,
        "customers": customers,
        "appointments": appointments,
        "jobs": jobs,
        "technicians": technicians,
        "inquiries": inquiries,
        "export_date": datetime.utcnow().isoformat()
    }
    
    return export_data

# ==================== DASHBOARD DATA ENDPOINTS ====================

@app.get("/api/dashboard/{company_id}")
async def get_dashboard_data(company_id: str):
    """Get main dashboard data"""
    
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Quick stats
    total_customers = await db.customers.count_documents({"company_id": company_id})
    pending_jobs = await db.jobs.count_documents({"company_id": company_id, "status": "pending"})
    active_technicians = await db.technicians.count_documents({"company_id": company_id, "is_active": True})
    
    # Today's appointments
    todays_appointments = await db.appointments.find({
        "company_id": company_id,
        "scheduled_date": {"$gte": today, "$lt": today + timedelta(days=1)}
    }).sort("scheduled_date", 1).to_list(10)
    
    # Recent inquiries
    recent_inquiries = await db.inquiries.find({
        "company_id": company_id
    }).sort("created_at", -1).limit(5).to_list(5)
    
    # Urgent jobs
    urgent_jobs = await db.jobs.find({
        "company_id": company_id,
        "priority": {"$in": ["high", "emergency"]},
        "status": {"$ne": "completed"}
    }).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "stats": {
            "total_customers": total_customers,
            "pending_jobs": pending_jobs,
            "active_technicians": active_technicians,
            "todays_appointments": len(todays_appointments)
        },
        "todays_appointments": [Appointment(**appt).dict() for appt in todays_appointments],
        "recent_inquiries": [Inquiry(**inq).dict() for inq in recent_inquiries],
        "urgent_jobs": [Job(**job).dict() for job in urgent_jobs]
    }

    # Add duplicate endpoints at root level for production compatibility
    
@app.get("/dashboard/{company_id}")
async def get_dashboard_data_root(company_id: str):
    """Get main dashboard data - root level"""
    return await get_dashboard_data(company_id)

@app.get("/owner-insights")
async def get_owner_insights_root(company_id: str = Query(...)):
    """Get owner insights - root level"""
    return await get_owner_insights(company_id)

@app.get("/settings/{company_id}")
async def get_company_settings_root(company_id: str):
    """Get company settings - root level"""
    return await get_company_settings(company_id)

# ==================== HEALTH CHECK ENDPOINTS ====================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    
    try:
        # Test database connection
        await db.companies.count_documents({})
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_status,
            "sms": "mock",
            "calendar": "mock",
            "llm": "mock"
        }
    }

@app.get("/api/")
async def root():
    """API root endpoint"""
    return {
        "message": "HVAC Assistant API v2.0",
        "status": "operational",
        "documentation": "/docs"
    }

# Add root level endpoints for production compatibility
@app.get("/")
async def root_health():
    """Root health check"""
    return {"status": "healthy", "message": "HVAC Assistant API is running"}

@app.get("/health")
async def health_check_root():
    """Health check at root level"""
    try:
        # Test database connection
        await db.companies.count_documents({})
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_status,
            "sms": "mock",
            "calendar": "mock",
            "llm": "mock"
        }
    }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("HVAC Assistant API v2.0 started successfully")
    logger.info(f"MongoDB connected: {mongo_url}")
    logger.info("Mock services initialized for development")

# Shutdown event  
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    client.close()
    logger.info("HVAC Assistant API shutdown complete")