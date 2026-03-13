# SonicStream — Spotify Clone

A full-stack mobile music streaming app built for learning purposes. Pulls audio from YouTube via a Python backend, supports background playback, and includes offline downloads.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Native App                   │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Search    │  │  Player  │  │    Downloads     │  │
│  │  Screen    │  │  Engine  │  │    (RNFS+MMKV)   │  │
│  └─────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│        │              │                  │            │
│        └──────────────┼──────────────────┘            │
│                       │                               │
└───────────────────────┼───────────────────────────────┘
                        │ HTTP
┌───────────────────────┼───────────────────────────────┐
│                 FastAPI Backend                        │
│  ┌──────────┐  ┌──────┴─────┐  ┌──────────────────┐  │
│  │ /search  │  │  /audio/   │  │    /stream       │  │
│  │ ytmusic  │  │  proxy     │  │    yt-dlp        │  │
│  └────┬─────┘  └──────┬─────┘  └───────┬──────────┘  │
│       │               │                │              │
└───────┼───────────────┼────────────────┼──────────────┘
        │               │                │
   ┌────▼────┐   ┌──────▼──────┐  ┌──────▼──────┐
   │ YouTube │   │   YouTube   │  │  Supabase   │
   │ Music   │   │   Streams   │  │  Postgres   │
   │ API     │   │             │  │  + Auth     │
   └─────────┘   └─────────────┘  └─────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React Native (Android) | iOS-aesthetic UI with glassmorphism |
| Navigation | React Navigation 7 | Bottom tabs + modal NowPlaying |
| Audio | react-native-track-player | Background playback, lock-screen controls |
| Local Storage | MMKV v4 | Auth tokens, download metadata |
| File System | react-native-fs | Offline audio file storage |
| Backend | Python FastAPI | API gateway, audio proxy |
| Search | ytmusicapi | YouTube Music track search |
| Extraction | yt-dlp | Audio stream URL resolution |
| Database | Supabase Postgres | Auth, search cache, stream logging |

## Getting Started

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- Android Studio with SDK 34+
- An Android emulator or physical device

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials (optional)

uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Mobile Setup

```bash
cd mobile
npm install

# Start Metro bundler
npx react-native start

# In another terminal — build and run on Android
npx react-native run-android
```

### Supabase Setup (Optional)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `backend/migrations/001_initial_schema.sql` in the SQL Editor
3. Enable **Email/Password** auth in Authentication → Providers
4. Copy your project URL and anon key to:
   - `backend/.env` → `SUPABASE_URL`, `SUPABASE_ANON_KEY`
   - `mobile/src/services/supabase.ts` → `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Environment config
│   │   ├── routers/
│   │   │   ├── search.py        # GET /search
│   │   │   ├── stream.py        # GET /stream
│   │   │   └── audio.py         # GET /audio/{id} (proxy)
│   │   ├── schemas/             # Pydantic models
│   │   └── services/
│   │       ├── ytmusic.py       # YouTube Music search
│   │       ├── stream.py        # yt-dlp extraction
│   │       ├── supabase_client.py
│   │       ├── auth.py          # JWT validation
│   │       ├── cache.py         # Search cache
│   │       └── stream_logger.py # Analytics logging
│   ├── migrations/              # SQL schemas
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── mobile/
    ├── App.tsx                  # Root component
    ├── index.js                 # Entry + PlaybackService registration
    └── src/
        ├── theme/               # Design system tokens
        ├── components/
        │   ├── GlassCard.tsx    # Glassmorphism container
        │   ├── AppText.tsx      # Themed typography
        │   ├── IconButton.tsx   # Rounded icon touchable
        │   ├── MiniPlayer.tsx   # Persistent player bar
        │   ├── OfflineBanner.tsx # Connectivity indicator
        │   └── ErrorBoundary.tsx # Crash recovery
        ├── contexts/
        │   └── AuthContext.tsx   # Supabase auth state
        ├── hooks/
        │   ├── usePlayer.ts     # Playback controls
        │   ├── useDownloads.ts  # Download state
        │   └── useNetwork.ts    # Connectivity check
        ├── screens/
        │   ├── auth/            # Login, Register
        │   └── main/            # Home, Search, Library, NowPlaying
        ├── services/
        │   ├── api.ts           # Axios + JWT interceptor
        │   ├── supabase.ts      # Supabase JS client
        │   ├── storage.ts       # MMKV singleton
        │   ├── trackplayer.ts   # Background audio service
        │   ├── downloadStore.ts # MMKV download metadata
        │   └── downloadManager.ts # File download engine
        └── navigation/
            └── AppNavigator.tsx # Auth gate + tab navigation
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/search?q=<query>&limit=20` | Search YouTube Music |
| GET | `/stream?videoId=<id>` | Get stream URL + metadata |
| GET | `/audio/<videoId>` | Proxy audio bytes (Range supported) |

## Key Features

- 🔍 **Search** — YouTube Music via ytmusicapi
- 🎵 **Streaming** — Proxied audio with seek support
- 🔒 **Auth** — Supabase email/password (optional)
- 🎧 **Background Playback** — Lock-screen notification controls
- 📥 **Offline Downloads** — Save tracks to device storage
- 🌙 **Dark Theme** — iOS-aesthetic glassmorphism design
- ☁️ **Offline Detection** — Auto-switches to downloaded music

## License

This project is for **educational purposes only**. Do not use for commercial distribution.
