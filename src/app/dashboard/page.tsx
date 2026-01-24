'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface UserStats {
  songsCount: number;
  completedCount: number;
  recentSongs: Array<{
    id: string;
    title: string;
    genre: string;
    status: string;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/stats')
        .then(r => r.ok ? r.json() : null)
        .then(data => data && setStats(data))
        .catch(() => {});
    }
  }, [session]);

  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 md:p-8">
      {/* Welcome Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-white">Welcome back, </span>
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {session?.user?.name?.split(' ')[0] || 'Creator'}
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Ready to create your next hit?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <Link href="/dashboard/create" className="group">
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-gray-800 hover:border-purple-500/50 transition-all hover:-translate-y-1 h-full">
            <CardHeader>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <CardTitle className="text-white text-xl">Create New Song</CardTitle>
              <CardDescription className="text-gray-400">
                Generate a new AI song with lyrics, genre, and mood
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/voices" className="group">
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-gray-800 hover:border-blue-500/50 transition-all hover:-translate-y-1 h-full">
            <CardHeader>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <CardTitle className="text-white text-xl">Clone Your Voice</CardTitle>
              <CardDescription className="text-gray-400">
                Upload a sample to create your AI voice clone
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/songs" className="group">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-gray-800 hover:border-green-500/50 transition-all hover:-translate-y-1 h-full">
            <CardHeader>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <CardTitle className="text-white text-xl">My Songs</CardTitle>
              <CardDescription className="text-gray-400">
                View and manage your created songs
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-5">
            <div className="text-sm text-gray-400 mb-1">Credits</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {session?.user?.creditsBalance ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-5">
            <div className="text-sm text-gray-400 mb-1">Songs</div>
            <div className="text-3xl font-bold text-white">
              {stats?.songsCount ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-5">
            <div className="text-sm text-gray-400 mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-400">
              {stats?.completedCount ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-5">
            <div className="text-sm text-gray-400 mb-1">Voice Profiles</div>
            <div className="text-3xl font-bold text-white">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Songs */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Songs</CardTitle>
          <CardDescription className="text-gray-400">
            Your latest creations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentSongs && stats.recentSongs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSongs.map(song => (
                <div key={song.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{song.title || 'Untitled'}</div>
                      <div className="text-gray-500 text-xs capitalize">{song.genre}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      song.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      song.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {song.status}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(song.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No songs yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first AI-generated song in minutes!
              </p>
              <Link href="/dashboard/create">
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                  Create Your First Song
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-10">
        <Skeleton className="h-10 w-72 mb-2" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-44" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
