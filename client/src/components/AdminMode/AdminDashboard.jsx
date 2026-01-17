import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import AppointmentsTable from './AppointmentsTable';
import { ShieldCheck, RefreshCw, DollarSign, Users, Calendar } from 'lucide-react';

const AdminDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [billingStats, setBillingStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [appts, billing] = await Promise.all([
                apiService.getAllAppointments(),
                apiService.getAllBilling()
            ]);
            setAppointments(appts);
            setBillingStats(billing);
        } catch (err) {
            console.error("Failed to load admin data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                        <ShieldCheck size={32} color="var(--danger)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Admin Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage appointments and monitor system usage.</p>
                    </div>
                </div>

                <button onClick={fetchData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCw size={18} /> Refresh Data
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                        <Calendar size={24} color="var(--accent-primary)" />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Appointments</p>
                        <h3 style={{ fontSize: '1.5rem' }}>{appointments.length}</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                        <DollarSign size={24} color="var(--success)" />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total System Cost</p>
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
                            ${billingStats?.total_cost ? billingStats.total_cost.toFixed(2) : '0.00'}
                        </h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                        <Users size={24} color="var(--warning)" />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Calls Processed</p>
                        <h3 style={{ fontSize: '1.5rem' }}>{billingStats?.total_calls || 0}</h3>
                    </div>
                </div>

            </div>

            <h2 style={{ marginBottom: '1.5rem' }}>Appointment Schedule</h2>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    Loading dashboard data...
                </div>
            ) : (
                <AppointmentsTable appointments={appointments} onRefresh={fetchData} />
            )}
        </div>
    );
};

export default AdminDashboard;
