# Connectify

Connectify is a full-stack video meeting application built for real-time communication. It combines a React frontend for the user experience with an Express and Socket.IO backend for authentication, meeting history, and WebRTC signaling.

## Live Application

[Live Link](https://connectify-ai5n.onrender.com/)

## Core Features

- User registration and login
- Token-based session handling on the client
- Join meetings with a meeting code
- Real-time video calling with WebRTC peer connections
- Socket.IO-based signaling for room presence and media negotiation
- In-meeting chat messaging
- Screen sharing support
- Meeting history tracking for authenticated users

## Architecture Overview

The project is split into two applications:

- `frontend/`: React client responsible for authentication flows, routing, meeting UI, chat, and media controls
- `backend/`: Express API and Socket.IO server responsible for user management, meeting history persistence, and real-time signaling

### How Frontend and Backend Interact

1. The frontend sends authentication and history requests to the backend REST API under `/api/v1/users`.
2. After login, the frontend stores the returned token in `localStorage`.
3. When a user joins a meeting, the frontend connects to the backend via Socket.IO.
4. Socket events coordinate room membership, peer signaling, chat messages, and disconnect handling.
5. Meeting activity is persisted in MongoDB through the backend before or during meeting joins.

## Tech Stack

### Frontend

- React
- React Router
- Material UI
- Axios
- Socket.IO Client
- Create React App

### Backend

- Node.js
- Express
- Socket.IO
- MongoDB
- Mongoose
- bcrypt
- dotenv

## Repository Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   ├── models/
│   │   └── routes/
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   └── README.md
└── README.md
```

## Running the Project Locally

### Prerequisites

- Node.js 18+
- npm
- MongoDB connection string

### 1. Start the Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=8000
ENV_PORT=8000
MONGO_URI=your_mongodb_connection_string
LOCAL_DB=your_local_mongodb_connection_string
```

Run the backend:

```bash
npm run dev
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm start
```

The frontend runs on `http://localhost:3000` by default.

### 3. Configure Frontend API Target

The frontend currently uses [`frontend/src/environment.js`](/Users/aryan/Desktop/Project-Connectify/frontend/src/environment.js) to choose the backend URL.

- Set `IS_PROD = false` for local development
- Confirm the local backend URL is `http://localhost:8000`

## Additional Documentation

- Frontend details: [`frontend/README.md`](/Users/aryan/Desktop/Project-Connectify/frontend/README.md)
- Backend details: [`backend/README.md`](/Users/aryan/Desktop/Project-Connectify/backend/README.md)
