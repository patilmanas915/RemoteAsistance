<img src="./.github/assets/app-icon.png" alt="Voice Assistant App Icon" width="100" height="100">

# Web Voice Assistant

This is a starter template for [LiveKit Agents](https://docs.livekit.io/agents) that provides a simple voice interface using the [LiveKit JavaScript SDK](https://github.com/livekit/client-sdk-js). It supports [voice](https://docs.livekit.io/agents/start/voice-ai), [transcriptions](https://docs.livekit.io/agents/build/text/), and [virtual avatars](https://docs.livekit.io/agents/integrations/avatar).

This template is built with Next.js and is free for you to use or modify as you see fit.

![App screenshot](/.github/assets/frontend-screenshot.jpeg)

## Getting started

> [!TIP]
> If you'd like to try this application without modification, you can deploy an instance in just a few clicks with [LiveKit Cloud Sandbox](https://cloud.livekit.io/projects/p_/sandbox/templates/voice-assistant-frontend).

Run the following command to automatically clone this template.

```bash
lk app create --template voice-assistant-frontend
```

Then run the app with:

```bash
pnpm install
pnpm dev
```

And open http://localhost:3000 in your browser.

You'll also need an agent to speak with. Try our [Voice AI Quickstart](https://docs.livekit.io/start/voice-ai) for the easiest way to get started.

> [!NOTE]
> If you need to modify the LiveKit project credentials used, you can edit `.env.local` (copy from `.env.example` if you don't have one) to suit your needs.

## Contributing

This template is open source and we welcome contributions! Please open a PR or issue through GitHub, and don't forget to join us in the [LiveKit Community Slack](https://livekit.io/join-slack)!

# Voice Assistant Frontend

A modern frontend application for audio sharing and screen mirroring with Tata Technologies branding.

## Features

- User session management with unique session codes
- Real-time audio communication via LiveKit
- Screen mirroring from mobile devices
- Beautiful Tata Technologies-themed UI/UX
- Fullscreen mode with keyboard shortcuts
- Session code sharing and visibility throughout the app

## Technologies Used

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- LiveKit WebRTC
- WebSockets

## Deployed Services

This application is configured to use the following backend services:

- **LiveKit Server**: Running on AWS EC2 at `13.233.186.200:7880`
- **Screen Mirroring WebSocket Server**: Deployed on Render at `websocket-server-avbk.onrender.com/ws`

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd voice-assistant-frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application requires special consideration for WebSocket security requirements. When deploying over HTTPS (like on Vercel), browsers require all WebSockets to use secure WSS protocol.

The application automatically uses the appropriate protocol (ws:// or wss://) based on whether the frontend is accessed via HTTP or HTTPS.

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions and troubleshooting.

## WebSocket Connections

The application connects to:

1. LiveKit server at `13.233.186.200:7880` for audio communication
2. Screen Mirroring WebSocket server at `websocket-server-avbk.onrender.com/ws`

Both servers must be accessible from the client's network. When accessing the frontend via HTTPS, the WebSocket connections will automatically use WSS (secure WebSockets).

## License

[Add your license information here]

## Acknowledgements

- Tata Technologies for design inspiration
- LiveKit for WebRTC communication
- [Add other acknowledgements as needed]
