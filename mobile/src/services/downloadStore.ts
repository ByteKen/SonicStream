/**
 * Download metadata store — MMKV-backed for instant reads.
 *
 * Stores downloadedTrack entries keyed by videoId.
 */

import { storage } from './storage';

export interface DownloadedTrack {
  videoId: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
  filePath: string;
  fileSize: number;
  downloadedAt: string; // ISO date
}

const DOWNLOADS_KEY = 'downloads.tracks';

function readAll(): Record<string, DownloadedTrack> {
  const raw = storage.getString(DOWNLOADS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, DownloadedTrack>): void {
  storage.set(DOWNLOADS_KEY, JSON.stringify(data));
}

/**
 * Get all downloaded tracks as an array, newest first.
 */
export function getAllDownloads(): DownloadedTrack[] {
  const map = readAll();
  return Object.values(map).sort(
    (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime(),
  );
}

/**
 * Get a single download by videoId, or undefined.
 */
export function getDownload(videoId: string): DownloadedTrack | undefined {
  return readAll()[videoId];
}

/**
 * Check if a track is downloaded.
 */
export function isDownloaded(videoId: string): boolean {
  return videoId in readAll();
}

/**
 * Save a completed download's metadata.
 */
export function saveDownload(track: DownloadedTrack): void {
  const map = readAll();
  map[track.videoId] = track;
  writeAll(map);
}

/**
 * Remove a download's metadata.
 */
export function removeDownload(videoId: string): void {
  const map = readAll();
  delete map[videoId];
  writeAll(map);
}

/**
 * Get total download count.
 */
export function getDownloadCount(): number {
  return Object.keys(readAll()).length;
}
