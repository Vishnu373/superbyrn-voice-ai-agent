import sys
import os
import time
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from livekit.agents import Agent, RunContext, function_tool
from database.db_client import (
    get_or_create_user, get_available_slots, book_appointment,
    get_user_appointments, cancel_appointment, modify_appointment, save_call_summary, get_all_appointments
)
from prompts import DOCTOR_APPOINTMENT_PROMPT
from cost_tracker import CostTracker


class AppointmentAssistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=DOCTOR_APPOINTMENT_PROMPT)
        self.current_phone = None
        self.conversation_context = []
        self.call_start_time = time.time()
        self.cost_tracker = CostTracker()

    """
    Identify user by their phone number.
    If new user, creates entry in db. If existing, retrieves from db.
    """
    @function_tool()
    async def identify_user(self, context: RunContext, phone_number: str) -> str:
        # Validate phone number format (exactly 10 digits)
        phone_clean = phone_number.replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
        if not phone_clean.isdigit() or len(phone_clean) != 10:
            return "Invalid phone number. Please provide a 10-digit phone number."
        
        user = get_or_create_user(phone_clean)
        self.current_phone = phone_clean
        self.conversation_context.append(f"User identified: {phone_clean}")
        return f"User identified: {user.name or 'New patient'} with phone {phone_clean}"

    """
    Get all available appointment slots from the database.
    Returns only slots where is_available = True.
    """
    @function_tool()
    async def fetch_slots(self, context: RunContext) -> str:
        slots = get_available_slots()
        if not slots:
            return "No slots are currently available."
        
        slot_list = []
        for s in slots:
            slot_info = f"{s.day_of_week} {s.start_time.strftime('%I:%M %p')} to {s.end_time.strftime('%I:%M %p')} (ID: {s.id})"
            slot_list.append(slot_info)
        
        return f"Available slots:\n" + "\n".join(slot_list)

    """
    Book an appointment for the identified user.
    User must be identified first.
    Books slot and marks it unavailable.
    """
    @function_tool()
    async def book_appointment_tool(self, context: RunContext, slot_id: str, patient_name: str) -> str:
        if not self.current_phone:
            return "Please identify the user first with their phone number."
        
        # Check for duplicate booking
        existing_appointments = get_user_appointments(self.current_phone)
        for appt in existing_appointments:
            if str(appt.slot_id) == slot_id and appt.status != 'cancelled':
                return "You already have an appointment for this time slot. Please choose a different slot or cancel your existing appointment first."
        
        appointment = book_appointment(slot_id, self.current_phone, patient_name)
        if appointment:
            self.conversation_context.append(f"Booked appointment: slot {slot_id} for {patient_name}")
            return f"Appointment booked successfully for {patient_name}."
        return "That slot is no longer available. Please try another."

    """
    Get appointments for the identified user or all appointments (admin).
    For users: returns their own appointments.
    For admin: returns all appointments in the system.
    """
    @function_tool()
    async def retrieve_appointments_tool(self, context: RunContext, is_admin: bool = False) -> str:
        if not is_admin and not self.current_phone:
            return "Please identify the user first."
        
        if is_admin:
            appointments = get_all_appointments()
        else:
            appointments = get_user_appointments(self.current_phone)
        
        if not appointments:
            return "No appointments booked yet."
        
        appt_list = []
        for appt in appointments:
            appt_list.append(f"Appointment ID {appt.id}: {appt.patient_name} - Status: {appt.status}")
        
        return f"You have {len(appointments)} appointment(s):\n" + "\n".join(appt_list)

    """
    Cancel an existing appointment.
    Accessible to both admin and user.
    Frees up the slot.
    """
    @function_tool()
    async def cancel_appointment_tool(self, context: RunContext, appointment_id: str) -> str:
        if not self.current_phone:
            return "Please identify the user first."
        
        # Verify ownership
        user_appointments = get_user_appointments(self.current_phone)
        appointment_found = False
        for appt in user_appointments:
            if str(appt.id) == appointment_id:
                appointment_found = True
                break
        
        if not appointment_found:
            return "Could not find that appointment in your records. Please check the appointment ID."
        
        success = cancel_appointment(appointment_id)
        if success:
            self.conversation_context.append(f"Cancelled appointment: {appointment_id}")
            return "Appointment cancelled successfully."
        return "Could not cancel the appointment. Please try again."

    """
    Modify an appointment to a different time slot.
    Accessible to both admin and user.
    Frees old slot, books new slot.
    """
    @function_tool()
    async def modify_appointment_tool(self, context: RunContext, appointment_id: str, new_slot_id: str) -> str:
        if not self.current_phone:
            return "Please identify the user first."
        
        # Check if user has appointments
        appointments = get_user_appointments(self.current_phone)
        if not appointments:
            return "No appointments booked."
        
        appointment = modify_appointment(appointment_id, new_slot_id)
        if appointment:
            self.conversation_context.append(f"Modified appointment {appointment_id} to slot {new_slot_id}")
            return "Appointment modified successfully."
        return "Could not modify. The new slot may be unavailable."

    """
    End the conversation and generate summary.
    Determines summary case based on conversation context and saves to database.
    """
    @function_tool()
    async def end_conversation(self, context: RunContext) -> str:
        # Calculate call duration
        call_end_time = time.time()
        duration_seconds = call_end_time - self.call_start_time
        self.cost_tracker.track_call_duration(duration_seconds)
        costs = self.cost_tracker.calculate_costs()
        
        # Determine summary case based on conversation context
        summary_text = f"Call with {self.current_phone or 'Unknown'}\n"
        
        if any("Booked appointment" in ctx for ctx in self.conversation_context):
            summary_text += "Case: Appointment booked\n"
            summary_text += "\n".join([ctx for ctx in self.conversation_context if "Booked" in ctx])
        elif any("Modified appointment" in ctx for ctx in self.conversation_context):
            summary_text += "Case: Appointment modified\n"
            summary_text += "\n".join([ctx for ctx in self.conversation_context if "Modified" in ctx])
        elif any("Cancelled appointment" in ctx for ctx in self.conversation_context):
            summary_text += "Case: Appointment cancelled\n"
            summary_text += "\n".join([ctx for ctx in self.conversation_context if "Cancelled" in ctx])
        else:
            summary_text += "Case: No action taken\n"
            summary_text += "No appointments booked, modified, or cancelled."
        
        # Save to database with cost breakdown
        save_call_summary({
            "patient_phone": self.current_phone,
            "summary_text": summary_text,
            "call_duration_seconds": int(duration_seconds),
            "cost_breakdown": costs,
            "total_cost": costs["total_cost"]
        })
        
        return f"Conversation ended. Call lasted {costs['duration_minutes']} minutes. Total cost: ${costs['total_cost']}"
