import { Room, RoomEvent, VideoPresets } from 'livekit-client';
import { apiService } from './api';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

export class LiveKitService {
    constructor() {
        this.room = null;
        this.token = null;
    }

    async connect(phone) {
        if (!LIVEKIT_URL) {
            throw new Error('LiveKit URL not configured');
        }

        try {
            // 1. Get token from backend
            const { token, room: roomName } = await apiService.getLiveKitToken(phone);
            this.token = token;

            // 2. Initialize Room
            this.room = new Room({
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: {
                    resolution: VideoPresets.h720.resolution,
                },
            });

            // 3. Set up event listeners
            this.room
                .on(RoomEvent.Connected, () => console.log('Connected to LiveKit room:', roomName))
                .on(RoomEvent.Disconnected, () => console.log('Disconnected from LiveKit room'));

            // 4. Connect to Room
            await this.room.connect(LIVEKIT_URL, token);
            console.log('LiveKit connection established');

            return this.room;
        } catch (error) {
            console.error('Failed to connect to LiveKit:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.room) {
            await this.room.disconnect();
            this.room = null;
            this.token = null;
        }
    }

    async enableMicrophone() {
        if (this.room) {
            await this.room.localParticipant.setMicrophoneEnabled(true);
        }
    }

    async disableMicrophone() {
        if (this.room) {
            await this.room.localParticipant.setMicrophoneEnabled(false);
        }
    }

    getRoom() {
        return this.room;
    }
}

export const livekitService = new LiveKitService();
