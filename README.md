# Simple 2-Person Video Call Application

A lightweight WebRTC-based video calling application that allows two people to have a video conversation through their web browsers.

## Features

- Simple 2-person video calling
- Real-time audio and video communication
- WebRTC-based peer-to-peer connection
- WebSocket signaling server
- No account required

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)

## Installation

1. Clone this repository:

   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

## Running the Application

1. Start the backend server:

   ```
   cd backend
   npm run dev
   ```

2. Open the application in your web browser:
   - Open `index.html` in your web browser
   - Click "Open Two Windows" to test the application locally
   - Or share the URL with another person to have a real video call

## How It Works

This application uses:

- **WebRTC** for peer-to-peer audio/video communication
- **WebSocket** for signaling (exchanging connection information between peers)
- **STUN servers** to help establish connections through NATs and firewalls

The flow of a call:

1. Both users connect to the WebSocket server
2. When two users are connected, they can start the call
3. WebRTC connection is established through the signaling server
4. Audio and video streams are exchanged directly between peers

## Troubleshooting

- **Video not showing**: Make sure your camera and microphone permissions are granted
- **Connection issues**: Check your browser console for errors
- **Can't connect**: Ensure both users have good internet connections
- **Audio feedback**: Use headphones to prevent echo

## Browser Support

This application works on:

- Chrome 55+
- Firefox 52+
- Safari 11+
- Edge 79+

## License

MIT
