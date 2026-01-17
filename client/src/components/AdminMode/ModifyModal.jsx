import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { X, Save, Clock } from 'lucide-react';

const ModifyModal = ({ appointment, onClose, onUpdate }) => {
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const available = await apiService.getAvailableSlots();
                setSlots(available);
            } catch (err) {
                console.error("Failed to fetch slots", err);
                setError("Could not load time slots.");
            } finally {
                setLoading(false);
            }
        };
        fetchSlots();
    }, []);

    const handleSave = async () => {
        if (!selectedSlot) return;
        setSaving(true);
        try {
            await apiService.modifyAppointment(appointment.id, selectedSlot);
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to modify appointment. Slot might be taken.");
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '1.5rem', background: '#1e293b' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Modify Appointment</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Current Patient</p>
                    <p style={{ fontWeight: 600 }}>{appointment.patient_name || appointment.patient_phone}</p>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                        <Clock size={16} />
                        <span>{appointment.slot.day_of_week}, {appointment.slot.start_time} (Current)</span>
                    </div>
                </div>

                {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select New Time Slot</label>
                    {loading ? (
                        <p>Loading slots...</p>
                    ) : (
                        <select
                            value={selectedSlot}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'white',
                                border: '1px solid var(--glass-border)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">-- Choose a slot --</option>
                            {slots.map(slot => (
                                <option key={slot.id} value={slot.id}>
                                    {slot.day_of_week} - {slot.start_time} to {slot.end_time}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn-secondary" disabled={saving}>Cancel</button>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        disabled={saving || !selectedSlot}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ModifyModal;
