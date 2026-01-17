import os
from datetime import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from models import Base, Slot

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def init_database():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL not found")
    
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(engine)
    print("All tables created successfully!")
    return engine


def seed_slots(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Define Monday & Tuesday slots (5:00 PM - 7:00 PM, 30-min each) hardcoded
    slots_data = [
        {"day_of_week": "Monday", "start_time": time(17, 0), "end_time": time(17, 30)},
        {"day_of_week": "Monday", "start_time": time(17, 30), "end_time": time(18, 0)},
        {"day_of_week": "Monday", "start_time": time(18, 0), "end_time": time(18, 30)},
        {"day_of_week": "Monday", "start_time": time(18, 30), "end_time": time(19, 0)},
        {"day_of_week": "Tuesday", "start_time": time(17, 0), "end_time": time(17, 30)},
        {"day_of_week": "Tuesday", "start_time": time(17, 30), "end_time": time(18, 0)},
        {"day_of_week": "Tuesday", "start_time": time(18, 0), "end_time": time(18, 30)},
        {"day_of_week": "Tuesday", "start_time": time(18, 30), "end_time": time(19, 0)},
    ]
    
    # Check if slots already exist
    existing = session.query(Slot).count()
    if existing > 0:
        print(f"{existing} slots already exist. Skipping seed.")
        session.close()
        return
    
    # Insert slots
    for slot_data in slots_data:
        slot = Slot(**slot_data, is_available=True)
        session.add(slot)
    
    session.commit()
    print("Seeded 8 appointment slots (Monday & Tuesday, 5-7 PM)")
    session.close()


if __name__ == "__main__":
    print("Initializing database...")
    engine = init_database()
    print("\n Seeding slots...")
    seed_slots(engine)
    print("\n Database setup complete!")
