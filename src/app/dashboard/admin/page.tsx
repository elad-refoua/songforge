'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  totalUsers: number;
  totalSongs: number;
  completedSongs: number;
  failedSongs: number;
  activeSongs: number;
  credits: {
    granted: number;
    used: number;
    remaining: number;
    byType: Record<string, { count: number; total: number }>;
  };
  recentTransactions: Array<{
    id: string;
    user_id: string;
    amount: number;
    balance_after: number;
    type: string;
    description: string;
    created_at: string;
  }>;
}

const typeLabels: Record<string, string> = {
  bonus: 'Bonus / Welcome',
  subscription_grant: 'Subscription',
  purchase: 'Purchase',
  usage: 'Song Generation',
  song_generation: 'Song Generation',
  refund: 'Refund',
  expiry: 'Expiry / Removed',
};

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && !session.user.isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchStats();
  }, [session, router]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-gray-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-gray-400">System overview and management</p>
      </div>

      {/* Stats Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-gray-400 text-sm mb-1">Total Users</div>
            <div className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-gray-400 text-sm mb-1">Total Songs</div>
            <div className="text-3xl font-bold text-white">{stats?.totalSongs || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats?.completedSongs || 0} completed, {stats?.failedSongs || 0} failed
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-gray-400 text-sm mb-1">Active Generations</div>
            <div className="text-3xl font-bold text-purple-400">{stats?.activeSongs || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-gray-400 text-sm mb-1">Success Rate</div>
            <div className="text-3xl font-bold text-green-400">
              {stats?.totalSongs && stats.totalSongs > 0
                ? Math.round((stats.completedSongs / stats.totalSongs) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credits & Costs Section */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Credits & Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Credits Granted</div>
              <div className="text-2xl font-bold text-green-400">+{stats?.credits.granted || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Total given to users</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Credits Used</div>
              <div className="text-2xl font-bold text-red-400">-{stats?.credits.used || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Spent on song generation</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Credits Remaining</div>
              <div className="text-2xl font-bold text-blue-400">{stats?.credits.remaining || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Across all users</div>
            </div>
          </div>

          {/* Cost Estimation */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
            <div className="text-white font-medium mb-2">Estimated API Costs</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">ElevenLabs:</span>
                <span className="text-white ml-2">{stats?.credits.used || 0} songs</span>
              </div>
              <div>
                <span className="text-gray-400">Gemini (Lyrics):</span>
                <span className="text-white ml-2">~${((stats?.credits.used || 0) * 0.001).toFixed(3)}</span>
              </div>
              <div>
                <span className="text-gray-400">ElevenLabs Cost:</span>
                <span className="text-white ml-2">~${((stats?.credits.used || 0) * 0.05).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Est.:</span>
                <span className="text-yellow-400 font-medium ml-2">
                  ~${((stats?.credits.used || 0) * 0.051).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-gray-500 text-xs mt-2">
              * Estimates based on ~$0.05/song (ElevenLabs) + ~$0.001/request (Gemini). Actual costs may vary.
            </div>
          </div>

          {/* Transaction Type Breakdown */}
          {stats?.credits.byType && Object.keys(stats.credits.byType).length > 0 && (
            <div>
              <div className="text-gray-400 text-sm font-medium mb-3">Transaction Breakdown</div>
              <div className="space-y-2">
                {Object.entries(stats.credits.byType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${data.total >= 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-gray-300 text-sm">{typeLabels[type] || type}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${data.total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {data.total >= 0 ? '+' : ''}{data.total} credits
                      </span>
                      <span className="text-gray-500 text-xs ml-2">({data.count} transactions)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/dashboard/admin/users">
          <Card className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">View all users, manage credits, and monitor activity</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/songs">
          <Card className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                All Songs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">View all generated songs across all users</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/admin/prompts">
          <Card className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                System Prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Edit AI prompts for lyrics and song generation</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {stats.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <span className={`text-sm font-medium ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount} credits
                    </span>
                    <span className="text-gray-500 text-xs ml-2">({typeLabels[t.type] || t.type})</span>
                    {t.description && (
                      <p className="text-gray-400 text-xs mt-0.5">{t.description}</p>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
