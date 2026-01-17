# SuperByrn Voice AI Agent

A voice-powered appointment booking system with an AI avatar.

## Features

### Admin Dashboard
- View total cost, number of appointments, and total calls
- See all appointments with edit and delete options
- Managed by staff

### Patient Mode
- Talk with the AI avatar
- Book, retrieve, or modify appointments
- Hang up to end the call
- View booking summary after the call

## Setup

### 1. Install Dependencies

**Backend:**
```bash
cd server
pip install -r requirements.txt
```

**Frontend:**
```bash
cd client
npm install
```

### 2. Environment Variables

Create `.env` files in both `server/` and `client/` folders with the required API keys.

## Running the App

Open 3 terminals:

**Terminal 1 - Backend API:**
```bash
cd server
uvicorn app.main:app --reload
```

**Terminal 2 - LiveKit Agent:**
```bash
cd server
python app/agent_orchestrator.py dev
```

**Terminal 3 - Frontend:**
```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.
