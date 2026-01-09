# Desktop Application

Cross-platform desktop application built with Electron, providing native desktop experience for the LMS.

## Features

- Full LMS functionality in native desktop app
- System tray integration
- File system access
- Offline course content
- Automatic updates
- Native notifications

## Tech Stack

- **Framework**: Electron
- **Renderer**: Web-next application
- **Build**: electron-builder

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure backend URL:
Edit configuration to point to your backend API.

3. Start development:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build        # Build for current platform
npm run build:win    # Build for Windows
npm run build:mac    # Build for macOS
npm run build:linux  # Build for Linux
```

## Platform Support

- Windows (x64, arm64)
- macOS (Intel, Apple Silicon)
- Linux (x64, arm64)

## Distribution

Built installers will be in the `dist/` directory:
- Windows: `.exe` installer
- macOS: `.dmg` image
- Linux: `.AppImage`, `.deb`, `.rpm`
