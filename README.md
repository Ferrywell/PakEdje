# 🚚 PakEdje - Multi-Carrier Package Tracker

> **⚠️ DISCLAIMER: This tool is for RESEARCH PURPOSES ONLY. Not intended for commercial use.**

## About

PakEdje is an advanced multi-carrier package tracking system designed for research and educational purposes. It demonstrates the implementation of web automation, API integration, and user interface design in a browser extension context.

## Features

- **Multi-Carrier Support**
  - PostNL (Orange branding)
  - DPD (Red branding)
  - UPS (Brown branding)
  - DHL (Yellow branding)
  - GLS (Blue branding)
  - Bpost (Red/White branding)
  - Mondial Relay (Green branding)

- **Advanced Tracking**
  - Real-time status updates
  - Multi-package management
  - Cross-carrier tracking
  - Automatic carrier detection

- **Notification System**
  - Discord integration
  - Telegram support
  - Email notifications
  - Browser notifications
  - Custom webhooks

## Research Purpose

This project is intended for:
- Studying web automation techniques
- Understanding API integration patterns
- Learning about browser extension development
- Researching user interface design
- Exploring notification systems

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Click [Install PakEdje](https://raw.githubusercontent.com/ferrywell/pakedje/master/pakedje.user.js)
3. Visit any supported carrier website
4. Start tracking your packages!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/ferrywell/pakedje.git

# Navigate to project directory
cd pakedje

# Install dependencies (if any)
npm install
```

## Project Structure

```
PakEdje/
├── src/
│   ├── core/
│   │   ├── CarrierDetector.js
│   │   ├── PackageTracker.js
│   │   └── NotificationManager.js
│   ├── carriers/
│   │   ├── BaseCarrier.js
│   │   ├── DPDCarrier.js
│   │   └── ...
│   ├── notifications/
│   │   ├── BaseNotifier.js
│   │   ├── DiscordNotifier.js
│   │   └── ...
│   └── ui/
│       ├── components/
│       └── themes/
├── docs/
│   ├── API.md
│   ├── CONTRIBUTING.md
│   └── CHANGELOG.md
└── README.md
```

## Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

- **Ferry Well** - *Initial work* - [ferrywell](https://github.com/ferrywell)

## Acknowledgments

- Thanks to all contributors who have helped with this research project
- Special thanks to the open-source community for inspiration and tools
