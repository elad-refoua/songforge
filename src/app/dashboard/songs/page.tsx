'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SongsPage() {
  // TODO: Fetch user's songs from database
  const songs: any[] = [];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Songs will be rendered here */}
        </div>
      )}
    </div>
  );
}
