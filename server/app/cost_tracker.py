class CostTracker:
    PRICING = {
        "deepgram_flux": 0.0077,
        "livekit_cloud": 0.0425,
        "beyond_presence": 0.35,
    }
    
    # Initialize cost tracker
    def __init__(self):
        self.call_duration_seconds = 0

    # Track total call duration in seconds
    def track_call_duration(self, duration_seconds: float):
        self.call_duration_seconds = duration_seconds
    
    # Calculate costs based on call duration
    def calculate_costs(self) -> dict:
        duration_minutes = self.call_duration_seconds / 60.0
        
        deepgram_cost = duration_minutes * self.PRICING["deepgram_flux"]
        livekit_cost = duration_minutes * self.PRICING["livekit_cloud"]
        beyond_presence_cost = duration_minutes * self.PRICING["beyond_presence"]
        total_cost = deepgram_cost + livekit_cost + beyond_presence_cost
        
        return {
            "duration_seconds": self.call_duration_seconds,
            "duration_minutes": round(duration_minutes, 2),
            "deepgram_cost": round(deepgram_cost, 4),
            "livekit_cost": round(livekit_cost, 4),
            "beyond_presence_cost": round(beyond_presence_cost, 4),
            "total_cost": round(total_cost, 4)
        }
    
    # Get formatted cost summary
    def get_summary(self) -> str:
        costs = self.calculate_costs()
        return f"""
    Call Duration: {costs['duration_minutes']} minutes
    Deepgram STT: ${costs['deepgram_cost']}
    LiveKit Cloud: ${costs['livekit_cost']}
    Beyond Presence: ${costs['beyond_presence_cost']}
    Total Cost: ${costs['total_cost']}
"""
