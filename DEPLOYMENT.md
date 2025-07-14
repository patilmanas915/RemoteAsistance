# Deployment Guide

This document provides instructions for deploying the Voice Assistant Frontend application.

## Architecture

The application consists of several components:

1. **Frontend**: The Next.js application (this repository)
2. **LiveKit Server**: WebRTC streaming server for audio/video at `13.233.186.200:7880`
3. **Backend Service**: Screen mirroring WebSocket server at `websocket-server-avbk.onrender.com/ws`

## WebSocket Security Requirements

When deploying over HTTPS (like on Vercel), browsers require all WebSocket connections to use secure WSS (WebSocket Secure) protocol. The application automatically uses the appropriate protocol:

- When accessed via HTTP: Uses `ws://` protocol
- When accessed via HTTPS: Uses `wss://` protocol

## Frontend Deployment (Vercel)

1. Push your code to a Git repository
2. Connect the repository to Vercel
3. Deploy the application

No additional environment variables are needed as the connection URLs are hardcoded in the application.

## Testing Your Deployment

To verify your deployment:

1. Open your Vercel-deployed app in Chrome
2. Open Developer Tools (F12)
3. Go to the Network tab and filter by "WS" to see WebSocket connections
4. Check that connections are established without errors

## Troubleshooting

### Mixed Content Errors

If you see errors like:
```
Mixed Content: The page was loaded over HTTPS, but attempted to connect to the insecure WebSocket endpoint 'ws://...'
```

Solutions:
- Verify that the LiveKit server at 13.233.186.200:7880 is accessible over WSS when needed
- Verify that the screen mirroring server at websocket-server-avbk.onrender.com is accessible over WSS when needed

### Connection Failed

If the WebSocket connections can't be established:
- Check that the AWS EC2 instance (13.233.186.200) is running
- Verify that security groups allow WebSocket traffic on port 7880
- Ensure inbound rules allow traffic from your client IP
- Check that the Render server is up and running
- Verify that CORS is configured correctly on both servers 