'use client';

import { usePlayerStore } from '@/stores/playerStore';
import { getGenreGradient } from '@/lib/genre-colors';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer() {
  const { currentSong, isPlaying, progress, duration, toggle, seek, stop } = usePlayerStore();

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    seek(percent * duration);
  };

  const handleDownload = () => {
    if (!currentSong.audio_url) return;
    const byteString = atob(currentSong.audio_url.split(',')[1]);
    const mimeType = currentSong.audio_url.split(';')[0].split(':')[1];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSong.title || 'song'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 animate-slide-up">
      <div className="flex items-center gap-3 px-4 h-16 max-w-screen-2xl mx-auto">
        {/* Album art gradient */}
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGenreGradient(currentSong.genre)} flex items-center justify-center flex-shrink-0 ${isPlaying ? 'animate-pulse-slow' : ''}`}>
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>

        {/* Song info */}
        <div className="min-w-0 flex-shrink-0 w-32 md:w-48">
          <div className="text-sm text-white font-medium truncate">{currentSong.title}</div>
          <div className="text-xs text-gray-400 truncate capitalize">{currentSong.genre} - {currentSong.mood}</div>
        </div>

        {/* Play/Pause */}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center flex-shrink-0 transition-colors"
        >
          {isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">{formatTime(progress)}</span>
          <div
            className="flex-1 h-1.5 bg-gray-700 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative transition-all"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-xs text-gray-400 w-10 flex-shrink-0">{formatTime(duration)}</span>
        </div>

        {/* Download (desktop only) */}
        <button
          onClick={handleDownload}
          className="hidden md:flex p-2 text-gray-400 hover:text-white transition-colors"
          title="Download"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={stop}
          className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
