# LMS Desktop Application

Electron-based desktop application for the LMS platform.

## Features

- Native Windows, macOS, and Linux support
- Full LMS functionality
- Offline-capable (future)
- Auto-updates (future)

## Development

### Prerequisites
- Node.js 20+
- npm

### Run in Development Mode

```bash
npm run dev
```

This will:
1. Start the web frontend on localhost:5173
2. Launch Electron pointing to the dev server

### Build for Distribution

**Build web assets:**
```bash
npm run build
```

**Create distributables:**

Windows:
```bash
npm run dist:win
```

macOS:
```bash
npm run dist:mac
```

Linux:
```bash
npm run dist:linux
```

All platforms:
```bash
npm run dist
```

Output will be in `dist/` directory.

## Project Structure

```
desktop/
├── main.js           # Electron main process
├── package.json      # Dependencies & build config
├── assets/           # Icons and resources
└── build/            # Web build output (generated)
```

## Technologies

- Electron 33.x
- electron-builder (packaging)
- React frontend (from ../web)

## Login Credentials

Same as web and mobile:
- Admin: `admin` / `Test123!@#`
- Instructor: `instructor` / `Test123!@#`
- Student: `student` / `Test123!@#`
