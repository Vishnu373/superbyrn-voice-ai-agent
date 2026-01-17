# Edge Cases

| Edge Case | About |
|-----------|-------|
| Invalid phone format | Phone must be exactly 10 digits. Returns error if less or more. |
| User not verified | User must provide phone number before booking, retrieving, modifying, or cancelling. |
| No available slots | All slots are booked. Returns "No slots available" message. |
| No appointments booked | User has no existing appointments. Returns empty list message. |
| Slot no longer available | Slot was taken between viewing and booking. Returns slot unavailable message. |
| Duplicate booking | User already has appointment for same slot. Prevents double-booking. |
| Appointment not found | Appointment ID doesn't exist or isn't owned by user. |
| Appointment ownership | Verifies user owns appointment before cancelling. |
| Modify unavailable slot | New slot is not available when modifying. Returns error. |
| No appointments to modify | User has no appointments to modify. |
