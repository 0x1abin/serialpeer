# SerialPeer

A modern Web serial debugging tool with P2P sharing capabilities, built with Nuxt 3.  
Providing a sleek interface for serial communication and real-time collaboration.

<p align="center">
  <b>🚧 P2P sharing feature coming soon! 🚧</b>
</p>

## Features

- 🔌 Serial port connection management
- 📡 Real-time data monitoring
- 💾 Data logging with timestamp
- 📤 Support for ASCII and HEX data formats
- 🔄 Auto-send functionality
- 📋 Quick commands management
- 💻 Cross-platform (works in Chrome and Edge)
- 🌓 Light/Dark theme support

### Coming Soon

- 🌐 P2P data sharing via WebRTC
- 🔗 Session sharing and collaboration
- 🤝 Command sets sharing
- 🔒 Secure peer-to-peer connection

## Prerequisites

- Node.js 16.x or later
- Chrome/Edge browser (with Web Serial API support)
- USB-Serial device driver installed

## Installation

```bash
# Clone the repository
git clone https://github.com/0x1abin/serialpeer.git
cd serialpeer

# Install dependencies
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Usage

1. **Connect to Serial Port**
   - Select your serial port settings (baud rate, data bits, etc.)
   - Click "Connect" to establish connection

2. **Send and Monitor Data**
   - Enter data in ASCII or HEX format
   - Real-time data monitoring with timestamp
   - Clear or export logs as needed

3. **Quick Commands**
   - Save frequently used commands
   - Send with a single click
   - Share command sets with peers

4. **P2P Sharing**
   - Share your serial session with peers
   - Real-time collaboration
   - Secure peer-to-peer connection
   - No server required for data transfer

## Browser Compatibility

The Web Serial API and WebRTC are supported in:
- Chrome 89 or later
- Edge 89 or later
- Chrome for Android (with USB support)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Tech Stack

- [Nuxt 3](https://nuxt.com/) - The Vue.js Framework
- [WebRTC](https://webrtc.org/) - Real-time communication
- [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Serial) - Serial communication
- [DaisyUI](https://daisyui.com/) - UI components
- [Nuxt Icon](https://github.com/nuxt-modules/icon) - Icon system
