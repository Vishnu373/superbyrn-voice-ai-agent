import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { Calendar, Clock, Edit2, Trash2, User, Phone } from 'lucide-react';
import ModifyModal from './ModifyModal';

const AppointmentsTable = ({ appointments, onRefresh }) => {
    const [editingAppt, setEditingAppt] = useState(null);
    const [cancelling, setCancelling] = useState(null);

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

        setCancelling(id);
        try {
            await apiService.cancelAppointment(id);
            onRefresh();
        } catch (err) {
            console.error(err);
            alert("Failed to cancel appointment");
        } finally {
            setCancelling(null);
        }
    };

    const getStatusColor = (status) => {
        if (status === 'confirmed') return 'var(--success)';
        if (status === 'cancelled') return 'var(--danger)';
        return 'var(--text-secondary)';
    };

    if (!appointments || appointments.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Calendar size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <p>No appointments found.</p>
            </div>
        );
    }

    return (
        <>
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <th style={{ padding: '1rem' }}>Patient</th>
                            <th style={{ padding: '1rem' }}>Day & Time</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Notes</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map(appt => (
                            <tr key={appt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={16} color="var(--accent-secondary)" />
                                        <span style={{ fontWeight: 500 }}>{appt.patient_name || 'Unknown'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        <Phone size={14} />
                                        {appt.patient_phone}
                                    </div>
                                </td>

                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={16} color="var(--accent-primary)" />
                                        {appt.slot.day_of_week}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginTop: '4px' }}>
                                        <Clock size={16} />
                                        {appt.slot.start_time} - {appt.slot.end_time}
                                    </div>
                                </td>

                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        background: `rgba(0,0,0,0.2)`,
                                        border: `1px solid ${getStatusColor(appt.status)}`,
                                        color: getStatusColor(appt.status)
                                    }}>
                                        {appt.status.toUpperCase()}
                                    </span>
                                </td>

                                <td style={{ padding: '1rem', maxWidth: '200px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {appt.notes || '-'}
                                </td>

                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {appt.status !== 'cancelled' && (
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => setEditingAppt(appt)}
                                                className="btn-secondary"
                                                style={{ padding: '8px', borderRadius: '8px' }}
                                                title="Modify Time"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleCancel(appt.id)}
                                                className="btn-secondary"
                                                style={{ padding: '8px', borderRadius: '8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                title="Cancel Appointment"
                                                disabled={cancelling === appt.id}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingAppt && (
                <ModifyModal
                    appointment={editingAppt}
                    onClose={() => setEditingAppt(null)}
                    onUpdate={onRefresh}
                />
            )}
        </>
    );
};

export default AppointmentsTable;
