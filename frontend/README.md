# Connectify Frontend

The frontend is a React single-page application that handles authentication, meeting creation and join flows, meeting history display, and the real-time meeting interface. It communicates with the backend over REST for user-related operations and Socket.IO for real-time meeting events.

## Tech Stack

- React
- React Router DOM
- Material UI
- Axios
- Socket.IO Client
- Create React App

## Features

- Landing page with entry points for guest join and authentication
- Sign in and sign up flow
- Protected home route using a higher-order authentication guard
- Join meetings by meeting code
- Real-time meeting room with:
  - camera toggle
  - microphone toggle
  - screen sharing
  - chat messaging
  - peer-to-peer media using WebRTC
- Meeting history page for authenticated users

## Application Structure

```text
frontend/
├── public/
│   ├── BG.png
│   ├── mobile2.png
│   └── index.html
├── src/
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── AuthenticationPage.jsx
│   │   ├── history.jsx
│   │   ├── home.jsx
│   │   ├── LandingPage.jsx
│   │   └── videoMeet.jsx
│   ├── styles/
│   │   └── videoComponent.module.css
│   ├── utils/
│   │   └── withAuth.jsx
│   ├── App.js
│   ├── environment.js
│   └── index.js
└── README.md
```

## Key Components

### Routing

[`src/App.js`](/Users/aryan/Desktop/Project-Connectify/frontend/src/App.js) defines the primary routes:

- `/` for the landing page
- `/auth` for login and registration
- `/home` for authenticated meeting entry
- `/history` for meeting history
- `/:url` for the video meeting room

### Authentication Context

[`src/contexts/AuthContext.jsx`](/Users/aryan/Desktop/Project-Connectify/frontend/src/contexts/AuthContext.jsx) centralizes:

- user registration
- user login
- fetching meeting history
- persisting joined meeting codes

### Protected Pages

[`src/utils/withAuth.jsx`](/Users/aryan/Desktop/Project-Connectify/frontend/src/utils/withAuth.jsx) redirects unauthenticated users to `/auth` when no token is found in `localStorage`.

### Meeting Experience

[`src/pages/videoMeet.jsx`](/Users/aryan/Desktop/Project-Connectify/frontend/src/pages/videoMeet.jsx) manages:

- media permission requests
- peer connection setup
- socket signaling
- screen sharing
- chat state
- local and remote video rendering

## Setup

### Prerequisites

- Node.js 18+
- npm
- Running backend server

### Install Dependencies

```bash
cd frontend
npm install
```

### Configure Backend URL

The frontend currently does not use `.env` variables. Backend selection is controlled in [`src/environment.js`](/Users/aryan/Desktop/Project-Connectify/frontend/src/environment.js).

For local development:

```js
let IS_PROD = false;
```

This points API and Socket.IO traffic to:

```text
http://localhost:8000
```

### Run the Frontend

```bash
npm start
```

The app will start at `http://localhost:3000`.

## Available Scripts

- `npm start` starts the development server
- `npm run build` creates a production build
- `npm test` runs the test suite

## Environment Variables

No frontend environment variables are currently required.

Configuration is handled through [`src/environment.js`](/Users/aryan/Desktop/Project-Connectify/frontend/src/environment.js). If you later migrate to environment-based configuration, document variables such as the frontend API base URL there.
