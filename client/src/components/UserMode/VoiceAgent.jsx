import React, { useState, useEffect } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from '@livekit/components-react';
import { apiService } from '../../services/api';
import { Mic, MicOff, LogOut } from 'lucide-react';
import Avatar from './Avatar';
import ToolCallPanel from './ToolCallPanel';
import CallSummary from './CallSummary';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

const VoiceAgent = () => {
    const [token, setToken] = useState(null);
    const [sessionId, setSessionId] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        const fetchToken = async () => {
            const tempId = `guest-${Math.random().toString(36).substr(2, 9)}`;
            setSessionId(tempId);
            try {
                const { token } = await apiService.getLiveKitToken(tempId);
                setToken(token);
            } catch (err) {
                console.error('Failed to get token:', err);
            }
        };
        fetchToken();
    }, []);

    if (showSummary) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CallSummary phone={sessionId} onDismiss={() => window.location.reload()} />
            </div>
        );
    }

    if (!token) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                    <div className="pulse-ring" style={{ width: '80px', height: '80px', margin: '0 auto 2rem' }}></div>
                    <h2 style={{ marginBottom: '1rem' }}>Connecting to Agent...</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Establishing secure voice connection. Please allow microphone access.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            serverUrl={LIVEKIT_URL}
            token={token}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={() => setShowSummary(true)}
        >
            <RoomAudioRenderer />
            <VoiceAgentUI />
        </LiveKitRoom>
    );
};

const VoiceAgentUI = () => {
    const room = useRoomContext();
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isEnding, setIsEnding] = useState(false);

    const toggleMic = async () => {
        await room.localParticipant.setMicrophoneEnabled(!isMicEnabled);
        setIsMicEnabled(!isMicEnabled);
    };

    const handleEndCall = async () => {
        setIsEnding(true);
        try {
            // Send a data message to signal the agent to end the conversation
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify({ type: 'END_CALL', message: 'User ended the call' }));
            await room.localParticipant.publishData(data, { reliable: true });

            // Wait a moment for the agent to process and save the summary
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
            console.error('Error sending end signal:', err);
        }
        // Disconnect after giving agent time to save summary
        room.disconnect();
    };

    return (
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(250px, 1fr)', gap: '2rem', height: 'calc(100vh - 4rem)' }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'black' }}>
                    <Avatar room={room} />
                </div>

                <div style={{
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '2rem',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <button
                        onClick={toggleMic}
                        className="btn-secondary"
                        style={{
                            borderRadius: '50%',
                            width: '60px',
                            height: '60px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isMicEnabled ? 'var(--accent-primary)' : 'rgba(239, 68, 68, 0.2)',
                            border: isMicEnabled ? 'none' : '1px solid var(--danger)'
                        }}
                    >
                        {isMicEnabled ? <Mic size={24} /> : <MicOff size={24} color="var(--danger)" />}
                    </button>

                    <button
                        onClick={handleEndCall}
                        disabled={isEnding}
                        className="btn-secondary"
                        style={{
                            borderRadius: '50%',
                            width: '60px',
                            height: '60px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isEnding ? 'rgba(239, 68, 68, 0.5)' : 'var(--danger)',
                            border: 'none',
                            opacity: isEnding ? 0.7 : 1
                        }}
                    >
                        {isEnding ? <span style={{ fontSize: '12px' }}>...</span> : <LogOut size={24} color="white" />}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                <ToolCallPanel room={room} />
            </div>
        </div>
    );
};

export default VoiceAgent;
