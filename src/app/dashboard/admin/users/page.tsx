'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  creditsBalance: number;
  songCount: number;
  createdAt: string;
}

interface CreditDialogState {
  open: boolean;
  userId: string;
  userName: string;
  currentBalance: number;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creditDialog, setCreditDialog] = useState<CreditDialogState>({
    open: false, userId: '', userName: '', currentBalance: 0,
  });
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    if (session && !session.user.isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [session, router, page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustCredits = async () => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) return;
    if (!creditReason.trim()) return;

    setAdjusting(true);
    try {
      const res = await fetch(`/api/admin/users/${creditDialog.userId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description: creditReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to adjust credits');
        return;
      }
      setCreditDialog({ open: false, userId: '', userName: '', currentBalance: 0 });
      setCreditAmount('');
      setCreditReason('');
      fetchUsers();
    } catch (err) {
      console.error('Failed to adjust credits:', err);
    } finally {
      setAdjusting(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">{total} total users</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/admin')}
          className="border-gray-700 text-gray-300"
        >
          Back to Admin
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-gray-800 border-gray-700 text-white max-w-sm"
        />
      </div>

      {/* Users Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">User</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Email</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Credits</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Songs</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Registered</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || ''} />
                            <AvatarFallback className="bg-purple-500 text-xs">
                              {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm">{user.name || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300 text-sm">{user.email}</td>
                      <td className="p-4">
                        <span className="text-purple-400 font-medium">{user.creditsBalance}</span>
                      </td>
                      <td className="p-4 text-gray-300 text-sm">{user.songCount}</td>
                      <td className="p-4 text-gray-400 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCreditDialog({
                            open: true,
                            userId: user.id,
                            userName: user.name || user.email,
                            currentBalance: user.creditsBalance,
                          })}
                          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 text-xs"
                        >
                          Adjust Credits
                        </Button>
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

      {/* Credit Adjustment Dialog */}
      {creditDialog.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-gray-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">Adjust Credits</CardTitle>
              <p className="text-gray-400 text-sm">
                User: {creditDialog.userName}<br />
                Current balance: {creditDialog.currentBalance} credits
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Amount (positive to add, negative to remove)</label>
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="e.g. 10 or -5"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Reason</label>
                <Input
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="e.g. Promotional bonus"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCreditDialog({ open: false, userId: '', userName: '', currentBalance: 0 })}
                  className="border-gray-700 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjustCredits}
                  disabled={adjusting || !creditAmount || !creditReason.trim()}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {adjusting ? 'Adjusting...' : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
