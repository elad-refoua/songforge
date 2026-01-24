'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/stores/playerStore';
import { getGenreGradient } from '@/lib/genre-colors';

interface Song {
  id: string;
  title: string;
  lyrics: string | null;
  status: 'pending' | 'generating_music' | 'converting_voice' | 'completed' | 'failed';
  audio_url: string | null;
  genre: string;
  mood: string;
  language: string;
  duration_seconds: number | null;
  created_at: string;
}

export default function SongsPage() {
  return (
    <Suspense fallback={<div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]"><div className="text-gray-400">Loading songs...</div></div>}>
      <SongsContent />
    </Suspense>
  );
}

function SongsContent() {
  const searchParams = useSearchParams();
  const newSongId = searchParams.get('new');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentSong, isPlaying, play, toggle } = usePlayerStore();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await fetch('/api/songs');
      const data = await res.json();
      if (res.ok) {
        setSongs(data.songs);
      }
    } catch (err) {
      console.error('Failed to fetch songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (song: Song) => {
    if (!song.audio_url) return;
    if (currentSong?.id === song.id) {
      toggle();
    } else {
      play({ id: song.id, title: song.title, genre: song.genre, mood: song.mood, audio_url: song.audio_url });
    }
  };

  const handleDownload = (song: Song) => {
    if (!song.audio_url) return;
    const byteString = atob(song.audio_url.split(',')[1]);
    const mimeType = song.audio_url.split(';')[0].split(':')[1];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title || 'song'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading songs...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">My Songs</h1>
        <Link href="/dashboard/create">
          <Button className="bg-purple-500 hover:bg-purple-600">
            Create New Song
          </Button>
        </Link>
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No songs yet</h3>
          <p className="text-gray-400 mb-6 text-center">Create your first song - it only takes a minute!</p>
          <Link href="/dashboard/create">
            <Button className="bg-purple-500 hover:bg-purple-600 px-8">
              Create Your First Song
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {songs.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            const isThisPlaying = isCurrent && isPlaying;
            const isCompleted = song.status === 'completed' && song.audio_url;
            const isFailed = song.status === 'failed';

            return (
              <div
                key={song.id}
                className={`group bg-gray-900 border border-gray-800 rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-all hover:bg-gray-800/50 ${
                  newSongId === song.id ? 'ring-2 ring-purple-500' : ''
                } ${isCurrent ? 'bg-gray-800/50 border-purple-500/30' : ''}`}
              >
                {/* Album art gradient */}
                <button
                  onClick={() => handlePlay(song)}
                  disabled={!isCompleted}
                  className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${
                    isFailed ? 'from-gray-600 to-gray-700' : getGenreGradient(song.genre)
                  } flex items-center justify-center flex-shrink-0 transition-all ${
                    isCompleted ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-default'
                  } ${isThisPlaying ? 'animate-pulse-slow shadow-lg shadow-purple-500/20' : ''}`}
                >
                  {isCompleted ? (
                    <div className={`absolute inset-0 rounded-xl flex items-center justify-center bg-black/0 ${isCompleted ? 'group-hover:bg-black/20' : ''} transition-colors`}>
                      {isThisPlaying ? (
                        <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  )}
                </button>

                {/* Song info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate text-sm md:text-base">{song.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 capitalize">{song.genre}</span>
                    <span className="text-gray-600 text-xs">-</span>
                    <span className="text-xs text-gray-400 capitalize">{song.mood}</span>
                    {song.duration_seconds && (
                      <>
                        <span className="text-gray-600 text-xs">-</span>
                        <span className="text-xs text-gray-400">{Math.floor(song.duration_seconds / 60)}:{(song.duration_seconds % 60).toString().padStart(2, '0')}</span>
                      </>
                    )}
                  </div>
                  {/* Status for non-completed songs */}
                  {song.status !== 'completed' && (
                    <div className="mt-1">
                      {song.status === 'generating_music' && (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating...
                        </span>
                      )}
                      {song.status === 'converting_voice' && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Adding your voice...
                        </span>
                      )}
                      {song.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Failed
                        </span>
                      )}
                      {song.status === 'pending' && (
                        <span className="text-xs text-gray-500">Pending...</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Date (desktop) */}
                <span className="hidden md:block text-xs text-gray-500 flex-shrink-0">{formatDate(song.created_at)}</span>

                {/* Download button */}
                {isCompleted && (
                  <button
                    onClick={() => handleDownload(song)}
                    className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0"
                    title="Download"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
