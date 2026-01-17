from dotenv import load_dotenv
import os
import json
from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, room_io
from livekit.plugins import noise_cancellation, silero, bey
from livekit.plugins.turn_detector.multilingual import MultilingualModel
import asyncio
from agent_tools import AppointmentAssistant

load_dotenv()

server = AgentServer()


@server.rtc_session()
async def appointment_agent(ctx: agents.JobContext):
    # Create Beyond Presence avatar session
    avatar_id = os.getenv("BEYOND_PRESENCE_AVATAR_ID")
    avatar = bey.AvatarSession(
        avatar_id=avatar_id,
    )
    
    # Create agent instance
    agent = AppointmentAssistant()
    
    session = AgentSession(
        stt="deepgram/flux-general:en",
        llm="openai/gpt-4.1-mini",
        tts="cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )
    
    # Handle END_CALL data message from frontend
    @ctx.room.on("data_received")
    def on_data_received(data_packet, *args, **kwargs):
        try:
            # Handle both data_packet object and raw bytes
            if hasattr(data_packet, 'data'):
                data = data_packet.data
            else:
                data = data_packet
            message = json.loads(data.decode('utf-8'))
            if message.get('type') == 'END_CALL':
                print("END_CALL received, saving summary...")
                # Trigger the end_conversation to save summary
                asyncio.create_task(agent.end_conversation(None))
        except Exception as e:
            print(f"Error processing data message: {e}")

    await session.start(
        room=ctx.room,
        agent=agent,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # Start Beyond Presence avatar (joins room and syncs with TTS)
    await avatar.start(room=ctx.room, agent_session=session)

    await session.generate_reply(
        instructions="Greet the patient warmly and ask for their phone number."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)