'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayerStore } from '@/stores/playerStore';
import { getGenreGradient } from '@/lib/genre-colors';

interface RecentSong {
  id: string;
  title: string;
  genre: string;
  mood: string;
  status: string;
  audio_url: string | null;
  created_at: string;
}

interface UserStats {
  songsCount: number;
  completedCount: number;
  recentSongs: RecentSong[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const { currentSong, isPlaying, play, toggle } = usePlayerStore();

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/stats')
        .then(r => r.ok ? r.json() : null)
        .then(data => data && setStats(data))
        .catch(() => {});
    }
  }, [session]);

  const handlePlay = (song: RecentSong) => {
    if (!song.audio_url) return;
    if (currentSong?.id === song.id) {
      toggle();
    } else {
      play({ id: song.id, title: song.title, genre: song.genre, mood: song.mood, audio_url: song.audio_url });
    }
  };

  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'Creator';

  return (
    <div className="p-4 md:p-8">
      {/* Greeting */}
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
        Hey, {firstName}
      </h1>

      {/* Hero CTA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-cyan-600/20 border border-purple-500/20 rounded-2xl p-6 md:p-10 mb-8">
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            Ready to create?
          </h2>
          <p className="text-gray-300 mb-6 text-sm md:text-base">
            Describe your song and we'll do the rest.
          </p>
          <Link href="/dashboard/create">
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3 text-base font-medium shadow-lg shadow-purple-500/20">
              Create New Song
            </Button>
          </Link>
        </div>
        {/* Decorative floating notes */}
        <div className="absolute top-4 right-6 text-4xl opacity-20 animate-float">🎵</div>
        <div className="absolute bottom-4 right-20 text-3xl opacity-15 animate-float-delayed">🎶</div>
      </div>

      {/* Stats - 2 key numbers */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-5">
          <div className="text-sm text-gray-400 mb-1">Songs created</div>
          <div className="text-3xl font-bold text-white">
            {stats?.songsCount ?? 0}
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-5">
          <div className="text-sm text-gray-400 mb-1">Credits left</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {session?.user?.creditsBalance ?? 0}
          </div>
        </div>
      </div>

      {/* Recent Songs - horizontal scroll */}
      {stats?.recentSongs && stats.recentSongs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Songs</h2>
            <Link href="/dashboard/songs" className="text-sm text-purple-400 hover:text-purple-300">
              View all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            {stats.recentSongs.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              const isThisPlaying = isCurrent && isPlaying;
              const isCompleted = song.status === 'completed' && song.audio_url;

              return (
                <button
                  key={song.id}
                  onClick={() => handlePlay(song)}
                  disabled={!isCompleted}
                  className={`flex-shrink-0 w-36 md:w-40 group text-left transition-all ${
                    isCompleted ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default opacity-70'
                  }`}
                >
                  <div className={`w-36 h-36 md:w-40 md:h-40 rounded-xl bg-gradient-to-br ${
                    song.status === 'failed' ? 'from-gray-600 to-gray-700' : getGenreGradient(song.genre)
                  } flex items-center justify-center mb-2 relative overflow-hidden ${
                    isThisPlaying ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' : ''
                  }`}>
                    {isCompleted && (
                      <div className={`absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors`}>
                        {isThisPlaying ? (
                          <svg className="w-8 h-8 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </div>
                    )}
                    {!isCompleted && (
                      <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    )}
                  </div>
                  <div className="px-0.5">
                    <div className="text-white text-sm font-medium truncate">{song.title || 'Untitled'}</div>
                    <div className="text-gray-500 text-xs capitalize">{song.genre}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for new users */}
      {(!stats?.recentSongs || stats.recentSongs.length === 0) && !stats?.songsCount && (
        <div className="text-center py-10">
          <p className="text-gray-400 text-sm">
            Your songs will appear here after you create them.
          </p>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8">
      <Skeleton className="h-8 w-40 mb-6" />
      <Skeleton className="h-44 w-full rounded-2xl mb-8" />
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="flex gap-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="w-40 h-52 rounded-xl flex-shrink-0" />)}
      </div>
    </div>
  );
}
