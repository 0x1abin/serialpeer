# Web Serial Debug Tool

A web-based serial port debugging tool built with Nuxt 3, providing a modern interface for serial communication.

## Features

- 🔌 Serial port connection management
- 📡 Real-time data monitoring
- 💾 Data logging with timestamp
- 📤 Support for ASCII and HEX data formats
- 🔄 Auto-send functionality
- 📋 Quick commands management
- 💻 Cross-platform (works in Chrome and Edge)
- 🌓 Light/Dark theme support

## Prerequisites

- Node.js 16.x or later
- Chrome/Edge browser (with Web Serial API support)
- USB-Serial device driver installed

## Installation

```bash
# Clone the repository
git clone https://github.com/0x1abin/uart0.git
cd uart0

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

2. **Send Data**
   - Enter data in ASCII or HEX format
   - Click "Send" or press Enter to transmit

3. **Monitor Data**
   - Received data is displayed in the monitor window
   - Toggle timestamp display
   - Clear or export logs as needed

4. **Quick Commands**
   - Save frequently used commands
   - Send with a single click

## Browser Compatibility

The Web Serial API is currently supported in:
- Chrome 89 or later
- Edge 89 or later
- Chrome for Android (with USB support)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Nuxt 3](https://nuxt.com/)
- UI components from [DaisyUI](https://daisyui.com/)
- Icons from [Nuxt Icon](https://github.com/nuxt-modules/icon)
