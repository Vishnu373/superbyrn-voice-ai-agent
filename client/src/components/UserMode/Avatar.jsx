import React, { useEffect, useRef, useState } from 'react';
import { RoomEvent } from 'livekit-client';

const Avatar = ({ room }) => {
    const videoRef = useRef(null);
    const [hasVideo, setHasVideo] = useState(false);

    useEffect(() => {
        if (!room) return;

        const handleTrackSubscribed = (track, publication, participant) => {
            if (track.kind === 'video' && participant.identity !== room.localParticipant.identity) {
                track.attach(videoRef.current);
                setHasVideo(true);
            }
        };

        const handleTrackUnsubscribed = (track) => {
            if (track.kind === 'video') {
                track.detach();
                setHasVideo(false);
            }
        };

        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

        // Check existing tracks
        room.remoteParticipants.forEach(participant => {
            participant.videoTrackPublications.forEach(pub => {
                if (pub.track) {
                    pub.track.attach(videoRef.current);
                    setHasVideo(true);
                }
            });
        });

        return () => {
            room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
            room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        };
    }, [room]);

    return (
        <div style={{ width: '100%', height: '100%', background: '#0f172a' }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: hasVideo ? 'block' : 'none'
                }}
            />
            {!hasVideo && (
                <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'var(--text-secondary)'
                }}>
                    <div className="pulse-ring"></div>
                    <p style={{ marginTop: '2rem' }}>Waiting for avatar...</p>
                </div>
            )}
        </div>
    );
};

export default Avatar;
