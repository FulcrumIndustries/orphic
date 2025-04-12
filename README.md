# Orphic - AI Brand Identity Generator

Orphic is a creative design assistant that takes a brand name and a brief description as input, then automatically generates a comprehensive visual identity package. This package includes a color theme grounded in color harmony theory, a set of three matching typography fonts, a prompt for custom typography-based logo, and three brand-relevant prompts for images.

## Features

- **Color Theme Generation**: Creates a harmonious color palette based on established color theory principles
- **Font Selection**: Selects three complementary fonts that represent the brand's personality
- **Typography Logo Prompt**: Generates a detailed prompt for creating a typography-focused logo
- **Image Prompts**: Creates three unique image prompts that align with the brand's identity
- **Real-time Updates**: Provides status updates via Server-Sent Events (SSE)
- **Dynamic Loading Animation**: Features a fire wheel animation that intensifies as progress is made

## Tech Stack

### Frontend

- React.js with TypeScript
- Tailwind CSS for styling
- Canvas API for fire wheel animation
- EventSource for SSE client

### Backend

- Node.js with Express
- BullMQ for task scheduling and parallelization
- Ollama for AI-powered creative generation
- Server-Sent Events (SSE) for real-time updates

## Setup Instructions

### Prerequisites

- Node.js >= 16.x
- Redis (for BullMQ job queue)
- Ollama setup locally or accessible via API

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start the server
npm run dev
```

### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Project Structure

```
orphic/
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main application component
│   │   └── ...
│   └── ...
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # API controllers
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   ├── workers/       # Background job workers
│   │   └── index.js       # Entry point
│   └── ...
└── ...
```
