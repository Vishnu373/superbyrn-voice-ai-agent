import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from livekit import api
from dotenv import load_dotenv

from database.db_client import (
    get_all_appointments, get_user_appointments, book_appointment,
    cancel_appointment, modify_appointment, get_available_slots,
    get_user_by_phone, get_or_create_user, get_call_summaries_by_phone,
    get_all_summaries, get_db
)
from database.models import Appointment, Slot, User, CallSummary

load_dotenv()

app = FastAPI(title="SuperByrn Voice AI Agent API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class BookAppointmentRequest(BaseModel):
    slot_id: str
    phone: str
    patient_name: str
    notes: Optional[str] = None

class ModifyAppointmentRequest(BaseModel):
    new_slot_id: str

class CreateUserRequest(BaseModel):
    phone: str
    name: Optional[str] = None

class LiveKitTokenRequest(BaseModel):
    phone: str

class SlotResponse(BaseModel):
    id: str
    day_of_week: str
    start_time: str
    end_time: str
    is_available: bool

    class Config:
        from_attributes = True

class AppointmentResponse(BaseModel):
    id: str
    user_phone: Optional[str]
    slot_id: str
    patient_name: str
    patient_phone: Optional[str]
    status: str
    notes: Optional[str]
    booked_at: datetime
    updated_at: datetime
    slot: Optional[SlotResponse] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    phone_number: str
    name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class CallSummaryResponse(BaseModel):
    id: str
    patient_phone: Optional[str]
    summary_text: Optional[str]
    call_duration_seconds: Optional[int] = None
    total_cost: Optional[float] = None
    cost_breakdown: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

@app.get("/")
async def root():
    return {"message": "SuperByrn Voice AI Agent API", "version": "1.0.0"}

# 1. Appointment Endpoints
"""
Get all appointments (admin)
Returns list of all appointments in the system
"""
@app.get("/v1/appointments")
async def list_all_appointments():
    appointments = get_all_appointments(include_cancelled=True)
    if not appointments:
        return []
    
    db = get_db()
    try:
        result = []
        for appt in appointments:
            # Get slot info
            slot = db.query(Slot).filter(Slot.id == appt.slot_id).first()
            slot_data = None
            if slot:
                slot_data = {
                    "id": str(slot.id),
                    "day_of_week": slot.day_of_week,
                    "start_time": slot.start_time.strftime("%I:%M %p") if slot.start_time else "",
                    "end_time": slot.end_time.strftime("%I:%M %p") if slot.end_time else "",
                    "is_available": slot.is_available
                }
            
            result.append({
                "id": str(appt.id),
                "user_phone": appt.user_phone,
                "slot_id": str(appt.slot_id),
                "patient_name": appt.patient_name,
                "patient_phone": appt.patient_phone,
                "status": appt.status,
                "notes": appt.notes,
                "booked_at": appt.booked_at,
                "updated_at": appt.updated_at,
                "slot": slot_data
            })
        return result
    finally:
        db.close()


"""
Get appointments by phone number (user)
Returns appointments for a specific user
"""
@app.get("/v1/appointments/{phone}", response_model=List[AppointmentResponse])
async def get_appointments_by_phone(phone: str):
    appointments = get_user_appointments(phone, include_cancelled=True)
    if not appointments:
        raise HTTPException(status_code=404, detail="No appointments found for this user")
    
    return [AppointmentResponse(
        id=str(appt.id),
        user_phone=appt.user_phone,
        slot_id=str(appt.slot_id),
        patient_name=appt.patient_name,
        patient_phone=appt.patient_phone,
        status=appt.status,
        notes=appt.notes,
        booked_at=appt.booked_at,
        updated_at=appt.updated_at
    ) for appt in appointments]


"""
Book a new appointment
Creates appointment and marks slot as unavailable
"""
@app.post("/v1/appointments", response_model=AppointmentResponse)
async def create_appointment(request: BookAppointmentRequest):
    appointment = book_appointment(
        slot_id=request.slot_id,
        user_phone=request.phone,
        patient_name=request.patient_name,
        notes=request.notes
    )

    if not appointment:
        raise HTTPException(status_code=400, detail="Slot not available")
    
    return AppointmentResponse(
        id=str(appointment.id),
        user_phone=appointment.user_phone,
        slot_id=str(appointment.slot_id),
        patient_name=appointment.patient_name,
        patient_phone=appointment.patient_phone,
        status=appointment.status,
        notes=appointment.notes,
        booked_at=appointment.booked_at,
        updated_at=appointment.updated_at
    )


"""
Cancel an appointment
Marks appointment as cancelled and frees up the slot
"""
@app.post("/v1/appointments/{appointment_id}/cancel")
async def cancel_appointment_endpoint(appointment_id: str):
    success = cancel_appointment(appointment_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    return {"message": "Appointment cancelled successfully"}


"""
Modify an appointment to a different slot
Frees old slot and books new slot
"""
@app.put("/v1/appointments/{appointment_id}", response_model=AppointmentResponse)
async def modify_appointment_endpoint(appointment_id: str, request: ModifyAppointmentRequest):
    appointment = modify_appointment(appointment_id, request.new_slot_id)
    
    if not appointment:
        raise HTTPException(status_code=400, detail="Could not modify appointment. New slot may be unavailable.")
    
    return AppointmentResponse(
        id=str(appointment.id),
        user_phone=appointment.user_phone,
        slot_id=str(appointment.slot_id),
        patient_name=appointment.patient_name,
        status=appointment.status,
        notes=appointment.notes,
        booked_at=appointment.booked_at,
        updated_at=appointment.updated_at
    )


# 2. Slot Endpoints
"""
Get all slots with availability status
Returns all slots in the system
"""
@app.get("/v1/slots", response_model=List[SlotResponse])
async def list_all_slots():
    db = get_db()
    
    try:
        slots = db.query(Slot).all()
        
        return [SlotResponse(
            id=str(slot.id),
            day_of_week=slot.day_of_week,
            start_time=slot.start_time.strftime("%H:%M"),
            end_time=slot.end_time.strftime("%H:%M"),
            is_available=slot.is_available
        ) for slot in slots]
    
    finally:
        db.close()


"""
Get only available slots
Returns slots where is_available = True
"""
@app.get("/v1/slots/available", response_model=List[SlotResponse])
async def list_available_slots():
    slots = get_available_slots()
    
    return [SlotResponse(
        id=str(slot.id),
        day_of_week=slot.day_of_week,
        start_time=slot.start_time.strftime("%H:%M"),
        end_time=slot.end_time.strftime("%H:%M"),
        is_available=slot.is_available
    ) for slot in slots]


# 3. User Endpoints
"""
Get user by phone number
Returns user information
"""
@app.get("/v1/users/{phone}", response_model=UserResponse)
async def get_user(phone: str):
    user = get_user_by_phone(phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        phone_number=user.phone_number,
        name=user.name,
        created_at=user.created_at
    )


"""
Create or get user
Creates new user if doesn't exist, otherwise returns existing
"""
@app.post("/v1/users", response_model=UserResponse)
async def create_or_get_user(request: CreateUserRequest):
    user = get_or_create_user(phone=request.phone, name=request.name)
    
    return UserResponse(
        phone_number=user.phone_number,
        name=user.name,
        created_at=user.created_at
    )


# 4. Call Summary Endpoints
"""
Get all call summaries (admin)
Returns all call summaries in the system
"""
@app.get("/v1/summaries", response_model=List[CallSummaryResponse])
async def list_all_summaries():
    db = get_db()
    try:
        summaries = db.query(CallSummary).all()
        
        return [CallSummaryResponse(
            id=str(summary.id),
            patient_phone=summary.patient_phone,
            summary_text=summary.summary_text,
            created_at=summary.created_at
        ) for summary in summaries]
    
    finally:
        db.close()


"""
Get call summaries by phone number
Returns summaries for a specific user
"""
@app.get("/v1/summaries/{phone}", response_model=List[CallSummaryResponse])
async def get_summaries_by_phone(phone: str):
    summaries = get_call_summaries_by_phone(phone)
    
    return [CallSummaryResponse(
        id=str(summary.id),
        patient_phone=summary.patient_phone,
        summary_text=summary.summary_text,
        call_duration_seconds=summary.call_duration_seconds,
        total_cost=summary.total_cost,
        cost_breakdown=summary.cost_breakdown,
        created_at=summary.created_at
    ) for summary in summaries]


# 5. Billing Endpoints
"""
Get billing summary for all calls (admin)
Returns total cost and all call summaries
"""
@app.get("/v1/billing")
async def get_all_billing():
    summaries = get_all_summaries()
    total_cost = sum(float(s.total_cost or 0) for s in summaries)
    total_calls = len(summaries)
    
    return {
        "total_cost": round(total_cost, 4),
        "total_calls": total_calls,
        "summaries": [
            {
                "phone": s.patient_phone,
                "duration_seconds": s.call_duration_seconds,
                "total_cost": float(s.total_cost or 0),
                "cost_breakdown": s.cost_breakdown,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in summaries
        ]
    }


"""
Get billing for specific user
Returns total cost and call summaries for one user
"""
@app.get("/v1/billing/{phone}")
async def get_user_billing(phone: str):
    summaries = get_call_summaries_by_phone(phone)
    total_cost = sum(float(s.total_cost or 0) for s in summaries)
    
    return {
        "phone": phone,
        "total_cost": round(total_cost, 4),
        "total_calls": len(summaries),
        "summaries": [
            {
                "duration_seconds": s.call_duration_seconds,
                "total_cost": float(s.total_cost or 0),
                "cost_breakdown": s.cost_breakdown,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in summaries
        ]
    }


# 6. LiveKit Endpoints
"""
Generate LiveKit room token
Creates access token for frontend to join LiveKit room
"""
@app.post("/v1/livekit/token")
async def generate_livekit_token(request: LiveKitTokenRequest):
    livekit_url = os.getenv("LIVEKIT_URL")
    livekit_api_key = os.getenv("LIVEKIT_API_KEY")
    livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not all([livekit_url, livekit_api_key, livekit_api_secret]):
        raise HTTPException(status_code=500, detail="LiveKit credentials not configured")
    
    # Use phone as both identity and room name
    room_name = f"appointment_{request.phone}"
    
    token = api.AccessToken(livekit_api_key, livekit_api_secret)
    token.with_identity(request.phone)
    token.with_name(request.phone)
    token.with_grants(api.VideoGrants(
        room_join=True,
        room_create=True,
        room=room_name,
        agent=True,
    ))
    
    return {
        "token": token.to_jwt(),
        "url": livekit_url,
        "room": room_name
    }

