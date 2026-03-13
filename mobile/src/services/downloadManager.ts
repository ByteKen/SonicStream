/**
 * DownloadManager — handles downloading audio files from the proxy endpoint.
 *
 * Uses react-native-fs to download to the app's private documents directory.
 * Exposes an EventEmitter-style callback for progress updates.
 */

import RNFS from 'react-native-fs';
import { getAudioProxyUrl } from './api';
import {
  saveDownload,
  removeDownload,
  getDownload,
  DownloadedTrack,
} from './downloadStore';

// ── Types ───────────────────────────────────────────
export type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'error';

export interface DownloadProgress {
  videoId: string;
  status: DownloadStatus;
  progress: number; // 0–1
  bytesWritten: number;
  totalBytes: number;
}

type ProgressCallback = (progress: DownloadProgress) => void;

// ── State ───────────────────────────────────────────
const _activeDownloads = new Map<string, { jobId: number }>();
const _listeners = new Set<ProgressCallback>();

export function addProgressListener(cb: ProgressCallback): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function emit(p: DownloadProgress) {
  _listeners.forEach((cb) => cb(p));
}

// ── Downloads dir ───────────────────────────────────
const DOWNLOADS_DIR = `${RNFS.DocumentDirectoryPath}/audio`;

async function ensureDir(): Promise<void> {
  const exists = await RNFS.exists(DOWNLOADS_DIR);
  if (!exists) {
    await RNFS.mkdir(DOWNLOADS_DIR);
  }
}

function filePath(videoId: string): string {
  return `${DOWNLOADS_DIR}/${videoId}.m4a`;
}

// ── Public API ──────────────────────────────────────

/**
 * Start downloading a track. Resolves when complete.
 */
export async function startDownload(track: {
  videoId: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
}): Promise<void> {
  if (_activeDownloads.has(track.videoId)) {
    return; // Already downloading
  }

  await ensureDir();

  const dest = filePath(track.videoId);
  const url = getAudioProxyUrl(track.videoId);

  emit({
    videoId: track.videoId,
    status: 'downloading',
    progress: 0,
    bytesWritten: 0,
    totalBytes: 0,
  });

  const { jobId, promise } = RNFS.downloadFile({
    fromUrl: url,
    toFile: dest,
    background: true,
    discretionary: false,
    cacheable: false,
    progressInterval: 300,
    progressDivider: 1,
    begin: (res: any) => {
      emit({
        videoId: track.videoId,
        status: 'downloading',
        progress: 0,
        bytesWritten: 0,
        totalBytes: res.contentLength,
      });
    },
    progress: (res: any) => {
      const pct = res.contentLength > 0 ? res.bytesWritten / res.contentLength : 0;
      emit({
        videoId: track.videoId,
        status: 'downloading',
        progress: pct,
        bytesWritten: res.bytesWritten,
        totalBytes: res.contentLength,
      });
    },
  });

  _activeDownloads.set(track.videoId, { jobId });

  try {
    const result = await promise;

    if (result.statusCode === 200 || result.statusCode === 206) {
      const stat = await RNFS.stat(dest);
      const dlTrack: DownloadedTrack = {
        videoId: track.videoId,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        duration: track.duration,
        filePath: dest,
        fileSize: Number(stat.size),
        downloadedAt: new Date().toISOString(),
      };
      saveDownload(dlTrack);
      emit({
        videoId: track.videoId,
        status: 'completed',
        progress: 1,
        bytesWritten: Number(stat.size),
        totalBytes: Number(stat.size),
      });
    } else {
      throw new Error(`Download returned status ${result.statusCode}`);
    }
  } catch (err) {
    emit({
      videoId: track.videoId,
      status: 'error',
      progress: 0,
      bytesWritten: 0,
      totalBytes: 0,
    });
    // Clean up partial file
    try {
      await RNFS.unlink(dest);
    } catch {}
    throw err;
  } finally {
    _activeDownloads.delete(track.videoId);
  }
}

/**
 * Cancel an active download.
 */
export function cancelDownload(videoId: string): void {
  const dl = _activeDownloads.get(videoId);
  if (dl) {
    RNFS.stopDownload(dl.jobId);
    _activeDownloads.delete(videoId);
  }
}

/**
 * Delete a downloaded track (file + metadata).
 */
export async function deleteDownload(videoId: string): Promise<void> {
  const dl = getDownload(videoId);
  if (dl) {
    try {
      await RNFS.unlink(dl.filePath);
    } catch {}
    removeDownload(videoId);
  }
}

/**
 * Check if a track is actively downloading.
 */
export function isActivelyDownloading(videoId: string): boolean {
  return _activeDownloads.has(videoId);
}

/**
 * Get the local file URI for playback (file:// protocol).
 */
export function getLocalFileUri(videoId: string): string | null {
  const dl = getDownload(videoId);
  return dl ? `file://${dl.filePath}` : null;
}
