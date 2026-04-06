# Connectify Backend

The backend powers authentication, meeting history persistence, and real-time signaling for Connectify. It exposes a REST API for user-related operations and attaches a Socket.IO server to the HTTP server for meeting-room communication.

## Tech Stack

- Node.js
- Express
- Socket.IO
- MongoDB
- Mongoose
- bcrypt
- dotenv
- nodemon

## Responsibilities

- Register and authenticate users
- Generate and persist session tokens
- Store meeting history per user
- Expose REST endpoints for client operations
- Handle Socket.IO room membership, signaling, chat, and disconnect events

## Project Structure

```text
backend/
├── src/
│   ├── app.js
│   ├── controllers/
│   │   ├── socketManager.js
│   │   └── user.controller.js
│   ├── models/
│   │   ├── meeting.model.js
│   │   └── user.model.js
│   └── routes/
│       └── users.routes.js
├── package.json
└── README.md
```

## Architecture

### Entry Point

[`src/app.js`](/Users/aryan/Desktop/Project-Connectify/backend/src/app.js) is responsible for:

- loading environment variables
- creating the Express app
- creating the HTTP server
- attaching Socket.IO through `connectToSocket`
- connecting to MongoDB
- mounting the `/api/v1/users` routes

### Routes

[`src/routes/users.routes.js`](/Users/aryan/Desktop/Project-Connectify/backend/src/routes/users.routes.js) defines the main API endpoints:

- `POST /api/v1/users/register`
- `POST /api/v1/users/login`
- `POST /api/v1/users/add_to_activity`
- `GET /api/v1/users/get_all_activity`

### Controllers

[`src/controllers/user.controller.js`](/Users/aryan/Desktop/Project-Connectify/backend/src/controllers/user.controller.js) handles:

- registration with hashed passwords
- login with password verification
- token generation
- meeting history creation and retrieval

[`src/controllers/socketManager.js`](/Users/aryan/Desktop/Project-Connectify/backend/src/controllers/socketManager.js) handles:

- `join-call`
- `signal`
- `chat-message`
- `disconnect`

This is the signaling layer used by the frontend WebRTC meeting experience.

### Data Models

- [`src/models/user.model.js`](/Users/aryan/Desktop/Project-Connectify/backend/src/models/user.model.js): stores `name`, `username`, `password`, and session `token`
- [`src/models/meeting.model.js`](/Users/aryan/Desktop/Project-Connectify/backend/src/models/meeting.model.js): stores `user_id`, `meetingCode`, and `date`

## API Reference

### `POST /api/v1/users/register`

Registers a new user.

Request body:

```json
{
  "name": "Aryan",
  "username": "aryan01",
  "password": "securePassword"
}
```

### `POST /api/v1/users/login`

Authenticates a user and returns a token.

Request body:

```json
{
  "username": "aryan01",
  "password": "securePassword"
}
```

Successful response:

```json
{
  "token": "generated_session_token"
}
```

### `POST /api/v1/users/add_to_activity`

Stores a meeting code in the user's history.

Request body:

```json
{
  "token": "generated_session_token",
  "meeting_code": "abc123"
}
```

### `GET /api/v1/users/get_all_activity`

Returns all meetings associated with the authenticated user.

Query parameters:

```text
token=generated_session_token
```

## Environment Variables

Create a `.env` file in `backend/` with the following values:

```env
PORT=8000
ENV_PORT=8000
MONGO_URI=your_remote_mongodb_connection_string
LOCAL_DB=your_local_mongodb_connection_string
```

### Notes

- `PORT` or `ENV_PORT` controls the server port
- `MONGO_URI` is the primary database connection used by the app
- `LOCAL_DB` exists in the codebase but is not currently used for connection selection

## Local Development

### Install Dependencies

```bash
cd backend
npm install
```

### Run in Development

```bash
npm run dev
```

### Run in Production Mode

```bash
npm start
```

The backend starts on `http://localhost:8000` when `PORT=8000`.

## Available Scripts

- `npm run dev` starts the server with nodemon
- `npm start` starts the server with Node.js
- `npm run prod` starts the app with PM2
