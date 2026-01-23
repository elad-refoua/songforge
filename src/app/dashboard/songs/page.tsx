'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Song {
  id: string;
  title: string;
  lyrics: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  audio_url: string | null;
  genre: string;
  mood: string;
  language: string;
  duration_seconds: number | null;
  created_at: string;
}

export default function SongsPage() {
  const searchParams = useSearchParams();
  const newSongId = searchParams.get('new');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    if (playingId === song.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(song.audio_url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(song.id);
  };

  const getStatusBadge = (status: Song['status']) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">Completed</span>;
      case 'generating':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">Generating...</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">Failed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400">Pending</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading songs...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Songs</h1>
          <p className="text-gray-400">
            All your AI-generated songs in one place
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button className="bg-purple-500 hover:bg-purple-600">
            Create New Song
          </Button>
        </Link>
      </div>

      {songs.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No songs yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first AI-generated song in minutes!
              </p>
              <Link href="/dashboard/create">
                <Button className="bg-purple-500 hover:bg-purple-600">
                  Create Your First Song
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {songs.map((song) => (
            <Card
              key={song.id}
              className={`bg-gray-900 border-gray-800 transition-all ${
                newSongId === song.id ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {/* Play button */}
                  <button
                    onClick={() => handlePlay(song)}
                    disabled={song.status !== 'completed' || !song.audio_url}
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      song.status === 'completed' && song.audio_url
                        ? 'bg-purple-500 hover:bg-purple-600 cursor-pointer'
                        : 'bg-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {playingId === song.id ? (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Song info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{song.title}</h3>
                      {getStatusBadge(song.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="capitalize">{song.genre}</span>
                      <span className="text-gray-600">|</span>
                      <span className="capitalize">{song.mood}</span>
                      {song.duration_seconds && (
                        <>
                          <span className="text-gray-600">|</span>
                          <span>{Math.floor(song.duration_seconds / 60)}:{(song.duration_seconds % 60).toString().padStart(2, '0')}</span>
                        </>
                      )}
                      <span className="text-gray-600">|</span>
                      <span>{formatDate(song.created_at)}</span>
                    </div>
                  </div>

                  {/* Download button */}
                  {song.status === 'completed' && song.audio_url && (
                    <a
                      href={song.audio_url}
                      download={`${song.title}.mp3`}
                      className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                      title="Download"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  )}
                </div>

                {/* Lyrics preview */}
                {song.lyrics && (
                  <details className="mt-3">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-300">
                      Show lyrics
                    </summary>
                    <pre className="mt-2 text-sm text-gray-400 whitespace-pre-wrap bg-gray-800 rounded-lg p-3 max-h-48 overflow-auto">
                      {song.lyrics}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
