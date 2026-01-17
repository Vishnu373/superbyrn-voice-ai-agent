import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Calendar, Clock, User, CheckCircle } from 'lucide-react';

const CallSummary = ({ phone, onDismiss }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                // Get all appointments and show only the most recent one (the user's)
                const allAppointments = await apiService.getAllAppointments();
                if (allAppointments && allAppointments.length > 0) {
                    // Sort by booked_at descending (most recent first)
                    allAppointments.sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at));
                    // Show only the most recent appointment (belongs to the caller)
                    setAppointments([allAppointments[0]]);
                }
            } catch (err) {
                console.error("Failed to fetch appointments", err);
            } finally {
                setLoading(false);
            }
        };

        setTimeout(fetchAppointments, 1000);
    }, [phone]);

    if (loading) return <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Loading appointment details...</div>;

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <CheckCircle size={28} color="var(--success)" />
                <h3>Call Completed</h3>
            </div>

            {appointments.length > 0 ? (
                <>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Your appointment details:
                    </p>

                    {appointments.map((appt, index) => (
                        <div key={appt.id || index} style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            marginBottom: index < appointments.length - 1 ? '1rem' : 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <User size={18} color="var(--accent-secondary)" />
                                <span style={{ fontWeight: 600 }}>{appt.patient_phone || appt.user_phone || 'Unknown'}</span>
                                <span style={{
                                    marginLeft: 'auto',
                                    fontSize: '0.8rem',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: appt.status === 'confirmed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                    color: appt.status === 'confirmed' ? 'var(--success)' : 'var(--warning)'
                                }}>
                                    {appt.status?.toUpperCase() || 'PENDING'}
                                </span>
                            </div>

                            {appt.slot && (
                                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={16} />
                                        <span>{appt.slot.day_of_week}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={16} />
                                        <span>{appt.slot.start_time} - {appt.slot.end_time}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </>
            ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                    No appointments were booked during this call.
                </p>
            )}

            <button
                className="btn-primary"
                onClick={onDismiss}
                style={{ width: '100%', marginTop: '2rem' }}
            >
                Start New Call
            </button>
        </div>
    );
};

export default CallSummary;
