import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';

const ToolCallPanel = ({ room }) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (!room) return;

        const handleData = (payload, participant, kind) => {
            const decoder = new TextDecoder();
            const strData = decoder.decode(payload);

            try {
                const data = JSON.parse(strData);
                if (data.type) {
                    addEvent(data);
                }
            } catch (e) {
                // Not JSON, ignore
            }
        };

        room.on('dataReceived', handleData);
        return () => room.off('dataReceived', handleData);
    }, [room]);

    const addEvent = (event) => {
        const newEvent = {
            id: Date.now(),
            timestamp: new Date(),
            ...event
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 10));
    };

    useEffect(() => {
        if (events.length === 0 && room) {
            addEvent({ type: 'info', message: 'Connected to agent' });
        }
    }, [room]);

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="var(--accent-secondary)" />
                Live Activity
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
                {events.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
                        Ready to process commands...
                    </p>
                ) : (
                    events.map(event => (
                        <div key={event.id} style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${getEventColor(event.type)}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: getEventColor(event.type) }}>
                                    {formatEventType(event.type)}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} />
                                    {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.9rem', margin: 0 }}>
                                {event.message || event.tool || 'Processing...'}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const getEventColor = (type) => {
    switch (type) {
        case 'tool_start': return 'var(--warning)';
        case 'tool_end': return 'var(--success)';
        case 'error': return 'var(--danger)';
        default: return 'var(--accent-primary)';
    }
};

const formatEventType = (type) => {
    switch (type) {
        case 'tool_start': return 'Running Tool';
        case 'tool_end': return 'Tool Completed';
        case 'info': return 'System';
        default: return type.toUpperCase();
    }
};

export default ToolCallPanel;
