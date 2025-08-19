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