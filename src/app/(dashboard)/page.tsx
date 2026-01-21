'use client';

/**
 * Dashboard Home Page
 *
 * Overview page showing:
 * - Quick actions (create song, clone voice)
 * - Recent songs
 * - Stats
 */

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Creator'}! 👋
        </h1>
        <p className="text-gray-400">
          Ready to create your next hit? Let&apos;s make some music!
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/30 hover:border-purple-500/50 transition-colors cursor-pointer">
          <Link href="/dashboard/create">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <CardTitle className="text-white">Create New Song</CardTitle>
              <CardDescription className="text-gray-400">
                Generate a new AI song with your voice
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500/50 transition-colors cursor-pointer">
          <Link href="/dashboard/voices">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <CardTitle className="text-white">Clone Your Voice</CardTitle>
              <CardDescription className="text-gray-400">
                Upload a voice sample to create your AI voice
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50 transition-colors cursor-pointer">
          <Link href="/dashboard/songs">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <CardTitle className="text-white">My Songs</CardTitle>
              <CardDescription className="text-gray-400">
                View and manage your created songs
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-sm text-gray-400 mb-1">Credits</div>
            <div className="text-3xl font-bold text-white">
              {session?.user?.creditsBalance ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-sm text-gray-400 mb-1">Songs Created</div>
            <div className="text-3xl font-bold text-white">0</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-sm text-gray-400 mb-1">Voice Profiles</div>
            <div className="text-3xl font-bold text-white">0</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-sm text-gray-400 mb-1">Total Plays</div>
            <div className="text-3xl font-bold text-white">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Songs (empty state) */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Songs</CardTitle>
          <CardDescription className="text-gray-400">
            Your latest creations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
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
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-80" />
    </div>
  );
}
