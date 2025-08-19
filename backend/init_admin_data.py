"""
HVAC Assistant - Database Initialization Script
Creates sample data for development and testing
"""

import asyncio
import os
from datetime import datetime, timedelta
import random
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'hvac_assistant')]

# Sample data generators
COMPANY_NAMES = [
    "Elite HVAC Solutions",
    "Comfort Pro HVAC", 
    "Premium Climate Control"
]

CUSTOMER_NAMES = [
    "John Smith", "Sarah Johnson", "Mike Davis", "Lisa Wilson", "David Brown",
    "Jennifer Taylor", "Robert Miller", "Amanda Garcia", "Chris Anderson", "Emily White",
    "Mark Thompson", "Jessica Martinez", "Kevin Lee", "Rachel Green", "Tom Harris"
]

TECHNICIAN_NAMES = [
    "Alex Rodriguez", "Brian Campbell", "Carlos Sanchez", "Diana Foster", 
    "Eric Thompson", "Fiona Kelly", "George Watson", "Helen Chang"
]

SERVICE_TYPES = [
    "AC Repair", "Heating Repair", "HVAC Installation", "Duct Cleaning",
    "Thermostat Installation", "Air Filter Replacement", "System Maintenance",
    "Emergency Repair", "Heat Pump Service", "Refrigerant Leak Repair"
]

ADDRESSES = [
    {"street": "123 Oak Street", "city": "Springfield", "state": "IL", "zip": "62701"},
    {"street": "456 Maple Ave", "city": "Riverside", "state": "IL", "zip": "60546"},
    {"street": "789 Pine Road", "city": "Arlington", "state": "IL", "zip": "60004"},
    {"street": "321 Elm Drive", "city": "Naperville", "state": "IL", "zip": "60540"},
    {"street": "654 Cedar Lane", "city": "Wheaton", "state": "IL", "zip": "60187"}
]

async def clear_existing_data():
    """Clear existing data from all collections"""
    collections = [
        'companies', 'customers', 'technicians', 'appointments', 'jobs', 
        'invoices', 'inquiries', 'messages', 'ratings', 'notifications'
    ]
    
    for collection_name in collections:
        await db[collection_name].delete_many({})
    
    print("✅ Cleared existing data")

async def create_companies():
    """Create sample companies"""
    companies = []
    
    for i, name in enumerate(COMPANY_NAMES):
        company = {
            "id": f"company-{i+1:03d}",
            "name": name,
            "email": f"info@{name.lower().replace(' ', '').replace('hvac', 'hvac')}.com",
            "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
            "address": random.choice(ADDRESSES),
            "status": ["active", "trial", "expired"][i % 3],
            "subscription_end": datetime.utcnow() + timedelta(days=random.randint(30, 365)),
            "created_at": datetime.utcnow() - timedelta(days=random.randint(30, 365)),
            "updated_at": datetime.utcnow(),
            "settings": {},
            "business_hours": {
                "monday": "8:00 AM - 6:00 PM",
                "tuesday": "8:00 AM - 6:00 PM", 
                "wednesday": "8:00 AM - 6:00 PM",
                "thursday": "8:00 AM - 6:00 PM",
                "friday": "8:00 AM - 6:00 PM",
                "saturday": "9:00 AM - 4:00 PM",
                "sunday": "Closed"
            },
            "service_areas": ["Springfield", "Riverside", "Arlington", "Naperville", "Wheaton"]
        }
        companies.append(company)
    
    await db.companies.insert_many(companies)
    print(f"✅ Created {len(companies)} companies")
    return companies

async def create_technicians(companies):
    """Create sample technicians"""
    technicians = []
    
    for i, company in enumerate(companies):
        # 2-3 technicians per company
        for j in range(random.randint(2, 3)):
            tech_name = random.choice(TECHNICIAN_NAMES)
            technician = {
                "id": f"tech-{company['id']}-{j+1:02d}",
                "company_id": company["id"],
                "name": tech_name,
                "email": f"{tech_name.lower().replace(' ', '.')}@{company['name'].lower().replace(' ', '').replace('hvac', 'hvac')}.com",
                "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                "specialties": random.sample(["HVAC Repair", "Installation", "Maintenance", "Emergency Service"], k=random.randint(1, 3)),
                "certifications": random.sample(["EPA Certified", "NATE Certified", "OSHA Certified"], k=random.randint(1, 2)),
                "hourly_rate": random.uniform(25.0, 45.0),
                "is_active": True,
                "average_rating": round(random.uniform(3.5, 5.0), 2),
                "total_ratings": random.randint(5, 50),
                "total_jobs_completed": random.randint(20, 200),
                "created_at": datetime.utcnow() - timedelta(days=random.randint(30, 200)),
                "updated_at": datetime.utcnow()
            }
            technicians.append(technician)
    
    await db.technicians.insert_many(technicians)
    print(f"✅ Created {len(technicians)} technicians")
    return technicians

async def create_customers(companies):
    """Create sample customers"""
    customers = []
    
    for company in companies:
        # 15 customers per company
        for i in range(15):
            customer_name = random.choice(CUSTOMER_NAMES)
            customer = {
                "id": f"customer-{company['id']}-{i+1:03d}",
                "company_id": company["id"],
                "name": customer_name,
                "email": f"{customer_name.lower().replace(' ', '.')}@gmail.com" if random.choice([True, False]) else None,
                "phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                "address": random.choice(ADDRESSES),
                "preferred_contact": random.choice(["phone", "email"]),
                "notes": random.choice(["Regular customer", "Prefers morning appointments", "Has multiple properties", ""]),
                "total_jobs": random.randint(1, 10),
                "total_spent": round(random.uniform(200, 5000), 2),
                "last_service": datetime.utcnow() - timedelta(days=random.randint(1, 365)),
                "tags": random.sample(["VIP", "Commercial", "Residential", "Maintenance Plan"], k=random.randint(0, 2)),
                "created_at": datetime.utcnow() - timedelta(days=random.randint(30, 365)),
                "updated_at": datetime.utcnow()
            }
            customers.append(customer)
    
    await db.customers.insert_many(customers)
    print(f"✅ Created {len(customers)} customers")
    return customers

async def create_appointments(companies, customers, technicians):
    """Create sample appointments"""
    appointments = []
    
    # Group technicians by company
    techs_by_company = {}
    for tech in technicians:
        if tech["company_id"] not in techs_by_company:
            techs_by_company[tech["company_id"]] = []
        techs_by_company[tech["company_id"]].append(tech)
    
    for company in companies:
        company_customers = [c for c in customers if c["company_id"] == company["id"]]
        company_techs = techs_by_company.get(company["id"], [])
        
        # 12 appointments per company
        for i in range(12):
            customer = random.choice(company_customers)
            technician = random.choice(company_techs) if company_techs else None
            service_type = random.choice(SERVICE_TYPES)
            
            # Mix of past, current, and future appointments
            if i < 4:
                # Past appointments
                scheduled_date = datetime.utcnow() - timedelta(days=random.randint(1, 30))
                status = "completed"
            elif i < 8:
                # Current/recent appointments
                scheduled_date = datetime.utcnow() + timedelta(days=random.randint(-2, 2))
                status = random.choice(["scheduled", "confirmed", "in_progress"])
            else:
                # Future appointments
                scheduled_date = datetime.utcnow() + timedelta(days=random.randint(1, 30))
                status = "scheduled"
            
            appointment = {
                "id": f"appt-{company['id']}-{i+1:03d}",
                "company_id": company["id"],
                "customer_id": customer["id"],
                "technician_id": technician["id"] if technician else None,
                "title": f"{service_type} - {customer['name']}",
                "description": f"{service_type} service for {customer['name']} at {customer['address']['street']}",
                "scheduled_date": scheduled_date,
                "estimated_duration": random.choice([60, 90, 120]),
                "status": status,
                "service_type": service_type,
                "priority": random.choice(["low", "medium", "high"]),
                "estimated_cost": round(random.uniform(150, 800), 2),
                "notes": random.choice(["", "Customer prefers morning", "Urgent repair needed"]),
                "created_at": scheduled_date - timedelta(days=random.randint(1, 7)),
                "updated_at": datetime.utcnow()
            }
            appointments.append(appointment)
    
    await db.appointments.insert_many(appointments)
    print(f"✅ Created {len(appointments)} appointments")
    return appointments

async def create_jobs(companies, customers, technicians, appointments):
    """Create sample jobs"""
    jobs = []
    
    for company in companies:
        company_customers = [c for c in customers if c["company_id"] == company["id"]]
        company_techs = [t for t in technicians if t["company_id"] == company["id"]]
        company_appointments = [a for a in appointments if a["company_id"] == company["id"]]
        
        # Create jobs for completed appointments
        completed_appointments = [a for a in company_appointments if a["status"] == "completed"]
        
        for appt in completed_appointments:
            customer = next(c for c in company_customers if c["id"] == appt["customer_id"])
            technician = next((t for t in company_techs if t["id"] == appt["technician_id"]), None)
            
            actual_cost = appt["estimated_cost"] * random.uniform(0.8, 1.2)
            
            job = {
                "id": f"job-{appt['id']}",
                "company_id": company["id"],
                "appointment_id": appt["id"],
                "customer_id": customer["id"],
                "technician_id": technician["id"] if technician else None,
                "title": appt["title"],
                "description": appt["description"],
                "status": "completed",
                "priority": appt["priority"],
                "scheduled_date": appt["scheduled_date"],
                "started_at": appt["scheduled_date"],
                "completed_at": appt["scheduled_date"] + timedelta(hours=random.randint(1, 4)),
                "estimated_cost": appt["estimated_cost"],
                "actual_cost": round(actual_cost, 2),
                "parts_used": [
                    {"name": "Air Filter", "quantity": 1, "cost": 25.00},
                    {"name": "Refrigerant", "quantity": 2, "cost": 45.00}
                ] if random.choice([True, False]) else [],
                "labor_hours": round(random.uniform(1.0, 4.0), 1),
                "notes": f"Completed {appt['service_type']} successfully. Customer satisfied with service.",
                "created_at": appt["created_at"],
                "updated_at": datetime.utcnow()
            }
            jobs.append(job)
    
    await db.jobs.insert_many(jobs)
    print(f"✅ Created {len(jobs)} jobs")
    return jobs

async def create_inquiries(companies):
    """Create sample SMS inquiries"""
    inquiries = []
    
    inquiry_messages = [
        "My AC is not cooling properly. Can someone come take a look?",
        "Emergency! Heater stopped working and it's freezing!",
        "Need to schedule maintenance for my HVAC system",
        "What are your rates for AC installation?",
        "Strange noise coming from my heating unit",
        "Can you fix a thermostat issue today?",
        "My air conditioner is leaking water",
        "Need quote for new HVAC system installation"
    ]
    
    ai_responses = [
        "Hi! I'm Sarah from Elite HVAC Solutions. I can help you with that AC issue. Let me connect you with one of our technicians.",
        "I understand this is urgent! Our emergency technician will contact you within 30 minutes.",
        "I'd be happy to schedule your maintenance. What day works best for you?",
        "I'll have one of our installation specialists provide you with a detailed quote. Can you tell me about your property?",
        "Strange noises can indicate various issues. Let me schedule an inspection for you.",
        "Yes, we can help with thermostat issues today. What seems to be the problem?",
        "Water leaks need immediate attention. I'm scheduling an urgent service call for you.",
        "I'll connect you with our installation team for a free quote. What type of system are you looking for?"
    ]
    
    for company in companies:
        # 25 inquiries per company
        for i in range(25):
            initial_message = random.choice(inquiry_messages)
            ai_response = random.choice(ai_responses)
            
            inquiry = {
                "id": f"inquiry-{company['id']}-{i+1:03d}",
                "company_id": company["id"],
                "customer_phone": f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                "customer_name": random.choice(CUSTOMER_NAMES) if random.choice([True, False]) else None,
                "status": random.choice(["new", "in_progress", "converted", "closed"]),
                "initial_message": initial_message,
                "ai_response": ai_response,
                "conversation_history": [
                    {
                        "sender": "customer",
                        "message": initial_message,
                        "timestamp": datetime.utcnow() - timedelta(minutes=random.randint(1, 1440))
                    },
                    {
                        "sender": "ai",
                        "message": ai_response,
                        "timestamp": datetime.utcnow() - timedelta(minutes=random.randint(1, 1440))
                    }
                ],
                "estimated_value": round(random.uniform(200, 1500), 2) if random.choice([True, False]) else None,
                "service_type": random.choice(SERVICE_TYPES) if random.choice([True, False]) else None,
                "urgency": random.choice(["low", "medium", "high", "emergency"]),
                "converted_to_appointment": random.choice([True, False]),
                "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                "updated_at": datetime.utcnow()
            }
            inquiries.append(inquiry)
    
    await db.inquiries.insert_many(inquiries)
    print(f"✅ Created {len(inquiries)} inquiries")
    return inquiries

async def create_invoices(companies, customers, jobs):
    """Create sample invoices"""
    invoices = []
    
    for company in companies:
        company_jobs = [j for j in jobs if j["company_id"] == company["id"]]
        
        # Create invoices for some completed jobs
        for i, job in enumerate(company_jobs[:4]):  # 4 invoices per company
            customer = next(c for c in customers if c["id"] == job["customer_id"])
            
            # Create invoice items
            items = [
                {
                    "description": f"Labor - {job.get('title', 'HVAC Service')}",
                    "quantity": job.get("labor_hours", 2.0),
                    "unit_price": 75.0,
                    "total": job.get("labor_hours", 2.0) * 75.0
                }
            ]
            
            # Add parts if used
            for part in job.get("parts_used", []):
                items.append({
                    "description": f"Parts - {part['name']}",
                    "quantity": part["quantity"],
                    "unit_price": part["cost"],
                    "total": part["quantity"] * part["cost"]
                })
            
            subtotal = sum(item["total"] for item in items)
            tax_rate = 0.0875
            tax_amount = subtotal * tax_rate
            total_amount = subtotal + tax_amount
            
            invoice = {
                "id": f"invoice-{company['id']}-{i+1:03d}",
                "company_id": company["id"],
                "customer_id": customer["id"],
                "job_id": job["id"],
                "invoice_number": f"INV-{datetime.now().year}-{(i+1):04d}",
                "items": items,
                "subtotal": round(subtotal, 2),
                "tax_rate": tax_rate,
                "tax_amount": round(tax_amount, 2),
                "total_amount": round(total_amount, 2),
                "status": random.choice(["paid", "sent", "overdue"]),
                "due_date": datetime.utcnow() + timedelta(days=30),
                "paid_date": datetime.utcnow() - timedelta(days=random.randint(1, 15)) if random.choice([True, False]) else None,
                "payment_method": random.choice(["cash", "check", "card"]) if random.choice([True, False]) else None,
                "notes": "Thank you for your business!",
                "created_at": job["completed_at"] + timedelta(hours=1),
                "updated_at": datetime.utcnow()
            }
            invoices.append(invoice)
    
    await db.invoices.insert_many(invoices)
    print(f"✅ Created {len(invoices)} invoices")
    return invoices

async def create_sample_ratings(companies, jobs, customers, technicians):
    """Create sample customer ratings"""
    ratings = []
    
    for company in companies:
        company_jobs = [j for j in jobs if j["company_id"] == company["id"] and j["status"] == "completed"]
        
        # Create ratings for most completed jobs
        for job in company_jobs[:8]:  # Limit to prevent too many
            customer = next(c for c in customers if c["id"] == job["customer_id"])
            technician = next((t for t in technicians if t["id"] == job.get("technician_id")), None)
            
            if technician:
                rating_value = random.choices([1, 2, 3, 4, 5], weights=[2, 3, 10, 25, 60])[0]  # Weighted towards higher ratings
                
                feedback_options = {
                    5: ["Excellent service!", "Very professional and quick", "Highly recommend"],
                    4: ["Good job, satisfied with work", "Professional service", "Would use again"],
                    3: ["Decent service", "Job was completed", "Average experience"],
                    2: ["Could be better", "Some issues with service", "Not entirely satisfied"],
                    1: ["Poor service", "Had problems", "Would not recommend"]
                }
                
                rating = {
                    "id": f"rating-{job['id']}",
                    "company_id": company["id"],
                    "job_id": job["id"],
                    "customer_id": customer["id"],
                    "technician_id": technician["id"],
                    "rating": rating_value,
                    "feedback": random.choice(feedback_options[rating_value]) if random.choice([True, False]) else None,
                    "rating_date": job["completed_at"] + timedelta(hours=random.randint(2, 24)),
                    "sms_request_sent": True,
                    "sms_request_sent_at": job["completed_at"] + timedelta(minutes=30),
                    "response_received_at": job["completed_at"] + timedelta(hours=random.randint(1, 12)),
                    "follow_up_required": rating_value <= 3,
                    "created_at": job["completed_at"] + timedelta(hours=random.randint(2, 24)),
                    "updated_at": datetime.utcnow()
                }
                ratings.append(rating)
    
    await db.ratings.insert_many(ratings)
    print(f"✅ Created {len(ratings)} customer ratings")
    return ratings

async def main():
    """Initialize all sample data"""
    print("🚀 Starting HVAC Assistant database initialization...")
    print(f"📁 Database: {os.environ.get('DB_NAME', 'hvac_assistant')}")
    print(f"🔗 MongoDB: {mongo_url}")
    
    try:
        # Clear existing data
        await clear_existing_data()
        
        # Create core entities
        companies = await create_companies()
        technicians = await create_technicians(companies)
        customers = await create_customers(companies)
        
        # Create business operations
        appointments = await create_appointments(companies, customers, technicians)
        jobs = await create_jobs(companies, customers, technicians, appointments)
        invoices = await create_invoices(companies, customers, jobs)
        inquiries = await create_inquiries(companies)
        
        # Create Phase 2 features
        ratings = await create_sample_ratings(companies, jobs, customers, technicians)
        
        print("\n🎉 Database initialization completed successfully!")
        print("\n📊 Summary:")
        print(f"   • {len(companies)} companies created")
        print(f"   • {len(customers)} customers created")
        print(f"   • {len(technicians)} technicians created")
        print(f"   • {len(appointments)} appointments created")
        print(f"   • {len(jobs)} jobs created")
        print(f"   • {len(invoices)} invoices created")
        print(f"   • {len(inquiries)} inquiries created")
        print(f"   • {len(ratings)} ratings created")
        
        print(f"\n🏢 Sample Companies:")
        for company in companies:
            print(f"   • {company['name']} ({company['status']}) - ID: {company['id']}")
        
        print(f"\n🔑 Admin Login:")
        print(f"   • Email: {os.getenv('ADMIN_EMAIL', 'admin@hvactech.com')}")
        print(f"   • Password: {os.getenv('ADMIN_PASSWORD', 'HvacAdmin2024!')}")
        
    except Exception as e:
        print(f"❌ Error during initialization: {str(e)}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())