import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div style={{ textAlign: 'center', maxWidth: '900px', width: '100%' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    SuperByrn Voice AI Agent
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '4rem' }}>
                    Intelligent appointment scheduling powered by voice
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {/* Patient Card */}
                    <div
                        className="glass-panel"
                        onClick={() => navigate('/patient')}
                        style={{
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            padding: '3rem 2rem',
                            textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                        }}
                    >
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            padding: '1.5rem',
                            borderRadius: '50%',
                            display: 'inline-flex',
                            marginBottom: '1.5rem'
                        }}>
                            <User size={48} color="var(--accent-primary)" />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Patient Mode</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            Book, modify, or cancel your appointments through natural voice conversation
                        </p>
                    </div>

                    {/* Admin Card */}
                    <div
                        className="glass-panel"
                        onClick={() => navigate('/admin')}
                        style={{
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            padding: '3rem 2rem',
                            textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                        }}
                    >
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '1.5rem',
                            borderRadius: '50%',
                            display: 'inline-flex',
                            marginBottom: '1.5rem'
                        }}>
                            <ShieldCheck size={48} color="var(--danger)" />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Admin Dashboard</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            Manage all appointments, view analytics, and monitor system usage
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
