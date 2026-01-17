import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Time, Integer, Text, ForeignKey, DECIMAL, JSON, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = 'users'
    
    phone_number = Column(String(20), primary_key=True)
    name = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="user")


class Slot(Base):
    __tablename__ = 'slots'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    day_of_week = Column(String(10), nullable=False)  # 'Monday', 'Tuesday'
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True)
    
    appointments = relationship("Appointment", back_populates="slot")
    
    __table_args__ = (
        UniqueConstraint('day_of_week', 'start_time', name='unique_day_time'),
    )


class Appointment(Base):
    __tablename__ = 'appointments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_phone = Column(String(20), ForeignKey('users.phone_number'))
    slot_id = Column(UUID(as_uuid=True), ForeignKey('slots.id'))
    patient_name = Column(String(100))
    patient_phone = Column(String(20), nullable=False)
    status = Column(String(20), default='confirmed')  # confirmed, cancelled, modified
    notes = Column(Text)
    booked_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="appointments")
    slot = relationship("Slot", back_populates="appointments")


class CallSummary(Base):
    __tablename__ = 'call_summaries'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_phone = Column(String(20))
    summary_text = Column(Text)
    appointments_mentioned = Column(JSON)  # JSONB in PostgreSQL
    user_preferences = Column(Text)
    call_duration_seconds = Column(Integer)
    cost_breakdown = Column(JSON)  # JSONB in PostgreSQL
    total_cost = Column(DECIMAL(10, 4))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
