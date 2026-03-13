/**
 * API service — communicates with the Python FastAPI backend.
 */

import axios, { AxiosInstance } from 'axios';
import { storage } from '../services/storage';

// Production backend on Render
const BASE_URL = 'https://sonicstream-kpji.onrender.com';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach Supabase JWT on every request ────────────
api.interceptors.request.use((config) => {
  const token = storage.getString('auth.accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Types ───────────────────────────────────────────
export interface TrackArtist {
  name: string;
  id?: string;
}

export interface TrackThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface Track {
  video_id: string;
  title: string;
  artists: TrackArtist[];
  album?: string;
  duration?: string;
  duration_seconds?: number;
  thumbnail?: TrackThumbnail;
  is_explicit: boolean;
}

export interface StreamInfo {
  video_id: string;
  title: string;
  url: string;
  codec?: string;
  quality?: string;
  filesize?: number;
  duration_seconds?: number;
  thumbnail?: string;
  expires_at?: string;
}

// ── API methods ─────────────────────────────────────
export async function searchTracks(query: string, limit = 20): Promise<Track[]> {
  const { data } = await api.get('/search', { params: { q: query, limit } });
  return data.results;
}

export async function getStreamUrl(videoId: string): Promise<StreamInfo> {
  const { data } = await api.get('/stream', { params: { videoId } });
  return data.stream;
}

/**
 * Returns the proxied audio URL for use in react-native-track-player.
 * This URL streams audio bytes directly from our backend.
 */
export function getAudioProxyUrl(videoId: string): string {
  return `${BASE_URL}/audio/${videoId}`;
}

export default api;
