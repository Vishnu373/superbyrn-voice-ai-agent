import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv
from .models import User, Slot, Appointment, CallSummary

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    logger.info("DATABASE_URL found, initializing database connection...")
    try:
        engine = create_engine(
            DATABASE_URL,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=300,  
        )
        SessionLocal = sessionmaker(bind=engine)
        logger.info("Database engine created successfully")
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        engine = None
        SessionLocal = None
else:
    logger.warning("DATABASE_URL not found in environment variables!")
    engine = None
    SessionLocal = None

def get_db() -> Session:
    if SessionLocal is None:
        raise ValueError("Database config not found. Please set DATABASE_URL environment variable.")
    return SessionLocal()

# CRUD -> reading a user -> for admin
def get_user_by_phone(phone: str) -> Optional[User]:
    db = get_db()
    try:
        return db.query(User).filter(User.phone_number == phone).first()
    finally:
        db.close()

# CRUD -> creating a new user or getting an existing user
def get_or_create_user(phone: str, name: str = None) -> User:
    user = get_user_by_phone(phone)
    if not user:
        db = get_db()
        try:
            user = User(phone_number=phone, name=name or "Unknown")
            db.add(user)
            db.commit()
            db.refresh(user)
        finally:
            db.close()
    return user

# CRUD -> reading available slots -> for user
def get_available_slots() -> List[Slot]:
    db = get_db()
    try:
        return db.query(Slot).filter(Slot.is_available == True).all()
    finally:
        db.close()

# CRUD -> reading a slot -> for admin
def get_slot_by_id(slot_id: str) -> Optional[Slot]:
    db = get_db()
    try:
        return db.query(Slot).filter(Slot.id == slot_id).first()
    finally:
        db.close()


# CRUD -> updating a slot -> avoid duplicate booking
def mark_slot_unavailable(slot_id: str) -> bool:
    db = get_db()
    try:
        slot = db.query(Slot).filter(Slot.id == slot_id).first()
        if slot:
            slot.is_available = False
            db.commit()
            return True
        return False
    finally:
        db.close()

# CRUD -> updating a slot or setting 
def mark_slot_available(slot_id: str) -> bool:
    db = get_db()
    try:
        slot = db.query(Slot).filter(Slot.id == slot_id).first()
        if slot:
            slot.is_available = True
            db.commit()
            return True
        return False
    finally:
        db.close()

# CRUD -> creating an appointment
def book_appointment(slot_id: str, user_phone: str, patient_name: str, notes: str = None) -> Optional[Appointment]:
    db = get_db()
    try:
        # Check if slot is available
        slot = db.query(Slot).filter(Slot.id == slot_id, Slot.is_available == True).first()
        if not slot:
            return None
        
        # Get or create user
        user = get_or_create_user(user_phone, patient_name)
        
        # Create appointment
        appointment = Appointment(
            user_phone=user_phone,
            slot_id=slot_id,
            patient_name=patient_name,
            patient_phone=user_phone,
            status='confirmed',
            notes=notes
        )
        db.add(appointment)
        
        # Mark slot as unavailable
        slot.is_available = False
        
        db.commit()
        db.refresh(appointment)
        return appointment
    finally:
        db.close()

# CRUD -> reading appointments -> for a user
def get_user_appointments(phone: str, include_cancelled: bool = False) -> List[Appointment]:
    db = get_db()
    try:
        query = db.query(Appointment).filter(Appointment.patient_phone == phone)
        if not include_cancelled:
            query = query.filter(Appointment.status != 'cancelled')
        return query.all()
    finally:
        db.close()

# CRUD -> reading appointments -> for admin
def get_all_appointments(include_cancelled: bool = False) -> List[Appointment]:
    db = get_db()
    try:
        query = db.query(Appointment)
        if not include_cancelled:
            query = query.filter(Appointment.status != 'cancelled')
        return query.all()
    finally:
        db.close()

# CRUD -> updating an appointment -> cancel
def cancel_appointment(appointment_id: str) -> bool:
    db = get_db()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return False
        
        # Update appointment status
        appointment.status = 'cancelled'
        appointment.updated_at = datetime.utcnow()
        
        # Mark slot as available again
        slot = db.query(Slot).filter(Slot.id == appointment.slot_id).first()
        if slot:
            slot.is_available = True
        
        db.commit()
        return True
    finally:
        db.close()

# CRUD -> updating an appointment -> modify
def modify_appointment(appointment_id: str, new_slot_id: str) -> Optional[Appointment]:
    db = get_db()
    try:
        # Get appointment
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return None
        
        # Check if new slot is available
        new_slot = db.query(Slot).filter(Slot.id == new_slot_id, Slot.is_available == True).first()
        if not new_slot:
            return None
        
        # Free up old slot
        old_slot = db.query(Slot).filter(Slot.id == appointment.slot_id).first()
        if old_slot:
            old_slot.is_available = True
        
        # Update appointment
        appointment.slot_id = new_slot_id
        appointment.status = 'modified'
        appointment.updated_at = datetime.utcnow()
        
        # Mark new slot as unavailable
        new_slot.is_available = False
        
        db.commit()
        db.refresh(appointment)
        return appointment
    finally:
        db.close()

# CRUD -> saving a call summary -> for admin
def save_call_summary(summary_data: Dict[str, Any]) -> CallSummary:
    db = get_db()
    try:
        summary = CallSummary(**summary_data)
        db.add(summary)
        db.commit()
        db.refresh(summary)
        return summary
    finally:
        db.close()

# CRUD -> reading call summaries -> for a user
def get_call_summaries_by_phone(phone: str) -> List[CallSummary]:
    db = get_db()
    try:
        return db.query(CallSummary).filter(CallSummary.patient_phone == phone).all()
    finally:
        db.close()

# CRUD -> reading all call summaries -> for admin billing
def get_all_summaries() -> List[CallSummary]:
    db = get_db()
    try:
        return db.query(CallSummary).all()
    finally:
        db.close()
