# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the LiveKit Agents Playground frontend - a Next.js application for prototyping and testing LiveKit AI agents. The playground provides a web interface to interact with server-side agents through video, audio, and chat components.

## Development Commands

### Basic Commands
- `npm install` - Install dependencies  
- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure required environment variables:
   - `LIVEKIT_API_KEY` - Your LiveKit API key
   - `LIVEKIT_API_SECRET` - Your LiveKit API secret  
   - `NEXT_PUBLIC_LIVEKIT_URL` - WebSocket URL (wss://your-livekit-url)
   - `NEXT_PUBLIC_APP_CONFIG` - YAML configuration for app behavior

## Architecture

### Core Components
- **Playground.tsx** (`src/components/playground/`) - Main interface with video, audio, chat, and settings panels
- **useConnection** (`src/hooks/useConnection.tsx`) - Manages LiveKit room connections and token generation
- **useConfig** (`src/hooks/useConfig.tsx`) - Handles app configuration from environment variables
- **Token API** (`src/pages/api/token.ts`) - Generates LiveKit access tokens for room connections

### Key Features
- Real-time video/audio streaming with LiveKit agents
- Chat interface with transcription support  
- Configurable settings panel for agent parameters (prompts, API keys)
- Responsive design with mobile/desktop layouts
- Color theming system

### Connection Modes
- **env**: Uses environment variables and `/api/token` endpoint
- **manual**: User provides token and WebSocket URL directly
- **cloud**: LiveKit Cloud integration (not implemented in current version)

### State Management
- React Context for connection state and configuration
- LocalStorage for persisting user settings
- Real-time data synchronization via LiveKit data channels

The application follows Next.js conventions with TypeScript, uses Tailwind CSS for styling, and integrates deeply with LiveKit's React components library.