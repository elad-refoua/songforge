'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AdminSong {
  id: string;
  title: string | null;
  userEmail: string;
  userName: string | null;
  status: string;
  genre: string | null;
  mood: string | null;
  language: string | null;
  durationSeconds: number | null;
  costCredits: number | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400',
  generating: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
  pending: 'bg-gray-500/20 text-gray-400',
};

export default function AdminSongsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [songs, setSongs] = useState<AdminSong[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && !session.user.isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchSongs();
  }, [session, router, page, statusFilter]);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/songs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSongs(data.songs);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">All Songs</h1>
          <p className="text-gray-400">{total} total songs</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/admin')}
          className="border-gray-700 text-gray-300"
        >
          Back to Admin
        </Button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2">
        {['', 'completed', 'generating', 'failed'].map((s) => (
          <Button
            key={s || 'all'}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={statusFilter === s
              ? 'bg-purple-500 hover:bg-purple-600'
              : 'border-gray-700 text-gray-300 hover:bg-gray-800'
            }
          >
            {s || 'All'}
          </Button>
        ))}
      </div>

      {/* Songs Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Title</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">User</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Status</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Genre</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Duration</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Credits</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : songs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">No songs found</td>
                  </tr>
                ) : (
                  songs.map((song) => (
                    <tr key={song.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                      <td className="p-4 text-white text-sm">{song.title || 'Untitled'}</td>
                      <td className="p-4">
                        <div>
                          <span className="text-gray-300 text-sm">{song.userName || '-'}</span>
                          <br />
                          <span className="text-gray-500 text-xs">{song.userEmail}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[song.status] || statusColors.pending}`}>
                          {song.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300 text-sm capitalize">{song.genre || '-'}</td>
                      <td className="p-4 text-gray-400 text-sm">
                        {song.durationSeconds ? `${Math.round(song.durationSeconds)}s` : '-'}
                      </td>
                      <td className="p-4 text-purple-400 text-sm">{song.costCredits ?? 1}</td>
                      <td className="p-4 text-gray-400 text-xs">
                        {new Date(song.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="border-gray-700 text-gray-300"
          >
            Previous
          </Button>
          <span className="text-gray-400 text-sm flex items-center px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="border-gray-700 text-gray-300"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
