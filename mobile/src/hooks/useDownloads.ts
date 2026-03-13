/**
 * useDownloads — hook for download state and actions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  startDownload,
  cancelDownload,
  deleteDownload,
  addProgressListener,
  DownloadProgress,
} from '../services/downloadManager';
import {
  getAllDownloads,
  isDownloaded,
  DownloadedTrack,
} from '../services/downloadStore';
import { Track } from '../services/api';

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadedTrack[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<
    Map<string, DownloadProgress>
  >(new Map());

  // Load downloads on mount
  useEffect(() => {
    setDownloads(getAllDownloads());
  }, []);

  // Listen for progress updates
  useEffect(() => {
    const unsub = addProgressListener((progress) => {
      setActiveDownloads((prev) => {
        const next = new Map(prev);
        if (progress.status === 'completed' || progress.status === 'error') {
          next.delete(progress.videoId);
          // Refresh downloads list on completion
          if (progress.status === 'completed') {
            setDownloads(getAllDownloads());
          }
        } else {
          next.set(progress.videoId, progress);
        }
        return next;
      });
    });
    return unsub;
  }, []);

  const download = useCallback(async (track: Track) => {
    try {
      await startDownload({
        videoId: track.video_id,
        title: track.title,
        artist: track.artists.map((a) => a.name).join(', '),
        artwork: track.thumbnail?.url,
        duration: track.duration_seconds,
      });
    } catch (err) {
      console.warn('Download failed:', err);
    }
  }, []);

  const cancel = useCallback((videoId: string) => {
    cancelDownload(videoId);
  }, []);

  const remove = useCallback(async (videoId: string) => {
    await deleteDownload(videoId);
    setDownloads(getAllDownloads());
  }, []);

  const checkDownloaded = useCallback((videoId: string): boolean => {
    return isDownloaded(videoId);
  }, []);

  const getProgress = useCallback(
    (videoId: string): DownloadProgress | undefined => {
      return activeDownloads.get(videoId);
    },
    [activeDownloads],
  );

  return {
    downloads,
    activeDownloads,
    download,
    cancel,
    remove,
    checkDownloaded,
    getProgress,
  };
}
